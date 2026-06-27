import { VoyageAIClient } from "voyageai";

// Modelo multilíngue (bom para português jurídico/financeiro). Configurável.
const MODEL = process.env.VOYAGE_MODEL ?? "voyage-3.5";
// Lotes pequenos para respeitar limites de tokens/min (free tier: 10K TPM).
const BATCH = 12;

function client(): VoyageAIClient {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY não configurada.");
  return new VoyageAIClient({ apiKey });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRateLimit(err: unknown): boolean {
  const e = err as { statusCode?: number; status?: number };
  return e?.statusCode === 429 || e?.status === 429;
}

/** Chama o embed com retry/backoff em caso de 429 (rate limit). */
async function embedBatchWithRetry(
  c: VoyageAIClient,
  input: string[],
  inputType: "document" | "query",
  attempt = 0,
): Promise<number[][]> {
  try {
    const res = await c.embed({ input, model: MODEL, inputType });
    const data = [...(res.data ?? [])].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );
    return data.map((d) => d.embedding ?? []);
  } catch (err) {
    if (isRateLimit(err) && attempt < 5) {
      // Backoff exponencial (free tier ~3 RPM): 4s, 8s, 16s…
      await sleep(Math.min(20000, 4000 * 2 ** attempt));
      return embedBatchWithRetry(c, input, inputType, attempt + 1);
    }
    throw err;
  }
}

/** Gera embeddings para trechos de documentos (indexação). */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const c = client();
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const vectors = await embedBatchWithRetry(c, batch, "document");
    out.push(...vectors);
  }
  return out;
}

/** Gera o embedding da pergunta do usuário (consulta). */
export async function embedQuery(text: string): Promise<number[]> {
  const c = client();
  const vectors = await embedBatchWithRetry(c, [text], "query");
  return vectors[0] ?? [];
}
