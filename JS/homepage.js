const postsRow = document.getElementById('postsRow');
const btnPrev = document.getElementById('postsPrev');
const btnNext = document.getElementById('postsNext');
const menuToggle = document.querySelector('.menu-toggle');
const mainMenu = document.getElementById('main-menu');

menuToggle.addEventListener('click', () => {
  mainMenu.classList.toggle('active');
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
  menuToggle.setAttribute('aria-expanded', !expanded);
});


let scrollAmount = 0;
const scrollStep = 300; // quanto vai deslizar a cada clique (ajuste se quiser)
const maxScroll = postsRow.scrollWidth - postsRow.clientWidth;

btnNext.addEventListener('click', () => {
  scrollAmount += scrollStep;
  if (scrollAmount > maxScroll) scrollAmount = maxScroll;
  postsRow.style.transform = `translateX(-${scrollAmount}px)`;
});

btnPrev.addEventListener('click', () => {
  scrollAmount -= scrollStep;
  if (scrollAmount < 0) scrollAmount = 0;
  postsRow.style.transform = `translateX(-${scrollAmount}px)`;
});
