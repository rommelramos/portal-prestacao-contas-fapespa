"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Funder = { id: string; name: string };
type ManualRef = { id: string; title: string };
type ExistingItem = {
  kind: "manual" | "documento";
  label: string;
  indexed: boolean;
  chunks: number;
};

const DOC_TYPES = [
  { value: "NORMA", label: "Norma" },
  { value: "RESOLUCAO", label: "Resolução" },
  { value: "ORIENTACAO", label: "Orientação" },
  { value: "COMUNICADO", label: "Comunicado" },
  { value: "OUTRO", label: "Outro" },
];

export function IngestForm({
  kind,
  funders,
  defaultFunderId,
  manualsByFunder = {},
  existingByFunder = {},
}: {
  kind: "manual" | "documento";
  funders: Funder[];
  defaultFunderId?: string;
  manualsByFunder?: Record<string, ManualRef[]>;
  existingByFunder?: Record<string, ExistingItem[]>;
}) {
  const router = useRouter();
  const [funderId, setFunderId] = useState(defaultFunderId ?? funders[0]?.id ?? "");
  const [manualMode, setManualMode] = useState<"novo" | "existente">("novo");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const manualsOfFunder = useMemo(
    () => manualsByFunder[funderId] ?? [],
    [manualsByFunder, funderId],
  );
  const existingOfFunder = useMemo(
    () => existingByFunder[funderId] ?? [],
    [existingByFunder, funderId],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    setStatus("Enviando arquivo e indexando na base de conhecimento…");

    try {
      const fd = new FormData(e.currentTarget);
      fd.set("kind", kind);
      const res = await fetch("/api/admin/ingest", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Falha ao processar o documento.");
      }
      setStatus(
        `Indexado com sucesso: ${data.chunks} trechos de ${data.pages} páginas.`,
      );
      router.push(`/admin/manuais?funderId=${funderId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setStatus(null);
    } finally {
      setPending(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="funderId" className="text-sm font-medium">
          Financiador <span className="text-danger">*</span>
        </label>
        <select
          id="funderId"
          name="funderId"
          required
          value={funderId}
          onChange={(e) => setFunderId(e.target.value)}
          className={inputCls}
        >
          <option value="" disabled>
            Selecione…
          </option>
          {funders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted">
          O conteúdo será indexado isoladamente na base deste financiador.
        </p>
      </div>

      {funderId && (
        <div className="rounded-xl border border-border bg-accent/30 p-4">
          <p className="text-sm font-medium">
            Documentos já cadastrados deste financiador
          </p>
          {existingOfFunder.length === 0 ? (
            <p className="mt-2 text-xs text-muted">
              Nenhum documento cadastrado ainda.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {existingOfFunder.map((it, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="rounded bg-card px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted">
                      {it.kind === "manual" ? "Manual" : "Legislação"}
                    </span>
                    <span className="text-foreground">{it.label}</span>
                  </span>
                  {it.indexed ? (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      ● indexado · {it.chunks} trechos
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      ● apenas salvo (não indexado)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {kind === "manual" && (
        <>
          <div className="space-y-2">
            <span className="text-sm font-medium">Manual</span>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="manualMode"
                  checked={manualMode === "novo"}
                  onChange={() => setManualMode("novo")}
                />
                Novo manual
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="manualMode"
                  checked={manualMode === "existente"}
                  onChange={() => setManualMode("existente")}
                  disabled={manualsOfFunder.length === 0}
                />
                Nova versão de manual existente
                {manualsOfFunder.length === 0 && (
                  <span className="text-xs text-muted">(nenhum ainda)</span>
                )}
              </label>
            </div>

            {manualMode === "novo" ? (
              <input
                name="manualTitle"
                placeholder="Título do manual (ex.: Manual de Prestação de Contas)"
                className={inputCls}
                required
              />
            ) : (
              <select name="manualId" className={inputCls} required>
                <option value="">Selecione o manual…</option>
                {manualsOfFunder.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="version" className="text-sm font-medium">
                Versão <span className="text-danger">*</span>
              </label>
              <input
                id="version"
                name="version"
                placeholder="ex.: 2025.1"
                className={inputCls}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="effectiveDate" className="text-sm font-medium">
                Vigência
              </label>
              <input
                id="effectiveDate"
                name="effectiveDate"
                type="date"
                className={inputCls}
              />
            </div>
          </div>
        </>
      )}

      {kind === "documento" && (
        <>
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              Título <span className="text-danger">*</span>
            </label>
            <input
              id="title"
              name="title"
              placeholder="ex.: Resolução nº 12/2025 — Diárias e Passagens"
              className={inputCls}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="type" className="text-sm font-medium">
              Tipo
            </label>
            <select id="type" name="type" className={inputCls} defaultValue="NORMA">
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <label htmlFor="file" className="text-sm font-medium">
          Arquivo PDF <span className="text-danger">*</span>
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="application/pdf"
          required
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary-hover"
        />
        <p className="text-xs text-muted">
          PDF com camada de texto (não escaneado). Máx. 20 MB.
        </p>
      </div>

      {status && !error && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {status}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending || !funderId}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Processando…" : "Enviar e indexar"}
        </button>
        <Link
          href="/admin/manuais"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
