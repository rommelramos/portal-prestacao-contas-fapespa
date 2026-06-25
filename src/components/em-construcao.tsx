export function EmConstrucao({
  titulo,
  descricao,
  requisitos,
}: {
  titulo: string;
  descricao: string;
  requisitos?: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        <p className="text-sm text-muted">{descricao}</p>
      </div>
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm font-medium">Módulo em construção</p>
        <p className="mt-1 text-sm text-muted">
          Será implementado nas próximas etapas da fundação.
        </p>
        {requisitos && requisitos.length > 0 && (
          <ul className="mx-auto mt-4 inline-block list-inside list-disc text-left text-sm text-muted">
            {requisitos.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
