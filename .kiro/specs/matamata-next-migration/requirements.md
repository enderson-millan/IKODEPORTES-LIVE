# Requirements Document

## Introduction

Migração do projeto MataMata.live do stack atual (TanStack Start + Vite + Lovable) para Next.js 16 App Router com React 19, no mesmo repositório. O objetivo é substituir toda a infraestrutura de framework, autenticação e dados, preservando integralmente a UI gerada pelo Lovable.

**Stack de destino:**

- Framework: Next.js 16 (App Router) — sem Lovable, sem TanStack Start, sem Vite
- Autenticação: Supabase Auth (OAuth Google)
- Banco de dados: Supabase (PostgreSQL) — picks e ranking
- Dados de jogos: ESPN API pública (proxy via Next.js Route Handler)
- Styling: Tailwind CSS v4 (mantido idêntico, troca plugin Vite → PostCSS)
- UI: shadcn/ui + Radix UI (mantidos idênticos, zero mudanças visuais)
- Estado/fetching: TanStack Query v5 (mantido)
- Idioma padrão: Português (PT-BR)

## Requirements

### RF-01 — Autenticação com Google

1. O sistema DEVE permitir login exclusivamente via Google OAuth usando Supabase Auth.
2. Após login bem-sucedido, o usuário DEVE ser redirecionado para `/bracket`.
3. As rotas `/bracket` e `/ranking` DEVEM ser protegidas — usuários não autenticados são redirecionados para `/login` via `middleware.ts`.
4. O usuário DEVE poder fazer logout a partir do header, retornando para `/login`.
5. O avatar e nome do usuário logado (vindos do perfil Google via Supabase metadata) DEVEM aparecer no header.
6. A sessão DEVE ser gerenciada via cookies SSR usando `@supabase/ssr` para funcionar tanto em Server Components quanto em Client Components.

### RF-02 — Tela de Login (`/login`)

1. A tela DEVE exibir a UI existente do Lovable (stadium background, flag ring, trophy, mascot, card com botão circular Google) sem alterações visuais.
2. O botão "Entrar com o Google" DEVE chamar `supabase.auth.signInWithOAuth({ provider: 'google' })`.
3. DEVE existir um Route Handler em `app/auth/callback/route.ts` para processar o código de retorno do OAuth e criar a sessão.
4. Em caso de erro no callback, o usuário DEVE ser redirecionado para `/login?error=auth_failed`.

### RF-03 — Dados dos Jogos via ESPN API

1. Os dados de partidas do mata-mata DEVEM vir da ESPN API pública (`site.api.espn.com`).
2. O frontend NÃO DEVE chamar a ESPN diretamente — toda comunicação passa pelo proxy interno Next.js.
3. O proxy DEVE ser implementado como Route Handler em `app/api/matches/route.ts`.
4. O proxy DEVE buscar jogos de todas as fases do mata-mata da Copa 2026 usando o parâmetro `groups` (valores 2 a 7).
5. O proxy DEVE normalizar a resposta da ESPN para os tipos internos `Match` e `Team`.
6. Em caso de falha da ESPN, o proxy DEVE retornar os dados do `mock-matches.ts` como fallback com header `X-Data-Source: fallback`.
7. A Copa 2026 tem 48 seleções e um stage adicional `r32` (Round of 32) DEVE ser adicionado ao `stageOrder`.

### RF-04 — Cache Inteligente da ESPN

1. Se há jogo com status `LIVE`: o cache DEVE ser de **30 segundos** (`revalidate: 30`).
2. Se há jogo hoje mas ainda não começou (`UPCOMING`): o cache DEVE ser de **120 segundos**.
3. Sem jogos ativos hoje: o cache DEVE ser de **300 segundos**.
4. O TanStack Query no client DEVE usar `refetchInterval` de 30s apenas quando há partida LIVE.

### RF-05 — Bracket / Chaveamento (`/bracket`)

1. A tela DEVE exibir todos os jogos do mata-mata agrupados por fase.
2. No mobile: DEVE exibir tabs por fase (R32, Oitavas, Quartas, Semi, 3º, Final) com cards da fase ativa.
3. No desktop: DEVE exibir layout horizontal com todas as fases em colunas simultâneas.
4. Cada `MatchCard` DEVE exibir: status (LIVE/UPCOMING/FINISHED), horário/data, times com logo (imagem ESPN CDN), placar quando aplicável.
5. O logo dos times DEVE usar `<Image>` do Next.js com URLs do ESPN CDN (`a.espncdn.com/i/teamlogos/countries/500/{abbr}.png`).
6. Os emojis de bandeira do projeto atual DEVEM ser substituídos por imagens reais do ESPN CDN.

### RF-06 — Pick'em (Palpites)

1. Usuários autenticados DEVEM poder clicar em um time para registrar seu palpite em partidas `UPCOMING`.
2. Palpites DEVEM ser salvos no Supabase (tabela `picks`) via Server Action.
3. DEVE haver apenas 1 palpite por usuário por partida (upsert com `unique(user_id, espn_event_id)`).
4. Partidas `LIVE` ou `FINISHED` DEVEM ter o pick bloqueado (disabled), exibindo apenas o palpite feito e se acertou ou errou.
5. O estado de picks DEVE usar **optimistic update** via TanStack Query — a UI responde imediatamente antes da confirmação do servidor.
6. Ao carregar a tela, os picks existentes do usuário DEVEM ser carregados via Server Action `getPicks()`.

### RF-07 — Ranking / Leaderboard (`/ranking`)

1. A tela DEVE exibir pódio visual (1º, 2º, 3º lugar) com avatar, nome e pontuação.
2. A tela DEVE exibir tabela com posição, avatar, nome, pontos, acertos e tendência (↑↓→).
3. A linha do usuário logado DEVE aparecer fixada no final da tabela, destacada em verde, mesmo que não esteja no top listado.
4. A pontuação DEVE ser de **10 pontos** por palpite correto.
5. Os dados de ranking DEVEM vir de uma view no Supabase via Server Action `getRanking()`.
6. O avatar DEVE usar a foto do Google (`avatar_url` do Supabase Auth metadata) quando disponível.

### RF-08 — Header / Navegação

1. O header DEVE ser sticky com links para Chaveamento e Ranking.
2. DEVE haver seletor de idioma: PT 🇧🇷 / ES 🇪🇸 / EN 🇺🇸 com comportamento idêntico ao atual.
3. DEVE haver alternador de tema claro/escuro usando `next-themes`.
4. DEVE haver avatar do usuário logado com dropdown mostrando nome e opção de logout.
5. A navegação DEVE usar `next/link` e `usePathname` substituindo as primitivas do TanStack Router.

### RF-09 — Internacionalização (i18n)

1. O dicionário `dict` existente em `app-context.tsx` com traduções PT/ES/EN DEVE ser mantido.
2. O idioma padrão DEVE ser PT (Português).
3. A seleção de idioma DEVE ser client-side (sem URL locale), persistida em `localStorage`.

### RNF-01 — Remoção total do Lovable/TanStack Start

1. DEVEM ser removidos: `@lovable.dev/vite-tanstack-config`, `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/router-plugin`, `vite`, `nitro`, `vite.config.ts`, `bunfig.toml`, `bun.lock`, `.lovable/`, `src/server.ts`, `src/start.ts`, `src/router.tsx`, `src/routeTree.gen.ts`.
2. O diretório `src/routes/` DEVE ser removido integralmente (substituído por `app/`).
3. O arquivo `AGENTS.md` DEVE ser atualizado para remover todas as instruções do Lovable.

### RNF-02 — Next.js 16 + React 19

1. O projeto DEVE usar Next.js **16** com App Router.
2. Server Components DEVEM ser o padrão; `"use client"` usado apenas onde necessário (contextos, hooks de estado, interatividade).

### RNF-03 — Tailwind CSS v4

1. O `styles.css` existente (variáveis oklch, `@import "tailwindcss"`) DEVE ser mantido com ajuste mínimo para PostCSS.
2. O plugin `@tailwindcss/vite` DEVE ser substituído por `@tailwindcss/postcss`.

### RNF-04 — Segurança

1. Row Level Security (RLS) DEVE ser habilitado na tabela `picks`.
2. Usuário só DEVE acessar e modificar os próprios picks.
3. `SUPABASE_SERVICE_ROLE_KEY` NUNCA DEVE ser exposta ao client bundle.
4. Os clientes Supabase DEVEM ser separados para server (`createServerClient`) e browser (`createBrowserClient`).

### RNF-05 — Performance

1. Dados de jogos DEVEM ser server-cached via `fetch` com `next: { revalidate }` dinâmico.
2. Imagens de logos DEVEM usar `next/image` com domínio `a.espncdn.com` configurado em `next.config.ts`.

### RNF-06 — Preservação Visual

1. NENHUMA mudança visual DEVE ocorrer nas telas de Login, Bracket e Ranking.
2. Componentes `shadcn/ui` em `src/components/ui/` DEVEM ser mantidos sem alterações.
3. Os assets visuais (`stadium-bg.jpg`, `trophy.png`, `mascot.png`) DEVEM ser preservados.

## Glossary

- **TanStack Start**: Framework fullstack baseado em Vite e TanStack Router, utilizado no projeto original gerado pelo Lovable.
- **Lovable**: Plataforma de geração de UI por IA que produziu o código original deste projeto.
- **ESPN API**: API pública não oficial da ESPN acessível em `site.api.espn.com`, sem autenticação.
- **Pick'em / Palpite**: Mecanismo onde o usuário seleciona qual time vai avançar em cada partida antes dela começar.
- **Proxy**: Route Handler Next.js que intermedia as chamadas à ESPN API, adicionando cache e normalização.
- **RLS**: Row Level Security — sistema de políticas de acesso a nível de linha no PostgreSQL/Supabase.
- **Optimistic Update**: Técnica onde a UI é atualizada imediatamente antes da confirmação do servidor, revertendo em caso de erro.
- **Stage**: Fase do torneio (r32, r16, qf, sf, third, final).
- **groups**: Parâmetro da ESPN API que filtra por fase do torneio (valores 2–7 para as fases do mata-mata).
- **SSR**: Server-Side Rendering — renderização no servidor, necessária para autenticação segura com Supabase.
