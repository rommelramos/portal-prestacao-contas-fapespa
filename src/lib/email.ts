import { Resend } from "resend";

/**
 * Envia um e-mail via Resend. Se RESEND_API_KEY não estiver configurada,
 * registra o conteúdo no log (fallback para desenvolvimento/teste).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM ??
    "Portal de Prestação de Contas <onboarding@resend.dev>";

  if (!key) {
    console.log(
      `[email] RESEND_API_KEY ausente — e-mail não enviado.\nPara: ${opts.to}\nAssunto: ${opts.subject}\n${opts.html}`,
    );
    return { sent: false };
  }

  const resend = new Resend(key);
  await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  return { sent: true };
}
