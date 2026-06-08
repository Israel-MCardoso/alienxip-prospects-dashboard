export type RawProspectRow = {
  title?: string;
  type?: string;
  types?: string;
  address?: string;
  phoneNumber?: string;
  rating?: string;
  ratingCount?: string;
  website?: string;
  bookingLinks?: string;
  latitude?: string;
  longitude?: string;
  [key: string]: string | undefined;
};

export type LegacyProspect = {
  empresa: string | undefined;
  segmento: string | undefined;
  cidade: string;
  prioridade: "Alta" | "Media" | "Baixa";
  telefone: string | undefined;
  avaliacao: string;
  site: string | undefined;
  social: string;
  whatsapp: string;
  oferta: string;
  proximo: string;
};

export function parseCsv(text: string): RawProspectRow[];
export function cityFromAddress(address: string | undefined): string;
export function firstUrl(text: string | undefined): string;
export function socialFrom(row: RawProspectRow): string;
export function priorityFor(row: RawProspectRow): LegacyProspect["prioridade"];
export function offerFor(row: RawProspectRow): string;
export function normalizeProspect(row: RawProspectRow): LegacyProspect;
