import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

// Usa o mesmo driver adapter do app (protocolo de texto) para contornar o
// proxy do HostGator (erro 1295 com prepared statements).
const url = new URL(process.env.DATABASE_URL ?? "");
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  connectionLimit: 5,
  connectTimeout: 20000,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const name = process.env.SEED_ADMIN_NAME ?? "Administrador ISACI";
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@isaci.org.br")
    .toLowerCase()
    .trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash, role: "ADMIN", active: true },
  });

  console.log(`✅ Admin garantido: ${admin.email} (id: ${admin.id})`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log("⚠️  Senha padrão usada (ChangeMe123!). Troque após o login.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
