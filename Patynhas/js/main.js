(function () {
  "use strict";

  var C = window.PATYNHAS || {};
  var DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  var ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0];

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function capitalizar(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- WhatsApp ---------- */

  var numero = String(C.whatsapp || "").replace(/\D/g, "");
  var temWhats = numero.length >= 12;

  function linkWhats(texto) {
    return "https://wa.me/" + numero + "?text=" + encodeURIComponent(texto);
  }

  if (temWhats) {
    $$("[data-wa]").forEach(function (el) {
      el.href = linkWhats(el.dataset.waTexto || C.mensagemPadrao || "");
      el.target = "_blank";
      el.rel = "noopener";
    });
  } else {
    console.warn("[Patynhas] Configure o número de WhatsApp em js/config.js");
  }

  $$("[data-telefone]").forEach(function (el) { el.textContent = C.telefoneExibicao || ""; });

  /* ---------- Instagram ---------- */

  var insta = String(C.instagram || "").replace(/^@/, "").trim();
  if (insta) {
    $$("[data-insta-link]").forEach(function (el) {
      el.href = "https://www.instagram.com/" + insta + "/";
      el.target = "_blank";
      el.rel = "noopener";
      el.hidden = false;
    });
    $$("[data-insta-texto]").forEach(function (el) { el.textContent = "@" + insta; });
    $$("[data-insta-convite]").forEach(function (el) { el.textContent = "Ver @" + insta + " no Instagram"; });
  } else {
    $$("[data-insta-bloco]").forEach(function (el) { el.hidden = true; });
  }

  /* ---------- Endereço e mapa ---------- */

  var e = C.endereco || {};
  var enderecoCompleto = [e.rua, e.bairro, e.cidade + " - " + e.uf, e.cep].filter(Boolean).join(", ");

  $$("[data-endereco]").forEach(function (el) {
    el.innerHTML = "";
    el.appendChild(document.createTextNode([e.rua, e.bairro].filter(Boolean).join(" – ")));
    el.appendChild(document.createElement("br"));
    el.appendChild(document.createTextNode(e.cidade + " – " + e.uf + (e.cep ? ", " + e.cep : "")));
  });

  var mapa = $("[data-mapa]");
  var enderecoDeExemplo = /exemplo/i.test(e.rua || "");
  if (mapa && !enderecoDeExemplo) {
    mapa.src = "https://www.google.com/maps?q=" + encodeURIComponent(enderecoCompleto) + "&output=embed";
  } else if (mapa) {
    mapa.parentNode.hidden = true;
    $(".contato").classList.add("is-sem-mapa");
  }

  /* ---------- Horários ---------- */

  var horarios = {};
  (C.horarios || []).forEach(function (h) { horarios[h.dia] = h; });

  function minutos(hhmm) {
    var p = hhmm.split(":");
    return Number(p[0]) * 60 + Number(p[1] || 0);
  }
  function horaBonita(hhmm) {
    var p = hhmm.split(":");
    var h = String(Number(p[0]));
    return p[1] && p[1] !== "00" ? h + "h" + p[1] : h + "h";
  }

  var agora = new Date();
  var hoje = agora.getDay();

  var tbody = $("[data-horarios]");
  if (tbody) {
    ORDEM_SEMANA.forEach(function (d) {
      var tr = document.createElement("tr");
      var h = horarios[d];
      if (d === hoje) tr.className = "is-hoje";
      if (!h) tr.className += " is-fechado";
      var th = document.createElement("th");
      th.scope = "row";
      th.textContent = capitalizar(DIAS[d]) + (d === hoje ? " (hoje)" : "");
      var td = document.createElement("td");
      td.textContent = h ? horaBonita(h.abre) + " às " + horaBonita(h.fecha) : "Fechado";
      tr.appendChild(th);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
  }

  function proximaAbertura() {
    for (var i = 1; i <= 7; i++) {
      var d = (hoje + i) % 7;
      if (horarios[d]) {
        var quando = i === 1 ? "amanhã" : DIAS[d];
        return "Abre " + quando + " às " + horaBonita(horarios[d].abre);
      }
    }
    return "";
  }

  var status = $("[data-status]");
  if (status && C.horarios && C.horarios.length) {
    var hHoje = horarios[hoje];
    var m = agora.getHours() * 60 + agora.getMinutes();
    var texto;
    if (hHoje && m >= minutos(hHoje.abre) && m < minutos(hHoje.fecha)) {
      texto = "Aberto agora, até as " + horaBonita(hHoje.fecha);
      status.classList.add("is-aberto");
    } else if (hHoje && m < minutos(hHoje.abre)) {
      texto = "Abre hoje às " + horaBonita(hHoje.abre);
    } else {
      texto = "Fechado agora. " + proximaAbertura();
    }
    status.textContent = texto;
    status.hidden = false;
  }

  /* A galeria e o espaço ficam em js/fotos.js */

  /* ---------- Menu e topo ---------- */

  var menuBtn = $("[data-menu-btn]");
  var menu = $("[data-menu]");

  function fecharMenu() {
    menu.classList.remove("is-aberto");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.querySelector(".sr").textContent = "Abrir menu";
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      var abrir = menuBtn.getAttribute("aria-expanded") !== "true";
      menu.classList.toggle("is-aberto", abrir);
      menuBtn.setAttribute("aria-expanded", String(abrir));
      menuBtn.querySelector(".sr").textContent = abrir ? "Fechar menu" : "Abrir menu";
    });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", fecharMenu); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && menu.classList.contains("is-aberto")) { fecharMenu(); menuBtn.focus(); }
    });
  }

  var topo = $("[data-topo]");
  if (topo) {
    var aoRolar = function () { topo.classList.toggle("is-rolado", window.scrollY > 8); };
    window.addEventListener("scroll", aoRolar, { passive: true });
    aoRolar();
  }

  $$("[data-ano]").forEach(function (el) { el.textContent = agora.getFullYear(); });

  /* ---------- Dados estruturados para o Google ---------- */

  var DIAS_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var ld = {
    "@context": "https://schema.org",
    "@type": "PetStore",
    name: C.nome,
    image: new URL("assets/logo.png", location.href).href,
    url: location.origin + location.pathname,
    description: "Banho e tosa para cães e gatos, feitos com calma e carinho.",
    address: {
      "@type": "PostalAddress",
      streetAddress: e.rua,
      addressLocality: e.cidade,
      addressRegion: e.uf,
      postalCode: e.cep,
      addressCountry: "BR",
    },
    openingHoursSpecification: (C.horarios || []).map(function (h) {
      return { "@type": "OpeningHoursSpecification", dayOfWeek: DIAS_SCHEMA[h.dia], opens: h.abre, closes: h.fecha };
    }),
  };
  if (temWhats) ld.telephone = "+" + numero;
  if (insta) ld.sameAs = ["https://www.instagram.com/" + insta + "/"];
  var s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
})();
