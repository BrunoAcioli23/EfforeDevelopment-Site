/* Painel > Horários: semana de atendimento e bloqueios (folgas, feriados, compromissos). */
(function () {
  "use strict";
  var P = window.Painel, h = P.h;
  var raiz, semana = {}, alterado = false;
  var ORDEM = [1, 2, 3, 4, 5, 6, 0]; // segunda a domingo

  /* ---------- semana ---------- */

  function linhaFaixa(dia, f, i) {
    var abre = h("input", { class: "entrada", type: "time", value: f.abre, step: 900, "aria-label": "Abre às" });
    var fecha = h("input", { class: "entrada", type: "time", value: f.fecha, step: 900, "aria-label": "Fecha às" });
    abre.addEventListener("change", function () { f.abre = abre.value; marcar(); });
    fecha.addEventListener("change", function () { f.fecha = fecha.value; marcar(); });
    return h("div", { class: "faixa" }, abre, h("span", { text: "às" }), fecha,
      i > 0 || semana[dia].length > 1 ? h("button", { class: "bt-icone", type: "button", "aria-label": "Remover esta faixa", on: { click: function () {
        semana[dia].splice(i, 1); marcar(); desenharSemana();
      } } }, P.icone("i-x")) : null);
  }

  function desenharSemana() {
    var caixa = P.$("[data-semana]", raiz);
    P.limpar(caixa);
    ORDEM.forEach(function (dia) {
      var faixas = semana[dia] || [];
      var aberto = faixas.length > 0;
      var chave = P.chave("aberto-" + dia, aberto ? "Aberto" : "Fechado", aberto);
      chave.querySelector("input").addEventListener("change", function () {
        semana[dia] = this.checked ? [{ abre: "08:00", fecha: "18:00" }] : [];
        marcar(); desenharSemana();
      });
      var corpo = aberto
        ? h("div", { class: "faixas" }, faixas.map(function (f, i) { return linhaFaixa(dia, f, i); }),
            h("div", null, h("button", { class: "bt bt--leve bt--pequeno", type: "button", on: { click: function () {
              var ultima = faixas[faixas.length - 1];
              faixas.push({ abre: ultima ? ultima.fecha : "13:00", fecha: "18:00" });
              marcar(); desenharSemana();
            } } }, P.icone("i-mais"), "Adicionar faixa (ex.: depois do almoço)")))
        : h("div", { class: "faixas", text: "Não atende neste dia" });
      caixa.appendChild(h("div", { class: "dia-edit" + (aberto ? "" : " dia-edit--fechado") },
        h("div", { class: "dia-edit__nome" }, h("span", { text: P.capitalizar(P.DIAS[dia]) }), chave), corpo));
    });
  }

  function marcar() { alterado = true; var b = P.$("[data-salvar-semana]", raiz); if (b) b.disabled = false; }

  function validar() {
    for (var i = 0; i < ORDEM.length; i++) {
      var dia = ORDEM[i];
      var l = (semana[dia] || []).slice().sort(function (a, b) { return a.abre < b.abre ? -1 : 1; });
      for (var k = 0; k < l.length; k++) {
        if (!l[k].abre || !l[k].fecha || l[k].fecha <= l[k].abre) return P.capitalizar(P.DIAS[dia]) + ": o horário de fechar precisa ser depois do de abrir.";
        if (k > 0 && l[k].abre < l[k - 1].fecha) return P.capitalizar(P.DIAS[dia]) + ": duas faixas estão se sobrepondo.";
      }
    }
    return null;
  }

  function salvarSemana(bt) {
    var problema = validar();
    if (problema) { P.aviso(problema, "erro", 6000); return; }
    var faixas = [];
    ORDEM.forEach(function (dia) { (semana[dia] || []).forEach(function (f) { faixas.push({ dia_semana: dia, abre: f.abre, fecha: f.fecha }); }); });
    bt.disabled = true;
    P.api.salvarHorarios(faixas).then(function () {
      alterado = false;
      P.aviso("Horário da semana salvo. O site já mostra os novos horários.");
      if (P.secoes.agenda.recarregarHorarios) P.secoes.agenda.recarregarHorarios();
    }).catch(function (e) { bt.disabled = false; P.falhou(e); });
  }

  /* ---------- bloqueios ---------- */

  function textoBloqueio(b) {
    var i = new Date(b.inicio), f = new Date(b.fim);
    var diaInteiro = i.getHours() === 0 && i.getMinutes() === 0 && f.getHours() === 0 && f.getMinutes() === 0;
    if (diaInteiro) {
      var ultimo = P.somarDias(f, -1);
      return P.mesmoDia(i, ultimo) ? P.capitalizar(P.dataLonga(i)) + ", dia inteiro"
        : "De " + P.dataLonga(i) + " a " + P.dataLonga(ultimo);
    }
    return P.capitalizar(P.dataLonga(i)) + ", das " + P.hora(i) + " às " + P.hora(f) + (P.mesmoDia(i, f) ? "" : " de " + P.dataCurta(f));
  }

  function desenharBloqueios() {
    var caixa = P.$("[data-bloqueios]", raiz);
    P.api.bloqueios().then(function (l) {
      P.limpar(caixa);
      if (!l.length) { caixa.appendChild(h("p", { class: "dica", text: "Nenhuma folga ou bloqueio marcado." })); return; }
      l.forEach(function (b) {
        caixa.appendChild(h("div", { class: "bloqueio" },
          h("div", null, h("strong", { text: b.motivo || "Bloqueado" }), h("span", { text: textoBloqueio(b) })),
          h("button", { class: "bt bt--perigo bt--pequeno", type: "button", text: "Remover", on: { click: function () {
            P.confirmar("Remover “" + (b.motivo || "bloqueio") + "”? Esses horários voltam a aparecer no site.", "Remover").then(function (ok) {
              if (ok) P.api.removerBloqueio(b.id).then(function () { P.aviso("Bloqueio removido"); desenharBloqueios(); }).catch(P.falhou);
            });
          } } })));
      });
    }).catch(P.falhou);
  }

  function novoBloqueio() {
    var hoje = P.iso(P.hoje());
    var inteiro = P.chave("b-inteiro", "Dia inteiro", true);
    var de = h("input", { type: "date", value: hoje, min: hoje });
    var ate = h("input", { type: "date", value: hoje, min: hoje });
    var hIni = h("input", { type: "time", value: "12:00", step: 900 });
    var hFim = h("input", { type: "time", value: "14:00", step: 900 });
    var motivo = h("input", { type: "text", maxLength: 80, placeholder: "Ex.: Feriado, folga, consulta médica" });
    var horas = h("div", { class: "grade-campos grade-campos--2", hidden: true }, P.campo("Das", hIni), P.campo("Até", hFim));
    var campoAte = P.campo("Até o dia", ate);
    var erro = h("p", { class: "erro-form", role: "alert", hidden: true });
    inteiro.querySelector("input").addEventListener("change", function () { horas.hidden = this.checked; campoAte.hidden = !this.checked; });
    de.addEventListener("change", function () { if (ate.value < de.value) ate.value = de.value; });

    var j = P.janela({
      titulo: "Bloquear horários",
      corpo: [
        h("p", { class: "dica", text: "Nesse período o site não oferece horários. Agendamentos que já existem continuam na agenda." }),
        inteiro,
        h("div", { class: "grade-campos grade-campos--2" }, P.campo("Dia", de), campoAte),
        horas,
        P.campo("Motivo (só você vê)", motivo),
        erro,
      ],
      rodape: [
        h("button", { class: "bt bt--linha", type: "button", text: "Cancelar", on: { click: function () { j.fechar(); } } }),
        h("button", { class: "bt", type: "button", text: "Bloquear", on: { click: function () {
          var ini, fim;
          if (inteiro.querySelector("input").checked) {
            ini = P.deIso(de.value);
            fim = P.somarDias(P.deIso(ate.value || de.value), 1);
          } else {
            ini = P.deIso(de.value); ini.setHours(+hIni.value.slice(0, 2), +hIni.value.slice(3, 5));
            fim = P.deIso(de.value); fim.setHours(+hFim.value.slice(0, 2), +hFim.value.slice(3, 5));
          }
          if (!de.value || !(fim > ini)) { erro.textContent = "Confira as datas e horas: o fim precisa ser depois do início."; erro.hidden = false; return; }
          P.api.criarBloqueio({ inicio: ini.toISOString(), fim: fim.toISOString(), motivo: motivo.value.trim() || null })
            .then(function () { j.fechar(); P.aviso("Horários bloqueados"); desenharBloqueios(); })
            .catch(P.falhou);
        } } }),
      ],
    });
  }

  /* ---------- montagem ---------- */

  function carregar() {
    return P.api.horariosSemana().then(function (l) {
      semana = {};
      ORDEM.forEach(function (d) { semana[d] = []; });
      l.forEach(function (f) { semana[f.dia_semana].push({ abre: f.abre.slice(0, 5), fecha: f.fecha.slice(0, 5) }); });
      alterado = false;
      desenharSemana();
      var b = P.$("[data-salvar-semana]", raiz); if (b) b.disabled = true;
    });
  }

  P.secoes.horarios = {
    titulo: "Horários",
    montar: function (el) {
      raiz = el;
      var salvar = h("button", { class: "bt", type: "button", disabled: true, dataset: { salvarSemana: "" }, text: "Salvar horário da semana" });
      salvar.addEventListener("click", function () { salvarSemana(salvar); });
      el.appendChild(h("div", { class: "pilha" },
        h("section", { class: "cartao" },
          h("div", { class: "cartao__topo" }, h("h2", { text: "Horário de atendimento" })),
          h("p", { class: "dica", style: "margin-bottom:.8rem", text: "Esses horários aparecem no site e definem quando os clientes podem agendar. Para fechar no almoço, adicione duas faixas no mesmo dia." }),
          h("div", { class: "semana-edit", dataset: { semana: "" } }, h("p", { class: "carregando", text: "Carregando…" })),
          h("div", { class: "salvar-fixo" }, salvar)),
        h("section", { class: "cartao" },
          h("div", { class: "cartao__topo" },
            h("h2", { text: "Folgas, feriados e bloqueios" }),
            h("button", { class: "bt bt--linha bt--pequeno", type: "button", on: { click: novoBloqueio } }, P.icone("i-mais"), "Bloquear")),
          h("div", { dataset: { bloqueios: "" } }))));
      carregar().catch(P.falhou);
      desenharBloqueios();
    },
    mostrar: function () { if (raiz && !alterado) { carregar().catch(P.falhou); desenharBloqueios(); } },
    temAlteracao: function () { return alterado; },
  };
})();
