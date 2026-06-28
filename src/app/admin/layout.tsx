import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

const NAV = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/financiadores", label: "Financiadores" },
  { href: "/admin/manuais", label: "Manuais & Documentos" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/historico", label: "Histórico Global" },
  { href: "/admin/configuracoes", label: "Configurações da IA" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/app");

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-2 border-b border-border px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            PC
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold leading-tight">
              Portal de Manuais de Prestação de Contas
            </p>
            <p className="text-xs text-muted">Administração</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
          <p className="text-sm text-muted md:hidden">
            Portal de Manuais de Prestação de Contas · Admin
          </p>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted">{session.user.name}</span>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
