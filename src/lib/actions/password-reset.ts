"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signResetToken, verifyResetToken } from "@/lib/reset-token";
import { sendEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

export type RequestState = { ok?: boolean; error?: string } | undefined;

export async function requestPasswordReset(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  if (!email) return { error: "Informe o e-mail." };

  const user = await prisma.user.findUnique({ where: { email } });

  // Só envia se o usuário existir e estiver ativo — mas a resposta é sempre
  // genérica, para não revelar quais e-mails estão cadastrados.
  if (user && user.active) {
    const token = await signResetToken(user.id);
    const base =
      process.env.AUTH_URL ?? `https://${(await headers()).get("host")}`;
    const link = `${base}/redefinir-senha?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Redefinição de senha — Portal de Prestação de Contas",
      html: `<p>Olá, ${user.name}.</p>
<p>Recebemos uma solicitação para redefinir a sua senha. Clique no link abaixo (válido por 1 hora):</p>
<p><a href="${link}">${link}</a></p>
<p>Se você não solicitou, ignore este e-mail.</p>`,
    });
  }

  return { ok: true };
}

export type ResetState = { error?: string } | undefined;

export async function resetPassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) {
    return { error: "A senha deve ter ao menos 6 caracteres." };
  }
  if (password !== confirm) {
    return { error: "As senhas não coincidem." };
  }

  const userId = await verifyResetToken(token);
  if (!userId) {
    return { error: "Link inválido ou expirado. Solicite uma nova redefinição." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(password) },
    });
    await logAudit({
      userId,
      action: "UPDATE",
      entity: "User",
      entityId: userId,
      details: "redefinição de senha via e-mail",
    });
  } catch {
    return { error: "Não foi possível redefinir a senha. Tente novamente." };
  }

  redirect("/login?reset=ok");
}
