// js/auth.js
const publicPages = ['login.html','acesso-negado.html'];
const currentPage = window.location.pathname.split('/').pop();
document.addEventListener('DOMContentLoaded', () => {
  if (publicPages.includes(currentPage)) return;
  const userJson = localStorage.getItem('usuario');
  if (!userJson) return window.location = 'login.html';
  const { papel } = JSON.parse(userJson);
  const pages = {
    'index.html': ['gestor','sdr'],
    'relatorio.html': ['gestor','sdr'],
    'formulario.html': ['gestor']
  };
  if (!(pages[currentPage] || []).includes(papel)) {
    window.location = 'acesso-negado.html';
  }
});
