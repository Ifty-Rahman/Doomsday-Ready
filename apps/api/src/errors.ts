import type { ErrorCode } from "@doomsday/shared";

export class AppError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new AppError(404, "NOT_FOUND", `${what} not found`);
