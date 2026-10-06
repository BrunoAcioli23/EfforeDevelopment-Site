/*
  Acesso aos dados do petshop (agenda, clientes, serviços).

  Duas versões com os mesmos comandos:
    - Supabase: o banco de verdade (configure em js/config.js > supabase).
    - Demonstração: dados de exemplo guardados só neste navegador, para
      conhecer o painel antes de configurar o Supabase.

  Uso:  PatynhasAPI.criar({ demo: true|false }).then(function (api) { ... })
  Erros vêm como Error com .codigo: horario_indisponivel, dados_invalidos,
  servico_indisponivel, limite_cliente, sem_permissao, login_invalido, rede.
*/
(function () {
  "use strict";

  var C = window.PATYNHAS || {};
  var PORTES = ["pequeno", "medio", "grande", "gato"];

  /* ---------- utilidades de data (sempre no horário local do navegador) ---------- */

  function dois(n) { return String(n).padStart(2, "0"); }
  function isoData(d) { return d.getFullYear() + "-" + dois(d.getMonth() + 1) + "-" + dois(d.getDate()); }
  function deIsoData(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function hhmm(min) { return dois(Math.floor(min / 60)) + ":" + dois(min % 60); }
  function minutos(h) { var p = String(h).split(":"); return +p[0] * 60 + +(p[1] || 0); }
  function localParaDate(s) { // "YYYY-MM-DD HH:MM"
    var p = s.replace("T", " ").split(" ");
    var d = deIsoData(p[0]);
    var m = minutos(p[1]);
    d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    return d;
  }
  function erro(codigo, msg) { var e = new Error(msg || codigo); e.codigo = codigo; return e; }
  function soDigitos(s) { return String(s || "").replace(/\D/g, ""); }

  var Util = { isoData: isoData, deIsoData: deIsoData, hhmm: hhmm, minutos: minutos, localParaDate: localParaDate, PORTES: PORTES };

  /* =====================================================================
     SUPABASE
     ===================================================================== */

  var CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";

  function carregarScript(src) {
    return new Promise(function (ok, falha) {
      if (window.supabase && window.supabase.createClient) return ok();
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () { ok(); };
      s.onerror = function () { falha(erro("rede", "Não foi possível carregar o Supabase")); };
      document.head.appendChild(s);
    });
  }

  function traduzir(e) {
    if (!e) return null;
    var m = (e.message || "") + " " + (e.details || "");
    var codigos = ["horario_indisponivel", "dados_invalidos", "servico_indisponivel", "limite_cliente", "sem_permissao"];
    for (var i = 0; i < codigos.length; i++) if (m.indexOf(codigos[i]) > -1) return erro(codigos[i]);
    if (/Invalid login/i.test(m)) return erro("login_invalido");
    if (/duplicate key|clientes_telefone/i.test(m)) return erro("telefone_repetido");
    if (/fetch|network/i.test(m)) return erro("rede");
    return erro("desconhecido", m);
  }
  function resp(r) { if (r.error) throw traduzir(r.error); return r.data; }

  function montarServicos(lista) {
    return (lista || []).map(function (s) {
      var portes = {};
      (s.servico_portes || []).forEach(function (p) { portes[p.porte] = { minutos: p.minutos, preco: p.preco == null ? null : +p.preco }; });
      return { id: s.id, nome: s.nome, descricao: s.descricao || "", ordem: s.ordem, ativo: s.ativo, portes: portes };
    }).sort(function (a, b) { return a.ordem - b.ordem || a.id - b.id; });
  }

  function apiSupabase(cfg) {
    var sb = window.supabase.createClient(cfg.url, cfg.chavePublica, {
      auth: { persistSession: true, autoRefreshToken: true },
    });

    return {
      modo: "supabase",
      util: Util,

      /* ---- público ---- */
      servicosPublicos: function () {
        return Promise.all([
          sb.from("servicos").select("id,nome,descricao,ordem,ativo,servico_portes(porte,minutos,preco)").eq("ativo", true),
          sb.from("extras").select("id,nome,minutos,preco,ordem").eq("ativo", true).order("ordem"),
        ]).then(function (r) { return { servicos: montarServicos(resp(r[0])), extras: resp(r[1]) }; });
      },
      horariosSemana: function () {
        return sb.from("horarios_semana").select("dia_semana,abre,fecha").order("dia_semana").order("abre").then(resp)
          .then(function (l) { return l.map(function (f) { return { dia_semana: f.dia_semana, abre: f.abre.slice(0, 5), fecha: f.fecha.slice(0, 5) }; }); });
      },
      disponibilidade: function (o) {
        return sb.rpc("horarios_disponiveis", {
          p_servico: o.servicoId, p_porte: o.porte, p_extras: o.extras || [],
          p_de: o.de || null, p_ate: o.ate || null, p_ignorar_antecedencia: !!o.ignorarAntecedencia,
        }).then(resp).then(function (l) { return l.map(function (x) { return { data: x.data, hora: x.hora.slice(0, 5) }; }); });
      },
      agendar: function (o) {
        return sb.rpc("agendar", {
          p_nome: o.nome, p_telefone: o.telefone, p_pet: o.pet, p_servico: o.servicoId,
          p_extras: o.extras || [], p_inicio: o.inicio, p_observacoes: o.observacoes || null, p_forcar: !!o.forcar,
        }).then(resp);
      },

      /* ---- sessão ---- */
      sessao: function () {
        return sb.auth.getSession().then(function (r) { var s = r.data && r.data.session; return s ? { email: s.user.email } : null; });
      },
      entrar: function (email, senha) {
        return sb.auth.signInWithPassword({ email: email, password: senha }).then(function (r) {
          if (r.error) throw traduzir(r.error);
          return { email: r.data.user.email };
        });
      },
      sair: function () { return sb.auth.signOut(); },
      ehAdmin: function () { return sb.rpc("eh_admin").then(resp); },

      /* ---- agenda ---- */
      agendamentos: function (o) {
        var de = deIsoData(o.de), ate = deIsoData(o.ate);
        ate.setDate(ate.getDate() + 1);
        return sb.from("agendamentos")
          .select("*, cliente:clientes(id,nome,telefone), pet:pets(id,nome,especie,porte,pelo,raca,observacoes)")
          .gte("inicio", de.toISOString()).lt("inicio", ate.toISOString())
          .order("inicio").then(resp);
      },
      atualizarAgendamento: function (id, campos) {
        return sb.from("agendamentos").update(campos).eq("id", id).select().single().then(resp);
      },

      /* ---- horários ---- */
      config: function () { return sb.from("config_agenda").select("*").eq("id", 1).single().then(resp); },
      salvarConfig: function (campos) {
        campos.atualizado_em = new Date().toISOString();
        return sb.from("config_agenda").update(campos).eq("id", 1).select().single().then(resp);
      },
      salvarHorarios: function (faixas) { return sb.rpc("salvar_horarios", { p_faixas: faixas }).then(resp); },
      bloqueios: function () {
        var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        return sb.from("bloqueios").select("*").gte("fim", hoje.toISOString()).order("inicio").then(resp);
      },
      criarBloqueio: function (b) { return sb.from("bloqueios").insert(b).select().single().then(resp); },
      removerBloqueio: function (id) { return sb.from("bloqueios").delete().eq("id", id).then(resp); },

      /* ---- serviços ---- */
      servicosTodos: function () {
        return Promise.all([
          sb.from("servicos").select("id,nome,descricao,ordem,ativo,servico_portes(porte,minutos,preco)"),
          sb.from("extras").select("*").order("ordem"),
        ]).then(function (r) { return { servicos: montarServicos(resp(r[0])), extras: resp(r[1]) }; });
      },
      salvarServico: function (s) {
        var dados = { nome: s.nome, descricao: s.descricao || null, ordem: s.ordem || 0, ativo: s.ativo !== false };
        var p = s.id ? sb.from("servicos").update(dados).eq("id", s.id).select().single()
                     : sb.from("servicos").insert(dados).select().single();
        return p.then(resp).then(function (salvo) {
          var linhas = PORTES.filter(function (k) { return s.portes[k]; }).map(function (k) {
            return { servico_id: salvo.id, porte: k, minutos: s.portes[k].minutos, preco: s.portes[k].preco };
          });
          return sb.from("servico_portes").delete().eq("servico_id", salvo.id).then(resp).then(function () {
            return linhas.length ? sb.from("servico_portes").insert(linhas).then(resp) : null;
          }).then(function () { return salvo; });
        });
      },
      salvarExtra: function (e) {
        var dados = { nome: e.nome, minutos: e.minutos || 0, preco: e.preco, ordem: e.ordem || 0, ativo: e.ativo !== false };
        return (e.id ? sb.from("extras").update(dados).eq("id", e.id) : sb.from("extras").insert(dados)).select().single().then(resp);
      },

      /* ---- clientes ---- */
      clientes: function () {
        return sb.from("clientes")
          .select("*, pets(*), agendamentos(id,inicio,status,valor,servico_nome,pet_id)")
          .order("nome").then(resp);
      },
      salvarCliente: function (c) {
        var dados = { nome: c.nome, telefone: soDigitos(c.telefone), observacoes: c.observacoes || null };
        return (c.id ? sb.from("clientes").update(dados).eq("id", c.id) : sb.from("clientes").insert(dados)).select().single().then(resp);
      },
      salvarPet: function (p) {
        var dados = { cliente_id: p.cliente_id, nome: p.nome, especie: p.especie, porte: p.especie === "gato" ? "gato" : p.porte,
                      pelo: p.pelo || null, raca: p.raca || null, observacoes: p.observacoes || null };
        return (p.id ? sb.from("pets").update(dados).eq("id", p.id) : sb.from("pets").insert(dados)).select().single().then(resp);
      },

      /* ---- tempo real ---- */
      aoNovoAgendamento: function (cb) {
        sb.channel("agendamentos-novos")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "agendamentos" }, function (p) { cb(p.new); })
          .subscribe();
      },
    };
  }

  /* =====================================================================
     DEMONSTRAÇÃO (dados de exemplo no navegador)
     ===================================================================== */

  var CHAVE_DEMO = "patynhas-demo-v1";

  function semente() {
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    var horarios = (C.horarios && C.horarios.length ? C.horarios : [
      { dia: 2, abre: "08:00", fecha: "18:00" }, { dia: 3, abre: "08:00", fecha: "18:00" },
      { dia: 4, abre: "08:00", fecha: "18:00" }, { dia: 5, abre: "08:00", fecha: "18:00" },
      { dia: 6, abre: "08:00", fecha: "14:00" },
    ]).map(function (h, i) { return { id: i + 1, dia_semana: h.dia, abre: h.abre, fecha: h.fecha }; });

    var servicos = [
      { id: 1, nome: "Banho", descricao: "Shampoo e condicionador para o tipo de pelo, secagem e escovação.", ordem: 1, ativo: true,
        portes: { pequeno: { minutos: 60, preco: 55 }, medio: { minutos: 90, preco: 70 }, grande: { minutos: 120, preco: 90 }, gato: { minutos: 90, preco: 80 } } },
      { id: 2, nome: "Banho e tosa higiênica", descricao: "Banho completo e acerto da região íntima, da barriga e das patinhas.", ordem: 2, ativo: true,
        portes: { pequeno: { minutos: 90, preco: 70 }, medio: { minutos: 120, preco: 85 }, grande: { minutos: 150, preco: 110 }, gato: { minutos: 120, preco: 95 } } },
      { id: 3, nome: "Banho e tosa na máquina", descricao: "Pelo uniforme e fácil de cuidar, na altura que você preferir.", ordem: 3, ativo: true,
        portes: { pequeno: { minutos: 120, preco: 90 }, medio: { minutos: 150, preco: 110 }, grande: { minutos: 180, preco: 140 } } },
      { id: 4, nome: "Banho e tosa na tesoura", descricao: "Acabamento à mão, no padrão da raça ou mais natural.", ordem: 4, ativo: true,
        portes: { pequeno: { minutos: 150, preco: 120 }, medio: { minutos: 180, preco: 150 }, grande: { minutos: 240, preco: 190 } } },
      { id: 5, nome: "Hidratação", descricao: "Para pelos ressecados ou embaraçados, que voltam macios e com brilho.", ordem: 5, ativo: true,
        portes: { pequeno: { minutos: 90, preco: 75 }, medio: { minutos: 120, preco: 95 }, grande: { minutos: 150, preco: 120 }, gato: { minutos: 120, preco: 100 } } },
    ];
    var extras = [
      { id: 1, nome: "Corte de unhas", minutos: 10, preco: 15, ordem: 1, ativo: true },
      { id: 2, nome: "Limpeza de ouvidos", minutos: 10, preco: 15, ordem: 2, ativo: true },
      { id: 3, nome: "Escovação de dentes", minutos: 10, preco: 20, ordem: 3, ativo: true },
      { id: 4, nome: "Retirada de subpelo", minutos: 30, preco: 40, ordem: 4, ativo: true },
    ];
    var gente = [
      ["Ana Souza", "11987654321", "Thor", "cachorro", "pequeno", "longo", "Yorkshire"],
      ["Bruna Lima", "11976543210", "Nina", "cachorro", "medio", "medio", "Poodle"],
      ["Carlos Pereira", "11965432109", "Floquinho", "cachorro", "pequeno", "longo", "Lulu da Pomerânia"],
      ["Daniela Costa", "11954321098", "Mia", "gato", "gato", "curto", "Siamês"],
      ["Eduardo Alves", "11943210987", "Bob", "cachorro", "pequeno", "longo", "Shih-tzu"],
      ["Fernanda Rocha", "11932109876", "Pipoca", "cachorro", "pequeno", "longo", "Yorkshire"],
      ["Gabriel Santos", "11921098765", "Paçoca", "cachorro", "pequeno", "longo", "Lhasa Apso"],
      ["Helena Martins", "11910987654", "Bolinha", "cachorro", "grande", "longo", "Golden Retriever"],
      ["Igor Ribeiro", "11998765432", "Luna", "cachorro", "medio", "curto", "Border Collie"],
      ["Juliana Freitas", "11999887766", "Simba", "gato", "gato", "longo", "Persa"],
    ];
    var clientes = [], pets = [];
    gente.forEach(function (g, i) {
      var criado = new Date(hoje); criado.setDate(criado.getDate() - 90 + i * 6);
      clientes.push({ id: i + 1, nome: g[0], telefone: g[1], observacoes: null, criado_em: criado.toISOString() });
      pets.push({ id: i + 1, cliente_id: i + 1, nome: g[2], especie: g[3], porte: g[4], pelo: g[5], raca: g[6], observacoes: null, criado_em: criado.toISOString() });
    });

    // agendamentos: últimos 75 dias e próximos 10, só em dias e horários abertos
    var agend = [], id = 1, aleat = 7;
    function sorte() { aleat = (aleat * 9301 + 49297) % 233280; return aleat / 233280; }
    var aberto = {};
    horarios.forEach(function (h) { (aberto[h.dia_semana] = aberto[h.dia_semana] || []).push(h); });
    for (var off = -75; off <= 10; off++) {
      var dia = new Date(hoje); dia.setDate(dia.getDate() + off);
      var faixas = aberto[dia.getDay()];
      if (!faixas) continue;
      var cursor = minutos(faixas[0].abre), fecha = minutos(faixas[faixas.length - 1].fecha);
      var quantos = 2 + Math.floor(sorte() * 3);
      for (var k = 0; k < quantos && cursor < fecha - 60; k++) {
        var c = Math.floor(sorte() * clientes.length);
        var pet = pets[c];
        var sv = servicos[Math.floor(sorte() * servicos.length)];
        if (!sv.portes[pet.porte]) sv = servicos[0];
        var dur = sv.portes[pet.porte].minutos;
        var ext = sorte() < 0.35 ? [extras[0]] : [];
        dur += ext.reduce(function (s, e) { return s + e.minutos; }, 0);
        if (cursor + dur > fecha) break;
        var ini = new Date(dia); ini.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0);
        var fim = new Date(ini.getTime() + dur * 60000);
        var status = "confirmado";
        if (off < 0) { var x = sorte(); status = x < 0.08 ? "cancelado" : x < 0.12 ? "faltou" : "concluido"; }
        var valor = sv.portes[pet.porte].preco + ext.reduce(function (s, e) { return s + e.preco; }, 0);
        agend.push({
          id: id, codigo: (100000 + id * 7919).toString(36).toUpperCase().slice(-6), cliente_id: pet.cliente_id, pet_id: pet.id,
          servico_id: sv.id, servico_nome: sv.nome, porte: pet.porte,
          extras: ext.map(function (e) { return { id: e.id, nome: e.nome, minutos: e.minutos, preco: e.preco }; }),
          inicio: ini.toISOString(), fim: fim.toISOString(), status: status, valor: valor,
          observacoes: null, origem: sorte() < 0.7 ? "site" : "painel", criado_em: new Date(ini.getTime() - 3 * 86400000).toISOString(),
        });
        id++;
        cursor += dur + (sorte() < 0.5 ? 30 : 0);
      }
    }
    return {
      config: { id: 1, fuso: "America/Sao_Paulo", intervalo_min: 30, antecedencia_min: 120, dias_max: 30, capacidade: 1 },
      horarios: horarios, bloqueios: [], servicos: servicos, extras: extras,
      clientes: clientes, pets: pets, agendamentos: agend,
      seq: { horarios: horarios.length, bloqueios: 0, servicos: servicos.length, extras: extras.length, clientes: clientes.length, pets: pets.length, agendamentos: id },
    };
  }

  function apiDemo() {
    var dados;
    function carregar() {
      try { dados = JSON.parse(localStorage.getItem(CHAVE_DEMO) || "null"); } catch (e) { dados = null; }
      if (!dados) { dados = semente(); gravar(); }
    }
    function gravar() { try { localStorage.setItem(CHAVE_DEMO, JSON.stringify(dados)); } catch (e) { /* sem armazenamento */ } }
    function prox(t) { dados.seq[t] = (dados.seq[t] || 0) + 1; return dados.seq[t]; }
    function copia(x) { return JSON.parse(JSON.stringify(x)); }
    function espera(v) { return new Promise(function (ok) { setTimeout(function () { ok(copia(v)); }, 120); }); }
    carregar();

    var logado = false;
    try { logado = sessionStorage.getItem("patynhas-demo-sessao") === "1"; } catch (e) { /* ok */ }

    function livres(o) {
      var c = dados.config;
      var sv = dados.servicos.filter(function (s) { return s.id === o.servicoId && s.ativo; })[0];
      if (!sv || !sv.portes[o.porte]) return [];
      var dur = sv.portes[o.porte].minutos + dados.extras.filter(function (e) {
        return (o.extras || []).indexOf(e.id) > -1 && e.ativo;
      }).reduce(function (s, e) { return s + e.minutos; }, 0);
      var agora = new Date();
      var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      var limite = new Date(hoje); limite.setDate(limite.getDate() + c.dias_max);
      var de = o.de ? deIsoData(o.de) : hoje; if (de < hoje) de = hoje;
      var ate = o.ate ? deIsoData(o.ate) : limite; if (ate > limite) ate = limite;
      var minimo = new Date(agora.getTime() + c.antecedencia_min * 60000);
      var ocupados = dados.agendamentos.filter(function (a) { return a.status === "confirmado" || a.status === "concluido"; })
        .map(function (a) { return [new Date(a.inicio), new Date(a.fim)]; });
      var bloq = dados.bloqueios.map(function (b) { return [new Date(b.inicio), new Date(b.fim)]; });
      var saida = [];
      for (var d = new Date(de); d <= ate; d.setDate(d.getDate() + 1)) {
        dados.horarios.filter(function (h) { return h.dia_semana === d.getDay(); })
          .sort(function (a, b) { return minutos(a.abre) - minutos(b.abre); })
          .forEach(function (h) {
            for (var t = minutos(h.abre); t + dur <= minutos(h.fecha); t += c.intervalo_min) {
              var ini = new Date(d); ini.setHours(Math.floor(t / 60), t % 60, 0, 0);
              var fim = new Date(ini.getTime() + dur * 60000);
              if (!o.ignorarAntecedencia && ini < minimo) continue;
              if (bloq.some(function (b) { return b[0] < fim && b[1] > ini; })) continue;
              var n = ocupados.filter(function (a) { return a[0] < fim && a[1] > ini; }).length;
              if (n < c.capacidade) saida.push({ data: isoData(d), hora: hhmm(t) });
            }
          });
      }
      return saida;
    }

    var ouvintes = [];
    window.addEventListener("storage", function (ev) {
      if (ev.key !== CHAVE_DEMO) return;
      var antes = dados.agendamentos.length;
      carregar();
      dados.agendamentos.slice(antes).forEach(function (a) { ouvintes.forEach(function (cb) { cb(copia(a)); }); });
    });

    function comJuncoes(a) {
      var x = copia(a);
      x.cliente = copia(dados.clientes.filter(function (c) { return c.id === a.cliente_id; })[0] || null);
      x.pet = copia(dados.pets.filter(function (p) { return p.id === a.pet_id; })[0] || null);
      return x;
    }

    return {
      modo: "demo",
      util: Util,
      reiniciar: function () { dados = semente(); gravar(); return espera(true); },

      servicosPublicos: function () {
        return espera({
          servicos: dados.servicos.filter(function (s) { return s.ativo; }),
          extras: dados.extras.filter(function (e) { return e.ativo; }),
        });
      },
      horariosSemana: function () { return espera(dados.horarios); },
      disponibilidade: function (o) { carregar(); return espera(livres(o)); },
      agendar: function (o) {
        carregar();
        var tel = soDigitos(o.telefone), nome = String(o.nome || "").trim(), pet = o.pet || {};
        var especie = pet.especie || "cachorro";
        var porte = especie === "gato" ? "gato" : pet.porte;
        if (!nome || !String(pet.nome || "").trim() || tel.length < 10 || tel.length > 13 || PORTES.indexOf(porte) < 0) {
          return Promise.reject(erro("dados_invalidos"));
        }
        if (o.forcar && !logado) return Promise.reject(erro("dados_invalidos"));
        var sv = dados.servicos.filter(function (s) { return s.id === o.servicoId && s.ativo; })[0];
        if (!sv || !sv.portes[porte]) return Promise.reject(erro("servico_indisponivel"));
        var p = o.inicio.replace("T", " ").split(" ");
        if (!o.forcar && !livres({ servicoId: o.servicoId, porte: porte, extras: o.extras, de: p[0], ate: p[0], ignorarAntecedencia: logado })
              .some(function (h) { return h.hora === p[1].slice(0, 5); })) {
          return Promise.reject(erro("horario_indisponivel"));
        }
        var cliente = dados.clientes.filter(function (c) { return c.telefone === tel; })[0];
        if (!cliente) {
          cliente = { id: prox("clientes"), nome: nome, telefone: tel, observacoes: null, criado_em: new Date().toISOString() };
          dados.clientes.push(cliente);
        }
        var futuros = dados.agendamentos.filter(function (a) { return a.cliente_id === cliente.id && a.status === "confirmado" && new Date(a.inicio) > new Date(); });
        if (!logado && futuros.length >= 3) return Promise.reject(erro("limite_cliente"));
        var registro = dados.pets.filter(function (x) { return x.cliente_id === cliente.id && x.nome.toLowerCase() === String(pet.nome).trim().toLowerCase(); })[0];
        if (!registro) {
          registro = { id: prox("pets"), cliente_id: cliente.id, nome: String(pet.nome).trim(), especie: especie, porte: porte, pelo: pet.pelo || null, raca: pet.raca || null, observacoes: null, criado_em: new Date().toISOString() };
          dados.pets.push(registro);
        } else {
          registro.especie = especie; registro.porte = porte;
          if (pet.pelo) registro.pelo = pet.pelo;
          if (pet.raca) registro.raca = pet.raca;
        }
        var ext = dados.extras.filter(function (e) { return (o.extras || []).indexOf(e.id) > -1 && e.ativo; });
        var dur = sv.portes[porte].minutos + ext.reduce(function (s, e) { return s + e.minutos; }, 0);
        var ini = localParaDate(o.inicio);
        var precoBase = sv.portes[porte].preco;
        var precoExt = ext.reduce(function (s, e) { return s + (e.preco || 0); }, 0);
        var novo = {
          id: prox("agendamentos"), codigo: Math.random().toString(36).slice(2, 8).toUpperCase(),
          cliente_id: cliente.id, pet_id: registro.id, servico_id: sv.id, servico_nome: sv.nome, porte: porte,
          extras: ext.map(function (e) { return { id: e.id, nome: e.nome, minutos: e.minutos, preco: e.preco }; }),
          inicio: ini.toISOString(), fim: new Date(ini.getTime() + dur * 60000).toISOString(),
          status: "confirmado", valor: precoBase == null && !precoExt ? null : (precoBase || 0) + precoExt,
          observacoes: (o.observacoes || "").trim() || null, origem: logado ? "painel" : "site", criado_em: new Date().toISOString(),
        };
        dados.agendamentos.push(novo);
        gravar();
        return espera({ id: novo.id, codigo: novo.codigo, inicio: novo.inicio, fim: novo.fim, servico: novo.servico_nome, valor: novo.valor });
      },

      sessao: function () { return espera(logado ? { email: "demonstracao@patynhas" } : null); },
      entrar: function () {
        logado = true;
        try { sessionStorage.setItem("patynhas-demo-sessao", "1"); } catch (e) { /* ok */ }
        return espera({ email: "demonstracao@patynhas" });
      },
      sair: function () {
        logado = false;
        try { sessionStorage.removeItem("patynhas-demo-sessao"); } catch (e) { /* ok */ }
        return espera(true);
      },
      ehAdmin: function () { return espera(logado); },

      agendamentos: function (o) {
        if (!logado) return Promise.reject(erro("sem_permissao")); carregar();
        var de = deIsoData(o.de), ate = deIsoData(o.ate); ate.setDate(ate.getDate() + 1);
        return espera(dados.agendamentos.filter(function (a) { var i = new Date(a.inicio); return i >= de && i < ate; })
          .sort(function (a, b) { return a.inicio < b.inicio ? -1 : 1; }).map(comJuncoes));
      },
      atualizarAgendamento: function (id, campos) {
        if (!logado) return Promise.reject(erro("sem_permissao"));
        var a = dados.agendamentos.filter(function (x) { return x.id === id; })[0];
        Object.keys(campos).forEach(function (k) { a[k] = campos[k]; });
        gravar();
        return espera(a);
      },

      config: function () { if (!logado) return Promise.reject(erro("sem_permissao")); return espera(dados.config); },
      salvarConfig: function (campos) { if (!logado) return Promise.reject(erro("sem_permissao")); Object.assign(dados.config, campos); gravar(); return espera(dados.config); },
      salvarHorarios: function (faixas) {
        if (!logado) return Promise.reject(erro("sem_permissao"));
        dados.horarios = faixas.map(function (f) { return { id: prox("horarios"), dia_semana: +f.dia_semana, abre: f.abre, fecha: f.fecha }; });
        gravar();
        return espera(true);
      },
      bloqueios: function () {
        if (!logado) return Promise.reject(erro("sem_permissao"));
        var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        return espera(dados.bloqueios.filter(function (b) { return new Date(b.fim) >= hoje; })
          .sort(function (a, b) { return a.inicio < b.inicio ? -1 : 1; }));
      },
      criarBloqueio: function (b) { if (!logado) return Promise.reject(erro("sem_permissao")); var n = Object.assign({ id: prox("bloqueios") }, b); dados.bloqueios.push(n); gravar(); return espera(n); },
      removerBloqueio: function (id) { if (!logado) return Promise.reject(erro("sem_permissao")); dados.bloqueios = dados.bloqueios.filter(function (b) { return b.id !== id; }); gravar(); return espera(true); },

      servicosTodos: function () { if (!logado) return Promise.reject(erro("sem_permissao")); return espera({ servicos: dados.servicos, extras: dados.extras }); },
      salvarServico: function (s) {
        if (!logado) return Promise.reject(erro("sem_permissao"));
        var alvo = s.id ? dados.servicos.filter(function (x) { return x.id === s.id; })[0] : null;
        if (!alvo) { alvo = { id: prox("servicos") }; dados.servicos.push(alvo); }
        alvo.nome = s.nome; alvo.descricao = s.descricao || ""; alvo.ordem = s.ordem || 0; alvo.ativo = s.ativo !== false; alvo.portes = s.portes;
        gravar();
        return espera(alvo);
      },
      salvarExtra: function (e) {
        if (!logado) return Promise.reject(erro("sem_permissao"));
        var alvo = e.id ? dados.extras.filter(function (x) { return x.id === e.id; })[0] : null;
        if (!alvo) { alvo = { id: prox("extras") }; dados.extras.push(alvo); }
        Object.assign(alvo, { nome: e.nome, minutos: e.minutos || 0, preco: e.preco, ordem: e.ordem || 0, ativo: e.ativo !== false });
        gravar();
        return espera(alvo);
      },

      clientes: function () {
        if (!logado) return Promise.reject(erro("sem_permissao")); carregar();
        return espera(dados.clientes.map(function (c) {
          var x = copia(c);
          x.pets = dados.pets.filter(function (p) { return p.cliente_id === c.id; });
          x.agendamentos = dados.agendamentos.filter(function (a) { return a.cliente_id === c.id; }).map(function (a) {
            return { id: a.id, inicio: a.inicio, status: a.status, valor: a.valor, servico_nome: a.servico_nome, pet_id: a.pet_id };
          });
          return x;
        }).sort(function (a, b) { return a.nome.localeCompare(b.nome); }));
      },
      salvarCliente: function (c) {
        if (!logado) return Promise.reject(erro("sem_permissao"));
        var tel = soDigitos(c.telefone);
        if (!String(c.nome || "").trim() || tel.length < 10) return Promise.reject(erro("dados_invalidos"));
        if (dados.clientes.some(function (x) { return x.telefone === tel && x.id !== c.id; })) return Promise.reject(erro("telefone_repetido"));
        var alvo = c.id ? dados.clientes.filter(function (x) { return x.id === c.id; })[0] : null;
        if (!alvo) { alvo = { id: prox("clientes"), criado_em: new Date().toISOString() }; dados.clientes.push(alvo); }
        Object.assign(alvo, { nome: c.nome.trim(), telefone: tel, observacoes: c.observacoes || null });
        gravar();
        return espera(alvo);
      },
      salvarPet: function (p) {
        if (!logado) return Promise.reject(erro("sem_permissao"));
        var alvo = p.id ? dados.pets.filter(function (x) { return x.id === p.id; })[0] : null;
        if (!alvo) { alvo = { id: prox("pets"), criado_em: new Date().toISOString() }; dados.pets.push(alvo); }
        Object.assign(alvo, { cliente_id: p.cliente_id, nome: p.nome, especie: p.especie, porte: p.especie === "gato" ? "gato" : p.porte,
                              pelo: p.pelo || null, raca: p.raca || null, observacoes: p.observacoes || null });
        gravar();
        return espera(alvo);
      },

      aoNovoAgendamento: function (cb) { ouvintes.push(cb); },
    };
  }

  /* ---------- ponto de entrada ---------- */

  function configurado() {
    var s = C.supabase || {};
    return !!(s.url && s.chavePublica);
  }

  window.PatynhasAPI = {
    util: Util,
    configurado: configurado,
    criar: function (opcoes) {
      opcoes = opcoes || {};
      if (configurado() && !opcoes.demo) {
        return carregarScript(CDN).then(function () { return apiSupabase(C.supabase); });
      }
      if (opcoes.demo || opcoes.permitirDemo) return Promise.resolve(apiDemo());
      return Promise.resolve(null);
    },
  };
})();
