import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Diagnóstico TEMPORÁRIO: testa a conexão com o MySQL a partir do Vercel.
// Não expõe segredos — apenas código/mensagem do erro do Prisma.
export async function GET() {
  try {
    const users = await prisma.user.count();
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    return NextResponse.json({ ok: true, users, admins });
  } catch (err) {
    const e = err as { code?: string; message?: string; name?: string };
    return NextResponse.json(
      {
        ok: false,
        code: e.code ?? null,
        name: e.name ?? null,
        message: (e.message ?? String(err)).slice(0, 500),
      },
      { status: 500 },
    );
  }
}
