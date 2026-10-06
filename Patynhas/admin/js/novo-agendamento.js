/* Painel > Novo agendamento (feito por você, ex.: cliente que ligou ou mandou mensagem). */
(function () {
  "use strict";
  var P = window.Painel, h = P.h;

  P.novoAgendamento = function (opcoes) {
    opcoes = opcoes || {};
    Promise.all([P.api.clientes(), P.api.servicosTodos()]).then(function (r) {
      abrir(r[0], r[1], opcoes);
    }).catch(P.falhou);
  };

  function abrir(clientes, catalogo, opcoes) {
    var servicos = catalogo.servicos.filter(function (s) { return s.ativo; });
    var extras = catalogo.extras.filter(function (e) { return e.ativo; });
    var clienteAtual = opcoes.cliente || null;
    var horaEscolhida = null;

    /* --- cliente --- */
    var lista = h("datalist", { id: "lista-clientes" }, clientes.map(function (c) {
      return h("option", { value: c.nome + " | " + P.telefone(c.telefone) });
    }));
    var busca = h("input", { type: "search", list: "lista-clientes", placeholder: "Digite o nome ou o telefone", autocomplete: "off" });
    var nome = h("input", { type: "text", maxLength: 80, autocomplete: "off" });
    var tel = h("input", { type: "tel", inputMode: "tel", placeholder: "(11) 98765-4321", autocomplete: "off" });
    var petsDoCliente = h("div", { class: "fichas" });

    function usarCliente(c) {
      clienteAtual = c;
      nome.value = c ? c.nome : nome.value;
      tel.value = c ? P.telefone(c.telefone) : tel.value;
      P.limpar(petsDoCliente);
      if (c && c.pets && c.pets.length) {
        c.pets.forEach(function (p) {
          petsDoCliente.appendChild(h("button", { class: "bt bt--linha bt--pequeno", type: "button", text: p.nome,
            on: { click: function () { usarPet(p); } } }));
        });
        usarPet(c.pets[0]);
      }
    }
    busca.addEventListener("change", function () {
      var v = busca.value.split(" | ");
      var digitos = (v[1] || v[0]).replace(/\D/g, "");
      var achado = clientes.filter(function (c) {
        return (v[1] && c.nome === v[0]) || (digitos.length >= 8 && c.telefone.indexOf(digitos) > -1);
      })[0];
      if (achado) { usarCliente(achado); busca.value = ""; }
    });
    tel.addEventListener("change", function () {
      var d = tel.value.replace(/\D/g, "");
      var achado = clientes.filter(function (c) { return c.telefone === d || c.telefone === "55" + d; })[0];
      if (achado && achado !== clienteAtual) usarCliente(achado);
    });

    /* --- pet --- */
    var petNome = h("input", { type: "text", maxLength: 60, autocomplete: "off" });
    var especie = h("div", { class: "fichas" }, P.opcao("radio", "n-especie", "cachorro", "Cachorro", true), P.opcao("radio", "n-especie", "gato", "Gato"));
    var porte = h("div", { class: "fichas" }, ["pequeno", "medio", "grande"].map(function (k, i) { return P.opcao("radio", "n-porte", k, P.PORTES[k], i === 0); }));
    var campoPorte = h("fieldset", { class: "campo", style: "border:0;padding:0;margin:0" }, h("legend", { text: "Porte" }), porte);

    function valorRadio(nomeCampo) { var x = j.el.querySelector('input[name="' + nomeCampo + '"]:checked'); return x ? x.value : null; }
    function porteAtual() { return valorRadio("n-especie") === "gato" ? "gato" : valorRadio("n-porte"); }
    function usarPet(p) {
      petNome.value = p.nome;
      var e = j.el.querySelector('input[name="n-especie"][value="' + (p.especie || "cachorro") + '"]'); if (e) e.checked = true;
      if (p.porte && p.porte !== "gato") { var po = j.el.querySelector('input[name="n-porte"][value="' + p.porte + '"]'); if (po) po.checked = true; }
      atualizarPorte();
    }

    /* --- serviço --- */
    var servico = h("select");
    var extrasEl = h("div", { class: "fichas" }, extras.map(function (e) {
      return P.opcao("checkbox", "n-extra", e.id, e.nome + (e.minutos ? " (+" + e.minutos + " min)" : ""));
    }));
    function atualizarServicos() {
      var p = porteAtual(), atual = servico.value;
      P.limpar(servico);
      servicos.filter(function (s) { return s.portes[p]; }).forEach(function (s) {
        servico.appendChild(h("option", { value: s.id, text: s.nome + " (" + P.duracao(s.portes[p].minutos) + (s.portes[p].preco != null ? ", " + P.moeda(s.portes[p].preco) : "") + ")" }));
      });
      if (atual && servico.querySelector('option[value="' + atual + '"]')) servico.value = atual;
    }
    function atualizarPorte() { campoPorte.hidden = valorRadio("n-especie") === "gato"; atualizarServicos(); buscarHorarios(); }

    /* --- data e hora --- */
    var data = h("input", { type: "date", value: P.iso(opcoes.data && opcoes.data >= P.hoje() ? opcoes.data : P.hoje()) });
    var horas = h("div", { class: "horas-livres", role: "radiogroup", "aria-label": "Horários livres" });
    var encaixe = h("input", { type: "time", step: 300 });
    var avisoHoras = h("p", { class: "dica" });

    function buscarHorarios() {
      if (!servico.value || !data.value) return;
      horaEscolhida = null;
      P.limpar(horas);
      avisoHoras.textContent = "Procurando horários livres…";
      var ids = P.$$('input[name="n-extra"]:checked', j.el).map(function (x) { return +x.value; });
      P.api.disponibilidade({ servicoId: +servico.value, porte: porteAtual(), extras: ids, de: data.value, ate: data.value, ignorarAntecedencia: true })
        .then(function (l) {
          avisoHoras.textContent = l.length ? "Toque num horário livre ou use o encaixe abaixo." : "Nenhum horário livre nesse dia para esse serviço. Use o encaixe se quiser marcar mesmo assim.";
          l.forEach(function (x) {
            var op = P.opcao("radio", "n-hora", x.hora, x.hora.replace(":00", "h").replace(":", "h"));
            op.querySelector("input").addEventListener("change", function () { horaEscolhida = x.hora; encaixe.value = ""; });
            horas.appendChild(op);
          });
        }).catch(P.falhou);
    }
    encaixe.addEventListener("input", function () {
      if (encaixe.value) { horaEscolhida = null; P.$$('input[name="n-hora"]', j.el).forEach(function (x) { x.checked = false; }); }
    });

    var obs = h("textarea", { rows: 2, maxLength: 1000 });
    var erro = h("p", { class: "erro-form", role: "alert", hidden: true });
    var salvar = h("button", { class: "bt", type: "button", text: "Agendar" });

    var j = P.janela({
      titulo: "Novo agendamento",
      corpo: [
        h("div", { class: "secao-janela" }, h("h3", { text: "Cliente" }),
          clientes.length ? P.campo("Buscar cliente já cadastrado", busca) : null, lista,
          h("div", { class: "grade-campos grade-campos--2" }, P.campo("Nome", nome), P.campo("Telefone com DDD", tel)),
          petsDoCliente),
        h("div", { class: "secao-janela" }, h("h3", { text: "Pet" }),
          P.campo("Nome do pet", petNome),
          h("fieldset", { class: "campo", style: "border:0;padding:0;margin:0" }, h("legend", { text: "Espécie" }), especie),
          campoPorte),
        h("div", { class: "secao-janela" }, h("h3", { text: "Serviço" }),
          P.campo("Serviço", servico),
          extras.length ? h("fieldset", { class: "campo", style: "border:0;padding:0;margin:0" }, h("legend", { text: "Extras" }), extrasEl) : null),
        h("div", { class: "secao-janela" }, h("h3", { text: "Quando" }),
          P.campo("Dia", data), horas, avisoHoras,
          P.campo("Encaixe em outro horário (fora da grade)", encaixe, "Use só se combinou um horário especial. Ele pode coincidir com outro atendimento.")),
        P.campo("Observação", obs),
        erro,
      ],
      rodape: [h("button", { class: "bt bt--linha", type: "button", text: "Cancelar", on: { click: function () { j.fechar(); } } }), salvar],
    });

    j.el.addEventListener("change", function (ev) {
      var n = ev.target.name;
      if (n === "n-especie") atualizarPorte();
      if (n === "n-porte" || n === "n-extra") { atualizarServicos(); buscarHorarios(); }
    });
    servico.addEventListener("change", buscarHorarios);
    data.addEventListener("change", buscarHorarios);

    salvar.addEventListener("click", function () {
      erro.hidden = true;
      var hora = horaEscolhida || encaixe.value;
      var falta = !nome.value.trim() ? "o nome do cliente" : tel.value.replace(/\D/g, "").length < 10 ? "o telefone com DDD"
        : !petNome.value.trim() ? "o nome do pet" : !servico.value ? "o serviço" : !hora ? "o horário" : null;
      if (falta) { erro.textContent = "Falta preencher " + falta + "."; erro.hidden = false; return; }
      salvar.disabled = true;
      P.api.agendar({
        nome: nome.value.trim(), telefone: tel.value,
        pet: { nome: petNome.value.trim(), especie: valorRadio("n-especie"), porte: porteAtual() },
        servicoId: +servico.value,
        extras: P.$$('input[name="n-extra"]:checked', j.el).map(function (x) { return +x.value; }),
        inicio: data.value + " " + hora.slice(0, 5),
        observacoes: obs.value.trim(),
        forcar: !horaEscolhida,
      }).then(function (res) {
        j.fechar();
        P.cacheClientes = null;
        P.aviso("Agendado: " + petNome.value.trim() + ", " + P.dataLonga(res.inicio) + " às " + P.hora(res.inicio));
        if (opcoes.aoSalvar) opcoes.aoSalvar(res);
      }).catch(function (e) {
        salvar.disabled = false;
        erro.textContent = P.mensagemErro(e);
        erro.hidden = false;
        if (e.codigo === "horario_indisponivel") buscarHorarios();
      });
    });

    if (clienteAtual) usarCliente(clienteAtual);
    atualizarServicos();
    buscarHorarios();
  }
})();
