document.addEventListener("DOMContentLoaded", () => {
  const servicesScreen = document.querySelector(".services-screen");
  const calendarScreen = document.querySelector("#calendar-screen");
  const agendamentoShortcut = document.querySelector('a[href="#atendimentos"]');
  const calendarGrid = document.getElementById("calendarGrid");
  const monthYear = document.getElementById("monthYear");
  const unidadeAtual = JSON.parse(localStorage.getItem('rokuzen.currentUnit') || '{}');
  const unidadeId = unidadeAtual.id || 1; // fallback

  // elementos do modal / form
  const clienteNomeInput = document.getElementById('clienteNome'); // seu campo
  const clienteTelInput = document.getElementById('clienteTel'); // seu campo
  const servicoSelect = document.getElementById('servicoSelect'); // id do select de serviços no form
  const tempoSelect = document.getElementById('tempoSelect'); // select de tempos
  const precoInput = document.getElementById('precoInput'); // campo preço
  const confirmarBtn = document.getElementById('confirmarAgendamento'); // botão confirmar


  const servicesShortcut = document.getElementById('shortcut-servicos-novos') || document.querySelector('a[href="#servicos-novos"]');

  servicesShortcut.addEventListener('click', (e) => {
    e.preventDefault();
    // mostra serviços
    servicesScreen.classList.remove('hidden');
    servicesScreen.style.display = ''; // limpa possível inline

    // oculta as outras telas (se existirem)
    if (calendarScreen) calendarScreen.classList.add('hidden');
    if (postsScreen) postsScreen.classList.add('hidden');
  });


  // ===== POSTS (criar, editar, remover + exemplos) =====
  const postsScreen = document.querySelector("#posts-screen");
  const postsShortcut = document.querySelector('a[href="#controle-login"]');
  const listaPosts = document.getElementById("listaPosts");
  const novoPostBtn = document.getElementById("novoPostBtn");

  // Posts de exemplo iniciais
  const postsExemplo = [
    {
      id: generateId(),
      titulo: "Benefícios da Quick Massage 💆‍♂️",
      conteudo:
        "A Quick Massage ajuda a aliviar o estresse, melhorar a circulação e aumentar o bem-estar em apenas 25 minutos. Ideal para pausas durante o expediente!"
    },
    {
      id: generateId(),
      titulo: "Reflexologia Podal 👣",
      conteudo:
        "Essa técnica milenar estimula pontos específicos dos pés para equilibrar o corpo e aliviar dores. Experimente e sinta a diferença!"
    }
  ];

  // Função utilitária para gerar um id simples
  function generateId() {
    return 'p_' + Math.random().toString(36).slice(2, 9);
  }

  // Função que cria o elemento DOM do post (reutilizável para exemplo e novo post)
  function createPostElement(post) {
    const postEl = document.createElement("div");
    postEl.classList.add("post-item");
    postEl.dataset.postId = post.id;
    postEl.innerHTML = `
      <h4 class="post-title">${escapeHtml(post.titulo)}</h4>
      <p class="post-content">${escapeHtml(post.conteudo)}</p>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn-editar">Editar</button>
        <button class="btn-remover">Remover</button>
      </div>
    `;

    // Remover
    postEl.querySelector(".btn-remover").addEventListener("click", () => {
      if (confirm("Remover este post?")) postEl.remove();
    });

    // Editar
    postEl.querySelector(".btn-editar").addEventListener("click", () => {
      const novoTitulo = prompt("Editar título:", post.titulo);
      if (novoTitulo === null) return; // cancelou
      const novoConteudo = prompt("Editar conteúdo:", post.conteudo);
      if (novoConteudo === null) return; // cancelou

      // Atualiza dados no elemento e também no objeto post se necessário
      post.titulo = novoTitulo;
      post.conteudo = novoConteudo;
      postEl.querySelector(".post-title").textContent = novoTitulo;
      postEl.querySelector(".post-content").textContent = novoConteudo;
    });

    return postEl;
  }

  // Escapa HTML básico para evitar injeção acidental (útil se inserir texto livre)
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // Renderiza os posts de exemplo
  function renderPostsExemplo() {
    listaPosts.innerHTML = "";
    postsExemplo.forEach(post => {
      const el = createPostElement(post);
      listaPosts.appendChild(el);
    });
  }

  // Novo post (botão)
  novoPostBtn.addEventListener("click", () => {
    const titulo = prompt("Título do post:");
    if (!titulo) return;
    const conteudo = prompt("Conteúdo do post:");
    if (!conteudo) return;

    const novoPost = { id: generateId(), titulo, conteudo };
    // adiciona no topo da lista visual
    const el = createPostElement(novoPost);
    listaPosts.prepend(el);
  });

  // abre a tela de posts
  postsShortcut.addEventListener("click", (e) => {
    e.preventDefault();
    servicesScreen.style.display = "none";
    calendarScreen.classList.add("hidden");
    postsScreen.classList.remove("hidden");
  });

  // chama ao carregar para mostrar os exemplos
  renderPostsExemplo();


  // Container para exibir detalhes abaixo do calendário
  const bookingDetails = document.createElement("div");
  bookingDetails.id = "bookingDetails";
  calendarScreen.appendChild(bookingDetails);

  async function carregarAgendamentos(unidadeId, ano, mes) {
    const resp = await fetch(`http://localhost:3000/api/atendimentos/mensal?unidade_id=${unidadeId}&ano=${ano}&mes=${mes}`);
    if (!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);
    return await resp.json();
  }


  // === NAVEGAÇÃO ENTRE TELAS ===

  // Vai para tela de agendamento
  agendamentoShortcut.addEventListener("click", (e) => {
    e.preventDefault();
    servicesScreen.style.display = "none";
    postsScreen.classList.add("hidden");
    calendarScreen.classList.remove("hidden");
  });

  // Vai para tela de posts
  postsShortcut.addEventListener("click", (e) => {
    e.preventDefault();
    servicesScreen.style.display = "none";
    calendarScreen.classList.add("hidden");
    postsScreen.classList.remove("hidden");
  });

  // === CRIAÇÃO DE POSTS ===
  novoPostBtn.addEventListener("click", () => {
    const titulo = prompt("Título do post:");
    const conteudo = prompt("Conteúdo do post:");

    if (!titulo || !conteudo) return;

    const postEl = document.createElement("div");
    postEl.classList.add("post-item");
    postEl.innerHTML = `
      <h4>${titulo}</h4>
      <p>${conteudo}</p>
      <button class="btn-remover">Remover</button>
    `;

    postEl.querySelector(".btn-remover").addEventListener("click", () => {
      postEl.remove();
    });

    listaPosts.prepend(postEl);
  });

  // === CALENDÁRIO ===

  let currentDate = new Date();

  async function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 🔹 Pega a unidade logada (igual aos outros módulos)
    const unidadeAtual = JSON.parse(localStorage.getItem("rokuzen.currentUnit") || "{}");
    const unidadeId = unidadeAtual?.id || 1;

    // 🔹 Busca no backend os agendamentos e define dias lotados
    const agendamentos = await carregarAgendamentos(unidadeId, year, month + 1);
    const diasLotados = new Set(agendamentos.filter(a => a.lotado).map(a => a.data));

    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const monthName = currentDate.toLocaleString("pt-BR", { month: "long" });
    monthYear.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

    calendarGrid.innerHTML = "";

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.classList.add("calendar-day", "disabled");
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= lastDay; day++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEl = document.createElement("div");
      dayEl.classList.add("calendar-day");
      dayEl.textContent = day;

      if (diasLotados.has(fullDate)) {
        dayEl.classList.add("full"); // vermelho
      } else {
        dayEl.classList.add("available"); // verde
      }

      dayEl.addEventListener("click", async () => {
        const unidadeAtual = JSON.parse(localStorage.getItem("rokuzen.currentUnit") || "{}");
        const unidadeId = unidadeAtual?.id || 1;
        const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        try {
          const resp = await fetch(`http://localhost:3000/api/atendimentos/disponiveis?unidade_id=${unidadeId}&data=${fullDate}`);
          if (!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);
          const horarios = await resp.json();
          showAvailableOptions(fullDate, horarios);
        } catch (err) {
          console.error("Erro ao carregar horários:", err);
          bookingDetails.innerHTML = `<div class="booking-card"><p>Erro ao carregar horários disponíveis.</p></div>`;
        }
      });


      calendarGrid.appendChild(dayEl);
    }
  }

  function showBookings(date) {
    const agendamentos = fakeBookings[date];
    const dataFormatada = new Date(date + "T00:00").toLocaleDateString("pt-BR");

    bookingDetails.innerHTML = `
      <div class="booking-card">
        <h3>Agendamentos - ${dataFormatada}</h3>
        ${agendamentos
        .map(
          (b) => `
            <div class="booking-item">
              <strong>${b.horario}</strong> - ${b.cliente}<br>
              <span>${b.servico}</span>
            </div>`
        )
        .join("")}
      </div>
    `;
  }

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
        <div>
          <strong>${h.horario}</strong> — ${h.profissional}
          <button class="btn-agendar" data-horario="${h.horario}" data-prof="${h.profissional}" data-colab="${h.colaborador_id}">Agendar</button>
        </div>`).join("")}
    `;
  }



  document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  renderCalendar();
});

// ==== LOGOUT ==== 
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const popup = document.getElementById("logoutPopup");
  const confirmBtn = document.getElementById("confirmLogout");
  const cancelBtn = document.getElementById("cancelLogout");

  if (!logoutBtn || !popup) return;

  // Abre o popup ao clicar no botão de sair
  logoutBtn.addEventListener("click", () => {
    popup.classList.add("active");
    document.body.style.overflow = "hidden"; // bloqueia o scroll de fundo
  });

  // Fecha o popup ao clicar em "Cancelar"
  cancelBtn.addEventListener("click", () => {
    popup.classList.remove("active");
    document.body.style.overflow = "";
  });

  // Confirma o logout
  confirmBtn.addEventListener("click", () => {
    popup.classList.remove("active");
    document.body.style.overflow = "";
    setTimeout(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "login.html"; // redireciona para tela de login
    }, 200);
  });

  // Fecha o popup se clicar fora da caixa
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Fecha com tecla ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup.classList.contains("active")) {
      popup.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
});
// ======== FORMULÁRIO DE AGENDAMENTO ========
const formOverlay = document.getElementById("formOverlay");
const formAgendamento = document.getElementById("formAgendamento");
const cancelarAg = document.getElementById("cancelarAg");
const novoClienteBtn = document.getElementById("novoCliente");

// Função para abrir o formulário
function openAgendamentoForm(data, hora, prof) {
  formOverlay.classList.add("active");
  document.getElementById("dataAg").value = new Date(data + "T00:00").toLocaleDateString("pt-BR");
  document.getElementById("horaAg").value = hora;
  document.getElementById("profAg").value = prof;
}

// Fecha o formulário
cancelarAg.addEventListener("click", () => {
  formOverlay.classList.remove("active");
});

// // Envio do formulário
// formAgendamento.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   try {
//     const dataISO = document.getElementById('dataAg').value; // "YYYY-MM-DD"
//     const hora = document.getElementById('horaAg').value;    // "09:00"
//     const profNome = document.getElementById('profAg').value;
//     const clienteNome = document.getElementById('clienteAg').value.trim();
//     const telefone = document.getElementById('telAg').value.trim();
//     const servicoId = document.getElementById('servicoAg').value;
//     const tempoMin = parseInt(document.getElementById('tempoAg').value, 10);

//     if (!clienteNome || !telefone || !servicoId || !tempoMin) {
//       alert('Preencha todos os campos.');
//       return;
//     }

//     // 1) procurar cliente por telefone (ajuste a rota se precisar)
//     let clienteId = null;
//     let resp = await fetch(`http://localhost:3000/api/clientes/search?term=${encodeURIComponent(telefone)}`);
//     if (resp.ok) {
//       const found = await resp.json();
//       if (found && found.length > 0) clienteId = found[0].cliente_id;
//     }

//     // 2) se não achou, cria cliente
//     if (!clienteId) {
//       resp = await fetch('http://localhost:3000/api/clientes', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ nome: clienteNome, telefone })
//       });
//       if (!resp.ok) throw new Error('Erro ao criar cliente');
//       const created = await resp.json();
//       clienteId = created.cliente_id || created.insertId || created.id;
//     }

//     // 3) buscar colaborador_id pelo nome do profissional (ou, melhor, passar id quando gerar slots)
//     // aqui eu tento procurar pelo nome (melhor alterar o retorno de /disponiveis pra trazer colaborador_id)
//     let colaboradorId = null;
//     resp = await fetch(`http://localhost:3000/api/colaboradores?nome=${encodeURIComponent(profNome)}`);
//     if (resp.ok) {
//       const arr = await resp.json();
//       if (arr.length) colaboradorId = arr[0].colaborador_id;
//     }

//     if (!colaboradorId) {
//       alert('Erro: não foi possível identificar o profissional selecionado.');
//       return;
//     }

//     // 4) calcular hora_fim (hora + tempoMin)
//     function addMinutesToTime(timeStr, minutesToAdd) {
//       const [hh, mm] = timeStr.split(':').map(Number);
//       const date = new Date(0, 0, 0, hh, mm);
//       date.setMinutes(date.getMinutes() + minutesToAdd);
//       return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
//     }
//     const hora_inicio = `${hora}:00`;
//     const hora_fim = addMinutesToTime(hora, tempoMin);

//     // 5) unidade: pega do localStorage (mesmo padrão usado quando listar)
//     const unidadeAtual = JSON.parse(localStorage.getItem("rokuzen.currentUnit") || "{}");
//     const unidadeId = unidadeAtual?.id || 1;

//     // 6) POST /api/atendimentos
//     resp = await fetch('http://localhost:3000/api/atendimentos', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         cliente_id: clienteId,
//         colaborador_id: colaboradorId,
//         servico_id: servicoId,
//         unidade_id: unidadeId,
//         data_atendimento: dataISO,
//         hora_inicio,
//         hora_fim,
//         observacoes: ''
//       })
//     });
//     if (!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);
//     const result = await resp.json();

//     alert('✅ Agendamento realizado com sucesso!');
//     formOverlay.classList.remove('active');
//     renderCalendar(); // atualiza calendário
//   } catch (err) {
//     console.error('Erro ao criar agendamento:', err);
//     alert('Erro ao salvar agendamento: ' + err.message);
//   }
// });


// ======== CONECTAR AO CALENDÁRIO ========
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-agendar")) {
    const container = e.target.closest("#bookingDetails");
    const titulo = container.querySelector("h3").textContent;
    const dataTexto = titulo.replace("Horários disponíveis — ", "").trim();
    const dataISO = new Date(dataTexto.split("/").reverse().join("-")).toISOString().split("T")[0];
    const hora = e.target.dataset.horario;
    const prof = e.target.dataset.prof;

    openAgendamentoForm(dataISO, hora, prof);
  }
});

// ======== FORMULÁRIO DE CADASTRO DE CLIENTE ========
const clienteOverlay = document.getElementById("clienteOverlay");
const formCliente = document.getElementById("formCliente");
const cancelarCliente = document.getElementById("cancelarCliente");

// Quando clicar em "Cadastrar novo cliente"
const novoCliente = document.getElementById("novoCliente");
novoClienteBtn.addEventListener("click", (e) => {
  e.preventDefault();
  formOverlay.classList.remove("active"); // fecha o agendamento
  clienteOverlay.classList.add("active"); // abre o cadastro
});

// Cancelar no cadastro de cliente
cancelarCliente.addEventListener("click", () => {
  clienteOverlay.classList.remove("active");
  formOverlay.classList.add("active"); // volta pro agendamento
});

// Enviar o cadastro de cliente
formCliente.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("✅ Cliente cadastrado com sucesso!");
  clienteOverlay.classList.remove("active");
  formOverlay.classList.add("active");
});

// Captura os valores do formulário (incluindo as novas seções)
document.getElementById("formCliente").addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const condicoes = formData.getAll("condicoes[]");
  const alergias = formData.getAll("alergias[]");
  const historico = formData.getAll("historico[]");

  console.log("Condições médicas:", condicoes);
  console.log("Alergias:", alergias);
  console.log("Histórico de saúde:", historico);

  // Aqui você pode enviar os dados via fetch() ou salvar localmente
});

document.querySelectorAll(".checkbox-list").forEach((group) => {
  const checkboxes = group.querySelectorAll('input[type="checkbox"]');
  const noneBox = group.querySelector('input[value="nenhuma"]');

  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb === noneBox && cb.checked) {
        // Se marcou "Nenhuma", desmarca as outras
        checkboxes.forEach((c) => {
          if (c !== noneBox) c.checked = false;
        });
      } else if (cb !== noneBox && cb.checked) {
        // Se marcou outra, desmarca "Nenhuma"
        noneBox.checked = false;
      }
    });
  });
});
// abrir/fechar modal (quando precisar, adicione/remova a classe 'active' no clienteOverlay)
const clienteOverlayEl = document.getElementById('clienteOverlay');
const cancelarClienteBtn = document.getElementById('cancelarCliente');

if (cancelarClienteBtn && clienteOverlayEl) {
  cancelarClienteBtn.addEventListener('click', () => {
    clienteOverlayEl.classList.remove('active');
    document.body.style.overflow = '';
  });

  // fechar ao clicar fora da box
  clienteOverlayEl.addEventListener('click', (e) => {
    if (e.target === clienteOverlayEl) {
      clienteOverlayEl.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// "Nenhuma" — comportamento: marcar nenhuma desmarca as outras; marcar qualquer outra desmarca "Nenhuma"
document.querySelectorAll('.checkbox-list').forEach(group => {
  const checkboxes = Array.from(group.querySelectorAll('input[type="checkbox"]'));
  const noneCheckbox = group.querySelector('input[value="nenhuma"]');

  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (!noneCheckbox) return;
      if (cb === noneCheckbox && cb.checked) {
        // desmarca todas as outras
        checkboxes.forEach(c => { if (c !== noneCheckbox) c.checked = false; });
      } else if (cb !== noneCheckbox && cb.checked) {
        // desmarca 'nenhuma'
        noneCheckbox.checked = false;
      }
    });
  });
});

let clienteSelecionado = null;

async function buscarClientesPorNome(q) {
  if (!q || q.length < 2) return [];
  const resp = await fetch(`/api/clientes/buscar?nome=${encodeURIComponent(q)}`);
  return await resp.json();
}

async function buscarClientesPorTelefone(q) {
  if (!q || q.length < 2) return [];
  const resp = await fetch(`/api/clientes/buscarTelefone?telefone=${encodeURIComponent(q)}`);
  return await resp.json();
}

// Exemplo simples de dropdown de sugestoes (pode usar um datalist ou sua UI)
function mostrarSugestoes(inputEl, items, onSelect) {
  // remove dropdown antigo
  let cont = inputEl.nextElementSibling;
  if (cont && cont.classList.contains('autocomplete')) cont.remove();

  const div = document.createElement('div');
  div.className = 'autocomplete';
  div.style.position = 'absolute';
  div.style.background = '#fff';
  div.style.zIndex = 2000;
  items.forEach(it => {
    const r = document.createElement('div');
    r.className = 'item';
    r.style.padding = '8px';
    r.textContent = `${it.nome_cliente} — ${it.telefone || ''}`;
    r.addEventListener('click', () => onSelect(it));
    div.appendChild(r);
  });
  inputEl.parentNode.insertBefore(div, inputEl.nextSibling);
}

clienteNomeInput.addEventListener('input', async (e) => {
  const q = e.target.value;
  const list = await buscarClientesPorNome(q);
  mostrarSugestoes(clienteNomeInput, list, (item) => {
    clienteSelecionado = item;
    clienteNomeInput.value = item.nome_cliente;
    clienteTelInput.value = item.telefone || "";
    // remove sugestoes
    const el = clienteNomeInput.nextElementSibling;
    if (el && el.classList.contains('autocomplete')) el.remove();
  });
});

clienteTelInput.addEventListener('input', async (e) => {
  const q = e.target.value;
  const list = await buscarClientesPorTelefone(q);
  mostrarSugestoes(clienteTelInput, list, (item) => {
    clienteSelecionado = item;
    clienteNomeInput.value = item.nome_cliente;
    clienteTelInput.value = item.telefone || "";
    const el = clienteTelInput.nextElementSibling;
    if (el && el.classList.contains('autocomplete')) el.remove();
  });
});

async function carregarServicos() {
  const resp = await fetch('/api/servicos');
  const servicos = await resp.json();
  servicos.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.servico_id;
    opt.textContent = s.nome_servico;
    servicoSelect.appendChild(opt);
  });
}
carregarServicos();

servicoSelect.addEventListener('change', async (e) => {
  const servicoId = e.target.value;
  tempoSelect.innerHTML = '<option value="">Selecione</option>';
  precoInput.value = '';

  if (!servicoId) return;

  const resp = await fetch(`/api/servicos/${servicoId}/precos`);
  const precos = await resp.json();
  precos.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.preco_id;
    opt.textContent = `${p.duracao_min} min — R$ ${Number(p.valor).toFixed(2)}`;
    opt.dataset.valor = p.valor;
    opt.dataset.duracao = p.duracao_min;
    tempoSelect.appendChild(opt);
  });
});

tempoSelect.addEventListener('change', (e) => {
  const selected = e.target.selectedOptions[0];
  if (!selected) {
    precoInput.value = '';
    return;
  }
  precoInput.value = Number(selected.dataset.valor).toFixed(2);
});

// ao clicar "Agendar" nos horários já listados:
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-agendar')) {
    const hora = e.target.dataset.horario; // "08:00"
    const prof = e.target.dataset.prof; // "Ana Souza"
    const colabId = e.target.dataset.colab; // id numérico
    // preencher campos no modal:
    document.getElementById('dataAg').value = dataTexto; // formato dd/mm/aaaa se necessário
    document.getElementById('horaAg').value = hora;
    document.getElementById('profAg').value = prof;
    document.getElementById('colabIdAg').value = colabId; // hidden input
    // abrir modal etc...
  }
});

confirmarBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  // garantir cliente selecionado (ou buscar por fields)
  if (!clienteSelecionado) {
    alert("Selecione um cliente válido pelo nome ou telefone (ou cadastre novo).");
    return;
  }

  const cliente_id = clienteSelecionado.cliente_id;
  const colaborador_id = Number(document.getElementById('colabIdAg').value);
  const servico_id = Number(servicoSelect.value);
  const preco_id = Number(tempoSelect.value);
  const dataText = document.getElementById('dataAg').value; // ex '11/11/2025'
  const horaText = document.getElementById('horaAg').value; // '08:00'

  // montar ISO datetime (assume dataText dd/mm/yyyy)
  const [d, m, y] = dataText.split('/');
  const isoStart = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T${horaText}:00`;

  // opcional: criado_por (user id) do localStorage
  const currentUser = JSON.parse(localStorage.getItem('rokuzen.currentUser') || '{}');
  const criado_por = currentUser?.id || null;

  try {
    const resp = await fetch('/api/atendimentos', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
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
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || 'Erro ao criar agendamento');
    }
    const result = await resp.json();
    alert('Agendamento criado! ID: ' + result.atendimento_id);
    // fecha modal, atualiza calendar/listas
    // chamar recarregarAgendamentos() etc.
  } catch (err) {
    console.error(err);
    alert('Erro: ' + err.message);
  }
});
