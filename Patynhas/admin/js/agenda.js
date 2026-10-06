/* Painel > Agenda: o dia, a semana e as ações de cada atendimento. */
(function () {
  "use strict";
  var P = window.Painel, h = P.h;

  var raiz, dia = P.hoje(), semanaCache = {}, horarios = [];

  function inicioSemana(d) { return P.somarDias(d, -d.getDay()); } // semana de domingo a sábado
  function chaveSemana(d) { return P.iso(inicioSemana(d)); }
  function abertoNoDia(d) { return horarios.some(function (f) { return f.dia_semana === d.getDay(); }); }
  function ativos(lista) { return lista.filter(function (a) { return a.status !== "cancelado"; }); }

  function carregarSemana(d, forcar) {
    var chave = chaveSemana(d);
    if (!forcar && semanaCache[chave]) return Promise.resolve(semanaCache[chave]);
    var ini = inicioSemana(d);
    return P.api.agendamentos({ de: P.iso(ini), ate: P.iso(P.somarDias(ini, 6)) }).then(function (l) {
      semanaCache[chave] = l;
      return l;
    });
  }

  function doDia(lista, d) { return lista.filter(function (a) { return P.mesmoDia(a.inicio, d); }); }

  /* ---------- cabeçalho: dia, setas e faixa da semana ---------- */

  function cabecalho(lista) {
    var seletor = h("input", { type: "date", value: P.iso(dia), "aria-label": "Escolher data",
      on: { change: function () { if (this.value) irPara(P.deIso(this.value)); } } });
    var titulo = h("button", { class: "navdia__titulo bt--leve", type: "button", style: "border:0;background:none;cursor:pointer",
      "aria-label": "Escolher outra data",
      on: { click: function () { if (seletor.showPicker) seletor.showPicker(); else seletor.click(); } } },
      h("strong", { text: P.capitalizar(P.dataLonga(dia)) }),
      h("span", { text: P.mesmoDia(dia, new Date()) ? "hoje" : relativo(dia) }));

    var ini = inicioSemana(dia);
    var faixa = h("div", { class: "semana", role: "group", "aria-label": "Dias da semana" });
    for (var i = 0; i < 7; i++) {
      (function (d) {
        var n = ativos(doDia(lista, d)).length;
        faixa.appendChild(h("button", {
          type: "button",
          class: (P.mesmoDia(d, new Date()) ? "is-hoje " : "") + (abertoNoDia(d) ? "" : "is-fechado"),
          "aria-pressed": P.mesmoDia(d, dia) ? "true" : "false",
          "aria-label": P.dataLonga(d) + ", " + (n ? n + " agendamento" + (n > 1 ? "s" : "") : "sem agendamentos"),
          on: { click: function () { irPara(d); } },
        },
          h("span", { class: "semana__dia", text: P.DIAS_CURTO[d.getDay()] }),
          h("span", { class: "semana__num", text: d.getDate() }),
          h("span", { class: "semana__qtd", text: n ? n : "" })));
      })(P.somarDias(ini, i));
    }

    return h("div", { class: "agenda-topo" },
      h("div", { class: "navdia" },
        h("button", { class: "bt-icone", type: "button", "aria-label": "Dia anterior", on: { click: function () { irPara(P.somarDias(dia, -1)); } } }, P.icone("i-esq")),
        titulo, seletor,
        h("button", { class: "bt-icone", type: "button", "aria-label": "Próximo dia", on: { click: function () { irPara(P.somarDias(dia, 1)); } } }, P.icone("i-dir")),
        P.mesmoDia(dia, new Date()) ? null : h("button", { class: "bt bt--linha bt--pequeno", type: "button", text: "Hoje", on: { click: function () { irPara(P.hoje()); } } })),
      faixa);
  }

  function relativo(d) {
    var dif = Math.round((d - P.hoje()) / 86400000);
    if (dif === 1) return "amanhã";
    if (dif === -1) return "ontem";
    return dif > 0 ? "daqui a " + dif + " dias" : "há " + -dif + " dias";
  }

  /* ---------- um atendimento ---------- */

  function cartao(a) {
    var pet = a.pet || {}, cli = a.cliente || {};
    var detalhes = [P.PORTES[a.porte] || "", pet.raca || ""].filter(Boolean).join(", ");
    var extras = (a.extras || []).map(function (e) { return e.nome.toLowerCase(); });
    var lembrete = "Olá, " + (cli.nome || "").split(" ")[0] + "! Passando para lembrar do horário " +
      (pet.nome ? "do(a) " + pet.nome + " " : "") + P.dataLonga(a.inicio) + " às " + P.hora(a.inicio) + " na Patynhas Pet Mel. Até lá!";

    var valor = h("input", { type: "text", inputmode: "decimal", value: P.formatarNumeroBR(a.valor), "aria-label": "Valor cobrado de " + (pet.nome || "atendimento"),
      on: { change: function () {
        var v = P.numeroBR(this.value);
        var campo = this;
        P.api.atualizarAgendamento(a.id, { valor: v }).then(function () {
          a.valor = v; campo.value = P.formatarNumeroBR(v); P.aviso("Valor salvo"); atualizarResumoDia();
        }).catch(P.falhou);
      } } });

    function mudar(status, pergunta) {
      var seguir = pergunta ? P.confirmar(pergunta, "Sim, " + P.STATUS[status].nome.toLowerCase()) : Promise.resolve(true);
      seguir.then(function (ok) {
        if (!ok) return;
        P.api.atualizarAgendamento(a.id, { status: status }).then(function () {
          a.status = status;
          P.aviso(P.STATUS[status].nome + ": " + (pet.nome || "atendimento"));
          desenhar();
        }).catch(P.falhou);
      });
    }

    var acoes = h("div", { class: "ag__acoes" });
    if (a.status === "confirmado") {
      acoes.appendChild(h("button", { class: "bt bt--pequeno", type: "button", on: { click: function () { mudar("concluido"); } } }, P.icone("i-check"), "Concluir"));
      acoes.appendChild(h("button", { class: "bt bt--linha bt--pequeno", type: "button", text: "Faltou", on: { click: function () { mudar("faltou", "Marcar que " + (pet.nome || "o pet") + " faltou?"); } } }));
      acoes.appendChild(h("button", { class: "bt bt--perigo bt--pequeno", type: "button", text: "Cancelar", on: { click: function () { mudar("cancelado", "Cancelar o horário de " + (pet.nome || "este pet") + "? O horário fica livre de novo no site."); } } }));
    } else {
      acoes.appendChild(h("button", { class: "bt bt--leve bt--pequeno", type: "button", text: "Voltar para confirmado", on: { click: function () { mudar("confirmado"); } } }));
    }
    acoes.appendChild(h("button", { class: "bt bt--leve bt--pequeno", type: "button", text: "Observação", on: { click: function () { editarObs(a); } } }));
    acoes.appendChild(h("label", { class: "ag__valor" }, "R$", valor));

    var ini = new Date(a.inicio), fim = new Date(a.fim);
    return h("article", { class: "ag ag--" + a.status, dataset: { id: a.id } },
      h("div", { class: "ag__hora num" }, P.hora(ini), h("small", { text: "até " + P.hora(fim) })),
      h("div", { class: "ag__corpo" },
        h("div", { class: "ag__linha1" },
          h("span", { class: "ag__pet", text: pet.nome || "Pet" }),
          P.selo(a.status),
          a.origem === "site" ? h("span", { class: "selo selo--neutro", text: "pelo site" }) : null),
        h("div", { class: "ag__detalhe", text: a.servico_nome + (extras.length ? " + " + extras.join(", ") : "") + (detalhes ? " (" + detalhes + ")" : "") }),
        h("div", { class: "ag__cliente" },
          h("span", { text: cli.nome || "" }),
          cli.telefone ? h("a", { href: P.linkWhats(cli.telefone, lembrete), target: "_blank", rel: "noopener", "aria-label": "Mandar lembrete no WhatsApp para " + cli.nome },
            P.icone("i-whats"), P.telefone(cli.telefone)) : null),
        a.observacoes ? h("p", { class: "ag__obs", text: a.observacoes }) : null,
        pet.observacoes ? h("p", { class: "ag__obs", text: "Sobre o pet: " + pet.observacoes }) : null),
      acoes);
  }

  function editarObs(a) {
    var campo = h("textarea", { rows: 4, maxLength: 1000, value: a.observacoes || "" });
    var j = P.janela({
      titulo: "Observação do atendimento",
      corpo: P.campo("Anotação (aparece no cartão do dia)", campo),
      rodape: [
        h("button", { class: "bt bt--linha", type: "button", text: "Cancelar", on: { click: function () { j.fechar(); } } }),
        h("button", { class: "bt", type: "button", text: "Salvar observação", on: { click: function () {
          var v = campo.value.trim() || null;
          P.api.atualizarAgendamento(a.id, { observacoes: v }).then(function () {
            a.observacoes = v; j.fechar(); P.aviso("Observação salva"); desenhar();
          }).catch(P.falhou);
        } } }),
      ],
    });
  }

  /* ---------- montagem ---------- */

  var lista = [], resumoEl;

  function atualizarResumoDia() {
    if (!resumoEl) return;
    var doDiaLista = doDia(lista, dia);
    var vale = ativos(doDiaLista);
    var previsto = vale.reduce(function (s, a) { return s + (+a.valor || 0); }, 0);
    var concluidos = doDiaLista.filter(function (a) { return a.status === "concluido"; }).length;
    P.limpar(resumoEl);
    resumoEl.appendChild(h("span", null, h("strong", { text: vale.length }), vale.length === 1 ? " atendimento" : " atendimentos"));
    if (concluidos) resumoEl.appendChild(h("span", null, h("strong", { text: concluidos }), concluidos === 1 ? " concluído" : " concluídos"));
    resumoEl.appendChild(h("span", null, "Valor do dia ", h("strong", { text: P.moeda(previsto) })));
  }

  function proximosDias() {
    var caixa = h("div", { class: "proximos" });
    var ini = P.hoje();
    var fim = P.somarDias(ini, 13);
    P.api.agendamentos({ de: P.iso(ini), ate: P.iso(fim) }).then(function (l) {
      for (var i = 0; i < 14; i++) {
        (function (d) {
          var n = ativos(doDia(l, d)).length;
          if (!n && !abertoNoDia(d)) return;
          caixa.appendChild(h("button", { type: "button", on: { click: function () { irPara(d); } } },
            h("span", { text: P.capitalizar(P.DIAS_CURTO[d.getDay()]) + " " + P.dataCurta(d) }),
            h("strong", { text: n ? n + (n > 1 ? " pets" : " pet") : "livre" })));
        })(P.somarDias(ini, i));
      }
    }).catch(P.falhou);
    return h("aside", { class: "cartao" }, h("div", { class: "cartao__topo" }, h("h2", { text: "Próximos dias" })), caixa);
  }

  function desenhar() {
    P.limpar(raiz);
    raiz.appendChild(h("p", { class: "carregando", text: "Carregando a agenda…" }));
    carregarSemana(dia).then(function (l) {
      lista = l;
      P.limpar(raiz);
      raiz.appendChild(cabecalho(l));
      resumoEl = h("div", { class: "resumo-dia" });
      atualizarResumoDia();

      var doDiaLista = doDia(l, dia);
      var corpo;
      if (!doDiaLista.length) {
        corpo = h("div", { class: "cartao vazio" },
          P.icone("i-pata"),
          h("p", { text: abertoNoDia(dia) ? "Nenhum agendamento neste dia." : "Dia fechado. Nenhum horário é oferecido no site." }),
          h("button", { class: "bt", type: "button", on: { click: function () { P.novoAgendamento({ data: dia, aoSalvar: aoSalvarNovo }); } } }, P.icone("i-mais"), "Novo agendamento"));
      } else {
        corpo = h("div", { class: "lista-ag" }, doDiaLista.map(cartao));
      }
      raiz.appendChild(resumoEl);
      raiz.appendChild(h("div", { class: "agenda-grade" }, corpo, window.innerWidth >= 1180 ? proximosDias() : null));
    }).catch(P.falhou);
  }

  function irPara(d) { dia = new Date(d); dia.setHours(0, 0, 0, 0); desenhar(); }

  function aoSalvarNovo(res) {
    semanaCache = {};
    irPara(new Date(res.inicio));
  }

  P.secoes.agenda = {
    titulo: "Agenda",
    acoes: function () {
      return h("button", { class: "bt", type: "button", on: { click: function () { P.novoAgendamento({ data: dia, aoSalvar: aoSalvarNovo }); } } },
        P.icone("i-mais"), h("span", { text: "Novo agendamento" }));
    },
    montar: function (el) {
      raiz = el;
      P.api.horariosSemana().then(function (hs) { horarios = hs; desenhar(); }).catch(P.falhou);
    },
    mostrar: function () { semanaCache = {}; if (raiz) desenhar(); },
    novoAgendamento: function (a) {
      semanaCache = {};
      if (raiz && !raiz.hidden && P.mesmoDia(a.inicio, dia)) {
        desenhar();
        setTimeout(function () {
          var c = raiz.querySelector('[data-id="' + a.id + '"]');
          if (c) c.classList.add("is-novo");
        }, 400);
      }
    },
    invalidar: function () { semanaCache = {}; },
    recarregarHorarios: function () { return P.api.horariosSemana().then(function (hs) { horarios = hs; }); },
  };
})();
