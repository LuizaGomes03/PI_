// ../JS/homepage.js
document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // helpers
  // =========================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const fetchInto = async (targetId, url) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    try {
      const r = await fetch(url);
      const html = await r.text();
      el.innerHTML = html;
    } catch (e) {
      console.warn(`fetchInto(${url}) falhou:`, e);
    }
  };

  // =========================
  // menu & rodapé
  // =========================
  (async () => {
    await fetchInto('menu', 'menu.html');
    await fetchInto('rodape', 'rodape.html');

    // liga o toggle do menu (só depois que o menu.html foi injetado)
    const menuToggle = $('.menu-toggle');
    const mainMenu = $('#main-menu');
    if (menuToggle && mainMenu) {
      menuToggle.addEventListener('click', () => {
        mainMenu.classList.toggle('active');
        const expanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
        menuToggle.setAttribute('aria-expanded', String(!expanded));
      });
    }
  })();

  // =========================
  // carrossel: rolar o container
  // =========================
  const row = $('#postsRow');
  const track = $('.posts-track') || row; 
  const btnPrev = $('#postsPrev');
  const btnNext = $('#postsNext');


  // previne submit acidental se estiver dentro de form
  btnPrev?.setAttribute('type', 'button');
  btnNext?.setAttribute('type', 'button');

  const getStep = () => Math.round((track?.clientWidth || 0) * 0.8);

  const updateButtons = () => {
    if (!track || !btnPrev || !btnNext) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const atStart = track.scrollLeft <= 0;
    const atEnd = track.scrollLeft >= maxScroll - 1;
    btnPrev.disabled = atStart;
    btnNext.disabled = atEnd;
    btnPrev.classList.toggle('is-disabled', atStart);
    btnNext.classList.toggle('is-disabled', atEnd);
  };

  const initCarousel = () => {
    if (!track || !row) return;

    // estilos mínimos de segurança (caso o CSS não esteja aplicado ainda)
    track.style.overflow = track.style.overflow || 'auto';
    row.style.display = row.style.display || 'flex';

    btnNext?.addEventListener('click', (e) => {
      e.preventDefault();
      track.scrollBy({ left: getStep(), behavior: 'smooth' });
    });

    btnPrev?.addEventListener('click', (e) => {
      e.preventDefault();
      track.scrollBy({ left: -getStep(), behavior: 'smooth' });
    });

    // revalida nos eventos que alteram dimensão/scroll
    track.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', () => {
      // força revalidação leve
      updateButtons();
    });

    // espera imagens carregarem pra calcular largura correta
    const imgs = $$('img', row);
    let pending = imgs.length;
    if (pending === 0) updateButtons();
    imgs.forEach(img => {
      if (img.complete) {
        if (--pending === 0) updateButtons();
      } else {
        img.addEventListener('load', () => { if (--pending === 0) updateButtons(); });
        img.addEventListener('error', () => { if (--pending === 0) updateButtons(); });
      }
    });
  };

  initCarousel();

  // =========================
  // VLibras (injeção única)
  // =========================
  const injectVLibras = () => {
    // evita duplicar se já existir
    if (window.VLibras || $('[vw]')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div vw class="enabled">
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>
      </div>`;
    document.body.appendChild(wrapper);

    const s = document.createElement('script');
    s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    s.onload = () => {
      try {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
      } catch (err) {
        console.warn('VLibras init falhou:', err);
      }
    };
    document.body.appendChild(s);
  };

  injectVLibras();
});
