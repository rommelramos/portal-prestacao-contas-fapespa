import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { embedDocuments } from "@/lib/rag/voyage";
import { retrieveChunks } from "@/lib/rag/retrieve";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Autoteste TEMPORÁRIO do RAG (Voyage + storage + retrieval + isolamento).
// Protegido por SETUP_TOKEN. Cria 2 financiadores de teste, indexa textos
// distintos, consulta e valida que não há mistura entre financiadores.
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const a = await prisma.funder.create({ data: { name: "ZZ Teste RAG A" } });
  const b = await prisma.funder.create({ data: { name: "ZZ Teste RAG B" } });

  try {
    const textsA = [
      "Para o pagamento de diárias, é necessário apresentar o relatório de viagem assinado e os comprovantes de hospedagem.",
      "As passagens aéreas devem ser adquiridas pela tarifa mais econômica disponível no momento da compra.",
    ];
    const textsB = [
      "A compra de materiais de consumo exige a apresentação de no mínimo três orçamentos de fornecedores distintos.",
      "As bolsas de pesquisa são pagas mensalmente mediante a frequência aprovada pelo coordenador.",
    ];

    const [embA, embB] = await Promise.all([
      embedDocuments(textsA),
      embedDocuments(textsB),
    ]);

    await prisma.knowledgeChunk.createMany({
      data: textsA.map((content, i) => ({
        funderId: a.id,
        ordinal: i,
        content,
        reference: `Manual A, p. ${i + 1}`,
        embedding: JSON.stringify(embA[i] ?? []),
      })),
    });
    await prisma.knowledgeChunk.createMany({
      data: textsB.map((content, i) => ({
        funderId: b.id,
        ordinal: i,
        content,
        reference: `Manual B, p. ${i + 1}`,
        embedding: JSON.stringify(embB[i] ?? []),
      })),
    });

    const query = "Como faço para receber diárias de viagem?";
    const resultsA = await retrieveChunks({ funderId: a.id, query, topK: 3 });

    // Validação de isolamento: nenhum trecho recuperado pode conter conteúdo de B.
    const bContents = new Set(textsB);
    const leak = resultsA.some((r) => bContents.has(r.content));

    return NextResponse.json({
      ok: true,
      embeddingDim: embA[0]?.length ?? 0,
      query,
      isolationOk: !leak,
      top: resultsA.map((r) => ({
        score: Number(r.score.toFixed(4)),
        reference: r.reference,
        snippet: r.content.slice(0, 80),
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error)?.message?.slice(0, 300) },
      { status: 500 },
    );
  } finally {
    // Limpa os dados de teste (cascade remove os KnowledgeChunk).
    await prisma.funder.deleteMany({ where: { id: { in: [a.id, b.id] } } });
  }
}
