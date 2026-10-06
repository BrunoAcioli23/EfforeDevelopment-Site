/*
  Página "Agendar horário": passo a passo em 4 etapas.

  Dois modos:
  - WhatsApp (padrão, sem banco): dias e períodos vêm dos horários em js/config.js
    e, no fim, a mensagem abre pronta no WhatsApp.
  - Online (com Supabase configurado, ou com ?demo no endereço para testar):
    serviços e horários livres vêm do banco e o agendamento fica confirmado na hora.
*/
(function () {
  "use strict";

  var pagina = document.querySelector("[data-agenda-pagina]");
  if (!pagina) return;

  var C = window.PATYNHAS || {};
  var semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  var DIAS_CURTO = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var DIAS_NO_CALENDARIO = 21;
  var CHAVE = "patynhas-agendamento";

  var querDemo = /[?&]demo\b/.test(location.search);
  var online = !!(window.PatynhasAPI && (window.PatynhasAPI.configurado() || querDemo));

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function capitalizar(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function doisDigitos(n) { return String(n).padStart(2, "0"); }
  function semAcento(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function el(tag, classe, texto) { var e = document.createElement(tag); if (classe) e.className = classe; if (texto != null) e.textContent = texto; return e; }

  var numero = String(C.whatsapp || "").replace(/\D/g, "");
  var temWhats = numero.length >= 12;
  function linkWhats(texto) { return "https://wa.me/" + numero + "?text=" + encodeURIComponent(texto); }
  var moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  /* ---------- Horários e datas ---------- */

  var horarios = {};
  (C.horarios || []).forEach(function (h) { horarios[h.dia] = h; });
  var temHorarios = Object.keys(horarios).length > 0;

  function minutos(hhmm) { var p = hhmm.split(":"); return Number(p[0]) * 60 + Number(p[1] || 0); }
  function horaBonita(min) { var h = Math.floor(min / 60), m = min % 60; return h + "h" + (m ? doisDigitos(m) : ""); }
  function duracaoBonita(min) { var h = Math.floor(min / 60), m = min % 60; return (h ? h + "h" : "") + (m ? (h ? doisDigitos(m) : m + " min") : ""); }
  function agoraEmMinutos() { var a = new Date(); return a.getHours() * 60 + a.getMinutes(); }
  function hojeIso() { return iso(new Date()); }
  function iso(d) { return d.getFullYear() + "-" + doisDigitos(d.getMonth() + 1) + "-" + doisDigitos(d.getDate()); }
  function deIso(s) { var p = s.split("-"); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }

  /* ---------- Elementos ---------- */

  var form = $("[data-agenda]");
  var etapas = $$("[data-etapa]", form);
  var TOTAL = etapas.length;
  var progresso = $("[data-progresso]");
  var botoesProgresso = $$("[data-ir]", progresso);
  var btnVoltar = $("[data-voltar]", form);
  var btnAvancar = $("[data-avancar]", form);
  var btnEnviar = $("[data-enviar]", form);
  var corpo = $("[data-corpo]");
  var ficha = $("[data-ficha]");
  var pronto = $("[data-pronto]");
  var prontoOnline = $("[data-pronto-online]");
  var passo = 1;
  var alcancado = 1;

  /* =====================================================================
     MODO ONLINE: serviços e horários livres vindos do banco
     ===================================================================== */

  var api = null, catalogo = null, abertos = null;
  var livres = {}, chaveLivres = null, salvoServico = null, salvoExtras = [];

  function porteAtual() {
    return valor("especie") === "gato" ? "gato" : semAcento(valor("porte") || "pequeno");
  }
  function servicoPorId(id) {
    return catalogo ? catalogo.servicos.filter(function (s) { return String(s.id) === String(id); })[0] : null;
  }
  function extrasPorIds(ids) {
    return catalogo ? catalogo.extras.filter(function (e) { return ids.indexOf(String(e.id)) > -1; }) : [];
  }

  function prepararOnline() {
    // textos do modo confirmado na hora
    var sub = $(".agenda__cabeca p");
    if (sub) sub.textContent = "Leva menos de um minuto. Você escolhe um horário livre e o agendamento fica confirmado na hora.";
    $('[data-etapa="2"] .etapa__dica').textContent = "Escolha o serviço. O valor pode variar um pouco conforme o pelo.";
    $('[data-etapa="3"] .etapa__dica').textContent = "Mostramos só os horários que estão livres de verdade.";
    $("[data-nota-envio]").textContent = "Ao confirmar, o horário fica reservado para você.";
    btnEnviar.lastChild.textContent = " Confirmar agendamento";
    btnEnviar.querySelector("use").setAttribute("href", "#i-agenda-mini");
    $("[data-periodos]").hidden = true;
    $$("[data-so-online]").forEach(function (x) { x.hidden = false; });
    var servicos = $(".escolha--servicos", form);
    servicos.innerHTML = "";
    servicos.appendChild(el("legend", "sr", "Serviço"));
    servicos.appendChild(el("p", "etapa__aviso", "Carregando os serviços…"));
    var extras = $('input[name="extras"]', form).closest("fieldset");
    extras.hidden = true;

    PatynhasAPI.criar({ demo: querDemo }).then(function (a) {
      api = a;
      return Promise.all([api.servicosPublicos(), api.horariosSemana()]);
    }).then(function (r) {
      catalogo = r[0];
      abertos = {};
      r[1].forEach(function (f) { abertos[f.dia_semana] = true; });
      desenharServicos();
      desenharExtras();
      if (passo === 3) carregarLivres();
    }).catch(function (e) {
      console.error(e);
      servicos.innerHTML = "";
      var aviso = el("p", "etapa__aviso", "Não conseguimos carregar a agenda agora. Tente de novo em instantes" + (temWhats ? " ou fale com a gente pelo WhatsApp." : "."));
      servicos.appendChild(aviso);
      if (temWhats) {
        var a = el("a", "btn btn--linha", "Agendar pelo WhatsApp");
        a.href = linkWhats(C.mensagemPadrao || "Olá! Gostaria de agendar um horário.");
        a.target = "_blank"; a.rel = "noopener";
        servicos.appendChild(a);
      }
    });
  }

  function desenharServicos() {
    if (!catalogo) return;
    var caixa = $(".escolha--servicos", form);
    var atual = valor("servico") || salvoServico;
    var p = porteAtual();
    caixa.innerHTML = "";
    caixa.appendChild(el("legend", "sr", "Serviço"));
    var lista = catalogo.servicos.filter(function (s) { return s.portes[p]; });
    if (!lista.length) {
      caixa.appendChild(el("p", "etapa__aviso", "Ainda não temos serviços para esse porte pelo site. Fale com a gente pelo WhatsApp."));
      return;
    }
    lista.forEach(function (s) {
      var info = s.portes[p];
      var label = el("label", "cartao");
      var input = el("input");
      input.type = "radio"; input.name = "servico"; input.value = s.id;
      input.checked = String(s.id) === String(atual);
      var c = el("span", "cartao__corpo");
      c.appendChild(el("span", "cartao__nome", s.nome));
      if (s.descricao) c.appendChild(el("span", "cartao__desc", s.descricao));
      c.appendChild(el("span", "cartao__preco", "Cerca de " + duracaoBonita(info.minutos) + (info.preco != null ? ", " + moeda.format(info.preco) : "")));
      label.appendChild(input); label.appendChild(c);
      caixa.appendChild(label);
    });
    salvoServico = null;
  }

  function desenharExtras() {
    var input0 = $('input[name="extras"]', form);
    var fs = input0 ? input0.closest("fieldset") : $("[data-extras-online]", form);
    if (!fs || !catalogo) return;
    fs.setAttribute("data-extras-online", "");
    var legenda = fs.querySelector("legend");
    var marcadosAntes = marcados("extras").concat(salvoExtras);
    $$("label.chip", fs).forEach(function (l) { l.remove(); });
    catalogo.extras.forEach(function (e) {
      var label = el("label", "chip");
      var input = el("input");
      input.type = "checkbox"; input.name = "extras"; input.value = e.id;
      input.checked = marcadosAntes.indexOf(String(e.id)) > -1;
      label.appendChild(input);
      label.appendChild(el("span", null, e.nome + (e.preco != null ? " (+" + moeda.format(e.preco) + ")" : "")));
      fs.appendChild(label);
    });
    fs.hidden = !catalogo.extras.length;
    if (legenda) fs.insertBefore(legenda, fs.firstChild);
    salvoExtras = [];
  }

  function carregarLivres() {
    var aviso = $("[data-aviso-horarios]");
    var sid = valor("servico");
    if (!api || !sid) return;
    var extras = marcados("extras").map(Number);
    var chave = [sid, porteAtual(), extras.join(",")].join("|");
    if (chave === chaveLivres) { montarDiasOnline(); return; }
    aviso.hidden = false;
    aviso.textContent = "Procurando horários livres…";
    $("[data-dias]").innerHTML = "";
    $("[data-horas]").hidden = true;
    api.disponibilidade({ servicoId: Number(sid), porte: porteAtual(), extras: extras }).then(function (l) {
      livres = {};
      l.forEach(function (x) { (livres[x.data] = livres[x.data] || []).push(x.hora); });
      chaveLivres = chave;
      aviso.hidden = l.length > 0;
      if (!l.length) aviso.textContent = "Não há horários livres nos próximos dias para esse serviço." + (temWhats ? " Fale com a gente pelo WhatsApp que damos um jeito." : "");
      montarDiasOnline();
    }).catch(function (e) {
      console.error(e);
      aviso.textContent = "Não conseguimos buscar os horários agora. Tente de novo em instantes.";
    });
  }

  function montarDiasOnline() {
    var caixa = $("[data-dias]");
    var escolhido = valor("dia");
    caixa.innerHTML = "";
    var datas = Object.keys(livres).sort();
    var base = new Date(); base.setHours(0, 0, 0, 0);
    var ultimo = datas.length ? deIso(datas[datas.length - 1]) : base;
    var total = Math.min(45, Math.max(DIAS_NO_CALENDARIO, Math.round((ultimo - base) / 86400000) + 1));
    for (var i = 0; i < total; i++) {
      var d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      var chave = iso(d);
      var tem = (livres[chave] || []).length > 0;
      var aberto = !abertos || abertos[d.getDay()];
      var rotulo = tem ? MESES[d.getMonth()].slice(0, 3) : !aberto ? "fechado" : i === 0 ? "encerrado" : "lotado";
      caixa.appendChild(diaEl(d, i, !tem, rotulo, tem ? "" : ", " + rotulo, chave === escolhido && tem));
    }
    if (escolhido && (livres[escolhido] || []).length) desenharHoras(escolhido);
    else $("[data-horas]").hidden = true;
  }

  function desenharHoras(dia) {
    var caixa = $("[data-horas-lista]");
    var atual = valor("hora");
    caixa.innerHTML = "";
    var grupos = [["Manhã", function (h) { return h < "12:00"; }], ["Tarde", function (h) { return h >= "12:00"; }]];
    var n = 0;
    grupos.forEach(function (g) {
      var horas = (livres[dia] || []).filter(g[1]);
      if (!horas.length) return;
      var bloco = el("div", "horas__grupo");
      bloco.appendChild(el("h3", null, g[0]));
      var lista = el("div", "horas__lista" + (semMovimento ? "" : " is-entrando"));
      horas.forEach(function (h) {
        var label = el("label", "chip");
        label.style.setProperty("--i", n++);
        var input = el("input");
        input.type = "radio"; input.name = "hora"; input.value = h;
        input.checked = h === atual;
        input.setAttribute("aria-label", horaBonita(minutos(h)));
        label.appendChild(input);
        label.appendChild(el("span", null, horaBonita(minutos(h))));
        lista.appendChild(label);
      });
      bloco.appendChild(lista);
      caixa.appendChild(bloco);
    });
    $("[data-horas]").hidden = false;
  }

  function arquivoIcs(res, d) {
    function utc(s) { return new Date(s).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
    var e = C.endereco || {};
    var local = [e.rua, e.bairro, e.cidade, e.uf].filter(Boolean).join(", ");
    var linhas = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Patynhas Pet Mel//Agenda//PT", "BEGIN:VEVENT",
      "UID:" + res.codigo + "@patynhaspetmel", "DTSTAMP:" + utc(new Date().toISOString()),
      "DTSTART:" + utc(res.inicio), "DTEND:" + utc(res.fim),
      "SUMMARY:Patynhas Pet Mel: " + (res.servico || "") + " do(a) " + d.pet,
      "DESCRIPTION:Código do agendamento " + res.codigo,
      local ? "LOCATION:" + local.replace(/,/g, "\\,") : null,
      "END:VEVENT", "END:VCALENDAR",
    ].filter(Boolean);
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(linhas.join("\r\n"));
  }

  function mostrarConfirmado(res, d) {
    corpo.hidden = true;
    progresso.hidden = true;
    prontoOnline.hidden = false;
    var ini = new Date(res.inicio);
    var quandoTxt = DIAS[ini.getDay()] + ", " + ini.getDate() + " de " + MESES[ini.getMonth()] + ", às " + horaBonita(ini.getHours() * 60 + ini.getMinutes());
    $("[data-ok-texto]", prontoOnline).textContent =
      "Te esperamos " + quandoTxt + " para o " + (res.servico || "atendimento").toLowerCase() + " do(a) " + d.pet + ".";
    $("[data-ok-codigo]", prontoOnline).textContent = res.codigo;
    $("[data-ok-ics]", prontoOnline).href = arquivoIcs(res, d);
    var w = $("[data-ok-whats]", prontoOnline);
    if (temWhats) {
      w.hidden = false;
      w.href = linkWhats("Olá, Patynhas Pet Mel! Acabei de agendar pelo site: " + d.pet + ", " + quandoTxt + ". Código " + res.codigo + ".");
    }
    history.pushState({ pronto: true }, "", "#agendado");
    window.scrollTo({ top: 0, behavior: "auto" });
    $("h2", prontoOnline).focus({ preventScroll: true });
  }

  /* =====================================================================
     MODO WHATSAPP: calendário a partir dos horários do config.js
     ===================================================================== */

  function diaEl(d, i, bloqueado, rotulo, sufixoAria, marcado) {
    var label = el("label", "dia" + (i === 0 ? " dia--hoje" : ""));
    label.style.setProperty("--i", i);
    var input = el("input");
    input.type = "radio";
    input.name = "dia";
    input.value = iso(d);
    input.disabled = bloqueado;
    input.checked = !!marcado;
    input.setAttribute("aria-label", capitalizar(DIAS[d.getDay()]) + ", " + d.getDate() + " de " + MESES[d.getMonth()] + (sufixoAria || ""));
    var c = el("span", "dia__corpo");
    c.setAttribute("aria-hidden", "true");
    c.appendChild(el("span", "dia__semana", i === 0 ? "hoje" : i === 1 ? "amanhã" : DIAS_CURTO[d.getDay()]));
    c.appendChild(el("span", "dia__num", d.getDate()));
    c.appendChild(el("span", "dia__mes", rotulo));
    label.appendChild(input);
    label.appendChild(c);
    return label;
  }

  function montarDias() {
    var caixa = $("[data-dias]");
    caixa.innerHTML = "";
    var base = new Date();
    for (var i = 0; i < DIAS_NO_CALENDARIO; i++) {
      var d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      var h = horarios[d.getDay()];
      var fechado = temHorarios && !h;
      var encerrado = i === 0 && h && agoraEmMinutos() >= minutos(h.fecha) - 60;
      caixa.appendChild(diaEl(d, i, fechado || encerrado,
        fechado ? "fechado" : encerrado ? "encerrado" : MESES[d.getMonth()].slice(0, 3),
        fechado ? ", fechado" : encerrado ? ", atendimento encerrado hoje" : ""));
    }
  }

  /* Manhã e tarde mostram a faixa de horário do dia escolhido */
  function atualizarPeriodos() {
    if (online) return;
    var escolhido = $("input[name=dia]:checked", form);
    var campos = { "manhã": $('input[name=periodo][value="manhã"]', form), "tarde": $('input[name=periodo][value="tarde"]', form) };
    var faixas = { "manhã": $('[data-faixa="manhã"]', form), "tarde": $('[data-faixa="tarde"]', form) };
    var h = escolhido ? horarios[deIso(escolhido.value).getDay()] : null;
    if (!h) {
      faixas["manhã"].textContent = "antes do almoço";
      faixas["tarde"].textContent = "depois do almoço";
      campos["manhã"].disabled = campos["tarde"].disabled = false;
      return;
    }
    var abre = minutos(h.abre), fecha = minutos(h.fecha), meio = 12 * 60;
    var ehHoje = escolhido.value === hojeIso();
    var agora = agoraEmMinutos();
    var livre = {
      "manhã": abre < meio && (!ehHoje || agora < Math.min(meio, fecha) - 60),
      "tarde": fecha > meio && (!ehHoje || agora < fecha - 60),
    };
    faixas["manhã"].textContent = abre < meio ? horaBonita(abre) + " às " + horaBonita(Math.min(meio, fecha)) : "fechado neste dia";
    faixas["tarde"].textContent = fecha > meio ? horaBonita(Math.max(meio, abre)) + " às " + horaBonita(fecha) : "fechado neste dia";
    ["manhã", "tarde"].forEach(function (p) {
      if (abre < meio && p === "manhã" && !livre[p]) faixas[p].textContent = "encerrado hoje";
      if (fecha > meio && p === "tarde" && !livre[p]) faixas[p].textContent = "encerrado hoje";
      campos[p].disabled = !livre[p];
      if (!livre[p]) campos[p].checked = false;
    });
  }

  /* ---------- Dados do formulário ---------- */

  function marcados(nome) {
    return $$('input[name="' + nome + '"]:checked', form).map(function (i) { return i.value; });
  }
  function valor(nome) {
    var e = form.elements[nome];
    if (!e) return "";
    if (e instanceof RadioNodeList || (e.length > 1 && !e.tagName)) return marcados(nome)[0] || "";
    if (e.type === "radio" || e.type === "checkbox") return e.checked ? e.value : "";
    return (e.value || "").trim();
  }

  function dados() {
    return {
      pet: valor("pet"),
      especie: valor("especie"),
      porte: valor("porte"),
      pelo: valor("pelo"),
      raca: valor("raca"),
      servico: valor("servico"),
      extras: marcados("extras"),
      dia: valor("dia"),
      periodo: valor("periodo"),
      hora: valor("hora"),
      tutor: valor("tutor"),
      telefone: valor("telefone"),
      notas: marcados("notas"),
      obs: valor("obs"),
    };
  }

  function nomeServico(d) {
    if (!online) return d.servico;
    var s = servicoPorId(d.servico);
    return s ? s.nome : "";
  }
  function nomesExtras(d) {
    if (!online) return d.extras;
    return extrasPorIds(d.extras).map(function (e) { return e.nome.toLowerCase(); });
  }

  function perfil(d) {
    var partes = [d.especie || "cachorro"];
    if (d.especie !== "gato" && d.porte) partes.push("porte " + d.porte);
    if (d.pelo) partes.push("pelo " + d.pelo);
    return partes.join(", ");
  }
  function quando(d) {
    if (!d.dia) return "";
    var dt = deIso(d.dia);
    var s = DIAS[dt.getDay()] + ", " + doisDigitos(dt.getDate()) + "/" + doisDigitos(dt.getMonth() + 1);
    if (online && d.hora) s += ", às " + horaBonita(minutos(d.hora));
    else if (!online && d.periodo) s += ", de " + d.periodo;
    return s;
  }
  function observacoes(d) {
    var obs = d.notas.slice();
    if (d.obs) obs.push(d.obs);
    return obs.length ? capitalizar(obs.join("; ")) : "";
  }

  function mensagem(d) {
    var linhas = ["Olá, Patynhas Pet Mel! Gostaria de agendar um horário.", ""];
    linhas.push("*Pet:* " + d.pet + " (" + perfil(d) + ")");
    if (d.raca) linhas.push("*Raça:* " + d.raca);
    linhas.push("*Serviço:* " + nomeServico(d));
    if (d.extras.length) linhas.push("*Extras:* " + nomesExtras(d).join(", "));
    linhas.push("*Preferência:* " + quando(d));
    if (observacoes(d)) linhas.push("*Observações:* " + observacoes(d));
    if (d.tutor) linhas.push("*Tutor(a):* " + d.tutor);
    return linhas.join("\n");
  }

  /* ---------- Ficha do pet ---------- */

  function atualizarFicha() {
    var d = dados();
    var ext = nomesExtras(d);
    var valores = {
      pet: d.pet,
      perfil: d.pet || d.especie ? capitalizar(perfil(d)) + (d.raca ? ". " + d.raca : "") : "",
      servico: nomeServico(d),
      extras: ext.length ? capitalizar(ext.join(", ")) : "",
      quando: quando(d) ? capitalizar(quando(d)) : "",
    };
    $$("[data-f]", ficha).forEach(function (dd) {
      var v = valores[dd.dataset.f] || "";
      var texto = v || "—";
      if (dd.textContent === texto) return;
      dd.textContent = texto;
      dd.classList.toggle("is-vazio", !v);
      if (v) {
        dd.classList.remove("is-novo");
        void dd.offsetWidth; // reinicia a animação de realce
        dd.classList.add("is-novo");
      }
    });
    $$("[data-nome-pet]").forEach(function (x) { x.textContent = d.pet || "ele"; });
  }

  function atualizarPorte() {
    $("[data-porte]", form).hidden = valor("especie") === "gato";
  }

  /* ---------- Validação ---------- */

  function erro(id, mostrar, campo) {
    var p = document.getElementById(id);
    p.hidden = !mostrar;
    if (campo) {
      if (mostrar) campo.setAttribute("aria-invalid", "true");
      else campo.removeAttribute("aria-invalid");
    }
    return !mostrar;
  }

  function validar(n) {
    if (n === 1) {
      var pet = form.elements.pet;
      if (!erro("a-pet-erro", !pet.value.trim(), pet)) { pet.focus(); return false; }
    }
    if (n === 2) {
      if (!erro("a-servico-erro", !valor("servico"))) {
        var s = $("input[name=servico]", form);
        if (s) s.focus();
        return false;
      }
    }
    if (n === 3) {
      var semDia = !valor("dia");
      erro("a-dia-erro", semDia);
      if (semDia) { var d1 = $("input[name=dia]:not(:disabled)", form); if (d1) d1.focus(); return false; }
      if (online) {
        if (!erro("a-hora-erro", !valor("hora"))) { var h1 = $("input[name=hora]", form); if (h1) h1.focus(); return false; }
      } else {
        if (!erro("a-periodo-erro", !valor("periodo"))) { var p1 = $("input[name=periodo]:not(:disabled)", form); if (p1) p1.focus(); return false; }
      }
    }
    if (n === 4 && online) {
      var tutor = form.elements.tutor, tel = form.elements.telefone;
      var digitos = tel.value.replace(/\D/g, "");
      var okTutor = erro("a-tutor-erro", !tutor.value.trim(), tutor);
      var okTel = erro("a-tel-erro", digitos.length < 10 || digitos.length > 13, tel);
      if (!okTutor) { tutor.focus(); return false; }
      if (!okTel) { tel.focus(); return false; }
    }
    return true;
  }

  /* ---------- Troca de etapa ---------- */

  function atualizarProgresso() {
    progresso.style.setProperty("--p", (passo - 1) / (TOTAL - 1));
    botoesProgresso.forEach(function (b) {
      var n = Number(b.dataset.ir);
      var li = b.parentNode;
      li.classList.toggle("is-atual", n === passo);
      li.classList.toggle("is-feito", n < passo || (n !== passo && n < alcancado));
      b.disabled = n > alcancado || n === passo;
      if (n === passo) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
    btnVoltar.hidden = passo === 1;
    btnAvancar.hidden = passo === TOTAL;
    btnEnviar.hidden = passo !== TOTAL;
    pagina.dataset.passo = passo;
  }

  var animacao = null;
  function trocar(de, para, frente) {
    if (animacao) { animacao.cancel(); animacao = null; }
    etapas.forEach(function (e) { e.hidden = e !== de; });
    if (de === para) return;
    if (semMovimento || !de.animate) {
      de.hidden = true;
      para.hidden = false;
      return;
    }
    var dx = frente ? 36 : -36;
    animacao = de.animate(
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(" + -dx + "px)" }],
      { duration: 170, easing: "ease-in" }
    );
    animacao.onfinish = function () {
      de.hidden = true;
      para.hidden = false;
      animacao = para.animate(
        [{ opacity: 0, transform: "translateX(" + dx + "px)" }, { opacity: 1, transform: "none" }],
        { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
      animacao.onfinish = function () { animacao = null; };
    };
  }

  function mostrar(n, opcoes) {
    opcoes = opcoes || {};
    n = Math.max(1, Math.min(TOTAL, n));
    var de = etapas[passo - 1];
    var para = etapas[n - 1];
    var frente = n > passo;
    passo = n;
    alcancado = Math.max(alcancado, n);
    atualizarProgresso();
    trocar(de, para, frente);

    if (online && n === 2) desenharServicos();
    if (online && n === 3) carregarLivres();
    if (n === 3 && !semMovimento) {
      var dias = $("[data-dias]");
      dias.classList.remove("is-entrando");
      void dias.offsetWidth;
      dias.classList.add("is-entrando");
    }

    if (!opcoes.semHistorico) history.pushState({ passo: n }, "", "#etapa-" + n);
    if (!opcoes.semFoco) {
      setTimeout(function () {
        var topo = progresso.getBoundingClientRect().top;
        if (topo < 0 || topo > window.innerHeight * 0.6) {
          window.scrollTo({ top: window.scrollY + topo - 90, behavior: semMovimento ? "auto" : "smooth" });
        }
        $("h2", para).focus({ preventScroll: true });
      }, semMovimento ? 0 : 200);
    }
    salvar();
  }

  function avancar() {
    if (validar(passo)) mostrar(passo + 1);
  }

  /* ---------- Guardar o que já foi preenchido (só nesta aba) ---------- */

  function salvar() {
    try {
      var d = dados();
      d.passo = passo;
      d.alcancado = alcancado;
      d.online = online;
      sessionStorage.setItem(CHAVE, JSON.stringify(d));
    } catch (e) { /* sem armazenamento: tudo bem */ }
  }

  function restaurar() {
    var d;
    try { d = JSON.parse(sessionStorage.getItem(CHAVE) || "null"); } catch (e) { d = null; }
    if (!d || !!d.online !== online) return;
    ["pet", "raca", "tutor", "telefone", "obs"].forEach(function (k) { if (d[k] && form.elements[k]) form.elements[k].value = d[k]; });
    var radios = online ? ["especie", "porte", "pelo"] : ["especie", "porte", "pelo", "servico", "dia", "periodo"];
    radios.forEach(function (k) {
      if (!d[k]) return;
      var x = $('input[name="' + k + '"][value="' + d[k] + '"]', form);
      if (x && !x.disabled) x.checked = true;
    });
    (d.notas || []).forEach(function (v) { var x = $('input[name="notas"][value="' + v + '"]', form); if (x) x.checked = true; });
    if (online) {
      // serviços e extras chegam do banco depois; dia e hora são escolhidos de novo
      salvoServico = d.servico || null;
      salvoExtras = d.extras || [];
    } else {
      (d.extras || []).forEach(function (v) { var x = $('input[name="extras"][value="' + v + '"]', form); if (x) x.checked = true; });
      atualizarPeriodos();
      if (d.periodo) { var p = $('input[name="periodo"][value="' + d.periodo + '"]', form); if (p && !p.disabled) p.checked = true; }
    }
    alcancado = Math.max(1, Math.min(online ? 2 : TOTAL, d.alcancado || 1));
    var alvo = Math.max(1, Math.min(online ? 2 : TOTAL, d.passo || 1));
    var atual = dados();
    var ok = { 1: !!atual.pet, 2: !!atual.servico, 3: !!(atual.dia && atual.periodo) };
    for (var k = 1; k < alvo; k++) { if (!ok[k]) { alvo = k; break; } }
    return alvo;
  }

  function limpar() {
    try { sessionStorage.removeItem(CHAVE); } catch (e) { /* ok */ }
  }

  /* ---------- Envio ---------- */

  function mostrarPronto(texto) {
    corpo.hidden = true;
    progresso.hidden = true;
    pronto.hidden = false;
    // prévia: os *asteriscos* do WhatsApp viram negrito
    var pre = $("[data-pronto-mensagem]", pronto);
    pre.textContent = "";
    texto.split("\n").forEach(function (linha, i) {
      if (i) pre.appendChild(document.createTextNode("\n"));
      var m = linha.match(/^\*(.+?)\*\s?(.*)$/);
      if (m) {
        pre.appendChild(el("strong", null, m[1]));
        pre.appendChild(document.createTextNode(" " + m[2]));
      } else {
        pre.appendChild(document.createTextNode(linha));
      }
    });
    var link = $("[data-pronto-link]", pronto);
    if (temWhats) {
      link.href = linkWhats(texto);
      link.hidden = false;
    } else {
      link.hidden = true;
      $("[data-pronto-texto]", pronto).textContent =
        "O número de WhatsApp ainda não foi configurado no site (js/config.js). Esta é a mensagem que seria enviada:";
    }
    history.pushState({ pronto: true }, "", "#pronto");
    window.scrollTo({ top: 0, behavior: "auto" });
    $("h2", pronto).focus({ preventScroll: true });
  }

  function esconderPronto() {
    pronto.hidden = true;
    prontoOnline.hidden = true;
    corpo.hidden = false;
    progresso.hidden = false;
    ficha.classList.remove("is-carimbada");
  }

  var erroEnvio = $("[data-erro-envio]");
  var MENSAGENS = {
    limite_cliente: "Esse telefone já tem 3 agendamentos marcados. Para marcar mais, fale com a gente.",
    dados_invalidos: "Confira seu nome, o telefone com DDD e o nome do pet.",
    servico_indisponivel: "Esse serviço não está disponível para o porte escolhido. Volte e escolha outro.",
    rede: "Sem conexão. Confira a internet e tente de novo.",
  };

  function enviarOnline() {
    var d = dados();
    erroEnvio.hidden = true;
    btnEnviar.disabled = true;
    var rotulo = btnEnviar.lastChild.textContent;
    btnEnviar.lastChild.textContent = " Agendando…";
    api.agendar({
      nome: d.tutor,
      telefone: d.telefone,
      pet: { nome: d.pet, especie: d.especie || "cachorro", porte: porteAtual(), pelo: semAcento(d.pelo) || null, raca: d.raca || null },
      servicoId: Number(d.servico),
      extras: d.extras.map(Number),
      inicio: d.dia + " " + d.hora,
      observacoes: observacoes(d),
    }).then(function (res) {
      form.dispatchEvent(new CustomEvent("patynhas:enviar", { bubbles: true }));
      ficha.classList.add("is-carimbada");
      limpar();
      chaveLivres = null;
      setTimeout(function () { mostrarConfirmado(res, d); }, semMovimento ? 0 : 1000);
    }).catch(function (e) {
      if (e.codigo === "horario_indisponivel") {
        chaveLivres = null;
        var h = $("input[name=hora]:checked", form); if (h) h.checked = false;
        mostrar(3);
        var aviso = $("[data-aviso-horarios]");
        setTimeout(function () {
          aviso.hidden = false;
          aviso.textContent = "Esse horário acabou de ser reservado por outra pessoa. Escolha outro, por favor.";
        }, 400);
      } else {
        erroEnvio.textContent = MENSAGENS[e.codigo] || "Não foi possível agendar agora. Tente de novo em instantes.";
        erroEnvio.hidden = false;
      }
    }).then(function () {
      btnEnviar.disabled = false;
      btnEnviar.lastChild.textContent = rotulo;
    });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (passo < TOTAL) { avancar(); return; }
    for (var k = 1; k <= TOTAL; k++) {
      if (!validar(k)) { if (k < TOTAL) mostrar(k); return; }
    }
    if (online) { enviarOnline(); return; }
    var texto = mensagem(dados());
    form.dispatchEvent(new CustomEvent("patynhas:enviar", { bubbles: true }));
    if (temWhats) window.open(linkWhats(texto), "_blank", "noopener");
    else console.warn("[Patynhas] Configure o número de WhatsApp em js/config.js");
    ficha.classList.add("is-carimbada");
    limpar();
    setTimeout(function () { mostrarPronto(texto); }, semMovimento ? 0 : 1100);
  });

  /* ---------- Eventos ---------- */

  form.addEventListener("input", aoMudar);
  form.addEventListener("change", aoMudar);
  function aoMudar(ev) {
    var nome = ev.target.name;
    if (nome === "especie") atualizarPorte();
    if (online && (nome === "especie" || nome === "porte" || nome === "servico" || nome === "extras")) {
      chaveLivres = null;
      var d0 = $("input[name=dia]:checked", form); if (d0) d0.checked = false;
      var h0 = $("input[name=hora]:checked", form); if (h0) h0.checked = false;
    }
    if (nome === "dia") {
      erro("a-dia-erro", false);
      if (online) { desenharHoras(ev.target.value); $("[data-aviso-horarios]").hidden = true; }
      else atualizarPeriodos();
    }
    if (nome === "hora") erro("a-hora-erro", false);
    if (nome === "periodo") erro("a-periodo-erro", false);
    if (nome === "servico") erro("a-servico-erro", false);
    if (nome === "pet" && ev.target.value.trim()) erro("a-pet-erro", false, ev.target);
    if (nome === "tutor" && ev.target.value.trim()) erro("a-tutor-erro", false, ev.target);
    if (nome === "telefone" && ev.target.value.replace(/\D/g, "").length >= 10) erro("a-tel-erro", false, ev.target);
    atualizarFicha();
    salvar();
  }

  // Enter num campo de texto avança em vez de enviar
  form.addEventListener("keydown", function (ev) {
    if (ev.key !== "Enter" || ev.target.tagName === "TEXTAREA" || ev.target.tagName === "BUTTON") return;
    ev.preventDefault();
    if (passo < TOTAL) avancar();
  });

  btnAvancar.addEventListener("click", avancar);
  btnVoltar.addEventListener("click", function () {
    if (history.state && history.state.passo === passo && passo > 1) history.back();
    else mostrar(passo - 1);
  });

  botoesProgresso.forEach(function (b) {
    b.addEventListener("click", function () {
      var n = Number(b.dataset.ir);
      if (n > alcancado || n === passo) return;
      for (var k = Math.min(passo, n); k < n; k++) {
        if (!validar(k)) { mostrar(k); return; }
      }
      mostrar(n);
    });
  });

  window.addEventListener("popstate", function (ev) {
    var s = ev.state || {};
    if (s.pronto) return;
    if (!pronto.hidden || !prontoOnline.hidden) esconderPronto();
    mostrar(s.passo || 1, { semHistorico: true });
  });

  $$("[data-novo]").forEach(function (b) {
    b.addEventListener("click", function () {
      form.reset();
      limpar();
      esconderPronto();
      alcancado = 1;
      chaveLivres = null;
      atualizarPorte();
      if (online) desenharServicos(); else atualizarPeriodos();
      atualizarFicha();
      mostrar(1);
    });
  });

  /* ---------- Início ---------- */

  if (online) prepararOnline();
  else montarDias();
  var inicio = restaurar() || 1;
  atualizarPorte();
  atualizarPeriodos();
  atualizarFicha();
  etapas.forEach(function (e, i) { e.hidden = i !== inicio - 1; });
  passo = inicio;
  atualizarProgresso();
  history.replaceState({ passo: passo }, "", "#etapa-" + passo);
})();
