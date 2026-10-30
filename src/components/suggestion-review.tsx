"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Funder = { id: string; name: string };
type FileRef = { id: string; fileName: string };

const DOC_TYPES = [
  { value: "NORMA", label: "Norma" },
  { value: "RESOLUCAO", label: "Resolução" },
  { value: "ORIENTACAO", label: "Orientação" },
  { value: "COMUNICADO", label: "Comunicado" },
  { value: "OUTRO", label: "Outro" },
];

// Deriva um título legível a partir do caminho salvo no Blob
// (ex.: "sugestoes/<id>/1730-Resolucao_12.pdf" → "Resolucao 12").
function defaultTitle(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base
    .replace(/\.pdf$/i, "")
    .replace(/^\d+-/, "")
    .replace(/[_]+/g, " ")
    .trim();
}

export function SuggestionReview({
  suggestionId,
  funders,
  files,
  defaultFunderId,
  suggestedFunderName,
}: {
  suggestionId: string;
  funders: Funder[];
  files: FileRef[];
  defaultFunderId: string | null;
  suggestedFunderName: string | null;
}) {
  const router = useRouter();
  const [selectedFunders, setSelectedFunders] = useState<Set<string>>(
    new Set(defaultFunderId ? [defaultFunderId] : []),
  );
  const [createNew, setCreateNew] = useState<boolean>(!defaultFunderId && !!suggestedFunderName);
  const [newFunderName, setNewFunderName] = useState<string>(suggestedFunderName ?? "");
  const [fileState, setFileState] = useState(
    files.map((f) => ({
      id: f.id,
      include: true,
      title: defaultTitle(f.fileName),
      type: "NORMA",
    })),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleFunder(id: string) {
    setSelectedFunders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateFile(id: string, patch: Partial<{ include: boolean; title: string; type: string }>) {
    setFileState((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  async function approve() {
    setError(null);

    const funderIds = [...selectedFunders];
    const trimmedNew = createNew ? newFunderName.trim() : "";
    if (funderIds.length === 0 && !trimmedNew) {
      setError("Escolha ao menos um financiador existente ou crie um novo.");
      return;
    }
    const chosenFiles = fileState.filter((f) => f.include);
    if (chosenFiles.length === 0) {
      setError("Selecione ao menos um arquivo para aprovar.");
      return;
    }
    if (chosenFiles.some((f) => !f.title.trim())) {
      setError("Dê um título a cada arquivo selecionado.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/admin/sugestoes/aprovar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId,
          newFunderName: trimmedNew || undefined,
          funderIds,
          files: chosenFiles.map((f) => ({
            suggestionFileId: f.id,
            title: f.title.trim(),
            type: f.type,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Falha ao aprovar.");
      router.push("/admin/sugestoes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setPending(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-medium">Aprovar e incluir na base</h2>

      {/* Financiadores */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Financiadores que este documento atende{" "}
          <span className="text-danger">*</span>
        </p>
        <p className="text-xs text-muted">
          Marque um ou mais. O mesmo documento será consultável por todos eles.
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {funders.map((f) => (
            <label
              key={f.id}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedFunders.has(f.id)}
                onChange={() => toggleFunder(f.id)}
              />
              {f.name}
            </label>
          ))}
        </div>

        <label className="mt-1 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={createNew}
            onChange={(e) => setCreateNew(e.target.checked)}
          />
          Criar um novo financiador
        </label>
        {createNew && (
          <input
            value={newFunderName}
            onChange={(e) => setNewFunderName(e.target.value)}
            placeholder="Nome do novo financiador"
            className={inputCls}
          />
        )}
      </div>

      {/* Arquivos → documentos */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Arquivos</p>
        <p className="text-xs text-muted">
          Cada arquivo selecionado vira um documento da base. Defina título e tipo.
        </p>
        <div className="space-y-3">
          {fileState.map((f) => (
            <div
              key={f.id}
              className={`rounded-lg border p-3 ${
                f.include ? "border-border" : "border-dashed border-border opacity-60"
              }`}
            >
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={f.include}
                  onChange={(e) => updateFile(f.id, { include: e.target.checked })}
                />
                Incluir este arquivo
              </label>
              {f.include && (
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_180px]">
                  <input
                    value={f.title}
                    onChange={(e) => updateFile(f.id, { title: e.target.value })}
                    placeholder="Título do documento"
                    className={inputCls}
                  />
                  <select
                    value={f.type}
                    onChange={(e) => updateFile(f.id, { type: e.target.value })}
                    className={inputCls}
                  >
                    {DOC_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={approve}
          disabled={pending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Processando e indexando…" : "Aprovar e indexar"}
        </button>
        {pending && (
          <span className="text-xs text-muted">
            A indexação pode levar alguns instantes por arquivo.
          </span>
        )}
      </div>
    </div>
  );
}
