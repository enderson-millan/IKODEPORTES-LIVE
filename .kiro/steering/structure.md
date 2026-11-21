# Project Structure

```
world-cup-picks/
├── app/                        # Next.js App Router (routes & layouts)
│   ├── layout.tsx              # Root layout — html/body, metadata
│   ├── page.tsx                # Root → redirects to /login
│   └── globals.css             # Global CSS imports
│
├── src/                        # Application source (aliased as @/*)
│   ├── assets/                 # Static images (mascot, stadium-bg, trophy)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives (do not edit manually)
│   │   ├── AppHeader.tsx       # Top navigation bar
│   │   └── MatchCard.tsx       # Single match pick card
│   ├── hooks/
│   │   └── use-mobile.tsx      # Responsive breakpoint hook
│   ├── lib/
│   │   ├── app-context.tsx     # Global context: lang, theme, picks + i18n dict
│   │   ├── mock-matches.ts     # Match/Team/RankRow types + mock data
│   │   └── utils.ts            # cn() utility (clsx + tailwind-merge)
│   └── styles.css              # Tailwind base + CSS variables (shadcn tokens)
│
├── .kiro/
│   ├── specs/                  # Feature specs (requirements, design, tasks)
│   └── steering/               # AI steering rules
│
├── components.json             # shadcn/ui config
├── next.config.ts              # Next.js config
├── tsconfig.json               # TypeScript config
└── package.json
```

## Key Conventions

- **File naming**: kebab-case for all files and folders
- **Components**: PascalCase filenames, named exports preferred
- **Imports**: use `@/` alias for everything under `src/`
- **Page-specific components**: place in a `_components/` subfolder inside the route directory
- **Route pages**: created under `app/` using Next.js App Router conventions
- **shadcn/ui components**: scaffold with `pnpm dlx shadcn@latest add <component>` — do not hand-edit files in `src/components/ui/`
- **New queries/mutations**: create in `src/hooks/queries/` and `src/hooks/mutations/` following TanStack Query patterns
- **Types**: use `interface` over `type` aliases; define domain types in `src/lib/` or colocate with the feature

## Migration Context

The project is currently migrating from TanStack Router (legacy `src/` pages) to Next.js App Router. New pages go in `app/`. TypeScript build errors in legacy `src/` files are intentionally ignored during migration.
