# Guia de Configuração do Supabase — MataMata.live

Este guia explica passo a passo como criar o projeto no Supabase e obter todas as variáveis de ambiente necessárias para rodar o MataMata.live localmente.

---

## Pré-requisitos

- Conta no [supabase.com](https://supabase.com) (gratuita)
- Arquivo `.env.local` na raiz do projeto (já criado — veja `.env.local.example`)

---

## Parte 1 — Criar o Projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e faça login
2. Clique em **"New project"**
3. Preencha:
   - **Name**: `matamata-live` (ou qualquer nome)
   - **Database Password**: gere uma senha forte e guarde — você vai precisar dela para acessar o banco diretamente se necessário
   - **Region**: escolha a mais próxima (ex: `South America (São Paulo)`)
4. Clique em **"Create new project"** e aguarde ~2 minutos enquanto o Supabase provisiona o banco

---

## Parte 2 — Obter as Variáveis de Ambiente

### Onde encontrar

Com o projeto criado, navegue até:

**Settings → API** (menu lateral esquerdo, ícone de engrenagem)

Você verá três seções relevantes:

---

### `NEXT_PUBLIC_SUPABASE_URL`

**Localização**: Settings → **General** → **Project ID**

> ⚠️ O Supabase removeu o campo "Project URL" da interface. A URL é montada manualmente a partir do **Project ID**.

1. Vá em **Settings → General**
2. Copie o valor do campo **"Project ID"** (ex: `ldacaocjcvsyvegofcuz`)
3. Monte a URL no formato abaixo:

```
https://<project-id>.supabase.co
```

Exemplo:

```
https://ldacaocjcvsyvegofcuz.supabase.co
```

---

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Localização**: Settings → **API Keys** → **Publishable key** → `default`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- Esta chave é **segura para o frontend** — é pública por design
- Só tem acesso às tabelas onde você habilitar via **RLS (Row Level Security)**
- Prefixo `NEXT_PUBLIC_` porque o Next.js precisa expô-la ao browser

---

### `SUPABASE_SERVICE_ROLE_KEY`

**Localização**: Settings → **API Keys** → **Secret keys** → `default`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **ATENÇÃO**: Esta chave **bypassa o RLS completamente**. Nunca a exponha ao cliente.
>
> - Sem prefixo `NEXT_PUBLIC_` — o Next.js garante que fique apenas no servidor
> - Usada apenas em Server Actions e Route Handlers (nunca em `"use client"`)
> - Nunca commite no git — o `.gitignore` já exclui `.env.local`

---

### Preenchendo o `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Parte 3 — Configurar Google OAuth

### 3.1 Criar credenciais no Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto novo (ou selecione um existente)
3. Navegue até **APIs & Services → Credentials**
4. Clique em **"+ Create Credentials" → OAuth 2.0 Client IDs**
5. Selecione **"Web application"**
6. Em **Authorized redirect URIs**, adicione:
   ```
   https://xxxxxxxxxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
   (substitua pelo seu Project URL do Supabase + `/auth/v1/callback`)
7. Clique em **"Create"** e copie o **Client ID** e **Client Secret**

### 3.2 Habilitar Google OAuth no Supabase

1. No Supabase Dashboard, vá em **Authentication → Providers**
2. Localize **Google** e clique para expandir
3. Habilite o toggle **"Enable Google provider"**
4. Cole o **Client ID** e **Client Secret** obtidos no Google Console
5. Clique em **"Save"**

### 3.3 Adicionar Redirect URL para desenvolvimento local

1. No Supabase Dashboard, vá em **Authentication → URL Configuration**
2. Em **Redirect URLs**, clique em **"Add URL"** e adicione:
   ```
   http://localhost:3000/auth/callback
   ```
3. Clique em **"Save"**

> Esta etapa é necessária para que o OAuth funcione em desenvolvimento local. Em produção, adicione também a URL do seu domínio real (ex: `https://matamata.live/auth/callback`).

---

## Parte 4 — Criar as Tabelas do Banco

As tabelas precisam ser criadas manualmente via **SQL Editor** no Dashboard (Tasks 4.1, 4.2, 4.3 da spec).

### 4.1 Tabela `picks`

No Supabase Dashboard: **SQL Editor → New query**

```sql
create table public.picks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  espn_event_id  text not null,
  team_id        text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint picks_unique_user_event unique (user_id, espn_event_id)
);

alter table public.picks enable row level security;

create policy "users read own picks" on public.picks
  for select using (auth.uid() = user_id);

create policy "users insert own picks" on public.picks
  for insert with check (auth.uid() = user_id);

create policy "users update own picks" on public.picks
  for update using (auth.uid() = user_id);
```

### 4.2 Tabela `match_results`

```sql
create table public.match_results (
  espn_event_id  text primary key,
  winner_team_id text not null,
  stage          text not null,
  updated_at     timestamptz default now()
);
-- Sem RLS: leitura pública, escrita apenas via service role
```

### 4.3 View `ranking_view`

```sql
create or replace view public.ranking_view as
select
  p.user_id,
  u.raw_user_meta_data ->> 'full_name'  as display_name,
  u.raw_user_meta_data ->> 'avatar_url' as avatar_url,
  count(*) filter (
    where mr.winner_team_id is not null
      and p.team_id = mr.winner_team_id
  )::int as hits,
  (count(*) filter (
    where mr.winner_team_id is not null
      and p.team_id = mr.winner_team_id
  ) * 10)::int as points
from public.picks p
join auth.users u on u.id = p.user_id
left join public.match_results mr on mr.espn_event_id = p.espn_event_id
group by p.user_id, display_name, avatar_url
order by points desc, hits desc;
```

---

## Resumo das Variáveis

| Variável                        | Onde encontrar                                           | Exposta ao browser?     |
| ------------------------------- | -------------------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Settings → General → Project ID → montar URL manualmente | ✅ Sim (seguro)         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API Keys → Publishable key                    | ✅ Sim (seguro com RLS) |
| `SUPABASE_SERVICE_ROLE_KEY`     | Settings → API Keys → Secret keys                        | ❌ Nunca — só servidor  |

---

## Verificação Final

Após preencher o `.env.local`, rode o servidor de desenvolvimento e verifique:

```bash
pnpm dev
```

Acesse `http://localhost:3000` — deve redirecionar para `/login`. Se a tela de login carregar sem erros no console, as variáveis estão corretas.
