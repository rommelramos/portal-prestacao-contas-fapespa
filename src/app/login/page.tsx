"use client";

import { useActionState } from "react";
import { authenticate, type LoginState } from "@/lib/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    authenticate,
    undefined,
  );

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
            PC
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Portal de Prestação de Contas
          </h1>
          <p className="mt-1 text-sm text-muted">FAPESPA · ISACI</p>
        </div>

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

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
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
            {pending ? "Entrando…" : "Entrar"}
          </button>

          <p className="text-center text-xs text-muted">
            Acesso restrito a colaboradores autorizados do ISACI.
          </p>
        </form>
      </div>
    </main>
  );
}
