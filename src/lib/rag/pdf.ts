import { extractText, getDocumentProxy } from "unpdf";

/** Extrai o texto de um PDF, uma string por página. */
export async function extractPdfPages(data: Uint8Array): Promise<string[]> {
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text];
  return pages.map((t) => (t ?? "").replace(/\s+/g, " ").trim());
}

export type Chunk = { content: string; reference: string; ordinal: number };

/**
 * Fatia o texto em trechos para embedding, preservando a referência de página
 * (essencial para a citação de fonte exigida na consulta).
 */
export function chunkPages(
  pages: string[],
  docTitle: string,
  opts?: { size?: number; overlap?: number },
): Chunk[] {
  const size = opts?.size ?? 1400;
  const overlap = opts?.overlap ?? 200;
  const chunks: Chunk[] = [];
  let ordinal = 0;

  pages.forEach((pageText, idx) => {
    const pageNo = idx + 1;
    if (!pageText) return;
    const ref = `${docTitle}, p. ${pageNo}`;

    if (pageText.length <= size) {
      chunks.push({ content: pageText, reference: ref, ordinal: ordinal++ });
      return;
    }

    let start = 0;
    while (start < pageText.length) {
      const end = Math.min(start + size, pageText.length);
      const slice = pageText.slice(start, end).trim();
      if (slice) chunks.push({ content: slice, reference: ref, ordinal: ordinal++ });
      if (end >= pageText.length) break;
      start = end - overlap;
    }
  });

  return chunks;
}
