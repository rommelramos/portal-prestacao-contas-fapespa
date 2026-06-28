import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Migração TEMPORÁRIA: cria a tabela Setting (idempotente) e o registro padrão.
const DDL = `CREATE TABLE IF NOT EXISTS \`Setting\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`model\` VARCHAR(191) NOT NULL DEFAULT 'claude-opus-4-8',
  \`effort\` VARCHAR(191) NOT NULL DEFAULT 'low',
  \`tone\` VARCHAR(191) NOT NULL DEFAULT 'formal',
  \`promptBase\` TEXT NOT NULL,
  \`topK\` INTEGER NOT NULL DEFAULT 8,
  \`similarityThreshold\` DOUBLE NOT NULL DEFAULT 0,
  \`updatedAt\` DATETIME(3) NOT NULL,
  \`updatedById\` VARCHAR(191) NULL,
  PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  try {
    await prisma.$executeRawUnsafe(DDL);
    await prisma.setting.upsert({
      where: { id: "global" },
      update: {},
      create: { id: "global", ...DEFAULT_SETTINGS },
    });
    const s = await prisma.setting.findUnique({ where: { id: "global" } });
    return NextResponse.json({ ok: true, setting: s });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error)?.message?.slice(0, 400) },
      { status: 500 },
    );
  }
}
