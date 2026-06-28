import { prisma } from "@/lib/prisma";
import { embedQuery } from "./voyage";

export type RetrievedChunk = {
  id: string;
  content: string;
  reference: string | null;
  manualVersionId: string | null;
  documentId: string | null;
  score: number;
};

function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Recupera os trechos mais relevantes para a consulta DENTRO de um único
 * financiador (e, opcionalmente, de uma versão de manual específica).
 *
 * O isolamento é garantido pelo filtro `funderId` aplicado no SQL ANTES de
 * qualquer cálculo de similaridade — nunca mistura financiadores.
 */
export async function retrieveChunks(params: {
  funderId: string;
  query: string;
  manualVersionId?: string;
  topK?: number;
  minScore?: number;
}): Promise<RetrievedChunk[]> {
  const topK = params.topK ?? 8;
  const minScore = params.minScore ?? 0;

  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      funderId: params.funderId,
      // Se uma versão de manual foi escolhida, restringe a ela — porém sempre
      // inclui as legislações/documentos complementares do mesmo financiador
      // (que não são versionados). Isolamento garantido pelo funderId acima.
      ...(params.manualVersionId
        ? {
            OR: [
              { manualVersionId: params.manualVersionId },
              { documentId: { not: null } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      content: true,
      reference: true,
      embedding: true,
      manualVersionId: true,
      documentId: true,
    },
  });

  if (chunks.length === 0) return [];

  const q = await embedQuery(params.query);

  const scored = chunks.map((c) => {
    let emb: number[] = [];
    try {
      emb = JSON.parse(c.embedding ?? "[]");
    } catch {
      emb = [];
    }
    return {
      id: c.id,
      content: c.content,
      reference: c.reference,
      manualVersionId: c.manualVersionId,
      documentId: c.documentId,
      score: cosine(q, emb),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  // Descarta trechos abaixo do limiar de similaridade (se configurado).
  const filtered = minScore > 0 ? scored.filter((c) => c.score >= minScore) : scored;
  return filtered.slice(0, topK);
}
