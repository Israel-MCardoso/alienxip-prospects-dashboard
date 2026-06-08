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
  ["Next.js paralelo", "Nova ALIENXIP OS vive em /app-next e nas rotas /os."],
  ["Supabase futuro", "Banco, auth e RLS ficam preparados para a Sprint 2."],
  ["Prospects primeiro", "O modulo atual vira a primeira area migrada com paridade."]
];

export default function OsHomePage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary">Fundacao tecnica</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">ALIENXIP OS</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Base inicial da plataforma interna da ALIENXIP, criada em paralelo ao dashboard legado para evoluir CRM, clientes, projetos, tech, roadmap e wiki sem interromper o que ja funciona.
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
            A Sprint 2 deve conectar Supabase em ambiente de desenvolvimento, criar migrations iniciais e importar prospects com idempotencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nenhuma autenticacao real, storage ou banco de producao foi conectado nesta sprint.
        </CardContent>
      </Card>
    </div>
  );
}
