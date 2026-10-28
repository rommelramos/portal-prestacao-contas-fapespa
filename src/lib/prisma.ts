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
    // O HostGator limita o usuário a max_user_connections = 25 (total). Como o
    // Vercel roda várias instâncias serverless, cada uma precisa de um pool
    // PEQUENO e que libere conexões ociosas RÁPIDO — senão poucas instâncias
    // ociosas seguram todas as 25 conexões e novas conexões passam a falhar
    // ("pool timeout ... active=0 idle=0").
    connectionLimit: 3,
    minimumIdle: 0, // não reservar conexões ociosas
    idleTimeout: 15, // libera conexão ociosa após 15s (padrão era 1800 = 30min)
    acquireTimeout: 15000, // tolera contenção momentânea ao pegar do pool
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

// Reaproveita o mesmo cliente/pool por instância (inclusive em produção, no
// Vercel Fluid Compute), evitando criar múltiplos pools e multiplicar conexões.
globalForPrisma.prisma = prisma;
