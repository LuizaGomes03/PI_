const calendarEl = document.getElementById('calendar');
const detailsEl = document.getElementById('details');
const bookingForm = document.getElementById('bookingForm');
const selectedDateInput = document.getElementById('selectedDate');
const selectedTimeInput = document.getElementById('selectedTime');

const agendamentoLink = document.querySelector('.shortcut-item[href="#atendimentos"]');
const agendamentoSection = document.getElementById('agendamento');

let currentDate = new Date();
let selectedDay = null;

// Mostrar calendário ao clicar no atalho
agendamentoLink.addEventListener('click', function (e) {
  e.preventDefault();
  document.querySelectorAll('.calendar-section').forEach(sec => sec.style.display = 'none');
  agendamentoSection.style.display = 'block';
  agendamentoSection.scrollIntoView({ behavior: 'smooth' });
  bookingForm.style.display = 'none';
});

// Função para renderizar o calendário
function renderCalendar(date) {
  calendarEl.innerHTML = '';
  detailsEl.innerHTML = '';
  bookingForm.style.display = 'none';

  const year = date.getFullYear();
  const month = date.getMonth();
  const monthName = date.toLocaleString('pt-BR', { month: 'long' });

  // Cabeçalho
  const header = document.createElement('div'); header.classList.add('calendar-header');

  const prevBtn = document.createElement('button'); prevBtn.classList.add('month-nav');
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  prevBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); });

  const title = document.createElement('h3'); title.textContent = `${monthName} ${year}`;

  const nextBtn = document.createElement('button'); nextBtn.classList.add('month-nav');
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  nextBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); });

  header.appendChild(prevBtn); header.appendChild(title); header.appendChild(nextBtn);
  calendarEl.appendChild(header);

  // Dias da semana
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const daysRow = document.createElement('div'); daysRow.classList.add('days-row');
  daysOfWeek.forEach(d => { const cell = document.createElement('div'); cell.classList.add('day-name'); cell.textContent = d; daysRow.appendChild(cell); });
  calendarEl.appendChild(daysRow);

  // Dias do mês
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = document.createElement('div'); grid.classList.add('days-grid');

  for (let i = 0; i < firstDay; i++) { grid.appendChild(document.createElement('div')); }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div'); dayCell.classList.add('day-cell');

    const slots = Math.floor(Math.random() * 5);
    if (slots === 0) { dayCell.classList.add('full'); dayCell.innerHTML = `<span>${day}</span><br><small>Lotado</small>`; }
    else {
      dayCell.dataset.slots = slots; dayCell.innerHTML = `<span>${day}</span><br><small>${slots} ${slots === 1 ? 'horário' : 'horários'}</small>`;
    }

    dayCell.addEventListener('click', () => {
      if (slots === 0) {
        detailsEl.innerHTML = `<p>Dia ${day}/${month + 1}/${year} está lotado!</p>`;
        bookingForm.style.display = 'none';
        detailsEl.scrollIntoView({ behavior: 'smooth' }); // <<< scroll para a mensagem de lotado
      } else {
        selectedDay = `${day}/${month + 1}/${year}`;
        let horarios = [];
        for (let i = 0; i < slots; i++) { horarios.push(`${9 + i}:00`); }
        let profissionais = ['Profissional 1', 'Profissional 2', 'Profissional 3'];

        // Limpa detalhes
        detailsEl.innerHTML = `<p>Escolha um horário e profissional:</p>`;
        const slotsContainer = document.createElement('div');
        slotsContainer.style.display = 'flex';
        slotsContainer.style.flexWrap = 'wrap';
        slotsContainer.style.justifyContent = 'center';

        horarios.forEach((h, idx) => {
          const slot = document.createElement('div');
          slot.classList.add('time-slot');
          slot.innerHTML = `<strong>${h}</strong><span>${profissionais[idx % profissionais.length]}</span>`;

          slot.addEventListener('click', () => {
            // Remove seleção anterior
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));

            // Marca o selecionado
            slot.classList.add('selected');

            // Preenche o formulário
            selectedDateInput.value = selectedDay;
            selectedTimeInput.value = h;

            // Mostra o formulário e dá scroll
            bookingForm.style.display = 'flex';
            bookingForm.scrollIntoView({ behavior: 'smooth' });
          });

          slotsContainer.appendChild(slot);
        });

        detailsEl.appendChild(slotsContainer);

        // Scroll automático
        slotsContainer.scrollIntoView({ behavior: 'smooth' });

        // Scroll automático para os horários/profissionais
        detailsEl.scrollIntoView({ behavior: 'smooth' });
      }
    });

    grid.appendChild(dayCell);
  }

  calendarEl.appendChild(grid);
}

// Inicializa calendário
renderCalendar(currentDate);

// Submissão do formulário
bookingForm.addEventListener('submit', function (e) {
  e.preventDefault();
  alert(`Agendamento confirmado:\nCliente: ${clientName.value}\nTelefone: ${clientPhone.value}\nData: ${selectedDateInput.value}\nHorário: ${selectedTimeInput.value}`);
  bookingForm.reset();
  bookingForm.style.display = 'none';
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
      window.location.href = "../login.html"; // redireciona para tela de login
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

// Seleciona todos os labels que envolvem checkboxes
document.querySelectorAll('.checkbox-btn').forEach(label => {
  const checkbox = label.querySelector('input[type="checkbox"]');
  label.addEventListener('click', () => {
    if (checkbox.checked) {
      label.classList.add('selected');
    } else {
      label.classList.remove('selected');
    }
  });
});



