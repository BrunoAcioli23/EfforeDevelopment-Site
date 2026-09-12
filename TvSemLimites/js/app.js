(function () {
  "use strict";

  const C = window.TSL_CONFIG;
  const $ = (sel, el = document) => el.querySelector(sel);

  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const escapar = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const ICONES = {
    tv: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="26" height="17" rx="2"/><path d="M11 27h10M16 23v4"/></svg>',
    celular: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="14" height="26" rx="3"/><path d="M14 25h4"/></svg>',
    computador: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="7" width="20" height="14" rx="1.5"/><path d="M3 25h26"/></svg>',
    tvbox: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="12" width="24" height="10" rx="2"/><circle cx="9" cy="17" r="1"/><path d="M13 17h10M11 8l5 4 5-4"/></svg>',
    firestick: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="11" y="3" width="10" height="20" rx="2"/><path d="M14 23v4h4v-4"/><circle cx="16" cy="9" r="1.5"/></svg>',
  };

  /* ---------- Parede de capas ---------- */
  function montarParede() {
    const parede = $("#parede");
    const capas = C.capas;
    const fileiras = 4;
    const porFileira = Math.min(capas.length, 18);
    const html = [];
    for (let f = 0; f < fileiras; f++) {
      const itens = [];
      for (let i = 0; i < porFileira; i++) {
        const idx = (i + f * 11) % capas.length;
        const capa = capas[idx];
        if (capa.logo) {
          itens.push(
            `<div class="capa capa-liga"><span class="capa-tipo">${escapar(capa.tipo)}</span><img src="${escapar(capa.logo)}" alt="" loading="lazy"><span class="capa-titulo">${escapar(capa.titulo)}</span></div>`
          );
        } else if (capa.img) {
          itens.push(`<div class="capa"><img src="${escapar(capa.img)}" alt="" loading="lazy"></div>`);
        } else {
          itens.push(
            `<div class="capa capa-gerada c${(idx + f) % 6}"><span class="capa-tipo">${escapar(capa.tipo)}</span><span class="capa-titulo">${escapar(capa.titulo)}</span></div>`
          );
        }
      }
      const trilho = `<div class="trilho">${itens.join("")}</div>`;
      html.push(`<div class="fileira">${trilho}${trilho}</div>`);
    }
    parede.innerHTML = html.join("");
  }

  /* ---------- Planos ---------- */
  function montarPlanos() {
    const beneficios = (C.beneficios || []).map((b) => `<li>${escapar(b)}</li>`).join("");
    const preco = (n) => {
      const [inteiro, centavos] = brl(n).split(",");
      return `<strong>${inteiro}</strong><span class="plano-centavos">,${centavos}</span>`;
    };
    $("#planos-grade").innerHTML = C.planos
      .map(
        (p) => `
          <article class="plano plano-${p.cor || "roxo"}">
            ${p.selo ? `<span class="plano-selo">${escapar(p.selo)}</span>` : ""}
            <h3 class="plano-nome">${escapar(p.nome)}</h3>
            ${p.de ? `<p class="plano-de"><span class="sr">De </span><s>${brl(p.de)}</s></p>` : '<p class="plano-de" aria-hidden="true">&nbsp;</p>'}
            <p class="plano-preco">${preco(p.preco)}</p>
            <p class="plano-periodo">${escapar(p.periodo)}</p>
            <ul class="plano-lista">${beneficios}</ul>
            <button class="btn btn-bloco" type="button" data-plano="${p.id}">Assinar agora<span class="sr"> o plano ${escapar(p.nome.toLowerCase())}</span></button>
          </article>`
      )
      .join("");
  }

  /* ---------- Fluxo do modal ---------- */
  const dialogo = $("#fluxo");
  const corpo = $("#fluxo-corpo");
  const estado = { pedido: null, dispositivo: null, modelo: null, nome: "", etapa: 0 };

  function etapas() {
    const lista = ["dispositivo"];
    if (estado.dispositivo && estado.dispositivo.modelos && estado.dispositivo.modelos.length) lista.push("modelo");
    else if (!estado.dispositivo) lista.push("modelo");
    lista.push("guia", "enviar");
    return lista;
  }

  function descricaoPedido() {
    if (!estado.pedido) return "";
    if (estado.pedido.tipo === "teste") return `Teste grátis de ${C.teste.horas} horas`;
    const p = estado.pedido.plano;
    return `Plano ${p.nome.toLowerCase()}, ${brl(p.preco)}`;
  }

  function guiaAtual() {
    const d = estado.dispositivo && estado.dispositivo.id;
    const m = estado.modelo && estado.modelo.id;
    return C.guias[`${d}:${m}`] || C.guias[d] || C.guias.padrao;
  }

  function abrir(pedido) {
    estado.pedido = pedido;
    estado.dispositivo = null;
    estado.modelo = null;
    estado.etapa = 0;
    $("#fluxo-pedido").textContent = descricaoPedido();
    render();
    dialogo.showModal();
  }

  function irPara(indice) {
    estado.etapa = indice;
    render();
    corpo.scrollTop = 0;
  }

  function avancar() { irPara(estado.etapa + 1); }

  function render() {
    const lista = etapas();
    const nome = lista[estado.etapa];
    const fracao = (estado.etapa + 1) / lista.length;
    $("#progresso-resto").style.width = `${(1 - fracao) * 100}%`;
    $("#fluxo-voltar").hidden = estado.etapa === 0;

    const renderizadores = { dispositivo: etapaDispositivo, modelo: etapaModelo, guia: etapaGuia, enviar: etapaEnviar };
    corpo.innerHTML = `<div class="etapa">${renderizadores[nome]()}</div>`;
    ligarEtapa(nome);

    const titulo = $("h2", corpo);
    if (titulo) {
      titulo.id = "fluxo-titulo";
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    }
  }

  function etapaDispositivo() {
    const botoes = C.dispositivos
      .map(
        (d) => `<button type="button" class="opcao" data-dispositivo="${d.id}" aria-pressed="${estado.dispositivo && estado.dispositivo.id === d.id}">
          ${ICONES[d.icone] || ICONES.tv}<span>${escapar(d.nome)}</span></button>`
      )
      .join("");
    return `
      <h2>Onde você vai assistir?</h2>
      <p class="etapa-sub">Assim mostramos o aplicativo certo para o seu aparelho.</p>
      <div class="opcoes opcoes-aparelhos">${botoes}</div>`;
  }

  function etapaModelo() {
    const d = estado.dispositivo;
    const botoes = d.modelos
      .map(
        (m) => `<button type="button" class="opcao" data-modelo="${m.id}" aria-pressed="${estado.modelo && estado.modelo.id === m.id}">${escapar(m.nome)}</button>`
      )
      .join("");
    return `
      <h2>${escapar(d.pergunta || "Qual é o modelo?")}</h2>
      <p class="etapa-sub">Se não souber, escolha a opção mais próxima. A gente confere no WhatsApp.</p>
      <div class="opcoes opcoes-modelos">${botoes}</div>`;
  }

  function etapaGuia() {
    const g = guiaAtual();
    const apps = g.apps
      .map((a, i) => `<li><strong>${escapar(a)}</strong><small>${i === 0 ? "Recomendado" : "Outra opção"}</small></li>`)
      .join("");
    const passos = g.passos.map((p) => `<li>${escapar(p)}</li>`).join("");
    const aparelho = [estado.dispositivo.nome, estado.modelo && estado.modelo.nome].filter(Boolean).join(" ");
    return `
      <h2>Instale o aplicativo</h2>
      <p class="etapa-sub">Para ${escapar(aparelho)}.</p>
      <ul class="apps">${apps}</ul>
      <h3 class="tutorial-titulo">Como instalar</h3>
      <ol class="tutorial">${passos}</ol>
      <div class="acoes-etapa">
        <button type="button" class="btn btn-sinal btn-bloco" data-avancar>Continuar para a ativação</button>
        <p class="nota">Não conseguiu instalar? Continue mesmo assim. A gente ajuda pelo WhatsApp.</p>
      </div>`;
  }

  function mensagem() {
    const g = guiaAtual();
    const linhas = ["Olá! Vim pelo site da TV Sem Limites."];
    if (estado.nome.trim()) linhas.push(`*Nome:* ${estado.nome.trim()}`);
    if (estado.pedido.tipo === "teste") {
      linhas.push(`*Pedido:* Teste grátis de ${C.teste.horas} horas`);
    } else {
      const p = estado.pedido.plano;
      linhas.push(`*Plano:* ${p.nome} (${brl(p.preco)})`);
    }
    linhas.push(`*Onde vou assistir:* ${estado.dispositivo.nome}`);
    if (estado.modelo) linhas.push(`*Marca/modelo:* ${estado.modelo.nome}`);
    linhas.push(`*Aplicativo:* ${g.apps[0]}`);
    linhas.push("");
    linhas.push(
      estado.pedido.tipo === "teste"
        ? "Já vi o tutorial e quero liberar meu teste."
        : "Já vi o tutorial e quero ativar meu acesso."
    );
    return linhas.join("\n");
  }

  function linkWhatsapp() {
    return `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(mensagem())}`;
  }

  function etapaEnviar() {
    const g = guiaAtual();
    const pedido = estado.pedido.tipo === "teste" ? `Teste grátis de ${C.teste.horas}h` : `${estado.pedido.plano.nome}, ${brl(estado.pedido.plano.preco)}`;
    return `
      <h2>Envie pelo WhatsApp</h2>
      <p class="etapa-sub">Sua mensagem já está pronta. É só enviar e a gente responde com a ativação.</p>
      <dl class="resumo">
        <dt>Pedido</dt><dd>${escapar(pedido)}</dd>
        <dt>Aparelho</dt><dd>${escapar(estado.dispositivo.nome)}</dd>
        ${estado.modelo ? `<dt>Modelo</dt><dd>${escapar(estado.modelo.nome)}</dd>` : ""}
        <dt>Aplicativo</dt><dd>${escapar(g.apps[0])}</dd>
      </dl>
      <label class="campo">Seu nome
        <input type="text" id="campo-nome" autocomplete="given-name" placeholder="Como podemos te chamar?" value="${escapar(estado.nome)}">
      </label>
      <p class="previa-rotulo">Prévia da mensagem</p>
      <div class="previa" id="previa"></div>
      <div class="acoes-etapa">
        <a class="btn btn-zap" id="btn-zap" href="#" target="_blank" rel="noopener">Abrir WhatsApp</a>
      </div>`;
  }

  function atualizarEnvio() {
    $("#previa").textContent = mensagem();
    $("#btn-zap").href = linkWhatsapp();
  }

  function ligarEtapa(nome) {
    if (nome === "enviar") {
      atualizarEnvio();
      $("#campo-nome").addEventListener("input", (e) => {
        estado.nome = e.target.value;
        atualizarEnvio();
      });
    }
  }

  corpo.addEventListener("click", (e) => {
    const alvo = e.target.closest("button");
    if (!alvo) return;

    if (alvo.dataset.dispositivo) {
      const novo = C.dispositivos.find((d) => d.id === alvo.dataset.dispositivo);
      if (!estado.dispositivo || estado.dispositivo.id !== novo.id) estado.modelo = null;
      estado.dispositivo = novo;
      avancar();
    } else if (alvo.dataset.modelo) {
      estado.modelo = estado.dispositivo.modelos.find((m) => m.id === alvo.dataset.modelo);
      avancar();
    } else if ("avancar" in alvo.dataset) {
      avancar();
    }
  });

  $("#fluxo-voltar").addEventListener("click", () => {
    if (estado.etapa > 0) irPara(estado.etapa - 1);
  });
  $("#fluxo-fechar").addEventListener("click", () => dialogo.close());
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo) dialogo.close();
  });

  document.addEventListener("click", (e) => {
    const plano = e.target.closest("[data-plano]");
    if (plano) {
      abrir({ tipo: "plano", plano: C.planos.find((p) => p.id === plano.dataset.plano) });
      return;
    }
    if (e.target.closest("[data-teste]")) abrir({ tipo: "teste" });
  });

  /* ---------- Início ---------- */
  document.querySelectorAll("[data-horas]").forEach((el) => (el.textContent = C.teste.horas));
  $("#link-instagram").href = C.instagram;
  montarParede();
  montarPlanos();
})();
