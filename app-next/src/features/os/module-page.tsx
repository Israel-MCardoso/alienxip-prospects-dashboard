import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

type ModulePageProps = {
  title: string;
  description: string;
  status?: string;
  items: string[];
};

export function ModulePage({ title, description, status = "Sprint 1", items }: ModulePageProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary">{status}</Badge>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escopo inicial</CardTitle>
          <CardDescription>
            Area reservada para a evolucao modular do MOTHERXIP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="rounded-lg border bg-background px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
