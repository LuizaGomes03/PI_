// Próxima tela após selecionar a unidade:
const NEXT_PAGE = "agendamento1.html";

// Próxima fase após selecionar o serviço
const NEXT_PAGE_SERVICE = "agendamento3.html";

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

document.querySelectorAll(".service .card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const service = btn.dataset.service;
    const name = btn.dataset.name;

    // Guarda a escolha (fallback para próxima página)
    localStorage.setItem(
      "rz.selectedService",
      JSON.stringify({ service, name, ts: Date.now() })
    );

    // Também envia pela URL (para ser lido direto)
    const url = new URL(NEXT_PAGE_SERVICE, window.location.href);
    url.searchParams.set("service", service);
    url.searchParams.set("name", name);

    window.location.href = url.toString();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const units = document.querySelectorAll(".unit .card");
  const dots = document.querySelectorAll(".dots .dot");
  let currentStep = 0;

  units.forEach((unit) => {
    unit.addEventListener("click", () => {
      // Avança para a próxima fase
      if (currentStep < dots.length - 1) {
        dots[currentStep].classList.remove("active");
        dots[currentStep].removeAttribute("aria-current");
        currentStep++;
        dots[currentStep].classList.add("active");
        dots[currentStep].setAttribute("aria-current", "true");

        // Exibe mensagem ou muda o conteúdo para a próxima fase
        const unitName = unit.dataset.name;
        const mallName = unit.dataset.mall;
        alert(`Unidade selecionada: ${unitName} (${mallName})`);
        // Aqui você pode carregar o próximo conteúdo dinamicamente
      }
    });
  });
});
