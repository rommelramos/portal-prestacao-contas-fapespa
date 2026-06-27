import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserForm } from "@/components/user-form";

export const dynamic = "force-dynamic";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/usuarios" className="text-sm text-muted hover:underline">
          ← Usuários
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Editar usuário
        </h1>
        <p className="text-sm text-muted">Edição de usuário (RF015).</p>
      </div>
      <UserForm
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        }}
        isSelf={session!.user.id === user.id}
      />
    </div>
  );
}
