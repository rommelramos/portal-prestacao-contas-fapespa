import { NextResponse, type NextRequest } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { uploadPdf } from "@/lib/blob";
import { ingestPdf } from "@/lib/rag/ingest";
import { retrieveChunks } from "@/lib/rag/retrieve";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Teste TEMPORÁRIO do caminho real de upload de PDF: Blob + unpdf + ingest +
// retrieval. Protegido por SETUP_TOKEN. Recebe o PDF via multipart, indexa
// num financiador de teste, consulta e limpa tudo (funder + arquivo no Blob).
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Anexe um PDF." }, { status: 400 });
  }

  const funder = await prisma.funder.create({ data: { name: "ZZ Teste PDF" } });
  let blobPath: string | null = null;

  try {
    const { url, pathname } = await uploadPdf(file, `teste/${funder.id}`);
    blobPath = url;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await ingestPdf(bytes, {
      funderId: funder.id,
      docTitle: "Manual de Teste",
    });

    const query = "Quantos orçamentos preciso para comprar material?";
    const top = await retrieveChunks({ funderId: funder.id, query, topK: 2 });

    return NextResponse.json({
      ok: true,
      blobUrl: url,
      blobPath: pathname,
      pages: result.pages,
      chunks: result.chunks,
      query,
      top: top.map((r) => ({
        score: Number(r.score.toFixed(4)),
        reference: r.reference,
        snippet: r.content.slice(0, 90),
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error)?.message?.slice(0, 300) },
      { status: 500 },
    );
  } finally {
    await prisma.funder.deleteMany({ where: { id: funder.id } });
    if (blobPath) {
      try {
        await del(blobPath);
      } catch {
        /* ignore */
      }
    }
  }
}
