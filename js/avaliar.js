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
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const ratings = {};
    ['avaliacao_geral', 'criatividade', 'impacto'].forEach(key => { ratings[key] = Number(form.querySelector(`input[name="${key}"]:checked`).value); });
    const evaluation = { projectCode: code, projectName: project.name, participant: localStorage.getItem('ranfy_nome') || '', ratings, comment: form.elements.comentario.value.trim(), completedAt: new Date().toISOString() };
    const key = 'ranfy_avaliacoes';
    const all = JSON.parse(localStorage.getItem(key) || '[]');
    all.push(evaluation);
    localStorage.setItem(key, JSON.stringify(all));
    location.href = 'concluida.html';
  });
})();
