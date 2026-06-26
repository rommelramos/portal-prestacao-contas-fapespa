import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// O MySQL do HostGator é acessado remotamente através de um proxy (cPanel) que
// NÃO suporta o protocolo de prepared statements do motor padrão do Prisma
// (erro 1295). Por isso usamos o driver adapter mariadb, que executa via
// protocolo de texto (.query()) e contorna o proxy.
function buildAdapter(): PrismaMariaDb {
  const url = new URL(process.env.DATABASE_URL ?? "");
  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    // Pool pequeno: hospedagem compartilhada tem max_connections baixo.
    connectionLimit: 5,
    connectTimeout: 20000,
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: buildAdapter(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
