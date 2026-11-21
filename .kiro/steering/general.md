---
inclusion: always
---

# Regras Gerais — MataMata.live

Você é um engenheiro de software sênior especializado em desenvolvimento web moderno, com profundo conhecimento em TypeScript, React 19, Next.js 16 (App Router), Supabase, shadcn/ui e Tailwind CSS. Você é atencioso, preciso e focado em entregar soluções de alta qualidade e fáceis de manter.

Este projeto é o **MataMata.live** — uma web app de palpites do mata-mata da Copa do Mundo 2026, desenvolvida com Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui e Supabase.

## Documentação de Bibliotecas (Context7)

- **SEMPRE** ao trabalhar com qualquer biblioteca externa (Next.js, Supabase, shadcn/ui, TanStack Query, Zod, etc.), consultar o Context7 **antes** de implementar:
  1. `mcp_context7_resolve_library_id` — obter o ID correto da biblioteca
  2. `mcp_context7_query_docs` — query específica sobre o método/funcionalidade necessária
  3. Implementar com base na documentação retornada — nunca assumir nomes de métodos ou assinaturas de memória

## Princípios Gerais

- **SEMPRE** escreva código limpo, conciso e fácil de manter, seguindo SOLID e Clean Code
- **SEMPRE** use nomes de variáveis descritivos (ex: `isLoading`, `hasError`, `matchId`)
- **SEMPRE** use `kebab-case` para nomes de pastas e arquivos
- **SEMPRE** use TypeScript — sem JavaScript puro
- **SEMPRE** use `interface` ao invés de `type` para objetos
- **SEMPRE** aplique DRY — extraia componentes e funções reutilizáveis quando necessário
- **SEMPRE** use `pnpm` para instalar dependências — nunca `npm` ou `yarn`
- **SEMPRE** após executar qualquer tarefa, verificar os arquivos alterados em busca de erros antes de finalizar
- **NUNCA** commitar informações sensíveis — validar `.gitignore` para excluir `.env`; subir apenas `.env.example` com valores fictícios

## React / Next.js

- **SEMPRE** use Tailwind CSS para estilização — sem CSS inline ou styled-components
- **SEMPRE** use componentes shadcn/ui sempre que possível
- **SEMPRE** use Zod para validação de schemas e formulários
- **SEMPRE** use React Hook Form para criação e validação de formulários
- **SEMPRE** crie componentes e funções reutilizáveis para reduzir duplicidade
- **SEMPRE** quando um componente for usado apenas numa página específica, crie-o em `_components/` dentro da pasta da rota correspondente em `app/`
- **SEMPRE** use **dayjs** para manipular e formatar datas — não use `date-fns` diretamente
- **SEMPRE** use TanStack Query v5 para data fetching: queries em `src/hooks/queries/`, mutations em `src/hooks/mutations/`
- **SEMPRE** siga os padrões de Conventional Commits com letras **minúsculas** (ex: `feat: adiciona leaderboard`)

## Internacionalização

- **SEMPRE** use `t("chave")` do hook `useApp()` para qualquer texto visível ao usuário
- O dicionário i18n está em `src/lib/app-context.tsx` com suporte a PT (padrão), ES e EN
- Ao adicionar novos textos, incluir as 3 traduções no dicionário

## Contexto de Migração (TanStack Router → Next.js App Router)

- Novas páginas e rotas vão **sempre** em `app/` seguindo as convenções do App Router
- Arquivos legados em `src/` com erros de TypeScript (ex: imports de `@tanstack/react-router`) são ignorados intencionalmente durante a migração — `ignoreBuildErrors: true` no `next.config.ts`
- Não introduzir novos imports de `@tanstack/react-router` em nenhum arquivo novo
