import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { ingestPdf } from "@/lib/rag/ingest";

export const maxDuration = 60;

// Reindexa um manual/documento já enviado, reprocessando o PDF do Blob.
// Útil após falhas de embedding (ex.: rate limit do Voyage) — sem reupload.
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = (await req.json()) as { kind?: string; id?: string };
    const { kind, id } = body;
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID ausente." }, { status: 400 });
    }

    if (kind === "manual") {
      const mv = await prisma.manualVersion.findUnique({
        where: { id },
        include: { manual: { include: { funder: true } } },
      });
      if (!mv || !mv.fileUrl) {
        return NextResponse.json(
          { ok: false, error: "Versão ou arquivo não encontrado." },
          { status: 404 },
        );
      }
      const resp = await fetch(mv.fileUrl);
      if (!resp.ok) {
        return NextResponse.json(
          { ok: false, error: "Não foi possível baixar o PDF do armazenamento." },
          { status: 502 },
        );
      }
      const bytes = new Uint8Array(await resp.arrayBuffer());

      // Remove trechos antigos desta versão antes de reindexar.
      await prisma.knowledgeChunk.deleteMany({ where: { manualVersionId: id } });

      const result = await ingestPdf(bytes, {
        funderId: mv.manual.funderId,
        docTitle: `${mv.manual.title} (v. ${mv.version})`,
        manualVersionId: mv.id,
      });
      await prisma.manualVersion.update({
        where: { id },
        data: { indexed: result.chunks > 0 },
      });
      await logAudit({
        userId: admin.id,
        action: "UPDATE",
        entity: "ManualVersion",
        entityId: id,
        details: `reindex · ${result.chunks} trechos`,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (kind === "documento") {
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc || !doc.fileUrl) {
        return NextResponse.json(
          { ok: false, error: "Documento ou arquivo não encontrado." },
          { status: 404 },
        );
      }
      const resp = await fetch(doc.fileUrl);
      if (!resp.ok) {
        return NextResponse.json(
          { ok: false, error: "Não foi possível baixar o PDF do armazenamento." },
          { status: 502 },
        );
      }
      const bytes = new Uint8Array(await resp.arrayBuffer());

      await prisma.knowledgeChunk.deleteMany({ where: { documentId: id } });

      const result = await ingestPdf(bytes, {
        funderId: doc.funderId,
        docTitle: doc.title,
        documentId: doc.id,
      });
      await prisma.document.update({
        where: { id },
        data: { indexed: result.chunks > 0 },
      });
      await logAudit({
        userId: admin.id,
        action: "UPDATE",
        entity: "Document",
        entityId: id,
        details: `reindex · ${result.chunks} trechos`,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json({ ok: false, error: "Tipo inválido." }, { status: 400 });
  } catch (err) {
    console.error("[reindex] erro:", err);
    const msg =
      err instanceof Error && /429|rate/i.test(err.message)
        ? "Limite do serviço de embeddings atingido. Adicione um método de pagamento no Voyage e tente novamente."
        : "Falha ao reindexar. Tente novamente.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
