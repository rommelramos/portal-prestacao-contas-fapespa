import { prisma } from "@/lib/prisma";

export type AppSettings = {
  model: string;
  effort: string;
  tone: string;
  promptBase: string;
  topK: number;
  similarityThreshold: number;
};

// Valores em uso hoje (aparecem pré-preenchidos na tela de configuração).
export const DEFAULT_SETTINGS: AppSettings = {
  model: "claude-opus-4-8",
  effort: "low",
  tone: "formal",
  promptBase:
    "Você é um assistente especializado em prestação de contas de projetos de pesquisa e inovação. Responda às dúvidas sobre as regras do financiador selecionado de forma precisa, técnica e orientativa.",
  topK: 8,
  similarityThreshold: 0,
};

export const MODEL_OPTIONS = [
  { value: "claude-opus-4-8", label: "Claude Opus 4.8 (mais inteligente)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (equilíbrio)" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5 (mais rápido/barato)" },
];

export const EFFORT_OPTIONS = [
  { value: "low", label: "Baixo (rápido)" },
  { value: "medium", label: "Médio" },
  { value: "high", label: "Alto (mais cuidadoso)" },
  { value: "xhigh", label: "Muito alto" },
  { value: "max", label: "Máximo (mais lento)" },
];

export const TONE_OPTIONS = [
  { value: "formal", label: "Formal e técnico" },
  { value: "didatico", label: "Didático (linguagem acessível)" },
  { value: "conciso", label: "Conciso (direto ao ponto)" },
  { value: "detalhado", label: "Detalhado (cobre nuances)" },
];

export function toneInstruction(tone: string): string {
  switch (tone) {
    case "didatico":
      return "Explique de forma didática e acessível, como para alguém leigo no assunto.";
    case "conciso":
      return "Seja direto e conciso; vá ao ponto com o mínimo de texto necessário.";
    case "detalhado":
      return "Seja detalhado e completo, cobrindo nuances e exceções quando houver.";
    case "formal":
    default:
      return "Use linguagem formal e técnica.";
  }
}

/** Lê as configurações globais; retorna os defaults se ainda não houver registro. */
export async function getSettings(): Promise<AppSettings> {
  try {
    const s = await prisma.setting.findUnique({ where: { id: "global" } });
    if (!s) return DEFAULT_SETTINGS;
    return {
      model: s.model,
      effort: s.effort,
      tone: s.tone,
      promptBase: s.promptBase || DEFAULT_SETTINGS.promptBase,
      topK: s.topK,
      similarityThreshold: s.similarityThreshold,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
