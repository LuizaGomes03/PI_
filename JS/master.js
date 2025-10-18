/* === FIX: vídeo de fundo não bloqueia cliques === */
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

  const app = document.querySelector('.app');
  if (app) {
    app.style.position = 'relative';
    app.style.zIndex = '1';
  }
});

/* ================== DATA MOCK / STORAGE ================== */
const db = {
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
    attendance: [],
    appts: [
        { unit: 'U01', date: '2025-10-13', time: '09:00', client: 'Ana', service: 'Shiatsu 50min', therapistId: 'E01', room: 'Sala 2' },
        { unit: 'U01', date: '2025-10-13', time: '10:10', client: 'Bruno', service: 'Liberação miofascial', therapistId: 'E01', room: 'Sala 1' },
        { unit: 'U01', date: '2025-10-13', time: '15:30', client: 'Diego', service: 'Ventosaterapia', therapistId: 'E02', room: 'Sala 2' },
        { unit: 'U02', date: '2025-10-13', time: '11:00', client: 'Erika', service: 'Reflexologia', therapistId: 'E04', room: 'Sala 1' },
    ],
    calendar: [
        { unit: 'U01', date: '2025-10-12', what: 'Feriado', note: 'Nossa Senhora Aparecida' },
        { unit: 'U01', date: '2025-10-20', what: 'Férias', note: 'Luly OFF (20-24)' },
        { unit: 'U02', date: '2025-10-21', what: 'Manutenção', note: 'Troca do ar sala 3' },
    ]
};
const KEY = 'rokuzen.master';
function load() { return JSON.parse(localStorage.getItem(KEY) || 'null') || seed(); }
function seed() { localStorage.setItem(KEY, JSON.stringify(db)); return JSON.parse(localStorage.getItem(KEY)); }
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

/* ================== STATE ================== */
let state = {
    role: 'admin',
    unit: 'U01'
};

/* ================== HELPERS ================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmtBR = (iso) => new Date(iso).toLocaleString('pt-BR', { hour12: false });
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowISO = () => new Date().toISOString();

/* ================== UI BINDINGS ================== */
function buildUnitPills(data) {
    const wrap = $('#unitPills'); wrap.innerHTML = '';
    data.units.forEach(u => {
        const b = document.createElement('button');
        b.textContent = u.name;
        b.className = (u.id === state.unit) ? 'active' : '';
        b.addEventListener('click', () => { state.unit = u.id; buildUnitPills(data); updateAll(); });
        wrap.appendChild(b);
    });
    $('#currentUnitName').textContent = data.units.find(u => u.id === state.unit)?.name || '—';
}

function navTo(view) {
    $$('.sb-link').forEach(a => a.classList.toggle('active', a.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
}

/* ================== VIEWS ================== */
function renderDashboard(data) {
    const unit = state.unit;
    const apptsToday = data.appts.filter(a => a.unit === unit && a.date === todayISO());
    $('#kpiToday').textContent = apptsToday.length;
    const therapistsActive = new Set(apptsToday.map(a => a.therapistId)).size;
    $('#kpiActiveTherapists').textContent = therapistsActive;

    const todayAtt = data.attendance.filter(a => a.unit === unit && a.whenISO.startsWith(todayISO()));
    $('#kpiIns').textContent = todayAtt.filter(a => a.action === 'in').length;
    $('#kpiOuts').textContent = todayAtt.filter(a => a.action === 'out').length;
    $('#kpiBreaks').textContent = todayAtt.filter(a => a.action === 'break_start').length;

    const tbody = $('#tblNextAppts tbody'); tbody.innerHTML = '';
    apptsToday.sort((a, b) => a.time.localeCompare(b.time)).forEach(a => {
        const emp = data.employees.find(e => e.id === a.therapistId)?.name || '—';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.time}</td><td>${a.client}</td><td>${a.service}</td><td>${emp}</td><td>${a.room}</td>`;
        tbody.appendChild(tr);
    });
}

function renderAttendance(data) {
    const sel = $('#filterEmp'); sel.innerHTML = '<option value="">Todos</option>';
    data.employees.filter(e => e.unit === state.unit).forEach(e => {
        const o = document.createElement('option'); o.value = e.id; o.textContent = e.name; sel.appendChild(o);
    });
    $('#filterDate').value = todayISO();

    const draw = () => {
        const emp = sel.value, date = $('#filterDate').value;
        const tbody = $('#tblPonto tbody'); tbody.innerHTML = '';
        const rows = data.attendance
            .filter(r => r.unit === state.unit && r.whenISO.startsWith(date) && (!emp || r.empId === emp))
            .sort((a, b) => a.whenISO.localeCompare(b.whenISO));
        rows.forEach(r => {
            const who = data.employees.find(e => e.id === r.empId)?.name || r.empId;
            const label = ({ in: 'Entrada', break_start: 'Início intervalo', break_end: 'Fim intervalo', out: 'Saída' })[r.action] || r.action;
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${fmtBR(r.whenISO)}</td><td>${who}</td><td>${label}</td><td>${r.source}</td>
              <td><button class="btn ghost" data-del="${r.id}">Excluir</button></td>`;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll('button[data-del]').forEach(b => {
            b.onclick = () => { data.attendance = data.attendance.filter(x => x.id !== b.dataset.del); save(data); draw(); renderDashboard(data); };
        });
    };

    sel.onchange = draw; $('#filterDate').onchange = draw;
    $('#btnToday').onclick = () => { $('#filterDate').value = todayISO(); draw(); };

    $('#btnNewEntry').onclick = () => {
        const emp = sel.value || (data.employees.find(e => e.unit === state.unit)?.id);
        if (!emp) { alert('Selecione um funcionário para lançar.'); return; }
        const action = prompt('Ação (in, break_start, break_end, out):', 'in');
        if (!action) return;
        data.attendance.push({ id: Math.random().toString(36).slice(2), empId: emp, unit: state.unit, whenISO: nowISO(), action, source: 'manual' });
        save(data); draw(); renderDashboard(data);
    };

    draw();
}

function renderCalendar(data) {
    const tbody = $('#tblCalendar tbody'); tbody.innerHTML = '';
    const monthInput = $('#monthPicker');
    if (!monthInput.value) monthInput.value = todayISO().slice(0, 7);
    const month = monthInput.value;
    const rows = data.calendar.filter(c => c.unit === state.unit && c.date.startsWith(month))
        .sort((a, b) => a.date.localeCompare(b.date));
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="3" style="opacity:.8">Sem eventos no mês.</td></tr>`; return; }
    rows.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c.date.split('-').reverse().join('/')}</td><td>${c.what}</td><td>${c.note || ''}</td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('monthPicker').onchange = () => renderCalendar(data);
    document.getElementById('btnMonthToday').onclick = () => {
        document.getElementById('monthPicker').value = todayISO().slice(0, 7);
        renderCalendar(data);
    };
}

function renderEmployees(data) {
    const tbody = $('#tblEmployees tbody'); tbody.innerHTML = '';
    const roleFilter = $('#roleFilter');
    const rows = data.employees.filter(e => e.unit === state.unit && (!roleFilter.value || e.role === roleFilter.value));
    rows.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${e.name}</td><td>${e.role}</td><td>${data.units.find(u => u.id === e.unit)?.name || e.unit}</td>
            <td>${e.phone || ''}</td><td>${e.active ? 'Ativo' : 'Inativo'}</td>
            <td><button class="btn ghost" data-toggle="${e.id}">${e.active ? 'Desativar' : 'Ativar'}</button></td>`;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('button[data-toggle]').forEach(b => {
        b.onclick = () => { const id = b.dataset.toggle; const emp = data.employees.find(x => x.id === id); emp.active = !emp.active; save(data); renderEmployees(load()); };
    });
    $('#btnAddEmp').onclick = () => {
        const name = prompt('Nome do funcionário:'); if (!name) return;
        const role = prompt('Papel (massagista/recepcao/admin):', 'massagista') || 'massagista';
        const phone = prompt('Telefone:', '(11) 9xxxx-xxxx') || '';
        data.employees.push({ id: 'E' + (Math.random().toString(36).slice(2, 6)), name, role, unit: state.unit, phone, active: true });
        save(data); renderEmployees(load());
    };
    roleFilter.onchange = () => renderEmployees(load());
}

function renderContacts(data) {
    const tbody = $('#tblContacts tbody'); tbody.innerHTML = '';
    data.units.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${u.name}</td><td>${u.address}</td><td><a href="https://wa.me/${u.whatsapp.replace(/\D/g, '')}" target="_blank" style="color:#fff">${u.whatsapp}</a></td><td>${u.manager}</td>`;
        tbody.appendChild(tr);
    });
}

/* ================== ROLE-BASED PERMS ================== */
function applyRoleUI() {
    const role = state.role;
    $('#roleChip').textContent = role.charAt(0).toUpperCase() + role.slice(1);
    const hideSettings = (role !== 'admin');
    $$('[data-view="settings"]').forEach(a => a.style.display = hideSettings ? 'none' : 'flex');
    const hideOps = (role === 'massagista');
    $$('[data-view="employees"], [data-view="attendance"]').forEach(a => a.style.display = hideOps ? 'none' : 'flex');
}

/* ================== INIT ================== */
const data = load();

// 1) roteador de views + persistência
const links = Array.from(document.querySelectorAll('.sb-link'));
const views = Array.from(document.querySelectorAll('.view'));

function setActiveView(id){
  views.forEach(v => v.classList.toggle('active', v.id === id));
  links.forEach(b => b.setAttribute('aria-selected', b.dataset.view === id ? 'true' : 'false'));
  localStorage.setItem('activeView', id);
}
links.forEach(b=>{
  b.setAttribute('role','tab');
  b.addEventListener('click', ()=> setActiveView(b.dataset.view));
});
document.querySelector('.sb-block').setAttribute('role','tablist');
setActiveView(localStorage.getItem('activeView') || 'view-dashboard');

// 2) reduced motion pro vídeo
const vid = document.getElementById('bg-video');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
function handleMotion(){ if(prefersReduced.matches){ vid.pause(); vid.removeAttribute('autoplay'); } }
prefersReduced.addEventListener?.('change', handleMotion);
handleMotion();

// 3) helpers de “Hoje / Mês atual”
const btnToday = document.getElementById('btnToday');
if(btnToday){
  btnToday.addEventListener('click', ()=>{
    const d = new Date().toISOString().slice(0,10);
    const input = document.getElementById('filterDate');
    if(input){ input.value = d; /* renderPonto(); */ }
  });
}
const monthTodayHook = (btnId, inputId) =>{
  const btn = document.getElementById(btnId), input = document.getElementById(inputId);
  if(btn && input){ btn.addEventListener('click', ()=>{
    const now = new Date();
    input.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    /* renderCalendario(); */
  });}
};
monthTodayHook('btnMonthTodayUnit', 'monthPickerUnit');
monthTodayHook('btnMonthTodayAnnual', 'monthPickerAnnual');

// 4) empty state exemplos
function setEmpty(tableId, text){
  const tbody = document.querySelector(`#${tableId} tbody`);
  if(!tbody) return;
  tbody.innerHTML = `<tr><td class="empty" colspan="6">${text}</td></tr>`;
}
setEmpty('tblNextAppts','Sem atendimentos programados.');
setEmpty('tblPonto','Sem lançamentos para o dia.');
setEmpty('tblCalendarUnit','Sem eventos no mês.');
setEmpty('tblCalendarAnnual','Sem eventos.');
setEmpty('tblEmployees','Nenhum funcionário listado.');
setEmpty('tblContacts','Nenhum contato cadastrado.');

/* 5) login rápido (habilita somente se mudar) */
const roleSelect = document.getElementById('roleSelect');
const applyRole = document.getElementById('applyRole');
if(roleSelect && applyRole){
  const baseline = roleSelect.value;
  const refresh = ()=> applyRole.disabled = (roleSelect.value === baseline);
  roleSelect.addEventListener('change', refresh);
  refresh();
}

// ===== Configurações: sub-abas =====
(function setupSettingsTabs(){
  const root = document.getElementById('view-settings');
  if(!root) return;
  const tabs = root.querySelectorAll('.tab');
  const panels = root.querySelectorAll('.tabpanel');
  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      tabs.forEach(x=>{ x.classList.remove('active'); x.setAttribute('aria-selected','false'); });
      panels.forEach(p=>p.classList.remove('active'));
      t.classList.add('active'); t.setAttribute('aria-selected','true');
      root.querySelector('#tab-' + t.dataset.tab)?.classList.add('active');
      localStorage.setItem('settingsSubtab', t.dataset.tab);
    });
  });
  const saved = localStorage.getItem('settingsSubtab');
  if(saved){
    root.querySelector(`.tab[data-tab="${saved}"]`)?.click();
  }
})();

// ===== Mock: unidades / usuários / serviços (exemplo)
const mockUnits = [
  { id:'golden', nome:'Golden Square Shopping', endereco:'Av. Kennedy, 700', wa:'(11) 94749-5306', funcionamento:'Seg-Dom 10h–22h' },
  { id:'mooca', nome:'Mooca Plaza Shopping', endereco:'R. Cap. Pacheco e Chaves, 313', wa:'(11) 95084-1087', funcionamento:'Seg-Dom 10h–22h' },
  { id:'grand', nome:'Grand Plaza Shopping', endereco:'Av. Industrial, 600', wa:'(11) 91665-7900', funcionamento:'Seg-Dom 10h–22h' },
  { id:'west', nome:'Shopping West Plaza', endereco:'Av. Francisco Matarazzo', wa:'(11) 91942-7901', funcionamento:'Seg-Dom 10h–22h' },
];
const mockUsers = [
  { nome:'Luiza Gomes', papel:'admin', unidade:'Rede', tel:'(11) 99999-0000', status:'ativo' },
  { nome:'Giovanna Lima', papel:'gerente', unidade:'Mooca Plaza', tel:'(11) 98888-0000', status:'ativo' },
  { nome:'Thales Souza', papel:'recepcao', unidade:'Golden Square', tel:'(11) 97777-0000', status:'ativo' },
  { nome:'João Silva', papel:'massagista', unidade:'Grand Plaza', tel:'(11) 96666-0000', status:'inativo' },
];
const mockServices = [
  { nome:'Quick Massage', dur:'20 min', preco:53, pts:1, ativo:true },
  { nome:'Relaxante 50', dur:'50 min', preco:159, pts:3, ativo:true },
  { nome:'Terapêutica 80', dur:'80 min', preco:239, pts:4, ativo:true },
];

// ===== Render helpers =====
function renderUnits(){
  const tb = document.querySelector('#tblUnits tbody'); if(!tb) return;
  const q = (document.getElementById('unitSearch')?.value || '').toLowerCase();
  const list = mockUnits.filter(u => !q || u.nome.toLowerCase().includes(q));
  tb.innerHTML = list.length ? list.map(u=>`
    <tr>
      <td>${u.nome}</td>
      <td>${u.endereco}</td>
      <td>${u.wa}</td>
      <td>${u.funcionamento}</td>
      <td class="ta-r">
        <button class="btn ghost btn-sm" data-edit-unit="${u.id}" type="button"><i class="fa-solid fa-pen"></i></button>
        <button class="btn ghost btn-sm" data-del-unit="${u.id}" type="button"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('') : `<tr><td class="empty" colspan="5">Sem unidades</td></tr>`;
}
function renderUsers(){
  const tb = document.querySelector('#tblUsers tbody'); if(!tb) return;
  const role = document.getElementById('filterRole')?.value || '';
  const unit = document.getElementById('filterUnit')?.value || '';
  let list = mockUsers.slice();
  if(role) list = list.filter(u=>u.papel===role);
  if(unit) list = list.filter(u=>u.unidade===unit);
  tb.innerHTML = list.length ? list.map(u=>`
    <tr>
      <td>${u.nome}</td>
      <td>${u.papel}</td>
      <td>${u.unidade}</td>
      <td>${u.tel}</td>
      <td>${u.status}</td>
      <td class="ta-r">
        <button class="btn ghost btn-sm" data-edit-user="${u.nome}" type="button"><i class="fa-solid fa-pen"></i></button>
        <button class="btn ghost btn-sm" data-toggle-user="${u.nome}" type="button"><i class="fa-solid fa-user-lock"></i></button>
      </td>
    </tr>`).join('') : `<tr><td class="empty" colspan="6">Nenhum usuário</td></tr>`;
}
function renderServices(){
  const tb = document.querySelector('#tblServices tbody'); if(!tb) return;
  tb.innerHTML = mockServices.length ? mockServices.map(s=>`
    <tr>
      <td>${s.nome}</td>
      <td>${s.dur}</td>
      <td>${s.preco.toFixed(2)}</td>
      <td>${s.pts}</td>
      <td>${s.ativo ? 'Sim' : 'Não'}</td>
      <td class="ta-r">
        <button class="btn ghost btn-sm" data-edit-service="${s.nome}" type="button"><i class="fa-solid fa-pen"></i></button>
        <button class="btn ghost btn-sm" data-del-service="${s.nome}" type="button"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('') : `<tr><td class="empty" colspan="6">Nenhum serviço cadastrado</td></tr>`;
}
function fillUnitFilter(){
  const sel = document.getElementById('filterUnit'); if(!sel) return;
  sel.innerHTML = `<option value="">Todas as unidades</option>` + mockUnits.map(u=>`<option>${u.nome}</option>`).join('');
}

// ===== Bind inicial
(function initSettings(){
  renderUnits(); renderUsers(); renderServices(); fillUnitFilter();
  document.getElementById('unitSearch')?.addEventListener('input', renderUnits);
  document.getElementById('filterRole')?.addEventListener('change', renderUsers);
  document.getElementById('filterUnit')?.addEventListener('change', renderUsers);

  // ações (stub)
  document.getElementById('btnAddUnit')?.addEventListener('click', ()=>alert('Abrir modal: Nova Unidade'));
  document.getElementById('btnInviteUser')?.addEventListener('click', ()=>alert('Abrir modal: Convidar Usuário'));
  document.getElementById('btnAddService')?.addEventListener('click', ()=>alert('Abrir modal: Novo Serviço'));

  document.getElementById('saveOrg')?.addEventListener('click', ()=>alert('Organização salva ✅'));
  document.getElementById('saveNotify')?.addEventListener('click', ()=>alert('Notificações salvas ✅'));
  document.getElementById('saveSecurity')?.addEventListener('click', ()=>alert('Segurança salva ✅'));

  document.getElementById('btnExportData')?.addEventListener('click', ()=>alert('Export iniciada…'));
  document.getElementById('btnAnonymize')?.addEventListener('click', ()=>alert('Anonimização solicitada…'));
  document.getElementById('btnAuditLog')?.addEventListener('click', ()=>alert('Abrir Log de Auditoria'));
})();
applyRoleUI();
buildUnitPills(data);
renderDashboard(data);
renderContacts(data);

$$('.sb-link').forEach(a => {
    a.addEventListener('click', () => {
        const view = a.dataset.view;
        navTo(view);
        if (view === 'attendance') renderAttendance(load());
        if (view === 'calendar') renderCalendar(load());
        if (view === 'employees') renderEmployees(load());
        if (view === 'contacts') renderContacts(load());
    });
});

$('#btnWipe')?.addEventListener('click', () => {
    if (confirm('Apagar dados locais do Master?')) {
        localStorage.removeItem(KEY);
        location.reload();
    }
});