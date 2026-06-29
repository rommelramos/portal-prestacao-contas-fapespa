"use client";

import { useRef, useState, useEffect } from "react";
import { Markdown } from "@/components/markdown";
import { ParecerButton } from "@/components/parecer-button";

type Funder = { id: string; name: string };
type VersionRef = { id: string; version: string; manualTitle: string };
type DocRef = { id: string; title: string };

type Msg = {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
};

export function ChatClient({
  funders,
  versionsByFunder,
  documentsByFunder = {},
}: {
  funders: Funder[];
  versionsByFunder: Record<string, VersionRef[]>;
  documentsByFunder?: Record<string, DocRef[]>;
}) {
  const [started, setStarted] = useState(false);
  const [funderId, setFunderId] = useState(funders[0]?.id ?? "");
  // Escopo: "" = tudo · "mv:<id>" = versão de manual · "doc:<id>" = legislação
  const [scope, setScope] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const versions = versionsByFunder[funderId] ?? [];
  const documents = documentsByFunder[funderId] ?? [];
  const funderName = funders.find((f) => f.id === funderId)?.name ?? "";

  let scopeLabel = "todos os documentos";
  if (scope.startsWith("mv:")) {
    const v = versions.find((x) => x.id === scope.slice(3));
    if (v) scopeLabel = `${v.manualTitle} v. ${v.version}`;
  } else if (scope.startsWith("doc:")) {
    const d = documents.find((x) => x.id === scope.slice(4));
    if (d) scopeLabel = d.title;
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function start() {
    if (!funderId) return;
    setStarted(true);
    setMessages([]);
    setSessionId(null);
    setError(null);
  }

  function reset() {
    setStarted(false);
    setMessages([]);
    setSessionId(null);
    setInput("");
    setError(null);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || pending) return;

    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          funderId,
          manualVersionId: scope.startsWith("mv:") ? scope.slice(3) : undefined,
          documentId: scope.startsWith("doc:") ? scope.slice(4) : undefined,
          message: question,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Falha na consulta.");
      setSessionId(data.sessionId);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer, citations: data.citations },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setPending(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

  // Tela de seleção (RF018 / RF019)
  if (!started) {
    return (
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="text-xl font-semibold tracking-tight">Nova consulta</h1>
          <p className="mt-1 text-sm text-muted">
            Escolha o financiador e, opcionalmente, um documento específico. A
            IA responderá apenas com base nos documentos desse financiador.
          </p>

          {funders.length === 0 ? (
            <p className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Nenhum financiador disponível no momento. Contate o administrador.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="f" className="text-sm font-medium">
                  Financiador <span className="text-danger">*</span>
                </label>
                <select
                  id="f"
                  value={funderId}
                  onChange={(e) => {
                    setFunderId(e.target.value);
                    setScope("");
                  }}
                  className={inputCls}
                >
                  {funders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="v" className="text-sm font-medium">
                  Documento (manual ou legislação)
                </label>
                <select
                  id="v"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className={inputCls}
                >
                  <option value="">
                    Todos os manuais e legislações do financiador
                  </option>
                  {versions.length > 0 && (
                    <optgroup label="Manuais">
                      {versions.map((v) => (
                        <option key={v.id} value={`mv:${v.id}`}>
                          {v.manualTitle} — v. {v.version}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {documents.length > 0 && (
                    <optgroup label="Legislações e documentos">
                      {documents.map((d) => (
                        <option key={d.id} value={`doc:${d.id}`}>
                          {d.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {versions.length === 0 && documents.length === 0 && (
                  <p className="text-xs text-muted">
                    Este financiador ainda não tem documentos indexados.
                  </p>
                )}
              </div>

              <button
                onClick={start}
                disabled={!funderId}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
              >
                Iniciar consulta
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tela de conversa
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-accent/40 px-4 py-2.5">
        <div className="text-sm">
          <span className="font-medium">{funderName}</span>
          <span className="text-muted">
            {" · "}
            {scopeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sessionId && messages.some((m) => m.role === "assistant") && (
            <ParecerButton
              sessionId={sessionId}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            />
          )}
          <button
            onClick={reset}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
          >
            Nova consulta
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted">
            Faça uma pergunta — ex.: “Posso pagar diárias para um bolsista?”,
            “Como comprovar a compra de material?”.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  : "max-w-[90%] rounded-2xl border border-border bg-card px-4 py-3 text-sm"
              }
            >
              {m.role === "assistant" ? (
                <Markdown>{m.content}</Markdown>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                <div className="mt-3 border-t border-border pt-2">
                  <p className="text-xs font-medium text-muted">
                    Fontes consultadas:
                  </p>
                  <ul className="mt-1 list-inside list-disc text-xs text-muted">
                    {m.citations.map((c, j) => (
                      <li key={j}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted">
              Consultando os documentos…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={send} className="sticky bottom-0 mt-4 flex gap-2 bg-background py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua dúvida…"
          className={inputCls}
          disabled={pending}
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
