// js/menu.js

document.addEventListener("DOMContentLoaded", () => {
  // Menu HTML padronizado CubboTech
  const htmlMenu = `
    <header class="site-header">
      <button class="menu-toggle" aria-label="Abrir menu" aria-expanded="false">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <div class="logo">
        <img src="assets/images/Imagotipo CubboTech Colorida.png" alt="CubboTech">
      </div>
      <div class="user-session">
        <span id="usuario-logado"></span>
        <button id="logoutBtn" style="display:none">Sair</button>
      </div>
    </header>
    <nav class="site-nav" style="display:none;">
      <ul>
        <li><a href="index.html">🏠 Início</a></li>
        <li><a href="formulario.html">📝 Formulário</a></li>
        <li><a href="relatorio.html">📋 Relatório</a></li>
      </ul>
    </nav>
  `;

  // Injeta o menu na <nav class="menu">
  const navEl = document.querySelector("nav.menu");
  if (navEl) navEl.innerHTML = htmlMenu;

  // Menu responsivo: abre/fecha nav no mobile
  document.querySelectorAll('.menu-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const nav = document.querySelector('.site-nav');
      if (nav) {
        const aberto = nav.style.display === "block";
        nav.style.display = aberto ? "none" : "block";
        btn.setAttribute('aria-expanded', !aberto);
      }
    });
  });

  // Fecha nav ao clicar em link no mobile
  document.querySelectorAll('.site-nav a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 800) {
        const nav = document.querySelector('.site-nav');
        if (nav) nav.style.display = "none";
      }
    });
  });
});