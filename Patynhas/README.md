# Site Patynhas Pet Mel Groomer

Site do petshop, página de agendamento e painel da loja. Abra `index.html` no navegador para ver o site e `admin/index.html` para o painel.

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
- **Página de agendamento (`agendar.html`):** passo a passo em 4 etapas (pet, serviço, dia, confirmar). Funciona de dois jeitos:
  - **Sem banco de dados:** no fim, abre o WhatsApp com a mensagem pronta. Dias e períodos vêm dos horários em `config.js`.
  - **Com o banco (Supabase) configurado:** mostra só os horários livres de verdade e o agendamento fica confirmado na hora, aparecendo no painel. Para testar esse modo antes de configurar, abra `agendar.html?demo`.

## Painel da loja (`admin/`)

Abra `admin/index.html` (no site publicado: `seusite.com.br/admin/`). Ali você:

- vê a **agenda** do dia e da semana, marca atendimentos como concluído, faltou ou cancelado, anota o valor cobrado e manda lembrete pelo WhatsApp;
- faz **agendamentos** para quem ligou ou mandou mensagem (inclusive encaixes fora da grade);
- consulta **clientes e pets**, com histórico de visitas;
- vê o **resumo por período**: faturamento, atendimentos, ticket médio, faltas, serviços mais feitos, dias mais movimentados;
- define os **horários de atendimento** (com pausa para almoço) e **folgas e feriados**;
- ajusta **serviços**, com duração e preço por porte, e os cuidados extras;
- muda as **regras da agenda**: de quanto em quanto tempo oferecer horários, antecedência mínima, quantos dias à frente e quantos pets ao mesmo tempo.

Enquanto o banco não estiver configurado, o painel abre em **modo demonstração**, com dados de exemplo salvos só no seu navegador. Dá para mexer à vontade e usar "Restaurar exemplos" para voltar ao começo.

## Configurar o banco de dados (Supabase, plano gratuito)

Faça uma vez só, uns 15 minutos:

1. Crie uma conta em <https://supabase.com> e clique em **New project**. Escolha a região **South America (São Paulo)** e guarde a senha do banco.
2. No projeto, abra **SQL Editor**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**. Isso cria as tabelas, as regras de segurança e os serviços iniciais (com durações sugeridas, sem preço).
3. Em **Authentication > Users**, clique em **Add user > Create new user** e crie seu login (e-mail e senha) para o painel.
4. Volte ao **SQL Editor** e rode, trocando pelo seu e-mail:
   ```sql
   insert into public.administradores (user_id)
   select id from auth.users where email = 'seu-email@exemplo.com';
   ```
5. Em **Authentication > Sign In / Providers**, desligue **Allow new users to sign up**. Assim ninguém mais consegue criar conta.
6. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public** e cole em `js/config.js`:
   ```js
   supabase: {
     url: "https://seu-projeto.supabase.co",
     chavePublica: "eyJhbGciOi...",
   },
   ```
7. Publique o site de novo. Pronto: entre no painel com seu e-mail e senha, confira os horários e coloque os preços em **Serviços**.

Sobre segurança: a chave "anon public" foi feita para ficar no site. Quem visita só consegue ver serviços e horários livres e criar um agendamento num horário vago (no máximo 3 futuros por telefone). Clientes, telefones e agendamentos só aparecem para quem está na tabela `administradores`. **Nunca** coloque no site a chave `service_role`.

O painel avisa na hora quando chega agendamento novo pelo site, enquanto estiver aberto.

## Para o futuro: loja

O banco foi organizado para crescer. A loja (produtos, estoque e vendas, com pagamento por Pix ou cartão via Mercado Pago) entra como novas tabelas no mesmo Supabase e uma nova seção no painel, sem mexer no que já existe.
## Como publicar (grátis)

Qualquer hospedagem de site estático serve. A mais simples:

1. Entre em <https://app.netlify.com/drop>.
2. Arraste a pasta `Patynhas` inteira para a página.
3. Pronto: o site ganha um endereço. Dá para ligar um domínio próprio (ex.: `patynhaspetmel.com.br`, registrado no registro.br) depois.

Ao publicar com domínio próprio, troque `assets/logo.png` na tag `og:image` do `index.html` pelo endereço completo (ex.: `https://patynhaspetmel.com.br/assets/logo.png`) para a logo aparecer quando o link for compartilhado no WhatsApp.
