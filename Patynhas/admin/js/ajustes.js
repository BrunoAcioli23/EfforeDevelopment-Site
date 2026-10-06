/* Painel > Ajustes: regras da agenda e conta. */
(function () {
  "use strict";
  var P = window.Painel, h = P.h;

  P.secoes.ajustes = {
    titulo: "Ajustes",
    montar: function (el) {
      P.api.config().then(function (c) {
        var intervalo = h("select", null, [15, 20, 30, 60].map(function (m) { return h("option", { value: m, text: "A cada " + m + " minutos", selected: c.intervalo_min === m }); }));
        var antecedencia = h("select", null, [[0, "Sem mínimo"], [60, "1 hora antes"], [120, "2 horas antes"], [240, "4 horas antes"], [720, "12 horas antes"], [1440, "1 dia antes"], [2880, "2 dias antes"]]
          .map(function (o) { return h("option", { value: o[0], text: o[1], selected: c.antecedencia_min === o[0] }); }));
        var dias = h("input", { type: "number", min: 1, max: 180, value: c.dias_max });
        var capacidade = h("input", { type: "number", min: 1, max: 10, value: c.capacidade });

        var salvar = h("button", { class: "bt", type: "button", text: "Salvar ajustes", on: { click: function () {
          var d = parseInt(dias.value, 10), cap = parseInt(capacidade.value, 10);
          if (!(d >= 1 && d <= 180) || !(cap >= 1 && cap <= 10)) { P.aviso("Dias à frente: de 1 a 180. Pets ao mesmo tempo: de 1 a 10.", "erro"); return; }
          P.api.salvarConfig({ intervalo_min: +intervalo.value, antecedencia_min: +antecedencia.value, dias_max: d, capacidade: cap })
            .then(function () { P.aviso("Ajustes salvos"); }).catch(P.falhou);
        } } });

        el.appendChild(h("div", { class: "pilha" },
          h("section", { class: "cartao" },
            h("div", { class: "cartao__topo" }, h("h2", { text: "Regras da agenda" })),
            h("div", { class: "grade-campos grade-campos--2" },
              P.campo("Horários oferecidos no site", intervalo, "Ex.: a cada 30 minutos mostra 8h00, 8h30, 9h00…"),
              P.campo("Antecedência mínima para agendar", antecedencia, "Evita alguém marcar para daqui a 10 minutos."),
              P.campo("Até quantos dias à frente", dias, "Quantos dias o calendário do site mostra."),
              P.campo("Pets atendidos ao mesmo tempo", capacidade, "Use 1 se você atende um pet por vez.")),
            h("div", { style: "margin-top:1rem;display:flex;justify-content:flex-end" }, salvar)),
          h("section", { class: "cartao" },
            h("div", { class: "cartao__topo" }, h("h2", { text: "Mais opções" })),
            h("div", { style: "display:flex;flex-wrap:wrap;gap:.5rem" },
              h("a", { class: "bt bt--linha", href: "#servicos" }, P.icone("i-servicos"), "Serviços e preços"),
              h("a", { class: "bt bt--linha", href: "../index.html", target: "_blank", rel: "noopener", text: "Ver o site" }),
              h("a", { class: "bt bt--linha", href: "../agendar.html", target: "_blank", rel: "noopener", text: "Ver a página de agendar" }),
              h("button", { class: "bt bt--perigo", type: "button", on: { click: function () { P.sair(); } } }, P.icone("i-sair"), "Sair do painel")),
            h("p", { class: "dica", style: "margin-top:.8rem", text: "Conta: " + (P.email || "") })),
          h("section", { class: "cartao" },
            h("div", { class: "cartao__topo" }, h("h2", { text: "Loja" })),
            h("p", { class: "dica", text: "Em breve: produtos, estoque e vendas. O banco de dados já está organizado para receber a loja." }))));
      }).catch(P.falhou);
    },
  };
})();
