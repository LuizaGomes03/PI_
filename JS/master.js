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

$$('.sb-link').forEach(a => {
    a.addEventListener('click', (e) => { e.preventDefault(); navTo(a.dataset.view); });
});

$('#applyRole')?.addEventListener('click', () => {
    state.role = $('#roleSelect').value;
    applyRoleUI();
    if (state.role === 'massagista') navTo('dashboard');
    updateAll();
});

function updateAll() {
    const d = load();
    buildUnitPills(d);
    renderDashboard(d);
    if ($('#view-attendance')?.classList.contains('active')) renderAttendance(d);
    if ($('#view-calendar')?.classList.contains('active')) renderCalendar(d);
    if ($('#view-employees')?.classList.contains('active')) renderEmployees(d);
    if ($('#view-contacts')?.classList.contains('active')) renderContacts(d);
}

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