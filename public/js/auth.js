// auth.js

// Verifica se o usuário está autenticado
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // Usuário autenticado
    console.log("Usuário autenticado:", user.email);

    // Se estiver na página de login, redireciona para index.html
    if (window.location.pathname.includes("login.html")) {
      window.location.href = "index.html";
    }
  } else {
    // Usuário não autenticado
    console.log("Usuário não autenticado");

    // Se estiver tentando acessar qualquer página que não seja o login, redireciona de volta
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "login.html";
    }
  }
});