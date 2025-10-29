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

  // ===== Unidade: seletor do sidebar =====
  window.APP_UNITS = [
    { id: 'golden', name: 'Golden Square Shopping' },
    { id: 'grand', name: 'Grand Plaza Shopping' },
    { id: 'west', name: 'Shopping West Plaza' },
    { id: 'mooca', name: 'Mooca Plaza Shopping' },
  ];

  (function () {
    const sel = document.getElementById('unitPicker');
    const curNameEl = document.getElementById('currentUnitName');
    const manageLink = document.querySelector('.link-manage');
    if (!sel || !curNameEl) return;

    const LS_KEY = 'rokuzen.currentUnit';

    function readUnits() {
      return window.APP_UNITS.map(u => ({
        id: String(u.id),
        name: String(u.name),
        city: String(u.city || ''),
        floor: String(u.floor || '')
      }));
    }

    let UNITS = readUnits();

    function populateSelect() {
      sel.innerHTML = '';
      UNITS.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.city ? `${u.name} — ${u.city}` : u.name;
        sel.appendChild(opt);
      });
    }

    function updateHeaderName(name) {
      curNameEl.textContent = name || '—';
    }

    function dispatchUnitChange(unit) {
      document.dispatchEvent(new CustomEvent('unit:change', { detail: unit }));
    }

    function saveUnit(unit) {
      localStorage.setItem(LS_KEY, JSON.stringify(unit));
    }

    function loadSavedUnit() {
      try {
        const obj = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
        return obj && obj.id ? obj : null;
      } catch { return null; }
    }

    function getById(id) {
      return UNITS.find(u => u.id === id) || null;
    }

    // ===== Inicialização =====
    populateSelect();
    const saved = loadSavedUnit();
    const initial = saved && getById(saved.id) ? saved : UNITS[0];
    if (initial) {
      sel.value = initial.id;
      updateHeaderName(initial.name);
      dispatchUnitChange(initial);
    }

    // ===== Ao trocar unidade =====
    sel.addEventListener('change', () => {
      const unit = getById(sel.value) || {
        id: sel.value,
        name: sel.options[sel.selectedIndex]?.text || '—'
      };
      updateHeaderName(unit.name);
      saveUnit(unit);
      dispatchUnitChange(unit);
    });

    // ===== Link "Gerenciar Unidades" =====
    manageLink?.addEventListener('click', (e) => {
      e.preventDefault();
      const settingsView = document.getElementById('view-settings');
      if (settingsView) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        settingsView.classList.add('active');
      }
      const tabBtn = document.querySelector('.tabs [data-tab="units"]');
      const tabPanel = document.getElementById('tab-units');
      if (tabBtn && tabPanel) {
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tabpanels .tabpanel').forEach(p => p.classList.remove('active'));
        tabBtn.classList.add('active');
        tabPanel.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');
      }
    });
  })();
});
