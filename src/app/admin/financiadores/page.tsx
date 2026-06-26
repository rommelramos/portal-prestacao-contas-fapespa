import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toggleFunderActive } from "@/lib/actions/funders";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; status?: string }>;

async function getFunders(q: string, status: string) {
  const where: Prisma.FunderWhereInput = {};
  if (q) where.name = { contains: q };
  if (status === "active") where.active = true;
  if (status === "inactive") where.active = false;

  try {
    return await prisma.funder.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { manuals: true, documents: true } } },
    });
  } catch (err) {
    console.error("[financiadores] erro ao listar:", err);
    return [];
  }
}

export default async function FinanciadoresPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "", status = "all" } = await searchParams;
  const funders = await getFunders(q.trim(), status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financiadores</h1>
          <p className="text-sm text-muted">
            Cadastro e gestão dos financiadores (RF005–RF008).
          </p>
        </div>
        <Link
          href="/admin/financiadores/novo"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
        >
          + Novo financiador
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="q" className="text-xs font-medium text-muted">
            Buscar por nome
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Nome do financiador"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="status" className="text-xs font-medium text-muted">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent"
        >
          Filtrar
        </button>
        {(q || status !== "all") && (
          <Link
            href="/admin/financiadores"
            className="px-2 py-2 text-sm text-muted underline-offset-2 hover:underline"
          >
            Limpar
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-accent/40 text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Conteúdo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {funders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Nenhum financiador encontrado.
                </td>
              </tr>
            )}
            {funders.map((f) => (
              <tr key={f.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{f.name}</div>
                  {f.description && (
                    <div className="line-clamp-1 text-xs text-muted">
                      {f.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">
                  {f._count.manuals} manuais · {f._count.documents} docs
                </td>
                <td className="px-4 py-3">
                  {f.active ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Ativo
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/financiadores/${f.id}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
                    >
                      Editar
                    </Link>
                    <form action={toggleFunderActive}>
                      <input type="hidden" name="id" value={f.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
                      >
                        {f.active ? "Inativar" : "Ativar"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
