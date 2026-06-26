import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { INIT_SQL } from "@/lib/init-sql";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Rota de setup ÚNICA e PROTEGIDA por token. Cria as tabelas (via driver
// adapter — protocolo de texto, contorna o proxy do HostGator) e garante o
// administrador inicial. Idempotente: pode ser chamada mais de uma vez.
export async function POST(req: NextRequest) {
  const token =
    req.nextUrl.searchParams.get("token") ?? req.headers.get("x-setup-token");

  if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Não autorizado." },
      { status: 401 },
    );
  }

  // Divide o script em statements, removendo comentários `-- ...`.
  const statements = INIT_SQL.split(";")
    .map((chunk) =>
      chunk
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);

  const results: { stmt: string; ok: boolean; error?: string }[] = [];
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      results.push({ stmt: stmt.slice(0, 60), ok: true });
    } catch (err) {
      // Tabela/constraint já existente em re-execução: não é fatal.
      const msg = (err as Error)?.message ?? String(err);
      results.push({ stmt: stmt.slice(0, 60), ok: false, error: msg.slice(0, 160) });
    }
  }

  // Garante o administrador inicial.
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@isaci.org.br")
    .toLowerCase()
    .trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const name = process.env.SEED_ADMIN_NAME ?? "Administrador ISACI";

  let adminMsg = "";
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      // Atualiza a senha/estado de forma determinística (idempotente).
      update: { passwordHash, name, role: "ADMIN", active: true },
      create: { name, email, passwordHash, role: "ADMIN", active: true },
    });
    adminMsg = `Admin garantido (senha redefinida): ${email}`;
  } catch (err) {
    adminMsg = `Falha ao criar admin: ${(err as Error)?.message?.slice(0, 160)}`;
  }

  let users = -1;
  try {
    users = await prisma.user.count();
  } catch {
    /* ignore */
  }

  const tablesOk = results.filter((r) => r.ok).length;
  return NextResponse.json({
    ok: true,
    tablesProcessed: results.length,
    tablesOk,
    admin: adminMsg,
    users,
    details: results,
  });
}
