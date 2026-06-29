import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { generateParecer, type ChatTurn } from "@/lib/ai/anthropic";
import { getSettings } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  // Rate limit: pareceres são pesados — 8 a cada 10 minutos por usuário.
  const rl = await rateLimit(`parecer:${session.user.id}`, 8, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Limite de geração de pareceres atingido. Aguarde ${Math.ceil(rl.retryAfter / 60)} min.`,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.sessionId) {
    return NextResponse.json({ ok: false, error: "Sessão ausente." }, { status: 400 });
  }

  const chat = await prisma.chatSession.findFirst({
    where: { id: body.sessionId, userId: session.user.id },
    include: {
      funder: true,
      manualVersion: { include: { manual: true } },
      document: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!chat) {
    return NextResponse.json({ ok: false, error: "Consulta não encontrada." }, { status: 404 });
  }
  if (chat.messages.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Esta consulta não tem mensagens." },
      { status: 400 },
    );
  }

  const manualLabel = chat.manualVersion
    ? `${chat.manualVersion.manual.title} — versão ${chat.manualVersion.version}`
    : chat.document
      ? chat.document.title
      : "manuais e legislações cadastrados";

  const conversation: ChatTurn[] = chat.messages.map((m) => ({
    role: m.role === "ASSISTANT" ? "assistant" : "user",
    content: m.content,
  }));

  // Consulta = perguntas do usuário, usadas para recuperar os trechos.
  const query = chat.messages
    .filter((m) => m.role === "USER")
    .map((m) => m.content)
    .join(" ");

  try {
    const settings = await getSettings();
    const chunks = await retrieveChunks({
      funderId: chat.funderId,
      query: query || conversation[conversation.length - 1].content,
      manualVersionId: chat.manualVersionId ?? undefined,
      documentId: chat.documentId ?? undefined,
      topK: Math.max(settings.topK, 10),
      minScore: settings.similarityThreshold,
    });

    const { answer } = await generateParecer({
      funderName: chat.funder.name,
      manualLabel,
      chunks,
      conversation,
      config: settings,
    });

    return NextResponse.json({
      ok: true,
      parecer: answer,
      meta: {
        funderName: chat.funder.name,
        manualLabel,
        userName: session.user.name ?? "",
        title: chat.title ?? "Consulta",
      },
    });
  } catch (err) {
    console.error("[parecer] erro:", err);
    return NextResponse.json(
      { ok: false, error: "Falha ao gerar o parecer. Tente novamente." },
      { status: 500 },
    );
  }
}
