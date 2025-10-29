// AGENDA — calendário alinhado por dia da semana (insere slots vazios antes do dia 1)
// Mantém destaques, navegação entre meses e painel de atendimentos
(() => {
    // --- dados de exemplo (substitua pela sua API/DB) ---
    const appointments = {
        "2025-10-28": [{ time: "09:00", client: "João Silva", notes: "Reavaliação" }, { time: "14:30", client: "Maria Costa" }],
        "2025-10-30": [{ time: "11:00", client: "Ana Pereira" }],
        "2025-11-03": [{ time: "08:30", client: "Lucas Ferreira" }],
    };

    // Seletores / elementos do DOM (devem existir no HTML que você já tem)
    const shortcuts = document.querySelectorAll('.shortcut-item');
    const atendShortcut = Array.from(shortcuts).find(a => a.getAttribute('href') === '#atendimentos');

    const agendaCard = document.getElementById('agendaCard');
    const closeBtn = agendaCard && agendaCard.querySelector('.btn-close');

    const monthLabel = document.getElementById('monthLabel');
    const calendarGrid = document.getElementById('calendarGrid');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const appointmentsPanel = document.getElementById('appointmentsPanel');
    const appointmentsContent = document.getElementById('appointmentsContent');

    // Estado da visualização (mês/ano atual do calendário)
    let viewDate = new Date(); // ex: 2025-10-xx

    // Helpers
    function pad(n) { return String(n).padStart(2, '0'); }
    function formatKeyFromParts(year, monthZeroIndex, day) {
        return `${year}-${pad(monthZeroIndex + 1)}-${pad(day)}`; // YYYY-MM-DD
    }
    function localMonthLabel(date) {
        return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    }

    // Limpa painel lateral
    function clearAppointmentsPanel() {
        appointmentsContent.innerHTML = '<p class="empty">Selecione um dia com marcação verde para ver os atendimentos.</p>';
    }

    // Preenche painel lateral com atendimentos de uma chave YYYY-MM-DD
    function renderAppointmentsForKey(key) {
        appointmentsContent.innerHTML = '';
        const list = appointments[key] || [];
        if (!list.length) {
            appointmentsContent.innerHTML = '<p class="empty">Nenhum atendimento para este dia.</p>';
            return;
        }
        list.forEach(item => {
            const el = document.createElement('div');
            el.className = 'appt-item';
            el.innerHTML = `<div class="appt-time">${item.time}</div>
                      <div class="appt-client">${item.client}</div>
                      ${item.notes ? `<div class="appt-notes">${item.notes}</div>` : ''}`;
            appointmentsContent.appendChild(el);
        });
    }

    // RENDER: gera slots vazios antes para alinhar o dia 1 ao dia da semana correto,
    // cria dias 1..lastDay e adiciona trailing slots para completar a última semana (multiplo de 7).
    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth(); // zero-index

        // label do mês
        monthLabel.textContent = localMonthLabel(viewDate);

        // Primeiro dia do mês (JS: 0=Dom,1=Seg,...6=Sab)
        const firstOfMonth = new Date(year, month, 1);
        // converter para índice com 0=Seg ... 6=Dom (já que seu cabeçalho começa em Seg)
        // Se for domingo (0), queremos 6 slots vazios; senão subtrair 1.
        let leadingEmpty = (firstOfMonth.getDay() === 0) ? 6 : firstOfMonth.getDay() - 1;

        // quantos dias no mês
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // --- criar slots vazios iniciais ---
        for (let i = 0; i < leadingEmpty; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day out'; // reutiliza estilo 'out' para aparência desativada
            // manter consistência de acessibilidade
            emptyCell.setAttribute('aria-hidden', 'true');
            calendarGrid.appendChild(emptyCell);
        }

        // --- criar dias do mês ---
        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(year, month, day);
            const key = formatKeyFromParts(year, month, day);

            const cell = document.createElement('button');
            cell.className = 'day';
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('tabindex', 0);
            cell.setAttribute('aria-label', `${day} de ${viewDate.toLocaleString('pt-BR', { month: 'long' })} ${year}`);
            // inner: número e dot de presença de atendimento
            cell.innerHTML = `<div class="date-num">${day}</div><div class="dot" aria-hidden="true"></div>`;

            // destacar hoje
            const today = new Date();
            if (cellDate.toDateString() === today.toDateString()) {
                cell.classList.add('today');
            }

            // marcar se há atendimentos
            if (appointments[key] && appointments[key].length) {
                cell.classList.add('has-appointments');
            }

            // clique: abre painel com atendimentos daquele dia
            cell.addEventListener('click', (e) => {
                e.preventDefault();
                renderAppointmentsForKey(key);
                appointmentsPanel.scrollTop = 0;
            });

            // keyboard accessibility (Enter / Space)
            cell.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    cell.click();
                }
            });

            calendarGrid.appendChild(cell);
        }

        // --- trailing empty slots: para completar a última linha até múltiplo de 7 ---
        const totalCells = calendarGrid.children.length;
        const remainder = totalCells % 7;
        if (remainder !== 0) {
            const toAdd = 7 - remainder;
            for (let j = 0; j < toAdd; j++) {
                const trailing = document.createElement('div');
                trailing.className = 'day out';
                trailing.setAttribute('aria-hidden', 'true');
                calendarGrid.appendChild(trailing);
            }
        }
    }

    // abrir/fechar agenda
    function openAgenda() {
        // esconder outros cards (se existirem)
        document.querySelectorAll('.card[aria-hidden="false"]').forEach(c => {
            c.setAttribute('aria-hidden', 'true');
        });

        if (!agendaCard) return;
        agendaCard.setAttribute('aria-hidden', 'false');
        agendaCard.classList.add('fade-in');
        clearAppointmentsPanel();
        renderCalendar();
        // foco no fechar (acessibilidade)
        setTimeout(() => {
            agendaCard.querySelector('.btn-close')?.focus();
        }, 80);
    }
    function closeAgenda() {
        if (!agendaCard) return;
        agendaCard.setAttribute('aria-hidden', 'true');
    }

    // Navegação entre meses
    prevMonthBtn?.addEventListener('click', () => {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        renderCalendar();
        clearAppointmentsPanel();
    });
    nextMonthBtn?.addEventListener('click', () => {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        renderCalendar();
        clearAppointmentsPanel();
    });

    // fechar botão
    closeBtn?.addEventListener('click', () => closeAgenda());
    // ESC fecha
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAgenda();
    });

    // atalho do sidebar para abrir
    if (atendShortcut) {
        atendShortcut.addEventListener('click', (e) => {
            e.preventDefault();
            openAgenda();
        });
    }

    // render inicial (garante que o calendário foi desenhado ao menos uma vez)
    renderCalendar();

    // Exponha funções no window se quiser manipular externamente (opcional)
    window.ROKUAgenda = {
        open: openAgenda,
        close: closeAgenda,
        setDate: (d) => { viewDate = new Date(d); renderCalendar(); }
    };

})();

// --- CONTROLE DE LOGIN / BATE PONTO ---
(() => {
    const loginShortcut = document.querySelector('.shortcut-item[href="#controle-login"]');
    const loginCard = document.getElementById('loginCard');
    const closeLoginBtn = loginCard?.querySelector('.btn-close');
    const punchBtn = document.getElementById('punchBtn');
    const punchStatus = document.getElementById('punchStatus');
    const punchContent = document.getElementById('punchContent');

    // dados simulados
    const punchRecords = {}; // ex: {"2025-10-28": [{time:"09:00", type:"Entrada"}]}

    function todayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function updateHistory() {
        const key = todayKey();
        punchContent.innerHTML = '';
        const list = punchRecords[key] || [];
        if (!list.length) {
            punchContent.innerHTML = '<p class="empty">Nenhum registro até o momento.</p>';
            return;
        }
        list.forEach(r => {
            const el = document.createElement('div');
            el.className = 'punch-item';
            el.innerHTML = `<span>${r.time}</span> - ${r.type}`;
            punchContent.appendChild(el);
        });
    }

    function markPunch() {
        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 5);
        const key = todayKey();

        if (!punchRecords[key]) punchRecords[key] = [];

        const last = punchRecords[key][punchRecords[key].length - 1];
        let type = "Entrada";
        if (last && last.type === "Entrada") type = "Saída";

        punchRecords[key].push({ time: timeStr, type });
        punchStatus.textContent = `Último ponto marcado: ${timeStr} (${type})`;
        updateHistory();

        // alternar texto do botão
        punchBtn.textContent = (type === "Entrada") ? "Marcar Saída" : "Marcar Entrada";
    }

    punchBtn?.addEventListener('click', markPunch);

    function openLoginCard() {
        // esconder outros cards
        document.querySelectorAll('.card[aria-hidden="false"]').forEach(c => c.setAttribute('aria-hidden', 'true'));

        if (!loginCard) return;
        loginCard.setAttribute('aria-hidden', 'false');
        loginCard.classList.add('fade-in');
        updateHistory();
        setTimeout(() => loginCard.querySelector('.btn-close')?.focus(), 80);
    }

    function closeLoginCard() {
        if (!loginCard) return;
        loginCard.setAttribute('aria-hidden', 'true');
    }

    closeLoginBtn?.addEventListener('click', closeLoginCard);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLoginCard(); });

    loginShortcut?.addEventListener('click', e => { e.preventDefault(); openLoginCard(); });

    window.ROKULogin = {
        open: openLoginCard,
        close: closeLoginCard
    };
})();

(() => {
    const calShortcut = document.querySelector('.shortcut-item[href="#calendario-anual"]');
    const annualCard = document.getElementById('annualCalendarCard');
    const closeBtn = annualCard?.querySelector('.btn-close');
    const monthsGrid = document.getElementById('monthsGrid');
    const yearLabel = document.getElementById('yearLabel');

    const year = new Date().getFullYear();

    // Exemplo de feriados nacionais (pode adicionar mais)
    const holidays = {
        "2025-01-01": "Ano Novo",
        "2025-04-21": "Tiradentes",
        "2025-05-01": "Dia do Trabalhador",
        "2025-09-07": "Independência",
        "2025-10-12": "Nossa Senhora Aparecida",
        "2025-11-02": "Finados",
        "2025-11-15": "Proclamação da República",
        "2025-12-25": "Natal"
    };

    function pad(n) { return String(n).padStart(2, '0'); }

    function renderAnnualCalendar() {
        monthsGrid.innerHTML = '';
        yearLabel.textContent = year;

        for (let m = 0; m < 12; m++) {
            const monthCard = document.createElement('div');
            monthCard.className = 'month-card';

            const monthName = new Date(year, m).toLocaleString('pt-BR', { month: 'long' });
            monthCard.innerHTML = `<h4>${monthName}</h4>`;

            const daysGrid = document.createElement('div');
            daysGrid.className = 'days-grid';

            const daysInMonth = new Date(year, m + 1, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'day-cell';
                const key = `${year}-${pad(m + 1)}-${pad(d)}`;
                dayCell.textContent = d;

                if (holidays[key]) {
                    dayCell.classList.add('holiday');
                    dayCell.setAttribute('title', holidays[key]);
                }

                daysGrid.appendChild(dayCell);
            }

            monthCard.appendChild(daysGrid);
            monthsGrid.appendChild(monthCard);
        }
    }

    function openAnnualCard() {
        document.querySelectorAll('.card[aria-hidden="false"]').forEach(c => c.setAttribute('aria-hidden', 'true'));
        annualCard.setAttribute('aria-hidden', 'false');
        annualCard.classList.add('fade-in');
        renderAnnualCalendar();
        setTimeout(() => closeBtn?.focus(), 80);
    }

    function closeAnnualCard() {
        annualCard.setAttribute('aria-hidden', 'true');
    }

    closeBtn?.addEventListener('click', closeAnnualCard);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAnnualCard(); });
    calShortcut?.addEventListener('click', e => { e.preventDefault(); openAnnualCard(); });

    window.ROKUAnnualCalendar = { open: openAnnualCard, close: closeAnnualCard };
})();

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










