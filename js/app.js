(() => {
  const name = (localStorage.getItem('ranfy_nome') || '').trim();
  const page = location.pathname.split('/').pop() || 'index.html';
  const isLogin = page === 'login.html' || page === '';
  if (!name && !isLogin) {
    location.replace('login.html');
    return;
  }
  if (name && isLogin) {
    // Visitante já identificado: não exige login novamente.
    // Se quiser trocar o participante, limpe ranfy_nome no armazenamento do navegador.
    location.replace('index.html');
    return;
  }
  document.querySelectorAll('[data-participant-name]').forEach(el => el.textContent = name);
})();


