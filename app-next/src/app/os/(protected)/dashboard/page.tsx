import { ModulePage } from "@/features/os/module-page";

export default function DashboardPage() {
  return (
    <ModulePage
      title="Dashboard"
      description="Visao consolidada futura de pipeline, clientes, projetos, tarefas e riscos operacionais."
      items={["Metricas gerais da operacao", "Resumo do pipeline comercial", "Projetos ativos e bloqueios", "Atividades recentes"]}
    />
  );
}
