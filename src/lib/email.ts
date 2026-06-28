import nodemailer from "nodemailer";

/**
 * Envia e-mail via SMTP (ex.: servidor de e-mail do HostGator).
 * Configurar no ambiente: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 * SMTP_FROM e SMTP_SECURE ("true" para porta 465).
 * Sem SMTP_HOST configurado, o conteúdo é apenas registrado no log (fallback).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean }> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(
      `[email] SMTP não configurado — e-mail não enviado.\nPara: ${opts.to}\nAssunto: ${opts.subject}\n${opts.html}`,
    );
    return { sent: false };
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  const transporter = nodemailer.createTransport({
    host,
    port,
    // 465 = SSL; 587/25 = STARTTLS.
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  return { sent: true };
}
