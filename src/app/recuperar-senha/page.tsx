"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordReset,
  type RequestState,
} from "@/lib/actions/password-reset";

export default function RecuperarSenhaPage() {
  const [state, formAction, pending] = useActionState<RequestState, FormData>(
    requestPasswordReset,
    undefined,
  );

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight">
          Recuperar senha
        </h1>
        <p className="mb-6 text-center text-sm text-muted">
          Informe seu e-mail para receber o link de redefinição.
        </p>

        {state?.ok ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm">
              Se houver uma conta com esse e-mail, enviamos um link de
              redefinição. Verifique sua caixa de entrada (e o spam).
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form
            action={formAction}
            className="space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm"
          >
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {state?.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Enviar link de redefinição"}
            </button>

            <p className="text-center text-sm">
              <Link href="/login" className="text-muted hover:underline">
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
