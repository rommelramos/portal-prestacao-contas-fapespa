"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

const PATH = "/admin/manuais";

export async function toggleManualVersionActive(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const cur = await prisma.manualVersion.findUnique({ where: { id } });
  if (!cur) return;
  const mv = await prisma.manualVersion.update({
    where: { id },
    data: { active: !cur.active },
  });
  await logAudit({
    userId: admin.id,
    action: mv.active ? "ACTIVATE" : "DEACTIVATE",
    entity: "ManualVersion",
    entityId: id,
    details: `v.${mv.version}`,
  });
  revalidatePath(PATH);
}

export async function deleteManualVersion(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  // Os KnowledgeChunk vinculados são removidos por cascade (schema).
  const mv = await prisma.manualVersion.delete({ where: { id } });
  await logAudit({
    userId: admin.id,
    action: "DELETE",
    entity: "ManualVersion",
    entityId: id,
    details: `v.${mv.version}`,
  });
  revalidatePath(PATH);
}

export async function deleteManual(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const m = await prisma.manual.delete({ where: { id } });
  await logAudit({
    userId: admin.id,
    action: "DELETE",
    entity: "Manual",
    entityId: id,
    details: m.title,
  });
  revalidatePath(PATH);
}

export async function toggleDocumentActive(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const cur = await prisma.document.findUnique({ where: { id } });
  if (!cur) return;
  const doc = await prisma.document.update({
    where: { id },
    data: { active: !cur.active },
  });
  await logAudit({
    userId: admin.id,
    action: doc.active ? "ACTIVATE" : "DEACTIVATE",
    entity: "Document",
    entityId: id,
    details: doc.title,
  });
  revalidatePath(PATH);
}

export async function deleteDocument(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const doc = await prisma.document.delete({ where: { id } });
  await logAudit({
    userId: admin.id,
    action: "DELETE",
    entity: "Document",
    entityId: id,
    details: doc.title,
  });
  revalidatePath(PATH);
}
