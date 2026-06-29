import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ funderId?: string; from?: string; to?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { funderId, from, to } = await searchParams;

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (from) createdAt.gte = new Date(from + "T00:00:00");
  if (to) createdAt.lte = new Date(to + "T23:59:59");

  const [funders, sessions] = await Promise.all([
    prisma.funder.findMany({
      where: { chatSessions: { some: { userId } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.chatSession.findMany({
      where: {
        userId,
        ...(funderId ? { funderId } : {}),
        ...(from || to ? { createdAt } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        funder: { select: { name: true } },
        manualVersion: {
          select: { version: true, manual: { select: { title: true } } },
        },
        document: { select: { title: true } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Histórico de consultas
        </h1>
        <p className="text-sm text-muted">
          Suas conversas anteriores (RF025–RF027).
        </p>
      </div>

      {funders.length > 0 && (
        <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
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
          {(funderId || from || to) && (
            <Link
              href="/app/historico"
              className="px-2 py-2 text-sm text-muted underline-offset-2 hover:underline"
            >
              Limpar
            </Link>
          )}
        </form>
      )}

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">
          Você ainda não realizou consultas.{" "}
          <Link href="/app/chat" className="text-primary underline">
            Iniciar uma agora
          </Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/app/historico/${s.id}`}
                className="block rounded-xl border border-border bg-card px-4 py-3 transition hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="line-clamp-1 text-sm font-medium">
                    {s.title ?? "Consulta"}
                  </p>
                  <span className="shrink-0 text-xs text-muted">
                    {fmt(s.updatedAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {s.funder.name}
                  {s.manualVersion
                    ? ` · ${s.manualVersion.manual.title} v. ${s.manualVersion.version}`
                    : s.document
                      ? ` · ${s.document.title}`
                      : ""}
                  {` · ${s._count.messages} mensagens`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
