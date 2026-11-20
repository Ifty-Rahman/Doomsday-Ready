import { Router } from "express";
import { Prisma } from "@prisma/client";
import { createMovieSchema, idParamSchema, updateMovieSchema, type Movie, type RewatchOrder } from "@doomsday/shared";
import { normalizeKey, prisma } from "../db.js";
import { AppError, notFound } from "../errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { wouldCreateCycle, type PrerequisiteGraph } from "../algorithms/cycle.js";
import { rewatchOrder } from "../algorithms/rewatchOrder.js";

export const moviesRouter = Router();

// prerequisites come back in the order the user chose
const withPrerequisiteIds = {
  prerequisites: { select: { prerequisiteId: true }, orderBy: { position: "asc" } },
} satisfies Prisma.MovieInclude;

type MovieRow = Prisma.MovieGetPayload<{ include: typeof withPrerequisiteIds }>;

const toMovie = (row: MovieRow): Movie => ({
  id: row.id,
  title: row.title,
  releaseYear: row.releaseYear,
  runtime: row.runtime,
  watched: row.watched,
  prerequisiteIds: row.prerequisites.map((p) => p.prerequisiteId),
});

async function loadGraph(db: Prisma.TransactionClient): Promise<PrerequisiteGraph> {
  const rows = await db.movie.findMany({
    select: { id: true, prerequisites: { select: { prerequisiteId: true }, orderBy: { position: "asc" } } },
  });
  return new Map(rows.map((r) => [r.id, r.prerequisites.map((p) => p.prerequisiteId)]));
}

async function assertMoviesExist(db: Prisma.TransactionClient, ids: number[]) {
  if (ids.length === 0) return;
  const found = await db.movie.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const foundIds = new Set(found.map((m) => m.id));
  const missing = ids.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", `Prerequisite movie(s) not found: ${missing.join(", ")}`);
  }
}

// Movie writes that touch prerequisites take this lock, so two requests cannot
// each pass the loop check and then together create a loop.
const lockMovieGraph = (db: Prisma.TransactionClient) => db.$executeRaw`SELECT pg_advisory_xact_lock(1)`;

const toLinks = (ids: number[]) => ids.map((prerequisiteId, position) => ({ prerequisiteId, position }));

const circularDependency = () =>
  new AppError(409, "CIRCULAR_DEPENDENCY", "A movie cannot depend on itself, directly or through other movies");

moviesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.movie.findMany({ include: withPrerequisiteIds, orderBy: { id: "asc" } });
    res.json(rows.map(toMovie));
  }),
);

// A brand-new movie has nothing depending on it yet, so it cannot be part of a
// loop and no loop check is needed here.
moviesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { prerequisiteIds, title, ...rest } = createMovieSchema.parse(req.body);
    const created = await prisma.$transaction(async (tx) => {
      await assertMoviesExist(tx, prerequisiteIds);
      return tx.movie.create({
        data: {
          ...rest,
          title,
          titleKey: normalizeKey(title),
          prerequisites: { create: toLinks(prerequisiteIds) },
        },
        include: withPrerequisiteIds,
      });
    });
    res.status(201).json(toMovie(created));
  }),
);

moviesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { prerequisiteIds, title, ...rest } = updateMovieSchema.parse(req.body);

    const updated = await prisma.$transaction(async (tx) => {
      if (prerequisiteIds) await lockMovieGraph(tx);
      if (!(await tx.movie.findUnique({ where: { id }, select: { id: true } }))) throw notFound("Movie");

      if (prerequisiteIds) {
        await assertMoviesExist(tx, prerequisiteIds);
        if (wouldCreateCycle(await loadGraph(tx), id, prerequisiteIds)) throw circularDependency();
      }

      return tx.movie.update({
        where: { id },
        data: {
          ...rest,
          ...(title !== undefined && { title, titleKey: normalizeKey(title) }),
          ...(prerequisiteIds && { prerequisites: { deleteMany: {}, create: toLinks(prerequisiteIds) } }),
        },
        include: withPrerequisiteIds,
      });
    });
    res.json(toMovie(updated));
  }),
);

moviesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await prisma.$transaction(async (tx) => {
      await lockMovieGraph(tx);
      const movie = await tx.movie.findUnique({
        where: { id },
        select: { title: true, requiredBy: { select: { movie: { select: { title: true } } } } },
      });
      if (!movie) throw notFound("Movie");
      if (movie.requiredBy.length > 0) {
        const names = movie.requiredBy.map((l) => l.movie.title).sort().join(", ");
        throw new AppError(
          409,
          "MOVIE_IS_PREREQUISITE",
          `${movie.title} is a prerequisite of ${names}. Remove it from their prerequisites first.`,
        );
      }
      await tx.movie.delete({ where: { id } });
    });
    res.status(204).end();
  }),
);

moviesRouter.get(
  "/:id/rewatch-order",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const [target, graph, movies] = await Promise.all([
      prisma.movie.findUnique({ where: { id }, select: { id: true, title: true } }),
      loadGraph(prisma),
      prisma.movie.findMany({ select: { id: true, title: true, runtime: true, watched: true } }),
    ]);
    if (!target) throw notFound("Movie");

    const byId = new Map(movies.map((m) => [m.id, m]));
    const ids = rewatchOrder(graph, id);
    const order = ids.map((movieId) => byId.get(movieId)!);

    const body: RewatchOrder = {
      target,
      order,
      watchedCount: order.filter((m) => m.watched).length,
      totalCount: order.length,
      remainingRuntime: order.filter((m) => !m.watched).reduce((sum, m) => sum + m.runtime, 0),
    };
    res.json(body);
  }),
);
