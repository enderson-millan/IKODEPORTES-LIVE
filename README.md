# ⚽ MataMata.live — Copa do Mundo 2026 Pick'em

App de palpites do mata-mata da Copa do Mundo 2026. Usuários fazem login com Google, escolhem quem avança em cada rodada eliminatória e competem num placar ao vivo.

> **"Mata-mata"** — expressão brasileira para fase eliminatória (knockout stage).

## 🌟 Visão Geral

**MataMata.live** é uma plataforma de palpites focada no público brasileiro e latino-americano, oferecendo:

- **🏆 Chaveamento interativo** — R32 → Oitavas → Quartas → Semifinais → 3º Lugar → Final; clique no time para palpitar quem avança
- **🔒 Palpites bloqueados automaticamente** — assim que uma partida entra em LIVE ou FINISHED, o palpite é travado
- **📊 Placar ao vivo** — ranking completo com pontos, acertos e tendência de cada participante
- **📺 Transmissões ao vivo** — embed de streams dos jogos em andamento
- **🌐 Interface multilíngue** — Português (padrão), Espanhol e Inglês
- **🌙 Tema claro/escuro** — toggle persistido no cliente

## 🏗️ Stack Tecnológica

| Camada          | Tecnologia                                                              |
| --------------- | ----------------------------------------------------------------------- |
| Framework       | **Next.js 16** (App Router) — rotas em `app/`                           |
| Runtime UI      | **React 19** + **TypeScript 5** (strict)                                |
| Estilo          | **Tailwind CSS v4** + **shadcn/ui** (New York, slate, CSS vars)         |
| Ícones          | **lucide-react**                                                        |
| State global    | **React Context** (`src/lib/app-context.tsx`) — lang, theme, user       |
| Data fetching   | **TanStack Query v5** — todas as chamadas async                         |
| Backend / Auth  | **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`) — Google OAuth |
| Formulários     | **React Hook Form v7** + **Zod v3** + `@hookform/resolvers`             |
| Datas           | **dayjs**                                                               |
| Utilitários     | `cn()` via **clsx + tailwind-merge** (`src/lib/utils.ts`)               |
| Package manager | **pnpm** (obrigatório — nunca npm/yarn)                                 |
| Deploy          | **Vercel** (recomendado)                                                |

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Conta no [supabase.com](https://supabase.com) (gratuita)
- Projeto Google Cloud com OAuth 2.0 configurado

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/world-cup-picks.git
cd world-cup-picks
```

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com os valores do seu projeto Supabase (veja [docs/supabase-setup.md](docs/supabase-setup.md) para o guia completo):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Criar tabelas no banco

Execute os SQLs no **SQL Editor** do Supabase Dashboard (na ordem abaixo):

**Tabela `picks`:**

```sql
create table public.picks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  espn_event_id  text not null,
  team_id        text not null,
  score_a        int,
  score_b        int,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint picks_unique_user_event unique (user_id, espn_event_id)
);

alter table public.picks enable row level security;

create policy "users read own picks"   on public.picks for select using (auth.uid() = user_id);
create policy "users insert own picks" on public.picks for insert with check (auth.uid() = user_id);
create policy "users update own picks" on public.picks for update using (auth.uid() = user_id);
```

**Tabela `match_results`:**

```sql
create table public.match_results (
  espn_event_id  text primary key,
  winner_team_id text not null,
  stage          text not null,
  updated_at     timestamptz default now()
);
-- Leitura pública; escrita apenas via service role
```

**View `ranking_view`:**

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

### 5. Iniciar o servidor de desenvolvimento

```bash
pnpm dev
# App disponível em http://localhost:3000
```

## 📁 Estrutura do Projeto

```
world-cup-picks/
├── app/                            # Next.js App Router (rotas e layouts)
│   ├── layout.tsx                  # Root layout — html/body, metadata, providers
│   ├── page.tsx                    # Redireciona para /login
│   ├── globals.css                 # Imports CSS globais
│   ├── api/
│   │   └── matches/route.ts        # API route — busca partidas via ESPN API
│   ├── auth/
│   │   └── callback/route.ts       # Callback OAuth do Supabase
│   ├── bracket/
│   │   └── page.tsx                # Página de chaveamento
│   ├── live/
│   │   ├── page.tsx                # Página de transmissões ao vivo
│   │   └── _components/
│   │       └── LiveView.tsx        # Componente de streams e jogos ao vivo
│   ├── login/
│   │   └── page.tsx                # Página de login
│   └── ranking/
│       └── page.tsx                # Página de ranking
│
├── src/                            # Código-fonte (alias @/*)
│   ├── assets/                     # Imagens estáticas (mascot, stadium-bg, trophy)
│   ├── actions/
│   │   ├── picks.ts                # Server Actions: getPicks, savePick
│   │   └── ranking.ts              # Server Action: getRanking
│   ├── components/
│   │   ├── ui/                     # Primitivas shadcn/ui — NÃO editar manualmente
│   │   ├── AppHeader.tsx           # Barra de navegação (logo, links, lang, tema)
│   │   ├── AuthProvider.tsx        # Sync sessão Supabase → AppContext
│   │   ├── BracketMatchCard.tsx    # Card de partida no chaveamento
│   │   ├── BracketPickerDrawer.tsx # Drawer para confirmar palpite
│   │   ├── BracketView.tsx         # Chaveamento completo (todas as rodadas)
│   │   ├── Footer.tsx              # Rodapé
│   │   ├── LoginPage.tsx           # Tela de login com botão Google OAuth
│   │   ├── MatchCard.tsx           # Card genérico de partida
│   │   ├── providers.tsx           # Composição de providers globais
│   │   └── RankingView.tsx         # Tabela de ranking com posição do usuário
│   ├── hooks/
│   │   ├── queries/                # TanStack Query — hooks de leitura
│   │   ├── mutations/              # TanStack Query — hooks de escrita
│   │   └── use-mobile.tsx          # Hook de breakpoint responsivo
│   ├── lib/
│   │   ├── app-context.tsx         # Context global + dicionário i18n (PT/ES/EN)
│   │   ├── mock-matches.ts         # Dados mock de partidas e ranking
│   │   ├── types.ts                # Tipos de domínio: Match, Team, RankRow, Pick…
│   │   └── utils.ts                # cn() utility (clsx + tailwind-merge)
│   └── styles.css                  # Tailwind base + CSS variables (shadcn tokens)
│
├── docs/                           # Documentação técnica
│   ├── supabase-setup.md           # Guia completo de configuração do Supabase
│   ├── supabase-oauth-setup.md     # Configuração Google OAuth
│   ├── live-streams-guide.md       # Guia de transmissões ao vivo
│   ├── live-streams-setup.sql      # SQL para tabela de streams
│   ├── ranking-avatar-fix.sql      # Fix de avatar no ranking
│   └── score-picks-migration.sql   # Migração para palpites com placar
│
├── .kiro/
│   ├── specs/                      # Feature specs (requirements, design, tasks)
│   └── steering/                   # Regras para agentes de IA
│
├── .env.local.example              # Template de variáveis de ambiente
├── components.json                 # Configuração shadcn/ui
├── next.config.ts                  # Next.js config
├── tsconfig.json                   # TypeScript config (strict)
└── package.json
```

## 🔧 Variáveis de Ambiente

| Variável                        | Descrição                                  | Exposta ao browser?     |
| ------------------------------- | ------------------------------------------ | ----------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase                    | ✅ Sim (seguro)         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima pública (respeitando RLS)    | ✅ Sim (seguro com RLS) |
| `SUPABASE_SERVICE_ROLE_KEY`     | Chave de serviço (bypassa RLS — só server) | ❌ Nunca ao cliente     |

> Veja o guia detalhado em [docs/supabase-setup.md](docs/supabase-setup.md).

## 🛠️ Comandos

```bash
pnpm dev        # Servidor de desenvolvimento (http://localhost:3000)
pnpm build      # Build de produção
pnpm preview    # Preview do build (next start)
pnpm lint       # ESLint
pnpm format     # Prettier
```

## 🔐 Autenticação

Login exclusivo via **Google OAuth 2.0** através do Supabase Auth.

| Fluxo             | Descrição                                                   |
| ----------------- | ----------------------------------------------------------- |
| Login             | `/login` → botão Google → redirect para Supabase → callback |
| Callback          | `app/auth/callback/route.ts` — troca code por sessão        |
| Sessão            | Gerenciada pelo `@supabase/ssr` com cookies HttpOnly        |
| Proteção de rotas | `middleware.ts` — redireciona unauthenticated para `/login` |
| Dados do usuário  | `raw_user_meta_data` (nome, avatar) via `auth.users`        |

## 🏆 Sistema de Palpites e Pontuação

### Como funciona

1. Usuário autenticado navega até `/bracket`
2. Clica no time que acredita que vai avançar em cada partida
3. Um drawer confirma a escolha antes de salvar (upsert via Server Action)
4. Palpites são **bloqueados** quando o status da partida muda para `LIVE` ou `FINISHED`
5. Palpites opcionais de placar exato (score_a, score_b) estão suportados na tabela

### Pontuação (ranking_view)

| Acerto           | Pontos |
| ---------------- | ------ |
| Vencedor correto | 10 pts |

O ranking é calculado em tempo real via view materializada no Supabase, somando 10 pontos por palpite correto.

## 🌐 Internacionalização (i18n)

Suporte a 3 idiomas via dicionário embutido em `src/lib/app-context.tsx`:

| Idioma    | Código | Status |
| --------- | ------ | ------ |
| Português | `PT`   | Padrão |
| Espanhol  | `ES`   | ✅     |
| Inglês    | `EN`   | ✅     |

Para usar em componentes:

```tsx
const { t } = useApp();
<h1>{t("bracket")}</h1>; // "Chaveamento" / "Llaves" / "Bracket"
```

A preferência de idioma é persistida no `localStorage`.

## 📡 API Routes

| Método | Rota           | Descrição                                        |
| ------ | -------------- | ------------------------------------------------ |
| `GET`  | `/api/matches` | Busca partidas da Copa 2026 via ESPN API pública |

## 🗄️ Banco de Dados (Supabase)

### Tabelas

| Tabela          | Descrição                                               |
| --------------- | ------------------------------------------------------- |
| `picks`         | Palpites dos usuários (user_id + espn_event_id único)   |
| `match_results` | Resultados oficiais das partidas (preenchido por admin) |

### Views

| View           | Descrição                                      |
| -------------- | ---------------------------------------------- |
| `ranking_view` | Ranking calculado: pontos, acertos por usuário |

### Row Level Security (RLS)

- `picks` — usuário lê/insere/atualiza apenas seus próprios palpites
- `match_results` — leitura pública; escrita via `SUPABASE_SERVICE_ROLE_KEY` (server only)

## 🖼️ Domínios de Imagem Permitidos

Configurados em `next.config.ts` para o componente `next/image`:

| Domínio                     | Uso                       |
| --------------------------- | ------------------------- |
| `a.espncdn.com`             | Escudos dos times (ESPN)  |
| `flagcdn.com`               | Bandeiras das seleções    |
| `lh3.googleusercontent.com` | Fotos de perfil do Google |

## 🤝 Contribuição

Seguimos [Conventional Commits](https://www.conventionalcommits.org/) com letras **minúsculas**:

```
feat: adiciona nova funcionalidade
fix: corrige bug no módulo x
docs: atualiza documentação
refactor: refatora componente de ranking
chore: atualiza dependências
```

Nomenclatura: arquivos em `kebab-case`, componentes React em `PascalCase`, funções/variáveis em `camelCase`.

## 📄 Licença

MIT — veja [LICENSE](LICENSE) para detalhes.
