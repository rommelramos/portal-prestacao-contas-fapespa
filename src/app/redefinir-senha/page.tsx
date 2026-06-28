import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight">
          Redefinir senha
        </h1>
        <p className="mb-6 text-center text-sm text-muted">
          Escolha uma nova senha de acesso.
        </p>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-danger">
              Link inválido. Solicite uma nova redefinição.
            </p>
            <Link
              href="/recuperar-senha"
              className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
            >
              Recuperar senha
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
