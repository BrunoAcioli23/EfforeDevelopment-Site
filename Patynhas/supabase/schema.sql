-- =====================================================================
-- Patynhas Pet Mel Groomer — banco de dados (Supabase / PostgreSQL)
--
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Pode rodar de novo depois sem perder dados: ele só
-- cria o que ainda não existe e atualiza as funções.
--
-- Fuso horário: todas as contas de agenda usam o fuso da tabela
-- config_agenda (padrão America/Sao_Paulo).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Administradores (quem pode entrar no painel)
-- ---------------------------------------------------------------------
create table if not exists public.administradores (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create or replace function public.eh_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.administradores where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Ajustes da agenda (uma linha só)
-- ---------------------------------------------------------------------
create table if not exists public.config_agenda (
  id               smallint primary key default 1 check (id = 1),
  fuso             text    not null default 'America/Sao_Paulo',
  intervalo_min    int     not null default 30  check (intervalo_min between 5 and 120),
  antecedencia_min int     not null default 120 check (antecedencia_min between 0 and 10080),
  dias_max         int     not null default 30  check (dias_max between 1 and 180),
  capacidade       int     not null default 1   check (capacidade between 1 and 10),
  atualizado_em    timestamptz not null default now()
);
insert into public.config_agenda (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Horário de atendimento da semana (pode ter mais de uma faixa por dia,
-- ex.: 08:00–12:00 e 13:00–18:00 para o almoço)
-- ---------------------------------------------------------------------
create table if not exists public.horarios_semana (
  id         bigint generated always as identity primary key,
  dia_semana smallint not null check (dia_semana between 0 and 6), -- 0 = domingo
  abre       time not null,
  fecha      time not null,
  check (fecha > abre)
);

-- Folgas, feriados, compromissos: nenhum horário é oferecido nesse intervalo
create table if not exists public.bloqueios (
  id     bigint generated always as identity primary key,
  inicio timestamptz not null,
  fim    timestamptz not null,
  motivo text,
  check (fim > inicio)
);
create index if not exists bloqueios_periodo on public.bloqueios (inicio, fim);

-- ---------------------------------------------------------------------
-- Serviços: duração e preço por porte. Sem linha para um porte = não
-- oferecido para esse porte. "gato" funciona como um porte à parte.
-- ---------------------------------------------------------------------
create table if not exists public.servicos (
  id        bigint generated always as identity primary key,
  nome      text not null check (length(nome) between 1 and 80),
  descricao text check (length(descricao) <= 300),
  ordem     int not null default 0,
  ativo     boolean not null default true
);

create table if not exists public.servico_portes (
  servico_id bigint not null references public.servicos (id) on delete cascade,
  porte      text   not null check (porte in ('pequeno', 'medio', 'grande', 'gato')),
  minutos    int    not null check (minutos between 10 and 600),
  preco      numeric(10, 2) check (preco >= 0),
  primary key (servico_id, porte)
);

create table if not exists public.extras (
  id      bigint generated always as identity primary key,
  nome    text not null check (length(nome) between 1 and 60),
  minutos int  not null default 0 check (minutos between 0 and 240),
  preco   numeric(10, 2) check (preco >= 0),
  ordem   int not null default 0,
  ativo   boolean not null default true
);

-- ---------------------------------------------------------------------
-- Clientes, pets e agendamentos
-- ---------------------------------------------------------------------
create table if not exists public.clientes (
  id          bigint generated always as identity primary key,
  nome        text not null check (length(nome) between 1 and 80),
  telefone    text not null check (telefone ~ '^[0-9]{10,13}$'), -- só números, com DDD
  observacoes text check (length(observacoes) <= 1000),
  criado_em   timestamptz not null default now()
);
create unique index if not exists clientes_telefone on public.clientes (telefone);

create table if not exists public.pets (
  id          bigint generated always as identity primary key,
  cliente_id  bigint not null references public.clientes (id) on delete cascade,
  nome        text not null check (length(nome) between 1 and 60),
  especie     text not null default 'cachorro' check (especie in ('cachorro', 'gato')),
  porte       text check (porte in ('pequeno', 'medio', 'grande', 'gato')),
  pelo        text check (pelo in ('curto', 'medio', 'longo')),
  raca        text check (length(raca) <= 60),
  observacoes text check (length(observacoes) <= 1000),
  criado_em   timestamptz not null default now()
);
create index if not exists pets_cliente on public.pets (cliente_id);

create table if not exists public.agendamentos (
  id           bigint generated always as identity primary key,
  codigo       text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  cliente_id   bigint not null references public.clientes (id) on delete restrict,
  pet_id       bigint references public.pets (id) on delete set null,
  servico_id   bigint references public.servicos (id) on delete set null,
  servico_nome text not null,
  porte        text,
  extras       jsonb not null default '[]'::jsonb,  -- [{ "nome", "minutos", "preco" }]
  inicio       timestamptz not null,
  fim          timestamptz not null,
  status       text not null default 'confirmado'
               check (status in ('confirmado', 'concluido', 'cancelado', 'faltou')),
  valor        numeric(10, 2) check (valor >= 0),  -- começa com o previsto; ajuste para o cobrado
  observacoes  text check (length(observacoes) <= 1000),
  origem       text not null default 'site' check (origem in ('site', 'painel')),
  criado_em    timestamptz not null default now(),
  check (fim > inicio)
);
create index if not exists agendamentos_inicio on public.agendamentos (inicio);
create index if not exists agendamentos_cliente on public.agendamentos (cliente_id);

-- ---------------------------------------------------------------------
-- Segurança (RLS): o público só lê o que precisa para agendar.
-- Agendamentos e clientes só passam pelas funções abaixo ou pelo painel.
-- ---------------------------------------------------------------------
alter table public.administradores enable row level security;
alter table public.config_agenda   enable row level security;
alter table public.horarios_semana enable row level security;
alter table public.bloqueios       enable row level security;
alter table public.servicos        enable row level security;
alter table public.servico_portes  enable row level security;
alter table public.extras          enable row level security;
alter table public.clientes        enable row level security;
alter table public.pets            enable row level security;
alter table public.agendamentos    enable row level security;

do $$
declare t text;
begin
  -- o administrador pode tudo em todas as tabelas
  foreach t in array array['config_agenda', 'horarios_semana', 'bloqueios', 'servicos',
                           'servico_portes', 'extras', 'clientes', 'pets', 'agendamentos'] loop
    execute format('drop policy if exists admin_tudo on public.%I', t);
    execute format('create policy admin_tudo on public.%I for all to authenticated
                    using (public.eh_admin()) with check (public.eh_admin())', t);
  end loop;
end $$;

drop policy if exists admin_le_admins on public.administradores;
create policy admin_le_admins on public.administradores for select to authenticated
  using (user_id = auth.uid());

-- leitura pública: serviços ativos, extras ativos e horário da semana
drop policy if exists publico_le on public.servicos;
create policy publico_le on public.servicos for select to anon, authenticated using (ativo);
drop policy if exists publico_le on public.servico_portes;
create policy publico_le on public.servico_portes for select to anon, authenticated
  using (exists (select 1 from public.servicos s where s.id = servico_id and s.ativo));
drop policy if exists publico_le on public.extras;
create policy publico_le on public.extras for select to anon, authenticated using (ativo);
drop policy if exists publico_le on public.horarios_semana;
create policy publico_le on public.horarios_semana for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- Horários livres
-- Devolve cada início possível (data + hora local) para o serviço/porte.
-- Considera: faixas da semana, bloqueios, agendamentos existentes,
-- capacidade, intervalo entre horários, antecedência mínima e dias à frente.
-- ---------------------------------------------------------------------
create or replace function public.horarios_disponiveis(
  p_servico bigint,
  p_porte   text,
  p_extras  bigint[] default '{}',
  p_de      date default null,
  p_ate     date default null,
  p_ignorar_antecedencia boolean default false
)
returns table (data date, hora time)
language plpgsql stable security definer
set search_path = public
as $$
declare
  c        public.config_agenda;
  duracao  int;
  agora    timestamp;
  v_de     date;
  v_ate    date;
  dia      date;
  faixa    record;
  t        timestamp;
  t_fim    timestamp;
  ocupados int;
begin
  select * into c from public.config_agenda where id = 1;

  select sp.minutos into duracao
    from public.servico_portes sp
    join public.servicos s on s.id = sp.servico_id
   where sp.servico_id = p_servico and sp.porte = p_porte and s.ativo;
  if duracao is null then return; end if;

  duracao := duracao + coalesce(
    (select sum(e.minutos) from public.extras e where e.id = any (coalesce(p_extras, '{}')) and e.ativo), 0);

  agora := now() at time zone c.fuso;
  v_de  := greatest(coalesce(p_de, agora::date), agora::date);
  v_ate := least(coalesce(p_ate, agora::date + c.dias_max), agora::date + c.dias_max);

  for dia in select generate_series(v_de, v_ate, interval '1 day')::date loop
    for faixa in
      select abre, fecha from public.horarios_semana
       where dia_semana = extract(dow from dia) order by abre
    loop
      t := dia + faixa.abre;
      loop
        t_fim := t + make_interval(mins => duracao);
        exit when t_fim > dia + faixa.fecha;

        if p_ignorar_antecedencia or t >= agora + make_interval(mins => c.antecedencia_min) then
          if not exists (
            select 1 from public.bloqueios b
             where b.inicio < (t_fim at time zone c.fuso) and b.fim > (t at time zone c.fuso)
          ) then
            select count(*) into ocupados
              from public.agendamentos a
             where a.status in ('confirmado', 'concluido')
               and a.inicio < (t_fim at time zone c.fuso)
               and a.fim    > (t at time zone c.fuso);
            if ocupados < c.capacidade then
              data := dia;
              hora := t::time;
              return next;
            end if;
          end if;
        end if;

        t := t + make_interval(mins => c.intervalo_min);
      end loop;
    end loop;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Criar agendamento (site e painel)
-- O site só consegue agendar num horário que está livre de verdade.
-- O painel (administrador) pode forçar um encaixe com p_forcar = true.
-- Erros devolvidos (mensagem da exceção):
--   horario_indisponivel, dados_invalidos, servico_indisponivel, limite_cliente
-- ---------------------------------------------------------------------
create or replace function public.agendar(
  p_nome        text,
  p_telefone    text,
  p_pet         jsonb,          -- { nome, especie, porte, pelo, raca }
  p_servico     bigint,
  p_extras      bigint[],
  p_inicio      timestamp,      -- data e hora LOCAIS, ex.: 2026-10-07 09:30
  p_observacoes text default null,
  p_forcar      boolean default false
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  c           public.config_agenda;
  v_admin     boolean := public.eh_admin();
  v_tel       text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_nome      text := btrim(coalesce(p_nome, ''));
  v_pet_nome  text := btrim(coalesce(p_pet ->> 'nome', ''));
  v_especie   text := coalesce(nullif(p_pet ->> 'especie', ''), 'cachorro');
  v_porte     text;
  v_pelo      text := nullif(p_pet ->> 'pelo', '');
  v_raca      text := nullif(left(btrim(coalesce(p_pet ->> 'raca', '')), 60), '');
  v_serv      public.servicos;
  v_duracao   int;
  v_preco     numeric;
  v_extras    jsonb;
  v_min_ext   int;
  v_preco_ext numeric;
  v_cliente   bigint;
  v_pet       bigint;
  v_inicio    timestamptz;
  v_fim       timestamptz;
  v_novo      public.agendamentos;
begin
  v_porte := case when v_especie = 'gato' then 'gato' else nullif(p_pet ->> 'porte', '') end;

  if length(v_nome) not between 1 and 80
     or length(v_pet_nome) not between 1 and 60
     or length(v_tel) not between 10 and 13
     or v_especie not in ('cachorro', 'gato')
     or v_porte is null or v_porte not in ('pequeno', 'medio', 'grande', 'gato')
     or (v_pelo is not null and v_pelo not in ('curto', 'medio', 'longo'))
     or p_inicio is null
     or length(coalesce(p_observacoes, '')) > 1000 then
    raise exception 'dados_invalidos';
  end if;
  if p_forcar and not v_admin then
    raise exception 'dados_invalidos';
  end if;

  select * into c from public.config_agenda where id = 1;
  select * into v_serv from public.servicos s where s.id = p_servico and s.ativo;
  select sp.minutos, sp.preco into v_duracao, v_preco
    from public.servico_portes sp where sp.servico_id = p_servico and sp.porte = v_porte;
  if v_serv.id is null or v_duracao is null then
    raise exception 'servico_indisponivel';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'nome', e.nome, 'minutos', e.minutos, 'preco', e.preco)
                            order by e.ordem, e.id), '[]'::jsonb),
         coalesce(sum(e.minutos), 0), sum(e.preco)
    into v_extras, v_min_ext, v_preco_ext
    from public.extras e
   where e.id = any (coalesce(p_extras, '{}')) and e.ativo;

  -- uma pessoa por vez: evita dois clientes pegarem o mesmo horário
  perform pg_advisory_xact_lock(hashtext('patynhas_agenda'));

  if not p_forcar and not exists (
    select 1 from public.horarios_disponiveis(p_servico, v_porte, p_extras, p_inicio::date, p_inicio::date, v_admin) h
     where h.hora = p_inicio::time
  ) then
    raise exception 'horario_indisponivel';
  end if;

  -- cliente pelo telefone (não sobrescreve o nome de quem já existe)
  select cl.id into v_cliente from public.clientes cl where cl.telefone = v_tel;
  if v_cliente is null then
    insert into public.clientes (nome, telefone) values (v_nome, v_tel) returning id into v_cliente;
  end if;

  -- proteção contra abuso pelo site: no máximo 3 agendamentos futuros por telefone
  if not v_admin and (
    select count(*) from public.agendamentos a
     where a.cliente_id = v_cliente and a.status = 'confirmado' and a.inicio > now()
  ) >= 3 then
    raise exception 'limite_cliente';
  end if;

  -- pet pelo nome dentro do mesmo cliente; atualiza os dados informados
  select p.id into v_pet from public.pets p
   where p.cliente_id = v_cliente and lower(p.nome) = lower(v_pet_nome)
   order by p.id limit 1;
  if v_pet is null then
    insert into public.pets (cliente_id, nome, especie, porte, pelo, raca)
    values (v_cliente, v_pet_nome, v_especie, v_porte, v_pelo, v_raca)
    returning id into v_pet;
  else
    update public.pets p set
      especie = v_especie,
      porte   = v_porte,
      pelo    = coalesce(v_pelo, p.pelo),
      raca    = coalesce(v_raca, p.raca)
    where p.id = v_pet;
  end if;

  v_inicio := p_inicio at time zone c.fuso;
  v_fim    := (p_inicio + make_interval(mins => v_duracao + v_min_ext)) at time zone c.fuso;

  insert into public.agendamentos
    (cliente_id, pet_id, servico_id, servico_nome, porte, extras, inicio, fim, valor, observacoes, origem)
  values
    (v_cliente, v_pet, v_serv.id, v_serv.nome, v_porte, v_extras, v_inicio, v_fim,
     case when v_preco is null and v_preco_ext is null then null
          else coalesce(v_preco, 0) + coalesce(v_preco_ext, 0) end,
     nullif(btrim(coalesce(p_observacoes, '')), ''),
     case when v_admin then 'painel' else 'site' end)
  returning * into v_novo;

  return jsonb_build_object(
    'id', v_novo.id,
    'codigo', v_novo.codigo,
    'inicio', v_novo.inicio,
    'fim', v_novo.fim,
    'servico', v_novo.servico_nome,
    'valor', v_novo.valor
  );
end;
$$;

-- ----------------------------------------------------------------------- Salvar o horário da semana de uma vez (só administrador)
-- p_faixas: [{ "dia_semana": 2, "abre": "08:00", "fecha": "12:00" }, ...]
-- ---------------------------------------------------------------------
create or replace function public.salvar_horarios(p_faixas jsonb)
returns void
language plpgsql volatile security definer
set search_path = public
as $$
begin
  if not public.eh_admin() then raise exception 'sem_permissao'; end if;
  delete from public.horarios_semana where true;
  insert into public.horarios_semana (dia_semana, abre, fecha)
  select (f ->> 'dia_semana')::smallint, (f ->> 'abre')::time, (f ->> 'fecha')::time
    from jsonb_array_elements(coalesce(p_faixas, '[]'::jsonb)) f;
end;
$$;

-- ---------------------------------------------------------------------
-- Permissões das funções
-- ---------------------------------------------------------------------
revoke all on function public.horarios_disponiveis(bigint, text, bigint[], date, date, boolean) from public;
revoke all on function public.agendar(text, text, jsonb, bigint, bigint[], timestamp, text, boolean) from public;
revoke all on function public.salvar_horarios(jsonb) from public;
grant execute on function public.eh_admin() to anon, authenticated;
grant execute on function public.horarios_disponiveis(bigint, text, bigint[], date, date, boolean) to anon, authenticated;
grant execute on function public.agendar(text, text, jsonb, bigint, bigint[], timestamp, text, boolean) to anon, authenticated;
grant execute on function public.salvar_horarios(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Avisar o painel em tempo real quando chega agendamento novo
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime' and tablename = 'agendamentos') then
    alter publication supabase_realtime add table public.agendamentos;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Dados iniciais (só entram se as tabelas estiverem vazias).
-- Ajuste tudo depois pelo painel.
-- ---------------------------------------------------------------------
do $$
declare s bigint;
begin
  if not exists (select 1 from public.horarios_semana) then
    insert into public.horarios_semana (dia_semana, abre, fecha) values
      (2, '08:00', '18:00'), (3, '08:00', '18:00'), (4, '08:00', '18:00'),
      (5, '08:00', '18:00'), (6, '08:00', '14:00');
  end if;

  if not exists (select 1 from public.servicos) then
    insert into public.servicos (nome, descricao, ordem) values
      ('Banho', 'Shampoo e condicionador para o tipo de pelo, secagem e escovação.', 1) returning id into s;
    insert into public.servico_portes (servico_id, porte, minutos) values
      (s, 'pequeno', 60), (s, 'medio', 90), (s, 'grande', 120), (s, 'gato', 90);

    insert into public.servicos (nome, descricao, ordem) values
      ('Banho e tosa higiênica', 'Banho completo e acerto da região íntima, da barriga e das patinhas.', 2) returning id into s;
    insert into public.servico_portes (servico_id, porte, minutos) values
      (s, 'pequeno', 90), (s, 'medio', 120), (s, 'grande', 150), (s, 'gato', 120);

    insert into public.servicos (nome, descricao, ordem) values
      ('Banho e tosa na máquina', 'Pelo uniforme e fácil de cuidar, na altura que você preferir.', 3) returning id into s;
    insert into public.servico_portes (servico_id, porte, minutos) values
      (s, 'pequeno', 120), (s, 'medio', 150), (s, 'grande', 180);

    insert into public.servicos (nome, descricao, ordem) values
      ('Banho e tosa na tesoura', 'Acabamento à mão, no padrão da raça ou mais natural.', 4) returning id into s;
    insert into public.servico_portes (servico_id, porte, minutos) values
      (s, 'pequeno', 150), (s, 'medio', 180), (s, 'grande', 240);

    insert into public.servicos (nome, descricao, ordem) values
      ('Hidratação', 'Para pelos ressecados ou embaraçados, que voltam macios e com brilho.', 5) returning id into s;
    insert into public.servico_portes (servico_id, porte, minutos) values
      (s, 'pequeno', 90), (s, 'medio', 120), (s, 'grande', 150), (s, 'gato', 120);
  end if;

  if not exists (select 1 from public.extras) then
    insert into public.extras (nome, minutos, ordem) values
      ('Corte de unhas', 10, 1), ('Limpeza de ouvidos', 10, 2),
      ('Escovação de dentes', 10, 3), ('Retirada de subpelo', 30, 4);
  end if;
end $$;

-- =====================================================================
-- DEPOIS DE RODAR: torne sua conta administradora.
-- 1. Em Authentication > Users, crie seu usuário (e-mail e senha).
-- 2. Rode a linha abaixo trocando pelo seu e-mail:
--
--    insert into public.administradores (user_id)
--    select id from auth.users where email = 'seu-email@exemplo.com';
-- =====================================================================
