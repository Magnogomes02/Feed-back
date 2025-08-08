document.addEventListener("DOMContentLoaded", () => {
  // INJETA O HTML DA ESTRUTURA BÁSICA DO MENU (links serão populados depois)
  const htmlMenu = `
<header class="cubbotech-navbar">
  <div class="navbar-container">
    <a href="index.html" class="navbar-logo">
      <img src="assets/images/Imagotipo CubboTech Branca.png" alt="CubboTech" />
    </a>
    <nav class="navbar-links" id="navbarLinks">
      <!-- Links serão inseridos dinamicamente -->
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

  const navEl = document.querySelector("nav.menu");
  if (navEl) navEl.innerHTML = htmlMenu;

  // referencias
  const toggle = document.getElementById('navbarToggle');
  const linksContainer = document.getElementById('navbarLinks');

  // função para montar os links conforme role
  function montarLinks(isGestor) {
    if (!linksContainer) return;
    let linksHTML = `<a href="index.html">Início</a>`;
    if (isGestor) {
      linksHTML += `<a href="formulario-sdr.html">Formulário SDR</a>`;
      linksHTML += `<a href="formulario-consultor.html">Formulário Consultor</a>`;
    }
    linksContainer.innerHTML = linksHTML;

    // reaplica comportamento mobile
    linksContainer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 701) linksContainer.classList.remove('active');
      });
    });
  }

  // toggle do mobile
  if (toggle && linksContainer) {
    toggle.addEventListener('click', () => {
      linksContainer.classList.toggle('active');
    });
  }

  // Autenticação e role
  firebase.auth().onAuthStateChanged(async function(user) {
    const userSpan = document.getElementById('usuario-logado');
    const logoutBtn = document.getElementById('logoutBtn');
    if (user) {
      userSpan.textContent = user.displayName ? user.displayName : user.email;
      logoutBtn.style.display = "inline-block";

      // pega claim de role
      let isGestor = false;
      try {
        const tokenResult = await user.getIdTokenResult();
        isGestor = tokenResult.claims.role === 'gestor';
      } catch (e) {
        console.warn("Erro ao obter claims do token:", e);
      }

      montarLinks(isGestor);
    } else {
      userSpan.textContent = "";
      logoutBtn.style.display = "none";
      montarLinks(false); // só "Início"
    }
  });

  // Logout
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'logoutBtn') {
      firebase.auth().signOut().then(function() {
        window.location.href = "login.html";
      });
    }
  });
});