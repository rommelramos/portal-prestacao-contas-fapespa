"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveFunder, type FunderFormState } from "@/lib/actions/funders";

type Funder = {
  id: string;
  name: string;
  description: string | null;
  institutionalInfo: string | null;
  active: boolean;
};

export function FunderForm({ funder }: { funder?: Funder }) {
  const [state, formAction, pending] = useActionState<FunderFormState, FormData>(
    saveFunder,
    undefined,
  );

  const err = (field: string) => state?.fieldErrors?.[field];

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {funder && <input type="hidden" name="id" value={funder.id} />}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nome <span className="text-danger">*</span>
        </label>
        <input
          id="name"
          name="name"
          defaultValue={funder?.name ?? ""}
          required
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder="Ex.: FAPESPA — Fundação Amazônia de Amparo a Estudos e Pesquisas"
        />
        {err("name") && <p className="text-sm text-danger">{err("name")}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={funder?.description ?? ""}
          rows={3}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder="Breve descrição do financiador."
        />
        {err("description") && (
          <p className="text-sm text-danger">{err("description")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="institutionalInfo" className="text-sm font-medium">
          Informações institucionais
        </label>
        <textarea
          id="institutionalInfo"
          name="institutionalInfo"
          defaultValue={funder?.institutionalInfo ?? ""}
          rows={5}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder="Contatos, site, observações, etc."
        />
        {err("institutionalInfo") && (
          <p className="text-sm text-danger">{err("institutionalInfo")}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={funder ? funder.active : true}
          className="h-4 w-4 rounded border-border"
        />
        Ativo (visível para os usuários no chatbot)
      </label>

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
          {pending ? "Salvando…" : funder ? "Salvar alterações" : "Cadastrar"}
        </button>
        <Link
          href="/admin/financiadores"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
