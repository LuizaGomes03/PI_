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
  // injeta menu/rodapé se existirem
  const into = async (id, url) => {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      const r = await fetch(url);
      el.innerHTML = await r.text();
    } catch (e) { /* silencia */ }
  };
  into('menu', 'menu.html');
  into('rodape', 'rodape.html');

  // acessibilidade teclado: Enter/Space clicam no card
  const cards = document.querySelectorAll('.grid .card');
  cards.forEach(card => {
    // skeleton -> loaded
    const img = card.querySelector('img');
    if (img) {
      img.addEventListener('load', () => {
        const wrap = card.querySelector('.img-wrap');
        wrap?.classList.add('img-loaded');
        wrap?.classList.remove('skeleton');
      });
    }

    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });

    card.addEventListener('click', () => {
      const unidade = {
        id: card.dataset.unit || '',
        nome: card.dataset.name || '',
        mall: card.dataset.mall || ''
      };

      // guarda seleção
      sessionStorage.setItem('ag_unidade', JSON.stringify(unidade));

      // feedback
      toast(`Unidade selecionada: <b>${unidade.nome}</b><br><small>${unidade.mall}</small>`);

      // pequeno delay só pra ver o toast, opcional
      setTimeout(() => {
        window.location.href = 'agendamento_opção2.html';
      }, 420);
    });
  });

  // marca etapa ativa nos dots
  document.querySelectorAll('.wizard-dots .wdot').forEach((d, i) => {
    d.classList.toggle('active', i === 0);
    d.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
  });

  // toast helper
  function toast(html){
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerHTML = html;
    t.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(()=> t.classList.remove('show'), 1800);
  }

  // Redireciona para a tela de opção 2
  document.querySelectorAll('.unit .card').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.unit;
      const name = encodeURIComponent(btn.dataset.name);
      const mall = encodeURIComponent(btn.dataset.mall);

      const base = 'agendamento_opção2.html'; // com acento
      const url  = encodeURI(base) + `?unit=${id}&name=${name}&mall=${mall}`;
      window.location.href = url;

      // ou, se tiver em outra pasta:
      // const url = encodeURI('../HTML/agendamento_opção2.html') + `?unit=${id}&name=${name}&mall=${mall}`;
      // window.location.href = url;
    });
  });
});
