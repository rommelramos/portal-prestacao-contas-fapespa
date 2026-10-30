import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { ingestPdf } from "@/lib/rag/ingest";

export const maxDuration = 300;

type DocType = "ORIENTACAO" | "NORMA" | "RESOLUCAO" | "COMUNICADO" | "OUTRO";
const DOC_TYPES: DocType[] = ["ORIENTACAO", "NORMA", "RESOLUCAO", "COMUNICADO", "OUTRO"];

type FileDecision = { suggestionFileId: string; title: string; type?: string };

// Aprovação de uma sugestão: o admin escolhe os financiadores (existentes
// e/ou cria um novo com o nome sugerido) e, para cada arquivo anexado, um
// título/tipo. Cada arquivo vira um Document vinculado a TODOS os
// financiadores escolhidos e é indexado na base de conhecimento.
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = (await req.json()) as {
      suggestionId?: string;
      newFunderName?: string;
      funderIds?: string[];
      files?: FileDecision[];
    };

    const suggestionId = String(body.suggestionId ?? "");
    if (!suggestionId) {
      return NextResponse.json({ ok: false, error: "Sugestão ausente." }, { status: 400 });
    }

    const suggestion = await prisma.documentSuggestion.findUnique({
      where: { id: suggestionId },
      include: { files: true },
    });
    if (!suggestion) {
      return NextResponse.json(
        { ok: false, error: "Sugestão não encontrada." },
        { status: 404 },
      );
    }
    if (suggestion.status !== "PENDING") {
      return NextResponse.json(
        { ok: false, error: "Esta sugestão já foi revisada." },
        { status: 409 },
      );
    }

    // Monta o conjunto de financiadores: existentes + (opcional) um novo.
    const funderIds = new Set<string>();
    const existingIds = (body.funderIds ?? []).map((s) => String(s)).filter(Boolean);
    if (existingIds.length > 0) {
      const found = await prisma.funder.findMany({
        where: { id: { in: existingIds } },
        select: { id: true },
      });
      for (const f of found) funderIds.add(f.id);
    }

    const newFunderName = String(body.newFunderName ?? "").trim();
    if (newFunderName) {
      const created = await prisma.funder.create({ data: { name: newFunderName } });
      funderIds.add(created.id);
      await logAudit({
        userId: admin.id,
        action: "CREATE",
        entity: "Funder",
        entityId: created.id,
        details: `${created.name} (via sugestão)`,
      });
    }

    if (funderIds.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Escolha ao menos um financiador (existente ou novo)." },
        { status: 400 },
      );
    }

    const funderIdList = [...funderIds];
    const originFunderId = funderIdList[0];

    // Decisões por arquivo (título/tipo). Só processa arquivos informados.
    const decisions = body.files ?? [];
    if (decisions.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nenhum arquivo selecionado para aprovar." },
        { status: 400 },
      );
    }

    const created: { documentId: string; title: string; chunks: number }[] = [];

    for (const dec of decisions) {
      const sf = suggestion.files.find((f) => f.id === dec.suggestionFileId);
      if (!sf) continue;

      const title = String(dec.title ?? "").trim();
      if (!title) {
        return NextResponse.json(
          { ok: false, error: "Informe um título para cada arquivo aprovado." },
          { status: 400 },
        );
      }
      const type: DocType = DOC_TYPES.includes(dec.type as DocType)
        ? (dec.type as DocType)
        : "OUTRO";

      const resp = await fetch(sf.fileUrl);
      if (!resp.ok) {
        return NextResponse.json(
          { ok: false, error: `Não foi possível baixar o arquivo "${sf.fileName}".` },
          { status: 502 },
        );
      }
      const bytes = new Uint8Array(await resp.arrayBuffer());

      const doc = await prisma.document.create({
        data: {
          funderId: originFunderId,
          title,
          type,
          // Reaproveita o arquivo que o usuário já enviou ao Blob.
          fileUrl: sf.fileUrl,
          fileName: sf.fileName,
          funders: { create: funderIdList.map((fid) => ({ funderId: fid })) },
        },
      });

      const result = await ingestPdf(bytes, {
        funderId: originFunderId,
        docTitle: title,
        documentId: doc.id,
      });
      await prisma.document.update({
        where: { id: doc.id },
        data: { indexed: result.chunks > 0 },
      });
      await prisma.suggestionFile.update({
        where: { id: sf.id },
        data: { documentId: doc.id },
      });

      created.push({ documentId: doc.id, title, chunks: result.chunks });
    }

    await prisma.documentSuggestion.update({
      where: { id: suggestion.id },
      data: {
        status: "APPROVED",
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    await logAudit({
      userId: admin.id,
      action: "UPDATE",
      entity: "DocumentSuggestion",
      entityId: suggestion.id,
      details: `aprovada · ${created.length} documento(s) · ${funderIdList.length} financiador(es)`,
    });

    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error("[sugestoes/aprovar] erro:", err);
    const msg =
      err instanceof Error && /429|rate/i.test(err.message)
        ? "Limite do serviço de embeddings atingido. Tente novamente em instantes."
        : "Falha ao aprovar a sugestão. Tente novamente.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
