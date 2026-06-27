import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { IngestForm } from "@/components/ingest-form";
import { getExistingByFunder } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function NovoManualPage({
  searchParams,
}: {
  searchParams: Promise<{ funderId?: string }>;
}) {
  const { funderId } = await searchParams;

  const funders = await prisma.funder.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const manuals = await prisma.manual.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, funderId: true },
  });

  const manualsByFunder: Record<string, { id: string; title: string }[]> = {};
  for (const m of manuals) {
    (manualsByFunder[m.funderId] ??= []).push({ id: m.id, title: m.title });
  }

  const existingByFunder = await getExistingByFunder();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/manuais" className="text-sm text-muted hover:underline">
          ← Manuais & Documentos
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Novo manual / versão
        </h1>
        <p className="text-sm text-muted">
          Upload de manual de prestação de contas com versionamento (RF009–RF010).
        </p>
      </div>

      {funders.length === 0 ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Cadastre um financiador ativo antes de enviar manuais.{" "}
          <Link href="/admin/financiadores/novo" className="underline">
            Cadastrar financiador
          </Link>
        </p>
      ) : (
        <IngestForm
          kind="manual"
          funders={funders}
          defaultFunderId={funderId}
          manualsByFunder={manualsByFunder}
          existingByFunder={existingByFunder}
        />
      )}
    </div>
  );
}
