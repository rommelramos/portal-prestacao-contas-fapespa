import { EmConstrucao } from "@/components/em-construcao";

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 p-6">
      <EmConstrucao
        titulo="Histórico de Consultas"
        descricao="Suas conversas anteriores, por financiador e período."
        requisitos={[
          "RF024 — Registro automático",
          "RF025 — Listagem do histórico",
          "RF026 — Revisão de consulta",
          "RF027 — Filtros",
        ]}
      />
    </div>
  );
}
