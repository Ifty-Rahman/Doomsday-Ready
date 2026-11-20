export interface Movie {
  id: number;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
  prerequisiteIds: number[];
}

export interface RewatchMovie {
  id: number;
  title: string;
  runtime: number;
  watched: boolean;
}

export interface RewatchOrder {
  target: { id: number; title: string };
  order: RewatchMovie[];
  watchedCount: number;
  totalCount: number;
  remainingRuntime: number;
}

export interface Cinema {
  id: number;
  name: string;
  bundleSizes: number[];
}

export interface BundleCount {
  size: number;
  count: number;
}

export type BookingQuote =
  | { possible: true; groupSize: number; totalBundles: number; bundles: BundleCount[] }
  | { possible: false; groupSize: number };

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CIRCULAR_DEPENDENCY"
  | "MOVIE_IS_PREREQUISITE"
  | "DUPLICATE_TITLE"
  | "DUPLICATE_CINEMA_NAME"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: { path: string; message: string }[];
}
