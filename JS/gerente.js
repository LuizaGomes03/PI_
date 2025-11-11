// ===== TROCA DE VIEWS =====
document.querySelectorAll('.shortcut-item[data-view]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault()
    
  // mapa manual de palavras-chave -> id da view
  const viewMap = [
    { keys: ["início", "inicio", "dash", "dashboard"], id: "view-dashboard" },
    { keys: ["cliente", "clientes"], id: "view-clientes" },
    { keys: ["agenda", "agend"], id: "view-agenda" },
    { keys: ["controle", "login", "ponto"], id: "view-controle-login" },
    { keys: ["equipe", "terapeutas"], id: "view-equipe" },
    { keys: ["relat", "relatórios", "relatorios"], id: "view-relatorio" },
    { keys: ["posto", "postos", "postos de trabalho"], id: "view-postos-trabalho" }, // 👈 NOVO
    { keys: ["auditoria", "audit"], id: "view-audit" }
    
  ];
  // --- LIGAR OS BOTÕES DO RELATÓRIO (.colab-item) ---
  const relButtons = document.querySelectorAll(".colab-item[data-view]");

  relButtons.forEach(btn => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();

      const targetId = btn.getAttribute("data-view"); // ex: "rel-pagamentos"

      if (targetId && document.getElementById(targetId)) {
        // Usa o mesmo sistema de views da página
        activateView(targetId);
      } else {
        console.warn("View não encontrada para:", targetId);
      }
    });

    // Acessibilidade: Enter/Space
    btn.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        btn.click();
      }
    });
  });

    if (!targetView) return; // Se não existir a section, sai

    // Remove a classe 'is-active' de todas as views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('is-active');
    });

    // Adiciona 'is-active' na view clicada
    targetView.classList.add('is-active');

    // (Opcional) marca o atalho como ativo
    document.querySelectorAll('.shortcut-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});
