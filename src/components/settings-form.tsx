"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsFormState } from "@/lib/actions/settings";

type Values = {
  model: string;
  effort: string;
  tone: string;
  promptBase: string;
  topK: number;
  similarityThreshold: number;
};

const MODELS = [
  { value: "claude-opus-4-8", label: "Claude Opus 4.8 (mais inteligente)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (equilíbrio)" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5 (mais rápido/barato)" },
];
const EFFORTS = [
  { value: "low", label: "Baixo (rápido)" },
  { value: "medium", label: "Médio" },
  { value: "high", label: "Alto (mais cuidadoso)" },
  { value: "xhigh", label: "Muito alto" },
  { value: "max", label: "Máximo (mais lento)" },
];
const TONES = [
  { value: "formal", label: "Formal e técnico" },
  { value: "didatico", label: "Didático (acessível)" },
  { value: "conciso", label: "Conciso (direto ao ponto)" },
  { value: "detalhado", label: "Detalhado (cobre nuances)" },
];

export function SettingsForm({ initial }: { initial: Values }) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(
    saveSettings,
    undefined,
  );
  const err = (f: string) => state?.fieldErrors?.[f];

  const sel =
    "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";
  const help = "text-xs text-muted";

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {/* Prompt base */}
      <div className="space-y-1.5">
        <label htmlFor="promptBase" className="text-sm font-medium">
          Prompt base
        </label>
        <textarea
          id="promptBase"
          name="promptBase"
          rows={4}
          defaultValue={initial.promptBase}
          className={sel}
        />
        <p className={help}>
          Instrução-mãe que define o papel e as diretrizes do assistente — o
          parâmetro de maior alcance. As regras inegociáveis (citar fonte, usar
          só o contexto do financiador, avisar quando não há base) permanecem
          fixas e não podem ser desativadas aqui.
        </p>
        {err("promptBase") && <p className="text-sm text-danger">{err("promptBase")}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Modelo */}
        <div className="space-y-1.5">
          <label htmlFor="model" className="text-sm font-medium">
            Modelo
          </label>
          <select id="model" name="model" defaultValue={initial.model} className={sel}>
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <p className={help}>
            Qual versão do Claude. Opus = mais inteligente; Sonnet = equilíbrio;
            Haiku = mais rápido e barato. Afeta qualidade, custo e tempo de
            resposta.
          </p>
        </div>

        {/* Effort */}
        <div className="space-y-1.5">
          <label htmlFor="effort" className="text-sm font-medium">
            Esforço de raciocínio (effort)
          </label>
          <select id="effort" name="effort" defaultValue={initial.effort} className={sel}>
            {EFFORTS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <p className={help}>
            Quanto o modelo “pensa” antes de responder. Mais alto = respostas
            mais cuidadosas, porém mais lentas e caras. (No parecer, usa-se no
            mínimo “Médio”.)
          </p>
        </div>

        {/* Tom */}
        <div className="space-y-1.5">
          <label htmlFor="tone" className="text-sm font-medium">
            Tom
          </label>
          <select id="tone" name="tone" defaultValue={initial.tone} className={sel}>
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className={help}>
            Estilo da redação. Não muda as regras nem o conteúdo, apenas a forma
            como a resposta é escrita.
          </p>
        </div>

        {/* topK */}
        <div className="space-y-1.5">
          <label htmlFor="topK" className="text-sm font-medium">
            topK (trechos recuperados)
          </label>
          <input
            id="topK"
            name="topK"
            type="number"
            min={1}
            max={30}
            defaultValue={initial.topK}
            className={sel}
          />
          <p className={help}>
            Quantos trechos dos manuais alimentam a resposta. Maior = mais
            contexto (menos chance de faltar info), porém mais ruído e custo.
          </p>
          {err("topK") && <p className="text-sm text-danger">{err("topK")}</p>}
        </div>

        {/* Limiar */}
        <div className="space-y-1.5">
          <label htmlFor="similarityThreshold" className="text-sm font-medium">
            Limiar de similaridade (0–1)
          </label>
          <input
            id="similarityThreshold"
            name="similarityThreshold"
            type="number"
            min={0}
            max={1}
            step={0.05}
            defaultValue={initial.similarityThreshold}
            className={sel}
          />
          <p className={help}>
            Nota mínima para um trecho ser considerado relevante. Mais alto =
            só usa trechos muito aderentes (reduz invenção, mas pode responder
            “sem base” com mais frequência); 0 = não filtra.
          </p>
          {err("similarityThreshold") && (
            <p className="text-sm text-danger">{err("similarityThreshold")}</p>
          )}
        </div>
      </div>

      {state?.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Configurações salvas. Já valem para as próximas consultas.
        </p>
      )}
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar configurações"}
      </button>
    </form>
  );
}
