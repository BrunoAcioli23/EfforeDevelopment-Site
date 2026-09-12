/*
 * Configuração do site TV Sem Limites.
 * Tudo que você precisa editar (número, preços, capas, aplicativos e tutoriais) está aqui.
 */
window.TSL_CONFIG = {
  // Número do WhatsApp com DDI + DDD, só dígitos. Ex.: 5511999998888
  whatsapp: "5511947221118",

  instagram: "https://www.instagram.com/tv.semlimites.oficial/",

  // Preços em reais. "de" é o preço riscado (opcional). "cor": azul, violeta, roxo ou ouro.
  planos: [
    { id: "mensal", nome: "Mensal", preco: 35, periodo: "por mês", cor: "azul" },
    { id: "trimestral", nome: "Trimestral", preco: 90, de: 105, periodo: "a cada 3 meses", cor: "violeta" },
    { id: "semestral", nome: "Semestral", preco: 150, de: 210, periodo: "a cada 6 meses", cor: "roxo", selo: "Mais escolhido" },
    { id: "anual", nome: "Anual", preco: 250, de: 420, periodo: "por ano", cor: "ouro", selo: "Melhor valor" },
  ],

  // Itens listados em todos os planos.
  beneficios: [
    "Acesso aos conteúdos e canais disponíveis",
    "Suporte pelo WhatsApp",
    "Conteúdos atualizados",
  ],

  teste: { horas: 6 },

  // Capas exibidas no topo, em assets/capas/.
  // "img" = pôster (filme, série, anime). "logo" = logo de campeonato, exibida sobre fundo claro.
  // Sem "img" nem "logo", o site desenha uma capa com o título.
  capas: [
    { titulo: "Homem-Aranha: Um Novo Dia", tipo: "Filme", img: "assets/capas/homem-aranha-um-novo-dia.jpg" },
    { titulo: "Naruto Shippuden", tipo: "Anime", img: "assets/capas/naruto-shippuden.jpg" },
    { titulo: "Brasileirão", tipo: "Ao vivo", logo: "assets/capas/liga-brasileirao.png" },
    { titulo: "Breaking Bad", tipo: "Série", img: "assets/capas/breaking-bad.jpg" },
    { titulo: "Toy Story 5", tipo: "Filme", img: "assets/capas/toy-story-5.jpg" },
    { titulo: "Jujutsu Kaisen", tipo: "Anime", img: "assets/capas/jujutsu-kaisen.jpg" },
    { titulo: "Champions League", tipo: "Ao vivo", logo: "assets/capas/liga-champions.png" },
    { titulo: "Reacher", tipo: "Série", img: "assets/capas/reacher.jpg" },
    { titulo: "A Odisseia", tipo: "Filme", img: "assets/capas/a-odisseia.jpg" },
    { titulo: "Dragon Ball Z", tipo: "Anime", img: "assets/capas/dragon-ball-z.jpg" },
    { titulo: "Libertadores", tipo: "Ao vivo", logo: "assets/capas/liga-libertadores.png" },
    { titulo: "Os Simpsons", tipo: "Série", img: "assets/capas/os-simpsons.jpg" },
    { titulo: "Moana", tipo: "Filme", img: "assets/capas/moana.jpg" },
    { titulo: "Frieren", tipo: "Anime", img: "assets/capas/frieren.jpg" },
    { titulo: "Premier League", tipo: "Ao vivo", logo: "assets/capas/liga-premier.png" },
    { titulo: "Silo", tipo: "Série", img: "assets/capas/silo.jpg" },
    { titulo: "Batman: A Queda do Morcego", tipo: "Filme", img: "assets/capas/batman-a-queda-do-morcego.jpg" },
    { titulo: "Hunter x Hunter", tipo: "Anime", img: "assets/capas/hunter-x-hunter.jpg" },
    { titulo: "Copa do Brasil", tipo: "Ao vivo", logo: "assets/capas/liga-copa-do-brasil.png" },
    { titulo: "Grey's Anatomy", tipo: "Série", img: "assets/capas/greys-anatomy.jpg" },
    { titulo: "Minions & Monstros", tipo: "Filme", img: "assets/capas/minions-e-monstros.jpg" },
    { titulo: "Pokémon", tipo: "Anime", img: "assets/capas/pokemon.jpg" },
    { titulo: "LaLiga", tipo: "Ao vivo", logo: "assets/capas/liga-laliga.png" },
    { titulo: "Magnatas do Crime", tipo: "Série", img: "assets/capas/magnatas-do-crime.jpg" },
    { titulo: "Coyote vs. Acme", tipo: "Filme", img: "assets/capas/coyote-vs-acme.jpg" },
    { titulo: "Bleach", tipo: "Anime", img: "assets/capas/bleach.jpg" },
    { titulo: "Serie A Italiana", tipo: "Ao vivo", logo: "assets/capas/liga-serie-a.png" },
    { titulo: "Ted Lasso", tipo: "Série", img: "assets/capas/ted-lasso.jpg" },
    { titulo: "Zona Zero", tipo: "Filme", img: "assets/capas/zona-zero.jpg" },
    { titulo: "Detetive Conan", tipo: "Anime", img: "assets/capas/detetive-conan.jpg" },
    { titulo: "Dr. House", tipo: "Série", img: "assets/capas/dr-house.jpg" },
    { titulo: "Código: Vingança", tipo: "Filme", img: "assets/capas/codigo-vinganca.jpg" },
    { titulo: "Re:Zero", tipo: "Anime", img: "assets/capas/re-zero.jpg" },
    { titulo: "Lanternas", tipo: "Série", img: "assets/capas/lanternas.jpg" },
    { titulo: "Corrida Contra o Tempo", tipo: "Filme", img: "assets/capas/corrida-contra-o-tempo.jpg" },
    { titulo: "Mushoku Tensei", tipo: "Anime", img: "assets/capas/mushoku-tensei.jpg" },
    { titulo: "The Good Doctor", tipo: "Série", img: "assets/capas/the-good-doctor.jpg" },
    { titulo: "A Captura", tipo: "Filme", img: "assets/capas/a-captura.jpg" },
    { titulo: "O Mentalista", tipo: "Série", img: "assets/capas/o-mentalista.jpg" },
    { titulo: "Mayday", tipo: "Filme", img: "assets/capas/mayday.jpg" },
    { titulo: "Lioness", tipo: "Série", img: "assets/capas/lioness.jpg" },
    { titulo: "O Novato", tipo: "Série", img: "assets/capas/o-novato.jpg" },
    { titulo: "Uma Família da Pesada", tipo: "Série", img: "assets/capas/uma-familia-da-pesada.jpg" },
  ],

  // Aparelhos. "modelos" vazio ou ausente pula a pergunta de modelo.
  dispositivos: [
    {
      id: "smarttv", nome: "Smart TV", icone: "tv",
      pergunta: "Qual a marca da sua TV?",
      modelos: [
        { id: "samsung", nome: "Samsung" },
        { id: "lg", nome: "LG" },
        { id: "roku", nome: "Roku TV" },
        { id: "tcl", nome: "TCL" },
        { id: "philips", nome: "Philips" },
        { id: "aoc", nome: "AOC" },
        { id: "androidtv", nome: "Android TV / Google TV" },
        { id: "outra", nome: "Outra marca" },
      ],
    },
    {
      id: "celular", nome: "Celular", icone: "celular",
      pergunta: "Qual o sistema do seu celular?",
      modelos: [
        { id: "android", nome: "Android" },
        { id: "iphone", nome: "iPhone" },
      ],
    },
    {
      id: "computador", nome: "Computador", icone: "computador",
      pergunta: "Qual o sistema do seu computador?",
      modelos: [
        { id: "windows", nome: "Windows" },
        { id: "mac", nome: "Mac" },
      ],
    },
    {
      id: "tvbox", nome: "TV Box", icone: "tvbox",
      pergunta: "Qual é o seu TV Box?",
      modelos: [
        { id: "android", nome: "TV Box Android" },
        { id: "xiaomi", nome: "Xiaomi Mi Box / TV Stick" },
        { id: "outro", nome: "Outro modelo" },
      ],
    },
    { id: "firestick", nome: "Fire Stick", icone: "firestick" },
  ],

  // Aplicativos e tutorial. A busca usa "aparelho:modelo", depois "aparelho", depois "padrao".
  // Confira os nomes dos apps com os que você realmente usa.
  guias: {
    "smarttv:samsung": {
      apps: ["IBO Player Pro", "Duplex Play"],
      passos: [
        "Aperte o botão Home do controle e abra a aba Apps.",
        "Toque na lupa, busque por IBO Player Pro e instale.",
        "Abra o aplicativo. Vão aparecer dois códigos: Mac Address e Device Key.",
        "Tire uma foto dessa tela. Você vai enviar pelo WhatsApp para ativarmos o acesso.",
      ],
    },
    "smarttv:lg": {
      apps: ["IBO Player Pro", "Duplex Play"],
      passos: [
        "Aperte o botão Home do controle e abra a LG Content Store.",
        "Busque por IBO Player Pro e instale.",
        "Abra o aplicativo. Vão aparecer dois códigos: Mac Address e Device Key.",
        "Tire uma foto dessa tela. Você vai enviar pelo WhatsApp para ativarmos o acesso.",
      ],
    },
    "smarttv:roku": {
      apps: ["IBO Player"],
      passos: [
        "Aperte o botão Home do controle e vá em Canais de streaming.",
        "Escolha Buscar canais, digite IBO Player e adicione.",
        "Abra o aplicativo e anote os códigos que aparecem na tela.",
        "Tire uma foto dessa tela. Você vai enviar pelo WhatsApp para ativarmos o acesso.",
      ],
    },
    "smarttv:androidtv": {
      apps: ["XCIPTV Player", "IBO Player Pro"],
      passos: [
        "Na tela inicial, abra a Google Play Store.",
        "Busque por XCIPTV Player e instale.",
        "Abra o aplicativo e deixe na tela de login.",
        "Chame no WhatsApp: enviamos seu usuário e senha para entrar.",
      ],
    },
    "smarttv:tcl": {
      apps: ["XCIPTV Player", "IBO Player Pro"],
      passos: [
        "Na tela inicial, abra a Google Play Store. Se sua TCL for Roku, a loja se chama Canais de streaming.",
        "Busque por XCIPTV Player (Google Play) ou IBO Player (Roku) e instale.",
        "Abra o aplicativo e deixe na tela inicial dele.",
        "Chame no WhatsApp: enviamos os dados para entrar ou ativamos pelos códigos da tela.",
      ],
    },
    smarttv: {
      apps: ["IBO Player Pro", "XCIPTV Player"],
      passos: [
        "Abra a loja de aplicativos da sua TV.",
        "Busque por IBO Player Pro. Se não encontrar, tente XCIPTV Player.",
        "Se nenhum aparecer, tire uma foto da loja de apps da TV.",
        "Envie pelo WhatsApp que indicamos o aplicativo certo para o seu modelo.",
      ],
    },
    "celular:android": {
      apps: ["XCIPTV Player", "IPTV Smarters Pro"],
      passos: [
        "Abra a Google Play Store.",
        "Busque por XCIPTV Player e instale.",
        "Abra o aplicativo e deixe na tela de login.",
        "Chame no WhatsApp: enviamos seu usuário e senha para entrar.",
      ],
    },
    "celular:iphone": {
      apps: ["Smarters Player Lite"],
      passos: [
        "Abra a App Store.",
        "Busque por Smarters Player Lite e instale.",
        "Abra o aplicativo e toque em Login with Xtream Codes API.",
        "Chame no WhatsApp: enviamos seu usuário, senha e endereço do servidor.",
      ],
    },
    "computador:windows": {
      apps: ["IPTV Smarters Pro para Windows"],
      passos: [
        "Acesse o site oficial do IPTV Smarters e baixe a versão para Windows.",
        "Instale e abra o programa.",
        "Escolha Login with Xtream Codes API.",
        "Chame no WhatsApp: enviamos seu usuário, senha e endereço do servidor.",
      ],
    },
    "computador:mac": {
      apps: ["Smarters Player Lite"],
      passos: [
        "Abra a App Store do Mac.",
        "Busque por Smarters Player Lite e instale.",
        "Abra o aplicativo e escolha Login with Xtream Codes API.",
        "Chame no WhatsApp: enviamos seu usuário, senha e endereço do servidor.",
      ],
    },
    tvbox: {
      apps: ["XCIPTV Player", "IPTV Smarters Pro"],
      passos: [
        "Na tela inicial do TV Box, abra a Google Play Store.",
        "Busque por XCIPTV Player e instale.",
        "Se o app não aparecer na loja, instale o Downloader e use o código que enviamos no WhatsApp.",
        "Abra o aplicativo e chame no WhatsApp para receber seu usuário e senha.",
      ],
    },
    firestick: {
      apps: ["XCIPTV Player"],
      passos: [
        "Na tela inicial, vá em Buscar, digite Downloader e instale.",
        "Vá em Configurações > Minha Fire TV > Opções do desenvolvedor e ative Apps de fontes desconhecidas para o Downloader.",
        "Abra o Downloader e digite o código do aplicativo que enviamos no WhatsApp.",
        "Depois de instalar, abra o aplicativo e entre com o usuário e senha que enviamos.",
      ],
    },
    padrao: {
      apps: ["Aplicativo indicado pelo suporte"],
      passos: [
        "Chame no WhatsApp com o modelo do seu aparelho.",
        "Indicamos o aplicativo certo e enviamos o passo a passo.",
      ],
    },
  },
};
