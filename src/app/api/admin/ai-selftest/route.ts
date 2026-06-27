import { NextResponse, type NextRequest } from "next/server";
import { answerWithContext } from "@/lib/ai/anthropic";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Teste TEMPORÁRIO da geração com o Claude (chunks fixos — sem banco).
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  try {
    const chunks = [
      {
        id: "1",
        content:
          "O pagamento de diárias exige a apresentação do relatório de viagem assinado e dos comprovantes de hospedagem do período.",
        reference: "Manual de Prestação de Contas (v. 2025.1), p. 12",
        manualVersionId: "mv1",
        documentId: null,
        score: 0.7,
      },
    ];

    const start = Date.now ? 0 : 0; // Date.now permitido aqui (runtime app)
    void start;

    const { answer, refusal } = await answerWithContext({
      funderName: "FAPESPA",
      manualLabel: "Manual de Prestação de Contas — versão 2025.1",
      chunks,
      history: [],
      question: "Quais documentos preciso para receber diárias?",
    });

    return NextResponse.json({ ok: true, refusal, answer });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error)?.message?.slice(0, 300) },
      { status: 500 },
    );
  }
}
