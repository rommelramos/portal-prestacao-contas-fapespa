import { prisma } from "@/lib/prisma";

export type RateResult = { ok: boolean; retryAfter: number };

/**
 * Rate limiting por janela fixa, persistido no banco.
 * `key` identifica o alvo (ex.: "chat:userId"), `limit` é o máximo de
 * requisições dentro de `windowMs`. Falha em modo aberto (fail-open):
 * se o banco estiver indisponível, NÃO bloqueia o uso legítimo.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateResult> {
  const now = new Date();
  try {
    const current = await prisma.rateLimit.findUnique({ where: { key } });

    if (!current || current.resetAt <= now) {
      const resetAt = new Date(now.getTime() + windowMs);
      await prisma.rateLimit.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      });
      return { ok: true, retryAfter: 0 };
    }

    if (current.count < limit) {
      await prisma.rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
      });
      return { ok: true, retryAfter: 0 };
    }

    const retryAfter = Math.max(
      1,
      Math.ceil((current.resetAt.getTime() - now.getTime()) / 1000),
    );
    return { ok: false, retryAfter };
  } catch (err) {
    console.error("[rate-limit] erro (liberando):", err);
    return { ok: true, retryAfter: 0 };
  }
}

/** Extrai um identificador de IP do request (Vercel envia x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "desconhecido";
}
