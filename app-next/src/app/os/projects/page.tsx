import { ModulePage } from "@/features/os/module-page";

export default function ProjectsPage() {
  return (
    <ModulePage
      title="Projects"
      description="Area futura para organizar entregas internas e projetos de clientes."
      items={["Projetos por cliente", "Responsaveis", "Prazos", "Tarefas vinculadas"]}
    />
  );
}
