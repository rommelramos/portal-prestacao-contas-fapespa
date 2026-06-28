import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getStats() {
  try {
    const [users, funders, manuals, documents, sessions, last7, last30] =
      await Promise.all([
        prisma.user.count(),
        prisma.funder.count(),
        prisma.manualVersion.count(),
        prisma.document.count(),
        prisma.chatSession.count(),
        prisma.chatSession.count({ where: { createdAt: { gte: daysAgo(7) } } }),
        prisma.chatSession.count({ where: { createdAt: { gte: daysAgo(30) } } }),
      ]);

    const [topFundersRaw, topUsersRaw] = await Promise.all([
      prisma.chatSession.groupBy({
        by: ["funderId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.chatSession.groupBy({
        by: ["userId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    const funderNames = await prisma.funder.findMany({
      where: { id: { in: topFundersRaw.map((t) => t.funderId) } },
      select: { id: true, name: true },
    });
    const userNames = await prisma.user.findMany({
      where: { id: { in: topUsersRaw.map((t) => t.userId) } },
      select: { id: true, name: true },
    });

    const topFunders = topFundersRaw.map((t) => ({
      name: funderNames.find((f) => f.id === t.funderId)?.name ?? "—",
      count: t._count.id,
    }));
    const topUsers = topUsersRaw.map((t) => ({
      name: userNames.find((u) => u.id === t.userId)?.name ?? "—",
      count: t._count.id,
    }));

    return {
      ok: true as const,
      users,
      funders,
      manuals,
      documents,
      sessions,
      last7,
      last30,
      topFunders,
      topUsers,
    };
  } catch {
    return { ok: false as const };
  }
}

export default async function AdminDashboard() {
  const s = await getStats();

  if (!s.ok) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Banco de dados não acessível no momento.
        </p>
      </div>
    );
  }

  const cards = [
    { label: "Consultas (total)", value: s.sessions },
    { label: "Consultas (30 dias)", value: s.last30 },
    { label: "Consultas (7 dias)", value: s.last7 },
    { label: "Usuários", value: s.users },
    { label: "Financiadores", value: s.funders },
    { label: "Versões de manuais", value: s.manuals },
    { label: "Documentos/legislações", value: s.documents },
  ];

  const maxFunder = Math.max(1, ...s.topFunders.map((t) => t.count));
  const maxUser = Math.max(1, ...s.topUsers.map((t) => t.count));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
          <p className="text-sm text-muted">Indicadores de uso do portal (RF028).</p>
        </div>
        <Link
          href="/admin/historico"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent"
        >
          Histórico global
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium">Financiadores mais consultados</h2>
          {s.topFunders.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Sem consultas ainda.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {s.topFunders.map((t, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>{t.name}</span>
                    <span className="font-medium text-muted">{t.count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(t.count / maxFunder) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium">Usuários mais ativos</h2>
          {s.topUsers.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Sem consultas ainda.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {s.topUsers.map((t, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>{t.name}</span>
                    <span className="font-medium text-muted">{t.count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(t.count / maxUser) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
