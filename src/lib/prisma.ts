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
    // Equilíbrio no pool por causa do HostGator:
    // - max_user_connections = 25 (total, somando TODAS as instâncias) → pool
    //   pequeno por instância.
    // - A hospedagem tem "connection guard" que afoga IPs que abrem MUITAS
    //   conexões novas rápido → NÃO usar idleTimeout curto (gera churn de
    //   conexões). idleTimeout moderado reaproveita a conexão entre requisições
    //   e ainda a libera bem antes do wait_timeout (3600s).
    connectionLimit: 3,
    minimumIdle: 0, // não reservar conexões ociosas
    idleTimeout: 60, // libera conexão ociosa após 60s (reuso sem churn)
    acquireTimeout: 12000,
    connectTimeout: 10000,
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
