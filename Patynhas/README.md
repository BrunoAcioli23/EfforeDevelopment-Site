# Site Patynhas Pet Mel Groomer

Site de uma página só, sem dependências: abra `index.html` no navegador para ver.

## Onde editar

| O quê | Arquivo |
|---|---|
| WhatsApp, Instagram, endereço, horários, fotos da galeria | `js/config.js` |
| Textos (serviços, passos, dúvidas) | `index.html` |
| Cores e fontes | topo de `css/styles.css` (`:root`) |
| Animações (bolhas, borboleta, fitas, trilha de patinhas) | `js/animacoes.js` e o fim de `css/styles.css` |

Quem ativa "reduzir movimento" no celular ou no computador vê o site completo, sem animações.

- **Galeria (pets atendidos):** coloque as fotos em `assets/galeria/` e liste em `galeria` no `config.js`. Aceita foto simples ou par de **antes e depois** (ao ampliar, dá para arrastar e comparar). Fotos em pé ficam melhores.
- **Nosso espaço (interior):** coloque as fotos em `assets/espaco/` e liste em `espaco` no `config.js`. A primeira aparece grande, em destaque.
- Enquanto as listas estiverem vazias, o site mostra molduras de exemplo. Antes de publicar, coloque as fotos de verdade.
- **Tamanho das fotos:** foto de celular costuma ter 3 a 8 MB e deixa o site lento. Reduza para uns 1200 px no lado maior antes de colocar (dá para fazer em sites como squoosh.app). Se o nome do arquivo estiver errado, o console do navegador avisa qual foto não foi encontrada.
- **Mapa:** aparece sozinho quando o endereço em `config.js` deixa de ser o de exemplo.
- **Página de agendamento (`agendar.html`):** passo a passo em 4 etapas (pet, serviço, dia, confirmar). Não precisa de servidor: no fim, ela monta a mensagem e abre o WhatsApp do cliente, que só precisa tocar em enviar. Os dias fechados e as faixas de manhã/tarde vêm dos horários em `config.js`. O código fica em `js/agendar.js` e `css/agendar.css`.

## Como publicar (grátis)

Qualquer hospedagem de site estático serve. A mais simples:

1. Entre em <https://app.netlify.com/drop>.
2. Arraste a pasta `Patynhas` inteira para a página.
3. Pronto: o site ganha um endereço. Dá para ligar um domínio próprio (ex.: `patynhaspetmel.com.br`, registrado no registro.br) depois.

Ao publicar com domínio próprio, troque `assets/logo.png` na tag `og:image` do `index.html` pelo endereço completo (ex.: `https://patynhaspetmel.com.br/assets/logo.png`) para a logo aparecer quando o link for compartilhado no WhatsApp.
