import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { IngestForm } from "@/components/ingest-form";

export const dynamic = "force-dynamic";

export default async function NovoDocumentoPage({
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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/manuais" className="text-sm text-muted hover:underline">
          ← Manuais & Documentos
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Nova legislação / documento
        </h1>
        <p className="text-sm text-muted">
          Normas, resoluções, comunicados e demais documentos de apoio (RF011).
        </p>
      </div>

      {funders.length === 0 ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Cadastre um financiador ativo antes de enviar documentos.{" "}
          <Link href="/admin/financiadores/novo" className="underline">
            Cadastrar financiador
          </Link>
        </p>
      ) : (
        <IngestForm kind="documento" funders={funders} defaultFunderId={funderId} />
      )}
    </div>
  );
}
