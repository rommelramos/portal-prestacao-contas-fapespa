"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(2, "Informe o nome (mínimo 2 caracteres)."),
  description: z.string().trim().max(2000).optional(),
  institutionalInfo: z.string().trim().max(5000).optional(),
  active: z.boolean(),
});

export type FunderFormState =
  | { error?: string; fieldErrors?: Record<string, string> }
  | undefined;

const emptyToNull = (v?: string) => (v && v.length > 0 ? v : null);

/** Cria (sem id) ou edita (com id) um financiador. */
export async function saveFunder(
  _prev: FunderFormState,
  formData: FormData,
): Promise<FunderFormState> {
  const admin = await requireAdmin();

  const id = (formData.get("id") as string) || "";
  const parsed = schema.safeParse({
    name: formData.get("name") ?? "",
    description: (formData.get("description") as string) ?? "",
    institutionalInfo: (formData.get("institutionalInfo") as string) ?? "",
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const data = {
    name: parsed.data.name,
    description: emptyToNull(parsed.data.description),
    institutionalInfo: emptyToNull(parsed.data.institutionalInfo),
    active: parsed.data.active,
  };

  try {
    if (id) {
      const funder = await prisma.funder.update({ where: { id }, data });
      await logAudit({
        userId: admin.id,
        action: "UPDATE",
        entity: "Funder",
        entityId: funder.id,
        details: funder.name,
      });
    } else {
      const funder = await prisma.funder.create({ data });
      await logAudit({
        userId: admin.id,
        action: "CREATE",
        entity: "Funder",
        entityId: funder.id,
        details: funder.name,
      });
    }
  } catch (err) {
    console.error("[funders] erro ao salvar:", err);
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/admin/financiadores");
  redirect("/admin/financiadores");
}

/** Alterna ativo/inativo (RF007). Chamado direto de um <form> na listagem. */
export async function toggleFunderActive(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;

  const current = await prisma.funder.findUnique({ where: { id } });
  if (!current) return;

  const funder = await prisma.funder.update({
    where: { id },
    data: { active: !current.active },
  });

  await logAudit({
    userId: admin.id,
    action: funder.active ? "ACTIVATE" : "DEACTIVATE",
    entity: "Funder",
    entityId: funder.id,
    details: funder.name,
  });

  revalidatePath("/admin/financiadores");
}
