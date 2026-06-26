import { prisma } from "@/lib/prisma";

type AuditInput = {
  userId?: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "ACTIVATE" | "DEACTIVATE";
  entity: string;
  entityId?: string | null;
  details?: string | null;
};

/**
 * Registra uma ação administrativa relevante (RNF009). Falhas de log não
 * devem quebrar a operação principal — apenas registramos no console.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        details: input.details ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] falha ao registrar log:", err);
  }
}
