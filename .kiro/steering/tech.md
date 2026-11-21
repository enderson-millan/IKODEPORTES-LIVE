# Tech Stack

## Framework & Runtime

- **Next.js 16** (App Router) — `app/` directory for routes and layouts
- **React 19**
- **TypeScript 5** — strict mode, `@/*` maps to `./src/*`
- **Node.js** (via pnpm)

## Styling

- **Tailwind CSS v4** — utility-first; config driven by `src/styles.css`
- **shadcn/ui** (New York style, slate base, CSS variables) — component source in `src/components/ui/`
- **lucide-react** — icon library

## State & Data

- **React Context** (`src/lib/app-context.tsx`) — global lang, theme, and picks state
- **TanStack Query v5** — for all async data fetching (queries and mutations)
- **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`) — auth and backend data
- **Mock data** in `src/lib/mock-matches.ts` during development

## Forms & Validation

- **React Hook Form v7**
- **Zod v3** — schema validation via `@hookform/resolvers`

## Utilities

- **dayjs** — date formatting and manipulation (prefer over date-fns)
- **clsx + tailwind-merge** — conditional classnames via `cn()` in `src/lib/utils.ts`
- **class-variance-authority** — variant-based component styling

## Dev Tooling

- **pnpm** — package manager (always use pnpm, never npm/yarn)
- **ESLint 9** + **Prettier** — linting and formatting
- **TypeScript** — `ignoreBuildErrors: true` in next.config.ts (temporary, during migration)

## Common Commands

```bash
# Development server (run manually in terminal)
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Lint
pnpm lint

# Format
pnpm format
```

## Image Domains (next.config.ts)

Allowed remote image hosts: `a.espncdn.com`, `flagcdn.com`, `lh3.googleusercontent.com`
