"use client";

import { useMemo, useState } from "react";
import { XIcon, DownloadIcon, ListFilterIcon, MessageCircleIcon, TargetIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { statusLabel, temperatureLabel } from "@/lib/display-helpers";
import { prospectStatuses, prospectTemperatures } from "./prospect-schema";
import type { ProspectRow } from "./data";
import { previewWhatsappBatchAction } from "./whatsapp-batch-actions";
import {
  BATCH_QUANTITY_PRESETS,
  MAX_BATCH_SIZE,
  batchCsvFilename,
  buildBatchCsv,
  type WhatsappBatchPreview
} from "./whatsapp-batch";

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  google_sheet: "Google Sheet",
  referral: "Indicação",
  instagram: "Instagram",
  website: "Website",
  other: "Outro"
};

// Distinct, sorted, non-empty values for a free-text prospect field.
function distinctValues(prospects: ProspectRow[], pick: (p: ProspectRow) => string | null): string[] {
  const set = new Set<string>();
  for (const p of prospects) {
    const value = (pick(p) || "").trim();
    if (value) set.add(value);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

type Props = {
  open: boolean;
  onClose: () => void;
  prospects: ProspectRow[];
};

export function WhatsappBatchDrawer({ open, onClose, prospects }: Props) {
  const [segment, setSegment] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [source, setSource] = useState("");
  const [temperature, setTemperature] = useState("");
  const [quantityPreset, setQuantityPreset] = useState<string>(String(BATCH_QUANTITY_PRESETS[0]));
  const [customQuantity, setCustomQuantity] = useState("");

  const [preview, setPreview] = useState<WhatsappBatchPreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const segmentOptions = useMemo(() => distinctValues(prospects, (p) => p.segment), [prospects]);
  const cityOptions = useMemo(() => distinctValues(prospects, (p) => p.city), [prospects]);
  const stateOptions = useMemo(() => distinctValues(prospects, (p) => p.state), [prospects]);
  const sourceOptions = useMemo(() => distinctValues(prospects, (p) => p.source), [prospects]);

  if (!open) return null;

  const resolveLimit = (): number | null => {
    if (quantityPreset !== "custom") return Number(quantityPreset);
    const parsed = Number(customQuantity);
    if (!Number.isInteger(parsed) || parsed < 1) return null;
    return parsed;
  };

  const handlePreview = async () => {
    const limit = resolveLimit();
    if (limit === null) {
      toast.error("Quantidade personalizada inválida. Informe um número inteiro maior ou igual a 1.");
      return;
    }
    if (limit > MAX_BATCH_SIZE) {
      toast.error(`Quantidade muito alta. O limite seguro por lote é ${MAX_BATCH_SIZE} prospects.`);
      return;
    }

    setIsPreviewing(true);
    try {
      const result = await previewWhatsappBatchAction({
        segment: segment || undefined,
        status: status || undefined,
        city: city || undefined,
        state: state || undefined,
        source: source || undefined,
        temperature: temperature || undefined,
        limit
      });
      if (!result.ok) {
        toast.error("Não foi possível pré-visualizar o lote.", result.error);
        return;
      }
      setPreview(result.preview);
    } catch (err) {
      toast.error("Falha ao pré-visualizar o lote.", err instanceof Error ? err.message : String(err));
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDownload = () => {
    if (!preview || preview.rows.length === 0) return;
    setIsDownloading(true);
    try {
      const csv = buildBatchCsv(preview.rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = batchCsvFilename();
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`CSV gerado com ${preview.rows.length} prospect(s).`);
    } catch (err) {
      toast.error("Não foi possível gerar o arquivo CSV.", err instanceof Error ? err.message : String(err));
    } finally {
      setIsDownloading(false);
    }
  };

  const totalIgnored = preview
    ? preview.ignored.noPhone + preview.ignored.invalidPhone + preview.ignored.duplicate
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />
      <div className="fixed md:inset-y-0 md:right-0 inset-x-0 bottom-0 z-50 flex md:w-auto w-full max-h-[95vh] md:max-h-full">
        <div className="w-full md:w-screen md:max-w-2xl bg-card border-t md:border-t-0 md:border-l border-border text-foreground flex flex-col shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-200 ease-out rounded-t-xl md:rounded-t-none">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-purple-950/40 border border-purple-500/20 text-purple-300">
                <MessageCircleIcon className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold font-mono text-foreground uppercase tracking-widest">Gerar lote WhatsApp</h3>
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                  Exporta um CSV filtrado de prospects para campanhas manuais. Não envia mensagens.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 shrink-0 cursor-pointer"
              aria-label="Fechar"
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-background/10 flex flex-col gap-5">
            {/* Filters */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ListFilterIcon className="size-3.5 text-purple-300" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Filtros do lote
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Segmento">
                  <CustomSelect
                    value={segment}
                    onChange={setSegment}
                    placeholder="Todos os segmentos"
                    options={[
                      { value: "", label: "Todos os segmentos" },
                      ...segmentOptions.map((s) => ({ value: s, label: s }))
                    ]}
                  />
                </Field>

                <Field label="Status">
                  <CustomSelect
                    value={status}
                    onChange={setStatus}
                    placeholder="Todos os status"
                    options={[
                      { value: "", label: "Todos os status" },
                      ...prospectStatuses.map((s) => ({ value: s, label: statusLabel(s) }))
                    ]}
                  />
                </Field>

                <Field label="Cidade">
                  <CustomSelect
                    value={city}
                    onChange={setCity}
                    placeholder="Todas as cidades"
                    options={[
                      { value: "", label: "Todas as cidades" },
                      ...cityOptions.map((c) => ({ value: c, label: c }))
                    ]}
                  />
                </Field>

                <Field label="Estado">
                  <CustomSelect
                    value={state}
                    onChange={setState}
                    placeholder="Todos os estados"
                    options={[
                      { value: "", label: "Todos os estados" },
                      ...stateOptions.map((s) => ({ value: s, label: s }))
                    ]}
                  />
                </Field>

                <Field label="Origem">
                  <CustomSelect
                    value={source}
                    onChange={setSource}
                    placeholder="Todas as origens"
                    options={[
                      { value: "", label: "Todas as origens" },
                      ...sourceOptions.map((s) => ({ value: s, label: SOURCE_LABELS[s] || s }))
                    ]}
                  />
                </Field>

                <Field label="Temperatura">
                  <CustomSelect
                    value={temperature}
                    onChange={setTemperature}
                    placeholder="Todas as temperaturas"
                    options={[
                      { value: "", label: "Todas as temperaturas" },
                      ...prospectTemperatures.map((t) => ({ value: t, label: temperatureLabel(t) }))
                    ]}
                  />
                </Field>
              </div>

              {/* Quantity */}
              <Field label="Quantidade a exportar">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-40">
                    <CustomSelect
                      value={quantityPreset}
                      onChange={setQuantityPreset}
                      options={[
                        ...BATCH_QUANTITY_PRESETS.map((q) => ({ value: String(q), label: `${q} prospects` })),
                        { value: "custom", label: "Personalizado" }
                      ]}
                    />
                  </div>
                  {quantityPreset === "custom" && (
                    <Input
                      type="number"
                      min={1}
                      max={MAX_BATCH_SIZE}
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(e.target.value)}
                      placeholder={`1 a ${MAX_BATCH_SIZE}`}
                      className="w-32"
                    />
                  )}
                </div>
              </Field>

              <Button
                onClick={handlePreview}
                disabled={isPreviewing}
                className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white font-mono cursor-pointer self-start flex items-center gap-1.5"
              >
                <TargetIcon className="size-3.5" />
                {isPreviewing ? "Pré-visualizando..." : "Pré-visualizar lote"}
              </Button>
            </div>

            {/* Preview */}
            {preview && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <StatCard label="Encontrados" value={preview.totalFound} tone="neutral" />
                  <StatCard label="Elegíveis" value={preview.totalEligible} tone="emerald" />
                  <StatCard label="A exportar" value={preview.totalExported} tone="purple" />
                  <StatCard label="Ignorados" value={totalIgnored} tone="rose" />
                </div>

                {totalIgnored > 0 && (
                  <div className="rounded-lg border border-white/5 bg-zinc-950/40 p-3 text-[11px] font-mono text-muted-foreground flex flex-col gap-1.5">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground/80">Motivos dos ignorados</span>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span>Sem telefone: <strong className="text-rose-300">{preview.ignored.noPhone}</strong></span>
                      <span>Telefone inválido: <strong className="text-rose-300">{preview.ignored.invalidPhone}</strong></span>
                      <span>Duplicado: <strong className="text-rose-300">{preview.ignored.duplicate}</strong></span>
                    </div>
                  </div>
                )}

                {preview.rows.length === 0 ? (
                  <EmptyState
                    title="Nenhum prospect elegível"
                    description="Nenhum lead com WhatsApp válido corresponde aos filtros. Ajuste os filtros e pré-visualize novamente."
                    icon={<TargetIcon className="size-5" />}
                  />
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-950/60 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Nome</th>
                          <th className="px-3 py-2">Empresa</th>
                          <th className="px-3 py-2">Telefone</th>
                          <th className="px-3 py-2">Segmento</th>
                          <th className="px-3 py-2">Cidade</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Origem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {preview.rows.map((row) => (
                          <tr key={row.prospect_id} className="hover:bg-purple-950/10">
                            <td className="px-3 py-2 font-medium text-foreground">{row.name}</td>
                            <td className="px-3 py-2 text-muted-foreground">{row.company || "—"}</td>
                            <td className="px-3 py-2 font-mono text-purple-200">{row.phone}</td>
                            <td className="px-3 py-2 text-muted-foreground">{row.segment || "—"}</td>
                            <td className="px-3 py-2 text-muted-foreground">{row.city || "—"}</td>
                            <td className="px-3 py-2 text-muted-foreground">{statusLabel(row.status)}</td>
                            <td className="px-3 py-2 text-muted-foreground">{SOURCE_LABELS[row.source] || row.source || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] font-mono text-muted-foreground">
              {preview ? `${preview.totalExported} linha(s) prontas para download` : "Pré-visualize para habilitar o download"}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer font-mono text-xs">
                Fechar
              </Button>
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={!preview || preview.rows.length === 0 || isDownloading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs cursor-pointer flex items-center gap-1.5"
              >
                <DownloadIcon className="size-3.5" />
                {isDownloading ? "Gerando..." : "Baixar CSV"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const TONE_CLASSES: Record<string, string> = {
  neutral: "border-white/5 bg-[#08080a]/60 text-white",
  emerald: "border-emerald-500/15 bg-emerald-950/10 text-emerald-200",
  purple: "border-purple-500/15 bg-purple-950/10 text-purple-200",
  rose: "border-rose-500/15 bg-rose-950/10 text-rose-200"
};

function StatCard({ label, value, tone }: { label: string; value: number; tone: keyof typeof TONE_CLASSES }) {
  return (
    <div className={`rounded-xl border p-3 ${TONE_CLASSES[tone]}`}>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <strong className="mt-1 block font-mono text-2xl">{value}</strong>
    </div>
  );
}
