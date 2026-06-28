"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  model: z.enum(["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"]),
  effort: z.enum(["low", "medium", "high", "xhigh", "max"]),
  tone: z.enum(["formal", "didatico", "conciso", "detalhado"]),
  promptBase: z.string().trim().min(10, "Descreva o prompt base (mín. 10 caracteres)."),
  topK: z.coerce.number().int().min(1, "Mínimo 1.").max(30, "Máximo 30."),
  similarityThreshold: z.coerce
    .number()
    .min(0, "Mínimo 0.")
    .max(1, "Máximo 1."),
});

export type SettingsFormState =
  | { ok?: boolean; error?: string; fieldErrors?: Record<string, string> }
  | undefined;

export async function saveSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse({
    model: formData.get("model"),
    effort: formData.get("effort"),
    tone: formData.get("tone"),
    promptBase: formData.get("promptBase") ?? "",
    topK: formData.get("topK"),
    similarityThreshold: formData.get("similarityThreshold"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  try {
    await prisma.setting.upsert({
      where: { id: "global" },
      update: { ...data, updatedById: admin.id },
      create: { id: "global", ...data, updatedById: admin.id },
    });
    await logAudit({
      userId: admin.id,
      action: "UPDATE",
      entity: "Setting",
      entityId: "global",
      details: `modelo=${data.model} effort=${data.effort} topK=${data.topK} limiar=${data.similarityThreshold}`,
    });
  } catch (err) {
    console.error("[settings] erro ao salvar:", err);
    return { error: "Não foi possível salvar. Verifique se a tabela de configurações foi criada." };
  }

  revalidatePath("/admin/configuracoes");
  return { ok: true };
}
