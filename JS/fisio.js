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
    // ----- substituir renderAppointmentsForKey -----
    function renderAppointmentsForKey(key) {
        appointmentsContent.innerHTML = '';
        const list = appointments[key] || [];
        if (!list.length) {
            appointmentsContent.innerHTML = '<p class="empty">Nenhum atendimento para este dia.</p>';
            return;
        }

        // helpers de persistência
        function loadSessions(storageKey) {
            try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (e) { return []; }
        }
        function saveSessions(storageKey, arr) { localStorage.setItem(storageKey, JSON.stringify(arr)); }
        function storageKeyFor(dateKey, client) { return `sessions:${dateKey}:${client}`; }
        function pad(n) { return String(n).padStart(2, '0'); }
        function formatSeconds(s) {
            const hh = pad(Math.floor(s / 3600));
            const mm = pad(Math.floor((s % 3600) / 60));
            const ss = pad(s % 60);
            return `${hh}:${mm}:${ss}`;
        }
        function sumRecordedSeconds(arr) {
            return Math.floor((arr || []).reduce((acc, r) => acc + (r.duration || 0), 0));
        }

        // Modal elements (assume modal markup exists)
        const modal = document.getElementById('sessionModal');
        const modalClientName = document.getElementById('modalClientName');
        const modalTimer = document.getElementById('modalTimer');
        const modalTotalRecorded = document.getElementById('modalTotalRecorded');
        const modalHistory = document.getElementById('modalHistory');
        const modalStart = document.getElementById('modalStart');
        const modalPause = document.getElementById('modalPause');
        const modalStop = document.getElementById('modalStop');
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        const modalCloseFooter = document.getElementById('modalCloseFooter');

        // estado do modal (session in-memory): { storageKey, client, startedAt, elapsedBefore, intervalId }
        if (!window.__ROKU_MODAL_SESSION) window.__ROKU_MODAL_SESSION = null;

        // abre modal para um cliente
        function openSessionModal(dateKey, client) {
            const sk = storageKeyFor(dateKey, client);
            modal.setAttribute('aria-hidden', 'false');
            modal.classList.add('fade-in');
            document.body.style.overflow = 'hidden';
            modalClientName.textContent = client;

            // carregar histórico e total
            const arr = loadSessions(sk);
            const total = sumRecordedSeconds(arr);
            modalTotalRecorded.textContent = `Total gravado: ${formatSeconds(total)}`;
            modalTimer.textContent = formatSeconds(total);

            // popular histórico
            renderModalHistory(arr);

            // desligar botões conforme estado
            modalStart.disabled = false;
            modalPause.disabled = true;
            modalStop.disabled = true;

            // anexar referência atual
            window.__ROKU_MODAL_SESSION = window.__ROKU_MODAL_SESSION || null;
            window.__ROKU_MODAL_SESSION = window.__ROKU_MODAL_SESSION && window.__ROKU_MODAL_SESSION.storageKey === sk
                ? window.__ROKU_MODAL_SESSION
                : { storageKey: sk, client, startedAt: null, elapsedBefore: total, intervalId: null };
        }

        function closeSessionModal() {
            modal.setAttribute('aria-hidden', 'true');
            modal.classList.remove('fade-in');
            document.body.style.overflow = '';
            // se houver contador rodando no modal, deixar como está (poderia pausar automaticamente se preferir)
        }

        function renderModalHistory(arr) {
            modalHistory.innerHTML = '';
            if (!arr || !arr.length) {
                modalHistory.innerHTML = '<div class="empty">Nenhuma sessão registrada.</div>';
                return;
            }
            // ordem reversa (mais recente primeiro)
            arr.slice().reverse().forEach(r => {
                const el = document.createElement('div');
                el.className = 'hist-item';
                const started = new Date(r.startedAt).toLocaleString();
                const ended = new Date(r.endedAt).toLocaleString();
                el.innerHTML = `<div style="font-weight:700">${formatSeconds(Math.floor(r.duration || 0))}</div>
                            <div style="color:var(--muted);font-size:12px">${started} — ${ended}</div>`;
                modalHistory.appendChild(el);
            });
        }

        // iniciar contagem no modal
        function startModalTimer() {
            if (!window.__ROKU_MODAL_SESSION) return;
            // prevenir múltiplas sessões ativas em locais diferentes
            if (window.__ROKU_GLOBAL_RUNNING && window.__ROKU_GLOBAL_RUNNING.storageKey !== window.__ROKU_MODAL_SESSION.storageKey) {
                alert('Já existe uma sessão ativa para outro cliente. Encerre-a primeiro.');
                return;
            }

            // se já rodando, ignora
            if (window.__ROKU_MODAL_SESSION.intervalId) return;

            window.__ROKU_MODAL_SESSION.startedAt = Date.now();
            // garantir flag global
            window.__ROKU_GLOBAL_RUNNING = window.__ROKU_MODAL_SESSION;

            modalStart.disabled = true;
            modalPause.disabled = false;
            modalStop.disabled = false;

            window.__ROKU_MODAL_SESSION.intervalId = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - window.__ROKU_MODAL_SESSION.startedAt) / 1000) + (window.__ROKU_MODAL_SESSION.elapsedBefore || 0);
                modalTimer.textContent = formatSeconds(elapsed);
            }, 1000);
        }

        // pausar (mantém elapsedBefore e permite retomar)
        function pauseModalTimer() {
            if (!window.__ROKU_MODAL_SESSION || !window.__ROKU_MODAL_SESSION.intervalId) return;
            clearInterval(window.__ROKU_MODAL_SESSION.intervalId);
            const now = Date.now();
            const elapsed = Math.floor((now - window.__ROKU_MODAL_SESSION.startedAt) / 1000);
            window.__ROKU_MODAL_SESSION.elapsedBefore = (window.__ROKU_MODAL_SESSION.elapsedBefore || 0) + elapsed;
            window.__ROKU_MODAL_SESSION.startedAt = null;
            window.__ROKU_MODAL_SESSION.intervalId = null;
            window.__ROKU_GLOBAL_RUNNING = null;

            modalStart.disabled = false;
            modalPause.disabled = true;
            modalStop.disabled = false;

            modalTimer.textContent = formatSeconds(window.__ROKU_MODAL_SESSION.elapsedBefore || 0);
        }

        // encerrar -> salva registro definitivo
        // encerrar -> salva registro definitivo e reinicia o contador para nova sessão
        function stopModalTimer() {
            if (!window.__ROKU_MODAL_SESSION) return;

            // total já gravado antes desta parada
            const prevArr = loadSessions(window.__ROKU_MODAL_SESSION.storageKey);
            const prevTotal = sumRecordedSeconds(prevArr);

            // calcular duração total acumulada (em segundos) até o momento atual
            let totalSec = window.__ROKU_MODAL_SESSION.elapsedBefore || 0;
            if (window.__ROKU_MODAL_SESSION.intervalId) {
                clearInterval(window.__ROKU_MODAL_SESSION.intervalId);
                const now = Date.now();
                const elapsed = Math.floor((now - window.__ROKU_MODAL_SESSION.startedAt) / 1000);
                totalSec = (window.__ROKU_MODAL_SESSION.elapsedBefore || 0) + elapsed;
            }

            // duração desta sessão (apenas o período que acabou de correr)
            let thisSessionDuration = totalSec - prevTotal;
            if (thisSessionDuration <= 0) {
                // fallback: se algo estranho ocorrer, registra totalSec como duração
                thisSessionDuration = totalSec;
            }

            // montar objeto registro desta sessão
            const record = {
                startedAt: window.__ROKU_MODAL_SESSION.startedAt ? new Date(window.__ROKU_MODAL_SESSION.startedAt).toISOString() : new Date().toISOString(),
                endedAt: new Date().toISOString(),
                duration: thisSessionDuration
            };

            // salvar no storage (append)
            const arr = loadSessions(window.__ROKU_MODAL_SESSION.storageKey);
            arr.push(record);
            saveSessions(window.__ROKU_MODAL_SESSION.storageKey, arr);

            // atualizar UI (total gravado)
            const totalNow = sumRecordedSeconds(arr);
            modalTotalRecorded.textContent = `Total gravado: ${formatSeconds(totalNow)}`;

            // --- AQUI: reiniciar o timer na interface para 00:00:00, pronto para nova sessão ---
            modalTimer.textContent = formatSeconds(0);

            // resetar estado de contagem local para permitir nova sessão do zero
            if (window.__ROKU_MODAL_SESSION.intervalId) {
                clearInterval(window.__ROKU_MODAL_SESSION.intervalId);
            }
            window.__ROKU_MODAL_SESSION.startedAt = null;
            window.__ROKU_MODAL_SESSION.elapsedBefore = 0; // <-- zera o acumulado para a próxima sessão
            window.__ROKU_MODAL_SESSION.intervalId = null;
            window.__ROKU_GLOBAL_RUNNING = null;

            // ajustar botões: permitir iniciar (pronto), desabilitar pausa/encerrar
            modalStart.disabled = false;
            modalPause.disabled = true;
            modalStop.disabled = true;
        }

        // ligar eventos do modal (apenas uma vez)
        if (!renderAppointmentsForKey.__modalInit) {
            modalStart.addEventListener('click', startModalTimer);
            modalPause.addEventListener('click', pauseModalTimer);
            modalStop.addEventListener('click', stopModalTimer);
            modalCloseBtn.addEventListener('click', closeSessionModal);
            modalCloseFooter.addEventListener('click', closeSessionModal);
            // clique fora do box fecha
            document.querySelector('.session-modal-backdrop')?.addEventListener('click', closeSessionModal);
            // ESC fecha
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeSessionModal();
            });

            renderAppointmentsForKey.__modalInit = true;
        }

        // renderizar cada atendimento com botão para abrir modal
        list.forEach((item, i) => {
            const clientName = item.client;
            const sk = storageKeyFor(key, clientName);

            const el = document.createElement('div');
            el.className = 'appt-item';
            el.innerHTML = `
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                <div>
                    <div class="appt-time">${item.time}</div>
                    <div class="appt-client">${clientName}</div>
                    ${item.notes ? `<div class="appt-notes">${item.notes}</div>` : ''}
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                    <div style="font-size:13px;color:var(--muted)">${formatSeconds(sumRecordedSeconds(loadSessions(sk)))}</div>
                    <div style="display:flex;gap:8px;">
                        <button class="btn-open-session" data-client="${clientName}" data-date="${key}">Iniciar Sessão</button>
                    </div>
                </div>
            </div>
        `;
            appointmentsContent.appendChild(el);

            // abrir modal ao clicar
            el.querySelector('.btn-open-session').addEventListener('click', (e) => {
                e.preventDefault();
                openSessionModal(key, clientName);
            });
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










