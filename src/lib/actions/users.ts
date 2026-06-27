"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";

const baseSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome (mínimo 2 caracteres)."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  role: z.enum(["ADMIN", "USER"]),
  active: z.boolean(),
  password: z
    .string()
    .min(6, "A senha deve ter ao menos 6 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type UserFormState =
  | { error?: string; fieldErrors?: Record<string, string> }
  | undefined;

export async function saveUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const admin = await requireAdmin();
  const id = (formData.get("id") as string) || "";

  const parsed = baseSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    role: formData.get("role") ?? "USER",
    active: formData.get("active") === "on" || formData.get("active") === "true",
    password: (formData.get("password") as string) ?? "",
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

  const data = parsed.data;
  const password = data.password && data.password.length > 0 ? data.password : null;

  // Trava de auto-proteção: o admin não pode rebaixar nem inativar a si mesmo.
  if (id && id === admin.id) {
    if (data.role !== "ADMIN") {
      return { error: "Você não pode remover o seu próprio perfil de administrador." };
    }
    if (!data.active) {
      return { error: "Você não pode inativar a si mesmo." };
    }
  }

  try {
    if (id) {
      await prisma.user.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          role: data.role,
          active: data.active,
          ...(password ? { passwordHash: await hashPassword(password) } : {}),
        },
      });
      await logAudit({
        userId: admin.id,
        action: "UPDATE",
        entity: "User",
        entityId: id,
        details: data.email,
      });
    } else {
      if (!password) {
        return { fieldErrors: { password: "Defina uma senha inicial." } };
      }
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          role: data.role,
          active: data.active,
          passwordHash: await hashPassword(password),
        },
      });
      await logAudit({
        userId: admin.id,
        action: "CREATE",
        entity: "User",
        entityId: user.id,
        details: data.email,
      });
    }
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { fieldErrors: { email: "Já existe um usuário com este e-mail." } };
    }
    console.error("[users] erro ao salvar:", err);
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function toggleUserActive(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = formData.get("id") as string;
  if (!id || id === admin.id) return; // não pode inativar a si mesmo

  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) return;

  const user = await prisma.user.update({
    where: { id },
    data: { active: !current.active },
  });
  await logAudit({
    userId: admin.id,
    action: user.active ? "ACTIVATE" : "DEACTIVATE",
    entity: "User",
    entityId: id,
    details: user.email,
  });
  revalidatePath("/admin/usuarios");
}
