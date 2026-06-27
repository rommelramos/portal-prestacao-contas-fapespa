import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmit } from "@/components/confirm-submit";
import {
  toggleManualVersionActive,
  deleteManualVersion,
  toggleDocumentActive,
  deleteDocument,
} from "@/lib/actions/manuais";

export const dynamic = "force-dynamic";

const DOC_TYPE_LABEL: Record<string, string> = {
  NORMA: "Norma",
  RESOLUCAO: "Resolução",
  ORIENTACAO: "Orientação",
  COMUNICADO: "Comunicado",
  OUTRO: "Outro",
};

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("pt-BR").format(d) : "—";

export default async function ManuaisPage({
  searchParams,
}: {
  searchParams: Promise<{ funderId?: string }>;
}) {
  const sp = await searchParams;
  const funders = await prisma.funder.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, active: true },
  });

  if (funders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Manuais & Documentos
        </h1>
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Cadastre um financiador primeiro.{" "}
          <Link href="/admin/financiadores/novo" className="underline">
            Cadastrar financiador
          </Link>
        </p>
      </div>
    );
  }

  const funderId = sp.funderId || funders[0].id;

  const [manuals, documents] = await Promise.all([
    prisma.manual.findMany({
      where: { funderId },
      orderBy: { title: "asc" },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { chunks: true } } },
        },
      },
    }),
    prisma.document.findMany({
      where: { funderId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { chunks: true } } },
    }),
  ]);

  const q = `?funderId=${funderId}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Manuais & Documentos
          </h1>
          <p className="text-sm text-muted">
            Base de conhecimento da IA, isolada por financiador (RF009–RF013).
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/manuais/manual${q}`}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
          >
            + Novo manual
          </Link>
          <Link
            href={`/admin/manuais/documento${q}`}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
          >
            + Nova legislação
          </Link>
        </div>
      </div>

      <form method="get" className="flex items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="funderId" className="text-xs font-medium text-muted">
            Financiador
          </label>
          <select
            id="funderId"
            name="funderId"
            defaultValue={funderId}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {funders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
                {f.active ? "" : " (inativo)"}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent"
        >
          Ver
        </button>
      </form>

      {/* Manuais */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Manuais de prestação de contas</h2>
        {manuals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted">
            Nenhum manual cadastrado para este financiador.
          </p>
        ) : (
          manuals.map((m) => (
            <div
              key={m.id}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="border-b border-border px-4 py-3 font-medium">
                {m.title}
              </div>
              <table className="w-full text-sm">
                <thead className="text-left text-muted">
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 font-medium">Versão</th>
                    <th className="px-4 py-2 font-medium">Vigência</th>
                    <th className="px-4 py-2 font-medium">Indexação</th>
                    <th className="px-4 py-2 font-medium">Arquivo</th>
                    <th className="px-4 py-2 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {m.versions.map((v) => (
                    <tr key={v.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium">v. {v.version}</td>
                      <td className="px-4 py-2 text-muted">
                        {fmtDate(v.effectiveDate)}
                      </td>
                      <td className="px-4 py-2">
                        {v.indexed ? (
                          <span className="text-green-700">
                            {v._count.chunks} trechos
                          </span>
                        ) : (
                          <span className="text-amber-700">não indexado</span>
                        )}
                        {!v.active && (
                          <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700">
                            inativo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {v.fileUrl ? (
                          <a
                            href={v.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            PDF
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <form action={toggleManualVersionActive}>
                            <input type="hidden" name="id" value={v.id} />
                            <button className="rounded-lg border border-border px-2.5 py-1 text-xs transition hover:bg-accent">
                              {v.active ? "Inativar" : "Ativar"}
                            </button>
                          </form>
                          <form action={deleteManualVersion}>
                            <input type="hidden" name="id" value={v.id} />
                            <ConfirmSubmit
                              message={`Excluir a versão ${v.version}? Os trechos indexados serão removidos.`}
                              className="rounded-lg border border-border px-2.5 py-1 text-xs text-danger transition hover:bg-red-50"
                            >
                              Excluir
                            </ConfirmSubmit>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      {/* Documentos / Legislação */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Legislações e documentos de apoio</h2>
        {documents.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted">
            Nenhum documento cadastrado para este financiador.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Título</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Indexação</th>
                  <th className="px-4 py-2 font-medium">Arquivo</th>
                  <th className="px-4 py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium">{d.title}</td>
                    <td className="px-4 py-2 text-muted">
                      {DOC_TYPE_LABEL[d.type] ?? d.type}
                    </td>
                    <td className="px-4 py-2">
                      {d.indexed ? (
                        <span className="text-green-700">
                          {d._count.chunks} trechos
                        </span>
                      ) : (
                        <span className="text-amber-700">não indexado</span>
                      )}
                      {!d.active && (
                        <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700">
                          inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {d.fileUrl ? (
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          PDF
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <form action={toggleDocumentActive}>
                          <input type="hidden" name="id" value={d.id} />
                          <button className="rounded-lg border border-border px-2.5 py-1 text-xs transition hover:bg-accent">
                            {d.active ? "Inativar" : "Ativar"}
                          </button>
                        </form>
                        <form action={deleteDocument}>
                          <input type="hidden" name="id" value={d.id} />
                          <ConfirmSubmit
                            message={`Excluir o documento "${d.title}"? Os trechos indexados serão removidos.`}
                            className="rounded-lg border border-border px-2.5 py-1 text-xs text-danger transition hover:bg-red-50"
                          >
                            Excluir
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
