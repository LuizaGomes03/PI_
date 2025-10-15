// Carrega o script do VLibras dinamicamente
const script = document.createElement('script');
script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
script.onload = function() {
  new window.VLibras.Widget('https://vlibras.gov.br/app');
};
document.body.appendChild(script);