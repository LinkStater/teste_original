
(() => {
  const status = document.getElementById("scanner-status");
  const button = document.getElementById("start-camera");
  const form = document.getElementById("manual-form");
  const input = document.getElementById("project-code");

  // Projetos fictícios para testar, sem banco de dados.
  const projetos = [
    { codigo: "PROJETO_001", nome: "Braço Robótico" },
    { codigo: "PROJETO_002", nome: "Casa Inteligente" },
    { codigo: "PROJETO_003", nome: "Energia Sustentável" }
  ];

  let scanner = null;
  let processando = false;

  function mensagem(texto, tipo = "") {
    status.textContent = texto;
    status.className = `notice ${tipo}`.trim();
  }

  function validarCodigo(texto) {
    if (processando) return;

    // Aceita um código direto ou uma URL com ?projeto=...
    let codigo = texto.trim();

    try {
      const url = new URL(codigo);
      codigo =
        url.searchParams.get("projeto") ||
        url.searchParams.get("code") ||
        codigo;
    } catch (_) {}

    const projeto = projetos.find(
      p => p.codigo === codigo
    );

    if (!projeto) {
      mensagem(
        "QR Code não cadastrado na lista de teste.",
        "error"
      );
      return;
    }

    processando = true;
    mensagem(
      `QR Code válido! Projeto: ${projeto.nome}`,
      "success"
    );

    // Por enquanto, apenas testa a leitura.
    // Não envia para a avaliação nem salva dados.
    if (scanner && scanner.isScanning) {
      scanner.stop().catch(() => {});
    }

    button.disabled = false;
    button.textContent = "Ler outro QR Code";
    processando = false;
  }

  async function iniciarCamera() {
    if (!window.Html5Qrcode) {
      mensagem(
        "Leitor não carregado. Verifique sua conexão com a internet.",
        "error"
      );
      return;
    }

    button.disabled = true;
    mensagem("Abrindo câmera...");

    try {
      if (!scanner) {
        scanner = new Html5Qrcode("reader");
      }

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras.length) {
        throw new Error("Nenhuma câmera encontrada.");
      }

      const camera =
        cameras.find(c =>
          /back|rear|traseira|environment/i.test(c.label)
        ) || cameras[0];

      await scanner.start(
        camera.id,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 }
        },
        textoLido => validarCodigo(textoLido),
        () => {}
      );

      mensagem("Aponte a câmera para um QR Code.");
      button.textContent = "Câmera ativada";
    } catch (erro) {
      mensagem(
        erro.message || "Não foi possível abrir a câmera.",
        "error"
      );
      button.disabled = false;
      button.textContent = "Ativar câmera";
    }
  }

  button.addEventListener("click", () => {
    if (scanner && scanner.isScanning) {
      scanner.stop().catch(() => {});
      button.textContent = "Ativar câmera";
      mensagem("Câmera fechada.");
      return;
    }

    processando = false;
    iniciarCamera();
  });

  form.addEventListener("submit", evento => {
    evento.preventDefault();
    validarCodigo(input.value);
  });

  mensagem("Pronto para testar. Ative a câmera ou digite um código.");
})();
