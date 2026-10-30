"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Funder = { id: string; name: string };

export function SuggestionForm({ funders }: { funders: Funder[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"existente" | "novo">(
    funders.length > 0 ? "existente" : "novo",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    setStatus("Enviando sugestão…");
    try {
      const fd = new FormData(e.currentTarget);
      // Garante que só vai o campo do modo escolhido.
      if (mode === "existente") fd.delete("suggestedFunderName");
      else fd.delete("funderId");

      const res = await fetch("/api/sugestoes", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Falha ao enviar a sugestão.");
      }
      setStatus("Sugestão enviada! O administrador vai avaliá-la.");
      router.push("/app/sugestoes");
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
      <div className="space-y-2">
        <span className="text-sm font-medium">
          Financiador <span className="text-danger">*</span>
        </span>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="funderMode"
              checked={mode === "existente"}
              onChange={() => setMode("existente")}
              disabled={funders.length === 0}
            />
            Financiador já cadastrado
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="funderMode"
              checked={mode === "novo"}
              onChange={() => setMode("novo")}
            />
            Não encontrei o financiador
          </label>
        </div>

        {mode === "existente" ? (
          <select name="funderId" required className={inputCls} defaultValue="">
            <option value="" disabled>
              Selecione…
            </option>
            {funders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              name="suggestedFunderName"
              required
              placeholder="Nome do financiador (ex.: Fundação XPTO)"
              className={inputCls}
            />
            <p className="text-xs text-muted">
              Indique o nome como você o conhece. O administrador poderá criar o
              financiador com esse nome ou vincular o documento a um já existente.
            </p>
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          O que há neste(s) documento(s)? <span className="text-danger">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          minLength={10}
          placeholder="Resuma brevemente o conteúdo e por que ele ajuda na prestação de contas (ex.: Resolução sobre diárias e passagens de 2025)."
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="file" className="text-sm font-medium">
          Documento(s) PDF <span className="text-danger">*</span>
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="application/pdf"
          multiple
          required
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary-hover"
        />
        <p className="text-xs text-muted">
          Você pode anexar até 5 arquivos PDF (máx. 20 MB cada).
        </p>
      </div>

      {status && !error && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {status}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Enviar sugestão"}
        </button>
        <Link
          href="/app/sugestoes"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
