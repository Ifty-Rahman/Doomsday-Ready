import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { cinemasRouter } from "./routes/cinemas.js";
import { moviesRouter } from "./routes/movies.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/movies", moviesRouter);
  app.use("/api/cinemas", cinemasRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
