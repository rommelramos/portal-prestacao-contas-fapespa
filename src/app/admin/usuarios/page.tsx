import Link from "next/link";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleUserActive } from "@/lib/actions/users";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; role?: string; status?: string }>;

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const meId = session!.user.id;
  const { q = "", role = "all", status = "all" } = await searchParams;

  const where: Prisma.UserWhereInput = {};
  if (q.trim()) {
    where.OR = [
      { name: { contains: q.trim() } },
      { email: { contains: q.trim() } },
    ];
  }
  if (role === "ADMIN" || role === "USER") where.role = role;
  if (status === "active") where.active = true;
  if (status === "inactive") where.active = false;

  const users = await prisma.user.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted">
            Gestão de usuários e perfis de acesso (RF014–RF017).
          </p>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
        >
          + Novo usuário
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="q" className="text-xs font-medium text-muted">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Nome ou e-mail"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="role" className="text-xs font-medium text-muted">
            Perfil
          </label>
          <select
            id="role"
            name="role"
            defaultValue={role}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="ADMIN">Administrador</option>
            <option value="USER">Usuário</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="status" className="text-xs font-medium text-muted">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
        <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent">
          Filtrar
        </button>
        {(q || role !== "all" || status !== "all") && (
          <Link
            href="/admin/usuarios"
            className="px-2 py-2 text-sm text-muted underline-offset-2 hover:underline"
          >
            Limpar
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-accent/40 text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">
                  {u.name}
                  {u.id === meId && (
                    <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted">
                      você
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  {u.role === "ADMIN" ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Administrador
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      Usuário
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.active ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Ativo
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/usuarios/${u.id}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
                    >
                      Editar
                    </Link>
                    {u.id !== meId && (
                      <form action={toggleUserActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-accent">
                          {u.active ? "Inativar" : "Ativar"}
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
