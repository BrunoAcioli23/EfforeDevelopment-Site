/* Painel > Serviços: duração e preço por porte, e os cuidados extras. */
(function () {
  "use strict";
  var P = window.Painel, h = P.h;
  var raiz, catalogo = { servicos: [], extras: [] };
  var PORTES = ["pequeno", "medio", "grande", "gato"];

  function cartaoServico(s) {
    return h("article", { class: "cartao servico-c" },
      h("div", { class: "servico-c__topo" },
        h("div", null, h("h3", { text: s.nome }), s.descricao ? h("p", { text: s.descricao }) : null),
        h("div", { style: "display:flex;gap:.4rem;align-items:center" },
          s.ativo ? null : h("span", { class: "selo selo--cancelado", text: "Fora do site" }),
          h("button", { class: "bt bt--linha bt--pequeno", type: "button", text: "Editar", on: { click: function () { editarServico(s); } } }))),
      h("div", { class: "portes-mini" }, PORTES.map(function (k) {
        var p = s.portes[k];
        return h("div", null, h("strong", { text: P.PORTES[k] }),
          p ? [P.duracao(p.minutos), h("br"), p.preco != null ? P.moeda(p.preco) : "sem preço"] : h("span", { class: "nao", text: "não faz" }));
      })));
  }

  function editarServico(s) {
    var novo = !s;
    s = s || { nome: "", descricao: "", ativo: true, ordem: catalogo.servicos.length + 1, portes: { pequeno: { minutos: 60, preco: null } } };
    var nome = h("input", { type: "text", maxLength: 80, value: s.nome });
    var desc = h("textarea", { rows: 2, maxLength: 300, value: s.descricao || "" });
    var ativo = P.chave("s-ativo", "Aparece no site para agendar", s.ativo !== false);
    var linhas = PORTES.map(function (k) {
      var p = s.portes[k];
      var oferece = P.chave("s-" + k, P.PORTES[k], !!p);
      var min = h("input", { type: "number", min: 10, max: 600, step: 5, value: p ? p.minutos : 60, "aria-label": "Duração em minutos, " + P.PORTES[k] });
      var preco = h("input", { type: "text", inputMode: "decimal", value: p ? P.formatarNumeroBR(p.preco) : "", placeholder: "0,00", "aria-label": "Preço, " + P.PORTES[k] });
      var linha = h("div", { class: "porte-edit" + (p ? "" : " porte-edit--off") }, oferece, P.campo("Minutos", min), P.campo("Preço (R$)", preco));
      oferece.querySelector("input").addEventListener("change", function () { linha.classList.toggle("porte-edit--off", !this.checked); });
      return { k: k, oferece: oferece.querySelector("input"), min: min, preco: preco, el: linha };
    });
    var erro = h("p", { class: "erro-form", role: "alert", hidden: true });

    var j = P.janela({
      titulo: novo ? "Novo serviço" : s.nome,
      corpo: [
        P.campo("Nome", nome),
        P.campo("Descrição (aparece no site)", desc),
        ativo,
        h("div", { class: "secao-janela" },
          h("h3", { text: "Por porte" }),
          h("p", { class: "dica", text: "Desligue os portes que você não atende neste serviço. A duração define quantos horários cabem no dia." }),
          h("div", { class: "portes-edit" }, linhas.map(function (l) { return l.el; }))),
        erro,
      ],
      rodape: [
        h("button", { class: "bt bt--linha", type: "button", text: "Cancelar", on: { click: function () { j.fechar(); } } }),
        h("button", { class: "bt", type: "button", text: novo ? "Criar serviço" : "Salvar serviço", on: { click: function () {
          var portes = {}, problema = null;
          linhas.forEach(function (l) {
            if (!l.oferece.checked) return;
            var m = parseInt(l.min.value, 10);
            if (!(m >= 10 && m <= 600)) problema = "A duração precisa ficar entre 10 e 600 minutos.";
            portes[l.k] = { minutos: m, preco: P.numeroBR(l.preco.value) };
          });
          if (!nome.value.trim()) problema = "Escreva o nome do serviço.";
          if (!Object.keys(portes).length) problema = "Ligue pelo menos um porte.";
          if (problema) { erro.textContent = problema; erro.hidden = false; return; }
          P.api.salvarServico({ id: s.id, nome: nome.value.trim(), descricao: desc.value.trim(), ordem: s.ordem,
                                ativo: ativo.querySelector("input").checked, portes: portes })
            .then(function () { j.fechar(); P.aviso("Serviço salvo"); carregar(); })
            .catch(P.falhou);
        } } }),
      ],
    });
  }

  function editarExtra(e) {
    var novo = !e;
    e = e || { nome: "", minutos: 10, preco: null, ativo: true, ordem: catalogo.extras.length + 1 };
    var nome = h("input", { type: "text", maxLength: 60, value: e.nome });
    var min = h("input", { type: "number", min: 0, max: 240, step: 5, value: e.minutos });
    var preco = h("input", { type: "text", inputMode: "decimal", value: P.formatarNumeroBR(e.preco), placeholder: "0,00" });
    var ativo = P.chave("e-ativo", "Aparece no site", e.ativo !== false);
    var j = P.janela({
      titulo: novo ? "Novo cuidado extra" : e.nome,
      corpo: [P.campo("Nome", nome), h("div", { class: "grade-campos grade-campos--2" }, P.campo("Minutos a mais", min), P.campo("Preço (R$)", preco)), ativo],
      rodape: [
        h("button", { class: "bt bt--linha", type: "button", text: "Cancelar", on: { click: function () { j.fechar(); } } }),
        h("button", { class: "bt", type: "button", text: "Salvar", on: { click: function () {
          if (!nome.value.trim()) { P.aviso("Escreva o nome do extra.", "erro"); return; }
          P.api.salvarExtra({ id: e.id, nome: nome.value.trim(), minutos: parseInt(min.value, 10) || 0, preco: P.numeroBR(preco.value),
                              ordem: e.ordem, ativo: ativo.querySelector("input").checked })
            .then(function () { j.fechar(); P.aviso("Extra salvo"); carregar(); })
            .catch(P.falhou);
        } } }),
      ],
    });
  }

  function desenhar() {
    P.limpar(raiz);
    raiz.appendChild(h("div", { class: "pilha" },
      h("p", { class: "dica", text: "O site usa estas durações para calcular os horários livres. Os preços servem para o valor previsto de cada agendamento e para o resumo." }),
      h("div", { class: "servicos-lista" }, catalogo.servicos.map(cartaoServico)),
      h("section", { class: "cartao" },
        h("div", { class: "cartao__topo" },
          h("h2", { text: "Cuidados extras" }),
          h("button", { class: "bt bt--linha bt--pequeno", type: "button", on: { click: function () { editarExtra(null); } } }, P.icone("i-mais"), "Novo extra")),
        h("div", { class: "tabela-wrap" }, h("table", { class: "tabela" },
          h("thead", null, h("tr", null, h("th", { text: "Extra" }), h("th", { class: "num", text: "Tempo" }), h("th", { class: "num", text: "Preço" }), h("th", { text: "" }))),
          h("tbody", null, catalogo.extras.map(function (e) {
            return h("tr", { class: "clicavel", on: { click: function () { editarExtra(e); } } },
              h("td", null, e.nome, e.ativo ? null : h("span", { class: "sub", text: "fora do site" })),
              h("td", { class: "num", text: "+" + e.minutos + " min" }),
              h("td", { class: "num", text: P.moeda(e.preco) }),
              h("td", { class: "num" }, h("span", { class: "dica", text: "Editar" })));
          })))))));
  }

  function carregar() {
    return P.api.servicosTodos().then(function (c) { catalogo = c; desenhar(); }).catch(P.falhou);
  }

  P.secoes.servicos = {
    titulo: "Serviços",
    acoes: function () {
      return h("button", { class: "bt", type: "button", on: { click: function () { editarServico(null); } } }, P.icone("i-mais"), h("span", { text: "Novo serviço" }));
    },
    montar: function (el) { raiz = el; el.appendChild(h("p", { class: "carregando", text: "Carregando…" })); carregar(); },
    mostrar: function () { if (raiz) carregar(); },
  };
})();
