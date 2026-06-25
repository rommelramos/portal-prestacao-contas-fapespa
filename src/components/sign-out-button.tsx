"use client";

import { doSignOut } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <form action={doSignOut}>
      <button
        type="submit"
        className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent"
      >
        Sair
      </button>
    </form>
  );
}
