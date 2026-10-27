
(() => {
  const status = document.getElementById("scanner-status");
  const manualStatus = document.getElementById("manual-status");
  const button = document.getElementById("start-camera");
  const form = document.getElementById("manual-project-form");
  const input = document.getElementById("project-code");

  let scanner = null;
  let processando = false;

  function mensagem(texto, tipo = "") {
    status.textContent = texto;
    status.className = `scanner-hint ${tipo}`.trim();
  }

  function mensagemManual(texto, tipo = "") {
    manualStatus.textContent = texto;
    manualStatus.className = `scanner-hint ${tipo}`.trim();
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
      ).trim();
    } catch {
      return conteudo;
    }
  }

  async function validarCodigo(texto, origem = "camera") {
    if (processando) return;

    const codigo = extrairCodigo(texto);

    if (!codigo) {
      mensagemManual("Digite o código do projeto.", "error");
      return;
    }

    processando = true;

    const informar = origem === "manual"
      ? mensagemManual
      : mensagem;

    informar("Consultando projeto no banco de dados...");

    try {
      const api = window.RANFY_API_URL;

      if (!api) {
        throw new Error("A URL da API não foi configurada.");
      }

      const resposta = await fetch(
        `${api}/api/projetos/${encodeURIComponent(codigo)}`
      );

      if (resposta.status === 404) {
        informar(
          "Projeto não encontrado. Confira o QR Code ou o código digitado.",
          "error"
        );
        processando = false;
        return;
      }

      if (!resposta.ok) {
        throw new Error(`A API respondeu com erro ${resposta.status}.`);
      }

      const projeto = await resposta.json();

      if (!projeto.codigo || !projeto.nome) {
        throw new Error("A API retornou dados incompletos do projeto.");
      }

      informar(`Projeto encontrado: ${projeto.nome}. Abrindo avaliação...`, "success");

      if (scanner && scanner.isScanning) {
        try {
          await scanner.stop();
        } catch (erro) {
          console.warn("Não foi possível parar a câmera:", erro);
        }
      }

      window.location.href =
        `avaliar.html?projeto=${encodeURIComponent(projeto.codigo)}`;

    } catch (erro) {
      console.error("Erro ao validar projeto:", erro);

      informar(
        "Não foi possível consultar os projetos. Verifique a conexão e tente novamente.",
        "error"
      );

      processando = false;
    }
  }

  async function iniciarCamera() {
    if (!window.Html5Qrcode) {
      mensagem(
        "O leitor não carregou. Verifique a conexão com a internet.",
        "error"
      );
      return;
    }

    button.disabled = true;
    mensagem("Solicitando acesso à câmera...");

    try {
      if (!scanner) {
        scanner = new Html5Qrcode("reader");
      }

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras.length) {
        throw new Error("Nenhuma câmera foi encontrada.");
      }

      const camera =
        cameras.find(c =>
          /back|rear|traseira|environment/i.test(c.label)
        ) || cameras[0];

      await scanner.start(
        camera.id,
        { fps: 10, qrbox: { width: 240, height: 240 } },
        texto => validarCodigo(texto, "camera"),
        () => {}
      );

      mensagem("Câmera ativa. Aponte para o QR Code.");
      button.textContent = "Câmera ativada";

    } catch (erro) {
      console.error("Erro ao iniciar câmera:", erro);

      mensagem(
        erro.message || "Não foi possível abrir a câmera.",
        "error"
      );
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", async () => {
    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop();
        button.textContent = "Ativar câmera";
        mensagem("Câmera fechada.");
      } catch (erro) {
        console.error(erro);
        mensagem("Não foi possível fechar a câmera.", "error");
      }
      return;
    }

    processando = false;
    iniciarCamera();
  });

  form.addEventListener("submit", evento => {
    evento.preventDefault();
    validarCodigo(input.value, "manual");
  });

  mensagem("Ative a câmera ou digite o código do projeto.");
})();
