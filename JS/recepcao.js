// ====== atalhos ======
const $ = s => document.querySelector(s);

// ====== refs que já existem no seu HTML ======
let catalogo       = $('#catalogo');
const bkService    = $('#bkService');
const bkTherapist  = $('#bkTherapist');
const bkClient     = $('#bkClient');
const bkPhone      = $('#bkPhone');
const bkEmail      = $('#bkEmail'); // <--- novo
const bkPrice      = $('#bkPrice');
const bkDuration   = $('#bkDuration');
const bkNotes      = $('#bkNotes');
const bkCondition  = $('#bkCondition');
const bkDate       = $('#bkDate');   // hidden
const bkTime       = $('#bkTime');   // hidden
const btnSubmit    = $('#btnSubmit');
const resumeEl     = $('#resume');

let calendario     = $('#calendario');
const calTitle     = $('#calTitle');
const calSummary   = $('#calSummary');
const calGrid      = $('#calGrid');
const slotInfo     = $('#slotInfo');
const slotList     = $('#slotList');
const calPrev      = $('#calPrev');
const calNext      = $('#calNext');
const calJump      = $('#calJump');
const calGo        = $('#calGo');

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
  catalogo.innerHTML = '';
  SERVICES.forEach(s => {
    const el = document.createElement('article');
    el.className = 'svc';

    const list = s.options.map(o => `<li>${o.min} min — <b>R$ ${o.price}</b></li>`).join('');

    el.innerHTML = `
      <img src="${s.img}" alt="${s.name}">
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
      // padrão: primeira opção
      bkService.value = s.name;
      bkDuration.value = s.options[0].min;
      bkPrice.value = s.options[0].price;

      // limpa seleção anterior
      bkDate.value = '';
      bkTime.value = '';
      if (bkPro) bkPro.value = '';
      btnSubmit.disabled = true;

      // abre calendário e rola
      openCalendarAndScroll();

      // texto guia
      calSummary.textContent = 'Escolha um dia para ver os profissionais e horários disponíveis.';
    });

    catalogo.appendChild(el);
  });
}
renderCatalog();

// nova função utilitária (cole acima da seção "// ====== CALENDÁRIO ======")
function openCalendarAndScroll() {
  // garante que o painel de Agendamento está visível
  const formAgendarPanel = document.getElementById('formAgendar');
  if (formAgendarPanel?.classList.contains('hidden')) {
    formAgendarPanel.classList.remove('hidden');
    history.pushState(null, '', '#formAgendar');
  }

  // mostra o calendário
  calendario.classList.remove('hidden');

  // se ainda não renderizou, renderiza agora
  if (!calendarRendered) {
    renderCalendar();
    calendarRendered = true;
  }

  // espera 1 frame pra layout atualizar e dá scroll
  requestAnimationFrame(() => {
    calendario.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ====== DISPONIBILIDADE (mock) ======
// AVAILABILITY["YYYY-MM-DD"] = [{ name, sex: 'Homem'|'Mulher', slots: ['10:00','11:00'] }, ...]
const AVAILABILITY = {};
seedMock(AVAILABILITY);

function seedMock(store) {
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    const dow = d.getDay(); // 0=dom
    if (dow === 0) continue; // fechado aos domingos (exemplo)
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
  calTitle.textContent = `${monthNames[calRef.getMonth()]} ${calRef.getFullYear()}`;

  const first = new Date(calRef.getFullYear(), calRef.getMonth(), 1);
  const last = new Date(calRef.getFullYear(), calRef.getMonth() + 1, 0);
  const startIdx = (first.getDay() + 6) % 7; // segunda=0 ... domingo=6
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
      cell.classList.add('cal-day'); // re-garante classe base
      cell.innerHTML = `<div class="num">${dayNum}</div><div class="tag">—</div>`;

      // passado = indisponível
      const isPast = thisDate < today;
      if (isPast) {
        cell.classList.add('off');
        calGrid.appendChild(cell);
        continue;
      }

      const avail = AVAILABILITY[ds];
      if (!avail || totalSlots(avail) === 0) {
        // LOTADO (vermelho)
        cell.classList.add('full');
        cell.querySelector('.tag').textContent = 'Lotado';
      } else {
        // DISPONÍVEL (branco)
        const male = avail.filter(p => p.sex === 'Homem').length;
        const female = avail.filter(p => p.sex === 'Mulher').length;
        cell.querySelector('.tag').textContent = `${totalSlots(avail)} horários • H:${male} M:${female}`;
      }

      cell.addEventListener('click', () => selectDay(ds));
    }

    calGrid.appendChild(cell);
  }

  // limpa lateral
  slotInfo.textContent = 'Selecione uma data no calendário.';
  slotList.innerHTML = '';
  calSummary.textContent = 'Clique em um dia para ver os profissionais e horários.';
}

function totalSlots(dayArr) {
  return dayArr.reduce((acc, p) => acc + p.slots.length, 0);
}

function selectDay(isoDate) {
  const avail = AVAILABILITY[isoDate];
  slotList.innerHTML = '';

  // atualiza resumo por gênero pro dia (informativo apenas)
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
  // mostra todos os profissionais disponíveis (sem filtrar por preferência)
  const shown = avail;

  if (!shown.length) {
    slotList.innerHTML = `<div class="slot-info">Sem profissionais disponíveis.</div>`;
    return;
  }

  shown.forEach(p => {
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
        // preenche campos do agendamento
        bkDate.value = isoDate;
        bkTime.value = h;
        if (bkPro) bkPro.value = p.name;

        // habilita submit e mostra resumo
        btnSubmit.disabled = false;
        resumeEl.textContent =
          `Selecionado: ${formatBr(isoDate)} às ${h} com ${p.name} • ${bkService.value} • ${bkDuration.value} min • R$ ${bkPrice.value}.`;

        // desce direto pro formulário
        document.querySelector('#bookingForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      times.appendChild(b);
    });
    slotList.appendChild(row);
  });

  // rola até os horários
  slotList.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatBr(iso) { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; }

// navegação mês
calPrev.addEventListener('click', () => { calRef = new Date(calRef.getFullYear(), calRef.getMonth() - 1, 1); renderCalendar(); });
calNext.addEventListener('click', () => { calRef = new Date(calRef.getFullYear(), calRef.getMonth() + 1, 1); renderCalendar(); });

// pular pra data específica
calGo.addEventListener('click', () => {
  if (!calJump.value) return;
  const d = new Date(calJump.value + 'T00:00:00');
  if (isNaN(+d)) return;
  // muda o mês exibido
  calRef = new Date(d.getFullYear(), d.getMonth(), 1);
  renderCalendar();
  // se o dia estiver nesse mês, já seleciona
  const iso = d.toISOString().slice(0, 10);
  const monthMatch = calRef.getFullYear() === d.getFullYear() && calRef.getMonth() === d.getMonth();
  if (monthMatch) selectDay(iso);
});

// inicia calendário escondido, render só na primeira exibição
let calendarRendered = false;
const observer = new MutationObserver(() => {
  if (!calendarRendered && !calendario.classList.contains('hidden')) {
    calendarRendered = true;
    renderCalendar();
  }
});
observer.observe(calendario, { attributes: true, attributeFilter: ['class'] });

// ====== SUBMIT DO FORM ======
document.querySelector('#bookingForm')?.addEventListener('submit', e => {
  e.preventDefault();

  const selectedConditions = Array.from(document.querySelectorAll('input[name="bkCondition"]:checked'))
    .map(cb => cb.value);

  if (!bkService.value) { alert('Selecione um serviço.'); return; }
  // removida a validação de preferência de terapeuta
  if (!bkClient.value) { alert('Informe o nome do cliente.'); return; }
  if (!bkDate.value || !bkTime.value) {
    alert('Escolha a data e o horário no calendário.');
    calendario.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  resumeEl.textContent =
    `Agendamento criado: ${bkClient.value} – ${bkService.value} • ` +
    `${formatBr(bkDate.value)} às ${bkTime.value} • ` +
    `${bkDuration.value} min • R$ ${bkPrice.value}` +
    (bkPro && bkPro.value ? ` • Profissional: ${bkPro.value}` : '') +
    (selectedConditions.length ? ` • Condições: ${selectedConditions.join(', ')}` : '');

  alert('Agendado com sucesso!');

  // reset parcial (mantém serviço/duração/preço)
  const keepService = bkService.value;
  const keepDuration = bkDuration.value;
  const keepPrice = bkPrice.value;

  e.target.reset();
  bkService.value = keepService;
  bkDuration.value = keepDuration;
  bkPrice.value = keepPrice;
  bkDate.value = ''; bkTime.value = ''; btnSubmit.disabled = true;
  if (bkPro) bkPro.value = '';
  slotList.innerHTML = '';
  slotInfo.textContent = 'Selecione uma data no calendário.';

  // limpa seleção de chips visualmente
  document.querySelectorAll('#bkConditionWrapper .chip').forEach(c => c.classList.remove('checked'));
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formAgendar');
  if (form) {
    const desired = ['catalogo', 'calendario'];
    // move os painéis mantendo o MESMO id (não altera refs)
    desired.slice().reverse().forEach(id => {
      const src = document.getElementById(id);
      if (!src) return;
      const wrapper = document.createElement('div');
      wrapper.id = id; // mantém o MESMO id (catalogo / calendario)
      wrapper.className = 'moved-panel';
      // mover todos os filhos do src para o wrapper
      while (src.firstChild) wrapper.appendChild(src.firstChild);
      // inserir antes do conteúdo atual do form (garante ordem desejada)
      form.insertBefore(wrapper, form.firstChild);
      // remover a seção vazia original
      src.remove();
    });

    // rebind das refs (agora apontam para os novos nós com o MESMO id)
    catalogo   = document.getElementById('catalogo');
    calendario = document.getElementById('calendario');

    // (re)cria o observer no elemento certo
    try { observer?.disconnect?.(); } catch (e) { /* ignore */ }
    calendarRendered = false; // garante estado antes de observar

    const observer2 = new MutationObserver(() => {
      if (!calendarRendered && !calendario.classList.contains('hidden')) {
        calendarRendered = true;
        renderCalendar();
      }
    });
    observer2.observe(calendario, { attributes: true, attributeFilter: ['class'] });
  }
// trava edição e evita aumento por roda/teclado
['bkPrice'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.readOnly = true;
  el.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  el.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
    if (e.key !== 'Tab') e.preventDefault(); // impede digitar
  });
});

  // ===== painel "router" — agora só considera formAgendar e posts =====
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
      const id = location.hash?.replace('#','');
      if (PANELS.includes(id)) show(id);
    });
  })();

  // Opcional: se houver código que inicializa calendário/catalogo, ele
  // continuará funcionando, pois os elementos foram movidos e mantiveram seus IDs.
  // Se você tiver inicializadores que dependem da presença das seções,
  // garanta que sejam chamados aqui (após as mudanças de DOM).
});

document.addEventListener('DOMContentLoaded', () => {
  // se havia código que usava #openPostsAdmin, proteja-o:
  const openBtn = document.getElementById('openPostsAdmin');
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      // só para compatibilidade; agora a sidebar link navega, então provavelmente não será chamado
      e.preventDefault();
      window.location.href = 'nossosposts.html';
    });
  }

  const closeBtn = document.getElementById('closePostsAdmin');
  const panel = document.getElementById('postsAdmin');
  const form = document.getElementById('postForm');
  const msg = document.getElementById('postMsg');

  closeBtn?.addEventListener('click', () => {
    if (!panel) return;
    panel.style.display = 'none';
    msg.textContent = '';
    form.reset();
    openBtn?.setAttribute('aria-expanded', 'false');
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('postTitle').value.trim();
    const image = document.getElementById('postImage').value.trim();
    const excerpt = document.getElementById('postExcerpt').value.trim();
    if (!title) return;

    const postsKey = 'rokuzen_posts';
    const stored = JSON.parse(localStorage.getItem(postsKey) || '[]');

    stored.unshift({
      id: Date.now(),
      title,
      image,
      excerpt,
      created: new Date().toISOString()
    });

    localStorage.setItem(postsKey, JSON.stringify(stored));

    msg.textContent = 'Post salvo com sucesso.';
    setTimeout(() => { msg.textContent = ''; }, 2500);
    form.reset();
  });
});