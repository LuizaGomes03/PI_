// Calendário e Horários
const horariosDisponiveis = {};
function gerarDiasDisponiveis() {
  const hoje = new Date();
  for (let i = 0; i < 365; i++) { // Disponibiliza 1 ano de dias futuros
    const dia = new Date();
    dia.setDate(hoje.getDate() + i);
    const diaSemana = dia.getDay();
    const dataStr = dia.toISOString().split("T")[0];
    horariosDisponiveis[dataStr] = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  }
}

let selectedDate = null;
let selectedHorario = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const profissionais = ['Ana', 'Bruno', 'Carlos', 'Daniela'];

let selectedProfissional = null;

function renderCalendar(month, year) {
  const calendarGrid = document.getElementById('calendarGrid');
  const monthLabel = document.getElementById('monthLabel');
  calendarGrid.innerHTML = '';

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  monthLabel.textContent = `${monthNames[month]} ${year}`;

  // Dias da semana
  weekdayNames.forEach(dia => {
    const dow = document.createElement('div');
    dow.className = 'dow';
    dow.textContent = dia;
    calendarGrid.appendChild(dow);
  });

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day unavailable';
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= lastDay; day++) {
    const dateObj = new Date(year, month, day);
    const dataStr = dateObj.toISOString().split("T")[0];
    const dayCell = document.createElement('div');
    dayCell.className = 'day';
    dayCell.textContent = day;

    const hoje = new Date();
    if (
      dateObj.getDate() === hoje.getDate() &&
      dateObj.getMonth() === hoje.getMonth() &&
      dateObj.getFullYear() === hoje.getFullYear()
    ) {
      dayCell.classList.add('today');
    }

    if (horariosDisponiveis[dataStr]) {
      dayCell.onclick = () => selecionarDia(dataStr, dayCell);
      if (selectedDate === dataStr) {
        dayCell.classList.add('selected');
      }
    } else {
      dayCell.classList.add('unavailable');
    }

    calendarGrid.appendChild(dayCell);
  }
}

function selecionarDia(dataStr, dayCell) {
  selectedDate = dataStr;
  selectedHorario = null;
  renderCalendar(currentMonth, currentYear);
  mostrarHorarios(dataStr);
}

function mostrarHorarios(dataStr) {
  const horariosContainer = document.getElementById('horariosContainer');
  const horariosList = document.getElementById('horariosList');
  const confirmarBtn = document.getElementById('confirmarBtn');
  horariosList.innerHTML = '';
  horariosContainer.style.display = 'block';
  confirmarBtn.style.display = 'none';

  horariosDisponiveis[dataStr].forEach(horario => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'horario-btn';
    btn.textContent = horario;
    btn.onclick = () => selecionarHorario(horario, btn);
    horariosList.appendChild(btn);
  });
}

function selecionarHorario(horario, btn) {
  selectedHorario = horario;
  document.querySelectorAll('.horario-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  mostrarProfissionais();
}

function mostrarProfissionais() {
  const profissionaisContainer = document.getElementById('profissionaisContainer');
  const profissionaisList = document.getElementById('profissionaisList');
  const confirmarBtn = document.getElementById('confirmarBtn');
  profissionaisList.innerHTML = '';
  profissionaisContainer.style.display = 'block';
  confirmarBtn.style.display = 'none';
  selectedProfissional = null;

  profissionais.forEach(prof => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'profissional-btn';
    btn.textContent = prof;
    btn.onclick = () => selecionarProfissional(prof, btn);
    profissionaisList.appendChild(btn);
  });
}

function selecionarProfissional(prof, btn) {
  selectedProfissional = prof;
  document.querySelectorAll('.profissional-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('confirmarBtn').style.display = 'block';
}

window.onload = () => {
  gerarDiasDisponiveis();
  renderCalendar(currentMonth, currentYear);

  document.getElementById('prevMonthBtn').onclick = () => {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    resetarSelecao();
    renderCalendar(currentMonth, currentYear);
  };

  document.getElementById('nextMonthBtn').onclick = () => {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
    resetarSelecao();
    renderCalendar(currentMonth, currentYear);
  };

  document.getElementById('confirmarBtn').onclick = () => {
    if (!selectedDate || !selectedHorario || !selectedProfissional) {
      alert("Por favor, selecione um dia, horário e profissional.");
      return;
    }

    localStorage.setItem("dataSelecionada", selectedDate);
    localStorage.setItem("horarioSelecionado", selectedHorario);
    localStorage.setItem("profissionalSelecionado", selectedProfissional);

    window.location.href = "../TOTEM/totem_dados.html";
  };

  function resetarSelecao() {
    selectedDate = null;
    selectedHorario = null;
    selectedProfissional = null;
    document.getElementById('horariosContainer').style.display = 'none';
    document.getElementById('profissionaisContainer').style.display = 'none';
    document.getElementById('confirmarBtn').style.display = 'none';
  }
}