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
        <Badge variant="secondary">Sprint 2</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">ALIENXIP OS</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Base interna com Supabase dev, autenticacao e CRM inicial de prospects, preservando o dashboard legado como fallback.
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

      <Card>
        <CardHeader>
          <CardTitle>Proxima decisao operacional</CardTitle>
          <CardDescription>
            A Sprint 3 deve fortalecer o CRM com diagnosticos, notas, atividades e fluxo de conversao para cliente/projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Supabase em producao ainda nao foi conectado. Use ambiente dev e variaveis locais.
        </CardContent>
      </Card>
    </div>
  );
}
