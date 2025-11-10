// gerente.js — mapeia atalhos da sidebar para as views
document.addEventListener("DOMContentLoaded", () => {
  const views = Array.from(document.querySelectorAll(".view"));
  const shortcuts = Array.from(document.querySelectorAll(".shortcut-item"));

  // mapa manual de palavras-chave -> id da view
const viewMap = [
  { keys: ["início", "inicio", "dash", "dashboard"], id: "view-dashboard" },
  { keys: ["cliente", "clientes"], id: "view-clientes" },
  { keys: ["agenda", "agend"], id: "view-agenda" },
  { keys: ["controle", "login", "ponto"], id: "view-controle-login" },
  { keys: ["equipe", "terapeutas"], id: "view-equipe" },
  { keys: ["relat", "relatórios", "relatorios"], id: "view-relatorio" },
  { keys: ["auditoria", "audit"], id: "view-audit" }
];

  // utilitário: encontra view por texto do link (label), href ou data-target
  function findTargetId(linkEl) {
    // 1) data-target explícito (preferível)
    const dt = linkEl.getAttribute("data-target");
    if (dt) return dt;

    // 2) href que já referencia id (#view-...)
    const href = linkEl.getAttribute("href") || "";
    if (href.startsWith("#")) {
      // remove '#'
      const h = href.slice(1);
      // se corresponder a uma view existente, retorna
      if (document.getElementById(h)) return h;
    }

    // 3) usa o texto do rótulo para tentar mapear
    const labelEl = linkEl.querySelector(".shortcut-label");
    const text = (labelEl ? labelEl.textContent : linkEl.textContent).toLowerCase();
    for (const m of viewMap) {
      for (const k of m.keys) {
        if (text.includes(k)) return m.id;
      }
    }

    // 4) fallback: primeira view (dashboard)
    return "view-dashboard";
  }

  // ativa a view por id (esconde as outras, atualiza classes, hash e foco)
  function activateView(id, pushState = true) {
    const target = document.getElementById(id);
    if (!target) return;

    // esconder todas
    views.forEach(v => v.classList.remove("is-active"));
    // ativar a desejada
    target.classList.add("is-active");

    // atualizar classe visual dos atalhos (is-active) e aria-current
    shortcuts.forEach(s => {
      s.classList.remove("is-active");
      s.removeAttribute("aria-current");
      // se o atalho aponta para esta view, marca
      const tid = findTargetId(s);
      if (tid === id) {
        s.classList.add("is-active");
        s.setAttribute("aria-current", "page");
      }
    });

    // atualizar hash sem duplicar histórico (opcional)
    if (pushState) {
      const niceHash = "#" + id.replace(/^view-/, "");
      if (location.hash !== niceHash) {
        history.pushState({ view: id }, "", niceHash);
      }
    }

    // foco para acessibilidade: move foco para o título (se houver)
    const firstHeading = target.querySelector(".card__title, h2, h1");
    if (firstHeading) firstHeading.setAttribute("tabindex", "-1"), firstHeading.focus();
  }

  // ligar eventos de clique nos atalhos
  shortcuts.forEach(s => {
    s.addEventListener("click", (ev) => {
      ev.preventDefault();
      const id = findTargetId(s);
      activateView(id);
    });

    // garantir comportamento de teclado (Enter / Space)
    s.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        s.click();
      }
    });
  });

  // lidar com back/forward do navegador
  window.addEventListener("popstate", (ev) => {
    const stateId = ev.state && ev.state.view;
    if (stateId && document.getElementById(stateId)) {
      activateView(stateId, false);
      return;
    }
    // se não houver state, tenta abrir via hash
    const hash = location.hash.replace("#", "");
    const byHash = hash ? `view-${hash}` : null;
    if (byHash && document.getElementById(byHash)) {
      activateView(byHash, false);
      return;
    }
    // fallback
    activateView("view-dashboard", false);
  });

  // no carregamento, tenta decidir view inicial:
  (function initFromHashOrDefault() {
    const hash = location.hash.replace("#", "");
    // tenta formatos comuns: #dashboard, #clients, #atendimentos etc.
    const candidates = [
      `view-${hash}`,
      hash // caso o hash já seja 'view-dashboard'
    ].filter(Boolean);

    for (const c of candidates) {
      if (document.getElementById(c)) {
        activateView(c, false);
        return;
      }
    }

    // se nenhum hash, tenta usar o primeiro atalho ativo ou dashboard
    const firstShortcut = shortcuts[0];
    if (firstShortcut) {
      const tid = findTargetId(firstShortcut);
      activateView(tid, false);
      return;
    }

    // fallback final
    activateView("view-dashboard", false);
  })();

  // --- melhoria opcional: transformar links href incorretos em data-targets corretos
  // (mantém HTML sem alterações e evita comportamento de ancoragem inesperado)
  shortcuts.forEach(s => {
    const tid = findTargetId(s);
    s.setAttribute("data-target", tid);
    // previne navegação normal de <a> (caso não queira usar click handler)
    s.addEventListener("auxclick", e => e.preventDefault());
  });
});
