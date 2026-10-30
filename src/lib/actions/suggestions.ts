"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

// Admin recusa uma sugestão pendente, com observação (motivo).
export async function rejectSuggestion(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();
  if (!id) return;

  const cur = await prisma.documentSuggestion.findUnique({ where: { id } });
  if (!cur || cur.status !== "PENDING") return;

  await prisma.documentSuggestion.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewNote: note || null,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });
  await logAudit({
    userId: admin.id,
    action: "UPDATE",
    entity: "DocumentSuggestion",
    entityId: id,
    details: `recusada${note ? ` · ${note.slice(0, 120)}` : ""}`,
  });
  revalidatePath("/admin/sugestoes");
  revalidatePath(`/admin/sugestoes/${id}`);
}

// Usuário exclui a própria sugestão enquanto ainda está pendente.
export async function deleteOwnSuggestion(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const cur = await prisma.documentSuggestion.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!cur || cur.status !== "PENDING") return;

  // Os SuggestionFile vinculados são removidos por cascade (schema).
  await prisma.documentSuggestion.delete({ where: { id } });
  revalidatePath("/app/sugestoes");
}
