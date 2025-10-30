document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // NAVIGAÇÃO ENTRE VIEWS (versão unificada)
  // =========================
  const views = Array.from(document.querySelectorAll('.view'));

  function normToSectionId(input) {
    // aceita "relatorio" ou "view-relatorio" e retorna SEMPRE "view-relatorio"
    if (!input) return null;
    return input.startsWith('view-') ? input : `view-${input}`;
  }
  function normToHash(input) {
    // hash SEM o prefixo "view-": "view-relatorio" -> "relatorio"
    return input.replace(/^view-/, '');
  }

  function activateView(viewKeyOrId) {
    const sectionId = normToSectionId(viewKeyOrId);
    if (!sectionId) return false;

    let found = false;

    // mostra/oculta views (ambos: .active e [hidden])
    views.forEach(v => {
      const isTarget = v.id === sectionId;
      v.classList.toggle('active', isTarget);
      if (isTarget) {
        v.removeAttribute('hidden');
        found = true;
      } else {
        v.setAttribute('hidden', '');
      }
    });

  // estado dos links (data-view / role="tab")
    document.querySelectorAll('[data-view], [role="tab"]').forEach(link => {
      const dv   = link.getAttribute('data-view') || '';
      const aria = link.getAttribute('aria-controls') || '';
      const href = (link.getAttribute('href') || '').replace('#', '');

      const match =
        normToSectionId(dv)   === sectionId ||
        normToSectionId(aria) === sectionId ||
        normToSectionId(href) === sectionId;

      link.classList.toggle('active', match);
      if (link.getAttribute('role') === 'tab') {
        link.setAttribute('aria-selected', String(match));
      }
    });

    // sincroniza hash no formato SEM "view-"
    if (found) history.replaceState(null, '', `#${normToHash(sectionId)}`);
    // notifica que uma view foi ativada (útil p/ componentes que precisam renderizar ao ficar visível)
    if (found) document.dispatchEvent(new CustomEvent('view:activated', { detail: sectionId }));
    // debug
    try { console.debug && console.debug('activateView ->', sectionId, 'found=', found); } catch (e) {}

    // Se a view estiver aninhada dentro de outras .view, garanta que os ancestrais também fiquem visíveis
    if (found) {
      const targetEl = document.getElementById(sectionId);
      let p = targetEl && targetEl.parentElement;
      while (p && p !== document.body) {
        if (p.classList && p.classList.contains('view')) {
          p.classList.add('active');
          p.removeAttribute('hidden');
        }
        p = p.parentElement;
      }
    }
    return found;
  }

  // delegação de clique (aceita data-view, aria-controls ou href="#...")
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-view], [role="tab"], a[href^="#"]');
    if (!link) return;

    const dv   = link.getAttribute('data-view');
    const aria = link.getAttribute('aria-controls');
    const href = (link.getAttribute('href') || '').replace('#', '');

    const target = normToSectionId(dv || aria || href);
    if (!target || !document.getElementById(target)) return;

    e.preventDefault();
    activateView(target);
  });

  // rota inicial / mudanças de hash
  function initialRoute() {
    const raw = (location.hash || '').replace('#', '');
    // aceita "#relatorio" ou "#view-relatorio"
    const target = normToSectionId(raw || 'relatorio'); // mude 'relatorio' se quiser outra default
    if (activateView(target)) return;

    // fallback se nada bateu: mantém a .active ou abre a primeira
    const current = document.querySelector('.view.active');
    if (!current && views[0]) activateView(views[0].id);
  }
  window.addEventListener('hashchange', initialRoute);
  initialRoute();

  // =========================
  // LOGOUT POPUP
  // =========================
  const logoutBtn = document.getElementById('logoutBtn');
  const popup = document.getElementById('logoutPopup');
  const confirmBtn = document.getElementById('confirmLogout');
  const cancelBtn = document.getElementById('cancelLogout');

  function closePopup() {
    popup?.classList.remove('active');
    document.body.style.overflow = '';
  }

  logoutBtn?.addEventListener('click', () => {
    if (!popup) return;
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  cancelBtn?.addEventListener('click', closePopup);
  popup?.addEventListener('click', (e) => { if (e.target === popup) closePopup(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popup?.classList.contains('active')) closePopup(); });
  confirmBtn?.addEventListener('click', () => {
    closePopup();
    setTimeout(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '../login.html';
    }, 200);
  });

  // =========================
  // UNIDADES (select do sidebar)
  // =========================
  window.APP_UNITS = [
    { id: 'golden', name: 'Golden Square Shopping' },
    { id: 'grand', name: 'Grand Plaza Shopping' },
    { id: 'west', name: 'Shopping West Plaza' },
    { id: 'mooca', name: 'Mooca Plaza Shopping' },
  ];

  const selUnit = document.getElementById('unitPicker');
  const curUnitEl = document.getElementById('currentUnitName');
  const atdUnitEl = document.getElementById('atdUnitName'); // título da view Atendimentos
  const LS_UNIT = 'rokuzen.currentUnit';

  function readUnits() {
    return (Array.isArray(window.APP_UNITS) ? window.APP_UNITS : []).map(u => ({
      id: String(u.id),
      name: String(u.name),
      city: String(u.city || ''),
      floor: String(u.floor || '')
    }));
  }
  let UNITS = readUnits();

  function getById(id) { return UNITS.find(u => u.id === id) || null; }
  function saveUnit(u) { try { localStorage.setItem(LS_UNIT, JSON.stringify(u)); } catch { } }
  function loadUnit() {
    try {
      const u = JSON.parse(localStorage.getItem(LS_UNIT) || 'null');
      return u && u.id ? u : null;
    } catch { return null; }
  }
  function setUnitName(name) {
    if (curUnitEl) curUnitEl.textContent = name || '—';
    if (atdUnitEl) atdUnitEl.textContent = name || '—';
  }
  function emitUnitChange(unit) {
    document.dispatchEvent(new CustomEvent('unit:change', { detail: unit }));
  }

  if (selUnit && curUnitEl) {
    // popular select
    selUnit.innerHTML = '';
    UNITS.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.city ? `${u.name} — ${u.city}` : u.name;
      selUnit.appendChild(opt);
    });

    // inicial
    const saved = loadUnit();
    const initial = saved && getById(saved.id) ? saved : (UNITS[0] || null);
    if (initial) {
      selUnit.value = initial.id;
      setUnitName(initial.name);
      emitUnitChange(initial);
    }

    // on change
    selUnit.addEventListener('change', () => {
      const u = getById(selUnit.value) || {
        id: selUnit.value,
        name: selUnit.options[selUnit.selectedIndex]?.text || '—'
      };
      setUnitName(u.name);
      saveUnit(u);
      emitUnitChange(u);
    });

    // se a lista global for atualizada em runtime
    document.addEventListener('unit:update-list', (ev) => {
      if (!Array.isArray(ev.detail) || !ev.detail.length) return;
      UNITS = ev.detail.map(u => ({ id: String(u.id), name: String(u.name) }));
      selUnit.innerHTML = '';
      UNITS.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id; opt.textContent = u.name;
        selUnit.appendChild(opt);
      });
      const current = loadUnit();
      const keep = current && getById(current.id);
      const next = keep ? current : UNITS[0] || null;
      if (next) {
        selUnit.value = next.id;
        setUnitName(next.name);
        saveUnit(next);
        emitUnitChange(next);
      }
    });
  }

  // =========================
  // MENU MOBILE (hambúrguer)
  // =========================
  (function () {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.getElementById('menuToggle');
    const backdrop = document.getElementById('menuBackdrop');
    if (!sidebar || !toggle || !backdrop) return;

    const open = () => {
      sidebar.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.setAttribute('aria-controls', 'sidebar');
    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', () => {
      sidebar.classList.contains('is-open') ? close() : open();
    });
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    // fechar ao clicar em item do menu no mobile
    document.querySelectorAll('.shortcut-item,[data-view]').forEach(el => {
      el.addEventListener('click', () => {
        if (window.matchMedia('(max-width:900px)').matches) close();
      });
    });

    // se redimensionar pra desktop, garante estado fechado e libera scroll
    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width:901px)').matches) close();
    });
  })();

  // ====== TABELA DE PREÇOS (CRUD + por unidade) ======
  (function () {
    // elementos
    const form = document.getElementById('priceForm');
    const nameEl = document.getElementById('svcNome');
    const durEl = document.getElementById('svcDur');
    const valEl = document.getElementById('svcPreco');
    const tbl = document.getElementById('tblPrecos')?.querySelector('tbody');
    const empty = document.getElementById('priceEmpty');
    const unitNameEl = document.getElementById('priceUnitName');

    if (!form || !tbl) return;

    // estado
    let currentUnit = null;        // {id, name}
    let editingId = null;          // id do item sendo editado

    const keyFor = (unitId) => `rokuzen.prices.${unitId || 'default'}`;

    // util: BRL
    const brl = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const mins = (m) => `${Number(m) || 0} min`;

    // storage helpers
    const load = () => {
      const raw = localStorage.getItem(keyFor(currentUnit?.id));
      try { return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []; } catch { return []; }
    };
    const save = (arr) => localStorage.setItem(keyFor(currentUnit?.id), JSON.stringify(arr));

    // seeds (só se vazio)
    const ensureSeeds = () => {
      const data = load();
      if (data.length) return;
      const seeds = [
        { id: crypto.randomUUID?.() || String(Date.now()) + 'a', nome: 'Quick Massage', dur: 15, preco: 38 },
        { id: crypto.randomUUID?.() || String(Date.now()) + 'b', nome: 'Reflexologia', dur: 30, preco: 100 },
      ];
      save(seeds);
    };

    // render
    const render = () => {
      if (!currentUnit) return;
      const items = load();
      tbl.innerHTML = '';
      if (!items.length) {
        empty.style.display = '';
        return;
      }
      empty.style.display = 'none';
      const frag = document.createDocumentFragment();
      items.forEach(it => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td data-label="Serviço">${it.nome}</td>
        <td data-label="Duração">${mins(it.dur)}</td>
        <td data-label="Preço">${brl(it.preco)}</td>
        <td data-actions>
          <button class="btn ghost btn-sm js-edit" data-id="${it.id}"><i class="fa-solid fa-pen"></i> Editar</button>
          <button class="btn ghost btn-sm js-del"  data-id="${it.id}"><i class="fa-solid fa-trash"></i> Remover</button>
        </td>`;
        frag.appendChild(tr);
      });
      tbl.appendChild(frag);
    };

    // form submit (add/update)
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentUnit) return;

      const nome = nameEl.value.trim();
      const dur = Number(durEl.value);
      const preco = Number(valEl.value);

      if (!nome || isNaN(dur) || isNaN(preco)) return;

      const items = load();

      if (editingId) {
        const i = items.findIndex(x => x.id === editingId);
        if (i >= 0) items[i] = { ...items[i], nome, dur, preco };
        editingId = null;
        document.getElementById('priceFormAction').textContent = 'Adicionar';
      } else {
        items.push({ id: crypto.randomUUID?.() || String(Date.now()), nome, dur, preco });
      }

      save(items);
      form.reset();
      render();
    });

    // ações: editar/remover
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.js-edit');
      const delBtn = e.target.closest('.js-del');
      if (!editBtn && !delBtn) return;

      const id = (editBtn || delBtn).dataset.id;
      const items = load();

      if (editBtn) {
        const it = items.find(x => x.id === id);
        if (!it) return;
        nameEl.value = it.nome;
        durEl.value = it.dur;
        valEl.value = it.preco;
        editingId = id;
        document.getElementById('priceFormAction').textContent = 'Salvar';
        nameEl.focus();
      }

      if (delBtn) {
        if (!confirm('Remover este serviço da tabela?')) return;
        const next = items.filter(x => x.id !== id);
        save(next);
        render();
      }
    });

    // integra com o seletor de unidade que você já tem
    document.addEventListener('unit:change', (ev) => {
      currentUnit = ev.detail || null;
      if (unitNameEl) unitNameEl.textContent = currentUnit?.name || '—';
      ensureSeeds();
      render();
    });

    // fallback caso a página abra nesta view sem disparar unit:change ainda
    // (usa a última unidade salva pelo seu seletor)
    try {
      const last = JSON.parse(localStorage.getItem('rokuzen.currentUnit') || 'null');
      if (last && last.id) {
        currentUnit = last;
        if (unitNameEl) unitNameEl.textContent = currentUnit?.name || '—';
        ensureSeeds();
        render();
      }
    } catch { }
  })();

  // ====== CLIENTES + ANIVERSÁRIOS ======
  (() => {
    const LS_KEY = 'rokuzen.clients';
    const form = document.getElementById('cliForm');
    const tb = document.querySelector('#tblClientes tbody');
    const empty = document.getElementById('cliEmpty');
    const bdayBar = document.getElementById('bdayBar');
    const bdayMsg = document.getElementById('bdayMsg');
    const btnNotifyAll = document.getElementById('bdayNotifyAll');

    let editingId = null;
    let clients = load() || seed();

    function seed() {
      // exemplo inicial (pode remover)
      const demo = [
        { id: uid(), nome: 'Camila Souza', fone: '11988887777', email: '', niver: '1996-10-10' },
        { id: uid(), nome: 'Cristiane Lopes', fone: '11999990000', email: '', niver: '1995-10-21' },
      ];
      save(demo); return demo;
    }

    function uid() { return Math.random().toString(36).slice(2, 9); }
    function save(arr) { try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch { } }
    function load() { try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; } }

    function fmtDate(d) { // YYYY-MM-DD -> dd/mm
      if (!d) return '—';
      const [y, m, day] = d.split('-');
      return `${day}/${m}`;
    }
    function ageOn(dateStr) {
      const d = new Date(dateStr);
      if (Number.isNaN(d)) return null;
      const now = new Date();
      let age = now.getFullYear() - d.getFullYear();
      const hasHad = (now.getMonth() > d.getMonth()) || (now.getMonth() === d.getMonth() && now.getDate() >= d.getDate());
      return hasHad ? age : age - 1;
    }
    function isToday(dateStr) {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }

    function render() {
      tb.innerHTML = '';

      if (!clients || clients.length === 0) {
        empty.hidden = false;
        bdayBar.hidden = true;
        return;
      }

      empty.hidden = true;

      clients
        .slice()
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .forEach(c => {
          const tr = document.createElement('tr');
          if (isToday(c.niver)) tr.classList.add('tr-bday-today');

          const tdNome = cell(c.nome, 'Nome');
          const tdFone = cell(c.fone, 'Celular');
          const tdEmail = cell(c.email || '—', 'E-mail');

          const extra = document.createElement('div');
          const a = ageOn(c.niver);
          if (a !== null) extra.innerHTML = `<span class="badge-age">${a} anos</span>`;
          const tdNiver = cell(`${fmtDate(c.niver)} ${extra.innerHTML}`, 'Aniversário');

          const tdActions = document.createElement('td');
          tdActions.setAttribute('data-actions', '');
          tdActions.append(
            btn('Editar', 'fa-regular fa-pen-to-square', () => startEdit(c.id)),
            btn('Remover', 'fa-regular fa-trash-can', () => remove(c.id))
          );

          tr.append(tdNome, tdFone, tdEmail, tdNiver, tdActions);
          tb.appendChild(tr);
        });

      // Atualiza barra de aniversariantes
      updateBirthdayBar();
    }

    // ===== Modal: cadastro rápido de cliente (sheet/dialog)
    const cliModal = document.getElementById('cliModal');
    const cliOpenBtn = document.getElementById('cliOpenCadastro');
    const cliCloseBtn = document.getElementById('cliClose');
    const cliCancelBtn = document.getElementById('cliCancel');
    const cliFormCad = document.getElementById('cliFormCad');

    function openCliModal() {
      if (!cliModal) return;
      try { cliModal.showModal?.(); } catch { cliModal.classList.add('open'); }
    }
    function closeCliModal() {
      if (!cliModal) return;
      try { cliModal.close?.(); } catch { cliModal.classList.remove('open'); }
    }

    cliOpenBtn?.addEventListener('click', (e) => { e.preventDefault(); openCliModal(); });
    cliCloseBtn?.addEventListener('click', closeCliModal);
    cliCancelBtn?.addEventListener('click', (e) => { e.preventDefault(); closeCliModal(); });

    // submit do formulário de cadastro rápido
    cliFormCad?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!cliFormCad) return;
      const nome = (document.getElementById('fCliNome')?.value || '').trim();
      const fone = (document.getElementById('fCliFone')?.value || '').trim();
      const email = (document.getElementById('fCliEmail')?.value || '').trim();
      const niver = (document.getElementById('fCliNiver')?.value || '').trim();
      if (!nome || !fone || !niver) { alert('Preencha Nome, Telefone e Data de Nascimento.'); return; }

      const novo = {
        id: uid(),
        nome,
        fone: fone.replace(/\D/g,''),
        email,
        niver,
        sexo: document.getElementById('fCliSexo')?.value || '',
        necessidades: document.getElementById('fCliNec')?.value || '',
        obs: document.getElementById('fCliObs')?.value || '',
        origem: document.getElementById('fCliOrigem')?.value || '',
        origemOutros: document.getElementById('fCliOrigemOutros')?.value || '',
        cirurgia6m: Boolean(document.getElementById('fCliCirurgia')?.checked),
        pressao: document.getElementById('fCliPressao')?.value || '',
        osteo: Boolean(document.getElementById('fCliOsteo')?.checked),
        hernia: Boolean(document.getElementById('fCliHernia')?.checked)
      };

      clients = clients || [];
      clients.push(novo);
      save(clients);
      render();
      closeCliModal();
      cliFormCad.reset();
    });

    // pagamento folha de colaboradores

    (function initFolha() {
      const LS_COLABS = 'rokuzen.colaboradores';
      const LS_SALARIOS = 'rokuzen.salarios'; // { [email]: base }
      const folhaKey = (comp) => `rokuzen.folha.${comp}`; // comp = YYYY-MM

      const compRef = document.getElementById('compRef');
      const tbody = document.getElementById('folhaBody');
      const empty = document.getElementById('folhaEmpty');

      const btnGerar = document.getElementById('btnGerar');
      const btnSalvar = document.getElementById('btnSalvar');
      const btnExportar = document.getElementById('btnExportar');
      const btnPagarTodos = document.getElementById('btnPagarTodos');

      const totBase = document.getElementById('totBase');
      const totAdd = document.getElementById('totAdd');
      const totDesc = document.getElementById('totDesc');
      const totLiq = document.getElementById('totLiq');

      // helpers
      const brl = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const num = (v) => Number(String(v).replace(',', '.')) || 0;
      const todayISO = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const fmtBR = (iso) => iso ? iso.split('-').reverse().join('/') : '';

      // estado corrente
      let COMP = new Date().toISOString().slice(0, 7); // mês atual
      compRef.value = COMP;

      function loadColabs() {
        return JSON.parse(localStorage.getItem(LS_COLABS) || '[]');
      }
      function loadSalarios() {
        return JSON.parse(localStorage.getItem(LS_SALARIOS) || '{}');
      }
      function saveSalarios(map) {
        localStorage.setItem(LS_SALARIOS, JSON.stringify(map));
      }
      function loadFolha() {
        return JSON.parse(localStorage.getItem(folhaKey(COMP)) || '[]');
      }
      function saveFolha(arr) {
        localStorage.setItem(folhaKey(COMP), JSON.stringify(arr));
      }

      // Gera folha do mês com base nos colaboradores
      function gerarFolhaSeVazia() {
        let folha = loadFolha();
        if (folha.length) { render(folha); return; }

        const colabs = loadColabs();
        const salarioMap = loadSalarios();
        folha = colabs.map(c => ({
          email: c.email,
          nome: `${c.nome} ${c.sobrenome}`,
          funcao: c.funcao || '',
          base: Number(salarioMap[c.email] || 0),
          add: 0,
          desc: 0,
          liquido: 0, // calculado na render
          status: 'Pendente',
          pagoEm: ''  // YYYY-MM-DD
        }));
        saveFolha(folha);
        render(folha);
      }

      function render(data) {
        tbody.innerHTML = '';
        if (!data.length) {
          empty.style.display = 'block';
          atualizarTotais(data);
          return;
        }
        empty.style.display = 'none';

        data.forEach((r, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
        <td>${r.nome}</td>
        <td>${r.funcao}</td>
        <td><input class="inp money js-base" data-i="${idx}" value="${(r.base ?? 0)}"></td>
        <td><input class="inp money js-add"  data-i="${idx}" value="${(r.add ?? 0)}"></td>
        <td><input class="inp money js-desc" data-i="${idx}" value="${(r.desc ?? 0)}"></td>
        <td class="td-liq" data-i="${idx}">${brl(calcLiquido(r))}</td>
        <td>
          <select class="inp js-status" data-i="${idx}">
            <option ${r.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
            <option ${r.status === 'Pago' ? 'selected' : ''}>Pago</option>
          </select>
        </td>
        <td>
          <input type="date" class="inp js-pagoem" data-i="${idx}" value="${r.pagoEm || ''}">
        </td>
        <td>
          <button class="btn ghost btn-sm js-rem" data-i="${idx}">Remover</button>
        </td>
      `;
          tbody.appendChild(tr);
        });

        atualizarTotais(data);
      }

      function calcLiquido(r) {
        return num(r.base) + num(r.add) - num(r.desc);
      }

      function atualizarTotais(data) {
        const sum = (k) => data.reduce((acc, r) => acc + num(r[k] || 0), 0);
        const liq = data.reduce((acc, r) => acc + calcLiquido(r), 0);
        totBase.textContent = brl(sum('base'));
        totAdd.textContent = brl(sum('add'));
        totDesc.textContent = brl(sum('desc'));
        totLiq.textContent = brl(liq);
      }

      // eventos de edição
      tbody.addEventListener('input', (e) => {
        const i = e.target.dataset.i;
        if (i == null) return;
        const folha = loadFolha();
        const row = folha[i];
        if (!row) return;

        if (e.target.classList.contains('js-base')) row.base = num(e.target.value);
        if (e.target.classList.contains('js-add')) row.add = num(e.target.value);
        if (e.target.classList.contains('js-desc')) row.desc = num(e.target.value);
        if (e.target.classList.contains('js-status')) {
          row.status = e.target.value;
          if (row.status === 'Pago' && !row.pagoEm) row.pagoEm = todayISO();
        }
        if (e.target.classList.contains('js-pagoem')) row.pagoEm = e.target.value || '';

        // atualiza líquido na célula
        const td = tbody.querySelector(`.td-liq[data-i="${i}"]`);
        if (td) td.textContent = brl(calcLiquido(row));

        saveFolha(folha);

        // se alterou salário base, persistimos no mapa global de salários tbm
        if (e.target.classList.contains('js-base')) {
          const map = loadSalarios();
          map[row.email] = row.base;
          saveSalarios(map);
        }

        atualizarTotais(folha);
      });

      // remover lançamento
      tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('.js-rem');
        if (!btn) return;
        const i = Number(btn.dataset.i);
        const folha = loadFolha();
        folha.splice(i, 1);
        saveFolha(folha);
        render(folha);
      });

      // ações top bar
      btnGerar.addEventListener('click', gerarFolhaSeVazia);
      btnSalvar.addEventListener('click', () => {
        const folha = loadFolha();
        saveFolha(folha);
        alert('Folha salva ✅');
      });

      btnPagarTodos.addEventListener('click', () => {
        const folha = loadFolha();
        const today = todayISO();
        folha.forEach(r => { r.status = 'Pago'; r.pagoEm = r.pagoEm || today; });
        saveFolha(folha);
        render(folha);
      });

      btnExportar.addEventListener('click', () => {
        const folha = loadFolha();
        if (!folha.length) return alert('Nada para exportar.');

        const header = ['Nome', 'Função', 'Email', 'SalarioBase', 'Adicionais', 'Descontos', 'Liquido', 'Status', 'PagoEm', 'Competencia'];
        const rows = folha.map(r => [
          r.nome, r.funcao, r.email, num(r.base), num(r.add), num(r.desc), calcLiquido(r), r.status, r.pagoEm || '', COMP
        ]);
        const csv = [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `folha_${COMP}.csv`; a.click();
        URL.revokeObjectURL(url);
      });

      // troca de competência
      compRef.addEventListener('change', () => {
        COMP = compRef.value || COMP;
        render(loadFolha());
      });

      // init
      render(loadFolha()); // tenta carregar se já existir
    })();

    (function initCalendar() {
      const calendarEl = document.getElementById('calendar');
      if (!calendarEl) return;
  const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        themeSystem: 'standard',
        selectable: true,
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        events: JSON.parse(localStorage.getItem('rokuzen.eventos') || '[]'),

        // adicionar novo evento
        dateClick: function (info) {
          const title = prompt('📅 Novo evento:');
          if (title) {
            const novoEvento = { title, start: info.dateStr, allDay: true };
            calendar.addEvent(novoEvento);
            salvarEvento(novoEvento);
          }
        },

        // remover evento ao clicar
        eventClick: function (info) {
          if (confirm(`Remover o evento "${info.event.title}"?`)) {
            info.event.remove();
            removerEvento(info.event.title, info.event.startStr);
          }
        },
      });


      // only render if the calendar view is currently visible; otherwise render when activated
      if (document.getElementById('view-calendario')?.classList.contains('active')) {
        calendar.render();
      } else {
        const onShow = (ev) => {
          if (ev.detail === 'view-calendario') {
            // small timeout to let layout settle
            setTimeout(() => calendar.render(), 0);
            document.removeEventListener('view:activated', onShow);
          }
        };
        document.addEventListener('view:activated', onShow);
      }

      function salvarEvento(evt) {
        const eventos = JSON.parse(localStorage.getItem('rokuzen.eventos') || '[]');
        eventos.push(evt);
        localStorage.setItem('rokuzen.eventos', JSON.stringify(eventos));
      }

      function removerEvento(title, start) {
        let eventos = JSON.parse(localStorage.getItem('rokuzen.eventos') || '[]');
        eventos = eventos.filter(e => e.title !== title || e.start !== start);
        localStorage.setItem('rokuzen.eventos', JSON.stringify(eventos));
      }

      
    })();


  })();
});

