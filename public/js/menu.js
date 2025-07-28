document.addEventListener("DOMContentLoaded", () => {
  // INJETA O HTML DO MENU!
  const htmlMenu = `
<header class="cubbotech-navbar">
  <div class="navbar-container">
    <a href="index.html" class="navbar-logo">
      <img src="assets/images/Imagotipo CubboTech Branca.png" alt="CubboTech" />
    </a>
    <nav class="navbar-links" id="navbarLinks">
      <a href="index.html">Início</a>
      <a href="formulario.html">Formulário</a>
    </nav>
    <div class="navbar-actions">
      <span id="usuario-logado" class="navbar-user"></span>
      <button id="logoutBtn" class="navbar-btn" style="display:none;">Sair</button>
      <button class="navbar-toggle" id="navbarToggle" aria-label="Abrir menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>
  `;

  // Injeta dentro do elemento nav.menu (assim o menu aparece!)
  const navEl = document.querySelector("nav.menu");
  if (navEl) navEl.innerHTML = htmlMenu;

  // ...restante do seu JS (eventos do hamburguer, etc)...
  const toggle = document.getElementById('navbarToggle');
  const links = document.getElementById('navbarLinks');
  if(toggle && links){
    toggle.addEventListener('click', () => {
      links.classList.toggle('active');
    });
    // Fecha o menu ao clicar em um link (no mobile)
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if(window.innerWidth < 701) links.classList.remove('active');
      });
    });
  }

  firebase.auth().onAuthStateChanged(function(user) {
    const userSpan = document.getElementById('usuario-logado');
    const logoutBtn = document.getElementById('logoutBtn');
    if (user) {
      // Exibe email (ou displayName se quiser mais estiloso)
      userSpan.textContent = user.displayName ? user.displayName : user.email;
      logoutBtn.style.display = "inline-block";
    } else {
      userSpan.textContent = "";
      logoutBtn.style.display = "none";
    }
  });

  // Logout funcional
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'logoutBtn') {
      firebase.auth().signOut().then(function() {
        window.location.href = "login.html"; // ou sua tela inicial/login
      });
    }
  });
});
