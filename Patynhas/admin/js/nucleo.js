/* Painel: utilidades compartilhadas por todas as seções. */
(function () {
  "use strict";

  var P = window.Painel = { secoes: {}, api: null };

  /* ---------- montar elementos sem innerHTML (seguro contra dados digitados) ---------- */

  P.h = function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "on") Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
      else if (k === "dataset") Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
      else if (k === "style") el.setAttribute("style", v);
      else if (k in el && k !== "list" && k !== "form") { try { el[k] = v; } catch (e) { el.setAttribute(k, v); } }
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) anexar(el, arguments[i]);
    return el;
  };
  function anexar(el, filho) {
    if (filho == null || filho === false) return;
    if (Array.isArray(filho)) { filho.forEach(function (f) { anexar(el, f); }); return; }
    el.appendChild(filho instanceof Node ? filho : document.createTextNode(String(filho)));
  }
  P.icone = function (id, classe) {
    var NS = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("aria-hidden", "true");
    if (classe) s.setAttribute("class", classe);
    var u = document.createElementNS(NS, "use");
    u.setAttribute("href", "#" + id);
    s.appendChild(u);
    return s;
  };
  P.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  P.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  P.limpar = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  /* ---------- nomes ---------- */

  P.PORTES = { pequeno: "Pequeno", medio: "Médio", grande: "Grande", gato: "Gato" };
  P.STATUS = {
    confirmado: { nome: "Confirmado", icone: "i-relogio" },
    concluido: { nome: "Concluído", icone: "i-check" },
    faltou: { nome: "Faltou", icone: "i-alerta" },
    cancelado: { nome: "Cancelado", icone: "i-x" },
  };
  P.DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  P.DIAS_CURTO = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  P.MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  P.selo = function (status) {
    var s = P.STATUS[status] || { nome: status, icone: "i-relogio" };
    return P.h("span", { class: "selo selo--" + status }, P.icone(s.icone), s.nome);
  };

  /* ---------- formatação ---------- */

  var moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  P.moeda = function (v) { return v == null || isNaN(v) ? "—" : moeda.format(v); };
  P.moedaCurta = function (v) {
    if (v == null || isNaN(v)) return "—";
    if (Math.abs(v) >= 10000) return "R$ " + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil";
    return moeda.format(Math.round(v)).replace(",00", "");
  };
  P.inteiro = function (v) { return Math.round(v).toLocaleString("pt-BR"); };
  P.hora = function (d) { d = new Date(d); return d.getHours() + "h" + (d.getMinutes() ? String(d.getMinutes()).padStart(2, "0") : ""); };
  P.dataCurta = function (d) { d = new Date(d); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0"); };
  P.dataLonga = function (d) { d = new Date(d); return P.DIAS[d.getDay()] + ", " + d.getDate() + " de " + P.MESES[d.getMonth()]; };
  P.telefone = function (t) {
    t = String(t || "").replace(/\D/g, "");
    if (t.length > 11 && t.indexOf("55") === 0) t = t.slice(2);
    if (t.length === 11) return "(" + t.slice(0, 2) + ") " + t.slice(2, 7) + "-" + t.slice(7);
    if (t.length === 10) return "(" + t.slice(0, 2) + ") " + t.slice(2, 6) + "-" + t.slice(6);
    return t;
  };
  P.linkWhats = function (telefone, texto) {
    var t = String(telefone || "").replace(/\D/g, "");
    if (t.length <= 11) t = "55" + t;
    return "https://wa.me/" + t + (texto ? "?text=" + encodeURIComponent(texto) : "");
  };
  P.capitalizar = function (s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
  P.duracao = function (min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h ? h + "h" : "") + (m ? (h ? String(m).padStart(2, "0") : m + " min") : "");
  };

  /* ---------- avisos ---------- */

  P.aviso = function (texto, tipo, ms) {
    var caixa = P.$("[data-avisos]");
    var el = P.h("div", { class: "aviso" + (tipo ? " aviso--" + tipo : ""), role: tipo === "erro" ? "alert" : "status" },
      P.h("span", null, texto),
      P.h("button", { type: "button", "aria-label": "Fechar aviso", text: "×", on: { click: function () { el.remove(); } } }));
    caixa.appendChild(el);
    setTimeout(function () { el.remove(); }, ms || 4500);
    return el;
  };
  var MENSAGENS = {
    horario_indisponivel: "Esse horário acabou de ficar ocupado. Escolha outro.",
    dados_invalidos: "Confira os campos: nome, telefone com DDD e nome do pet são obrigatórios.",
    servico_indisponivel: "Esse serviço não é oferecido para o porte escolhido.",
    limite_cliente: "Esse telefone já tem 3 agendamentos futuros.",
    sem_permissao: "Sua sessão expirou. Entre de novo.",
    login_invalido: "E-mail ou senha incorretos.",
    telefone_repetido: "Já existe um cliente com esse telefone.",
    rede: "Sem conexão com o banco de dados. Confira a internet e tente de novo.",
  };
  P.mensagemErro = function (e) { return (e && MENSAGENS[e.codigo]) || "Não foi possível salvar. Tente de novo."; };
  P.falhou = function (e) { console.error(e); P.aviso(P.mensagemErro(e), "erro", 6000); };

  /* ---------- janela (modal) ---------- */

  P.janela = function (opcoes) {
    var d = P.$("[data-janela]");
    P.limpar(d);
    var fechar = function () { if (d.open) d.close(); };
    d.appendChild(P.h("div", { class: "janela__topo" },
      P.h("h2", { text: opcoes.titulo }),
      P.h("button", { class: "bt-icone", type: "button", "aria-label": "Fechar", on: { click: fechar } }, P.icone("i-fechar"))));
    var corpo = P.h("div", { class: "janela__corpo" });
    anexar(corpo, opcoes.corpo);
    d.appendChild(corpo);
    if (opcoes.rodape) d.appendChild(P.h("div", { class: "janela__rodape" }, opcoes.rodape));
    d.onclick = function (ev) { if (ev.target === d) fechar(); };
    d.showModal();
    var foco = d.querySelector("[autofocus], .janela__corpo input, .janela__corpo select, .janela__corpo button");
    if (foco) foco.focus();
    return { el: d, corpo: corpo, fechar: fechar };
  };
  P.confirmar = function (texto, botao) {
    return new Promise(function (ok) {
      var j = P.janela({
        titulo: "Confirmar",
        corpo: P.h("p", { text: texto }),
        rodape: [
          P.h("button", { class: "bt bt--linha", type: "button", text: "Voltar", on: { click: function () { j.fechar(); ok(false); } } }),
          P.h("button", { class: "bt", type: "button", text: botao || "Confirmar", on: { click: function () { j.fechar(); ok(true); } } }),
        ],
      });
    });
  };

  /* ---------- campos ---------- */

  P.campo = function (rotulo, controle, dica) {
    return P.h("label", { class: "campo" }, P.h("span", { text: rotulo }), controle, dica ? P.h("small", { class: "dica", text: dica }) : null);
  };
  P.opcao = function (tipo, nome, valor, texto, marcado) {
    return P.h("label", { class: "ficha-op" },
      P.h("input", { type: tipo, name: nome, value: valor, checked: !!marcado }),
      P.h("span", { text: texto }));
  };
  P.chave = function (nome, texto, marcado) {
    return P.h("label", { class: "chave" },
      P.h("input", { type: "checkbox", name: nome, checked: !!marcado }),
      P.h("span", { class: "chave__trilho" }),
      P.h("span", { text: texto }));
  };
  P.numeroBR = function (s) {
    if (s == null || String(s).trim() === "") return null;
    var n = parseFloat(String(s).replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  };
  P.formatarNumeroBR = function (n) {
    return n == null ? "" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /* ---------- datas ---------- */

  P.hoje = function () { var d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  P.somarDias = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  P.iso = function (d) { return window.PatynhasAPI.util.isoData(d); };
  P.deIso = function (s) { return window.PatynhasAPI.util.deIsoData(s); };
  P.mesmoDia = function (a, b) { return P.iso(new Date(a)) === P.iso(new Date(b)); };
})();
