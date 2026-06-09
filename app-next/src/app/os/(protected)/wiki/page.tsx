import { ModulePage } from "@/features/os/module-page";

export default function WikiPage() {
  return (
    <ModulePage
      title="Wiki"
      description="Base futura de conhecimento, processos internos, playbooks comerciais e documentacao de projetos."
      items={["Playbooks", "Processos", "Documentacao de clientes", "Notas de produto"]}
    />
  );
}
