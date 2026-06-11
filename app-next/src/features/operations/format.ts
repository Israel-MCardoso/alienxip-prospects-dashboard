export function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00`));
}

export function statusLabel(value: string) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    in_progress: "Em andamento",
    completed: "Concluida",
    canceled: "Cancelada",
    planning: "Planejamento",
    active: "Ativo",
    paused: "Pausado"
  };
  return labels[value] || value;
}

export function priorityLabel(value: string) {
  const labels: Record<string, string> = {
    low: "Baixa",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente"
  };
  return labels[value] || value;
}
