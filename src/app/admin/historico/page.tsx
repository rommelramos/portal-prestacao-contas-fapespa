import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);

type SearchParams = Promise<{
  funderId?: string;
  userId?: string;
  from?: string;
  to?: string;
}>;

export default async function HistoricoGlobalPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { funderId, userId, from, to } = await searchParams;

  const where: Prisma.ChatSessionWhereInput = {};
  if (funderId) where.funderId = funderId;
  if (userId) where.userId = userId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from + "T00:00:00");
    if (to) where.createdAt.lte = new Date(to + "T23:59:59");
  }

  const [funders, users, sessions] = await Promise.all([
    prisma.funder.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.chatSession.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: {
        user: { select: { name: true } },
        funder: { select: { name: true } },
        manualVersion: { select: { version: true, manual: { select: { title: true } } } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico global</h1>
        <p className="text-sm text-muted">
          Consultas de todos os usuários, para auditoria (RF029).
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="userId" className="text-xs font-medium text-muted">
            Usuário
          </label>
          <select
            id="userId"
            name="userId"
            defaultValue={userId ?? ""}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="funderId" className="text-xs font-medium text-muted">
            Financiador
          </label>
          <select
            id="funderId"
            name="funderId"
            defaultValue={funderId ?? ""}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {funders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="from" className="text-xs font-medium text-muted">
            De
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from ?? ""}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="to" className="text-xs font-medium text-muted">
            Até
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to ?? ""}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
        </div>
        <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent">
          Filtrar
        </button>
        {(funderId || userId || from || to) && (
          <Link
            href="/admin/historico"
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
              <th className="px-4 py-3 font-medium">Consulta</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Financiador</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 text-right font-medium">Msgs</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Nenhuma consulta encontrada.
                </td>
              </tr>
            )}
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/historico/${s.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {s.title ?? "Consulta"}
                  </Link>
                  {s.manualVersion && (
                    <div className="text-xs text-muted">
                      {s.manualVersion.manual.title} v. {s.manualVersion.version}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{s.user.name}</td>
                <td className="px-4 py-3 text-muted">{s.funder.name}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.updatedAt)}</td>
                <td className="px-4 py-3 text-right text-muted">
                  {s._count.messages}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sessions.length === 200 && (
        <p className="text-xs text-muted">
          Exibindo as 200 consultas mais recentes. Refine os filtros para ver outras.
        </p>
      )}
    </div>
  );
}
