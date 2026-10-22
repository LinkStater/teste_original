(() => {
  const status = document.getElementById("scanner-status");
  const button = document.getElementById("start-camera");
  const form = document.getElementById("manual-project-form");
  const input = document.getElementById("project-code");

  // Usa a lista de projetos de teste já existente.
  const projetos = window.RANFY_PROJECTS || {};
  let scanner = null;
  let processando = false;

  function mensagem(texto, tipo = "") {
    status.textContent = texto;
    status.className = `notice ${tipo}`.trim();
  }

  function extrairCodigo(texto) {
    const conteudo = texto.trim();

    try {
      const url = new URL(conteudo);

      return (
        url.searchParams.get("projeto") ||
        url.searchParams.get("codigo") ||
        url.searchParams.get("code") ||
        conteudo
      );
    } catch {
      return conteudo;
    }
  }

  async function validarCodigo(texto) {
    if (processando) return;

    const codigo = extrairCodigo(texto);
    const projeto = projetos[codigo];

    if (!projeto) {
      mensagem(
        "Projeto não encontrado na lista. Confira o código.",
        "error"
      );
      return;
    }

    processando = true;
    mensagem(`Projeto encontrado: ${projeto.name}. Abrindo avaliação...`, "success");

    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop();
      } catch (erro) {
        console.warn("Não foi possível parar a câmera:", erro);
      }
    }

    window.location.href =
      `avaliar.html?projeto=${encodeURIComponent(codigo)}`;
  }

  async function iniciarCamera() {
    if (!window.Html5Qrcode) {
      mensagem("O leitor de QR Code não carregou.", "error");
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
        { fps: 10, qrbox: { width: 240, height: 240 } },
        texto => validarCodigo(texto),
        () => {}
      );

      mensagem("Aponte a câmera para o QR Code.");
      button.textContent = "Câmera ativada";
      button.disabled = false;
    } catch (erro) {
      mensagem(erro.message || "Não foi possível abrir a câmera.", "error");
      button.disabled = false;
      button.textContent = "Ativar câmera";
    }
  }

  button.addEventListener("click", () => {
    if (scanner && scanner.isScanning) {
      scanner.stop().then(() => {
        button.textContent = "Ativar câmera";
        mensagem("Câmera fechada.");
      }).catch(() => {});
      return;
    }

    processando = false;
    iniciarCamera();
  });

  form.addEventListener("submit", evento => {
    evento.preventDefault();
    validarCodigo(input.value);
  });

  mensagem("Ative a câmera ou digite o código do projeto.");
})();