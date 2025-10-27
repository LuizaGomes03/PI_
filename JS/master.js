/* ==========================================================
   Rokuzen Master — JS full app
   by: Luly & Chat 🤝
   ========================================================== */

/* ===== 0) BACKGROUND VIDEO SAFETY ===== */
window.addEventListener('DOMContentLoaded', () => {
  const vid = document.getElementById('bg-video');
  if (vid) {
    vid.style.position = 'fixed';
    vid.style.inset = '0';
    vid.style.width = '100%';
    vid.style.height = '100%';
    vid.style.objectFit = 'cover';
    vid.style.zIndex = '-1';
    vid.style.pointerEvents = 'none';
  }
});

/* ===== 1) MINI-UTILS ===== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmtBR = (iso) => new Date(iso).toLocaleString('pt-BR', { hour12: false });
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowISO = () => new Date().toISOString();

/* ===== 2) STORAGE / DB MOCK ===== */
const KEY = 'rokuzen.master';
const seedDB = {
  units: [
    { id: 'U01', name: 'Golden Square', address: 'Av. Kennedy, 700', whatsapp: '+55 11 97495-0306', manager: 'Aline' },
    { id: 'U02', name: 'Mooca Plaza', address: 'Rua Cap. Pacheco', whatsapp: '+55 11 95084-1087', manager: 'Bruno' },
    { id: 'U03', name: 'Grand Plaza', address: 'Av. Indústrias', whatsapp: '+55 11 91665-7900', manager: 'Carla' },
    { id: 'U04', name: 'West Plaza', address: 'Av. Antártica', whatsapp: '+55 11 91942-7901', manager: 'Diego' }
  ],
  employees: [
    { id: 'E01', name: 'Luly', role: 'massagista', unit: 'U01', phone: '(11) 90000-1111', active: true },
    { id: 'E02', name: 'Vera', role: 'massagista', unit: 'U01', phone: '(11) 90000-2222', active: true },
    { id: 'E03', name: 'Rafa', role: 'recepcao', unit: 'U01', phone: '(11) 90000-3333', active: true },
    { id: 'E04', name: 'Ivo', role: 'massagista', unit: 'U02', phone: '(11) 90000-4444', active: true },
    { id: 'E05', name: 'Ana', role: 'recepcao', unit: 'U03', phone: '(11) 90000-5555', active: false },
  ],
  attendance: [], // {id, empId, unit, whenISO, action: 'in'|'break_start'|'break_end'|'out', source}
  appts: [
    { unit: 'U01', date: todayISO(), time: '09:00', client: 'Ana', service: 'Shiatsu 50min', therapistId: 'E01', room: 'Sala 2' },
    { unit: 'U01', date: todayISO(), time: '10:10', client: 'Bruno', service: 'Liberação miofascial', therapistId: 'E01', room: 'Sala 1' },
    { unit: 'U01', date: todayISO(), time: '15:30', client: 'Diego', service: 'Ventosaterapia', therapistId: 'E02', room: 'Sala 2' },
    { unit: 'U02', date: todayISO(), time: '11:00', client: 'Erika', service: 'Reflexologia', therapistId: 'E04', room: 'Sala 1' },
  ],
  calendar: [
    { unit: 'U01', date: '2025-10-12', what: 'Feriado', note: 'Nossa Senhora Aparecida' },
    { unit: 'U01', date: '2025-10-20', what: 'Férias', note: 'Luly OFF (20-24)' },
    { unit: 'U02', date: '2025-10-21', what: 'Manutenção', note: 'Troca do ar sala 3' },
  ],
  clients: [
    { id: 'C01', name: 'Ana Souza', email: 'ana.souza@email.com', birthday: '1998-03-12' },
    { id: 'C02', name: 'Bruno Lima', email: 'bruno.lima@email.com', birthday: '1987-10-27' },
    { id: 'C03', name: 'Carla Dias', email: 'carla.dias@email.com', birthday: '1995-07-04' },
    { id: 'C04', name: 'Diego Ramos', email: 'diego.ramos@email.com', birthday: '1991-12-15' },
    { id: 'C05', name: 'Erika Martins', email: 'erika.martins@email.com', birthday: '2000-01-22' }
  ]
};
function load() { return JSON.parse(localStorage.getItem(KEY) || 'null') || seed(); }
function seed() { localStorage.setItem(KEY, JSON.stringify(seedDB)); return JSON.parse(localStorage.getItem(KEY)); }
function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

/* ===== 3) STATE ===== */
let state = { role: 'admin', unit: 'U01' };

/* ===== 4) API HOOKS (pra trocar por SQL/REST depois) ===== */
const api = {
  // Troca pra fetch/axios/Supabase quando quiser 🧪
  async listAttendance(dateISO) {
    const data = load();
    return data.attendance.filter(a => a.whenISO.startsWith(dateISO));
  },
  async insertAttendance({ empId, unit, action }) {
    const data = load();
    data.attendance.push({
      id: Math.random().toString(36).slice(2),
      empId, unit, action,
      whenISO: nowISO(),
      source: 'manual'
    });
    save(data);
    return true;
  },
  async deleteAttendance(id) {
    const data = load();
    const n = data.attendance.length;
    data.attendance = data.attendance.filter(x => x.id !== id);
    save(data);
    return data.attendance.length < n;
  },
  async listClients() {
    return load().clients || [];
  }
  // exemplo p/ backend:
  // async listAttendance(dateISO){ return (await fetch(`/api/attendance?date=${dateISO}`)).json(); }
};

/* ===== 5) SIDEBAR / VIEWS ROUTER ===== */
function setupRouter() {
  const links = $$('.sb-link');
  const views = $$('.view');

  function setActive(viewKey) {
    // botão ativo
    links.forEach(b => {
      const isActive = b.dataset.view === viewKey;
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      b.classList.toggle('active', isActive);
    });
    // mostrar section
    views.forEach(v => v.classList.toggle('active', v.id === `view-${viewKey}`));

    localStorage.setItem('activeView', viewKey);

    // lazy renders
    if (viewKey === 'dashboard') renderDashboard(load());
    if (viewKey === 'attendance') renderAttendance(load());
    if (viewKey === 'calendar-unit') renderCalendarUnit(load());
    if (viewKey === 'calendar-annual') renderCalendarAnnual(load());
    if (viewKey === 'employees') renderEmployees(load());
    if (viewKey === 'contacts') renderContacts(load());
    if (viewKey === 'clients') renderClients(load());
    if (viewKey === 'pontos') renderMasterPontos(load());
  }

  links.forEach(b => b.addEventListener('click', () => setActive(b.dataset.view)));

  // first view
  const start = localStorage.getItem('activeView') || 'dashboard';
  setActive(start);
}

/* ===== 6) UNIT PILLS ===== */
function buildUnitPills(data) {
  const wrap = $('#unitPills');
  if (!wrap) return;
  wrap.innerHTML = '';
  data.units.forEach(u => {
    const b = document.createElement('button');
    b.textContent = u.name;
    b.className = (u.id === state.unit) ? 'active' : '';
    b.addEventListener('click', () => {
      state.unit = u.id;
      buildUnitPills(data);
      updateAll();
    });
    wrap.appendChild(b);
  });
  $('#currentUnitName') && ($('#currentUnitName').textContent = data.units.find(u => u.id === state.unit)?.name || '—');
}

/* ===== 7) RENDERERS ===== */

// Dashboard
function renderDashboard(data) {
  const unit = state.unit;
  const apptsToday = data.appts.filter(a => a.unit === unit && a.date === todayISO());
  $('#kpiToday') && ($('#kpiToday').textContent = apptsToday.length);
  const therapistsActive = new Set(apptsToday.map(a => a.therapistId)).size;
  $('#kpiActiveTherapists') && ($('#kpiActiveTherapists').textContent = therapistsActive);

  const todayAtt = data.attendance.filter(a => a.unit === unit && a.whenISO.startsWith(todayISO()));
  $('#kpiIns') && ($('#kpiIns').textContent = todayAtt.filter(a => a.action === 'in').length);
  $('#kpiOuts') && ($('#kpiOuts').textContent = todayAtt.filter(a => a.action === 'out').length);
  $('#kpiBreaks') && ($('#kpiBreaks').textContent = todayAtt.filter(a => a.action === 'break_start').length);

  const tbody = $('#tblNextAppts tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  apptsToday.sort((a, b) => a.time.localeCompare(b.time)).forEach(a => {
    const emp = data.employees.find(e => e.id === a.therapistId)?.name || '—';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${a.time}</td><td>${a.client}</td><td>${a.service}</td><td>${emp}</td><td>${a.room}</td>`;
    tbody.appendChild(tr);
  });
}

// Ponto (detalhe por unidade)
function renderAttendance(data) {
  const sel = $('#filterEmp');
  if (!sel) return;

  sel.innerHTML = '<option value="">Todos</option>';
  data.employees.filter(e => e.unit === state.unit).forEach(e => {
    const o = document.createElement('option');
    o.value = e.id; o.textContent = e.name;
    sel.appendChild(o);
  });

  const dateInput = $('#filterDate');
  if (dateInput) dateInput.value = todayISO();

  const draw = async () => {
    const emp = sel.value, date = dateInput.value;
    const tb = $('#tblPonto tbody'); if (!tb) return;
    tb.innerHTML = '';
    const rows = (await api.listAttendance(date))
      .filter(r => r.unit === state.unit && (!emp || r.empId === emp))
      .sort((a, b) => a.whenISO.localeCompare(b.whenISO));

    if (!rows.length) {
      tb.innerHTML = `<tr><td class="empty" colspan="5">Sem lançamentos para o dia.</td></tr>`;
      return;
    }

    rows.forEach(r => {
      const who = data.employees.find(e => e.id === r.empId)?.name || r.empId;
      const label = ({ in: 'Entrada', break_start: 'Início intervalo', break_end: 'Fim intervalo', out: 'Saída' })[r.action] || r.action;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fmtBR(r.whenISO)}</td>
        <td>${who}</td>
        <td>${label}</td>
        <td>${r.source}</td>
        <td><button class="btn ghost" data-del="${r.id}">Excluir</button></td>`;
      tb.appendChild(tr);
    });

    tb.querySelectorAll('button[data-del]').forEach(b => {
      b.onclick = async () => { await api.deleteAttendance(b.dataset.del); draw(); renderDashboard(load()); };
    });
  };

  sel.onchange = draw;
  dateInput.onchange = draw;
  $('#btnToday') && ($('#btnToday').onclick = () => { dateInput.value = todayISO(); draw(); });
  $('#btnNewEntry') && ($('#btnNewEntry').onclick = async () => {
    const emp = sel.value || (data.employees.find(e => e.unit === state.unit)?.id);
    if (!emp) { alert('Selecione um funcionário para lançar.'); return; }
    const action = prompt('Ação (in, break_start, break_end, out):', 'in');
    if (!action) return;
    await api.insertAttendance({ empId: emp, unit: state.unit, action });
    draw(); renderDashboard(load());
  });

  draw();
}

// Calendário (Unidade)
function renderCalendarUnit(data) {
  const tbody = $('#tblCalendarUnit tbody'); if (!tbody) return;
  const monthInput = $('#monthPickerUnit');
  if (!monthInput.value) monthInput.value = todayISO().slice(0, 7);
  const month = monthInput.value;

  const rows = data.calendar.filter(c => c.unit === state.unit && c.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date));

  tbody.innerHTML = '';
  if (!rows.length) {
    tbody.innerHTML = `<tr><td class="empty" colspan="3">Sem eventos no mês.</td></tr>`;
  } else {
    rows.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${c.date.split('-').reverse().join('/')}</td><td>${c.what}</td><td>${c.note || ''}</td>`;
      tbody.appendChild(tr);
    });
  }

  monthInput.onchange = () => renderCalendarUnit(load());
  $('#btnMonthTodayUnit') && ($('#btnMonthTodayUnit').onclick = () => {
    monthInput.value = todayISO().slice(0, 7);
    renderCalendarUnit(load());
  });
}

// Calendário (Anual)
function renderCalendarAnnual(data) {
  const tbody = $('#tblCalendarAnnual tbody'); if (!tbody) return;
  const monthInput = $('#monthPickerAnnual');
  if (!monthInput.value) monthInput.value = todayISO().slice(0, 7);
  const month = monthInput.value;

  const rows = data.calendar.filter(c => c.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date));

  tbody.innerHTML = '';
  if (!rows.length) {
    tbody.innerHTML = `<tr><td class="empty" colspan="3">Sem eventos.</td></tr>`;
  } else {
    rows.forEach(c => {
      const unit = data.units.find(u => u.id === c.unit)?.name || c.unit;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${c.date.split('-').reverse().join('/')}</td><td>${c.what} — ${unit}</td><td>${c.note || ''}</td>`;
      tbody.appendChild(tr);
    });
  }

  monthInput.onchange = () => renderCalendarAnnual(load());
  $('#btnMonthTodayAnnual') && ($('#btnMonthTodayAnnual').onclick = () => {
    monthInput.value = todayISO().slice(0, 7);
    renderCalendarAnnual(load());
  });
}

// Funcionários
function renderEmployees(data) {
  const tbody = $('#tblEmployees tbody'); if (!tbody) return;
  const roleFilter = $('#roleFilter');
  const rows = data.employees.filter(e => e.unit === state.unit && (!roleFilter.value || e.role === roleFilter.value));

  tbody.innerHTML = '';
  if (!rows.length) {
    tbody.innerHTML = `<tr><td class="empty" colspan="6">Nenhum funcionário listado.</td></tr>`;
  } else {
    rows.forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${e.name}</td>
        <td>${e.role}</td>
        <td>${data.units.find(u => u.id === e.unit)?.name || e.unit}</td>
        <td>${e.phone || ''}</td>
        <td>${e.active ? 'Ativo' : 'Inativo'}</td>
        <td><button class="btn ghost" data-toggle="${e.id}">${e.active ? 'Desativar' : 'Ativar'}</button></td>`;
      tbody.appendChild(tr);
    });
  }

  tbody.querySelectorAll('button[data-toggle]').forEach(b => {
    b.onclick = () => {
      const emp = data.employees.find(x => x.id === b.dataset.toggle);
      emp.active = !emp.active; save(data); renderEmployees(load());
    };
  });

  $('#btnAddEmp') && ($('#btnAddEmp').onclick = () => {
    const name = prompt('Nome do funcionário:'); if (!name) return;
    const role = prompt('Papel (massagista/recepcao/admin):', 'massagista') || 'massagista';
    const phone = prompt('Telefone:', '(11) 9xxxx-xxxx') || '';
    data.employees.push({ id: 'E' + (Math.random().toString(36).slice(2, 6)), name, role, unit: state.unit, phone, active: true });
    save(data); renderEmployees(load());
  });

  roleFilter.onchange = () => renderEmployees(load());
}

// Contatos
function renderContacts(data) {
  const tbody = $('#tblContacts tbody'); if (!tbody) return;
  tbody.innerHTML = '';
  data.units.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.name}</td><td>${u.address}</td><td><a href="https://wa.me/${u.whatsapp.replace(/\D/g, '')}" target="_blank" style="color:#fff">${u.whatsapp}</a></td><td>${u.manager}</td>`;
    tbody.appendChild(tr);
  });
}

// Clientes
function renderClients(data) {
  const tbody = $('#tblClients tbody'); if (!tbody) return;
  const q = ($('#clientSearch')?.value || '').toLowerCase();
  const month = ($('#clientBirthMonth')?.value || ''); // YYYY-MM

  let list = (data.clients || []).slice();
  if (q) list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  if (month) {
    const m = month.split('-')[1];
    list = list.filter(c => (c.birthday || '').slice(5, 7) === m);
  }

  tbody.innerHTML = '';
  if (!list.length) {
    tbody.innerHTML = `<tr><td class="empty" colspan="3">Nenhum cliente encontrado.</td></tr>`;
  } else {
    list.forEach(c => {
      const tr = document.createElement('tr');
      const bday = c.birthday ? c.birthday.split('-').reverse().join('/') : '—';
      tr.innerHTML = `<td>${c.name}</td><td>${c.email}</td><td>${bday}</td>`;
      tbody.appendChild(tr);
    });
  }
}

/* ===== 8) MASTER – Pontos Eletrônicos (consolidado) ===== */
async function renderMasterPontos(data) {
  const date = $('#filterDateMaster')?.value || todayISO();
  const tbody = $('#tblMasterPontos tbody'); if (!tbody) return;
  tbody.innerHTML = '';

  const rows = (await api.listAttendance(date)).sort((a, b) => a.whenISO.localeCompare(b.whenISO));

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">Nenhum registro encontrado para ${date.split('-').reverse().join('/')}</td></tr>`;
    return;
  }

  rows.forEach(r => {
    const emp = data.employees.find(e => e.id === r.empId)?.name || '—';
    const unit = data.units.find(u => u.id === r.unit)?.name || '—';
    const label = ({ in: 'Entrada', break_start: 'Início Intervalo', break_end: 'Fim Intervalo', out: 'Saída' })[r.action] || r.action;

    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${emp}</td><td>${label}</td><td>${fmtBR(r.whenISO)}</td><td>${unit}</td>`;
    tbody.appendChild(tr);
  });
}

/* ===== 9) GENERIC HELPERS ===== */
function setEmpty(tableId, text) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = `<tr><td class="empty" colspan="6">${text}</td></tr>`;
}

function updateAll() {
  const data = load();
  $('#currentUnitName') && ($('#currentUnitName').textContent = data.units.find(u => u.id === state.unit)?.name || '—');
  renderDashboard(data);

  // Se a view atual for uma dessas, atualiza também
  const activeView = localStorage.getItem('activeView');
  if (activeView === 'attendance') renderAttendance(data);
  if (activeView === 'calendar-unit') renderCalendarUnit(data);
  if (activeView === 'calendar-annual') renderCalendarAnnual(data);
  if (activeView === 'employees') renderEmployees(data);
  if (activeView === 'contacts') renderContacts(data);
  if (activeView === 'clients') renderClients(data);
  if (activeView === 'pontos') renderMasterPontos(data);
}

/* ===== 10) INIT ALL ===== */
document.addEventListener('DOMContentLoaded', () => {
  const data = load();

  // role chip & perms (se precisar esconder menus)
  $('#roleChip') && ($('#roleChip').textContent = state.role.charAt(0).toUpperCase() + state.role.slice(1));

  // unit pills
  buildUnitPills(data);

  // router
  setupRouter();

  // dashboard first paint
  renderDashboard(data);

  // contatos quick paint
  renderContacts(data);

  // empty states iniciais (caso algo demore)
  setEmpty('tblNextAppts', 'Sem atendimentos programados.');
  setEmpty('tblPonto', 'Sem lançamentos para o dia.');
  setEmpty('tblCalendarUnit', 'Sem eventos no mês.');
  setEmpty('tblCalendarAnnual', 'Sem eventos.');
  setEmpty('tblEmployees', 'Nenhum funcionário listado.');
  setEmpty('tblContacts', 'Nenhum contato cadastrado.');
  // clientes
  if ($('#tblClients')) renderClients(data);

  // Botões globais
  $('#btnWipe') && ($('#btnWipe').addEventListener('click', () => {
    if (confirm('Apagar dados locais do Master?')) {
      localStorage.removeItem(KEY);
      location.reload();
    }
  }));

  // Master Pontos – filtros
  $('#btnTodayMaster') && ($('#btnTodayMaster').addEventListener('click', () => {
    const fd = $('#filterDateMaster'); if (fd) fd.value = todayISO();
    renderMasterPontos(load());
  }));
  $('#filterDateMaster') && ($('#filterDateMaster').addEventListener('change', () => renderMasterPontos(load())));

  // Clientes – filtros
  $('#clientSearch') && ($('#clientSearch').addEventListener('input', () => renderClients(load())));
  $('#clientBirthMonth') && ($('#clientBirthMonth').addEventListener('change', () => renderClients(load())));
  $('#clientClearFilters') && ($('#clientClearFilters').addEventListener('click', () => {
    const s = $('#clientSearch'); const m = $('#clientBirthMonth');
    if (s) s.value = ''; if (m) m.value = ''; renderClients(load());
  }));
});
