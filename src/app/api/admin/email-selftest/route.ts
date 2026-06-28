import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Teste TEMPORÁRIO de envio de e-mail via SMTP, a partir do Vercel.
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }
  const to = req.nextUrl.searchParams.get("to") || process.env.SMTP_USER || "";
  try {
    const r = await sendEmail({
      to,
      subject: "Teste de SMTP — Portal de Prestação de Contas",
      html: "<p>Este é um e-mail de teste do portal. Se você recebeu, o envio por SMTP está funcionando corretamente.</p>",
    });
    return NextResponse.json({ ok: true, to, sent: r.sent });
  } catch (err) {
    return NextResponse.json(
      { ok: false, to, error: (err as Error)?.message?.slice(0, 400) },
      { status: 500 },
    );
  }
}
