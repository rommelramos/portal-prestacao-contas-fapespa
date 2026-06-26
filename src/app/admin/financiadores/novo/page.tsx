import Link from "next/link";
import { FunderForm } from "@/components/funder-form";

export default function NovoFinanciadorPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/financiadores"
          className="text-sm text-muted hover:underline"
        >
          ← Financiadores
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Novo financiador
        </h1>
        <p className="text-sm text-muted">Cadastro de financiador (RF005).</p>
      </div>
      <FunderForm />
    </div>
  );
}
