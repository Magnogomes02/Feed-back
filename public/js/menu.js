// js/menu.js

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".menu");
  if (nav) {
    nav.innerHTML = `
      <header class="site-header">
        <div class="logo">
          <img src="assets/images/Imagotipo CubboTech Colorida.png" alt="CubboTech" height="40">
        </div>
        <button class="menu-toggle" aria-label="Abrir menu" aria-expanded="false">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div class="user-session">
          <span id="usuario-logado"></span>
          <button id="logoutBtn" style="display:none">Sair</button>
        </div>
      </header>
      <nav class="site-nav">
        <ul>
          <li><a href="index.html">🏠 Início</a></li>
          <li><a href="formulario.html">📝 Formulário</a></li>
          <li><a href="relatorio.html">📋 Relatório</a></li>
        </ul>
      </nav>
    `;
  }

  // Opcional: lógica para mostrar/hide menu no mobile (exemplo simples)
  document.body.addEventListener("click", function(e) {
    if (e.target.closest(".menu-toggle")) {
      document.querySelector(".site-nav").classList.toggle("open");
    }
  });
});
