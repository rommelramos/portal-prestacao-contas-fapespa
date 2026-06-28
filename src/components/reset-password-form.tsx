"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword, type ResetState } from "@/lib/actions/password-reset";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    resetPassword,
    undefined,
  );

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm"
    >
      <input type="hidden" name="token" value={token} />

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className={inputCls}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-sm font-medium">
          Confirmar nova senha
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className={inputCls}
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
        {pending ? "Salvando…" : "Redefinir senha"}
      </button>

      <p className="text-center text-sm">
        <Link href="/login" className="text-muted hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
