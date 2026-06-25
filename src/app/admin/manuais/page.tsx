import { EmConstrucao } from "@/components/em-construcao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Manuais & Documentos"
      descricao="Upload, versionamento e indexação da base de conhecimento."
      requisitos={[
        "RF009 — Upload de manual (PDF)",
        "RF010 — Versionamento",
        "RF011 — Documentos complementares",
        "RF012 — Exclusão/Inativação",
        "RF013 — Indexação na IA",
      ]}
    />
  );
}
