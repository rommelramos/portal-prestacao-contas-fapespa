import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Em análise", cls: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Aprovada", cls: "bg-green-100 text-green-800" },
  REJECTED: { label: "Recusada", cls: "bg-red-100 text-red-700" },
};

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);

export default async function AdminSugestoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.status?.toUpperCase();
  const where: Prisma.DocumentSuggestionWhereInput =
    filter === "PENDING" || filter === "APPROVED" || filter === "REJECTED"
      ? { status: filter }
      : {};

  const suggestions = await prisma.documentSuggestion.findMany({
    where,
    // Pendentes primeiro, depois mais recentes.
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true } },
      funder: { select: { name: true } },
      files: { select: { id: true } },
    },
  });

  const tabs = [
    { key: "", label: "Todas" },
    { key: "PENDING", label: "Em análise" },
    { key: "APPROVED", label: "Aprovadas" },
    { key: "REJECTED", label: "Recusadas" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sugestões de documentos</h1>
        <p className="text-sm text-muted">
          Indicações de usuários para compor a base de conhecimento. Revise e
          aprove vinculando a um ou mais financiadores.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = (filter ?? "") === t.key;
          return (
            <Link
              key={t.key}
              href={t.key ? `/admin/sugestoes?status=${t.key}` : "/admin/sugestoes"}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {suggestions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">
          Nenhuma sugestão nesta categoria.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Financiador</th>
                <th className="px-4 py-2 font-medium">Usuário</th>
                <th className="px-4 py-2 font-medium">Arquivos</th>
                <th className="px-4 py-2 font-medium">Enviada</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s) => {
                const st = STATUS[s.status] ?? STATUS.PENDING;
                const funderLabel =
                  s.funder?.name ??
                  (s.suggestedFunderName ? (
                    <span>
                      {s.suggestedFunderName}{" "}
                      <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted">
                        novo
                      </span>
                    </span>
                  ) : (
                    "—"
                  ));
                return (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium">{funderLabel}</td>
                    <td className="px-4 py-2 text-muted">{s.user.name}</td>
                    <td className="px-4 py-2 text-muted">{s.files.length}</td>
                    <td className="px-4 py-2 text-muted">{fmt(s.createdAt)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/admin/sugestoes/${s.id}`}
                        className="text-primary hover:underline"
                      >
                        {s.status === "PENDING" ? "Revisar" : "Ver"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
