import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import type { ApiError } from "@doomsday/shared";
import { AppError } from "../errors.js";

export const asyncHandler =
  (fn: (...args: Parameters<RequestHandler>) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ code: "NOT_FOUND", message: "Route not found" } satisfies ApiError);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ code: err.code, message: err.message } satisfies ApiError);
  }

  if (err instanceof ZodError) {
    const body: ApiError = {
      code: "VALIDATION_ERROR",
      message: err.issues[0]?.message ?? "Invalid input",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    };
    return res.status(400).json(body);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = String(err.meta?.target ?? "");
      if (target.includes("titleKey")) {
        return res.status(409).json({ code: "DUPLICATE_TITLE", message: "A movie with this title already exists" } satisfies ApiError);
      }
      if (target.includes("nameKey")) {
        return res.status(409).json({ code: "DUPLICATE_CINEMA_NAME", message: "A cinema with this name already exists" } satisfies ApiError);
      }
    }
    if (err.code === "P2025") {
      return res.status(404).json({ code: "NOT_FOUND", message: "Record not found" } satisfies ApiError);
    }
  }

  // body-parser raises this for malformed JSON
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: "Request body is not valid JSON" } satisfies ApiError);
  }

  console.error(err);
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Something went wrong" } satisfies ApiError);
};
