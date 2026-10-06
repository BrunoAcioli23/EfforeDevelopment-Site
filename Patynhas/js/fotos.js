/*
  Galeria (varal de polaroids) e Nosso espaço (mosaico).
  As fotos vêm de js/config.js. Sem fotos, aparecem molduras de exemplo.
  Clicar numa foto abre a foto ampliada, com comparação de antes e depois.
*/
(function () {
  "use strict";

  var C = window.PATYNHAS || {};
  var semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto) e.textContent = texto;
    return e;
  }
  function icone(id, classe) {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", classe || "");
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#" + id);
    svg.appendChild(use);
    return svg;
  }
  function imagem(src, alt, classe) {
    var img = el("img", classe);
    img.src = src;
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", function () {
      console.warn("[Patynhas] Não encontrei a foto: " + src + " (confira o nome do arquivo em js/config.js)");
      var caixa = img.closest("[data-foto]");
      if (caixa) caixa.classList.add("is-quebrada");
    });
    return img;
  }

  /* As fotos de cada grupo, para navegar na foto ampliada */
  var grupos = { galeria: [], espaco: [] };

  /* ---------- Galeria: varal de polaroids ---------- */

  var GIROS = [-3, 2.2, -1.4, 3, -2.4, 1.6, -2, 2.6];

  (function montarGaleria() {
    var lista = $("[data-galeria]");
    if (!lista) return;

    var fotos = (C.galeria || []).filter(function (f) { return f && (f.arquivo || f.depois); });
    var exemplo = fotos.length === 0;
    var itens = exemplo ? [1, 2, 3, 4, 5, 6, 7] : fotos;

    itens.forEach(function (f, i) {
      var li = el("li", "varal__item" + (!exemplo && f.formato === "deitada" ? " varal__item--deitada" : ""));
      li.style.setProperty("--rot", GIROS[i % GIROS.length] + "deg");
      li.style.setProperty("--dur", (3.2 + (i % 4) * 0.45) + "s");
      li.style.setProperty("--atraso", -(i * 0.7) + "s");

      // pedaço de fio até o próximo pregador
      if (i < itens.length - 1) {
        li.insertAdjacentHTML("beforeend",
          '<svg class="varal__fio" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">' +
          '<path d="M0 1Q50 19 100 1" vector-effect="non-scaling-stroke"/></svg>');
      }

      var cartao;
      if (exemplo) {
        cartao = el("div", "polaroid polaroid--exemplo");
        var fotoEx = el("span", "polaroid__foto");
        fotoEx.appendChild(icone(i % 3 === 1 ? "i-gato" : "i-cao", "polaroid__bicho"));
        cartao.appendChild(fotoEx);
        var legEx = el("span", "polaroid__legenda");
        legEx.appendChild(el("span", "polaroid__nome", "Foto em breve"));
        cartao.appendChild(legEx);
      } else {
        var nome = f.nome || f.legenda || "";
        var descricao = [f.nome, f.servico].filter(Boolean).join(", ") || f.legenda || "Pet atendido na Patynhas Pet Mel";
        cartao = el("button", "polaroid");
        cartao.type = "button";
        cartao.setAttribute("aria-label", "Ampliar foto: " + descricao + (f.antes ? ", antes e depois" : ""));
        cartao.dataset.abrir = "galeria";
        cartao.dataset.indice = grupos.galeria.length;

        var foto = el("span", "polaroid__foto");
        foto.setAttribute("data-foto", "");
        var principal = imagem(f.depois || f.arquivo, f.descricao || descricao);
        // foto deitada ganha polaroid deitada (detectado sozinho se não vier no config)
        principal.addEventListener("load", function () {
          if (principal.naturalWidth > principal.naturalHeight * 1.05) li.classList.add("varal__item--deitada");
        });
        foto.appendChild(principal);
        if (f.antes) {
          foto.appendChild(imagem(f.antes, "", "polaroid__antes"));
          foto.appendChild(el("span", "polaroid__selo", "antes e depois"));
        }
        cartao.appendChild(foto);

        var leg = el("span", "polaroid__legenda");
        if (nome) leg.appendChild(el("span", "polaroid__nome", nome));
        if (f.servico) leg.appendChild(el("span", "polaroid__servico", f.servico));
        cartao.appendChild(leg);

        grupos.galeria.push({ src: f.depois || f.arquivo, antes: f.antes, legenda: descricao });
      }
      cartao.insertBefore(el("span", "pregador"), cartao.firstChild);
      li.appendChild(cartao);
      lista.appendChild(li);
    });
  })();

  /* Varal: setas, arrastar com o mouse */
  (function varal() {
    var lista = $("[data-galeria]");
    var setas = $("[data-varal-setas]");
    if (!lista || !setas) return;
    var ant = $("[data-varal-ant]", setas);
    var prox = $("[data-varal-prox]", setas);

    function atualizar() {
      var sobra = lista.scrollWidth - lista.clientWidth;
      setas.hidden = sobra < 8;
      ant.disabled = lista.scrollLeft <= 4;
      prox.disabled = lista.scrollLeft >= sobra - 4;
    }
    function andar(dir) {
      lista.scrollBy({ left: dir * lista.clientWidth * 0.75, behavior: semMovimento ? "auto" : "smooth" });
    }
    ant.addEventListener("click", function () { andar(-1); });
    prox.addEventListener("click", function () { andar(1); });
    lista.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    window.addEventListener("load", atualizar);
    atualizar();

    var arraste = null;
    lista.addEventListener("pointerdown", function (ev) {
      if (ev.pointerType !== "mouse" || ev.button !== 0) return;
      arraste = { x: ev.clientX, inicio: lista.scrollLeft, moveu: false };
    });
    window.addEventListener("pointermove", function (ev) {
      if (!arraste) return;
      var dx = ev.clientX - arraste.x;
      if (!arraste.moveu && Math.abs(dx) < 6) return;
      arraste.moveu = true;
      lista.classList.add("is-arrastando");
      lista.scrollLeft = arraste.inicio - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!arraste) return;
      if (arraste.moveu) {
        // o clique que encerra o arraste não deve abrir a foto
        var bloquear = function (e) { e.stopPropagation(); e.preventDefault(); };
        lista.addEventListener("click", bloquear, true);
        setTimeout(function () {
          lista.removeEventListener("click", bloquear, true);
          lista.classList.remove("is-arrastando");
        }, 60);
      }
      arraste = null;
    });
  })();

  /* ---------- Nosso espaço: mosaico ---------- */

  var AMBIENTES = [
    { icone: "i-recepcao", legenda: "Recepção" },
    { icone: "i-banho", legenda: "Área de banho" },
    { icone: "i-tosa", legenda: "Mesa de tosa" },
    { icone: "i-secagem", legenda: "Secagem" },
    { icone: "i-espera", legenda: "Cantinho de espera" },
  ];

  (function montarEspaco() {
    var lista = $("[data-espaco]");
    if (!lista) return;
    var fotos = (C.espaco || []).filter(function (f) { return f && f.arquivo; });
    var exemplo = fotos.length === 0;
    var itens = exemplo ? AMBIENTES : fotos;

    itens.forEach(function (f, i) {
      var li = el("li", "mosaico__item" + (i === 0 ? " mosaico__item--destaque" : ""));
      var caixa;
      if (exemplo) {
        caixa = el("div", "mosaico__quadro mosaico__quadro--exemplo");
        caixa.appendChild(icone(f.icone, "mosaico__icone"));
      } else {
        var legenda = f.legenda || "Nosso espaço";
        caixa = el("button", "mosaico__quadro");
        caixa.type = "button";
        caixa.setAttribute("aria-label", "Ampliar foto: " + legenda);
        caixa.dataset.abrir = "espaco";
        caixa.dataset.indice = grupos.espaco.length;
        caixa.setAttribute("data-foto", "");
        caixa.appendChild(imagem(f.arquivo, legenda));
        grupos.espaco.push({ src: f.arquivo, legenda: legenda });
      }
      if (f.legenda) caixa.appendChild(el("span", "mosaico__legenda", f.legenda));
      li.appendChild(caixa);
      lista.appendChild(li);
    });
  })();

  /* ---------- Foto ampliada ---------- */

  (function lupa() {
    var dialogo = $("[data-lupa]");
    if (!dialogo || typeof dialogo.showModal !== "function") return;
    var palco = $("[data-lupa-palco]", dialogo);
    var legenda = $("[data-lupa-legenda]", dialogo);
    var contador = $("[data-lupa-contador]", dialogo);
    var btAnt = $("[data-lupa-ant]", dialogo);
    var btProx = $("[data-lupa-prox]", dialogo);
    var grupo = null, indice = 0;

    function comparador(item) {
      var c = el("div", "comparar");
      c.style.setProperty("--pos", "50%");
      c.appendChild(imagem(item.src, "Depois: " + item.legenda, "comparar__depois"));
      c.appendChild(imagem(item.antes, "Antes: " + item.legenda, "comparar__antes"));
      var linha = el("span", "comparar__linha");
      linha.setAttribute("aria-hidden", "true");
      linha.appendChild(el("span", "comparar__alca"));
      c.appendChild(linha);
      c.appendChild(el("span", "comparar__rotulo comparar__rotulo--antes", "Antes"));
      c.appendChild(el("span", "comparar__rotulo comparar__rotulo--depois", "Depois"));
      var faixa = el("input", "comparar__controle");
      faixa.type = "range";
      faixa.min = 0; faixa.max = 100; faixa.value = 50;
      faixa.setAttribute("aria-label", "Arraste para comparar antes e depois");
      faixa.addEventListener("input", function () { c.style.setProperty("--pos", faixa.value + "%"); });
      c.appendChild(faixa);

      // mostra que dá para arrastar: a linha passeia uma vez
      if (!semMovimento && c.animate) {
        setTimeout(function () {
          var t0 = performance.now();
          (function passo(agora) {
            var t = (agora - t0) / 1400;
            if (t >= 1 || document.activeElement === faixa) { c.style.setProperty("--pos", faixa.value + "%"); return; }
            var v = 50 + Math.sin(t * Math.PI * 2) * 22 * (1 - t);
            c.style.setProperty("--pos", v + "%");
            requestAnimationFrame(passo);
          })(t0);
        }, 450);
      }
      return c;
    }

    function mostrar(n, direcao) {
      var lista = grupos[grupo];
      indice = (n + lista.length) % lista.length;
      var item = lista[indice];
      var novo = item.antes ? comparador(item) : imagem(item.src, item.legenda, "lupa__img");
      palco.innerHTML = "";
      palco.appendChild(novo);
      // a legenda acompanha a largura da foto
      var rodape = legenda.parentNode;
      var ajustar = function () { rodape.style.maxWidth = novo.getBoundingClientRect().width + "px"; };
      if (novo.tagName === "IMG" && !novo.complete) novo.addEventListener("load", ajustar, { once: true });
      requestAnimationFrame(ajustar);
      legenda.textContent = item.legenda;
      contador.textContent = lista.length > 1 ? (indice + 1) + " de " + lista.length : "";
      btAnt.hidden = btProx.hidden = lista.length < 2;
      if (!semMovimento && novo.animate) {
        novo.animate(
          [{ opacity: 0, transform: "translateX(" + (direcao || 0) * 30 + "px) scale(" + (direcao ? 1 : 0.96) + ")" },
           { opacity: 1, transform: "none" }],
          { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" }
        );
      }
    }

    function abrir(g, i) {
      grupo = g;
      mostrar(i, 0);
      document.documentElement.classList.add("lupa-aberta");
      dialogo.classList.remove("is-fechando");
      dialogo.showModal();
    }
    function fechar() {
      if (!dialogo.open) return;
      if (semMovimento) { dialogo.close(); return; }
      dialogo.classList.add("is-fechando");
      setTimeout(function () { dialogo.close(); dialogo.classList.remove("is-fechando"); }, 180);
    }
    dialogo.addEventListener("close", function () {
      document.documentElement.classList.remove("lupa-aberta");
      palco.innerHTML = "";
    });
    dialogo.addEventListener("cancel", function (ev) { ev.preventDefault(); fechar(); });

    document.addEventListener("click", function (ev) {
      var alvo = ev.target.closest("[data-abrir]");
      if (alvo) abrir(alvo.dataset.abrir, Number(alvo.dataset.indice));
    });
    $("[data-lupa-fechar]", dialogo).addEventListener("click", fechar);
    btAnt.addEventListener("click", function () { mostrar(indice - 1, -1); });
    btProx.addEventListener("click", function () { mostrar(indice + 1, 1); });
    // clicar fora da foto fecha
    dialogo.addEventListener("click", function (ev) { if (ev.target === dialogo) fechar(); });
    dialogo.addEventListener("keydown", function (ev) {
      if (ev.target.classList && ev.target.classList.contains("comparar__controle")) return;
      if (ev.key === "ArrowLeft") { ev.preventDefault(); mostrar(indice - 1, -1); }
      if (ev.key === "ArrowRight") { ev.preventDefault(); mostrar(indice + 1, 1); }
    });

    // deslizar o dedo para trocar de foto
    var toque = null;
    palco.addEventListener("pointerdown", function (ev) {
      if (ev.target.classList.contains("comparar__controle")) return;
      toque = { x: ev.clientX, y: ev.clientY };
    });
    palco.addEventListener("pointerup", function (ev) {
      if (!toque) return;
      var dx = ev.clientX - toque.x, dy = ev.clientY - toque.y;
      toque = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && grupos[grupo].length > 1) {
        if (dx < 0) mostrar(indice + 1, 1); else mostrar(indice - 1, -1);
      }
    });
  })();
})();
