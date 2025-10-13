// Próxima tela após selecionar a unidade:
const NEXT_PAGE = "agendamento1.html";

// Liga clique em cada card de unidade
document.querySelectorAll(".card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const unit = btn.dataset.unit;
    const name = btn.dataset.name;
    const mall = btn.dataset.mall;

    // Guarda a escolha (fallback pra próxima página)
    localStorage.setItem(
      "rz.selectedUnit",
      JSON.stringify({ unit, name, mall, ts: Date.now() })
    );

    // Também envia pela URL (pra ser lido direto)
    const url = new URL(NEXT_PAGE, window.location.href);
    url.searchParams.set("unit", unit);
    url.searchParams.set("name", name);
    url.searchParams.set("mall", mall);

    window.location.href = url.toString();
  });
});
