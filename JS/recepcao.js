// ====== atalhos ======
const $ = s => document.querySelector(s);

// ====== refs que já existem no seu HTML ======
let catalogo = $('#catalogo');
const bkService = $('#bkService');
let bkTherapist = $('#bkTherapist'); // pode ser <input> ou <select>
const bkClient = $('#bkClient');
const bkPhone = $('#bkPhone');
const bkEmail = $('#bkEmail');
const bkPrice = $('#bkPrice');
const bkDuration = $('#bkDuration');
const bkNotes = $('#bkNotes');
const bkCondition = document.getElementById('bkCondition');
const bkDate = $('#bkDate');   // hidden
const bkTime = $('#bkTime');   // hidden
const btnSubmit = $('#btnSubmit');
const resumeEl = $('#resume');

let calendario = $('#calendario');
const calTitle = $('#calTitle');
const calSummary = $('#calSummary');
const calGrid = $('#calGrid');
const slotInfo = $('#slotInfo');
const slotList = $('#slotList');
const calPrev = $('#calPrev');
const calNext = $('#calNext');
const calJump = $('#calJump');
const calGo = $('#calGo');

// --- helper: seta o profissional no #bkTherapist (input/select) e num campo display opcional ---
function setTherapist(name) {
  // se não existe no DOM, cria um hidden pra garantir que o valor vá no form
  if (!bkTherapist) {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = 'bkTherapist';
    hidden.name = 'bkTherapist';
    document.querySelector('#bookingForm')?.appendChild(hidden);
    bkTherapist = document.getElementById('bkTherapist');
  }

  const el = bkTherapist;

  if (el.tagName === 'SELECT') {
    // garante que o option existe
    let opt = Array.from(el.options).find(o => o.value === name || o.text === name);
    if (!opt) {
      opt = new Option(name, name, true, true);
      el.add(opt);
    }
    el.value = name;
    el.dispatchEvent(new Event('change'));
  } else {
    // input de texto normal/hidden
    el.value = name;
  }

  // espelho visual (se existir)
  const vis = document.getElementById('bkTherapistDisplay');
  if (vis) vis.value = name;
}

// ====== CATÁLOGO (com opções de duração/preço) ======
const SERVICES = [
  {
    name: 'Quick Massage (Pescoço e Ombros)',
    img: '../imagens/v_quick1.jpg',
    about: 'Massagem rápida focada em pescoço e ombros para alívio imediato.',
    options: [{ min: 15, price: 59 }, { min: 20, price: 69 }, { min: 30, price: 89 }],
  },
  {
    name: 'Massagem na Maca (Shiatsu / Anmá / Ventosa / Relaxante)',
    img: '../imagens/v_maca.jpg',
    about: 'Sessão completa de técnicas corporais para equilíbrio e relaxamento.',
    options: [{ min: 30, price: 114 }, { min: 45, price: 160 }, { min: 60, price: 198 }, { min: 90, price: 292 }, { min: 120, price: 379 }],
  },
  {
    name: 'Reflexologia Podal',
    img: '../imagens/v_reflexologia.jpg',
    about: 'Estimulação de pontos nos pés que refletem órgãos do corpo.',
    options: [{ min: 20, price: 83 }, { min: 30, price: 99 }, { min: 40, price: 118 }, { min: 60, price: 159 }],
  },
  {
    name: 'Auriculoterapia',
    img: '../imagens/v_auriculoterapia.jpg',
    about: 'Terapia na orelha para relaxamento e controle de sintomas.',
    options: [{ min: 10, price: 69 }, { min: 25, price: 89 }],
  },
];

function renderCatalog() {
  if (!catalogo) return;
  catalogo.innerHTML = '';
  SERVICES.forEach(s => {
    const el = document.createElement('article');
    el.className = 'svc';

    const list = s.options.map(o => `<li>${o.min} min — <b>R$ ${o.price}</b></li>`).join('');
    const imgTag = s.img ? `<img src="${s.img}" alt="${s.name}">` : '';

    el.innerHTML = `
      ${imgTag}
      <div>
        <h3>${s.name}</h3>
        <p>${s.about}</p>
        <ul class="svc-options">${list}</ul>
        <div class="actions">
          <button class="btn btn-primary">Agendar</button>
        </div>
      </div>
    `;

    el.querySelector('button').addEventListener('click', () => {
      bkService.value = s.name;
      bkDuration.value = s.options[0].min;
      bkPrice.value = s.options[0].price;
      // limpa seleção anterior
      bkDate.value = '';
      bkTime.value = '';
      if (bkTherapist) bkTherapist.value = '';
      btnSubmit.disabled = true;

      openCalendarAndScroll();
      if (calSummary) calSummary.textContent = 'Escolha um dia para ver os profissionais e horários disponíveis.';
    });

    catalogo.appendChild(el);
  });
}

// ===== util =====
function openCalendarAndScroll() {
  const formAgendarPanel = document.getElementById('formAgendar');
  if (formAgendarPanel?.classList.contains('hidden')) {
    formAgendarPanel.classList.remove('hidden');
    history.pushState(null, '', '#formAgendar');
  }
  calendario?.classList.remove('hidden');

  if (!calendarRendered) {
    renderCalendar();
    calendarRendered = true;
  }
  requestAnimationFrame(() => {
    calendario?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ====== DISPONIBILIDADE (mock) ======
const AVAILABILITY = {};
seedMock(AVAILABILITY);

function seedMock(store) {
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    if (dow === 0) continue; // fechado aos domingos
    const pros = [
      { name: 'Ayumi', sex: 'Mulher', slots: ['10:00', '11:00', '15:00'] },
      { name: 'Bruno', sex: 'Homem', slots: ['09:30', '14:30'] },
      { name: 'Catarina', sex: 'Mulher', slots: ['13:00', '16:00'] },
      { name: 'Diego', sex: 'Homem', slots: ['10:30', '17:00'] },
    ];
    if (Math.random() > .35) {
      const arr = pros.map(p => ({ ...p, slots: p.slots.filter(() => Math.random() > .3) }))
        .filter(p => p.slots.length);
      if (arr.length) store[ds] = arr;
    }
  }
}

// ====== CALENDÁRIO ======
let calRef = new Date(); // mês em foco
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function renderCalendar() {
  if (!calGrid || !calTitle) return;
  calTitle.textContent = `${monthNames[calRef.getMonth()]} ${calRef.getFullYear()}`;

  const first = new Date(calRef.getFullYear(), calRef.getMonth(), 1);
  const last = new Date(calRef.getFullYear(), calRef.getMonth() + 1, 0);
  const startIdx = (first.getDay() + 6) % 7; // segunda=0
  const totalCells = startIdx + last.getDate();

  calGrid.innerHTML = '';
  const today = new Date(); today.setHours(0, 0, 0, 0);

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day hidden';

    if (i >= startIdx) {
      const dayNum = i - startIdx + 1;
      const thisDate = new Date(calRef.getFullYear(), calRef.getMonth(), dayNum);
      const ds = thisDate.toISOString().slice(0, 10);

      cell.classList.remove('hidden');
      cell.classList.add('cal-day');
      cell.innerHTML = `<div class="num">${dayNum}</div><div class="tag">—</div>`;

      const isPast = thisDate < today;
      if (isPast) {
        cell.classList.add('off');
        calGrid.appendChild(cell);
        continue;
      }

      const avail = AVAILABILITY[ds];
      if (!avail || totalSlots(avail) === 0) {
        cell.classList.add('full');
        cell.querySelector('.tag').textContent = 'Lotado';
      } else {
        const male = avail.filter(p => p.sex === 'Homem').length;
        const female = avail.filter(p => p.sex === 'Mulher').length;
        cell.querySelector('.tag').textContent = `${totalSlots(avail)} horários • H:${male} M:${female}`;
      }

      cell.addEventListener('click', () => selectDay(ds));
    }

    calGrid.appendChild(cell);
  }

  if (slotInfo) slotInfo.textContent = 'Selecione uma data no calendário.';
  if (slotList) slotList.innerHTML = '';
  if (calSummary) calSummary.textContent = 'Clique em um dia para ver os profissionais e horários.';
}

function totalSlots(dayArr) {
  return dayArr.reduce((acc, p) => acc + p.slots.length, 0);
}

function selectDay(isoDate) {
  if (!slotList || !calSummary || !slotInfo) return;
  const avail = AVAILABILITY[isoDate];
  slotList.innerHTML = '';

  if (avail && avail.length) {
    const male = avail.filter(p => p.sex === 'Homem').length;
    const female = avail.filter(p => p.sex === 'Mulher').length;
    calSummary.textContent = `${formatBr(isoDate)} • Profissionais: H:${male} • M:${female}`;
  } else {
    calSummary.textContent = `${formatBr(isoDate)} • Sem vagas`;
  }

  if (!avail || totalSlots(avail) === 0) {
    slotInfo.textContent = `Dia ${formatBr(isoDate)} — lotado.`;
    return;
  }

  slotInfo.textContent = `Dia ${formatBr(isoDate)} — escolha profissional e horário:`;

  avail.forEach(p => {
    const row = document.createElement('div');
    row.className = 'pro-row';
    row.innerHTML = `
      <div class="pro-head">
        <div class="pro-name">${p.name}</div>
        <div class="pro-sex">${p.sex}</div>
      </div>
      <div class="times"></div>
    `;
    const times = row.querySelector('.times');
    p.slots.forEach(h => {
      const b = document.createElement('button');
      b.className = 'time-btn';
      b.textContent = h;
      b.addEventListener('click', () => {
        // preenche campos
        bkDate.value = isoDate;
        bkTime.value = h;
        setTherapist(p.name); // ✅ agora no escopo global

        // sincroniza um input de exibição de hora, se tiver
        const bkTimeDisplay = document.getElementById('bkTimeDisplay');
        if (bkTimeDisplay) bkTimeDisplay.value = h;

        // habilita submit + resumo
        if (btnSubmit) btnSubmit.disabled = false;
        if (resumeEl) {
          resumeEl.textContent =
            `Selecionado: ${formatBr(isoDate)} às ${h} com ${p.name} • ${bkService.value} • ${bkDuration.value} min • R$ ${bkPrice.value}.`;
        }
        document.querySelector('#bookingForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      times.appendChild(b);
    });
    slotList.appendChild(row);
  });

  slotList.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatBr(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// navegação mês
calPrev?.addEventListener('click', () => {
  calRef = new Date(calRef.getFullYear(), calRef.getMonth() - 1, 1);
  renderCalendar();
});
calNext?.addEventListener('click', () => {
  calRef = new Date(calRef.getFullYear(), calRef.getMonth() + 1, 1);
  renderCalendar();
});

// pular pra data específica
calGo?.addEventListener('click', () => {
  if (!calJump?.value) return;
  const d = new Date(calJump.value + 'T00:00:00');
  if (isNaN(+d)) return;
  calRef = new Date(d.getFullYear(), d.getMonth(), 1);
  renderCalendar();
  const iso = d.toISOString().slice(0, 10);
  const monthMatch = calRef.getFullYear() === d.getFullYear() && calRef.getMonth() === d.getMonth();
  if (monthMatch) selectDay(iso);
});

// inicia calendário escondido, render só na primeira exibição
let calendarRendered = false;
const observer = calendario
  ? new MutationObserver(() => {
    if (!calendarRendered && !calendario.classList.contains('hidden')) {
      calendarRendered = true;
      renderCalendar();
    }
  })
  : null;

observer?.observe(calendario, { attributes: true, attributeFilter: ['class'] });

// --- storage de bookings (agenda) ---
const BK_STORE = 'rokuzen_bookings';
function loadBookings() {
  try { return JSON.parse(localStorage.getItem(BK_STORE)) || []; } catch { return []; }
}
function saveBookings(list) {
  localStorage.setItem(BK_STORE, JSON.stringify(list));
}

// Substitui listener de submit do form de agendamento (garante persistência)
document.querySelector('#bookingForm')?.addEventListener('submit', e => {
  e.preventDefault();

  // condições selecionadas (checkboxes com name="bkCondition")
  const selectedConditions = Array.from(document.querySelectorAll('input[name="bkCondition"]:checked'))
    .map(cb => cb.value);

  if (!bkService.value) { alert('Selecione um serviço.'); return; }
  if (!bkClient.value) { alert('Informe o nome do cliente.'); return; }
  if (!bkDate.value || !bkTime.value) {
    alert('Escolha a data e o horário no calendário.');
    calendario?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  // montar objeto de booking
  const booking = {
    id: Date.now(),
    client: bkClient.value.trim(),
    phone: bkPhone.value.trim(),
    email: bkEmail.value.trim(),
    service: bkService.value.trim(),
    price: Number(bkPrice.value) || 0,
    duration: Number(bkDuration.value) || 0,
    therapist: (bkTherapist && bkTherapist.value) ? bkTherapist.value : '',
    date: bkDate.value, // ISO yyyy-mm-dd
    time: bkTime.value,
    conditions: selectedConditions
  };

  // salvar no storage
  const all = loadBookings();
  all.unshift(booking);
  saveBookings(all);

  // resumo e feedback
  if (resumeEl) {
    resumeEl.textContent =
      `Agendamento criado: ${booking.client} – ${booking.service} • ` +
      `${formatBr(booking.date)} às ${booking.time} • ` +
      `${booking.duration} min • R$ ${booking.price}` +
      (booking.therapist ? ` • Profissional: ${booking.therapist}` : '') +
      (selectedConditions.length ? ` • Condições: ${selectedConditions.join(', ')}` : '');
  }

  alert('Agendado com sucesso! (salvo na Agenda Geral)');

  // reset parcial (mantém serviço/duração/preço)
  const keepService = bkService.value;
  const keepDuration = bkDuration.value;
  const keepPrice = bkPrice.value;

  e.target.reset();
  bkService.value = keepService;
  bkDuration.value = keepDuration;
  bkPrice.value = keepPrice;
  bkDate.value = ''; bkTime.value = '';
  if (btnSubmit) btnSubmit.disabled = true;
  if (bkTherapist) bkTherapist.value = '';
  if (slotList) slotList.innerHTML = '';
  if (slotInfo) slotInfo.textContent = 'Selecione uma data no calendário.';
  document.querySelectorAll('#bkConditionWrapper .hchip').forEach(c => c.classList.remove('checked'));

  // atualizar vista da aba Agenda caso esteja visível
  if (!document.getElementById('agenda')?.classList.contains('hidden')) {
    // re-renderiza o mês / dia atual
    renderAgendaMonth(agendaRef);
    if (selectedAgendaDate) renderAgendaDay(selectedAgendaDate);
  }
});

// ===== Agenda Geral: calendário + lista de sessões =====
const HOLIDAYS = [
  // exemplos (adicione mais ou gere dinamicamente)
  new Date().getFullYear() + '-01-01', // ano atual 01/01
  new Date().getFullYear() + '-12-25'  // 25/12
];

let agendaRef = new Date(); // mês em foco para agenda
let selectedAgendaDate = null;

const agendaGrid = document.getElementById('agendaGrid');
const agendaTitle = document.getElementById('agendaTitle');
const agendaSummary = document.getElementById('agendaSummary');
const agendaDayInfo = document.getElementById('agendaDayInfo');
const agendaList = document.getElementById('agendaList');
const agendaPrev = document.getElementById('agendaPrev');
const agendaNext = document.getElementById('agendaNext');
const agendaJump = document.getElementById('agendaJump');
const agendaGo = document.getElementById('agendaGo');
const agendaDayTitle = document.getElementById('agendaDayTitle');

function isHoliday(iso) {
  return HOLIDAYS.includes(iso);
}
function isoFromDate(d) { return d.toISOString().slice(0,10); }

function renderAgendaMonth(refDate) {
  if (!agendaGrid || !agendaTitle) return;
  agendaRef = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
  agendaTitle.textContent = `${monthNames[agendaRef.getMonth()]} ${agendaRef.getFullYear()}`;

  const first = new Date(agendaRef.getFullYear(), agendaRef.getMonth(), 1);
  const last = new Date(agendaRef.getFullYear(), agendaRef.getMonth() + 1, 0);
  const startIdx = (first.getDay() + 6) % 7;
  const totalCells = startIdx + last.getDate();

  agendaGrid.innerHTML = '';
  const today = new Date(); today.setHours(0,0,0,0);

  const bookings = loadBookings();
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day hidden';

    if (i >= startIdx) {
      const dayNum = i - startIdx + 1;
      const thisDate = new Date(agendaRef.getFullYear(), agendaRef.getMonth(), dayNum);
      const ds = isoFromDate(thisDate);

      cell.classList.remove('hidden');
      cell.classList.add('cal-day');
      cell.innerHTML = `<div class="num">${dayNum}</div><div class="tag">—</div>`;

      // feriado?
      if (isHoliday(ds)) {
        cell.classList.add('off');
        cell.querySelector('.tag').textContent = 'Feriado';
      } else {
        const dayBookings = bookings.filter(b => b.date === ds);
        if (!dayBookings.length) {
          cell.classList.add('full'); // usar full como "sem sessões" visual (ajuste se quiser)
          cell.querySelector('.tag').textContent = 'Sem sessões';
        } else {
          cell.querySelector('.tag').textContent = `${dayBookings.length} sessão(s)`;
        }
      }

      // clique seleciona dia
      cell.addEventListener('click', () => {
        selectedAgendaDate = ds;
        renderAgendaDay(ds);
      });
    }

    agendaGrid.appendChild(cell);
  }

  agendaDayInfo.textContent = 'Selecione um dia no calendário.';
  agendaList.innerHTML = '';
  agendaSummary.textContent = 'Clique em um dia para ver as sessões agendadas.';
}

function renderAgendaDay(isoDate) {
  selectedAgendaDate = isoDate;
  const bookings = loadBookings().filter(b => b.date === isoDate).sort((a,b) => a.time.localeCompare(b.time));
  agendaDayTitle.textContent = `Sessões de ${formatBr(isoDate)}`;
  if (isHoliday(isoDate)) {
    agendaDayInfo.textContent = `Feriado (${formatBr(isoDate)}) — confira escalas/plantões.`;
  } else {
    agendaDayInfo.textContent = `Dia ${formatBr(isoDate)} — ${bookings.length} sessão(ões).`;
  }

  agendaList.innerHTML = '';
  if (!bookings.length) {
    const el = document.createElement('div');
    el.className = 'pro-row';
    el.textContent = isHoliday(isoDate) ? 'Feriado — sem sessões registradas.' : 'Nenhuma sessão registrada neste dia.';
    agendaList.appendChild(el);
    return;
  }

  bookings.forEach(b => {
    const row = document.createElement('div');
    row.className = 'pro-row';
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <div>
          <div style="font-weight:700">${b.time} — ${escapeHtml(b.service)}</div>
          <div style="opacity:.9">${escapeHtml(b.client)} ${b.therapist ? '• ' + escapeHtml(b.therapist) : ''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">R$ ${b.price}</div>
          <div style="font-size:12px;opacity:.9">${b.duration} min</div>
        </div>
      </div>
    `;
    agendaList.appendChild(row);
  });
}

// liga controles
agendaPrev?.addEventListener('click', () => {
  agendaRef = new Date(agendaRef.getFullYear(), agendaRef.getMonth() - 1, 1);
  renderAgendaMonth(agendaRef);
});
agendaNext?.addEventListener('click', () => {
  agendaRef = new Date(agendaRef.getFullYear(), agendaRef.getMonth() + 1, 1);
  renderAgendaMonth(agendaRef);
});
agendaGo?.addEventListener('click', () => {
  if (!agendaJump?.value) return;
  const d = new Date(agendaJump.value + 'T00:00:00');
  if (isNaN(+d)) return;
  agendaRef = new Date(d.getFullYear(), d.getMonth(), 1);
  renderAgendaMonth(agendaRef);
  const iso = d.toISOString().slice(0,10);
  renderAgendaDay(iso);
});

// inicializa agenda quando a aba for mostrada (router já oculta/exibe)
(function hookAgendaInit(){
  // detectar quando a aba agenda ficar visível
  const agendaPanel = document.getElementById('agenda');
  if (!agendaPanel) return;
  const mo = new MutationObserver(() => {
    if (!agendaPanel.classList.contains('hidden')) {
      renderAgendaMonth(agendaRef);
      // se hoje tiver sessões, mostrar hoje
      const todayIso = isoFromDate(new Date());
      renderAgendaDay(todayIso);
    }
  });
  mo.observe(agendaPanel, { attributes: true, attributeFilter: ['class'] });
})();

// ===== Bootstrap: só roda quando o DOM estiver pronto =====
document.addEventListener('DOMContentLoaded', () => {
  // (re)pega refs (caso script esteja no <head>)
  catalogo = document.getElementById('catalogo') || catalogo;
  calendario = document.getElementById('calendario') || calendario;

  renderCatalog();

  const form = document.getElementById('formAgendar');
  if (form) {
    const desired = ['catalogo', 'calendario'];
    desired.slice().reverse().forEach(id => {
      const src = document.getElementById(id);
      if (!src) return;
      const wrapper = document.createElement('div');
      wrapper.id = id;
      wrapper.className = 'moved-panel';
      while (src.firstChild) wrapper.appendChild(src.firstChild);
      form.insertBefore(wrapper, form.firstChild);
      src.remove();
    });

    catalogo = document.getElementById('catalogo');
    calendario = document.getElementById('calendario');

    try { observer?.disconnect?.(); } catch { }
    calendarRendered = false;

    if (calendario) {
      const observer2 = new MutationObserver(() => {
        if (!calendarRendered && !calendario.classList.contains('hidden')) {
          calendarRendered = true;
          renderCalendar();
        }
      });
      observer2.observe(calendario, { attributes: true, attributeFilter: ['class'] });
    }
  }

  // trava edição e evita aumento por roda/teclado
  ['bkPrice'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.readOnly = true;
    el.addEventListener('wheel', e => e.preventDefault(), { passive: false });
    el.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
      if (e.key !== 'Tab') e.preventDefault();
    });
  });

  // ===== router (formAgendar | posts) =====
  (function () {
    const PANELS = ['formAgendar', 'posts'];
    const byId = id => document.getElementById(id);
    const hideAll = () => PANELS.forEach(id => byId(id)?.classList.add('hidden'));
    const show = id => {
      if (!PANELS.includes(id)) return;
      hideAll();
      byId(id)?.classList.remove('hidden');
      byId(id)?.querySelector('h2')?.focus?.();
    };

    const initial = location.hash?.replace('#', '');
    show(PANELS.includes(initial) ? initial : 'formAgendar');

    document.querySelectorAll('.sb-link[href^="#"]').forEach(a => {
      a.addEventListener('click', ev => {
        ev.preventDefault();
        const target = a.getAttribute('href').slice(1);
        show(target);
        history.pushState(null, '', `#${target}`);
      });
    });

    window.addEventListener('popstate', () => {
      const id = location.hash?.replace('#', '');
      if (PANELS.includes(id)) show(id);
    });
  })();
});

// === POSTS (novo CRUD: criar/editar/excluir + carrossel) ===
document.addEventListener('DOMContentLoaded', () => {
  const LS_KEY = 'rokuzen_posts';

  // Elements
  const postsRow   = document.getElementById('postsRow');
  const btnPrev    = document.getElementById('postsPrev');
  const btnNext    = document.getElementById('postsNext');
  const btnAdd     = document.getElementById('postAddBtn');
  const dlg        = document.getElementById('postEditor');
  const form       = document.getElementById('postForm');
  const hTitle     = document.getElementById('postEditorTitle');
  const fldId      = document.getElementById('postId');
  const fldTitle   = document.getElementById('postTitle');
  const fldImage   = document.getElementById('postImage');
  const fldExcerpt = document.getElementById('postExcerpt');
  const btnCancel  = document.getElementById('postCancel');
  const btnDelete  = document.getElementById('postDelete');

  // Helpers — storage
  function loadPosts() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function savePosts(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }

  // Seed inicial se vazio
  (function seedIfEmpty() {
    const cur = loadPosts();
    if (cur.length) return;
  
  })();

  // Render
  function escapeHtml(s='') {
    return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
  function renderPosts() {
    if (!postsRow) return;
    const posts = loadPosts().sort((a,b) => b.id - a.id);
    postsRow.innerHTML = '';
    posts.forEach(p => {
      const card = document.createElement('article');
      card.className = 'post';
      card.innerHTML = `
        <img src="${p.image || '../imagens/Rectangle 16.png'}" alt="${escapeHtml(p.title)}">
        <div class="post-actions">
          <button class="post-edit" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
          <button class="post-del"  aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div class="post-body">
          <p class="post-title">${escapeHtml(p.title)}</p>
          ${p.excerpt ? `<p class="post-excerpt" style="opacity:.9;margin:.25rem 0 0">${escapeHtml(p.excerpt)}</p>` : ''}
        </div>
      `;
      card.querySelector('.post-edit').addEventListener('click', () => openEditor(p));
      card.querySelector('.post-del').addEventListener('click', () => {
        if (!confirm('Excluir este post?')) return;
        const updated = loadPosts().filter(x => x.id !== p.id);
        savePosts(updated);
        renderPosts();
      });
      postsRow.appendChild(card);
    });
  }

  // Editor
  function openEditor(post = null) {
    if (!dlg) return;
    if (post) {
      hTitle.textContent = 'Editar Post';
      fldId.value      = post.id;
      fldTitle.value   = post.title || '';
      fldImage.value   = post.image || '';
      fldExcerpt.value = post.excerpt || '';
      btnDelete.hidden = false;
    } else {
      hTitle.textContent = 'Novo Post';
      fldId.value      = '';
      fldTitle.value   = '';
      fldImage.value   = '';
      fldExcerpt.value = '';
      btnDelete.hidden = true;
    }
    dlg.showModal();
    setTimeout(() => fldTitle?.focus(), 50);
  }
  function closeEditor() { dlg?.close(); }

  btnAdd?.addEventListener('click', () => openEditor());

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = fldId.value ? Number(fldId.value) : Date.now();
    const item = {
      id,
      title: (fldTitle.value || '').trim(),
      image: (fldImage.value || '').trim(),
      excerpt: (fldExcerpt.value || '').trim()
    };
    if (!item.title) {
      alert('Título é obrigatório');
      return;
    }
    const list = loadPosts();
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) list[idx] = item; else list.unshift(item);
    savePosts(list);
    renderPosts();
    closeEditor();
  });

  btnCancel?.addEventListener('click', (e) => {
    e.preventDefault();
    closeEditor();
  });

  btnDelete?.addEventListener('click', (e) => {
    e.preventDefault();
    const id = Number(fldId.value);
    if (!id) return;
    if (!confirm('Excluir este post?')) return;
    const list = loadPosts().filter(p => p.id !== id);
    savePosts(list);
    renderPosts();
    closeEditor();
  });

  // Carrossel
  let page = 0;
  function pageWidth() {
    const firstCard = postsRow?.querySelector('.post');
    return firstCard ? firstCard.getBoundingClientRect().width + 12 : 320;
  }
  function go(delta) {
    if (!postsRow) return;
    page = Math.max(0, page + delta);
    postsRow.style.transform = `translateX(${-page * pageWidth()}px)`;
  }
  btnPrev?.addEventListener('click', () => go(-1));
  btnNext?.addEventListener('click', () => go(+1));
  window.addEventListener('resize', () => {
    if (!postsRow) return;
    postsRow.style.transform = `translateX(${-page * pageWidth()}px)`;
  });

  // init
  renderPosts();
});

// ====== CHIPS DE CONDIÇÃO MÉDICA ======
const conditionChips = document.querySelectorAll('.hchip');
const clearBtn = document.getElementById('clearConditions');

conditionChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const input = chip.querySelector('input');
    input.checked = !input.checked;
    chip.classList.toggle('checked', input.checked);

    // 🔹 comportamento especial: "Nenhuma das opções" desmarca todas as outras
    if (input.value === 'Nenhuma' && input.checked) {
      conditionChips.forEach(c => {
        if (c !== chip) {
          c.classList.remove('checked');
          c.querySelector('input').checked = false;
        }
      });
    } else if (input.value !== 'Nenhuma' && input.checked) {
      const noneChip = Array.from(conditionChips)
        .find(c => c.querySelector('input').value === 'Nenhuma');
      if (noneChip) {
        noneChip.classList.remove('checked');
        noneChip.querySelector('input').checked = false;
      }
    }
  });
});

// 🔹 botão limpar
clearBtn.addEventListener('click', () => {
  conditionChips.forEach(chip => {
    chip.classList.remove('checked');
    chip.querySelector('input').checked = false;
  });
});

// Navegação simples entre seções via sidebar (abre agenda ao clicar)
(function initSectionRouter() {
  const panels = ['catalogo', 'calendario', 'formAgendar', 'agenda', 'posts'];

  function showPanel(id) {
    if (!id) return;
    panels.forEach(pid => {
      const el = document.getElementById(pid);
      if (!el) return;
      if (pid === id) el.classList.remove('hidden'); else el.classList.add('hidden');
    });

    // foco/scroll leve
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.focus?.();
    }

    // se abriu a aba Agenda, renderiza imediatamente
    if (id === 'agenda') {
      try {
        renderAgendaMonth(agendaRef || new Date());
        const todayIso = (typeof isoFromDate === 'function') ? isoFromDate(new Date()) : new Date().toISOString().slice(0,10);
        // se já tiver uma data selecionada, mantém; senão mostra hoje
        if (selectedAgendaDate) renderAgendaDay(selectedAgendaDate); else renderAgendaDay(todayIso);
      } catch (e) { /* ignore se funções não existirem ainda */ }
    }

    // se abriu o formAgendar, garantir que calendário lateral apareça (se existir)
    if (id === 'formAgendar') {
      try { calendario?.classList.remove('hidden'); } catch {}
    }
  }

  // intercepta clicks na sidebar que usam hash
  document.querySelectorAll('.sb-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const id = href.slice(1);
      showPanel(id);
      // atualiza a hash sem fazer jump de navegador
      history.replaceState(null, '', href);
    });
  });

  // ao carregar, abre painel conforme hash se presente
  window.addEventListener('DOMContentLoaded', () => {
    const hash = (location.hash || '').slice(1);
    if (hash && panels.includes(hash)) {
      showPanel(hash);
    }
  });
})();