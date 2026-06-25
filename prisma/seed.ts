import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
    create: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      active: true,
    },
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
