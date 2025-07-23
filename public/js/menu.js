// menu.js

document.addEventListener('DOMContentLoaded', () => {
  // HTML do menu que aparece no drawer/lateral
  const menuHTML = `
    <ul>
      <li><a href="index.html">🏠 Início</a></li>
    </ul>
  `;

  // Injeta no .site-nav (se existir)
  const nav = document.querySelector('.site-nav');
  if (nav) nav.innerHTML = menuHTML;

  const toggle = document.querySelector('.menu-toggle');
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);

  function openMenu() {
    if (nav) nav.classList.add('open');
    overlay.classList.add('show');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    if (nav) nav.classList.remove('open');
    overlay.classList.remove('show');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle) {
    toggle.addEventListener('click', openMenu);
    overlay.addEventListener('click', closeMenu);
  }
});
