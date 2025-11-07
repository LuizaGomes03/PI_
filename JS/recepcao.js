 document.addEventListener("DOMContentLoaded", () => {
  const servicesScreen = document.querySelector(".services-screen");
  const calendarScreen = document.querySelector("#calendar-screen");
  const agendamentoShortcut = document.querySelector('a[href="#atendimentos"]');
  const calendarGrid = document.getElementById("calendarGrid");
  const monthYear = document.getElementById("monthYear");

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

  // === EXEMPLOS DE AGENDAMENTOS EXISTENTES ===
  const fakeBookings = {
    "2025-11-07": [
      { horario: "10:00", cliente: "João Silva", servico: "Quick Massage (25 min)" },
      { horario: "14:30", cliente: "Maria Souza", servico: "Macaterapia (60 min)" },
      { horario: "16:00", cliente: "Carlos Lima", servico: "Reflexologia Podal (40 min)" },
    ],
    "2025-11-10": [
      { horario: "09:00", cliente: "Ana Costa", servico: "Reflexologia Podal (40 min)" },
    ],
  };

  // === EXEMPLOS DE HORÁRIOS E PROFISSIONAIS DISPONÍVEIS ===
  const disponibilidades = {
    segunda: [
      { horario: "09:00", profissional: "Clara" },
      { horario: "10:30", profissional: "Lúcia" },
      { horario: "14:00", profissional: "Marcos" },
    ],
    terça: [
      { horario: "09:30", profissional: "Rafael" },
      { horario: "11:00", profissional: "Sofia" },
      { horario: "15:00", profissional: "Clara" },
    ],
    quarta: [
      { horario: "10:00", profissional: "Lúcia" },
      { horario: "13:00", profissional: "Marcos" },
      { horario: "16:00", profissional: "Rafael" },
    ],
    quinta: [
      { horario: "09:00", profissional: "Sofia" },
      { horario: "11:30", profissional: "Clara" },
      { horario: "14:30", profissional: "Marcos" },
    ],
    sexta: [
      { horario: "09:00", profissional: "Rafael" },
      { horario: "10:30", profissional: "Lúcia" },
      { horario: "15:00", profissional: "Sofia" },
    ],
    sábado: [
      { horario: "09:00", profissional: "Rafael" },
      { horario: "10:30", profissional: "Lúcia" },
      { horario: "15:00", profissional: "Sofia" },
    ],
    domingo: [
      { horario: "09:00", profissional: "Rafael" },
      { horario: "10:30", profissional: "Lúcia" },
      { horario: "15:00", profissional: "Sofia" },
    ],
  };

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

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

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

      if (fakeBookings[fullDate]) {
        dayEl.classList.add("full");
      } else {
        dayEl.classList.add("available");
      }

      dayEl.addEventListener("click", () => {
        if (fakeBookings[fullDate]) {
          showBookings(fullDate);
        } else {
          showAvailableOptions(fullDate);
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

  function showAvailableOptions(date) {
    const dataObj = new Date(date + "T00:00");
    const diaSemana = dataObj
      .toLocaleDateString("pt-BR", { weekday: "long" })
      .toLowerCase()
      .replace("-feira", "")
      .trim();

    const opcoes = disponibilidades[diaSemana];
    const dataFormatada = dataObj.toLocaleDateString("pt-BR");

    if (!opcoes) {
      bookingDetails.innerHTML = `
        <div class="booking-card">
          <h3>${dataFormatada}</h3>
          <p>❌ Não há horários disponíveis neste dia.</p>
        </div>
      `;
      return;
    }

    bookingDetails.innerHTML = `
      <div class="booking-card">
        <h3>Disponíveis - ${dataFormatada}</h3>
        ${opcoes
        .map(
          (opt) => `
            <div class="booking-item">
              <strong>${opt.horario}</strong> — ${opt.profissional}
              <button class="btn-agendar" data-horario="${opt.horario}" data-prof="${opt.profissional}">
                Agendar
              </button>
            </div>`
        )
        .join("")}
      </div>
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

// Envio do formulário
formAgendamento.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("✅ Agendamento realizado com sucesso!");
  formOverlay.classList.remove("active");
});

// ======== CONECTAR AO CALENDÁRIO ========
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-agendar")) {
    const data = e.target.closest(".booking-card").querySelector("h3").textContent.replace("Disponíveis - ", "");
    const dataISO = new Date(data.split("/").reverse().join("-")).toISOString().split("T")[0];
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




