// ========= DADOS MOCK =========
const therapist = { id: 'T001', name: 'Luly' }; // <- aqui você seta o massagista logado
const ferias = [ // intervalos (YYYY-MM-DD)
    { start: '2025-01-20', end: '2025-02-02' },
    { start: '2025-07-08', end: '2025-07-21' }
];
const feriadosBR2025 = [
    { date: '2025-01-01', name: 'Confraternização Universal' },
    { date: '2025-03-04', name: 'Carnaval' },
    { date: '2025-04-18', name: 'Sexta-feira Santa' },
    { date: '2025-04-21', name: 'Tiradentes' },
    { date: '2025-05-01', name: 'Dia do Trabalho' },
    { date: '2025-06-19', name: 'Corpus Christi' },
    { date: '2025-09-07', name: 'Independência do Brasil' },
    { date: '2025-10-12', name: 'Nossa Senhora Aparecida' },
    { date: '2025-11-02', name: 'Finados' },
    { date: '2025-11-15', name: 'Proclamação da República' },
    { date: '2025-12-25', name: 'Natal' }
];
const appts = [
    // apenas exemplos — cada item tem therapistId e só renderizamos os do logado
    { date: '2025-10-13', time: '09:00', client: 'Ana Souza', phone: '(11) 90000-1111', service: 'Shiatsu 50min', therapistId: 'T001', room: 'Sala 2' },
    { date: '2025-10-13', time: '10:10', client: 'Bruno Dias', phone: '(11) 90000-2222', service: 'Liberação Miofascial', therapistId: 'T001', room: 'Sala 1' },
    { date: '2025-10-13', time: '14:00', client: 'Carla Lima', phone: '(11) 90000-3333', service: 'Reflexologia', therapistId: 'T002', room: 'Sala 3' }, // outro terapeuta (não aparece no massagista)
    { date: '2025-10-13', time: '15:30', client: 'Diego Marques', phone: '(11) 90000-4444', service: 'Ventosaterapia', therapistId: 'T001', room: 'Sala 2' },
    { date: '2025-10-14', time: '11:00', client: 'Érica Nunes', phone: '(11) 90000-5555', service: 'Shiatsu 50min', therapistId: 'T001', room: 'Sala 1' },
];

// ========= UTILS =========
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmtDateBR = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const todayISO = () => new Date().toISOString().slice(0, 10);
const inRange = (d, start, end) => d >= start && d <= end;

// ========= RENDER UI =========
function renderUser() {
    $('#userName').textContent = therapist.name;
    $('#whoami').textContent = therapist.name;
}

function renderAgendaSidebar() {
    const box = $('#agendaSidebar'); box.innerHTML = '';
    const now = new Date();
    const upcoming = appts
        .filter(a => a.therapistId === therapist.id && new Date(a.date + 'T' + a.time) >= now)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 6);
    if (!upcoming.length) { box.innerHTML = '<div class="meta">Sem próximos atendimentos ✨</div>'; return; }
    for (const a of upcoming) {
        const el = document.createElement('div');
        el.className = 'appt';
        el.innerHTML = `
          <div class="time">${a.time}</div>
          <div>
            <div class="name">${a.client}</div>
            <div class="meta">${fmtDateBR(a.date)} • ${a.service} • ${a.room}</div>
            <div class="meta"><i class="fa-brands fa-whatsapp"></i> ${a.phone}</div>
          </div>`;
        box.appendChild(el);
    }
}

function renderApptsOfDay(iso) {
    const list = $('#apptDay'); list.innerHTML = '';
    const mine = appts
        .filter(a => a.therapistId === therapist.id && a.date === iso)
        .sort((a, b) => a.time.localeCompare(b.time));
    if (!mine.length) {
        list.innerHTML = `<div class="meta">Nenhum atendimento em ${fmtDateBR(iso)}.</div>`;
        return;
    }
    for (const a of mine) {
        const el = document.createElement('div');
        el.className = 'appt';
        el.innerHTML = `
          <div class="time">${a.time}</div>
          <div>
            <div class="name">${a.client}</div>
            <div class="meta">${a.service} • ${a.room}</div>
            <div class="meta"><i class="fa-brands fa-whatsapp"></i> ${a.phone}</div>
          </div>`;
        list.appendChild(el);
    }
}

// Calendário Anual (simplificado: lista dos meses + marcações textuais)
function renderYearSelector() {
    const y = new Date().getFullYear();
    const sel = $('#yearSelect');
    for (let i = y - 1; i <= y + 1; i++) {
        const opt = document.createElement('option');
        opt.value = i; opt.textContent = i; if (i === y) opt.selected = true;
        sel.appendChild(opt);
    }
    sel.addEventListener('change', () => renderMiniCalendars(+sel.value));
}

function renderMiniCalendars(year) {
    const wrap = $('#miniCalendars'); wrap.innerHTML = '';
    for (let m = 0; m < 12; m++) {
        const monthName = new Date(year, m, 1).toLocaleString('pt-BR', { month: 'long' });
        const feriadosMes = feriadosBR2025.filter(f => f.date.startsWith(year + '-' + String(m + 1).padStart(2, '0')));
        // algum dia em férias?
        const first = `${year}-${String(m + 1).padStart(2, '0')}-01`;
        const lastDate = new Date(year, m + 1, 0).getDate();
        const last = `${year}-${String(m + 1).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`;
        const hasFerias = ferias.some(fr => inRange(first, fr.start, fr.end) || inRange(fr.start, first, last) || inRange(last, fr.start, fr.end));

        const div = document.createElement('div');
        div.className = 'mini';
        div.innerHTML = `
          <b>${monthName[0].toUpperCase() + monthName.slice(1)}</b>
          ${hasFerias ? `<div><span class="dot d-ferias"></span> Férias neste mês</div>` : ''}
          ${feriadosMes.length ? feriadosMes.map(f => `<div><span class="dot d-feriado"></span> ${fmtDateBR(f.date)} • ${f.name}</div>`).join('') : '<div class="meta">Sem feriados</div>'}
        `;
        wrap.appendChild(div);
    }
}

// Pontos (localStorage)

<section class="card" id="pontosCenter" style="margin-top:24px;">
    <h2><i class="fa-regular fa-clock"></i> Pontos</h2>
    <div class="ponto">
        <div>Status: <span class="chip" id="pontoStatus">Fora do expediente</span></div>
        <div class="row">
            <button class="btn" id="btnEntrada"><i class="fa-solid fa-door-open"></i> Entrada</button>
            <button class="btn alt" id="btnIntervalo"><i class="fa-regular fa-pause-circle"></i> Intervalo</button>
            <button class="btn alt" id="btnSaida"><i class="fa-solid fa-door-closed"></i> Saída</button>
        </div>
        <div class="log" id="pontoLog"></div>
    </div>
</section>

function loadPonto() {
    const log = JSON.parse(localStorage.getItem('rokuzen.ponto.log') || '[]');
    const status = localStorage.getItem('rokuzen.ponto.status') || 'Fora do expediente';
    $('#pontoStatus').textContent = status;
    renderPontoLog(log);
}
function renderPontoLog(items) {
    const box = $('#pontoLog'); box.innerHTML = items.map(i => `• [${i.when}] ${i.what}`).join('<br>') || 'Sem registros ainda.';
}
function pushPonto(what) {
    const now = new Date();
    const when = now.toLocaleString('pt-BR', { hour12: false });
    const key = 'rokuzen.ponto.log';
    const log = JSON.parse(localStorage.getItem(key) || '[]');
    log.unshift({ when, what });
    localStorage.setItem(key, JSON.stringify(log));
    renderPontoLog(log);
    const statusMap = {
        'Entrada registrada': 'Em expediente',
        'Início de intervalo': 'Em intervalo',
        'Fim de intervalo': 'Em expediente',
        'Saída registrada': 'Fora do expediente'
    };
    const status = statusMap[what] || 'Em expediente';
    localStorage.setItem('rokuzen.ponto.status', status);
    $('#pontoStatus').textContent = status;
}

// Notas rápidas
function loadNotes() {
    $('#quickNotes').value = localStorage.getItem('rokuzen.notes') || '';
}

// ========= INIT =========
(function init() {
    renderUser();
    renderYearSelector();
    renderMiniCalendars(new Date().getFullYear());
    renderAgendaSidebar();

    const d = $('#dayPicker');
    d.value = todayISO();
    renderApptsOfDay(d.value);
    $('#btnHoje').addEventListener('click', () => { d.value = todayISO(); renderApptsOfDay(d.value); });
    d.addEventListener('change', () => renderApptsOfDay(d.value));

    // Ponto
    loadPonto();
    $('#btnEntrada').addEventListener('click', () => pushPonto('Entrada registrada'));
    $('#btnIntervalo').addEventListener('click', () => {
        // alterna começo/fim de intervalo automaticamente
        const st = $('#pontoStatus').textContent;
        pushPonto(st === 'Em intervalo' ? 'Fim de intervalo' : 'Início de intervalo');
    });
    $('#btnSaida').addEventListener('click', () => pushPonto('Saída registrada'));

    // Notas rápidas
    loadNotes();
    $('#saveNotes').addEventListener('click', () => {
        localStorage.setItem('rokuzen.notes', $('#quickNotes').value);
        const t = $('#saveToast'); t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 1400);
    });
})();