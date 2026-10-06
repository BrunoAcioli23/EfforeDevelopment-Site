/* Painel: entrada, navegação entre seções e avisos em tempo real. */
(function () {
  "use strict";
  var P = window.Painel, h = P.h;
  var montadas = {};
  var SECOES = ["agenda", "clientes", "resumo", "horarios", "servicos", "ajustes"];

  function tela(nome) {
    P.$$("[data-tela]").forEach(function (t) { t.hidden = t.dataset.tela !== nome; });
  }

  /* ---------- entrada ---------- */

  function prepararEntrada() {
    var form = P.$("[data-form-entrar]");
    var erro = P.$("[data-erro-entrar]");
    var bt = P.$("[data-bt-entrar]");
    if (P.api.modo === "demo") {
      P.$("[data-demo-info]").hidden = false;
      P.$$("[data-campo-real]").forEach(function (c) { c.hidden = true; });
      bt.textContent = "Entrar na demonstração";
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      erro.hidden = true;
      bt.disabled = true;
      P.api.entrar(form.email.value.trim(), form.senha.value)
        .then(function () { return verificarAdmin(); })
        .catch(function (e) { erro.textContent = P.mensagemErro(e); erro.hidden = false; })
        .then(function () { bt.disabled = false; });
    });
  }

  function mostrarEntrada() {
    tela("entrar");
    var foco = P.api.modo === "demo" ? P.$("[data-bt-entrar]") : P.$("[data-form-entrar]").email;
    foco.focus();
  }

  function verificarAdmin() {
    return P.api.ehAdmin().then(function (ok) {
      if (!ok) {
        return P.api.sair().then(function () {
          var erro = P.$("[data-erro-entrar]");
          erro.textContent = "Esta conta não tem acesso ao painel. Veja no README como liberar o administrador.";
          erro.hidden = false;
          mostrarEntrada();
        });
      }
      return P.api.sessao().then(function (s) { iniciarPainel(s); });
    });
  }

  P.sair = function () {
    P.api.sair().then(function () { location.hash = ""; location.reload(); });
  };

  /* ---------- painel ---------- */

  function iniciarPainel(sessao) {
    P.email = sessao && sessao.email;
    P.$("[data-email]").textContent = P.api.modo === "demo" ? "Demonstração" : P.email || "";
    P.$("[data-aviso-demo]").hidden = P.api.modo !== "demo";
    tela("app");
    rotear();
    window.addEventListener("hashchange", rotear);

    P.api.aoNovoAgendamento(function (a) {
      var quando = new Date(a.inicio);
      var el = P.aviso("Novo agendamento pelo site: " + (a.servico_nome || "") + ", " + P.dataLonga(quando) + " às " + P.hora(quando), "novo", 12000);
      el.style.cursor = "pointer";
      el.addEventListener("click", function () { location.hash = "#agenda"; });
      if (navigator.vibrate) navigator.vibrate(120);
      if (P.secoes.agenda.novoAgendamento) P.secoes.agenda.novoAgendamento(a);
    });
  }

  function rotear() {
    var nome = (location.hash || "#agenda").slice(1);
    if (SECOES.indexOf(nome) < 0) nome = "agenda";
    var secao = P.secoes[nome];
    P.$$("[data-secao]").forEach(function (s) { s.hidden = s.dataset.secao !== nome; });
    P.$$("[data-nav] a").forEach(function (a) {
      var alvo = a.getAttribute("href").slice(1);
      var ativo = alvo === nome || (nome === "servicos" && alvo === "ajustes" && a.closest(".abas"));
      if (ativo) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    P.$("[data-titulo]").textContent = secao.titulo;
    document.title = secao.titulo + " | Painel Patynhas Pet Mel";
    var acoes = P.limpar(P.$("[data-acoes-barra]"));
    if (secao.acoes) acoes.appendChild(secao.acoes());

    var el = P.$('[data-secao="' + nome + '"]');
    if (!montadas[nome]) { montadas[nome] = true; secao.montar(el); }
    else if (secao.mostrar) secao.mostrar();
    window.scrollTo(0, 0);
  }

  /* ---------- início ---------- */

  window.addEventListener("beforeunload", function (ev) {
    if (P.secoes.horarios.temAlteracao && P.secoes.horarios.temAlteracao()) { ev.preventDefault(); ev.returnValue = ""; }
  });

  window.PatynhasAPI.criar({ permitirDemo: true }).then(function (api) {
    P.api = api;
    P.$("[data-reiniciar-demo]").addEventListener("click", function () {
      P.confirmar("Apagar o que você fez na demonstração e voltar aos dados de exemplo?", "Restaurar").then(function (ok) {
        if (ok) api.reiniciar().then(function () { location.reload(); });
      });
    });
    P.$$("[data-sair]").forEach(function (b) { b.addEventListener("click", P.sair); });
    prepararEntrada();
    return api.sessao().then(function (s) { return s ? verificarAdmin() : mostrarEntrada(); });
  }).catch(function (e) {
    console.error(e);
    document.body.appendChild(h("p", { class: "carregando", text: "Não foi possível abrir o painel. Confira a internet e a configuração do Supabase em js/config.js." }));
  });
})();
