const form = document.getElementById('loginForm');
const mensagem = document.getElementById('mensagem');
form.addEventListener('submit', async e => {
  e.preventDefault();
  mensagem.textContent = '';
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  try {
    await firebase.auth().signInWithEmailAndPassword(email, senha);
    const papeis = {
      'suporte@cubbotech.com.br': 'gestor',
      'edson.lima@cubbotech.com.br': 'sdr'
    };
    const papel = papeis[email] || 'sdr';
    const usuario = { email, papel };
    localStorage.setItem('usuario', JSON.stringify(usuario));
    window.location = 'index.html';
  } catch {
    mensagem.textContent = 'Usuário ou senha inválidos!';
  }
});