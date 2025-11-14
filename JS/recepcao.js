/* recepcao.js - versão limpa e organizada
*/

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------
     Query selectors / elementos
     ------------------------------ */
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));

  // principais telas / UI
  const servicesScreen = document.querySelector(".services-screen");
  const calendarScreen = document.querySelector("#calendar-screen");
  const postsScreen = document.querySelector("#posts-screen");
  const bookingDetails = document.createElement("div");
  bookingDetails.id = "bookingDetails";

  // calendar controls
  const calendarGrid = document.getElementById("calendarGrid");
  const monthYear = document.getElementById("monthYear");
  const prevMonthBtn = $("#prevMonth");
  const nextMonthBtn = $("#nextMonth");
  const agendamentoShortcut = document.querySelector('a[href="#atendimentos"]');
  const postsShortcut = document.querySelector('a[href="#controle-login"]');
  const servicesShortcut = document.getElementById('shortcut-servicos-novos') || document.querySelector('a[href="#servicos-novos"]');

  // posts
  const listaPosts = document.getElementById("listaPosts");
  const novoPostBtn = document.getElementById("novoPostBtn");

  // modal / form agendamento
  const formOverlay = document.getElementById("formOverlay");
  const formAgendamento = document.getElementById("formAgendamento");
  const cancelarAg = document.getElementById("cancelarAg");
  const clienteNomeInput = document.getElementById('clienteNome');
  const clienteTelInput = document.getElementById('clienteTel');
  const servicoSelect = document.getElementById('servicoSelect');
  const tempoSelect = document.getElementById('tempoSelect');
  const precoInput = document.getElementById('precoInput');
  const confirmarBtn = document.getElementById('confirmarAgendamento');
  const colabIdInput = document.getElementById('colabIdAg'); // hidden input on the form
  const dataAgInput = document.getElementById('dataAg');
  const horaAgInput = document.getElementById('horaAg');
  const profAgInput = document.getElementById('profAg');

  // cliente overlay (cadastro)
  const clienteOverlay = document.getElementById("clienteOverlay");
  const formCliente = document.getElementById("formCliente");
  const cancelarCliente = document.getElementById("cancelarCliente");
  const novoClienteLink = document.getElementById("novoCliente");

  // logout controls (if present)
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutPopup = document.getElementById("logoutPopup");
  const confirmLogout = document.getElementById("confirmLogout");
  const cancelLogout = document.getElementById("cancelLogout");

  // local storage unidade/user
  const unidadeAtual = JSON.parse(localStorage.getItem('rokuzen.currentUnit') || '{}');
  const unidadeId = unidadeAtual.id || 1;

  /* ------------------------------
     Utilitários
     ------------------------------ */
  function generateId() {
    return 'p_' + Math.random().toString(36).slice(2, 9);
  }

  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function isoToDisplayDate(isoOrYmd) {
    // aceita 'YYYY-MM-DD' ou ISO completo
    const d = new Date(isoOrYmd);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("pt-BR");
  }

  function displayToYmd(displayDate) {
    // displayDate esperado: dd/mm/yyyy
    const parts = (displayDate || "").split("/");
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  function safeFetchJson(url, opts) {
    return fetch(url, opts).then(async resp => {
      if (!resp.ok) {
        const txt = await resp.text().catch(() => null);
        throw new Error(txt || `HTTP ${resp.status}`);
      }
      return resp.json();
    });
  }

  /* ------------------------------
     POSTS (demo) - mantive funcionalidade
     ------------------------------ */
  const postsExemplo = [
    { id: generateId(), titulo: "Benefícios da Quick Massage 💆‍♂️", conteudo: "A Quick Massage ajuda a aliviar..." },
    { id: generateId(), titulo: "Reflexologia Podal 👣", conteudo: "Essa técnica milenar estimula..." }
  ];

  function createPostElement(post) {
    const postEl = document.createElement("div");
    postEl.className = "post-item";
    postEl.dataset.postId = post.id;
    postEl.innerHTML = `
      <h4 class="post-title">${escapeHtml(post.titulo)}</h4>
      <p class="post-content">${escapeHtml(post.conteudo)}</p>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn-editar">Editar</button>
        <button class="btn-remover">Remover</button>
      </div>
    `;
    const btnRem = postEl.querySelector(".btn-remover");
    const btnEdit = postEl.querySelector(".btn-editar");

    btnRem.addEventListener("click", () => {
      if (confirm("Remover este post?")) postEl.remove();
    });
    btnEdit.addEventListener("click", () => {
      const novoTitulo = prompt("Editar título:", post.titulo);
      if (novoTitulo === null) return;
      const novoConteudo = prompt("Editar conteúdo:", post.conteudo);
      if (novoConteudo === null) return;
      post.titulo = novoTitulo;
      post.conteudo = novoConteudo;
      postEl.querySelector(".post-title").textContent = novoTitulo;
      postEl.querySelector(".post-content").textContent = novoConteudo;
    });

    return postEl;
  }

  function renderPostsExemplo() {
    if (!listaPosts) return;
    listaPosts.innerHTML = "";
    postsExemplo.forEach(p => listaPosts.appendChild(createPostElement(p)));
  }

  if (novoPostBtn) {
    novoPostBtn.addEventListener("click", () => {
      const titulo = prompt("Título do post:");
      if (!titulo) return;
      const conteudo = prompt("Conteúdo do post:");
      if (!conteudo) return;
      const novo = { id: generateId(), titulo, conteudo };
      listaPosts.prepend(createPostElement(novo));
    });
  }

  /* ------------------------------
     Navegação entre telas (simples)
     ------------------------------ */
  function showScreen(screenEl) {
    [servicesScreen, calendarScreen, postsScreen].forEach(s => {
      if (!s) return;
      s.classList.toggle("hidden", s !== screenEl);
      // também limpa inline display
      if (s === screenEl) s.style.display = "";
      else s.style.display = "none";
    });
  }

  if (servicesShortcut) {
    servicesShortcut.addEventListener("click", (e) => {
      e.preventDefault();
      showScreen(servicesScreen);
    });
  }
  if (agendamentoShortcut) {
    agendamentoShortcut.addEventListener("click", (e) => { e.preventDefault(); showScreen(calendarScreen); });
  }
  if (postsShortcut) {
    postsShortcut.addEventListener("click", (e) => { e.preventDefault(); showScreen(postsScreen); });
  }

  /* ------------------------------
     Calendário & horários
     ------------------------------ */
  calendarScreen && calendarScreen.appendChild(bookingDetails);

  async function carregarAgendamentos(unidadeId, ano, mes) {
    // espera retornar array [{ data: 'YYYY-MM-DD', lotado: 1 }, ...]
    return await safeFetchJson(`http://localhost:3000/api/atendimentos/mensal?unidade_id=${unidadeId}&ano=${ano}&mes=${mes}`);
  }

  let currentDate = new Date();

  async function renderCalendar() {
    if (!calendarGrid || !monthYear) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // atualizar título
    const monthName = currentDate.toLocaleString("pt-BR", { month: "long" });
    monthYear.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

    calendarGrid.innerHTML = "";

    // get ocupação do backend
    let agendamentos = [];
    try {
      agendamentos = await carregarAgendamentos(unidadeId, year, month + 1);
    } catch (err) {
      console.error("Erro carregarAgendamentos:", err);
      // fallback vazio
      agendamentos = [];
    }
    const diasLotados = new Set(agendamentos.filter(a => a.lotado).map(a => a.data));

    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "calendar-day disabled";
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= lastDay; day++) {
      const y = year;
      const m = String(month + 1).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      const fullDate = `${y}-${m}-${d}`;

      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";
      dayEl.textContent = day;

      if (diasLotados.has(fullDate)) dayEl.classList.add("full");
      else dayEl.classList.add("available");

      dayEl.addEventListener("click", async () => {
        try {
          const resp = await safeFetchJson(`http://localhost:3000/api/atendimentos/disponiveis?unidade_id=${unidadeId}&data=${fullDate}`);
          showAvailableOptions(fullDate, resp);
        } catch (err) {
          console.error("Erro ao carregar horários:", err);
          bookingDetails.innerHTML = `<div class="booking-card"><p>Erro ao carregar horários disponíveis.</p></div>`;
        }
      });

      calendarGrid.appendChild(dayEl);
    }
  }

  prevMonthBtn && prevMonthBtn.addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
  nextMonthBtn && nextMonthBtn.addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

  /* ------------------------------
     Mostrar horários e Agendar (event delegation)
     ------------------------------ */
  function showAvailableOptions(date, horarios = []) {
    const dataObj = new Date(date + "T00:00");
    const dataFormatada = dataObj.toLocaleDateString("pt-BR");

    if (!horarios.length) {
      bookingDetails.innerHTML = `<p>Sem horários disponíveis em ${dataFormatada}</p>`;
      return;
    }

    bookingDetails.innerHTML = `
      <h3>Horários disponíveis — ${dataFormatada}</h3>
      ${horarios.map(h => `
        <div class="horario-item">
          <strong>${h.horario}</strong> — ${escapeHtml(h.profissional)}
          <button class="btn-agendar" data-horario="${h.horario}" data-prof="${h.profissional}" data-colab="${h.colaborador_id}" data-data="${date}">Agendar</button>
        </div>`).join("")}
    `;
  }

  // Delegation: escuta clicks em bookingDetails (para botões criados dinamicamente)
  bookingDetails.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-agendar");
    if (!btn) return;
    const horario = btn.dataset.horario;
    const prof = btn.dataset.prof;
    const colab = btn.dataset.colab;
    const data = btn.dataset.data; // YYYY-MM-DD

    // Preenche modal corretamente
    if (formOverlay) formOverlay.classList.add("active");
    if (dataAgInput) dataAgInput.value = isoToDisplayDate(data); // dd/mm/yyyy
    if (horaAgInput) horaAgInput.value = horario;
    if (profAgInput) profAgInput.value = prof;
    if (colabIdInput) colabIdInput.value = colab;
    // reset serviço/tempo/preço (user will select)
    if (servicoSelect) servicoSelect.value = "";
    if (tempoSelect) tempoSelect.innerHTML = `<option value="">Selecione um serviço</option>`;
    if (precoInput) precoInput.value = "";
  });

  /* ------------------------------
     Modal ações (confirmar / cancelar)
     ------------------------------ */
  cancelarAg && cancelarAg.addEventListener("click", () => {
    formOverlay && formOverlay.classList.remove("active");
  });

  // Ao confirmar: envia /api/atendimentos
  confirmarBtn && confirmarBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!clienteSelecionado) {
      alert("Selecione um cliente válido pelo nome ou telefone (ou cadastre novo).");
      return;
    }

    const cliente_id = clienteSelecionado.cliente_id;
    const colaborador_id = Number(colabIdInput?.value || 0);
    const servico_id = Number(servicoSelect?.value || 0);
    const preco_id = Number(tempoSelect?.value || 0);
    const dataText = dataAgInput?.value; // 'dd/mm/yyyy'
    const horaText = horaAgInput?.value; // 'hh:mm'

    if (!dataText || !horaText || !colaborador_id || !servico_id || !preco_id) {
      alert("Preencha data, hora, profissional, serviço e tempo (preço).");
      return;
    }

    const [d, m, y] = dataText.split('/');
    const isoStart = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${horaText}:00`;
    const currentUser = JSON.parse(localStorage.getItem('rokuzen.currentUser') || '{}');
    const criado_por = currentUser?.id || null;

    try {
      const result = await safeFetchJson('/api/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidade_id: unidadeId,
          cliente_id,
          colaborador_id,
          servico_id,
          preco_id,
          data_inicio: isoStart,
          criado_por
        })
      });
      alert('Agendamento criado! ID: ' + (result.atendimento_id || result.id || ""));
      formOverlay && formOverlay.classList.remove("active");

      // 1. Re-renderiza o calendário (se necessário)
      renderCalendar();

      // 2. [NOVO] Recarrega os horários disponíveis para o dia agendado
      const dataText = dataAgInput?.value;
      if (dataText) {
        const [d, m, y] = dataText.split('/');
        const fullDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

        try {
          const resp = await safeFetchJson(`http://localhost:3000/api/atendimentos/disponiveis?unidade_id=${unidadeId}&data=${fullDate}`);
          showAvailableOptions(fullDate, resp);
        } catch (err) {
          console.error("Erro ao recarregar horários:", err);
          bookingDetails.innerHTML = `<div class="booking-card"><p>Erro ao recarregar horários.</p></div>`;
        }
      }

    } catch (err) {
      console.error(err);
      alert('Erro ao criar agendamento: ' + err.message);
    }
  });

  /* ------------------------------
     Serviços / tempos (preços)
     ------------------------------ */
  async function carregarServicos() {
    if (!servicoSelect) return;
    servicoSelect.innerHTML = `<option value="">Carregando...</option>`;
    try {
      const lista = await safeFetchJson('/api/servicos');
      servicoSelect.innerHTML = `<option value="">Selecione</option>`;
      lista.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.servico_id;
        opt.textContent = s.nome_servico;
        servicoSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("ERRO SERVIÇOS:", err);
      servicoSelect.innerHTML = `<option value="">Erro ao carregar</option>`;
    }
  }

  servicoSelect && servicoSelect.addEventListener("change", async (e) => {
    const servicoId = e.target.value;
    tempoSelect && (tempoSelect.innerHTML = `<option value="">Carregando...</option>`);
    precoInput && (precoInput.value = "");
    if (!servicoId) {
      tempoSelect && (tempoSelect.innerHTML = `<option value="">Selecione um serviço</option>`);
      return;
    }
    try {
      const precos = await safeFetchJson(`/api/servicos/${servicoId}/precos`);
      tempoSelect.innerHTML = `<option value="">Selecione</option>`;
      precos.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.preco_id;
        opt.textContent = `${p.duracao_min} min — R$ ${Number(p.valor).toFixed(2)}`;
        opt.dataset.valor = p.valor;
        opt.dataset.duracao = p.duracao_min;
        tempoSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("ERRO TEMPOS:", err);
      tempoSelect.innerHTML = `<option value="">Erro</option>`;
    }
  });

  tempoSelect && tempoSelect.addEventListener("change", (e) => {
    const opt = e.target.selectedOptions[0];
    precoInput.value = opt ? Number(opt.dataset.valor).toFixed(2) : "";
  });

  /* ------------------------------
     Autocomplete clientes (simples)
     ------------------------------ */
  let clienteSelecionado = null;

  async function buscarClientesPorNome(q) {
    if (!q || q.length < 2) return [];
    return await safeFetchJson(`/api/clientes/buscar?nome=${encodeURIComponent(q)}`);
  }
  async function buscarClientesPorTelefone(q) {
    if (!q || q.length < 2) return [];
    return await safeFetchJson(`/api/clientes/buscarTelefone?telefone=${encodeURIComponent(q)}`);
  }

  function mostrarSugestoes(inputEl, items, onSelect) {
    let cont = inputEl.nextElementSibling;
    if (cont && cont.classList.contains('autocomplete')) cont.remove();

    const div = document.createElement('div');
    div.className = 'autocomplete';
    div.style.position = 'absolute';
    div.style.background = '#222';
    div.style.color = '#fff';
    div.style.border = '1px solid #444';
    div.style.borderRadius = '6px';
    div.style.maxHeight = '150px';
    div.style.overflowY = 'auto';
    div.style.zIndex = 2000;
    div.style.width = inputEl.offsetWidth + 'px';

    items.forEach(it => {
      const r = document.createElement('div');
      r.className = 'item';
      r.style.padding = '8px';

      // Corrigindo campos inexistentes
      const nome = it.nome_cliente || it.nome || "";
      const telefone = it.telefone || it.celular || it.telefone_cliente || "";

      // Se digitando telefone → telefone — nome
      if (inputEl.id === "clienteTel") {
        r.textContent = `${telefone} — ${nome}`;
      } else {
        r.textContent = `${nome} — ${telefone}`;
      }

      r.addEventListener('click', () => onSelect(it));
      div.appendChild(r);
    });

    inputEl.parentNode.insertBefore(div, inputEl.nextSibling);
  }

  /* --- DIGITANDO NOME --- */
  clienteNomeInput.addEventListener('input', async (e) => {
    const q = e.target.value;
    if (!q || q.length < 2) {
      clienteSelecionado = null;
      return;
    }
    try {
      const list = await buscarClientesPorNome(q);
      mostrarSugestoes(clienteNomeInput, list, (item) => {
        clienteSelecionado = item;
        clienteNomeInput.value = item.nome_cliente;
        clienteTelInput.value = item.telefone || "";
        const el = clienteNomeInput.nextElementSibling;
        if (el && el.classList.contains('autocomplete')) el.remove();
      });
    } catch (err) {
      console.error("erro buscar clientes por nome:", err);
    }
  });

  clienteNomeInput.addEventListener('input', async (e) => {
    const q = e.target.value;
    if (!q || q.length < 2) {
      clienteSelecionado = null;
      return;
    }

    try {
      const list = await buscarClientesPorNome(q);
      mostrarSugestoes(clienteNomeInput, list, (item) => {
        clienteSelecionado = item;

        const nome = item.nome_cliente || item.nome || "";
        const telefone = item.telefone || item.celular || item.telefone_cliente || "";

        clienteNomeInput.value = nome;
        clienteTelInput.value = telefone;

        const el = clienteNomeInput.nextElementSibling;
        if (el && el.classList.contains('autocomplete')) el.remove();
      });
    } catch (err) {
      console.error("erro buscar clientes por nome:", err);
    }
  });

  /* ------------------------------
     Cliente - cadastro modal (simples)
     ------------------------------ */
  novoClienteLink && novoClienteLink.addEventListener('click', (e) => {
    e.preventDefault();
    formOverlay && formOverlay.classList.remove("active");
    clienteOverlay && clienteOverlay.classList.add("active");
  });
  cancelarCliente && cancelarCliente.addEventListener('click', () => {
    clienteOverlay && clienteOverlay.classList.remove("active");
    formOverlay && formOverlay.classList.add("active");
  });
  formCliente && formCliente.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("✅ Cliente cadastrado com sucesso!");
    clienteOverlay && clienteOverlay.classList.remove("active");
    formOverlay && formOverlay.classList.add("active");
  });

  /* ------------------------------
     Logout popup (se existir)
     ------------------------------ */
  if (logoutBtn && logoutPopup) {
    logoutBtn.addEventListener("click", () => {
      logoutPopup.classList.add("active");
      document.body.style.overflow = "hidden";
    });
    cancelLogout && cancelLogout.addEventListener("click", () => {
      logoutPopup.classList.remove("active");
      document.body.style.overflow = "";
    });
    confirmLogout && confirmLogout.addEventListener("click", () => {
      logoutPopup.classList.remove("active");
      document.body.style.overflow = "";
      setTimeout(() => {
        localStorage.clear(); sessionStorage.clear();
        window.location.href = "login.html";
      }, 200);
    });
    logoutPopup.addEventListener("click", (e) => {
      if (e.target === logoutPopup) {
        logoutPopup.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && logoutPopup.classList.contains("active")) {
        logoutPopup.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }

  /* ------------------------------
     Inicialização
     ------------------------------ */
  renderPostsExemplo();
  carregarServicos();
  renderCalendar();
});
