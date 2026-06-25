import { prisma } from "@/lib/prisma";

async function getStats() {
  try {
    const [users, funders, manuals, sessions] = await Promise.all([
      prisma.user.count(),
      prisma.funder.count(),
      prisma.manualVersion.count(),
      prisma.chatSession.count(),
    ]);
    return { users, funders, manuals, sessions, ok: true as const };
  } catch {
    return { users: 0, funders: 0, manuals: 0, sessions: 0, ok: false as const };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Usuários", value: stats.users },
    { label: "Financiadores", value: stats.funders },
    { label: "Versões de manuais", value: stats.manuals },
    { label: "Consultas realizadas", value: stats.sessions },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="text-sm text-muted">
          Visão geral do uso do portal (RF028).
        </p>
      </div>

      {!stats.ok && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Banco de dados ainda não acessível. Verifique as credenciais e a
          liberação de acesso remoto (Remote MySQL) no HostGator.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Próximos módulos</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted">
          <li>Gestão de Financiadores (RF005–RF008)</li>
          <li>Gestão de Manuais com versionamento (RF009–RF013)</li>
          <li>Gestão de Usuários (RF014–RF017)</li>
          <li>Indexação da base de conhecimento da IA (RF013)</li>
        </ul>
      </div>
    </div>
  );
}
