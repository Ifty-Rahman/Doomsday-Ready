# Doomsday Ready

Full-stack app for MCU fans: plan a rewatch before *Avengers: Doomsday* and check opening-night seat bundles. Details in `plan.md`.

## Pages (in order)
1. **Rewatch Order**: pick a movie, see its prerequisites in order with watched ticks, progress and remaining runtime.
2. **Movies**: add, edit, delete movies; set prerequisites (409 `CIRCULAR_DEPENDENCY` on loops); tick watched.
3. **Cinemas**: add cinemas with bundle sizes (added one at a time); check a group size against a saved cinema.

## Stack
TypeScript, Node, Express, Zod, PostgreSQL, Prisma, React, Vite, React Router, TanStack Query, react-hook-form, Tailwind, shadcn/ui, Vitest, Docker Compose.

## Structure (npm workspaces)
```
apps/api          Express + Prisma (routes/, algorithms/, middleware/, prisma/)
apps/web          React app (pages/, components/, api/)
packages/shared   Zod schemas, constants and types used by both apps
docker-compose.yml, plan.md, README.md
```

## Data model
- **Movie**: id, title (unique, case-insensitive), releaseYear (2008-2026), runtime (1-300), watched (default false), prerequisites (movie-to-movie links stored in `MoviePrerequisite` with a `position`, so the user can drag to reorder them).
- **Cinema**: id, name (unique, case-insensitive), bundleSizes (1-10 sizes, 1-500 each).

## Rules
- Cycle check, rewatch order and bundle DP are hand-written (no libraries) and tested in `apps/api/src/algorithms`.
- Errors return `{ code, message }`. A movie that others depend on cannot be deleted (409).
- Booking "not possible" is HTTP 200 with `{ possible: false }`.
- Commands: `npm run dev`, `npm test`, `npm run typecheck`.
