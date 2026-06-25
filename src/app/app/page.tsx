import Link from "next/link";

export default function UserHome() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl">
        💬
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Consulte as regras de prestação de contas
        </h1>
        <p className="mx-auto max-w-xl text-muted">
          Tire dúvidas em linguagem natural sobre como utilizar os recursos do
          seu projeto. As respostas são baseadas exclusivamente no manual do
          financiador selecionado.
        </p>
      </div>

      <Link
        href="/app/chat"
        className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
      >
        Iniciar nova consulta
      </Link>

      <p className="text-xs text-muted">
        Ao iniciar, você escolherá o financiador e a versão do manual (RF018,
        RF019).
      </p>
    </div>
  );
}
