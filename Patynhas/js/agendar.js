/*
  Página "Agendar horário": passo a passo em 4 etapas.
  Os dias e períodos disponíveis vêm dos horários em js/config.js.
  No fim, a mensagem abre pronta no WhatsApp do cliente.
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

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function capitalizar(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function doisDigitos(n) { return String(n).padStart(2, "0"); }

  var numero = String(C.whatsapp || "").replace(/\D/g, "");
  var temWhats = numero.length >= 12;
  function linkWhats(texto) { return "https://wa.me/" + numero + "?text=" + encodeURIComponent(texto); }

  /* ---------- Horários ---------- */

  var horarios = {};
  (C.horarios || []).forEach(function (h) { horarios[h.dia] = h; });
  var temHorarios = Object.keys(horarios).length > 0;

  function minutos(hhmm) {
    var p = hhmm.split(":");
    return Number(p[0]) * 60 + Number(p[1] || 0);
  }
  function horaBonita(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + "h" + (m ? doisDigitos(m) : "");
  }
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
  var passo = 1;
  var alcancado = 1;

  /* ---------- Calendário ---------- */

  function montarDias() {
    var caixa = $("[data-dias]");
    caixa.innerHTML = "";
    var base = new Date();
    for (var i = 0; i < DIAS_NO_CALENDARIO; i++) {
      var d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      var h = horarios[d.getDay()];
      var fechado = temHorarios && !h;
      var encerrado = i === 0 && h && agoraEmMinutos() >= minutos(h.fecha) - 60;

      var label = document.createElement("label");
      label.className = "dia" + (i === 0 ? " dia--hoje" : "");
      label.style.setProperty("--i", i);

      var input = document.createElement("input");
      input.type = "radio";
      input.name = "dia";
      input.value = iso(d);
      input.disabled = fechado || encerrado;
      input.setAttribute("aria-label",
        capitalizar(DIAS[d.getDay()]) + ", " + d.getDate() + " de " + MESES[d.getMonth()] +
        (fechado ? ", fechado" : encerrado ? ", atendimento encerrado hoje" : ""));

      var c = document.createElement("span");
      c.className = "dia__corpo";
      c.setAttribute("aria-hidden", "true");
      c.innerHTML =
        '<span class="dia__semana">' + (i === 0 ? "hoje" : i === 1 ? "amanhã" : DIAS_CURTO[d.getDay()]) + "</span>" +
        '<span class="dia__num">' + d.getDate() + "</span>" +
        '<span class="dia__mes">' + (fechado ? "fechado" : encerrado ? "encerrado" : MESES[d.getMonth()].slice(0, 3)) + "</span>";

      label.appendChild(input);
      label.appendChild(c);
      caixa.appendChild(label);
    }
  }

  /* Manhã e tarde mostram a faixa de horário do dia escolhido */
  function atualizarPeriodos() {
    var escolhido = $("input[name=dia]:checked", form);
    var campos = {
      "manhã": $('input[name=periodo][value="manhã"]', form),
      "tarde": $('input[name=periodo][value="tarde"]', form),
    };
    var faixas = {
      "manhã": $('[data-faixa="manhã"]', form),
      "tarde": $('[data-faixa="tarde"]', form),
    };
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
    var el = form.elements[nome];
    if (!el) return "";
    if (el instanceof RadioNodeList || el.length > 1) return marcados(nome)[0] || "";
    return (el.value || "").trim();
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
      tutor: valor("tutor"),
      notas: marcados("notas"),
      obs: valor("obs"),
    };
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
    if (d.periodo) s += ", de " + d.periodo;
    return s;
  }

  function mensagem(d) {
    var linhas = ["Olá, Patynhas Pet Mel! Gostaria de agendar um horário.", ""];
    linhas.push("*Pet:* " + d.pet + " (" + perfil(d) + ")");
    if (d.raca) linhas.push("*Raça:* " + d.raca);
    linhas.push("*Serviço:* " + d.servico);
    if (d.extras.length) linhas.push("*Extras:* " + d.extras.join(", "));
    linhas.push("*Preferência:* " + quando(d));
    var obs = d.notas.slice();
    if (d.obs) obs.push(d.obs);
    if (obs.length) linhas.push("*Observações:* " + capitalizar(obs.join("; ")));
    if (d.tutor) linhas.push("*Tutor(a):* " + d.tutor);
    return linhas.join("\n");
  }

  /* ---------- Ficha do pet ---------- */

  function atualizarFicha() {
    var d = dados();
    var valores = {
      pet: d.pet,
      perfil: d.pet || d.especie ? capitalizar(perfil(d)) + (d.raca ? ". " + d.raca : "") : "",
      servico: d.servico,
      extras: d.extras.length ? capitalizar(d.extras.join(", ")) : "",
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
    $$("[data-nome-pet]").forEach(function (el) { el.textContent = d.pet || "ele"; });
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
        $("input[name=servico]", form).focus();
        return false;
      }
    }
    if (n === 3) {
      var semDia = !valor("dia");
      var semPeriodo = !valor("periodo");
      erro("a-dia-erro", semDia);
      erro("a-periodo-erro", !semDia && semPeriodo);
      if (semDia) { var d1 = $("input[name=dia]:not(:disabled)", form); if (d1) d1.focus(); return false; }
      if (semPeriodo) { var p1 = $("input[name=periodo]:not(:disabled)", form); if (p1) p1.focus(); return false; }
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
      li.classList.toggle("is-feito", n < passo || (n <= alcancado && n !== passo && n < alcancado));
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
      sessionStorage.setItem(CHAVE, JSON.stringify(d));
    } catch (e) { /* sem armazenamento: tudo bem */ }
  }

  function restaurar() {
    var d;
    try { d = JSON.parse(sessionStorage.getItem(CHAVE) || "null"); } catch (e) { d = null; }
    if (!d) return;
    ["pet", "raca", "tutor", "obs"].forEach(function (k) { if (d[k]) form.elements[k].value = d[k]; });
    ["especie", "porte", "pelo", "servico", "dia", "periodo"].forEach(function (k) {
      if (!d[k]) return;
      var el = $('input[name="' + k + '"][value="' + d[k] + '"]', form);
      if (el && !el.disabled) el.checked = true;
    });
    ["extras", "notas"].forEach(function (k) {
      (d[k] || []).forEach(function (v) {
        var el = $('input[name="' + k + '"][value="' + v + '"]', form);
        if (el) el.checked = true;
      });
    });
    atualizarPeriodos();
    if (d.periodo) {
      var p = $('input[name="periodo"][value="' + d.periodo + '"]', form);
      if (p && !p.disabled) p.checked = true;
    }
    alcancado = Math.max(1, Math.min(TOTAL, d.alcancado || 1));
    // retoma na etapa salva, mas não pula uma etapa que ficou incompleta
    var alvo = Math.max(1, Math.min(TOTAL, d.passo || 1));
    var ok = { 1: !!dados().pet, 2: !!dados().servico, 3: !!(dados().dia && dados().periodo) };
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
        var b = document.createElement("strong");
        b.textContent = m[1];
        pre.appendChild(b);
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
    corpo.hidden = false;
    progresso.hidden = false;
    ficha.classList.remove("is-carimbada");
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (passo < TOTAL) { avancar(); return; }
    for (var k = 1; k < TOTAL; k++) {
      if (!validar(k)) { mostrar(k); return; }
    }
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
    if (nome === "dia") {
      atualizarPeriodos();
      erro("a-dia-erro", false);
    }
    if (nome === "periodo") erro("a-periodo-erro", false);
    if (nome === "servico") erro("a-servico-erro", false);
    if (nome === "pet" && ev.target.value.trim()) erro("a-pet-erro", false, ev.target);
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
    if (!pronto.hidden) esconderPronto();
    mostrar(s.passo || 1, { semHistorico: true });
  });

  $("[data-novo]", pronto).addEventListener("click", function () {
    form.reset();
    limpar();
    esconderPronto();
    alcancado = 1;
    atualizarPorte();
    atualizarPeriodos();
    atualizarFicha();
    mostrar(1);
  });

  /* ---------- Início ---------- */

  montarDias();
  var inicio = restaurar() || 1;
  atualizarPorte();
  atualizarPeriodos();
  atualizarFicha();
  etapas.forEach(function (e, i) { e.hidden = i !== inicio - 1; });
  passo = inicio;
  atualizarProgresso();
  history.replaceState({ passo: passo }, "", "#etapa-" + passo);
})();
