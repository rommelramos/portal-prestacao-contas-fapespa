import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SuggestionReview } from "@/components/suggestion-review";
import { rejectSuggestion } from "@/lib/actions/suggestions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Em análise", cls: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Aprovada", cls: "bg-green-100 text-green-800" },
  REJECTED: { label: "Recusada", cls: "bg-red-100 text-red-700" },
};

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);

const niceName = (path: string) =>
  (path.split("/").pop() ?? path).replace(/^\d+-/, "");

export default async function RevisarSugestaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const suggestion = await prisma.documentSuggestion.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      funder: { select: { id: true, name: true } },
      reviewedBy: { select: { name: true } },
      files: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          document: { select: { id: true, title: true } },
        },
      },
    },
  });

  if (!suggestion) notFound();

  const funders = await prisma.funder.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const st = STATUS[suggestion.status] ?? STATUS.PENDING;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/sugestoes" className="text-sm text-muted hover:underline">
          ← Sugestões
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Revisar sugestão</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>
            {st.label}
          </span>
        </div>
      </div>

      {/* Dados da sugestão */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted">Enviada por</dt>
            <dd className="text-sm">
              {suggestion.user.name}{" "}
              <span className="text-muted">({suggestion.user.email})</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">Data</dt>
            <dd className="text-sm">{fmt(suggestion.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">Financiador indicado</dt>
            <dd className="text-sm">
              {suggestion.funder ? (
                suggestion.funder.name
              ) : suggestion.suggestedFunderName ? (
                <span>
                  {suggestion.suggestedFunderName}{" "}
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted">
                    não cadastrado
                  </span>
                </span>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
        <div>
          <dt className="text-xs font-medium text-muted">Descrição</dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-sm">{suggestion.description}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">
            Arquivos ({suggestion.files.length})
          </dt>
          <ul className="mt-1 space-y-1">
            {suggestion.files.map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-sm">
                <a
                  href={f.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {niceName(f.fileName)}
                </a>
                {f.document && (
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-800">
                    → {f.document.title}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {suggestion.status === "PENDING" ? (
        <>
          <SuggestionReview
            suggestionId={suggestion.id}
            funders={funders}
            files={suggestion.files.map((f) => ({ id: f.id, fileName: f.fileName }))}
            defaultFunderId={suggestion.funder?.id ?? null}
            suggestedFunderName={suggestion.suggestedFunderName}
          />

          {/* Recusar */}
          <form
            action={rejectSuggestion}
            className="space-y-2 rounded-2xl border border-border bg-card p-5"
          >
            <input type="hidden" name="id" value={suggestion.id} />
            <label htmlFor="reviewNote" className="text-sm font-medium">
              Recusar sugestão
            </label>
            <textarea
              id="reviewNote"
              name="reviewNote"
              rows={2}
              placeholder="Motivo (opcional) — será mostrado ao usuário."
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-danger transition hover:bg-red-50"
            >
              Recusar
            </button>
          </form>
        </>
      ) : (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-5 text-sm">
          <p className="text-muted">
            Revisada por{" "}
            <span className="text-foreground">
              {suggestion.reviewedBy?.name ?? "—"}
            </span>
            {suggestion.reviewedAt && <> em {fmt(suggestion.reviewedAt)}</>}.
          </p>
          {suggestion.reviewNote && (
            <p className="rounded-lg bg-accent/40 px-3 py-2">
              Observação: {suggestion.reviewNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
