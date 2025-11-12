// ../JS/homepage.js
document.addEventListener('DOMContentLoaded', () => {
  // helpers
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const fetchInto = async (targetId, url) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    try {
      const r = await fetch(url);
      el.innerHTML = await r.text();
    } catch (e) {
      console.warn(`fetchInto(${url}) falhou:`, e);
    }
  };

  // ============= menu & rodapé + BUSCA GLOBAL =============
  (async () => {
    await fetchInto('menu', 'menu.html');
    await fetchInto('rodape', 'rodape.html');

    // hambúrguer do menu (se existir)
    const hamburger = $('.hamburger');
    const navList  = $('nav ul');
    if (hamburger && navList) {
      hamburger.addEventListener('click', () => {
        navList.classList.toggle('active');
        hamburger.classList.toggle('open');
      });
    }

    // -------- BUSCA GLOBAL COM SUGESTÕES --------
    // Requisitos: input#menuSearch no menu.html
    const input = $('#menuSearch');
    if (input) {
      // dropdown host
      const container = input.closest('.search-container') || $('#menu') || document.body;
      if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
      const list = document.createElement('div');
      list.className = 'search-suggestions';
      list.setAttribute('role', 'listbox');
      list.style.display = 'none';
      container.appendChild(list);

      // carrega índice global (ajusta o caminho se teu HTML não estiver em /HTML)
      // homepage.html está em /HTML, então o JSON está em /data -> caminho relativo:
      const INDEX_URL = '../data/search-index.json';

      let INDEX = [];
      try {
        const res = await fetch(INDEX_URL, { cache: 'no-store' });
        INDEX = await res.json();
      } catch (err) {
        console.warn('Não carregou search-index.json:', err);
      }

      // rankeamento simples: título e tags
      const norm = s => (s || '').toLowerCase();
      const score = (row, term) => {
        const q = norm(term);
        if (!q) return 0;
        let s = 0;
        const title = norm(row.title);
        const tags  = Array.isArray(row.tags) ? row.tags.map(norm).join(' ') : norm(row.tags);
        const hay   = `${title} ${tags}`;

        const i = title.indexOf(q);
        if (i >= 0) s += 20 - i + (i === 0 ? 3 : (title[i - 1] === ' ' ? 1 : 0));
        if (tags.includes(q)) s += 8;

        // boosts por termos separados
        const parts = q.split(/\s+/).filter(Boolean);
        parts.forEach(p => { if (hay.includes(p)) s += 2; });

        return s;
      };

      const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const highlight = (title, term) => {
        if (!term) return title;
        const re = new RegExp(`(${escRe(term)})`, 'ig');
        return title.replace(re, '<mark>$1</mark>');
      };

      let active = -1;
      const render = (term) => {
        list.innerHTML = '';
        active = -1;
        const q = term.trim();
        if (!q || INDEX.length === 0) { list.style.display = 'none'; return; }

        const hits = INDEX
          .map(row => ({ ...row, _s: score(row, q) }))
          .filter(r => r._s > 0)
          .sort((a,b) => b._s - a._s)
          .slice(0, 8);

        if (hits.length === 0) { list.style.display = 'none'; return; }

        hits.forEach((it, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'suggestion';
          btn.setAttribute('role', 'option');
          btn.setAttribute('data-href', it.url);
          btn.innerHTML = `
            <span class="title">${highlight(it.title, q)}</span>
            ${it.tags?.length ? `<small class="tags">${(Array.isArray(it.tags)?it.tags:[it.tags]).slice(0,3).join(' · ')}</small>` : '' }
          `;
          btn.addEventListener('click', () => {
            window.location.href = it.url;
          });
          btn.addEventListener('mousemove', () => setActive(idx));
          list.appendChild(btn);
        });

        list.style.display = 'block';
      };

      const setActive = (idx) => {
        const children = Array.from(list.children);
        children.forEach((el, i) => el.classList.toggle('active', i === idx));
        active = idx;
      };

      // debounce leve
      let tId;
      const debounced = (v) => { clearTimeout(tId); tId = setTimeout(() => render(v), 90); };

      // eventos
      input.addEventListener('input', () => debounced(input.value));
      input.addEventListener('focus', () => input.value.trim() ? render(input.value) : null);

      input.addEventListener('keydown', (e) => {
        const total = list.children.length;
        if (!total) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActive((active + 1) % total);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActive((active - 1 + total) % total);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const target = active >= 0 ? list.children[active] : list.children[0];
          const href = target?.getAttribute('data-href');
          if (href) window.location.href = href;
        } else if (e.key === 'Escape') {
          list.style.display = 'none';
          list.innerHTML = '';
          active = -1;
          input.blur();
        }
      });

      // fecha ao clicar fora
      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
          list.style.display = 'none';
          active = -1;
        }
      }, { capture: true });
    }
  })();

  // ============= carrossel (igual ao teu) =============
  const track   = $('#postsRow');
  const btnPrev = $('#postsPrev');
  const btnNext = $('#postsNext');

  if (btnPrev) btnPrev.type = 'button';
  if (btnNext) btnNext.type = 'button';

  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (track) {
    track.style.scrollBehavior = prefersReduced ? 'auto' : 'smooth';
    track.setAttribute('tabindex', '0');
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
    btnNext?.addEventListener('click', (e) => {
      e.preventDefault();
      track.scrollBy({ left: getStep(), behavior: prefersReduced ? 'auto' : 'smooth' });
    }, { passive: false });
    btnPrev?.addEventListener('click', (e) => {
      e.preventDefault();
      track.scrollBy({ left: -getStep(), behavior: prefersReduced ? 'auto' : 'smooth' });
    }, { passive: false });

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); btnNext?.click(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); btnPrev?.click(); }
    });
    track.addEventListener('scroll', updateButtons, { passive: true });

    track.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollBy({ left: e.deltaY, behavior: prefersReduced ? 'auto' : 'smooth' });
      }
    }, { passive: false });

    // drag-to-scroll
    let isDown = false, startX = 0, startLeft = 0;
    const startDrag = (x) => { isDown = true; startX = x; startLeft = track.scrollLeft;
      track.style.cursor = 'grabbing'; track.style.userSelect = 'none'; };
    const moveDrag  = (x) => { if (!isDown) return; track.scrollLeft = startLeft - (x - startX); };
    const endDrag   = () => { isDown = false; track.style.cursor = ''; track.style.userSelect = ''; };

    track.addEventListener('pointerdown', (e) => {
      if ((e.target)?.closest('a')) return;
      track.setPointerCapture(e.pointerId); startDrag(e.clientX);
    });
    track.addEventListener('pointermove', (e) => moveDrag(e.clientX));
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    let rAF;
    const onResize = () => { if (rAF) cancelAnimationFrame(rAF); rAF = requestAnimationFrame(updateButtons); };
    window.addEventListener('resize', onResize);

    const imgs = $$('img', track);
    let pending = imgs.length;
    if (pending === 0) updateButtons();
    imgs.forEach(img => {
      if (img.complete) { if (--pending === 0) updateButtons(); }
      else {
        const done = () => { if (--pending === 0) updateButtons(); };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
    setTimeout(updateButtons, 250);
  };
  initCarousel();

  // ============= VLibras (injeção única) =============
  const injectVLibras = () => {
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
    s.onload = () => { try { new window.VLibras.Widget('https://vlibras.gov.br/app'); } catch(e){} };
    document.body.appendChild(s);
  };
  injectVLibras();
});
