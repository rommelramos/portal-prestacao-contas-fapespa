"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveUser, type UserFormState } from "@/lib/actions/users";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  active: boolean;
};

export function UserForm({
  user,
  isSelf = false,
}: {
  user?: UserData;
  isSelf?: boolean;
}) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    saveUser,
    undefined,
  );

  const err = (f: string) => state?.fieldErrors?.[f];
  const inputCls =
    "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {user && <input type="hidden" name="id" value={user.id} />}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nome <span className="text-danger">*</span>
        </label>
        <input
          id="name"
          name="name"
          defaultValue={user?.name ?? ""}
          required
          className={inputCls}
        />
        {err("name") && <p className="text-sm text-danger">{err("name")}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail <span className="text-danger">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={user?.email ?? ""}
          required
          className={inputCls}
        />
        {err("email") && <p className="text-sm text-danger">{err("email")}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="role" className="text-sm font-medium">
            Perfil
          </label>
          <select
            id="role"
            name="role"
            defaultValue={user?.role ?? "USER"}
            disabled={isSelf}
            className={inputCls}
          >
            <option value="USER">Usuário</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status</label>
          <label className="flex h-[42px] items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={user ? user.active : true}
              disabled={isSelf}
              className="h-4 w-4 rounded border-border"
            />
            Ativo
          </label>
        </div>
      </div>

      {isSelf && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Você está editando sua própria conta — não é possível alterar o
          próprio perfil ou status.
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Senha {user ? "" : <span className="text-danger">*</span>}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={user ? "Deixe em branco para manter a atual" : "Senha inicial"}
          className={inputCls}
        />
        {err("password") && (
          <p className="text-sm text-danger">{err("password")}</p>
        )}
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Salvando…" : user ? "Salvar alterações" : "Cadastrar"}
        </button>
        <Link
          href="/admin/usuarios"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
