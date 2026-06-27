import { VoyageAIClient } from "voyageai";

// Modelo multilíngue (bom para português jurídico/financeiro). Configurável.
const MODEL = process.env.VOYAGE_MODEL ?? "voyage-3.5";
const BATCH = 64; // Voyage aceita até 128 inputs por chamada.

function client(): VoyageAIClient {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY não configurada.");
  return new VoyageAIClient({ apiKey });
}

/** Gera embeddings para trechos de documentos (indexação). */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const c = client();
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await c.embed({
      input: batch,
      model: MODEL,
      inputType: "document",
    });
    const data = [...(res.data ?? [])].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );
    for (const d of data) out.push(d.embedding ?? []);
  }
  return out;
}

/** Gera o embedding da pergunta do usuário (consulta). */
export async function embedQuery(text: string): Promise<number[]> {
  const c = client();
  const res = await c.embed({
    input: [text],
    model: MODEL,
    inputType: "query",
  });
  return res.data?.[0]?.embedding ?? [];
}
