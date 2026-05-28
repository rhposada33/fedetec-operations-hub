import type { ServiceStatus } from "./types";

export const statusVariant: Record<ServiceStatus, { label: string; tone: string }> = {
  CREADO: { label: "Creado", tone: "bg-muted text-muted-foreground" },
  DISPONIBLE: { label: "Disponible", tone: "bg-info/15 text-info border border-info/20" },
  ACEPTADO: { label: "Aceptado", tone: "bg-info/15 text-info border border-info/20" },
  EN_PROCESO: { label: "En proceso", tone: "bg-primary/15 text-primary border border-primary/30" },
  FINALIZADO: { label: "Finalizado", tone: "bg-success/15 text-success border border-success/25" },
  VALIDADO: { label: "Validado", tone: "bg-success/15 text-success border border-success/25" },
  PAGO_GENERADO: {
    label: "Pago generado",
    tone: "bg-success/20 text-success border border-success/30",
  },
  RECHAZADO: {
    label: "Rechazado",
    tone: "bg-destructive/15 text-destructive border border-destructive/25",
  },
  REPROGRAMACION_SOLICITADA: {
    label: "Reprogramación",
    tone: "bg-warning/20 text-warning-foreground border border-warning/40",
  },
  CANCELADO: {
    label: "Cancelado",
    tone: "bg-destructive/15 text-destructive border border-destructive/25",
  },
};

export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function serviceTypeLabel(tipo: number) {
  const map: Record<number, string> = {
    1: "Mantenimiento",
    2: "Diagnóstico",
    3: "Soporte vial",
  };
  return map[tipo] ?? `Tipo ${tipo}`;
}
