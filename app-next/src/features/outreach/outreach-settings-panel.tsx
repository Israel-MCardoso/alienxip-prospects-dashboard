import { AlertTriangleIcon, BotIcon, ClockIcon, MessageCircleIcon, ShieldCheckIcon, SlidersHorizontalIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const rateLimitDefaults = {
  messagesPerHour: 20,
  messagesPerDay: 120,
  minDelaySeconds: 30,
  maxDelaySeconds: 180,
  businessStartHour: "08:00",
  businessEndHour: "18:00",
  timezone: "America/Sao_Paulo",
  maxRetryAttempts: 3,
  backoff: "30s, 60s, 120s"
};

function ReadOnlyField({ label, value }: { label: string; value: string | number }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <Input value={value} readOnly className="h-9 bg-muted/40 font-mono text-xs" />
    </label>
  );
}

export function OutreachSettingsPanel() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="w-fit border-emerald-500/30 bg-emerald-500/10 text-emerald-500" variant="outline">
            Production readiness
          </Badge>
          <Badge className="w-fit border-amber-500/30 bg-amber-500/10 text-amber-500" variant="outline">
            Provider real desligado
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Outreach Settings</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Painel administrativo preparatorio para separar Sandbox e Production sem ativar envios reais.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheckIcon className="size-4 text-emerald-500" />
              Ambientes
            </CardTitle>
            <CardDescription>Production nunca reutiliza workflow sandbox.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="Sandbox" value="habilitado para homologacao" />
            <ReadOnlyField label="Production" value="bloqueado ate aprovacao" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageCircleIcon className="size-4 text-sky-500" />
              Evolution API
            </CardTitle>
            <CardDescription>Configuracao visivel, sem conexao real nesta sprint.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="URL" value="nao configurada" />
            <ReadOnlyField label="Instance Name" value="nao configurada" />
            <ReadOnlyField label="Health Status" value="unknown" />
            <ReadOnlyField label="Last Check" value="nao executado" />
            <ReadOnlyField label="Evolution Provider Enabled" value="false" />
            <ReadOnlyField label="Test Mode" value="sandbox only" />
            <ReadOnlyField label="Provider" value="MockWhatsAppProvider" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ClockIcon className="size-4 text-indigo-500" />
              Rate Limit e Horario Comercial
            </CardTitle>
            <CardDescription>Valores de readiness para fila futura.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="Mensagens por hora" value={rateLimitDefaults.messagesPerHour} />
            <ReadOnlyField label="Mensagens por dia" value={rateLimitDefaults.messagesPerDay} />
            <ReadOnlyField label="Delay minimo" value={`${rateLimitDefaults.minDelaySeconds}s`} />
            <ReadOnlyField label="Delay maximo" value={`${rateLimitDefaults.maxDelaySeconds}s`} />
            <ReadOnlyField label="Inicio" value={rateLimitDefaults.businessStartHour} />
            <ReadOnlyField label="Fim" value={rateLimitDefaults.businessEndHour} />
            <ReadOnlyField label="Timezone" value={rateLimitDefaults.timezone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <SlidersHorizontalIcon className="size-4 text-amber-500" />
              Retry
            </CardTitle>
            <CardDescription>Backoff preparado para callback, Evolution e webhook.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="Maximo de tentativas" value={rateLimitDefaults.maxRetryAttempts} />
            <ReadOnlyField label="Backoff" value={rateLimitDefaults.backoff} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BotIcon className="size-4 text-purple-500" />
              OpenAI
            </CardTitle>
            <CardDescription>Somente leitura. Nao permite ativacao pela UI.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4">
            <ReadOnlyField label="Provider Enabled" value="false" />
            <ReadOnlyField label="AI Dry Run" value="true" />
            <ReadOnlyField label="Model" value="gpt-4.1-mini" />
            <ReadOnlyField label="Budget" value="0" />
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangleIcon className="size-4" />
              Travas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <span>Nao enviar para leads reais</span>
            <span>OpenAI real: bloqueado</span>
            <span>Evolution real: bloqueado</span>
            <span>WhatsApp real: bloqueado</span>
            <span>Campanhas reais: bloqueadas</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
