import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FunderForm } from "@/components/funder-form";

export const dynamic = "force-dynamic";

export default async function EditarFinanciadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const funder = await prisma.funder.findUnique({ where: { id } });
  if (!funder) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/financiadores"
          className="text-sm text-muted hover:underline"
        >
          ← Financiadores
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Editar financiador
        </h1>
        <p className="text-sm text-muted">Edição de financiador (RF006).</p>
      </div>
      <FunderForm
        funder={{
          id: funder.id,
          name: funder.name,
          description: funder.description,
          institutionalInfo: funder.institutionalInfo,
          active: funder.active,
        }}
      />
    </div>
  );
}
