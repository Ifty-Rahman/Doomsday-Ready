# Doomsday Ready: Build Plan

## 1. What we are building

A small web app for MCU fans with three pages, in this order:

1. **Rewatch Order**: pick a movie and see every movie you should watch before it, in the right order.
2. **Movies**: add, edit and delete movies. Set which movies must be watched first. Tick movies as watched.
3. **Cinemas**: add and delete cinemas with their seat bundle sizes. Check whether a group size can be booked exactly, and with how few bundles.

## 2. Tech stack

| Part | Choice | Why |
|---|---|---|
| Language | TypeScript everywhere | One language, shared types |
| Backend | Node + Express | Simple REST API |
| Validation | Zod | One set of rules used by the API and the forms |
| Database | PostgreSQL | Required |
| DB access | Prisma | Typed queries and migrations |
| Frontend | React + Vite | Fast and simple |
| Routing | React Router | Three pages |
| Server data | TanStack Query | Fetching, caching, refreshing after changes |
| Forms | react-hook-form + shared Zod schemas | Same validation as the API |
| Styling | Tailwind + shadcn/ui | Ready-made components, MCU theme on top |
| Tests | Vitest | For the two hand-written algorithms |
| Run everything | Docker Compose | One command |

## 3. Repo structure

npm workspaces monorepo:

```
Doomsday Ready/
├── apps/
│   ├── api/                  Backend
│   │   ├── prisma/           schema.prisma and migrations
│   │   └── src/
│   │       ├── index.ts          starts the server
│   │       ├── app.ts            Express setup and routes
│   │       ├── routes/           movies.ts, cinemas.ts
│   │       ├── algorithms/       cycle.ts, rewatchOrder.ts, bundles.ts (+ tests)
│   │       ├── middleware/       validate.ts, errorHandler.ts
│   │       └── db.ts             Prisma client
│   └── web/                  Frontend
│       └── src/
│           ├── pages/            RewatchOrder, Movies, Cinemas
│           ├── components/       forms, lists, chips, progress bar, ui/ (shadcn)
│           ├── api/              fetch helpers and TanStack Query hooks
│           └── main.tsx          router and providers
├── packages/
│   └── shared/               Zod schemas and types used by both apps
├── docker-compose.yml
├── plan.md
└── README.md
```

## 4. Data model

```
┌───────────────────────┐          ┌──────────────────────┐
│ Movie                 │          │ Cinema               │
├───────────────────────┤          ├──────────────────────┤
│ id          (PK)      │          │ id          (PK)     │
│ title       (unique)  │          │ name        (unique) │
│ releaseYear (2008-2026)│         │ bundleSizes (Int[])  │
│ runtime     (1-300)   │          │   1-10 sizes, 1-500  │
│ watched     (bool, default false) │          └──────────────────────┘
└───────────────────────┘
        ▲        │
        │        │ many-to-many with itself
        └────────┘ "prerequisites"
```

- A movie can have many prerequisites, and can be a prerequisite of many movies.
- Prisma stores this in a hidden link table between movies.
- Cinemas are separate. They have no link to movies.
- A movie that other movies list as a prerequisite cannot be deleted (409). Remove it from their lists first.

## 5. API (all under `/api`)

| Method and path | What it does |
|---|---|
| `POST /movies` | Create a movie (with optional prerequisites) |
| `GET /movies` | List movies with their prerequisites |
| `PATCH /movies/:id` | Update fields, watched, or prerequisites |
| `DELETE /movies/:id` | Delete a movie |
| `GET /movies/:id/rewatch-order` | Ordered prerequisites, watched count, remaining runtime |
| `POST /cinemas` | Create a cinema |
| `GET /cinemas` | List cinemas |
| `DELETE /cinemas/:id` | Delete a cinema |
| `GET /cinemas/:id/booking?groupSize=6` | Fewest bundles for an exact group size |

**Response shapes**

Rewatch order (`GET /movies/:id/rewatch-order`):
```json
{
  "target": { "id": 8, "title": "Avengers: Doomsday" },
  "order": [{ "id": 1, "title": "Iron Man", "runtime": 126, "watched": true }],
  "watchedCount": 1,
  "totalCount": 1,
  "remainingRuntime": 0
}
```

Booking (`GET /cinemas/:id/booking?groupSize=11`), always HTTP 200 for valid input:
```json
{ "possible": true, "groupSize": 11, "totalBundles": 4,
  "bundles": [{ "size": 5, "count": 1 }, { "size": 2, "count": 3 }] }
```
or `{ "possible": false, "groupSize": 7 }` when no exact combination exists.

`PATCH /movies/:id` takes any of `title`, `releaseYear`, `runtime`, `watched`, `prerequisiteIds`. If `prerequisiteIds` is sent it **replaces** the whole list. Unknown ids are rejected with 400.

**Errors** always come back as `{ "code": "...", "message": "..." }`.

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad input (year out of range, runtime, bundle sizes, group size) |
| 404 | `NOT_FOUND` | Movie or cinema does not exist |
| 409 | `CIRCULAR_DEPENDENCY` | A create or update would make a loop |
| 409 | `MOVIE_IS_PREREQUISITE` | Deleting a movie that other movies still depend on |
| 409 | `DUPLICATE_TITLE` / `DUPLICATE_CINEMA_NAME` | Name already used (compared case-insensitively) |

## 6. The three algorithms (written by hand)

**Circular dependency check.** Before saving prerequisites for a movie, walk "forward" from each proposed prerequisite through its own prerequisites. If we ever reach the movie being edited, it would form a loop, so return 409. This also catches a movie listing itself.

**Rewatch order.** Start at the target movie and visit its prerequisites first, then their prerequisites, and so on. A movie is added to the result only after all its own prerequisites have been added, and never twice. This gives a valid order and leaves out the target. Then count the watched ones and add up the runtime of the unwatched ones.

**Booking quote (fewest bundles).** Work from 0 seats up to the group size. For each seat count, record the fewest bundles that reach it exactly, and which bundle was last used. If the group size can't be reached, return "not possible". Otherwise trace back to get how many of each size.

The cycle check and the database write for a movie update run in **one transaction**, so two simultaneous updates cannot together create a loop.

On create, no loop check is needed: a new movie has nothing depending on it, so it cannot be part of a loop. The README notes this.

All three get Vitest tests using the examples from the assessment.

## 7. Frontend pages

**Rewatch Order**
- Movie picker (dropdown).
- Shows the ordered list as a timeline with a watched tick on each movie.
- Progress bar such as "4 of 7 watched", and the remaining watch time.
- Empty list message if the movie has no prerequisites.
- `/` redirects to this page.

**Movies**
- Add movie form: title, release year, runtime, watched checkbox.
- Inline messages for bad input (e.g. "MCU films were released between 2008 and 2026").
- Movie list with a watched checkbox, edit prerequisites, and delete (with confirm).
- The prerequisite editor lists the other movies. If there are none, it says to add more movies first.
- If the API returns `CIRCULAR_DEPENDENCY`, an inline error shows and nothing is saved.

**Cinemas**
- Add cinema form: name, plus a small "bundle size" input with an Add button. Each size shows as a removable chip.
- Saved cinema list with delete.
- Bundle checker: pick a cinema, enter a group size, and see "4 bundles: 20 × 1, 9 × 2, 6 × 1" or "Not possible".

**All pages:** show loading and error states, and friendly empty states (no movies yet, no cinemas yet).

**Look:** dark background, Marvel-red accents, bold condensed headings.

## 8. Build stages

Commit after each stage.

1. **Scaffold:** workspaces, TypeScript config, Vite app, Express app, shared package, Tailwind and shadcn set up, plus `.gitignore`, `.env.example` and root scripts (`dev`, `test`, `build`).
2. **Database:** Prisma schema, first migration, local Postgres connection.
3. **Shared schemas:** Zod rules for movies and cinemas.
4. **Algorithms and tests:** cycle check, rewatch order, bundle DP.
5. **API routes:** movies and cinemas, validation, error handler, 409 handling, with API tests (Vitest + Supertest) for the 409, 400 and 404 cases as needed.
6. **Frontend:** layout and router, then Rewatch Order, Movies, Cinemas pages, then the MCU theme.
7. **Docker Compose:** Postgres, API (runs migrations on start) and web. The web container serves the built frontend with nginx and proxies `/api` to the API; in dev the Vite proxy does the same. Config comes from env vars (`DATABASE_URL`, ports) with defaults in `.env.example`.
8. **README:** how to run, AI usage, assumptions, data model diagram.

## 9. Assumptions (also go in the README)

- The first MCU movie is *Iron Man* (2008), so release years run from 2008 to 2026. Other years show a message. The range is one constant in the shared package.
- There is no seed data. You start with an empty database.
- Deleting a movie that other movies depend on is blocked with 409 `MOVIE_IS_PREREQUISITE`. The message names the movies that depend on it.
- Duplicate bundle sizes in one cinema are rejected.
- Movie titles and cinema names are unique case-insensitively ("iron man" = "Iron Man"), ignoring surrounding spaces.
- `POST /movies` and `POST /cinemas` create one item at a time.
- Bundle sizes are added one at a time in the UI and sorted when saved.
