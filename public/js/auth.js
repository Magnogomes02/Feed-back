// js/auth.js

document.addEventListener("DOMContentLoaded", () => {
  // Checa login do usuário para proteger páginas se necessário
  firebase.auth().onAuthStateChanged(user => {
    const spanUsuario = document.getElementById("usuario-logado");
    const btnLogout = document.getElementById("logoutBtn");
    if (user) {
      // Exibe email/logado no menu
      if (spanUsuario) spanUsuario.textContent = user.email;
      if (btnLogout) btnLogout.style.display = "inline-block";
      // Protege rota se não for gestor (se quiser limitar acesso)
      // user.getIdTokenResult().then(token => {
      //   if (token.claims.role !== "gestor") {
      //     window.location.href = "acesso-negado.html";
      //   }
      // });
    } else {
      if (spanUsuario) spanUsuario.textContent = "";
      if (btnLogout) btnLogout.style.display = "none";
      // Se quiser forçar login em todas as rotas, descomente:
      // window.location.href = "login.html";
    }
  });

  // Logout
  const btnLogout = document.getElementById("logoutBtn");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      firebase.auth().signOut().then(() => {
        window.location.href = "index.html";
      });
    });
  }
});
