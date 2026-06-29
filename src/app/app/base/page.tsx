import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DOC_TYPE_LABEL: Record<string, string> = {
  NORMA: "Norma",
  RESOLUCAO: "Resolução",
  ORIENTACAO: "Orientação",
  COMUNICADO: "Comunicado",
  OUTRO: "Outro",
};

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("pt-BR").format(d) : null;

export default async function BaseConhecimentoPage({
  searchParams,
}: {
  searchParams: Promise<{ funderId?: string }>;
}) {
  const sp = await searchParams;
  const funders = await prisma.funder.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  if (funders.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Base de conhecimento
        </h1>
        <p className="mt-4 text-sm text-muted">
          Nenhum financiador disponível no momento.
        </p>
      </div>
    );
  }

  const funderId = sp.funderId || funders[0].id;

  // Só o que está realmente na base (ativo + indexado).
  const [manuals, documents] = await Promise.all([
    prisma.manual.findMany({
      where: { funderId, active: true },
      orderBy: { title: "asc" },
      include: {
        versions: {
          where: { active: true, indexed: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.document.findMany({
      where: { funderId, active: true, indexed: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const manualsWithVersions = manuals.filter((m) => m.versions.length > 0);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Base de conhecimento
        </h1>
        <p className="text-sm text-muted">
          Documentos que o chatbot consulta, por financiador. As respostas se
          baseiam exclusivamente nestes documentos.
        </p>
      </div>

      <form method="get" className="mb-5 flex items-end gap-2">
        <div className="space-y-1">
          <label htmlFor="funderId" className="text-xs font-medium text-muted">
            Financiador
          </label>
          <select
            id="funderId"
            name="funderId"
            defaultValue={funderId}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            {funders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent">
          Ver
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Manuais de prestação de contas</h2>
        {manualsWithVersions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted">
            Nenhum manual disponível para este financiador.
          </p>
        ) : (
          manualsWithVersions.map((m) => (
            <div
              key={m.id}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="border-b border-border px-4 py-3 font-medium">
                {m.title}
              </div>
              <ul>
                {m.versions.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-sm last:border-0"
                  >
                    <span>
                      Versão {v.version}
                      {fmtDate(v.effectiveDate) && (
                        <span className="text-muted">
                          {" "}
                          · vigência {fmtDate(v.effectiveDate)}
                        </span>
                      )}
                    </span>
                    {v.fileUrl && (
                      <a
                        href={v.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-primary hover:underline"
                      >
                        Abrir PDF
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-medium">Legislações e documentos de apoio</h2>
        {documents.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted">
            Nenhuma legislação cadastrada para este financiador.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <ul>
              {documents.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-sm last:border-0"
                >
                  <span>
                    {d.title}
                    <span className="text-muted">
                      {" "}
                      · {DOC_TYPE_LABEL[d.type] ?? d.type}
                    </span>
                  </span>
                  {d.fileUrl && (
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-primary hover:underline"
                    >
                      Abrir PDF
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="mt-6 text-center">
        <Link
          href="/app/chat"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
        >
          Iniciar consulta
        </Link>
      </div>
    </div>
  );
}
