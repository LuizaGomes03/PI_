// ====== atalhos ======
const $ = s => document.querySelector(s);

// ====== refs que já existem no seu HTML ======
const catalogo     = $('#catalogo');
const bkService    = $('#bkService');
const bkTherapist  = $('#bkTherapist');
const bkClient     = $('#bkClient');
const bkPhone      = $('#bkPhone');
const bkPrice      = $('#bkPrice');
const bkDuration   = $('#bkDuration');
const bkNotes      = $('#bkNotes');
const bkCondition  = $('#bkCondition');
const bkDate       = $('#bkDate');   // hidden
const bkTime       = $('#bkTime');   // hidden
const btnSubmit    = $('#btnSubmit');
const resumeEl     = $('#resume');

// calendário
const calendario   = $('#calendario');
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
    name:'Quick Massage',
    img:'imagens/Rectangle 16.png',
    about:'Massagem rápida para aliviar tensões no pescoço e ombros.',
    options:[ {min:15,price:52}, {min:25,price:73}, {min:35,price:92} ],
  },
  {
    name:'Massagem na Maca (Shiatsu / Anmá / Ventosa / Relaxante)',
    img:'imagens/Rectangle 22.png',
    about:'Sessão completa de técnicas corporais para equilíbrio e relaxamento.',
    options:[ {min:30,price:114},{min:45,price:160},{min:60,price:198},{min:90,price:292},{min:120,price:379} ],
  },
  {
    name:'Reflexologia Podal',
    img:'imagens/MassagemN.jpg',
    about:'Estimulação de pontos nos pés que refletem órgãos do corpo.',
    options:[ {min:20,price:83},{min:30,price:99},{min:40,price:118},{min:60,price:159} ],
  },
  {
    name:'Auriculoterapia',
    img:'imagens/gift.jpg',
    about:'Terapia na orelha para relaxamento e controle de sintomas.',
    options:[ {min:10,price:69},{min:25,price:89} ],
  },
];

function renderCatalog(){
  catalogo.innerHTML = '';
  SERVICES.forEach(s=>{
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

    el.querySelector('button').addEventListener('click', ()=>{
      // padrão: primeira opção
      bkService.value  = s.name;
      bkDuration.value = s.options[0].min;
      bkPrice.value    = s.options[0].price;

      // limpa seleção anterior de data/hora
      bkDate.value = ''; bkTime.value = ''; btnSubmit.disabled = true;

      // mostra calendário e desce até ele
      calendario.classList.remove('hidden');
      document.querySelector('#calendario').scrollIntoView({behavior:'smooth', block:'start'});
      // atualiza resumo
      calSummary.textContent = 'Escolha um dia para ver os profissionais e horários disponíveis.';
    });

    catalogo.appendChild(el);
  });
}
renderCatalog();

// ====== DISPONIBILIDADE (mock) ======
// AVAILABILITY["YYYY-MM-DD"] = [{ name, sex: 'Homem'|'Mulher', slots: ['10:00','11:00'] }, ...]
const AVAILABILITY = {};
seedMock(AVAILABILITY);

function seedMock(store){
  const today = new Date();
  for(let i=0;i<90;i++){
    const d = new Date(today);
    d.setDate(d.getDate()+i);
    const ds = d.toISOString().slice(0,10);
    const dow = d.getDay(); // 0=dom
    if(dow === 0) continue; // fechado aos domingos (exemplo)
    const pros = [
      { name:'Ayumi',    sex:'Mulher', slots:['10:00','11:00','15:00'] },
      { name:'Bruno',    sex:'Homem',  slots:['09:30','14:30'] },
      { name:'Catarina', sex:'Mulher', slots:['13:00','16:00'] },
      { name:'Diego',    sex:'Homem',  slots:['10:30','17:00'] },
    ];
    if(Math.random() > .35){
      const arr = pros.map(p=>({ ...p, slots:p.slots.filter(()=>Math.random()>.3) }))
                      .filter(p=>p.slots.length);
      if(arr.length) store[ds] = arr;
    }
  }
}

// ====== CALENDÁRIO ======
let calRef = new Date(); // mês em foco

const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function renderCalendar(){
  calTitle.textContent = `${monthNames[calRef.getMonth()]} ${calRef.getFullYear()}`;

  const first = new Date(calRef.getFullYear(), calRef.getMonth(), 1);
  const last  = new Date(calRef.getFullYear(), calRef.getMonth()+1, 0);
  const startIdx = (first.getDay()+6)%7; // segunda=0 ... domingo=6
  const totalCells = startIdx + last.getDate();

  calGrid.innerHTML = '';
  const today = new Date(); today.setHours(0,0,0,0);

  for(let i=0;i<totalCells;i++){
    const cell = document.createElement('div');
    cell.className = 'cal-day hidden';

    if(i >= startIdx){
      const dayNum = i - startIdx + 1;
      const thisDate = new Date(calRef.getFullYear(), calRef.getMonth(), dayNum);
      const ds = thisDate.toISOString().slice(0,10);

      cell.classList.remove('hidden');
      cell.classList.add('cal-day'); // re-garante classe base
      cell.innerHTML = `<div class="num">${dayNum}</div><div class="tag">—</div>`;

      // passado = indisponível
      const isPast = thisDate < today;
      if(isPast){
        cell.classList.add('off');
        calGrid.appendChild(cell);
        continue;
      }

      const avail = AVAILABILITY[ds];
      if(!avail || totalSlots(avail) === 0){
        // LOTADO (vermelho)
        cell.classList.add('full');
        cell.querySelector('.tag').textContent = 'Lotado';
      }else{
        // DISPONÍVEL (branco)
        const male = avail.filter(p=>p.sex==='Homem').length;
        const female = avail.filter(p=>p.sex==='Mulher').length;
        cell.querySelector('.tag').textContent = `${totalSlots(avail)} horários • H:${male} M:${female}`;
      }

      cell.addEventListener('click', ()=>selectDay(ds));
    }

    calGrid.appendChild(cell);
  }

  // limpa lateral
  slotInfo.textContent = 'Selecione uma data no calendário.';
  slotList.innerHTML = '';
  calSummary.textContent = 'Clique em um dia para ver os profissionais e horários.';
}

function totalSlots(dayArr){
  return dayArr.reduce((acc,p)=>acc + p.slots.length, 0);
}

function selectDay(isoDate){
  const avail = AVAILABILITY[isoDate];
  slotList.innerHTML = '';

  // atualiza resumo por gênero pro dia
  if(avail && avail.length){
    const male = avail.filter(p=>p.sex==='Homem').length;
    const female = avail.filter(p=>p.sex==='Mulher').length;
    calSummary.textContent = `${formatBr(isoDate)} • Profissionais: H:${male} • M:${female}`;
  }else{
    calSummary.textContent = `${formatBr(isoDate)} • Sem vagas`;
  }

  if(!avail || totalSlots(avail) === 0){
    slotInfo.textContent = `Dia ${formatBr(isoDate)} — lotado.`;
    return;
  }

  // aplica preferência
  const pref = bkTherapist.value;
  let shown = avail;
  if(pref === 'Homem') shown = avail.filter(p=>p.sex==='Homem');
  if(pref === 'Mulher') shown = avail.filter(p=>p.sex==='Mulher');

  slotInfo.textContent = `Dia ${formatBr(isoDate)} — escolha profissional e horário:`;

  if(!shown.length){
    slotList.innerHTML = `<div class="slot-info">Sem profissionais compatíveis com a preferência.</div>`;
    return;
  }

  shown.forEach(p=>{
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
    p.slots.forEach(h=>{
      const b = document.createElement('button');
      b.className = 'time-btn';
      b.textContent = h;
      b.addEventListener('click', ()=>{
        bkDate.value = isoDate;
        bkTime.value = h;
        btnSubmit.disabled = false;
        resumeEl.textContent = `Selecionado: ${formatBr(isoDate)} às ${h} com ${p.name}.`;
        // depois da data/horário -> desce pro formulário
        document.querySelector('#formAgendar').scrollIntoView({behavior:'smooth', block:'start'});
      });
      times.appendChild(b);
    });
    slotList.appendChild(row);
  });
}

function formatBr(iso){ const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; }

// navegação mês
calPrev.addEventListener('click', ()=>{ calRef = new Date(calRef.getFullYear(), calRef.getMonth()-1, 1); renderCalendar(); });
calNext.addEventListener('click', ()=>{ calRef = new Date(calRef.getFullYear(), calRef.getMonth()+1, 1); renderCalendar(); });

// pular pra data específica
calGo.addEventListener('click', ()=>{
  if(!calJump.value) return;
  const d = new Date(calJump.value + 'T00:00:00');
  if(isNaN(+d)) return;
  // muda o mês exibido
  calRef = new Date(d.getFullYear(), d.getMonth(), 1);
  renderCalendar();
  // se o dia estiver nesse mês, já seleciona
  const iso = d.toISOString().slice(0,10);
  const monthMatch = calRef.getFullYear() === d.getFullYear() && calRef.getMonth() === d.getMonth();
  if(monthMatch) selectDay(iso);
});

// inicia calendário escondido, render só na primeira exibição
let calendarRendered = false;
const observer = new MutationObserver(()=>{
  if(!calendarRendered && !calendario.classList.contains('hidden')){
    calendarRendered = true;
    renderCalendar();
  }
});
observer.observe(calendario, { attributes:true, attributeFilter:['class'] });

// ====== SUBMIT DO FORM ======
document.querySelector('#bookingForm')?.addEventListener('submit', e=>{
  e.preventDefault();
  if(!bkService.value){ alert('Selecione um serviço.'); return; }
  if(!bkTherapist.value){ alert('Informe a preferência de terapeuta.'); return; }
  if(!bkClient.value){ alert('Informe o nome do cliente.'); return; }
  if(!bkDate.value || !bkTime.value){
    alert('Escolha a data e o horário no calendário.');
    calendario.scrollIntoView({behavior:'smooth', block:'start'});
    return;
  }

  resumeEl.textContent =
    `Agendamento criado: ${bkClient.value} – ${bkService.value} • `
    + `${formatBr(bkDate.value)} às ${bkTime.value} • `
    + `${bkDuration.value} min • R$ ${bkPrice.value}.`;
  alert('Agendado com sucesso! ');

  // reset parcial
  const keepService  = bkService.value;
  const keepDuration = bkDuration.value;
  const keepPrice    = bkPrice.value;
  e.target.reset();
  bkService.value  = keepService;
  bkDuration.value = keepDuration;
  bkPrice.value    = keepPrice;
  bkDate.value = ''; bkTime.value = ''; btnSubmit.disabled = true;
  slotList.innerHTML = '';
  slotInfo.textContent = 'Selecione uma data no calendário.';
});
