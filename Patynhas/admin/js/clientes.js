/* Painel > Clientes: busca, ficha com pets e histórico. */
(function () {
  "use strict";
  var P = window.Painel, h = P.h;
  var raiz, todos = [], termo = "";

  function carregar() {
    return P.api.clientes().then(function (l) { todos = l; P.cacheClientes = l; return l; });
  }

  function normalizar(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  function resumoCliente(c) {
    var feitos = (c.agendamentos || []).filter(function (a) { return a.status === "concluido"; });
    var ultima = feitos.map(function (a) { return a.inicio; }).sort().pop();
    var futuro = (c.agendamentos || []).filter(function (a) { return a.status === "confirmado" && new Date(a.inicio) >= P.hoje(); })
      .map(function (a) { return a.inicio; }).sort()[0];
    return {
      visitas: feitos.length,
      gasto: feitos.reduce(function (s, a) { return s + (+a.valor || 0); }, 0),
      ultima: ultima,
      proxima: futuro,
    };
  }

  function desenharLista() {
    var caixa = P.$("[data-lista-clientes]", raiz);
    P.limpar(caixa);
    var t = normalizar(termo), dig = termo.replace(/\D/g, "");
    var filtrados = todos.filter(function (c) {
      if (!t) return true;
      return normalizar(c.nome).indexOf(t) > -1 || (dig.length >= 3 && c.telefone.indexOf(dig) > -1) ||
        (c.pets || []).some(function (p) { return normalizar(p.nome).indexOf(t) > -1; });
    });
    P.$("[data-conta-clientes]", raiz).textContent = filtrados.length + (filtrados.length === 1 ? " cliente" : " clientes");
    if (!filtrados.length) {
      caixa.appendChild(h("div", { class: "cartao vazio" }, P.icone("i-clientes"),
        h("p", { text: todos.length ? "Ninguém encontrado com “" + termo + "”." : "Nenhum cliente ainda. Eles aparecem aqui quando agendam pelo site, ou cadastre um agora." })));
      return;
    }
    filtrados.forEach(function (c) {
      var r = resumoCliente(c);
      caixa.appendChild(h("button", { class: "cli", type: "button", on: { click: function () { abrirFicha(c); } } },
        h("span", { class: "cli__nome", text: c.nome }),
        h("span", { class: "cli__pets", text: (c.pets || []).map(function (p) { return p.nome; }).join(", ") || "sem pet cadastrado" }),
        h("span", { class: "cli__lado" },
          h("strong", { text: r.visitas + (r.visitas === 1 ? " visita" : " visitas") }),
          r.proxima ? "próxima " + P.dataCurta(r.proxima) : r.ultima ? "última " + P.dataCurta(r.ultima) : "sem visitas")));
    });
  }

  /* ---------- ficha do cliente ---------- */

  function abrirFicha(c) {
    var novo = !c;
    c = c || { nome: "", telefone: "", observacoes: "", pets: [], agendamentos: [] };
    var nome = h("input", { type: "text", maxLength: 80, value: c.nome });
    var tel = h("input", { type: "tel", value: P.telefone(c.telefone) });
    var obs = h("textarea", { rows: 2, maxLength: 1000, value: c.observacoes || "" });
    var erro = h("p", { class: "erro-form", role: "alert", hidden: true });
    var r = resumoCliente(c);

    var pets = h("div", { class: "pets-lista" }, (c.pets || []).map(function (p) {
      return h("div", { class: "pet-item" },
        h("div", null, h("strong", { text: p.nome }), " ",
          h("span", { class: "dica", text: [p.especie === "gato" ? "Gato" : P.PORTES[p.porte], p.raca, p.pelo ? "pelo " + p.pelo : ""].filter(Boolean).join(", ") })),
        h("button", { class: "bt bt--leve bt--pequeno", type: "button", text: "Editar", on: { click: function () { j.fechar(); abrirPet(c, p); } } }));
    }));

    var nomesPet = {};
    (c.pets || []).forEach(function (p) { nomesPet[p.id] = p.nome; });
    var hist = (c.agendamentos || []).slice().sort(function (a, b) { return a.inicio < b.inicio ? 1 : -1; });

    var salvar = h("button", { class: "bt", type: "button", text: novo ? "Cadastrar cliente" : "Salvar alterações" });
    var j = P.janela({
      titulo: novo ? "Novo cliente" : c.nome,
      corpo: [
        novo ? null : h("div", { class: "resumo-dia" },
          h("span", null, h("strong", { text: r.visitas }), r.visitas === 1 ? " visita" : " visitas"),
          h("span", null, "Total ", h("strong", { text: P.moeda(r.gasto) })),
          r.ultima ? h("span", null, "Última ", h("strong", { text: P.dataCurta(r.ultima) })) : null),
        h("div", { class: "grade-campos grade-campos--2" }, P.campo("Nome", nome), P.campo("Telefone com DDD", tel)),
        P.campo("Anotações sobre o cliente", obs),
        erro,
        novo ? null : h("div", { class: "secao-janela" },
          h("h3", { text: "Pets" }), pets,
          h("button", { class: "bt bt--linha bt--pequeno", type: "button", on: { click: function () { j.fechar(); abrirPet(c, null); } } }, P.icone("i-mais"), "Adicionar pet")),
        novo || !hist.length ? null : h("div", { class: "secao-janela" },
          h("h3", { text: "Histórico" }),
          h("div", { class: "historico" }, hist.map(function (a) {
            return h("div", null,
              h("span", null, P.dataCurta(a.inicio) + "/" + String(new Date(a.inicio).getFullYear()).slice(2) + " ",
                h("strong", { text: nomesPet[a.pet_id] || "" }), " " + a.servico_nome),
              h("span", null, P.selo(a.status), " ", a.status === "concluido" ? P.moeda(a.valor) : ""));
          }))),
      ],
      rodape: [
        novo ? null : h("a", { class: "bt bt--linha esquerda", href: P.linkWhats(c.telefone), target: "_blank", rel: "noopener" }, P.icone("i-whats"), "WhatsApp"),
        novo ? null : h("button", { class: "bt bt--linha", type: "button", text: "Agendar", on: { click: function () {
          j.fechar();
          P.novoAgendamento({ cliente: c, aoSalvar: function () { if (P.secoes.agenda.invalidar) P.secoes.agenda.invalidar(); recarregar(); } });
        } } }),
        salvar,
      ],
    });

    salvar.addEventListener("click", function () {
      erro.hidden = true;
      salvar.disabled = true;
      P.api.salvarCliente({ id: c.id, nome: nome.value, telefone: tel.value, observacoes: obs.value.trim() })
        .then(function () { j.fechar(); P.aviso(novo ? "Cliente cadastrado" : "Cliente atualizado"); recarregar(); })
        .catch(function (e) { salvar.disabled = false; erro.textContent = P.mensagemErro(e); erro.hidden = false; });
    });
  }

  function abrirPet(cliente, p) {
    var novo = !p;
    p = p || { cliente_id: cliente.id, nome: "", especie: "cachorro", porte: "pequeno" };
    var nome = h("input", { type: "text", maxLength: 60, value: p.nome });
    var raca = h("input", { type: "text", maxLength: 60, value: p.raca || "" });
    var obs = h("textarea", { rows: 3, maxLength: 1000, value: p.observacoes || "", placeholder: "Ex.: tem medo de secador, alergia a shampoo X" });
    var esp = h("div", { class: "fichas" }, P.opcao("radio", "p-especie", "cachorro", "Cachorro", p.especie !== "gato"), P.opcao("radio", "p-especie", "gato", "Gato", p.especie === "gato"));
    var porte = h("div", { class: "fichas" }, ["pequeno", "medio", "grande"].map(function (k) { return P.opcao("radio", "p-porte", k, P.PORTES[k], p.porte === k); }));
    var pelo = h("div", { class: "fichas" }, ["curto", "medio", "longo"].map(function (k) { return P.opcao("radio", "p-pelo", k, { curto: "Curto", medio: "Médio", longo: "Longo" }[k], p.pelo === k); }));
    var campoPorte = h("fieldset", { class: "campo", style: "border:0;padding:0;margin:0" }, h("legend", { text: "Porte" }), porte);
    var erro = h("p", { class: "erro-form", role: "alert", hidden: true });

    var j = P.janela({
      titulo: novo ? "Novo pet de " + cliente.nome.split(" ")[0] : p.nome,
      corpo: [
        P.campo("Nome do pet", nome),
        h("fieldset", { class: "campo", style: "border:0;padding:0;margin:0" }, h("legend", { text: "Espécie" }), esp),
        campoPorte,
        h("fieldset", { class: "campo", style: "border:0;padding:0;margin:0" }, h("legend", { text: "Pelo" }), pelo),
        P.campo("Raça", raca),
        P.campo("Cuidados e observações", obs),
        erro,
      ],
      rodape: [
        h("button", { class: "bt bt--linha", type: "button", text: "Voltar", on: { click: function () { j.fechar(); abrirFicha(cliente); } } }),
        h("button", { class: "bt", type: "button", text: novo ? "Adicionar pet" : "Salvar pet", on: { click: function () {
          var e = j.el.querySelector('input[name="p-especie"]:checked').value;
          var po = j.el.querySelector('input[name="p-porte"]:checked');
          var pe = j.el.querySelector('input[name="p-pelo"]:checked');
          if (!nome.value.trim()) { erro.textContent = "Escreva o nome do pet."; erro.hidden = false; return; }
          P.api.salvarPet({ id: p.id, cliente_id: cliente.id, nome: nome.value.trim(), especie: e, porte: po ? po.value : "pequeno",
                            pelo: pe ? pe.value : null, raca: raca.value.trim(), observacoes: obs.value.trim() })
            .then(function () { j.fechar(); P.aviso(novo ? "Pet adicionado" : "Pet atualizado"); recarregar(cliente.id); })
            .catch(P.falhou);
        } } }),
      ],
    });
    function atual() { campoPorte.hidden = j.el.querySelector('input[name="p-especie"]:checked').value === "gato"; }
    j.el.addEventListener("change", atual);
    atual();
  }

  function recarregar(reabrirId) {
    return carregar().then(function () {
      if (raiz) desenharLista();
      if (reabrirId) {
        var c = todos.filter(function (x) { return x.id === reabrirId; })[0];
        if (c) abrirFicha(c);
      }
    }).catch(P.falhou);
  }

  P.secoes.clientes = {
    titulo: "Clientes",
    acoes: function () {
      return h("button", { class: "bt", type: "button", on: { click: function () { abrirFicha(null); } } }, P.icone("i-mais"), h("span", { text: "Novo cliente" }));
    },
    montar: function (el) {
      raiz = el;
      var busca = h("input", { class: "entrada", type: "search", placeholder: "Buscar por nome, telefone ou pet", "aria-label": "Buscar cliente",
        on: { input: function () { termo = this.value.trim(); desenharLista(); } } });
      el.appendChild(h("div", { class: "busca" }, P.icone("i-busca"), busca));
      el.appendChild(h("p", { class: "dica", dataset: { contaClientes: "" }, style: "margin:-.4rem 0 .6rem" }));
      el.appendChild(h("div", { class: "lista-clientes", dataset: { listaClientes: "" } }, h("p", { class: "carregando", text: "Carregando clientes…" })));
      recarregar();
    },
    mostrar: function () { if (raiz) recarregar(); },
  };
})();
