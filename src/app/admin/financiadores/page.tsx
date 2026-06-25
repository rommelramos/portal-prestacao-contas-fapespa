import { EmConstrucao } from "@/components/em-construcao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Financiadores"
      descricao="Cadastro e gestão dos financiadores (FAPESPA e demais)."
      requisitos={[
        "RF005 — Cadastro de financiador",
        "RF006 — Edição",
        "RF007 — Ativação/Inativação",
        "RF008 — Listagem com filtros",
      ]}
    />
  );
}
