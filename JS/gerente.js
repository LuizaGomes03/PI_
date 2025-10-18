/* ===============================
   Rokuzen • gerente.js (clean)
   - Navegação por tabs (sidebar)
   - KPI do dashboard
   - Stubs de Clientes, Agenda, Ponto, Equipe
   - Relatórios/Auditoria básicos
   - Persistência leve via localStorage
================================ */

/* ===== BG video + prefers-reduced-motion ===== */
window.addEventListener('DOMContentLoaded', () => {
  const vid = document.getElementById('bg-video');
  if (vid) {
    Object.assign(vid.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100%',
      objectFit: 'cover', zIndex: '-1', pointerEvents: 'none'
    });
    const m = matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => { if (m.matches) { vid.pause(); vid.removeAttribute('autoplay'); } };
    m.addEventListener?.('change', stop); stop();
  }
});

/* ===== Utils ===== */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const todayISO = () => new Date().toISOString().slice(0,10);
const nowISO   = () => new Date().toISOString();
const fmtBR    = (iso) => new Date(iso).toLocaleString('pt-BR', { hour12:false });

/* ===== Mock + Storage ===== */
const KEY = 'rokuzen.gerente.v1';
const seedDB = {
  unit: { id:'U02', name:'Mooca Plaza' },
  employees: [
    { id:'E01', name:'Luly', role:'massagista', phone:'(11) 90000-1111', active:true },
    { id:'E02', name:'Vera', role:'massagista', phone:'(11) 90000-2222', active:true },
    { id:'E03', name:'Rafa', role:'recepcao',   phone:'(11) 90000-3333', active:true },
  ],
  clients: [
    { id:'C01', name:'Ana Lima', wa:'(11) 9 8888-0001', email:'ana@email.com' },
    { id:'C02', name:'Bruno Alves', wa:'(11) 9 8888-0002', email:'bruno@email.com' },
  ],
  appts: [
    { id:'A01', date: todayISO(), time:'09:00', client:'Ana Lima', service:'Quick Massage', therapistId:'E01', room:'1' },
    { id:'A02', date: todayISO(), time:'10:30', client:'Bruno Alves', service:'Relaxante 50', therapistId:'E02', room:'2' },
  ],
  attendance: [
    { id:'P01', whenISO: nowISO(), empId:'E03', action:'in', source:'recepcao' },
  ]
};
const load = () => JSON.parse(localStorage.getItem(KEY) || 'null') || (localStorage.setItem(KEY, JSON.stringify(seedDB)), seedDB);
const save = (db) => localStorage.setItem(KEY, JSON.stringify(db));
let db = load();

/* ===== State ===== */
const state = {
  activeView: localStorage.getItem('gerente.activeView') || 'view-dashboard',
  role: 'admin',
};

/* ===== Navigation (sidebar) ===== */
function setupSideNav(){
  const buttons = $$('.side-nav .nav-btn');
  const views   = $$('.view');
  const setActive = (viewId) => {
    views.forEach(v => v.classList.toggle('is-active', v.id === viewId));
    buttons.forEach(b => b.classList.toggle('is-active', 'view-' + b.dataset.view === viewId));
    localStorage.setItem('gerente.activeView', viewId);
    state.activeView = viewId;
  };
  buttons.forEach(b => b.addEventListener('click', () => setActive('view-' + b.dataset.view)));
  setActive(state.activeView);
}

/* ===== Header ===== */
function renderHead(){
  const el = $('#currentUnitName');
  if (el) el.textContent = db.unit?.name || '—';
  const chip = $('#roleChip');
  if (chip) chip.textContent = state.role.charAt(0).toUpperCase() + state.role.slice(1);
}

/* ===== Dashboard ===== */
function renderDashboard(){
  const apptsToday = db.appts.filter(a => a.date === todayISO());
  $('#kpiToday') && ($('#kpiToday').textContent = apptsToday.length);
  const activeTherapists = new Set(apptsToday.map(a => a.therapistId)).size;
  $('#kpiActiveTherapists') && ($('#kpiActiveTherapists').textContent = activeTherapists);
  const todayAtt = db.attendance.filter(a => a.whenISO.startsWith(todayISO()));
  $('#kpiIns')    && ($('#kpiIns').textContent    = todayAtt.filter(a => a.action==='in').length);
  $('#kpiOuts')   && ($('#kpiOuts').textContent   = todayAtt.filter(a => a.action==='out').length);
  $('#kpiBreaks') && ($('#kpiBreaks').textContent = todayAtt.filter(a => a.action==='break_start').length);

  const tb = $('#tblNextAppts .table__body') || $('#tblNextAppts tbody');
  if (!tb) return;
  tb.innerHTML = '';
  apptsToday.sort((a,b)=>a.time.localeCompare(b.time)).forEach(a=>{
    const emp = db.employees.find(e=>e.id===a.therapistId)?.name || '—';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${a.time}</td><td>${a.client}</td><td>${a.service}</td><td>${emp}</td><td>${a.room}</td>`;
    tb.appendChild(tr);
  });
  if (!apptsToday.length) tb.innerHTML = `<tr><td class="empty" colspan="5">Sem atendimentos programados.</td></tr>`;
}

/* ===== Clientes (stub) ===== */
function renderClients(){
  const tb = $('#tblClients .table__body') || $('#tblClients tbody'); if (!tb) return;
  const q = ($('#searchClient')?.value || '').toLowerCase();
  const list = db.clients.filter(c => !q || c.name.toLowerCase().includes(q));
  tb.innerHTML = list.length ? list.map(c=>`
    <tr>
      <td>${c.name}</td>
      <td>${c.wa}</td>
      <td>${c.email}</td>
      <td class="ta-r"><button class="btn btn--ghost" data-edit-client="${c.id}"><i class="fa-solid fa-pen"></i></button></td>
    </tr>`).join('') : `<tr><td class="empty" colspan="4">Sem clientes</td></tr>`;
}

/* ===== Agenda (stub) ===== */
function renderAgenda(){
  const tb = $('#tblAgenda .table__body') || $('#tblAgenda tbody'); if (!tb) return;
  const d = $('#agendaDate'); if (d && !d.value) d.value = todayISO();
  const date = d?.value || todayISO();
  const list = db.appts.filter(a=>a.date===date).sort((a,b)=>a.time.localeCompare(b.time));
  tb.innerHTML = list.length ? list.map(a=>{
    const emp = db.employees.find(e=>e.id===a.therapistId)?.name || '—';
    return `<tr>
      <td>${a.time}</td><td>${a.client}</td><td>${a.service}</td><td>${emp}</td><td>${a.room}</td>
      <td class="ta-r"><button class="btn btn--ghost" data-del-appt="${a.id}"><i class="fa-solid fa-trash"></i></button></td>
    </tr>`;
  }).join('') : `<tr><td class="empty" colspan="6">Sem agendamentos para o dia.</td></tr>`;
}

/* ===== Ponto ===== */
function renderAttendance(){
  const sel = $('#filterEmp'); if (!sel) return;
  sel.innerHTML = '<option value="">Todos</option>' + db.employees.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
  const dateInput = $('#filterDate'); if (dateInput && !dateInput.value) dateInput.value = todayISO();
  const draw = () => {
    const date = dateInput?.value || todayISO();
    const empId = sel.value;
    const rows = db.attendance
      .filter(r => r.whenISO.startsWith(date) && (!empId || r.empId===empId))
      .sort((a,b)=>a.whenISO.localeCompare(b.whenISO));
    const tb = $('#tblPonto .table__body') || $('#tblPonto tbody'); if (!tb) return;
    tb.innerHTML = rows.length ? rows.map(r=>{
      const who = db.employees.find(e=>e.id===r.empId)?.name || r.empId;
      const label = ({in:'Entrada', break_start:'Início intervalo', break_end:'Fim intervalo', out:'Saída'})[r.action] || r.action;
      return `<tr>
        <td>${fmtBR(r.whenISO)}</td><td>${who}</td><td>${label}</td><td>${r.source}</td>
        <td class="ta-r"><button class="btn btn--ghost" data-del-att="${r.id}">Excluir</button></td>
      </tr>`;
    }).join('') : `<tr><td class="empty" colspan="5">Sem lançamentos para o dia.</td></tr>`;
  };
  $('#btnToday')?.addEventListener('click', ()=>{ if(dateInput){ dateInput.value = todayISO(); draw(); } });
  $('#btnNewEntry')?.addEventListener('click', ()=>{
    const emp = sel.value || db.employees[0]?.id; if(!emp) return alert('Sem funcionários.');
    const action = prompt('Ação (in, break_start, break_end, out):', 'in'); if(!action) return;
    db.attendance.push({ id: Math.random().toString(36).slice(2), empId: emp, whenISO: nowISO(), action, source:'manual' });
    save(db); draw(); renderDashboard();
  });
  $('#filterEmp')?.addEventListener('change', draw);
  $('#filterDate')?.addEventListener('change', draw);
  draw();
}

/* ===== Equipe ===== */
function renderEmployees(){
  const tb = $('#tblEmployees .table__body') || $('#tblEmployees tbody'); if (!tb) return;
  const role = $('#roleFilter')?.value || '';
  const list = db.employees.filter(e => !role || e.role===role);
  tb.innerHTML = list.length ? list.map(e=>`
    <tr>
      <td>${e.name}</td><td>${e.role}</td><td>${db.unit.name}</td><td>${e.phone}</td><td>${e.active?'Ativo':'Inativo'}</td>
      <td class="ta-r"><button class="btn btn--ghost" data-toggle-emp="${e.id}">${e.active?'Desativar':'Ativar'}</button></td>
    </tr>`).join('') : `<tr><td class="empty" colspan="6">Nenhum funcionário listado.</td></tr>`;
}

/* ===== Relatórios ===== */
function setupReports(){
  const out = $('#reportOut');
  $('#btnMakeReport')?.addEventListener('click', ()=>{
    const m = $('#reportMonth')?.value; if(!m) return out && (out.textContent = 'Escolha um mês.');
    const items = db.appts.filter(a => a.date.startsWith(m));
    const pontos = items.reduce((acc,a)=> acc + (a.service.includes('Quick')?1: a.service.includes('50')?3: a.service.includes('80')?4:1), 0);
    const text = `Mês ${m}: ${items.length} atendimentos • Pontos estimados: ${pontos}`;
    if(out) out.textContent = text;
  });
}

/* ===== Auditoria (stub) ===== */
function setupAudit(){
  const tb = $('#tblAudit tbody'); const tQtd = $('#audTotalQtd'); const tR$ = $('#audTotalReceita'); const tPts = $('#audTotalPontos');
  $('#btnMakeAudit')?.addEventListener('click', ()=>{
    const base = $('#auditDate')?.value || todayISO();
    const period = $('#auditPeriod')?.value || 'dia';
    // janela simples
    const start = new Date(base);
    const end = new Date(base);
    if (period==='semana') end.setDate(start.getDate()+6);
    if (period==='mes')   end.setMonth(start.getMonth()+1);
    const toISO = (d)=> d.toISOString().slice(0,10);
    const rows = db.appts.filter(a => a.date >= toISO(start) && a.date <= toISO(end))
      .sort((a,b)=> a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    if (!tb) return;
    let totalQtd=0,totalR$=0,totalPts=0;
    tb.innerHTML = rows.length ? rows.map(a=>{
      const pts = a.service.includes('Quick')?1: a.service.includes('50')?3: a.service.includes('80')?4:1;
      const receita = a.service.includes('Quick')?53: a.service.includes('50')?159: a.service.includes('80')?239:100;
      totalQtd++; totalR$+=receita; totalPts+=pts;
      return `<tr><td>${a.date.split('-').reverse().join('/')}</td><td>1</td><td>${receita.toFixed(2)}</td><td>${pts}</td></tr>`;
    }).join('') : `<tr><td class="empty" colspan="4">Sem dados no período</td></tr>`;
    tQtd && (tQtd.textContent = String(totalQtd));
    tR$  && (tR$.textContent  = totalR$.toFixed(2));
    tPts && (tPts.textContent = String(totalPts));
  });
}

/* ===== Settings tabs ===== */
function setupSettingsTabs(){
  const root = $('#view-settings'); if(!root) return;
  const tabs = root.querySelectorAll('.tabs__tab');
  const panels = root.querySelectorAll('.tabs__panel');
  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      tabs.forEach(x=>x.classList.remove('is-active'));
      panels.forEach(p=>p.classList.remove('is-active'));
      t.classList.add('is-active');
      root.querySelector('#tab-' + t.dataset.tab)?.classList.add('is-active');
      localStorage.setItem('gerente.settings.tab', t.dataset.tab);
    });
  });
  const saved = localStorage.getItem('gerente.settings.tab');
  if (saved) root.querySelector(`.tabs__tab[data-tab="${saved}"]`)?.click();
}

/* ===== Boot ===== */
function boot(){
  renderHead();
  setupSideNav();
  renderDashboard();
  renderClients();
  renderAgenda();
  renderAttendance();
  renderEmployees();
  setupReports();
  setupAudit();

  // binds
  $('#searchClient')?.addEventListener('input', renderClients);
  $('#agendaDate')?.addEventListener('change', renderAgenda);
  $('#roleFilter')?.addEventListener('change', renderEmployees);

  // agenda actions
  $('#btnNewAppt')?.addEventListener('click', ()=>{
    const date = $('#agendaDate')?.value || todayISO();
    const time = prompt('Hora (HH:MM):','14:00'); if(!time) return;
    const client = prompt('Cliente:',''); if(!client) return;
    const service = prompt('Serviço:','Quick Massage') || 'Quick Massage';
    const therapistId = db.employees.find(e=>e.role!=='recepcao')?.id || db.employees[0]?.id;
    const room = prompt('Sala:','1') || '1';
    db.appts.push({ id: Math.random().toString(36).slice(2), date, time, client, service, therapistId, room });
    save(db); renderAgenda(); renderDashboard();
  });

  // agenda delete (delegate)
  $('#tblAgenda')?.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-del-appt]'); if(!btn) return;
    const id = btn.getAttribute('data-del-appt'); db.appts = db.appts.filter(a=>a.id!==id); save(db); renderAgenda(); renderDashboard();
  });

  // ponto delete (delegate)
  $('#tblPonto')?.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-del-att]'); if(!btn) return;
    db.attendance = db.attendance.filter(a=>a.id !== btn.getAttribute('data-del-att'));
    save(db); renderAttendance(); renderDashboard();
  });

  // employees toggle (delegate)
  $('#tblEmployees')?.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-toggle-emp]'); if(!btn) return;
    const emp = db.employees.find(x=>x.id===btn.getAttribute('data-toggle-emp'));
    if(emp){ emp.active = !emp.active; save(db); renderEmployees(); }
  });

  setupSettingsTabs();
}

boot();
