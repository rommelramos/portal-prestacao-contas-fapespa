import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SuggestionForm } from "@/components/suggestion-form";

export const dynamic = "force-dynamic";

export default async function NovaSugestaoPage() {
  const funders = await prisma.funder.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <Link href="/app/sugestoes" className="text-sm text-muted hover:underline">
        ← Minhas sugestões
      </Link>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        Sugerir documento
      </h1>
      <p className="mb-6 text-sm text-muted">
        Indique documentos ou legislações que podem compor a base de referência.
        O administrador avaliará antes de incluí-los.
      </p>

      <SuggestionForm funders={funders} />
    </div>
  );
}
