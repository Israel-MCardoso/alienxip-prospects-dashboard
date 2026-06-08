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
