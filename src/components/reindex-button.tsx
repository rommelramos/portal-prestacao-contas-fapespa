"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReindexButton({
  kind,
  id,
}: {
  kind: "manual" | "documento";
  id: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/reindex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Falha.");
      setMsg(`${data.chunks} trechos`);
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-lg border border-border px-2.5 py-1 text-xs transition hover:bg-accent disabled:opacity-60"
        title="Reprocessar o PDF já enviado"
      >
        {pending ? "Indexando…" : "Reindexar"}
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </span>
  );
}
