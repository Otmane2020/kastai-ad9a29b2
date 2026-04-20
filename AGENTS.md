# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Kast AI is a React SPA (Vite + TypeScript + TailwindCSS + shadcn/ui) for AI-powered demand forecasting. The backend is fully hosted on Supabase (auth, PostgreSQL, edge functions). There is no local backend to start.

### Key commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (port 8080) |
| Lint | `npm run lint` |
| Unit tests | `npm run test` |
| Build | `npm run build` |

### Non-obvious notes

- The `.env` file contains Supabase cloud credentials (project URL + anon key). The app works against the remote Supabase instance out of the box — no local Supabase setup required.
- ESLint reports ~57 pre-existing `@typescript-eslint/no-explicit-any` errors and ~20 `react-refresh/only-export-components` warnings. These are part of the existing codebase; do not attempt to fix them unless explicitly asked.
- The app has both a remote Railway ML API (accessed via Supabase edge function `railway-proxy`) and a local JS fallback forecast engine (`src/lib/forecastEngine.ts`). If the Railway API is unavailable, the app automatically falls back to local JS models — the UI shows a "Moteur JS local" badge.
- Both `package-lock.json` (npm) and `bun.lock` exist. Use `npm` as the canonical package manager since the lockfile is more complete.
- Vite dev server listens on `::` (all interfaces) at port 8080, configured in `vite.config.ts`.
- Supabase edge functions (`supabase/functions/`) are deployed to the cloud Supabase project and cannot be tested locally without the Supabase CLI and appropriate secrets.
