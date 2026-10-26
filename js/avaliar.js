(() => {
  const params = new URLSearchParams(location.search);
  const code = params.get('projeto');
  const projects = window.RANFY_PROJECTS || {};
  const project = code && Object.prototype.hasOwnProperty.call(projects, code) ? projects[code] : null;
  if (!project) {
    alert('Este projeto não está cadastrado no Ranfy.');
    location.replace('qrcode.html');
    return;
  }
  document.getElementById('project-name').textContent = project.name;
  document.getElementById('project-code-label').textContent = `${project.stand} · Código: ${code} · ${project.area}`;
  const form = document.getElementById('evaluation-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type="submit"]');
    const oldText = button.textContent;
    button.disabled = true; button.textContent = 'Enviando...';
    try {
      const participante = (localStorage.getItem('ranfy_nome') || '').trim();
      if (!participante) throw new Error('Nome do avaliador não encontrado. Volte e informe seu nome.');
      const payload = {
        projeto_codigo: code, projeto_nome: project.name, participante,
        avaliacao_geral: Number(form.querySelector('input[name="avaliacao_geral"]:checked').value),
        criatividade: Number(form.querySelector('input[name="criatividade"]:checked').value),
        impacto: Number(form.querySelector('input[name="impacto"]:checked').value),
        comentario: form.elements.comentario.value.trim()
      };
      const response = await fetch(window.RANFY_API_BASE.replace(/\/$/, '') + '/api/avaliacoes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar a avaliação.');
      location.href = 'concluida.html';
    } catch (e) { alert(e.message); button.disabled = false; button.textContent = oldText; }
  });
})();
const params = new URLSearchParams(
  window.location.search
);

const codigo = params.get("codigo");
const parametros = new URLSearchParams(
  window.location.search
);

const modoTeste = parametros.get("teste") === "1";

if (modoTeste) {
  const projeto = {
    codigo_qr: "PROJETO_001",
    nome: "Ranfy",
    area: "Desenvolvimento de sistema"
  };
}