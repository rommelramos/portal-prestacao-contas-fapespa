import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadPdf } from "@/lib/blob";

export const maxDuration = 60;

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB por arquivo
const MAX_FILES = 5;

// Envio de sugestão de documento por um usuário (sem permissão de cadastro):
// indica o financiador (existente ou um nome novo), anexa 1+ arquivos e
// descreve o conteúdo. Nada é indexado aqui — só fica pendente para o admin
// revisar e aprovar.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
    }

    const form = await req.formData();
    const funderId = String(form.get("funderId") ?? "").trim();
    const suggestedFunderName = String(form.get("suggestedFunderName") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);

    if (!funderId && !suggestedFunderName) {
      return NextResponse.json(
        { ok: false, error: "Escolha um financiador ou informe o nome de um novo." },
        { status: 400 },
      );
    }
    if (description.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Descreva o conteúdo do(s) documento(s) (mín. 10 caracteres)." },
        { status: 400 },
      );
    }
    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Anexe pelo menos um arquivo PDF." },
        { status: 400 },
      );
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { ok: false, error: `Anexe no máximo ${MAX_FILES} arquivos por sugestão.` },
        { status: 400 },
      );
    }
    for (const f of files) {
      if (f.type && f.type !== "application/pdf") {
        return NextResponse.json(
          { ok: false, error: `"${f.name}" não é um PDF.` },
          { status: 400 },
        );
      }
      if (f.size > MAX_BYTES) {
        return NextResponse.json(
          { ok: false, error: `"${f.name}" excede 20 MB.` },
          { status: 400 },
        );
      }
    }

    // Se escolheu um financiador existente, valida que ele existe e está ativo.
    let validFunderId: string | null = null;
    if (funderId) {
      const funder = await prisma.funder.findUnique({ where: { id: funderId } });
      if (!funder || !funder.active) {
        return NextResponse.json(
          { ok: false, error: "Financiador indisponível." },
          { status: 404 },
        );
      }
      validFunderId = funder.id;
    }

    // Sobe os arquivos para o Blob antes de gravar.
    const uploaded = [];
    for (const f of files) {
      const { url, pathname } = await uploadPdf(f, `sugestoes/${session.user.id}`);
      uploaded.push({ fileUrl: url, fileName: pathname, size: f.size });
    }

    const suggestion = await prisma.documentSuggestion.create({
      data: {
        userId: session.user.id,
        funderId: validFunderId,
        // Só guarda o nome sugerido quando não escolheu um financiador existente.
        suggestedFunderName: validFunderId ? null : suggestedFunderName,
        description,
        files: { create: uploaded },
      },
    });

    return NextResponse.json({ ok: true, id: suggestion.id });
  } catch (err) {
    console.error("[sugestoes] erro:", err);
    return NextResponse.json(
      { ok: false, error: "Falha ao enviar a sugestão. Tente novamente." },
      { status: 500 },
    );
  }
}
