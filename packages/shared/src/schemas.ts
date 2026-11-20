import { z } from "zod";
import * as C from "./constants.js";

const title = z
  .string({ required_error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(200, "Title is too long");

const releaseYear = z
  .number({ required_error: "Release year is required", invalid_type_error: "Release year must be a number" })
  .int("Release year must be a whole number")
  .min(C.MIN_RELEASE_YEAR, `MCU films were released between ${C.MIN_RELEASE_YEAR} and ${C.MAX_RELEASE_YEAR}`)
  .max(C.MAX_RELEASE_YEAR, `MCU films were released between ${C.MIN_RELEASE_YEAR} and ${C.MAX_RELEASE_YEAR}`);

const runtime = z
  .number({ required_error: "Runtime is required", invalid_type_error: "Runtime must be a number" })
  .int("Runtime must be a whole number")
  .min(C.MIN_RUNTIME, `Runtime must be between ${C.MIN_RUNTIME} and ${C.MAX_RUNTIME} minutes`)
  .max(C.MAX_RUNTIME, `Runtime must be between ${C.MIN_RUNTIME} and ${C.MAX_RUNTIME} minutes`);

const prerequisiteIds = z
  .array(z.number().int().positive())
  .refine((ids) => new Set(ids).size === ids.length, "Prerequisites must be unique");

export const createMovieSchema = z.object({
  title,
  releaseYear,
  runtime,
  watched: z.boolean().default(false),
  prerequisiteIds: prerequisiteIds.default([]),
});

export const updateMovieSchema = z
  .object({
    title,
    releaseYear,
    runtime,
    watched: z.boolean(),
    prerequisiteIds,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Provide at least one field to update");

export const bundleSize = z
  .number({ required_error: "Bundle size is required", invalid_type_error: "Bundle size must be a number" })
  .int("Bundle size must be a whole number")
  .min(C.MIN_BUNDLE_SIZE, `Bundle size must be between ${C.MIN_BUNDLE_SIZE} and ${C.MAX_BUNDLE_SIZE}`)
  .max(C.MAX_BUNDLE_SIZE, `Bundle size must be between ${C.MIN_BUNDLE_SIZE} and ${C.MAX_BUNDLE_SIZE}`);

export const createCinemaSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(200, "Name is too long"),
  bundleSizes: z
    .array(bundleSize)
    .min(1, "Add at least one bundle size")
    .max(C.MAX_BUNDLES_PER_CINEMA, `A cinema can have at most ${C.MAX_BUNDLES_PER_CINEMA} bundle sizes`)
    .refine((s) => new Set(s).size === s.length, "Bundle sizes must be different from each other"),
});

export const groupSizeSchema = z.coerce
  .number({ invalid_type_error: "Group size must be a number" })
  .int("Group size must be a whole number")
  .min(C.MIN_GROUP_SIZE, `Group size must be between ${C.MIN_GROUP_SIZE} and ${C.MAX_GROUP_SIZE}`)
  .max(C.MAX_GROUP_SIZE, `Group size must be between ${C.MIN_GROUP_SIZE} and ${C.MAX_GROUP_SIZE}`);

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const bookingQuerySchema = z.object({ groupSize: groupSizeSchema });

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
export type CreateCinemaInput = z.infer<typeof createCinemaSchema>;
