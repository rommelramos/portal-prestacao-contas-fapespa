import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { deleteOwnSuggestion } from "@/lib/actions/suggestions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Em análise", cls: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Aprovada", cls: "bg-green-100 text-green-800" },
  REJECTED: { label: "Recusada", cls: "bg-red-100 text-red-700" },
};

const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);

export default async function MinhasSugestoesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const suggestions = await prisma.documentSuggestion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      funder: { select: { name: true } },
      files: { select: { id: true, fileName: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Minhas sugestões</h1>
          <p className="text-sm text-muted">
            Documentos que você indicou para a base de referência.
          </p>
        </div>
        <Link
          href="/app/sugestoes/nova"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
        >
          + Nova sugestão
        </Link>
      </div>

      {suggestions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">
          Você ainda não enviou sugestões.{" "}
          <Link href="/app/sugestoes/nova" className="text-primary hover:underline">
            Sugerir um documento
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => {
            const st = STATUS[s.status] ?? STATUS.PENDING;
            const funderLabel =
              s.funder?.name ??
              (s.suggestedFunderName ? `${s.suggestedFunderName} (novo)` : "—");
            return (
              <li
                key={s.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{funderLabel}</p>
                    <p className="mt-0.5 text-sm text-muted">{s.description}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}
                  >
                    {st.label}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{fmt(s.createdAt)}</span>
                  <span>·</span>
                  <span>
                    {s.files.length} arquivo{s.files.length === 1 ? "" : "s"}
                  </span>
                </div>
                {s.status === "REJECTED" && s.reviewNote && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    Observação do administrador: {s.reviewNote}
                  </p>
                )}
                {s.status === "PENDING" && (
                  <form action={deleteOwnSuggestion} className="mt-3">
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmSubmit
                      message="Excluir esta sugestão?"
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-danger transition hover:bg-red-50"
                    >
                      Excluir
                    </ConfirmSubmit>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
