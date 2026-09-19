import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Optimize SQLite for concurrent multi-user access via WAL (Write-Ahead Logging) mode
if (
  process.env.DATABASE_URL?.includes(".db") ||
  process.env.DATABASE_URL?.startsWith("file:")
) {
  prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000;").catch(() => {});
  prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;").catch(() => {});
}

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
