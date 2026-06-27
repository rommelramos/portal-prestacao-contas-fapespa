import Link from "next/link";
import { UserForm } from "@/components/user-form";

export default function NovoUsuarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/usuarios" className="text-sm text-muted hover:underline">
          ← Usuários
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Novo usuário
        </h1>
        <p className="text-sm text-muted">Cadastro de usuário (RF014).</p>
      </div>
      <UserForm />
    </div>
  );
}
