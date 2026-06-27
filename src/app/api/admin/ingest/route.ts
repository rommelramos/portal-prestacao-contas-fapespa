import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { uploadPdf } from "@/lib/blob";
import { ingestPdf } from "@/lib/rag/ingest";

export const maxDuration = 60;

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

type DocType = "ORIENTACAO" | "NORMA" | "RESOLUCAO" | "COMUNICADO" | "OUTRO";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const form = await req.formData();

    const kind = String(form.get("kind") ?? "");
    const funderId = String(form.get("funderId") ?? "");
    const file = form.get("file");

    if (!funderId) {
      return NextResponse.json(
        { ok: false, error: "Selecione o financiador." },
        { status: 400 },
      );
    }
    const funder = await prisma.funder.findUnique({ where: { id: funderId } });
    if (!funder) {
      return NextResponse.json(
        { ok: false, error: "Financiador não encontrado." },
        { status: 404 },
      );
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Anexe um arquivo PDF." },
        { status: 400 },
      );
    }
    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json(
        { ok: false, error: "O arquivo deve ser um PDF." },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Arquivo muito grande (máx. 20 MB)." },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    if (kind === "manual") {
      const manualId = String(form.get("manualId") ?? "");
      const manualTitle = String(form.get("manualTitle") ?? "").trim();
      const version = String(form.get("version") ?? "").trim();
      const effectiveDateRaw = String(form.get("effectiveDate") ?? "").trim();

      if (!version) {
        return NextResponse.json(
          { ok: false, error: "Informe a versão do manual." },
          { status: 400 },
        );
      }

      // Usa um manual existente ou cria um novo agrupador.
      let manual;
      if (manualId) {
        manual = await prisma.manual.findFirst({
          where: { id: manualId, funderId },
        });
        if (!manual) {
          return NextResponse.json(
            { ok: false, error: "Manual não encontrado." },
            { status: 404 },
          );
        }
      } else {
        if (!manualTitle) {
          return NextResponse.json(
            { ok: false, error: "Informe o título do manual." },
            { status: 400 },
          );
        }
        manual = await prisma.manual.create({
          data: { funderId, title: manualTitle },
        });
      }

      const { url, pathname } = await uploadPdf(file, `manuais/${funderId}`);

      const mv = await prisma.manualVersion.create({
        data: {
          manualId: manual.id,
          version,
          effectiveDate: effectiveDateRaw ? new Date(effectiveDateRaw) : null,
          fileUrl: url,
          fileName: pathname,
        },
      });

      const result = await ingestPdf(bytes, {
        funderId,
        docTitle: `${manual.title} (v. ${version})`,
        manualVersionId: mv.id,
      });

      await prisma.manualVersion.update({
        where: { id: mv.id },
        data: { indexed: result.chunks > 0 },
      });

      await logAudit({
        userId: admin.id,
        action: "CREATE",
        entity: "ManualVersion",
        entityId: mv.id,
        details: `${funder.name} · ${manual.title} v.${version} · ${result.chunks} trechos`,
      });

      return NextResponse.json({
        ok: true,
        kind,
        manualId: manual.id,
        manualVersionId: mv.id,
        ...result,
      });
    }

    if (kind === "documento") {
      const title = String(form.get("title") ?? "").trim();
      const type = (String(form.get("type") ?? "OUTRO") as DocType) || "OUTRO";
      if (!title) {
        return NextResponse.json(
          { ok: false, error: "Informe o título do documento." },
          { status: 400 },
        );
      }

      const { url, pathname } = await uploadPdf(file, `documentos/${funderId}`);

      const doc = await prisma.document.create({
        data: { funderId, title, type, fileUrl: url, fileName: pathname },
      });

      const result = await ingestPdf(bytes, {
        funderId,
        docTitle: title,
        documentId: doc.id,
      });

      await prisma.document.update({
        where: { id: doc.id },
        data: { indexed: result.chunks > 0 },
      });

      await logAudit({
        userId: admin.id,
        action: "CREATE",
        entity: "Document",
        entityId: doc.id,
        details: `${funder.name} · ${title} · ${result.chunks} trechos`,
      });

      return NextResponse.json({ ok: true, kind, documentId: doc.id, ...result });
    }

    return NextResponse.json(
      { ok: false, error: "Tipo de ingestão inválido." },
      { status: 400 },
    );
  } catch (err) {
    console.error("[ingest] erro:", err);
    const msg =
      err instanceof Error && err.message.includes("VOYAGE_API_KEY")
        ? "Serviço de embeddings não configurado (VOYAGE_API_KEY)."
        : "Falha ao processar o documento. Tente novamente.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
