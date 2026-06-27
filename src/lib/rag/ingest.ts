import { prisma } from "@/lib/prisma";
import { embedDocuments } from "./voyage";
import { extractPdfPages, chunkPages } from "./pdf";

type IngestTarget = {
  funderId: string;
  docTitle: string;
  manualVersionId?: string;
  documentId?: string;
};

/**
 * Indexa um PDF na base de conhecimento de UM financiador: extrai o texto,
 * fatia em trechos, gera embeddings (Voyage) e grava os KnowledgeChunk
 * SEMPRE com o funderId — garantindo o isolamento por financiador.
 */
export async function ingestPdf(
  data: Uint8Array,
  target: IngestTarget,
): Promise<{ chunks: number; pages: number }> {
  const pages = await extractPdfPages(data);
  const chunks = chunkPages(pages, target.docTitle);

  if (chunks.length === 0) {
    return { chunks: 0, pages: pages.length };
  }

  const vectors = await embedDocuments(chunks.map((c) => c.content));

  const rows = chunks.map((c, i) => ({
    funderId: target.funderId,
    manualVersionId: target.manualVersionId ?? null,
    documentId: target.documentId ?? null,
    ordinal: c.ordinal,
    content: c.content,
    reference: c.reference,
    embedding: JSON.stringify(vectors[i] ?? []),
  }));

  // Insere em lotes pequenos (embeddings são grandes; evita estourar o
  // max_allowed_packet do MySQL compartilhado).
  const BATCH = 25;
  for (let i = 0; i < rows.length; i += BATCH) {
    await prisma.knowledgeChunk.createMany({ data: rows.slice(i, i + BATCH) });
  }

  return { chunks: chunks.length, pages: pages.length };
}
