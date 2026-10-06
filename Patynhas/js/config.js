/*
  ============================================================
  DADOS DO PETSHOP — edite aqui e o site inteiro se atualiza.
  ============================================================
  Tudo que aparece como contato, horário, endereço e galeria
  vem deste arquivo. Não precisa mexer no HTML.
*/
window.PATYNHAS = {
  nome: "Patynhas Pet Mel Groomer",

  // Só números, com 55 + DDD. Ex.: "5511987654321".
  // Enquanto estiver vazio, os botões de WhatsApp levam para a seção de contato.
  whatsapp: "",

  // Como o telefone aparece escrito no site.
  telefoneExibicao: "(00) 00000-0000",

  // Usuário do Instagram, sem o @. Deixe "" para esconder.
  instagram: "patynhaspetmel",

  endereco: {
    rua: "Rua Exemplo, 123",
    bairro: "Bairro",
    cidade: "Cidade",
    uf: "UF",
    cep: "00000-000",
  },

  // Mensagem que já vem escrita quando a pessoa toca em "Agendar pelo WhatsApp".
  mensagemPadrao: "Olá, Patynhas Pet Mel! Gostaria de agendar um horário para o meu pet.",

  /*
    Horários de atendimento. dia: 0 = domingo, 1 = segunda ... 6 = sábado.
    Para dias fechados, não coloque o dia na lista.
    Use o formato 24h: "08:00", "18:30".
  */
  horarios: [
    { dia: 2, abre: "08:00", fecha: "18:00" },
    { dia: 3, abre: "08:00", fecha: "18:00" },
    { dia: 4, abre: "08:00", fecha: "18:00" },
    { dia: 5, abre: "08:00", fecha: "18:00" },
    { dia: 6, abre: "08:00", fecha: "14:00" },
  ],

  /*
    GALERIA: fotos dos pets atendidos (aparecem penduradas no varal).
    Coloque as fotos em assets/galeria/ e liste aqui, na ordem que quiser.

    Foto simples:
      { arquivo: "assets/galeria/thor.jpg", nome: "Thor", servico: "tosa na tesoura" },

    Antes e depois (ao ampliar, dá para arrastar e comparar):
      { antes: "assets/galeria/mel-antes.jpg", depois: "assets/galeria/mel-depois.jpg", nome: "Mel", servico: "hidratação" },

    Opcional: formato: "deitada" para foto na horizontal (o site também percebe
    sozinho) e descricao: "..." para descrever a foto a quem usa leitor de tela.
    Enquanto a lista estiver vazia, aparecem molduras de exemplo no lugar.
  */
  galeria: [
    { arquivo: "assets/galeria/yorkshire-1.jpg", nome: "Thor",
      descricao: "Yorkshire de pelo preto, branco e caramelo, de língua de fora na mesa de tosa" },
    { arquivo: "assets/galeria/poodle-2.jpg", nome: "Nina", formato: "deitada",
      descricao: "Poodle branco tosado, de perfil, com lacinho rosa na orelha" },
    { arquivo: "assets/galeria/lulu-da-pomerania.jpg", nome: "Floquinho", formato: "deitada",
      descricao: "Lulu da Pomerânia branco, sentado e de pelo bem fofo depois do banho" },
    { arquivo: "assets/galeria/gato-siames.jpg", nome: "Mia", formato: "deitada",
      descricao: "Gato siamês de olhos azuis em pé na mesa, depois do banho" },
    { arquivo: "assets/galeria/shih-tzu.jpg", nome: "Bob", formato: "deitada",
      descricao: "Shih-tzu branco e caramelo tosado, sorrindo de língua de fora" },
    { arquivo: "assets/galeria/yorkshire-2.jpg", nome: "Pipoca",
      descricao: "Yorkshire caramelo com colar de pompons cor-de-rosa" },
    { arquivo: "assets/galeria/lhasa.jpg", nome: "Paçoca", formato: "deitada",
      descricao: "Cachorro de pelo creme tosado, sentado e sorrindo" },
    { arquivo: "assets/galeria/poodle-1.jpg", nome: "Nina", formato: "deitada",
      descricao: "Poodle branco tosado, de frente, com lacinho vermelho" },
  ],

  /*
    NOSSO ESPAÇO: fotos do interior do petshop.
    Coloque as fotos em assets/espaco/ e liste aqui.
    A PRIMEIRA foto aparece grande, em destaque.
      { arquivo: "assets/espaco/recepcao.jpg", legenda: "Recepção" },
      { arquivo: "assets/espaco/banho.jpg", legenda: "Área de banho" },
    Enquanto a lista estiver vazia, aparecem quadros de exemplo com o nome
    de cada ambiente, para servir de guia na hora de fotografar.
  */
  espaco: [],
};
