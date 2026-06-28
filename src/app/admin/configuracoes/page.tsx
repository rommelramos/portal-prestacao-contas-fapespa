import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const s = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Configurações da IA
        </h1>
        <p className="text-sm text-muted">
          Parâmetros globais que personalizam as respostas do chatbot e dos
          pareceres. As alterações valem imediatamente nas próximas consultas.
        </p>
      </div>
      <SettingsForm initial={s} />
    </div>
  );
}
