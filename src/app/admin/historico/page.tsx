import { EmConstrucao } from "@/components/em-construcao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Histórico Global"
      descricao="Consultas de todos os usuários para auditoria e monitoramento."
      requisitos={["RF029 — Acesso ao histórico global", "RNF009 — Auditoria"]}
    />
  );
}
