import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
    return process.env.DATABASE_URL;
  }
  const host = process.env.DB_HOST || "srv1322.hstgr.io";
  const port = process.env.DB_PORT || "3306";
  const user = process.env.DB_USER || "u692613871_jiilife";
  const password = process.env.DB_PASSWORD || "Ttrak_Db_2026!#";
  const name = process.env.DB_NAME || "u692613871_jiilife";
  const encodedPassword = encodeURIComponent(password);
  return `mysql://${user}:${encodedPassword}@${host}:${port}/${name}`;
}

const resolvedDbUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = resolvedDbUrl;

export const db =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}

