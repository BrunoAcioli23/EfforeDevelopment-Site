# Effore Development - Website

Site moderno e animado para a Effore Development, uma software house especializada em Desenvolvimento Web, Inteligência Artificial e Soluções Digitais sob medida.

## 🎨 Design

- **Cores:**
  - Laranja: #fa7608
  - Preto: #212a32
  - Branco: #ffffff

- **Fonte:** Inter (Google Fonts)

## 🚀 Características

- ✨ Design moderno e minimalista
- 🎭 Animações suaves e interativas
- 📱 Totalmente responsivo
- ⚡ Performance otimizada
- 🎯 SEO friendly
- 🖱️ Efeitos de cursor personalizados (desktop)
- 🌊 Parallax e efeitos de scroll
- 💫 Partículas animadas

## 📄 Seções

### Página Principal (index.html)
1. **Hero** - Apresentação principal com CTAs
2. **Serviços** - Três serviços principais com cards animados
3. **Tecnologias** - Slider infinito com stack tecnológico
4. **Portfólio** - Showcase com os 4 principais projetos + link para página completa
5. **Sobre** - Informações da empresa com estatísticas
6. **Contato** - Formulário e informações de contato
7. **Footer** - Links e redes sociais

### Página de Portfólio (portfolio.html)
- **Hero do Portfólio** - Apresentação da página
- **Filtros** - Sistema de filtros por categoria (Todos, Web, IA, Software, Mobile), com
  contagem por categoria e estado vazio quando não há projetos publicados
- **Grid de Projetos** - Cards com categoria, descrição, tags e estatísticas
- **Cases em destaque** - Catálogo Digital (vídeo YouTube) e E-commerce (vídeo local)
- **Showroom de Modelos** - 5 templates de cartão de contato digital
- **CTA Final** - Call to action para iniciar projetos
- **Footer** - Links e redes sociais

## 🛠️ Como usar

1. Abra o arquivo `index.html` no navegador para a página principal
2. Acesse `portfolio.html` para ver todos os projetos
3. Certifique-se de que os arquivos `styles.css`, `script.js` e as imagens estão no local correto
4. Para publicar, faça upload de todos os arquivos para seu servidor

## 📝 Personalização

### Adicionar novos projetos ao portfólio:
1. Abra o arquivo `portfolio.html` e localize a seção `#projetos`
2. Copie um bloco `<article class="portfolio-item-full">` existente
3. Edite o conteúdo: título, descrição, categoria, tags e estatísticas
4. Ajuste o `data-category` para que os filtros funcionem. Ele aceita **mais de uma
   categoria separada por espaço**, ex.: `data-category="software web"`.
   Valores válidos: `web`, `ai`, `software`, `mobile`
5. A contagem em cada botão de filtro é calculada automaticamente — não precisa editar nada

> As categorias **Inteligência Artificial** e **Mobile** ainda têm poucos ou nenhum projeto
> publicado. Enquanto estiverem vazias, o filtro mostra um estado vazio com CTA de contato.

### Compartilhar um filtro específico:
A categoria selecionada é refletida na URL, então é possível divulgar um link direto:
`portfolio.html?filtro=software`

### Adicionar sua logo:
- Salve a imagem da logo na pasta `Assets`
- Ou edite no HTML a referência `<img>` para o caminho correto

### Modificar conteúdo:
- Abra o arquivo `index.html` ou `portfolio.html` e edite os textos
- Para alterar cores, edite as variáveis CSS em `:root` no arquivo `styles.css`

### Configurar formulário de contato:
- No arquivo `script.js`, localize a seção "Contact Form"
- Adicione sua URL de API no fetch para processar os envios
- Ou integre com serviços como FormSpree, EmailJS, etc.

## 🌐 Hospedagem Sugerida

- **Netlify** (gratuito, com domínio personalizado)
- **Vercel** (ótimo para projetos estáticos)
- **GitHub Pages** (gratuito para repositórios públicos)
- **Hostinger** (opção paga com suporte completo)

## 📱 Redes Sociais

Não esqueça de atualizar os links das redes sociais no footer com seus perfis reais:
- LinkedIn
- GitHub
- Instagram

## 🔧 Tecnologias Utilizadas

- HTML5
- CSS3 (com variáveis CSS e animações)
- JavaScript Vanilla (sem dependências)
- Google Fonts (Inter)
- SVG para ícones

## ⚡ Performance

- Imagens otimizadas
- CSS minificável
- JavaScript otimizado
- Lazy loading implementável
- Animations otimizadas com will-change

## 📄 Licença

Este projeto foi criado para Effore Development.

---

**Desenvolvido com ❤️ para transformar ideias em soluções digitais**
