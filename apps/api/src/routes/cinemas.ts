import { Router } from "express";
import { bookingQuerySchema, createCinemaSchema, idParamSchema, type BookingQuote, type Cinema } from "@doomsday/shared";
import { normalizeKey, prisma } from "../db.js";
import { notFound } from "../errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { fewestBundles } from "../algorithms/bundles.js";

export const cinemasRouter = Router();

const toCinema = (row: { id: number; name: string; bundleSizes: number[] }): Cinema => ({
  id: row.id,
  name: row.name,
  bundleSizes: row.bundleSizes,
});

cinemasRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.cinema.findMany({ orderBy: { id: "asc" } });
    res.json(rows.map(toCinema));
  }),
);

cinemasRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, bundleSizes } = createCinemaSchema.parse(req.body);
    const created = await prisma.cinema.create({
      data: { name, nameKey: normalizeKey(name), bundleSizes: [...bundleSizes].sort((a, b) => a - b) },
    });
    res.status(201).json(toCinema(created));
  }),
);

cinemasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await prisma.cinema.delete({ where: { id } }); // P2025 -> 404 in the error handler
    res.status(204).end();
  }),
);

cinemasRouter.get(
  "/:id/booking",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { groupSize } = bookingQuerySchema.parse(req.query);
    const cinema = await prisma.cinema.findUnique({ where: { id } });
    if (!cinema) throw notFound("Cinema");

    const selection = fewestBundles(cinema.bundleSizes, groupSize);
    const body: BookingQuote = selection
      ? { possible: true, groupSize, ...selection }
      : { possible: false, groupSize };
    res.json(body);
  }),
);
