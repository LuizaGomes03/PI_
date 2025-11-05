document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     NAVIGAÇÃO ENTRE VIEWS (UNIFICADA)
     ========================= */
  const views = Array.from(document.querySelectorAll('.view'));

  function normToSectionId(input) {
    // aceita "relatorio" ou "view-relatorio" e retorna SEMPRE "view-relatorio"
    if (!input) return null;
    return input.startsWith('view-') ? input : `view-${input}`;
  }
  function normToHash(input) {
    // hash SEM o prefixo "view-": "view-relatorio" -> "relatorio"
    return (input || '').replace(/^view-/, '');
  }

  function activateView(viewKeyOrId) {
    const sectionId = normToSectionId(viewKeyOrId);
    if (!sectionId) return false;

    let found = false;

    // mostra/oculta views (usa .active e [hidden])
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

    // estado visual dos links (data-view / role="tab")
    document.querySelectorAll('[data-view], [role="tab"]').forEach(link => {
      const dv = link.getAttribute('data-view') || '';
      const aria = link.getAttribute('aria-controls') || '';
      const href = (link.getAttribute('href') || '').replace('#', '');

      const match =
        normToSectionId(dv) === sectionId ||
        normToSectionId(aria) === sectionId ||
        normToSectionId(href) === sectionId;

      link.classList.toggle('active', match);
      if (link.getAttribute('role') === 'tab') {
        link.setAttribute('aria-selected', String(match));
      }
    });

    // sincroniza hash no formato SEM "view-"
    if (found) history.replaceState(null, '', `#${normToHash(sectionId)}`);

    // notifica que uma view foi ativada (pra gráficos/render laziness)
    if (found) document.dispatchEvent(new CustomEvent('view:activated', { detail: sectionId }));

    // se a view estiver aninhada dentro de outra .view, garante ancestrais visíveis
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

  // delegação de clique global (data-view, aria-controls, ou href="#...")
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-view], [role="tab"], a[href^="#"]');
    if (!link) return;

    const dv = link.getAttribute('data-view');
    const aria = link.getAttribute('aria-controls');
    const href = (link.getAttribute('href') || '').replace('#', '');

    const target = normToSectionId(dv || aria || href);
    // só intercepta se existir a view alvo
    if (!target || !document.getElementById(target)) return;

    e.preventDefault();
    activateView(target);
  });

  // rota inicial / hashchange
  function initialRoute() {
    const raw = (location.hash || '').replace('#', '');
    // aceita "#relatorio" ou "#view-relatorio"; default = relatorio (mude se quiser outra)
    const target = normToSectionId(raw || 'relatorio');
    if (activateView(target)) return;

    // fallback: mantém a .active marcada no HTML ou abre a primeira
    const current = document.querySelector('.view.active');
    if (!current && views[0]) activateView(views[0].id);
  }
  window.addEventListener('hashchange', initialRoute);
  initialRoute();

  /* =========================
     LOGOUT POPUP
     ========================= */
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
      try { localStorage.clear(); sessionStorage.clear(); } catch { }
      window.location.href = '../login.html';
    }, 200);
  });

  /* =========================
     UNIDADES (select do sidebar)
     ========================= */
  window.APP_UNITS = window.APP_UNITS || [
    { id: 1, name: 'Grand Plaza Shopping' },
    { id: 2, name: 'Golden Square Shopping' },
    { id: 3, name: 'Mooca Plaza Shopping' },
    { id: 4, name: 'West Plaza Shopping' },
    // add mais aqui se quiser
  ];

  const selUnit = document.getElementById('unitPicker');
  const curUnitEl = document.getElementById('currentUnitName');
  const atdUnitEl = document.getElementById('atdUnitName'); // exemplo de título dinâmico
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
  function loadUnit() { try { const u = JSON.parse(localStorage.getItem(LS_UNIT) || 'null'); return u && u.id ? u : null; } catch { return null; } }
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
      saveUnit(initial);
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

    // atualização dinâmica de lista (se vier do back)
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

  /* =========================
     MENU MOBILE (hambúrguer)
     ========================= */
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

    // ao redimensionar pra desktop, garante estado fechado e libera scroll
    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width:901px)').matches) close();
    });
  })();

  /* =========================
     TABELA DE PREÇOS (CRUD por unidade)
     ========================= */
  (function () {
    const form = document.getElementById('priceForm');
    const nameEl = document.getElementById('svcNome');
    const durEl = document.getElementById('svcDur');
    const valEl = document.getElementById('svcPreco');
    const tbl = document.getElementById('tblPrecos')?.querySelector('tbody');
    const empty = document.getElementById('priceEmpty');
    const unitNameEl = document.getElementById('priceUnitName');
    if (!form || !tbl) return;

    let currentUnit = null;   // {id, name}
    let editingId = null;

    const keyFor = (unitId) => `rokuzen.prices.${unitId || 'default'}`;

    const brl = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const mins = (m) => `${Number(m) || 0} min`;

    const load = () => {
      const raw = localStorage.getItem(keyFor(currentUnit?.id));
      try { return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []; } catch { return []; }
    };
    const save = (arr) => localStorage.setItem(keyFor(currentUnit?.id), JSON.stringify(arr));

    const ensureSeeds = () => {
      const data = load();
      if (data.length) return;
      const seeds = [
        { id: crypto.randomUUID?.() || String(Date.now()) + 'a', nome: 'Quick Massage', dur: 15, preco: 38 },
        { id: crypto.randomUUID?.() || String(Date.now()) + 'b', nome: 'Reflexologia', dur: 30, preco: 100 },
      ];
      save(seeds);
    };

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
        const act = document.getElementById('priceFormAction');
        if (act) act.textContent = 'Adicionar';
      } else {
        items.push({ id: crypto.randomUUID?.() || String(Date.now()), nome, dur, preco });
      }
      save(items);
      form.reset();
      render();
    });

    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.js-edit');
      const delBtn = e.target.closest('.js-del');
      tbody.querySelectorAll('.js-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const cliente = data.find(c => c.cliente_id == id);
          if (cliente) abrirModalCliente(cliente);
        });
      });

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
        const act = document.getElementById('priceFormAction');
        if (act) act.textContent = 'Salvar';
        nameEl.focus();
      }
      if (delBtn) {
        if (!confirm('Remover este serviço da tabela?')) return;
        const next = items.filter(x => x.id !== id);
        save(next);
        render();
      }
    });

    // integra com seletor de unidade
    document.addEventListener('unit:change', (ev) => {
      currentUnit = ev.detail || null;
      if (unitNameEl) unitNameEl.textContent = currentUnit?.name || '—';
      ensureSeeds();
      render();
    });

    // fallback inicial (caso a view seja aberta direto e ainda não houve unit:change)
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

  (function () {

    (function () {
      const tbody = document.querySelector('#tblClientes tbody');
      const empty = document.getElementById('cliEmpty');

      let editandoCliente = null; // armazena o cliente em edição

      function abrirModalCliente(cliente = null) {
        editandoCliente = cliente;

        const modal = document.getElementById('cliModal');
        const form = document.getElementById('cliFormCad');

        // Preenche campos se for edição
        if (cliente) {
          document.getElementById('fCliNome').value = cliente.nome_cliente || '';
          document.getElementById('fCliFone').value = cliente.telefone_cliente || '';
          document.getElementById('fCliEmail').value = cliente.email_cliente || '';
          document.getElementById('fCliNiver').value = cliente.data_nascimento
            ? cliente.data_nascimento.split('T')[0]
            : '';
          document.getElementById('fCliSexo').value = cliente.sexo || '';
          document.getElementById('fCliObs').value = cliente.observacoes || '';

          // muda o título e o botão
          document.getElementById('cliFormTitle').textContent = 'Editar Cliente';
          document.getElementById('cliFormAction').textContent = 'Salvar alterações';
        } else {
          form.reset();
          document.getElementById('cliFormTitle').textContent = 'Cadastrar Cliente';
          document.getElementById('cliFormAction').textContent = 'Cadastrar';
        }

        try { modal.showModal(); } catch { modal.classList.add('open'); }
      }

      function fecharModalCliente() {
        const modal = document.getElementById('cliModal');
        try { modal.close(); } catch { modal.classList.remove('open'); }
        editandoCliente = null;
      }

      async function carregarClientes(unidadeId) {
        tbody.innerHTML = '<tr><td colspan="8">Carregando...</td></tr>';
        try {
          const resp = await fetch(`http://localhost:3000/api/clientes/unidade/${unidadeId}`);
          const data = await resp.json();

          tbody.innerHTML = '';
          if (!data.length) {
            empty.hidden = false;
            return;
          }
          empty.hidden = true;

          data.forEach(cli => {
            const tr = document.createElement('tr');
            const niver = cli.data_nascimento
              ? new Date(cli.data_nascimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
              : '—';
            const idade = cli.data_nascimento
              ? new Date().getFullYear() - new Date(cli.data_nascimento).getFullYear()
              : '';

            const saude = [cli.condicoes, cli.alergias, cli.historico]
              .filter(v => v && v !== 'Nenhum')
              .join(' / ') || 'Nenhum';

            tr.innerHTML = `
          <td>${cli.nome_cliente}</td>
          <td>${cli.telefone_cliente || '—'}</td>
          <td>${cli.email_cliente || '—'}</td>
          <td>${cli.sexo || '—'}</td>
          <td>${niver} ${idade ? `<span class="badge-age">${idade} anos</span>` : ''}</td>
          <td>${cli.primeiro_atendimento ? new Date(cli.primeiro_atendimento).toLocaleDateString('pt-BR') : '—'}</td>
          <td>${saude}</td>
          <td>${cli.observacoes || '—'}</td>
          <td>
            <button class="btn ghost btn-sm js-edit" data-id="${cli.cliente_id}"><i class="fa-regular fa-pen-to-square"></i> Editar</button>
            <button class="btn ghost btn-sm js-del" data-id="${cli.cliente_id}"><i class="fa-regular fa-trash-can"></i> Remover</button>
          </td>
        `;
            tbody.appendChild(tr);
          });

          tbody.querySelectorAll('.js-del').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.dataset.id;
              if (!confirm('Deseja remover este cliente?')) return;
              try {
                const resp = await fetch(`http://localhost:3000/api/clientes/${id}`, { method: 'DELETE' });
                if (!resp.ok) throw new Error('Erro ao remover');
                alert('Cliente removido com sucesso!');
                carregarClientes(unidadeId);
              } catch (err) {
                console.error(err);
                alert('Falha ao remover cliente.');
              }
            });
          });

          tbody.querySelectorAll('.js-edit').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.dataset.id;
              const cliente = data.find(c => c.cliente_id == id);
              if (cliente) abrirModalCliente(cliente);
            });
          });

        } catch (err) {
          console.error('Erro ao carregar clientes:', err);
          tbody.innerHTML = '<tr><td colspan="8">Erro ao carregar dados.</td></tr>';
        }
      }

      // Atualiza sempre que trocar unidade
      document.addEventListener('unit:change', (ev) => {
        const unidade = ev.detail;
        if (unidade?.id) carregarClientes(unidade.id);
      });

      // Carrega a unidade salva no localStorage ao abrir
      try {
        const last = JSON.parse(localStorage.getItem('rokuzen.currentUnit') || 'null');
        if (last?.id) carregarClientes(last.id);
      } catch { }
    })();

    async function carregarColaboradores(unidadeId) {
      const tbody = document.getElementById('colabTableBody');
      const empty = document.getElementById('colabEmpty');
      tbody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

      try {
        const resp = await fetch(`http://localhost:3000/api/colaboradores/unidade/${unidadeId}`);
        if (!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);
        const data = await resp.json();

        tbody.innerHTML = '';
        if (!data.length) {
          empty.hidden = false;
          return;
        }
        empty.hidden = true;

        data.forEach(colab => {
          const ativo = (colab.ativo === 'S' || colab.ativo === 1 || colab.ativo === true) ? 'Sim' : 'Não';
          const tr = document.createElement('tr');

          const funcaoNome =
            colab.tipo_id === 1 || colab.tipo_id === "1"
              ? "Terapeuta"
              : colab.tipo_id === 2 || colab.tipo_id === "2"
                ? "Recepção"
                : "—";

          tr.innerHTML = `
        <td>${colab.nome_colaborador}</td>
        <td>${funcaoNome}</td>
        <td>${colab.usuario || '—'}</td>
        <td>${colab.senha || '—'}</td>
        <td>${ativo}</td>
      `;
          tbody.appendChild(tr);
        });
      } catch (err) {
        console.error('Erro ao carregar colaboradores:', err);
        tbody.innerHTML = '<tr><td colspan="5">Erro ao carregar colaboradores.</td></tr>';
      }
    }

    document.addEventListener('unit:change', (ev) => {
      const unidade = ev.detail;
      if (unidade?.id) carregarColaboradores(unidade.id);
    });

    // ===== cadastro colab =====
    (function initCadastroColab() {
      const form = document.getElementById('formNovoColab');
      if (!form) return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('colabNome').value.trim();
        const usuario = document.getElementById('colabUsuario').value.trim();
        const senha = document.getElementById('colabSenha').value.trim();
        let tipo_id = document.getElementById("colabFuncao").value.trim();

        // converte o texto do select para número antes de enviar
        if (tipo_id.toLowerCase() === "terapeuta") tipo_id = 1;
        else if (tipo_id.toLowerCase() === "recepcionista") tipo_id = 2;
        else tipo_id = null;

        const unidadeAtual = JSON.parse(localStorage.getItem('rokuzen.currentUnit') || '{}');

        if (!nome || !tipo_id || !usuario || !senha) {
          alert('Preencha todos os campos!');
          return;
        }

        try {
          const resp = await fetch('http://localhost:3000/api/colaboradores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome_colaborador: nome,
              tipo_id,
              usuario,
              senha,
              unidade_id: unidadeAtual.id
            })
          });

          if (!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);

          alert('Colaborador criado com sucesso!');
          form.reset();

          // atualiza lista automaticamente
          document.dispatchEvent(new CustomEvent('unit:change', { detail: unidadeAtual }));
        } catch (err) {
          console.error('Erro ao criar colaborador:', err);
          alert('Falha ao criar colaborador.');
        }
      });
    })();


    // ===== FOLHA (Controle de pagamentos dos colaboradores)
    (function initFolha() {
      const LS_COLABS = 'rokuzen.colaboradores';
      const LS_SALARIOS = 'rokuzen.salarios';           // { [email]: base }
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

      const brl = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const num = (v) => Number(String(v).replace(',', '.')) || 0;
      const todayISO = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      let COMP = new Date().toISOString().slice(0, 7); // mês atual
      if (compRef) compRef.value = COMP;

      function loadColabs() { return JSON.parse(localStorage.getItem(LS_COLABS) || '[]'); }
      function loadSalarios() { return JSON.parse(localStorage.getItem(LS_SALARIOS) || '{}'); }
      function saveSalarios(m) { localStorage.setItem(LS_SALARIOS, JSON.stringify(m)); }
      function loadFolha() { return JSON.parse(localStorage.getItem(folhaKey(COMP)) || '[]'); }
      function saveFolha(a) { localStorage.setItem(folhaKey(COMP), JSON.stringify(a)); }

      function gerarFolhaSeVazia() {
        if (!tbody) return;
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
          liquido: 0,          // calculado na render
          status: 'Pendente',
          pagoEm: ''           // YYYY-MM-DD
        }));
        saveFolha(folha);
        render(folha);
      }

      function calcLiquido(r) {
        return num(r.base) + num(r.add) - num(r.desc);
      }

      function atualizarTotais(data) {
        const sum = (k) => data.reduce((acc, r) => acc + num(r[k] || 0), 0);
        const liq = data.reduce((acc, r) => acc + calcLiquido(r), 0);
        if (totBase) totBase.textContent = brl(sum('base'));
        if (totAdd) totAdd.textContent = brl(sum('add'));
        if (totDesc) totDesc.textContent = brl(sum('desc'));
        if (totLiq) totLiq.textContent = brl(liq);
      }

      function render(data) {
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!data.length) {
          if (empty) empty.style.display = 'block';
          atualizarTotais(data);
          return;
        }
        if (empty) empty.style.display = 'none';

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
              <td><input type="date" class="inp js-pagoem" data-i="${idx}" value="${r.pagoEm || ''}"></td>
              <td><button class="btn ghost btn-sm js-rem" data-i="${idx}">Remover</button></td>
            `;
          tbody.appendChild(tr);
        });

        atualizarTotais(data);
      }

      // eventos de edição
      tbody?.addEventListener('input', (e) => {
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

        const td = tbody.querySelector(`.td-liq[data-i="${i}"]`);
        if (td) td.textContent = brl(calcLiquido(row));

        saveFolha(folha);

        // persiste salário base no mapa global também
        if (e.target.classList.contains('js-base')) {
          const map = loadSalarios();
          map[row.email] = row.base;
          saveSalarios(map);
        }
        atualizarTotais(folha);
      });

      // remover lançamento
      tbody?.addEventListener('click', (e) => {
        const btn = e.target.closest('.js-rem');
        if (!btn) return;
        const i = Number(btn.dataset.i);
        const folha = loadFolha();
        folha.splice(i, 1);
        saveFolha(folha);
        render(folha);
      });

      // ações top bar
      btnGerar?.addEventListener('click', gerarFolhaSeVazia);
      btnSalvar?.addEventListener('click', () => {
        const folha = loadFolha();
        saveFolha(folha);
        alert('Folha salva ✅');
      });
      btnPagarTodos?.addEventListener('click', () => {
        const folha = loadFolha();
        const today = todayISO();
        folha.forEach(r => { r.status = 'Pago'; r.pagoEm = r.pagoEm || today; });
        saveFolha(folha);
        render(folha);
      });
      btnExportar?.addEventListener('click', () => {
        const folha = loadFolha();
        if (!folha.length) return alert('Nada para exportar.');
        const header = ['Nome', 'Função', 'Email', 'SalarioBase', 'Adicionais', 'Descontos', 'Liquido', 'Status', 'PagoEm', 'Competencia'];
        const rows = folha.map(r => [r.nome, r.funcao, r.email, num(r.base), num(r.add), num(r.desc), num(r.base) + num(r.add) - num(r.desc), r.status, r.pagoEm || '', COMP]);
        const csv = [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `folha_${COMP}.csv`; a.click();
        URL.revokeObjectURL(url);
      });

      // troca de competência
      compRef?.addEventListener('change', () => {
        COMP = compRef.value || COMP;
        render(loadFolha());
      });

      // init
      render(loadFolha()); // tenta carregar se já existir
    })();
  })();

  /* =========================
     CALENDÁRIO (FullCalendar-ready + lazy render)
     ========================= */
  (function initCalendar() {
    const calendarEl = document.getElementById('calendar'); // se tiver um container específico
    if (!calendarEl || typeof FullCalendar === 'undefined') return;

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
      dateClick(info) {
        const title = prompt('📅 Novo evento:');
        if (title) {
          const novoEvento = { title, start: info.dateStr, allDay: true };
          calendar.addEvent(novoEvento);
          salvarEvento(novoEvento);
        }
      },
      eventClick(info) {
        if (confirm(`Remover o evento "${info.event.title}"?`)) {
          removerEvento(info.event.title, info.event.startStr);
          info.event.remove();
        }
      },
    });

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

    // render só quando a view do calendário estiver ativa
    const CALC_VIEW_ID = 'view-calendario';
    if (document.getElementById(CALC_VIEW_ID)?.classList.contains('active')) {
      setTimeout(() => calendar.render(), 0);
    } else {
      const onShow = (ev) => {
        if (ev.detail === CALC_VIEW_ID) {
          setTimeout(() => calendar.render(), 0);
          document.removeEventListener('view:activated', onShow);
        }
      };
      document.addEventListener('view:activated', onShow);
    }
  })();

  /* =========================
     GANCHOS PARA RELATÓRIOS (render on show)
     ========================= */

  // Controle de Ponto (Relatório)
  document.addEventListener('view:activated', (ev) => {
    if (ev.detail === 'view-rel-ponto') {
      // se sua página desse relatório tiver uma função "relPontoRender", chamamos aqui
      if (typeof window.relPontoRender === 'function') {
        window.relPontoRender();
      } else {
        // Em setups simples, dá pra forçar um resize em gráficos/elementos:
        window.dispatchEvent(new Event('resize'));
      }
    }
  });

  // Extrato Financeiro (Relatório)
  document.addEventListener('view:activated', (ev) => {
    if (ev.detail === 'view-rel-extrato') {
      if (typeof window.relExtratoRender === 'function') {
        window.relExtratoRender();
      } else {
        window.dispatchEvent(new Event('resize'));
      }
    }
  });

  // Atds × Terapeutas (Relatório)
  document.addEventListener('view:activated', (ev) => {
    if (ev.detail === 'view-rel-atds-terapeutas') {
      if (typeof window.relAtdsTerapeutasRender === 'function') {
        window.relAtdsTerapeutasRender();
      } else {
        window.dispatchEvent(new Event('resize'));
      }
    }
  });

});

// ===== MODAL DE CADASTRO DE CLIENTE =====
const cliModal = document.getElementById('cliModal');
const cliOpenBtn = document.getElementById('cliOpenCadastro');
const cliCloseBtn = document.getElementById('cliClose');
const cliCancelBtn = document.getElementById('cliCancel');
const cliFormCad = document.getElementById('cliFormCad');

let unidadeAtual = null;

// mantém unidade atual atualizada
document.addEventListener('unit:change', (ev) => {
  unidadeAtual = ev.detail || null;
});
try {
  const last = JSON.parse(localStorage.getItem('rokuzen.currentUnit') || 'null');
  unidadeAtual = last || null;
} catch { }

// abrir / fechar modal
function openCliModal() {
  if (!cliModal) return;
  try { cliModal.showModal?.(); } catch { cliModal.classList.add('open'); }
}
function closeCliModal() {
  if (!cliModal) return;
  try { cliModal.close?.(); } catch { cliModal.classList.remove('open'); }
}

cliOpenBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  openCliModal(); // agora sim
});

cliCloseBtn?.addEventListener('click', closeCliModal);
cliCancelBtn?.addEventListener('click', (e) => { e.preventDefault(); closeCliModal(); });

// SUBMIT: envia cliente pro backend
cliFormCad?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!unidadeAtual?.id) {
    alert('Selecione uma unidade antes de cadastrar o cliente.');
    return;
  }

  const nome = document.getElementById('fCliNome')?.value.trim();
  const fone = document.getElementById('fCliFone')?.value.trim();
  const email = document.getElementById('fCliEmail')?.value.trim();
  const niver = document.getElementById('fCliNiver')?.value.trim();
  const sexo = document.getElementById('fCliSexo')?.value;
  const obs = document.getElementById('fCliObs')?.value.trim();

  if (!nome || !fone || !niver) {
    alert('⚠️ Preencha Nome, Telefone e Data de Nascimento.');
    return;
  }

  const payload = {
    nome_cliente: nome,
    telefone_cliente: fone,
    email_cliente: email,
    data_nascimento: niver,
    sexo,
    observacoes: obs,
    unidade_id: unidadeAtual.id
  };

  try {
    const url = editandoCliente
      ? `http://localhost:3000/api/clientes/${editandoCliente.cliente_id}`
      : 'http://localhost:3000/api/clientes';
    const method = editandoCliente ? 'PUT' : 'POST';

    const resp = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error('Erro ao salvar cliente');
    alert(editandoCliente ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');

    cliFormCad.reset();
    fecharModalCliente();
    document.dispatchEvent(new CustomEvent('unit:change', { detail: unidadeAtual }));
  } catch (err) {
    console.error('Erro ao salvar cliente:', err);
    alert('Falha ao salvar cliente. Verifique o console.');
  }



  document.getElementById("baixarRelatorio").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Relatório - Serviços e Pacotes", 14, 15);
    doc.autoTable({
      html: "#tabelaPacotes",
      startY: 25,
      theme: "grid",
      styles: { fontSize: 10, halign: "center" },
      headStyles: { fillColor: [46, 125, 50] },
    });

    doc.save("relatorio-pacotes.pdf");
  });
});
