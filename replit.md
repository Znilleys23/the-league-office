# FPL League Manager

A premium private-league hub that turns Fantasy Premier League scores into standings, head-to-head fixtures, and custom competitions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract; regenerate clients after editing.
- `artifacts/api-server/src/routes/leagues.ts` — league dashboard, standings, fixtures, and competition endpoints.
- `artifacts/fpl-league-manager/src/App.tsx` — app routes and client-side league experience.
- `artifacts/fpl-league-manager/src/index.css` — visual tokens and product styling.

## Architecture decisions

- The first-release league API returns a coherent seeded league snapshot so every major screen works before a real FPL league is connected.
- OpenAPI is the source of truth for both the Express response validation and generated React Query hooks.
- Clerk provides sign-in and sign-up; browsing the home dashboard remains open so prospective league members can understand the product before joining.

## Product

- League dashboard with gameweek context, activity, leader, and power-ranking signals.
- Traditional FPL standings and head-to-head tables with a current-fixture view.
- A league connection/create flow and a working competition creation surface.
- Branded authentication routes for user registration and login.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run OpenAPI code generation after changing the spec; API server and frontend import the generated outputs.
- Vite services require workflow-provided `PORT` and `BASE_PATH`; use their managed workflows rather than a root dev command.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
