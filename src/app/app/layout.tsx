import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <Link href="/app" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            PC
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold leading-tight">
              Portal de Manuais de Prestação de Contas
            </p>
            <p className="text-xs text-muted">ISACI</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/app/historico"
            className="text-sm font-medium text-muted transition hover:text-foreground"
          >
            Histórico
          </Link>
          <span className="hidden text-sm text-muted sm:inline">
            {session.user.name}
          </span>
          <SignOutButton />
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
