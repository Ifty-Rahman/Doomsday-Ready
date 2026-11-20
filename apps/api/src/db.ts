import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const normalizeKey = (value: string) => value.trim().toLowerCase();
