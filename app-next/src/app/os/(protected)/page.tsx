import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

const foundations = [
  ["Fallback preservado", "Dashboard estatico e /api/prospects continuam como base segura."],
  ["Supabase dev", "Auth, migrations e prospects editaveis entram sem trocar producao."],
  ["RLS primeiro", "Tabelas novas nascem protegidas contra acesso anonimo."],
  ["Prospects editavel", "CRM inicial com criacao, edicao e importacao idempotente."]
];

export default function OsHomePage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex">
          <Badge variant="secondary" className="bg-purple-900/40 text-purple-300 border-purple-800/50 hover:bg-purple-900/60">
            Sprint 10 (Hardening)
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">ALIENXIP OS</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Plataforma operacional consolidada com Supabase, autenticação integrada, gestão de prospects, clientes, projetos, arquivos, tarefas, playbooks e atividades, preservando o dashboard legado.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {foundations.map(([title, description]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-purple-500/20 bg-[#080808]">
        <CardHeader>
          <CardTitle className="text-purple-400">Estado da Plataforma</CardTitle>
          <CardDescription>
            Sistema operacional totalmente consolidado após a Sprint 10 (Hardening), com foco em estabilidade, performance e UX premium.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          As integrações e banco de dados estão otimizados. Para novas demandas, siga o fluxo de governança e migrations.
        </CardContent>
      </Card>
    </div>
  );
}
