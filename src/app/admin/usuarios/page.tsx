import { EmConstrucao } from "@/components/em-construcao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Usuários"
      descricao="Cadastro e gestão de usuários e perfis de acesso."
      requisitos={[
        "RF014 — Cadastro de usuário",
        "RF015 — Edição",
        "RF016 — Ativação/Inativação",
        "RF017 — Listagem com filtros",
      ]}
    />
  );
}
