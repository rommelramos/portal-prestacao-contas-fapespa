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

// Define quais financiadores um documento/legislação atende (relação N:N).
// Usado quando o mesmo documento serve a 2+ financiadores — a consulta do
// chatbot passa a recuperá-lo na base de cada um deles. Reescreve o conjunto
// de vínculos; exige ao menos um financiador e mantém `Document.funderId`
// (origem) sempre dentro do conjunto.
export async function setDocumentFunders(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const documentId = String(formData.get("documentId") ?? "");
  if (!documentId) return;

  const funderIds = Array.from(
    new Set(formData.getAll("funderIds").map((v) => String(v)).filter(Boolean)),
  );
  if (funderIds.length === 0) return; // precisa de ao menos um

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return;

  // Só financiadores que existem de fato.
  const valid = await prisma.funder.findMany({
    where: { id: { in: funderIds } },
    select: { id: true },
  });
  const validIds = valid.map((f) => f.id);
  if (validIds.length === 0) return;

  // A origem (Document.funderId) precisa continuar entre os vínculos; se o
  // admin a removeu, adota o primeiro selecionado como nova origem.
  const originId = validIds.includes(doc.funderId) ? doc.funderId : validIds[0];

  await prisma.$transaction([
    prisma.documentFunder.deleteMany({ where: { documentId } }),
    prisma.documentFunder.createMany({
      data: validIds.map((fid) => ({ documentId, funderId: fid })),
    }),
    prisma.document.update({ where: { id: documentId }, data: { funderId: originId } }),
  ]);

  await logAudit({
    userId: admin.id,
    action: "UPDATE",
    entity: "Document",
    entityId: documentId,
    details: `financiadores: ${validIds.length}`,
  });
  revalidatePath(PATH);
}
