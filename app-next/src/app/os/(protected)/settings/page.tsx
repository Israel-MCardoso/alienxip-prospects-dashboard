import { ModulePage } from "@/features/os/module-page";

export default function SettingsPage() {
  return (
    <ModulePage
      title="Settings"
      description="Area futura para usuarios, papeis, integracoes, variaveis operacionais e configuracoes do workspace."
      items={["Usuarios", "Papeis", "Integracoes", "Configuracoes de importacao"]}
    />
  );
}
