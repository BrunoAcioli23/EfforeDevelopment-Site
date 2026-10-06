/* Painel > Resumo por período: números principais e gráficos simples. */
(function () {
  "use strict";
  var P = window.Painel, h = P.h;
  var raiz, periodo = "30", deCustom, ateCustom, dados = null;
  var NS = "http://www.w3.org/2000/svg";

  var PERIODOS = [
    ["mes", "Este mês"], ["mes-passado", "Mês passado"], ["7", "Últimos 7 dias"],
    ["30", "Últimos 30 dias"], ["ano", "Este ano"], ["outro", "Escolher datas"],
  ];

  function intervalo() {
    var hoje = P.hoje();
    switch (periodo) {
      case "mes": return [new Date(hoje.getFullYear(), hoje.getMonth(), 1), new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)];
      case "mes-passado": return [new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1), new Date(hoje.getFullYear(), hoje.getMonth(), 0)];
      case "7": return [P.somarDias(hoje, -6), hoje];
      case "30": return [P.somarDias(hoje, -29), hoje];
      case "ano": return [new Date(hoje.getFullYear(), 0, 1), new Date(hoje.getFullYear(), 11, 31)];
      default: return [deCustom || P.somarDias(hoje, -29), ateCustom || hoje];
    }
  }

  /* ---------- contas ---------- */

  function calcular(ags, clientes, de, ate) {
    var concl = ags.filter(function (a) { return a.status === "concluido"; });
    var fat = concl.reduce(function (s, a) { return s + (+a.valor || 0); }, 0);
    var agora = new Date();
    var futuros = ags.filter(function (a) { return a.status === "confirmado" && new Date(a.inicio) >= agora; });
    var perdidos = ags.filter(function (a) { return a.status === "faltou" || a.status === "cancelado"; });
    var fimDia = P.somarDias(ate, 1);
    var novos = clientes.filter(function (c) {
      var primeiro = (c.agendamentos || []).filter(function (a) { return a.status !== "cancelado"; })
        .map(function (a) { return a.inicio; }).sort()[0];
      return primeiro && new Date(primeiro) >= de && new Date(primeiro) < fimDia;
    });

    // por dia, semana ou mês, conforme o tamanho do período
    var dias = Math.round((ate - de) / 86400000) + 1;
    var passo = dias > 120 ? "mes" : dias > 45 ? "semana" : "dia";
    var grupos = [], idx = {};
    function chave(d) {
      d = new Date(d);
      if (passo === "mes") return d.getFullYear() + "-" + d.getMonth();
      if (passo === "semana") return P.iso(P.somarDias(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7)));
      return P.iso(d);
    }
    var comeco = passo === "semana" ? P.somarDias(de, -((de.getDay() + 6) % 7)) : new Date(de);
    for (var d = comeco; d <= ate; d = P.somarDias(d, passo === "mes" ? 0 : passo === "semana" ? 7 : 1)) {
      if (passo === "mes") { d = new Date(d.getFullYear(), d.getMonth(), 1); }
      var k = chave(d);
      if (!(k in idx)) {
        idx[k] = grupos.length;
        var rot = passo === "mes" ? P.MESES[d.getMonth()].slice(0, 3)
          : passo === "semana" ? P.dataCurta(P.somarDias(d, -((d.getDay() + 6) % 7)))
          : P.dataCurta(d);
        var dica = passo === "mes" ? P.capitalizar(P.MESES[d.getMonth()]) + " de " + d.getFullYear()
          : passo === "semana" ? "Semana de " + P.dataCurta(P.somarDias(d, -((d.getDay() + 6) % 7)))
          : P.capitalizar(P.DIAS[d.getDay()]) + ", " + P.dataCurta(d);
        grupos.push({ rotulo: rot, dica: dica, valor: 0, qtd: 0 });
      }
      if (passo === "mes") d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    concl.forEach(function (a) {
      var i = idx[chave(a.inicio)];
      if (i != null) { grupos[i].valor += +a.valor || 0; grupos[i].qtd++; }
    });

    function contar(lista, campo) {
      var m = {};
      lista.forEach(function (a) {
        var k = campo(a);
        if (!m[k]) m[k] = { rotulo: k, qtd: 0, valor: 0 };
        m[k].qtd++; m[k].valor += +a.valor || 0;
      });
      return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.qtd - a.qtd || b.valor - a.valor; });
    }

    var semana = [1, 2, 3, 4, 5, 6, 0].map(function (n) {
      var l = concl.filter(function (a) { return new Date(a.inicio).getDay() === n; });
      return { rotulo: P.capitalizar(P.DIAS[n]), qtd: l.length, valor: l.reduce(function (s, a) { return s + (+a.valor || 0); }, 0) };
    });

    var porCliente = {};
    concl.forEach(function (a) {
      var c = a.cliente || {};
      if (!porCliente[c.id]) porCliente[c.id] = { nome: c.nome || "—", qtd: 0, valor: 0, pets: {} };
      porCliente[c.id].qtd++; porCliente[c.id].valor += +a.valor || 0;
      if (a.pet) porCliente[c.id].pets[a.pet.nome] = true;
    });
    var top = Object.keys(porCliente).map(function (k) { return porCliente[k]; })
      .sort(function (a, b) { return b.valor - a.valor || b.qtd - a.qtd; }).slice(0, 5);

    return {
      faturamento: fat, concluidos: concl.length, ticket: concl.length ? fat / concl.length : null,
      futuros: futuros.length, previsto: futuros.reduce(function (s, a) { return s + (+a.valor || 0); }, 0),
      perdidos: perdidos.length, faltas: perdidos.filter(function (a) { return a.status === "faltou"; }).length,
      taxaPerda: ags.length ? perdidos.length / ags.length : 0, novos: novos.length,
      passo: passo, grupos: grupos,
      porServico: contar(concl, function (a) { return a.servico_nome; }),
      porPorte: contar(concl, function (a) { return P.PORTES[a.porte] || "—"; }),
      semana: semana, top: top,
    };
  }

  /* ---------- números ---------- */

  function numero(rotulo, valor, nota, destaque) {
    return h("div", { class: "numero" + (destaque ? " numero--destaque" : "") },
      h("p", { class: "numero__rotulo", text: rotulo }),
      h("p", { class: "numero__valor", text: valor }),
      nota ? h("p", { class: "numero__nota", text: nota }) : null);
  }

  /* ---------- dica flutuante dos gráficos ---------- */

  var dica;
  function mostrarDica(ev, linhas) {
    if (!dica) { dica = h("div", { class: "dica-grafico", role: "tooltip" }); document.body.appendChild(dica); }
    P.limpar(dica);
    linhas.forEach(function (l, i) { dica.appendChild(i === 0 ? h("strong", { text: l }) : document.createTextNode(l)); if (i < linhas.length - 1) dica.appendChild(h("br")); });
    dica.hidden = false;
    var x = Math.min(window.innerWidth - 90, Math.max(90, ev.clientX));
    dica.style.left = x + "px";
    dica.style.top = ev.clientY + "px";
  }
  function esconderDica() { if (dica) dica.hidden = true; }

  function svgEl(tag, at) {
    var e = document.createElementNS(NS, tag);
    Object.keys(at || {}).forEach(function (k) { e.setAttribute(k, at[k]); });
    return e;
  }
  function passoBonito(max, partes) {
    var bruto = max / partes;
    var mag = Math.pow(10, Math.floor(Math.log10(bruto || 1)));
    var n = bruto / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }

  /* Colunas: uma série, barras finas com ponta arredondada, grade discreta */
  function colunas(caixa, grupos) {
    var W = Math.max(280, caixa.clientWidth || 600), H = 220;
    var m = { e: 52, d: 8, t: 22, b: 26 };
    var max = Math.max.apply(null, grupos.map(function (g) { return g.valor; }).concat([0]));
    var passo = passoBonito(max || 100, 4), topo = Math.max(passo * 4, passo * Math.ceil(max / passo));
    var y = function (v) { return m.t + (H - m.t - m.b) * (1 - v / topo); };
    var faixa = (W - m.e - m.d) / grupos.length;
    var larg = Math.max(3, Math.min(24, faixa - 4));
    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Faturamento por período. Os valores estão também na tabela." });

    for (var v = 0; v <= topo + 0.001; v += passo) {
      svg.appendChild(svgEl("line", { class: v === 0 ? "base" : "grade", x1: m.e, x2: W - m.d, y1: y(v), y2: y(v) }));
      var t = svgEl("text", { class: "eixo num", x: m.e - 8, y: y(v) + 4, "text-anchor": "end" });
      t.textContent = P.moedaCurta(v);
      svg.appendChild(t);
    }
    var cada = Math.ceil(grupos.length / Math.max(2, Math.floor((W - m.e) / 56)));
    var maiorI = grupos.reduce(function (mi, g, i) { return g.valor > grupos[mi].valor ? i : mi; }, 0);

    grupos.forEach(function (g, i) {
      var cx = m.e + faixa * i + faixa / 2, x = cx - larg / 2, base = y(0), alto = y(g.valor);
      var r = Math.min(4, (base - alto) / 1, larg / 2);
      var alvo = svgEl("rect", { class: "barra-alvo", x: m.e + faixa * i, y: m.t, width: faixa, height: H - m.t - m.b });
      var barra = g.valor > 0
        ? svgEl("path", { class: "barra", d: "M" + x + " " + base + "V" + (alto + r) + "Q" + x + " " + alto + " " + (x + r) + " " + alto +
            "H" + (x + larg - r) + "Q" + (x + larg) + " " + alto + " " + (x + larg) + " " + (alto + r) + "V" + base + "Z" })
        : svgEl("rect", { class: "barra", x: x, y: base - 1, width: larg, height: 0 });
      alvo.addEventListener("mousemove", function (ev) {
        barra.classList.add("is-ativa");
        mostrarDica(ev, [g.dica, P.moeda(g.valor), g.qtd + (g.qtd === 1 ? " atendimento" : " atendimentos")]);
      });
      alvo.addEventListener("mouseleave", function () { barra.classList.remove("is-ativa"); esconderDica(); });
      svg.appendChild(alvo);
      svg.appendChild(barra);
      if (i % cada === 0) {
        var tx = svgEl("text", { class: "eixo", x: cx, y: H - 8, "text-anchor": "middle" });
        tx.textContent = g.rotulo;
        svg.appendChild(tx);
      }
      if (i === maiorI && g.valor > 0) {
        var vl = svgEl("text", { class: "rotulo-valor num", x: cx, y: alto - 6, "text-anchor": "middle" });
        vl.textContent = P.moedaCurta(g.valor);
        svg.appendChild(vl);
      }
    });
    P.limpar(caixa).appendChild(svg);
  }

  /* Barras horizontais com o valor na ponta */
  function barras(caixa, itens, campo, formato, extra) {
    var W = Math.max(280, caixa.clientWidth || 500);
    var rot = Math.min(170, Math.max(96, W * 0.34)), valorL = 78, linha = 34;
    var H = itens.length * linha + 4;
    var max = Math.max.apply(null, itens.map(function (i) { return i[campo]; }).concat([1]));
    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Valores na tabela abaixo do gráfico." });
    svg.appendChild(svgEl("line", { class: "base", x1: rot, x2: rot, y1: 0, y2: H }));
    itens.forEach(function (it, i) {
      var cy = i * linha + linha / 2, larg = Math.max(0, (W - rot - valorL) * it[campo] / max), alt = 14, r = Math.min(4, larg / 2);
      var t = svgEl("text", { class: "rotulo", x: rot - 10, y: cy + 4, "text-anchor": "end" });
      t.textContent = it.rotulo.length > 24 ? it.rotulo.slice(0, 23) + "…" : it.rotulo;
      svg.appendChild(t);
      if (larg > 0) {
        var y0 = cy - alt / 2;
        svg.appendChild(svgEl("path", { class: "barra", d: "M" + rot + " " + y0 + "H" + (rot + larg - r) + "Q" + (rot + larg) + " " + y0 + " " + (rot + larg) + " " + (y0 + r) +
          "V" + (y0 + alt - r) + "Q" + (rot + larg) + " " + (y0 + alt) + " " + (rot + larg - r) + " " + (y0 + alt) + "H" + rot + "Z" }));
      }
      var v = svgEl("text", { class: "rotulo-valor num", x: rot + larg + 8, y: cy + 4 });
      v.textContent = formato(it[campo]);
      svg.appendChild(v);
      var alvo = svgEl("rect", { class: "barra-alvo", x: 0, y: cy - linha / 2, width: W, height: linha });
      alvo.addEventListener("mousemove", function (ev) { mostrarDica(ev, [it.rotulo].concat(extra(it))); });
      alvo.addEventListener("mouseleave", esconderDica);
      svg.appendChild(alvo);
    });
    P.limpar(caixa).appendChild(svg);
  }

  function tabela(cabecas, linhas) {
    return h("div", { class: "tabela-wrap" }, h("table", { class: "tabela" },
      h("thead", null, h("tr", null, cabecas.map(function (c, i) { return h("th", { class: i ? "num" : "", text: c }); }))),
      h("tbody", null, linhas.map(function (l) { return h("tr", null, l.map(function (c, i) { return h("td", { class: i ? "num" : "", text: c }); })); }))));
  }

  /* Cartão de gráfico com a opção de ver os números em tabela */
  function cartaoGrafico(titulo, sub, desenhar, cabecas, linhas, largo) {
    var area = h("div");
    var emTabela = false;
    var alternar = h("button", { class: "bt bt--leve bt--pequeno grafico__alternar", type: "button", text: "Ver em tabela" });
    var c = h("section", { class: "cartao grafico" + (largo ? " grafico--largo" : "") },
      h("div", { class: "cartao__topo", style: "margin-bottom:.1rem" }, h("h2", { text: titulo }), alternar),
      h("p", { class: "grafico__sub", text: sub }), area);
    function render() {
      if (emTabela) { P.limpar(area).appendChild(tabela(cabecas, linhas)); }
      else desenhar(area);
    }
    alternar.addEventListener("click", function () { emTabela = !emTabela; alternar.textContent = emTabela ? "Ver gráfico" : "Ver em tabela"; render(); });
    c._render = render;
    return c;
  }

  /* ---------- montagem ---------- */

  var graficos = [];

  function desenhar() {
    var area = P.$("[data-resumo-area]", raiz);
    P.limpar(area).appendChild(h("p", { class: "carregando", text: "Calculando…" }));
    var iv = intervalo();
    Promise.all([P.api.agendamentos({ de: P.iso(iv[0]), ate: P.iso(iv[1]) }), P.api.clientes()]).then(function (r) {
      dados = calcular(r[0], r[1], iv[0], iv[1]);
      var d = dados;
      P.limpar(area);
      P.$("[data-resumo-titulo]", raiz).textContent = P.dataCurta(iv[0]) + "/" + iv[0].getFullYear() + " a " + P.dataCurta(iv[1]) + "/" + iv[1].getFullYear();

      area.appendChild(h("div", { class: "numeros" },
        numero("Faturamento", P.moeda(d.faturamento), "atendimentos concluídos", true),
        numero("Atendimentos", P.inteiro(d.concluidos), "concluídos no período"),
        numero("Ticket médio", d.ticket == null ? "—" : P.moeda(d.ticket), "por atendimento"),
        numero("Ainda vão acontecer", P.inteiro(d.futuros), d.futuros ? P.moeda(d.previsto) + " previstos" : "nenhum agendado"),
        numero("Faltas e cancelamentos", P.inteiro(d.perdidos), Math.round(d.taxaPerda * 100) + "% dos agendamentos, " + d.faltas + (d.faltas === 1 ? " falta" : " faltas")),
        numero("Clientes novos", P.inteiro(d.novos), "primeira visita no período")));

      if (!d.concluidos) {
        area.appendChild(h("div", { class: "cartao vazio" }, P.icone("i-resumo"),
          h("p", { text: "Nenhum atendimento concluído nesse período. Marque os atendimentos como “Concluído” na agenda para eles entrarem no resumo." })));
        return;
      }

      var porQue = d.passo === "mes" ? "por mês" : d.passo === "semana" ? "por semana" : "por dia";
      graficos = [
        cartaoGrafico("Faturamento " + porQue, "Soma do valor dos atendimentos concluídos.",
          function (a) { colunas(a, d.grupos); },
          [d.passo === "dia" ? "Dia" : d.passo === "semana" ? "Semana" : "Mês", "Atendimentos", "Faturamento"],
          d.grupos.map(function (g) { return [g.dica, g.qtd, P.moeda(g.valor)]; }), true),
        cartaoGrafico("Serviços mais feitos", "Quantidade de atendimentos concluídos.",
          function (a) { barras(a, d.porServico, "qtd", P.inteiro, function (it) { return [it.qtd + " atendimentos", P.moeda(it.valor)]; }); },
          ["Serviço", "Atendimentos", "Faturamento"], d.porServico.map(function (s) { return [s.rotulo, s.qtd, P.moeda(s.valor)]; })),
        cartaoGrafico("Dias mais movimentados", "Atendimentos concluídos por dia da semana.",
          function (a) { barras(a, d.semana, "qtd", P.inteiro, function (it) { return [it.qtd + " atendimentos", P.moeda(it.valor)]; }); },
          ["Dia", "Atendimentos", "Faturamento"], d.semana.map(function (s) { return [s.rotulo, s.qtd, P.moeda(s.valor)]; })),
        cartaoGrafico("Atendimentos por porte", "Para saber que tipo de pet mais aparece.",
          function (a) { barras(a, d.porPorte, "qtd", P.inteiro, function (it) { return [it.qtd + " atendimentos", P.moeda(it.valor)]; }); },
          ["Porte", "Atendimentos", "Faturamento"], d.porPorte.map(function (s) { return [s.rotulo, s.qtd, P.moeda(s.valor)]; })),
      ];
      var grade = h("div", { class: "graficos" }, graficos);
      grade.appendChild(h("section", { class: "cartao grafico" },
        h("div", { class: "cartao__topo" }, h("h2", { text: "Clientes que mais vieram" })),
        tabela(["Cliente", "Visitas", "Total"], d.top.map(function (t) {
          return [t.nome + " (" + Object.keys(t.pets).join(", ") + ")", t.qtd, P.moeda(t.valor)];
        }))));
      area.appendChild(grade);
      graficos.forEach(function (g) { g._render(); });
    }).catch(P.falhou);
  }

  var espera;
  window.addEventListener("resize", function () {
    clearTimeout(espera);
    espera = setTimeout(function () { if (raiz && !raiz.hidden) graficos.forEach(function (g) { g._render(); }); }, 200);
  });

  P.secoes.resumo = {
    titulo: "Resumo",
    montar: function (el) {
      raiz = el;
      var datas = h("div", { class: "periodo__datas", hidden: true },
        h("input", { class: "entrada", type: "date", "aria-label": "De", value: P.iso(P.somarDias(P.hoje(), -29)), on: { change: function () { deCustom = P.deIso(this.value); desenhar(); } } }),
        h("span", { class: "dica", text: "até" }),
        h("input", { class: "entrada", type: "date", "aria-label": "Até", value: P.iso(P.hoje()), on: { change: function () { ateCustom = P.deIso(this.value); desenhar(); } } }));
      var escolhas = h("div", { class: "fichas", role: "radiogroup", "aria-label": "Período" }, PERIODOS.map(function (p) {
        var op = P.opcao("radio", "periodo", p[0], p[1], p[0] === periodo);
        op.querySelector("input").addEventListener("change", function () {
          periodo = p[0];
          datas.hidden = periodo !== "outro";
          desenhar();
        });
        return op;
      }));
      el.appendChild(h("div", { class: "periodo" }, escolhas, datas));
      el.appendChild(h("p", { class: "dica", dataset: { resumoTitulo: "" }, style: "margin:-.5rem 0 .9rem" }));
      el.appendChild(h("div", { dataset: { resumoArea: "" } }));
      desenhar();
    },
    mostrar: function () { if (raiz) desenhar(); },
  };
})();
