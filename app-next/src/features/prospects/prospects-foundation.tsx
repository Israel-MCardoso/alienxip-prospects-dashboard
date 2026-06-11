import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sampleProspects = [
  {
    empresa: "Vale Odontologia",
    segmento: "Clinica odontologica",
    cidade: "Jacarei",
    prioridade: "Alta",
    oferta: "Funil de agendamento"
  },
  {
    empresa: "Studio Beleza Local",
    segmento: "Beleza",
    cidade: "Sao Jose dos Campos",
    prioridade: "Media",
    oferta: "Agendamento e fidelizacao"
  },
  {
    empresa: "Pet Care Sul",
    segmento: "Pet shop",
    cidade: "Jacarei",
    prioridade: "Baixa",
    oferta: "Agenda e recorrencia"
  }
];

const metrics = [
  ["Prospects", "Fonte legada"],
  ["Prioridade alta", "Regra extraida"],
  ["Com WhatsApp", "A validar"],
  ["Prontos para CRM", "Sprint 2"]
];

export function ProspectsFoundation() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary">Prospects v0</Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Prospects</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Primeira tela do novo MOTHERXIP para preservar a intencao do dashboard atual antes da migracao completa de dados, filtros e acoes de CRM.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label} size="sm">
            <CardHeader>
              <CardTitle>{value}</CardTitle>
              <CardDescription>{label}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Base visual do modulo</CardTitle>
          <CardDescription>
            Placeholder sem dados persistentes. A paridade com o dashboard legado sera fechada antes da troca de fonte.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Input placeholder="Buscar empresa, segmento, cidade ou oferta" className="lg:max-w-md" />
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="high">Alta</TabsTrigger>
                <TabsTrigger value="medium">Media</TabsTrigger>
                <TabsTrigger value="low">Baixa</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Oferta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleProspects.map((prospect) => (
                <TableRow key={prospect.empresa}>
                  <TableCell className="font-medium">{prospect.empresa}</TableCell>
                  <TableCell>{prospect.segmento}</TableCell>
                  <TableCell>{prospect.cidade}</TableCell>
                  <TableCell>
                    <Badge variant={prospect.prioridade === "Alta" ? "destructive" : "outline"}>
                      {prospect.prioridade}
                    </Badge>
                  </TableCell>
                  <TableCell>{prospect.oferta}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
