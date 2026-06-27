"use client";

import { useState } from "react";
import { openParecerPrint } from "@/lib/parecer-print";

export function ParecerButton({
  sessionId,
  className,
}: {
  sessionId: string | null;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!sessionId || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/parecer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Falha ao gerar.");
      const ok = openParecerPrint(data.parecer, data.meta);
      if (!ok) setError("Permita pop-ups para abrir o parecer em PDF.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={generate}
        disabled={!sessionId || pending}
        className={
          className ??
          "rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:bg-accent disabled:opacity-60"
        }
        title="Gerar parecer técnico em PDF a partir desta consulta"
      >
        {pending ? "Gerando parecer…" : "Gerar parecer (PDF)"}
      </button>
      {error && <span className="mt-1 text-xs text-danger">{error}</span>}
    </span>
  );
}
