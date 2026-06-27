import Anthropic from "@anthropic-ai/sdk";
import type { RetrievedChunk } from "@/lib/rag/retrieve";

// Lê ANTHROPIC_API_KEY do ambiente.
const client = new Anthropic();

const MODEL = "claude-opus-4-8";

export type ChatTurn = { role: "user" | "assistant"; content: string };

function systemPrompt(funderName: string, manualLabel: string): string {
  return [
    `Você é um assistente especializado em prestação de contas de projetos de pesquisa e inovação.`,
    `Você está respondendo dúvidas EXCLUSIVAMENTE sobre as regras do financiador "${funderName}"${manualLabel ? ` (${manualLabel})` : ""}.`,
    ``,
    `REGRAS OBRIGATÓRIAS:`,
    `1. Responda SOMENTE com base nos trechos de contexto fornecidos abaixo. NÃO use conhecimento externo, NÃO invente regras e NÃO misture regras de outros financiadores.`,
    `2. Sempre que afirmar uma regra ou conclusão, cite a fonte ao final da frase no formato [fonte: <referência>], usando exatamente as referências dos trechos fornecidos (ex.: [fonte: Manual de Prestação de Contas (v. 2025.1), p. 12]).`,
    `3. Se os trechos NÃO contiverem informação suficiente para responder com segurança, diga claramente: "Não encontrei base suficiente nos documentos cadastrados deste financiador para responder a essa questão." e oriente o usuário a consultar o setor responsável. NUNCA especule.`,
    `4. Seja objetivo, claro e use linguagem acessível. Quando relevante, aborde compras de materiais e serviços, pagamento de bolsas, diárias, passagens, hospedagem e a forma de comprovação de despesas.`,
    `5. Não dê aconselhamento jurídico definitivo; suas respostas têm caráter orientativo, baseado nos manuais.`,
  ].join("\n");
}

function buildContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "(Nenhum trecho relevante foi encontrado na base de conhecimento deste financiador.)";
  }
  return chunks
    .map(
      (c, i) =>
        `[Trecho ${i + 1}] (fonte: ${c.reference ?? "documento sem referência"})\n${c.content}`,
    )
    .join("\n\n");
}

export type AnswerResult = {
  answer: string;
  refusal: boolean;
};

/** Gera a resposta do chatbot ancorada nos trechos do financiador. */
export async function answerWithContext(params: {
  funderName: string;
  manualLabel: string;
  chunks: RetrievedChunk[];
  history: ChatTurn[];
  question: string;
}): Promise<AnswerResult> {
  const userContent = [
    `CONTEXTO (trechos recuperados dos documentos do financiador):`,
    ``,
    buildContext(params.chunks),
    ``,
    `---`,
    `PERGUNTA DO USUÁRIO: ${params.question}`,
  ].join("\n");

  const messages: Anthropic.MessageParam[] = [
    ...params.history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: userContent },
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    system: systemPrompt(params.funderName, params.manualLabel),
    messages,
  });

  if (response.stop_reason === "refusal") {
    return {
      answer:
        "Não foi possível processar esta solicitação. Reformule a pergunta ou contate o suporte.",
      refusal: true,
    };
  }

  const answer = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return { answer: answer || "Não consegui gerar uma resposta.", refusal: false };
}
