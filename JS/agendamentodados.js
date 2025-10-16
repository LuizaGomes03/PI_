// ../JS/homepage.js
document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // helpers
  // =========================
  const $  = (sel, root = document) => root.querySelector(sel);
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

    // toggle do menu (só depois que o menu.html foi injetado)
    const menuToggle = $('.menu-toggle');
    const mainMenu   = $('#main-menu');
    if (menuToggle && mainMenu) {
      menuToggle.addEventListener('click', () => {
        mainMenu.classList.toggle('active');
        const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', String(!expanded));
      });
    }
  })();

  // =========================
  // carrossel: rolar o container
  // =========================
  const track   = $('#postsRow');      // scroller
  const btnPrev = $('#postsPrev');
  const btnNext = $('#postsNext');

  if (btnPrev) btnPrev.type = 'button';
  if (btnNext) btnNext.type = 'button';

  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (track) {
    // scroll suave só se o usuário não pedir redução de movimento
    track.style.scrollBehavior = prefersReduced ? 'auto' : 'smooth';
    track.setAttribute('tabindex', '0'); // teclado
  }

  const getStep = () => Math.round((track?.clientWidth || 0) * 0.8);

  const updateButtons = () => {
    if (!track || !btnPrev || !btnNext) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const atStart   = track.scrollLeft <= 0;
    const atEnd     = track.scrollLeft >= maxScroll - 1;

    btnPrev.disabled = atStart;
    btnNext.disabled = atEnd;
    btnPrev.classList.toggle('is-disabled', atStart);
    btnNext.classList.toggle('is-disabled', atEnd);
    btnPrev.setAttribute('aria-disabled', String(atStart));
    btnNext.setAttribute('aria-disabled', String(atEnd));
  };

  const initCarousel = () => {
    if (!track) return;

    // Click setas
    btnNext?.addEventListener('click', (e) => {
      e.preventDefault();
      track.scrollBy({ left: getStep(), behavior: prefersReduced ? 'auto' : 'smooth' });
    }, { passive: false });

    btnPrev?.addEventListener('click', (e) => {
      e.preventDefault();
      track.scrollBy({ left: -getStep(), behavior: prefersReduced ? 'auto' : 'smooth' });
    }, { passive: false });

    // Teclado
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); btnNext?.click(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); btnPrev?.click(); }
    });

    // Scroll -> atualiza estado dos botões
    track.addEventListener('scroll', updateButtons, { passive: true });

    // Wheel vertical vira scroll horizontal (fica MUITO nice no desktop)
    track.addEventListener('wheel', (e) => {
      // se há overflow horizontal, redireciona o deltaY em X
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollBy({ left: e.deltaY, behavior: prefersReduced ? 'auto' : 'smooth' });
      }
    }, { passive: false });

    // Drag-to-scroll (mouse/touch)
    let isDown = false;
    let startX = 0;
    let startLeft = 0;

    const startDrag = (clientX) => {
      isDown = true;
      startX = clientX;
      startLeft = track.scrollLeft;
      track.style.cursor = 'grabbing';
      track.style.userSelect = 'none';
    };
    const moveDrag = (clientX) => {
      if (!isDown) return;
      const dx = clientX - startX;
      track.scrollLeft = startLeft - dx;
    };
    const endDrag = () => {
      isDown = false;
      track.style.cursor = '';
      track.style.userSelect = '';
    };

    track.addEventListener('pointerdown', (e) => {
      // clique somente no espaço do track (evita conflito com links)
      if ((e.target)?.closest('a')) return;
      track.setPointerCapture(e.pointerId);
      startDrag(e.clientX);
    });
    track.addEventListener('pointermove', (e) => moveDrag(e.clientX));
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    // Recalcula quando viewport muda (debounce)
    let rAF;
    const onResize = () => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(updateButtons);
    };
    window.addEventListener('resize', onResize);

    // Espera imagens da faixa carregarem pra medir scrollWidth certinho
    const imgs = $$('img', track);
    let pending = imgs.length;
    if (pending === 0) updateButtons();
    imgs.forEach(img => {
      if (img.complete) {
        if (--pending === 0) updateButtons();
      } else {
        const done = () => { if (--pending === 0) updateButtons(); };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });

    // fallback: se nada disparar, atualiza de qualquer jeito
    setTimeout(updateButtons, 250);
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
    s.async = true;
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

  // =========================
  // LGPT Integration
  // =========================
  const initLGPT = () => {
    const lgptScript = document.createElement('script');
    lgptScript.src = 'https://cdn.lgpt.ai/sdk.js';
    lgptScript.async = true;
    lgptScript.onload = () => {
      console.log('LGPT SDK loaded successfully');
      // Initialize LGPT with your configuration
      LGPT.init({
        apiKey: 'your-api-key-here',
        language: 'pt-BR',
        theme: 'light',
      });
    };
    lgptScript.onerror = () => {
      console.error('Failed to load LGPT SDK');
    };
    document.head.appendChild(lgptScript);
  };

  // Call LGPT initialization
  initLGPT();

  // inclui menu e rodapé (ajuste os caminhos se menu.html/rodape.html estiverem em outra pasta)
  fetch("menu.html").then(r => r.text()).then(html => { document.getElementById("menu").innerHTML = html; });
  fetch("rodape.html").then(r => r.text()).then(html => { document.getElementById("rodape").innerHTML = html; });

  // validação Bootstrap vibe
  const form = document.getElementById('formDados');
  form.addEventListener('submit', (e) => {
      if (!form.checkValidity()) {
          e.preventDefault();
          e.stopPropagation();
      }
      form.classList.add('was-validated');
  }, false);
});
