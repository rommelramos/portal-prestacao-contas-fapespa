import { PrismaClient } from "@prisma/client";

// Singleton para evitar esgotar o pool de conexões em ambiente serverless
// (importante no MySQL compartilhado do HostGator, com max_connections baixo).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
