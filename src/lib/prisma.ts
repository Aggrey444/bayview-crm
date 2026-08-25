import { PrismaClient } from "@prisma/client/index";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;

  const adapter = new PrismaPg({
    connectionString,
    ssl: connectionString.includes("sslmode")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
