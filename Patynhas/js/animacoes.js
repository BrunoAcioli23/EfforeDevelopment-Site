/*
  Animações do site Patynhas Pet Mel.
  Cada bloco é independente: se um falhar, o resto continua.
  Quem configura o sistema para "reduzir movimento" vê o site parado e completo.
*/
(function () {
  "use strict";

  var semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mouseFino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function limitar(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function aleatorio(a, b) { return a + Math.random() * (b - a); }
  function bloco(nome, fn) {
    try { fn(); } catch (err) { console.warn("[Patynhas] animação '" + nome + "' desligada:", err); }
  }

  var CORACAO = "M12 21s-7.5-4.6-10-9.3C.3 8.4 2 4 6 4c2.3 0 3.6 1.3 6 3.6C14.4 5.3 15.7 4 18 4c4 0 5.7 4.4 4 7.7C19.5 16.4 12 21 12 21z";
  var SVG_NS = "http://www.w3.org/2000/svg";

  /* ---------- Título principal sobe palavra por palavra ---------- */

  bloco("titulo", function () {
    if (semMovimento) return;
    var h1 = $(".hero h1");
    if (!h1) return;
    var texto = h1.textContent.trim().replace(/\s+/g, " ");
    h1.setAttribute("aria-label", texto);
    h1.textContent = "";
    texto.split(" ").forEach(function (p, i) {
      var fora = document.createElement("span");
      fora.className = "palavra";
      fora.setAttribute("aria-hidden", "true");
      var dentro = document.createElement("span");
      dentro.style.setProperty("--i", i);
      dentro.textContent = p;
      fora.appendChild(dentro);
      h1.appendChild(fora);
      h1.appendChild(document.createTextNode(" "));
    });
    h1.classList.add("dividido");
  });

  /* ---------- Floreio sob os títulos e pontos de pouso da borboleta ---------- */

  bloco("floreios", function () {
    $$(".secao h2").forEach(function (h2) {
      var pouso = document.createElement("span");
      pouso.className = "pouso";
      pouso.setAttribute("aria-hidden", "true");
      h2.appendChild(pouso);

      var svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "titulo-floreio");
      svg.setAttribute("viewBox", "0 0 132 18");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML =
        '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
        '<path pathLength="1" d="M2 11c16 0 24-8 40-5s20 9 38 7c12-1 18-6 26-6"/>' +
        '<path pathLength="1" transform="translate(110 1) scale(.75)" d="' + CORACAO + '"/>' +
        "</g>";
      h2.insertAdjacentElement("afterend", svg);
    });
  });

  /* ---------- Revelação ao rolar ---------- */

  bloco("revelar", function () {
    var grupos = [
      [".secao__cabeca"],
      [".cardapio li", true],
      ["#servicos .secao__inner > .btn"],
      [".form"],
      [".faq details", true],
      [".contato__info"],
      [".contato__mapa"],
      [".varal__item", true],
      [".galeria__insta"],
      [".mosaico__item", true],
      [".rodape__inner"],
    ];
    var alvos = [];
    grupos.forEach(function (g) {
      $$(g[0]).forEach(function (el, i) {
        el.setAttribute("data-revelar", "");
        if (g[1]) el.style.setProperty("--i", i % 6);
        alvos.push(el);
      });
    });

    if (semMovimento || !("IntersectionObserver" in window)) {
      alvos.forEach(function (el) { el.classList.add("is-visivel"); });
      return;
    }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visivel");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    alvos.forEach(function (el) { io.observe(el); });
  });

  /* ---------- Bolhas de sabão no início ---------- */

  bloco("bolhas", function () {
    if (semMovimento) return;
    var hero = $("[data-hero]");
    var canvas = $("[data-bolhas]");
    if (!hero || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var L = 0, A = 0;
    var bolhas = [];
    var gotas = [];
    var ponteiro = null;
    var inicio = performance.now();
    var TONS = [[231, 163, 157], [231, 163, 157], [200, 170, 220], [160, 205, 215], [217, 172, 99]];

    function dimensionar() {
      var r = hero.getBoundingClientRect();
      L = r.width; A = r.height;
      canvas.width = Math.round(L * dpr);
      canvas.height = Math.round(A * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var alvo = Math.round(limitar((L * A) / 42000, 9, 24));
      while (bolhas.length < alvo) bolhas.push(nova(false));
      bolhas.length = alvo;
    }

    function nova(deBaixo) {
      var grande = Math.random() < 0.12;
      var r = grande ? aleatorio(38, 58) : aleatorio(7, 30);
      return {
        x: aleatorio(0, L),
        y: deBaixo ? A + r + aleatorio(0, 120) : aleatorio(0, A),
        r: r,
        vy: aleatorio(16, 34) * Math.pow(22 / r, 0.35),
        oscila: aleatorio(0.5, 1.3),
        fase: aleatorio(0, Math.PI * 2),
        empurra: 0,
        tom: TONS[Math.floor(Math.random() * TONS.length)],
        nasce: performance.now(),
      };
    }

    function estourar(b) {
      for (var i = 0; i < 12; i++) {
        var ang = (i / 12) * Math.PI * 2 + aleatorio(-0.2, 0.2);
        var v = aleatorio(60, 170) * (0.6 + b.r / 50);
        gotas.push({
          x: b.x + Math.cos(ang) * b.r * 0.8,
          y: b.y + Math.sin(ang) * b.r * 0.8,
          vx: Math.cos(ang) * v,
          vy: Math.sin(ang) * v,
          vida: 1,
          tam: aleatorio(1.4, 3.4),
          tom: b.tom,
        });
      }
      gotas.push({ anel: true, x: b.x, y: b.y, r: b.r, vida: 1, tom: b.tom });
      var i2 = bolhas.indexOf(b);
      if (i2 > -1) bolhas[i2] = nova(true);
    }

    function desenharBolha(b, t) {
      var x = b.x, y = b.y, r = b.r, c = b.tom;
      var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.04)");
      g.addColorStop(0.72, "rgba(255,255,255,0.10)");
      g.addColorStop(0.93, "rgba(" + c + ",0.22)");
      g.addColorStop(1, "rgba(" + c + ",0.42)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(211,145,139,0.45)";
      ctx.stroke();

      // reflexo furta-cor que gira devagar
      var brilho = Math.sin(t * 0.8 + b.fase) * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.8, Math.PI * (0.15 + brilho * 0.2), Math.PI * (0.6 + brilho * 0.2));
      ctx.lineWidth = Math.max(1.2, r * 0.07);
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.86, Math.PI * (1.15 + brilho * 0.25), Math.PI * (1.45 + brilho * 0.25));
      ctx.lineWidth = Math.max(1, r * 0.05);
      ctx.strokeStyle = "rgba(" + c + ",0.5)";
      ctx.stroke();

      // pontinho de luz
      ctx.save();
      ctx.translate(x - r * 0.38, y - r * 0.42);
      ctx.rotate(-0.7);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.22, r * 0.1, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x - r * 0.08, y - r * 0.62, Math.max(0.8, r * 0.05), 0, Math.PI * 2);
      ctx.fill();
    }

    var rodando = false;
    var anterior = 0;

    function quadro(agora) {
      if (!rodando) { anterior = 0; return; }
      var dt = anterior ? Math.min((agora - anterior) / 1000, 0.05) : 0.016;
      anterior = agora;
      var t = agora / 1000;
      ctx.clearRect(0, 0, L, A);
      ctx.globalAlpha = limitar((agora - inicio - 1200) / 1500, 0, 1);

      for (var i = 0; i < bolhas.length; i++) {
        var b = bolhas[i];
        b.y -= b.vy * dt;
        b.x += (Math.sin(t * b.oscila + b.fase) * 14 + b.empurra) * dt;
        b.empurra *= 0.94;

        if (ponteiro) {
          var dx = b.x - ponteiro.x, dy = b.y - ponteiro.y;
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          var raio = b.r + 70;
          if (d < raio) {
            var forca = (1 - d / raio) * 1400 * dt;
            b.empurra += (dx / d) * forca * 4;
            b.y += (dy / d) * forca;
          }
        }

        if (b.y < -b.r * 2) { bolhas[i] = nova(true); continue; }
        if (b.y < A * 0.18 && Math.random() < dt * 0.35) { estourar(b); continue; }
        desenharBolha(b, t);
      }

      for (var j = gotas.length - 1; j >= 0; j--) {
        var g = gotas[j];
        g.vida -= dt * (g.anel ? 3 : 1.8);
        if (g.vida <= 0) { gotas.splice(j, 1); continue; }
        if (g.anel) {
          ctx.beginPath();
          ctx.arc(g.x, g.y, g.r * (1 + (1 - g.vida) * 0.6), 0, Math.PI * 2);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "rgba(" + g.tom + "," + (g.vida * 0.7) + ")";
          ctx.stroke();
        } else {
          g.x += g.vx * dt;
          g.y += g.vy * dt;
          g.vy += 260 * dt;
          ctx.beginPath();
          ctx.arc(g.x, g.y, g.tam * g.vida, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(" + g.tom + "," + g.vida + ")";
          ctx.fill();
        }
      }
      requestAnimationFrame(quadro);
    }

    function posicao(ev) {
      var r = canvas.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    }
    function bolhaEm(p) {
      for (var i = bolhas.length - 1; i >= 0; i--) {
        var b = bolhas[i];
        var dx = b.x - p.x, dy = b.y - p.y;
        if (dx * dx + dy * dy < (b.r + 8) * (b.r + 8)) return b;
      }
      return null;
    }

    hero.addEventListener("pointermove", function (ev) {
      if (ev.pointerType !== "mouse") return;
      ponteiro = posicao(ev);
      var sobre = bolhaEm(ponteiro);
      hero.style.cursor = sobre && !ev.target.closest("a,button") ? "pointer" : "";
    });
    hero.addEventListener("pointerleave", function () { ponteiro = null; hero.style.cursor = ""; });
    hero.addEventListener("pointerdown", function (ev) {
      var b = bolhaEm(posicao(ev));
      if (b) estourar(b);
    });

    dimensionar();
    if ("ResizeObserver" in window) new ResizeObserver(dimensionar).observe(hero);
    else window.addEventListener("resize", dimensionar);

    new IntersectionObserver(function (e) {
      var antes = rodando;
      rodando = e[0].isIntersecting;
      if (rodando && !antes) requestAnimationFrame(quadro);
    }).observe(hero);
  });

  /* ---------- Profundidade no início ao mover o mouse ---------- */

  bloco("profundidade", function () {
    if (semMovimento || !mouseFino) return;
    var hero = $("[data-hero]");
    if (!hero) return;
    hero.addEventListener("pointermove", function (ev) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((ev.clientX - r.left) / r.width - 0.5) * 2);
      hero.style.setProperty("--my", ((ev.clientY - r.top) / r.height - 0.5) * 2);
    });
    hero.addEventListener("pointerleave", function () {
      hero.style.setProperty("--mx", 0);
      hero.style.setProperty("--my", 0);
    });
  });

  /* ---------- Trilha de patinhas em "Como funciona" ---------- */

  bloco("trilha", function () {
    var area = $("[data-passos]");
    var trilha = $("[data-trilha]");
    if (!area || !trilha) return;
    var passos = $$(".passos li", area);
    var largaMQ = window.matchMedia("(min-width: 980px)");
    var fracoes = [];
    var patas = [];
    var primeiro, comprimento, horizontal;

    function montar() {
      horizontal = largaMQ.matches;
      var base = area.getBoundingClientRect();
      var centros = passos.map(function (li) {
        var r = li.getBoundingClientRect();
        var raio = parseFloat(getComputedStyle(li, "::before").width) / 2 || 28;
        return { x: r.left - base.left + raio, y: r.top - base.top + raio };
      });
      primeiro = centros[0];
      var ultimo = centros[centros.length - 1];
      comprimento = horizontal ? ultimo.x - primeiro.x : ultimo.y - primeiro.y;

      trilha.className = "trilha " + (horizontal ? "trilha--h" : "trilha--v");
      trilha.style.left = (horizontal ? primeiro.x : primeiro.x - 1) + "px";
      trilha.style.top = (horizontal ? primeiro.y - 1 : primeiro.y) + "px";
      trilha.style.width = horizontal ? comprimento + "px" : "0";
      trilha.style.height = horizontal ? "0" : comprimento + "px";

      fracoes = centros.map(function (c) {
        return comprimento ? ((horizontal ? c.x - primeiro.x : c.y - primeiro.y) / comprimento) : 0;
      });

      patas.forEach(function (p) { p.el.remove(); });
      patas = [];
      var lado = 1;
      for (var i = 0; i < fracoes.length - 1; i++) {
        var a = fracoes[i], b = fracoes[i + 1];
        var vao = (b - a) * comprimento;
        var qtd = vao > 150 ? 3 : vao > 90 ? 2 : 1;
        for (var k = 1; k <= qtd; k++) {
          var f = a + (b - a) * (k / (qtd + 1));
          var el = document.createElement("span");
          el.className = "trilha__pata";
          el.innerHTML = '<svg width="16" height="16" fill="currentColor"><use href="#i-pegada"/></svg>';
          if (horizontal) {
            el.style.left = f * 100 + "%";
            el.style.top = lado * 9 + "px";
            el.style.setProperty("--r", "90deg");
          } else {
            el.style.top = f * 100 + "%";
            el.style.left = lado * 9 + "px";
            el.style.setProperty("--r", "180deg");
          }
          lado *= -1;
          trilha.appendChild(el);
          patas.push({ el: el, f: f });
        }
      }
      atualizar();
    }

    function atualizar() {
      var p;
      if (semMovimento) {
        p = 1;
      } else {
        var r = area.getBoundingClientRect();
        var vh = window.innerHeight;
        var topoLinha = r.top + primeiro.y;
        p = horizontal
          ? (vh * 0.85 - topoLinha) / (vh * 0.45)
          : (vh * 0.62 - topoLinha) / (comprimento || 1);
        p = limitar(p, 0, 1);
      }
      trilha.style.setProperty("--p", p);
      passos.forEach(function (li, i) { li.classList.toggle("is-ativo", p >= fracoes[i] - 0.001); });
      patas.forEach(function (pt) { pt.el.classList.toggle("is-marcada", p >= pt.f); });
    }

    var pedido = false;
    window.addEventListener("scroll", function () {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(function () { pedido = false; atualizar(); });
    }, { passive: true });
    window.addEventListener("resize", montar);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(montar);
    montar();
  });

  /* ---------- Borboleta-guia ---------- */

  bloco("borboleta", function () {
    if (semMovimento) return;
    var el = $("[data-borboleta]");
    var hero = $("[data-hero]");
    var asa = $(".asa");
    var corpo = $(".asa__corpo");
    if (!el || !hero || !asa) return;

    var pos = null, vel = { x: 0, y: 0 };
    var pousada = false;
    var nascer = performance.now() + 2600;
    var anterior = 0;

    function alvo(t) {
      var vh = window.innerHeight, vw = window.innerWidth;
      var h = hero.getBoundingClientRect();
      if (h.bottom > vh * 0.45) {
        // passeia pelo lado de fora da asa, sem passar por cima da logo
        var a = asa.getBoundingClientRect();
        return {
          modo: "passear",
          x: Math.min(vw - 30, a.right + 18 + 22 * Math.sin(t * 0.37) + 8 * Math.sin(t * 1.13)),
          y: a.top + a.height * (0.42 + 0.26 * Math.sin(t * 0.51 + 1) + 0.04 * Math.sin(t * 1.7)),
        };
      }
      var melhor = null, melhorD = Infinity;
      $$(".pouso").forEach(function (p) {
        var r = p.getBoundingClientRect();
        if (r.top < 70 || r.top > vh * 0.82 || r.left < 0 || r.left > vw) return;
        var d = Math.abs(r.top - vh * 0.35);
        if (d < melhorD) { melhorD = d; melhor = r; }
      });
      if (melhor) {
        return { modo: "pousar", x: Math.min(melhor.left + 16, vw - 30), y: melhor.top - 1 };
      }
      return {
        modo: "acompanhar",
        x: vw - 46 + 10 * Math.sin(t * 0.9),
        y: vh * 0.3 + 34 * Math.sin(t * 0.6),
      };
    }

    function quadro(agora) {
      requestAnimationFrame(quadro);
      if (agora < nascer) return;
      var t = agora / 1000;
      var dt = anterior ? Math.min((agora - anterior) / 1000, 0.05) : 0.016;
      anterior = agora;

      var a = alvo(t);
      if (!pos) {
        var c = (corpo || asa).getBoundingClientRect();
        pos = { x: c.left + c.width * 0.5, y: c.top + c.height * 0.15 };
        el.classList.add("is-viva");
      }

      var dx = a.x - pos.x, dy = a.y - pos.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var velocidade = Math.sqrt(vel.x * vel.x + vel.y * vel.y);

      if (pousada && a.modo === "pousar" && dist < 40) {
        // pousada: acompanha o título enquanto a página rola
        pos.x = a.x; pos.y = a.y; vel.x = vel.y = 0;
      } else {
        pousada = false;
        var k = a.modo === "passear" ? 5 : 7;
        vel.x += (dx * k - vel.x * 3.6) * dt;
        vel.y += (dy * k - vel.y * 3.6) * dt;
        var max = 700;
        if (velocidade > max) { vel.x *= max / velocidade; vel.y *= max / velocidade; }
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
        if (a.modo === "pousar" && dist < 3 && velocidade < 30) pousada = true;
      }
      el.classList.toggle("is-pousada", pousada);

      var bater = pousada ? 0 : Math.sin(t * 13) * 3;
      var giro = pousada ? -8 : limitar(vel.x * 0.05, -28, 28);
      el.style.transform = "translate3d(" + pos.x.toFixed(1) + "px," + (pos.y + bater).toFixed(1) + "px,0) rotate(" + giro.toFixed(1) + "deg)";
    }
    requestAnimationFrame(quadro);
  });

  /* ---------- Topo some ao descer, volta ao subir ---------- */

  bloco("topo", function () {
    var topo = $("[data-topo]");
    var menu = $("[data-menu]");
    if (!topo) return;
    var ultimo = window.scrollY;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      var aberto = menu && menu.classList.contains("is-aberto");
      if (y > ultimo + 6 && y > 260 && !aberto) topo.classList.add("is-escondido");
      else if (y < ultimo - 6 || y < 260) topo.classList.remove("is-escondido");
      ultimo = y;
    }, { passive: true });
    topo.addEventListener("focusin", function () { topo.classList.remove("is-escondido"); });
  });

  /* ---------- Dúvidas abrem e fecham deslizando ---------- */

  bloco("duvidas", function () {
    if (semMovimento || !Element.prototype.animate) return;
    $$(".faq details").forEach(function (d) {
      var s = $("summary", d);
      var anim = null;
      s.addEventListener("click", function (ev) {
        ev.preventDefault();
        if (anim) anim.cancel();
        var inicio = d.offsetHeight;
        var abrindo = !d.open;
        d.style.overflow = "hidden";
        var fim;
        if (abrindo) {
          d.open = true;
          fim = d.offsetHeight;
        } else {
          fim = s.offsetHeight + (d.offsetHeight - d.clientHeight);
        }
        anim = d.animate({ height: [inicio + "px", fim + "px"] }, { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
        anim.onfinish = function () {
          if (!abrindo) d.open = false;
          d.style.overflow = "";
          anim = null;
        };
      });
    });
  });

  /* ---------- Corações saindo dos botões de WhatsApp ---------- */

  bloco("coracoes", function () {
    if (semMovimento || !Element.prototype.animate) return;

    function explodir(origem) {
      var r = origem.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (var i = 0; i < 16; i++) {
        var c = document.createElement("span");
        c.className = "coracao-voo";
        c.style.left = cx + "px";
        c.style.top = cy + "px";
        document.body.appendChild(c);
        var ang = aleatorio(-Math.PI * 0.95, -Math.PI * 0.05);
        var dist = aleatorio(70, 190);
        var escala = aleatorio(0.6, 1.3);
        var giro = aleatorio(-50, 50);
        var a = c.animate([
          { transform: "translate(0,0) scale(.2) rotate(0deg)", opacity: 1 },
          { transform: "translate(" + Math.cos(ang) * dist * 0.7 + "px," + Math.sin(ang) * dist * 0.7 + "px) scale(" + escala + ") rotate(" + giro * 0.6 + "deg)", opacity: 1, offset: 0.55 },
          { transform: "translate(" + Math.cos(ang) * dist + "px," + (Math.sin(ang) * dist + 40) + "px) scale(" + escala * 0.8 + ") rotate(" + giro + "deg)", opacity: 0 },
        ], { duration: aleatorio(900, 1400), easing: "cubic-bezier(.2,.7,.3,1)" });
        a.onfinish = (function (no) { return function () { no.remove(); }; })(c);
      }
    }

    document.addEventListener("click", function (ev) {
      var link = ev.target.closest("[data-wa]");
      if (link && link.getAttribute("href") !== "#contato") explodir(link);
    });
    document.addEventListener("patynhas:enviar", function (ev) {
      var botao = $("button[type=submit]", ev.target);
      if (botao) explodir(botao);
    });
  });

  /* ---------- Balão do WhatsApp ---------- */

  bloco("balao", function () {
    var balao = $("[data-balao]");
    if (!balao) return;
    var CHAVE = "patynhas-balao-visto";
    var visto = false;
    try { visto = sessionStorage.getItem(CHAVE) === "1"; } catch (e) { /* sem armazenamento */ }
    if (visto) return;

    function marcar() { try { sessionStorage.setItem(CHAVE, "1"); } catch (e) { /* ok */ } }
    function esconder() { balao.hidden = true; marcar(); }

    setTimeout(function () {
      balao.hidden = false;
      setTimeout(esconder, 9000);
    }, 9000);
    $("[data-balao-fechar]", balao).addEventListener("click", esconder);
  });
})();
