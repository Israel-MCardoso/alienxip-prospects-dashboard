import { ModulePage } from "@/features/os/module-page";

export default function TechPage() {
  return (
    <ModulePage
      title="Tech"
      description="Area futura para bugs, debitos tecnicos, decisoes arquiteturais e saude da plataforma."
      items={["Bugs", "Decisoes tecnicas", "Pendencias de infraestrutura", "Checklist de release"]}
    />
  );
}
