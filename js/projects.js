
(() => {
  const api = window.RANFY_API_URL;

  window.RANFY_PROJECTS = {};

  window.RANFY_PROJECTS_READY = (async () => {
    if (!api) {
      throw new Error("A URL da API do Ranfy não foi configurada.");
    }

    const resposta = await fetch(`${api}/api/projetos`);

    if (!resposta.ok) {
      throw new Error("Não foi possível buscar os projetos no Neon.");
    }

    const lista = await resposta.json();
    const projetos = {};

    for (const p of lista) {
      const codigo = p.codigo_qr || p.codigo;

      if (!codigo) continue;

      projetos[codigo.trim().toUpperCase()] = {
        code: codigo.trim().toUpperCase(),
        name: p.nome,
        area: p.area,
        stand: ""
      };
    }

    window.RANFY_PROJECTS = projetos;
    return projetos;
  })();
})();
