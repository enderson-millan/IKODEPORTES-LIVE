# Product: MataMata.live

A World Cup 2026 bracket pick'em web app where users sign in, make match predictions across the knockout rounds, and compete on a live leaderboard.

## Core Features

- **Google OAuth login** via Supabase Auth
- **Bracket view** — knockout stage matches (R16 → QF → SF → 3rd Place → Final) displayed as cards; users click to pick who advances
- **Picks locked** once a match is no longer UPCOMING (LIVE or FINISHED)
- **Live leaderboard** — ranked list of all participants with points, hits, and trend indicator
- **Multi-language UI** — Portuguese (PT), Spanish (ES), English (EN) via a built-in dictionary (`app-context.tsx`)
- **Dark/light theme** toggle

## Target Users

Football fans participating in a Copa do Mundo 2026 prediction pool — primarily Brazilian/Latin American audience (default language: PT).

## App Name & Branding

`MataMata.live` — "mata-mata" means knockout stage in Brazilian Portuguese.
