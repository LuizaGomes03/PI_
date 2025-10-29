document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // NAVIGAÇÃO ENTRE VIEWS
  // =========================
  const views = Array.from(document.querySelectorAll('.view'));

  function activateView(viewId) {
    const targetId = `view-${viewId}`;
    let found = false;

    // ativa view
    views.forEach(v => {
      const isTarget = v.id === targetId;
      v.classList.toggle('active', isTarget);
      if (isTarget) found = true;
    });

    // ativa link
    document.querySelectorAll('[data-view]').forEach(link => {
      const active = link.dataset.view === viewId;
      link.classList.toggle('active', active);
      if (link.getAttribute('role') === 'tab') {
        link.setAttribute('aria-selected', String(active));
      }
    });

    // sincroniza hash
    if (found) history.replaceState(null, '', `#${viewId}`);
    return found;
  }

  // delegação de clique p/ links data-view
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-view]');
    if (!link) return;
    e.preventDefault();
    const target = link.dataset.view;
    activateView(target);
  });

  // abre view pela hash na carga / mudança
  function initialRoute() {
    const hash = (location.hash || '').replace('#', '');
    if (hash && activateView(hash)) return;
    // fallback se hash não bate: mantém a que já está .active ou abre a primeira
    const current = document.querySelector('.view.active');
    if (!current && views[0]) {
      const id = views[0].id.replace('view-', '');
      activateView(id);
    }
  }
  window.addEventListener('hashchange', initialRoute);
  initialRoute();

  // =========================
  // LOGOUT POPUP
  // =========================
  const logoutBtn  = document.getElementById('logoutBtn');
  const popup      = document.getElementById('logoutPopup');
  const confirmBtn = document.getElementById('confirmLogout');
  const cancelBtn  = document.getElementById('cancelLogout');

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
    { id: 'grand',  name: 'Grand Plaza Shopping'   },
    { id: 'west',   name: 'Shopping West Plaza'    },
    { id: 'mooca',  name: 'Mooca Plaza Shopping'   },
  ];

  const selUnit   = document.getElementById('unitPicker');
  const curUnitEl = document.getElementById('currentUnitName');
  const atdUnitEl = document.getElementById('atdUnitName'); // título da view Atendimentos
  const LS_UNIT   = 'rokuzen.currentUnit';

  function readUnits() {
    return (Array.isArray(window.APP_UNITS) ? window.APP_UNITS : []).map(u => ({
      id: String(u.id),
      name: String(u.name),
      city: String(u.city || ''),
      floor: String(u.floor || '')
    }));
  }
  let UNITS = readUnits();

  function getById(id){ return UNITS.find(u => u.id === id) || null; }
  function saveUnit(u){ try{ localStorage.setItem(LS_UNIT, JSON.stringify(u)); }catch{} }
  function loadUnit(){
    try{
      const u = JSON.parse(localStorage.getItem(LS_UNIT) || 'null');
      return u && u.id ? u : null;
    }catch{ return null; }
  }
  function setUnitName(name){
    if (curUnitEl) curUnitEl.textContent = name || '—';
    if (atdUnitEl) atdUnitEl.textContent = name || '—';
  }
  function emitUnitChange(unit){
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
  (function(){
    const sidebar  = document.querySelector('.sidebar');
    const toggle   = document.getElementById('menuToggle');
    const backdrop = document.getElementById('menuBackdrop');
    if(!sidebar || !toggle || !backdrop) return;

    const open  = () => { sidebar.classList.add('is-open');  backdrop.classList.add('is-open');  };
    const close = () => { sidebar.classList.remove('is-open'); backdrop.classList.remove('is-open'); };

    toggle.addEventListener('click', () => {
      sidebar.classList.contains('is-open') ? close() : open();
    });
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });

    // fecha ao clicar num item, só em telas pequenas
    document.querySelectorAll('.shortcut-item,[data-view]').forEach(el=>{
      el.addEventListener('click', () => {
        if (window.matchMedia('(max-width:900px)').matches) close();
      });
    });
  })();

  // =========================
  // (Opcional) Atendimentos: render reativo à troca de unidade
  // =========================
  document.addEventListener('unit:change', (e) => {
    const name = e.detail?.name || '—';
    if (atdUnitEl) atdUnitEl.textContent = name;
    // se você tem render(); descomenta:
    // if (typeof renderAtendimentos === 'function') renderAtendimentos();
  });
  // ====== TABELA DE PREÇOS (CRUD + por unidade) ======
(function(){
  // elementos
  const form = document.getElementById('priceForm');
  const nameEl = document.getElementById('svcNome');
  const durEl  = document.getElementById('svcDur');
  const valEl  = document.getElementById('svcPreco');
  const tbl    = document.getElementById('tblPrecos')?.querySelector('tbody');
  const empty  = document.getElementById('priceEmpty');
  const unitNameEl = document.getElementById('priceUnitName');

  if (!form || !tbl) return;

  // estado
  let currentUnit = null;        // {id, name}
  let editingId = null;          // id do item sendo editado

  const keyFor = (unitId) => `rokuzen.prices.${unitId || 'default'}`;

  // util: BRL
  const brl = (n) => (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const mins = (m) => `${Number(m)||0} min`;

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
      { id: crypto.randomUUID?.() || String(Date.now())+'a', nome:'Quick Massage', dur: 15, preco: 38 },
      { id: crypto.randomUUID?.() || String(Date.now())+'b', nome:'Reflexologia',  dur: 30, preco: 100 },
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

    const nome  = nameEl.value.trim();
    const dur   = Number(durEl.value);
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
    const delBtn  = e.target.closest('.js-del');
    if (!editBtn && !delBtn) return;

    const id = (editBtn || delBtn).dataset.id;
    const items = load();

    if (editBtn) {
      const it = items.find(x => x.id === id);
      if (!it) return;
      nameEl.value = it.nome;
      durEl.value  = it.dur;
      valEl.value  = it.preco;
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
  } catch {}
})();
}); 