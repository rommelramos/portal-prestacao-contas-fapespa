import { EmConstrucao } from "@/components/em-construcao";

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 p-6">
      <EmConstrucao
        titulo="Chatbot de Consulta"
        descricao="Seleção de financiador/versão e conversa com a IA (Claude)."
        requisitos={[
          "RF018 — Seleção obrigatória de financiador",
          "RF019 — Seleção de versão do manual",
          "RF021 — Consulta conversacional via IA",
          "RF022 — Indicação de fonte",
          "RF020 — Emissão de parecer (PDF)",
        ]}
      />
    </div>
  );
}
