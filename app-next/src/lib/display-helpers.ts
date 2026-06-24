/**
 * MOTHERXIP Display & Translation Helpers (PT-BR)
 * Translates database enum values to visual display labels.
 */

export function whatsappHref(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("https://wa.me/")) return value;
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  // Add Brazilian DDI (55) if number doesn't already start with it
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

export function statusLabel(status: string | null | undefined): string {
  if (!status) return "N/A";
  const s = status.toLowerCase();
  
  const mapping: Record<string, string> = {
    // General / Project Status
    active: "Ativo",
    pending: "Pendente",
    completed: "Concluído",
    canceled: "Cancelado",
    paused: "Pausado",
    planning: "Planejamento",
    former: "Antigo",
    
    new: "Novo Lead",
    qualified: "Qualificação",
    contacted: "Contatado",
    meeting_scheduled: "Reunião Agendada",
    proposal_sent: "Proposta Enviada",
    won: "Ganho",
    lost: "Perdido",
    archived: "Arquivado",
    frio: "Frio",
    contato_inicial: "Primeiro Contato",
    diagnostico: "Diagnóstico",
    proposta: "Proposta Enviada",
    negociacao: "Negociação",
    fechado: "Fechado Ganho",
    perdido: "Fechado Perdido",
    
    // Knowledge / Review Status
    draft: "Rascunho",
    published: "Publicado",
    needs_review: "Precisa de Revisão",
    approved: "Aprovado",
    outdated: "Desatualizado",
    
    // Tech / Bugs
    open: "Aberto",
    closed: "Fechado",
    in_progress: "Em Andamento",
    investigating: "Investigando",
    identified: "Identificado",
    monitoring: "Monitorando",
    resolved: "Resolvido",
    fixed: "Corrigido",
    wont_fix: "Não será corrigido",
    
    // Outreach / SDR Statuses
    not_started: "Não Iniciado",
    queued: "Fila",
    sent: "Enviado",
    delivered: "Entregue",
    waiting_reply: "Aguardando Resposta",
    replied: "Respondeu",
    negotiating: "Negociando",
    failed: "Falhou",
    stopped: "Parado",
    disqualified: "Desqualificado"
  };

  return mapping[s] || status;
}

export function priorityLabel(priority: string | null | undefined): string {
  if (!priority) return "N/A";
  const p = priority.toLowerCase();
  
  const mapping: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    urgent: "Urgente",
    critical: "Crítica"
  };

  return mapping[p] || priority;
}

export function temperatureLabel(temp: string | null | undefined): string {
  if (!temp) return "N/A";
  const t = temp.toLowerCase();
  
  const mapping: Record<string, string> = {
    cold: "Frio",
    warm: "Morno",
    hot: "Quente"
  };

  return mapping[t] || temp;
}

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "Membro";
  const r = role.toLowerCase();
  
  const mapping: Record<string, string> = {
    owner: "Proprietário",
    admin: "Administrador",
    manager: "Gerente",
    member: "Membro",
    viewer: "Visualizador",
    operator: "Operador"
  };

  return mapping[r] || role;
}

export function segmentLabel(segment: string | null | undefined): string {
  if (!segment) return "Geral";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function categoryLabel(cat: string | null | undefined): string {
  if (!cat) return "Geral";
  const c = cat.toLowerCase();
  
  const mapping: Record<string, string> = {
    vendas: "Vendas",
    prospeccao: "Prospecção",
    desenvolvimento: "Desenvolvimento",
    design: "Design",
    operacao: "Operação",
    suporte: "Suporte",
    financeiro: "Financeiro",
    geral: "Geral",
    processos: "Processos",
    propostas: "Propostas",
    scripts: "Scripts",
    crm: "CRM",
    arquitetura: "Arquitetura",
    projetos: "Projetos",
    deploys: "Deploys",
    infraestrutura: "Infraestrutura",
    ia: "IA",
    branding: "Branding",
    "ui/ux": "UI/UX",
    referencias: "Referências",
    componentes: "Componentes",
    entregas: "Entregas",
    fluxos: "Fluxos",
    procedimentos: "Procedimentos",
    estrategia: "Estratégia",
    "processos internos": "Processos Internos",
    contratacoes: "Contratações",
    expansao: "Expansão"
  };

  return mapping[c] || cat;
}

export function getCoreCategoryName(dbCategory: string | null | undefined): string {
  if (!dbCategory) return "Gestão";
  const c = dbCategory.toLowerCase();
  if (c === "vendas" || c === "prospeccao" || c === "comercial") return "Comercial";
  if (c === "desenvolvimento" || c === "tech") return "Tech";
  if (c === "design") return "Design";
  if (c === "operacao") return "Operação";
  return "Gestão";
}
