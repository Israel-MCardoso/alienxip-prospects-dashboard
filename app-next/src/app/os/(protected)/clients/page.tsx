import { ModulePage } from "@/features/os/module-page";

export default function ClientsPage() {
  return (
    <ModulePage
      title="Clients"
      description="Area futura para clientes ativos, historico, contratos, contatos e saude da conta."
      items={["Clientes ativos", "Historico comercial", "Contratos", "Relacionamento"]}
    />
  );
}
