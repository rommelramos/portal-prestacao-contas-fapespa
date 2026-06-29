import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { answerWithContext, type ChatTurn } from "@/lib/ai/anthropic";
import { getSettings } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

const HISTORY_LIMIT = 10;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }
  const userId = session.user.id;

  // Rate limit: 20 consultas por minuto por usuário (controle de custo de IA).
  const rl = await rateLimit(`chat:${userId}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Muitas consultas em sequência. Aguarde ${rl.retryAfter}s e tente novamente.`,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: {
    sessionId?: string;
    funderId?: string;
    manualVersionId?: string;
    documentId?: string;
    message?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ ok: false, error: "Digite uma pergunta." }, { status: 400 });
  }
  if (!body.funderId) {
    return NextResponse.json(
      { ok: false, error: "Selecione o financiador." },
      { status: 400 },
    );
  }

  const funder = await prisma.funder.findUnique({ where: { id: body.funderId } });
  if (!funder || !funder.active) {
    return NextResponse.json(
      { ok: false, error: "Financiador indisponível." },
      { status: 404 },
    );
  }

  // Rótulo do documento (manual/versão ou legislação) para o prompt.
  let manualLabel = "manuais e legislações cadastrados";
  let manualVersionId: string | null = null;
  let documentId: string | null = null;
  if (body.manualVersionId) {
    const mv = await prisma.manualVersion.findUnique({
      where: { id: body.manualVersionId },
      include: { manual: true },
    });
    if (mv && mv.manual.funderId === funder.id) {
      manualVersionId = mv.id;
      manualLabel = `${mv.manual.title} — versão ${mv.version}`;
    }
  } else if (body.documentId) {
    const doc = await prisma.document.findUnique({ where: { id: body.documentId } });
    if (doc && doc.funderId === funder.id) {
      documentId = doc.id;
      manualLabel = doc.title;
    }
  }

  try {
    // Sessão: cria nova ou valida a existente (do próprio usuário).
    let chatSession;
    if (body.sessionId) {
      chatSession = await prisma.chatSession.findFirst({
        where: { id: body.sessionId, userId },
      });
      if (!chatSession) {
        return NextResponse.json(
          { ok: false, error: "Sessão não encontrada." },
          { status: 404 },
        );
      }
    } else {
      chatSession = await prisma.chatSession.create({
        data: {
          userId,
          funderId: funder.id,
          manualVersionId,
          documentId,
          title: message.slice(0, 80),
        },
      });
    }

    // Histórico anterior (para contexto do modelo).
    const past = await prisma.chatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      take: HISTORY_LIMIT,
    });
    const history: ChatTurn[] = past.map((m) => ({
      role: m.role === "ASSISTANT" ? "assistant" : "user",
      content: m.content,
    }));

    const settings = await getSettings();

    // Recupera trechos isolados por financiador (+ escopo, se houver).
    const chunks = await retrieveChunks({
      funderId: funder.id,
      query: message,
      manualVersionId: manualVersionId ?? undefined,
      documentId: documentId ?? undefined,
      topK: settings.topK,
      minScore: settings.similarityThreshold,
    });

    const { answer } = await answerWithContext({
      funderName: funder.name,
      manualLabel,
      chunks,
      history,
      question: message,
      config: settings,
    });

    // Fontes consultadas (referências únicas dos trechos recuperados).
    const citations = Array.from(
      new Set(chunks.map((c) => c.reference).filter((r): r is string => !!r)),
    );

    // Persiste as duas mensagens.
    await prisma.chatMessage.create({
      data: { sessionId: chatSession.id, role: "USER", content: message },
    });
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "ASSISTANT",
        content: answer,
        citations: JSON.stringify(citations),
      },
    });
    await prisma.chatSession.update({
      where: { id: chatSession.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      sessionId: chatSession.id,
      answer,
      citations,
    });
  } catch (err) {
    console.error("[chat] erro:", err);
    const msg =
      err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")
        ? "Serviço de IA não configurado (ANTHROPIC_API_KEY)."
        : "Falha ao processar a consulta. Tente novamente.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
