// Mock data for Fedetec dashboard
export type ServiceStatus =
  | "CREADO"
  | "DISPONIBLE"
  | "ACEPTADO"
  | "EN_PROCESO"
  | "FINALIZADO"
  | "VALIDADO"
  | "PAGO_GENERADO"
  | "RECHAZADO"
  | "REPROGRAMACION_SOLICITADA"
  | "CANCELADO";

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

export const companies = [
  {
    id: "EMP-001",
    name: "Transportes Andinos",
    taxId: "900123456-7",
    email: "ops@andinos.co",
    phone: "+57 301 555 0101",
    active: true,
    services: 124,
    completed: 98,
    payment: "Al día",
  },
  {
    id: "EMP-002",
    name: "Logística Pacífico",
    taxId: "900987654-3",
    email: "soporte@pacifico.co",
    phone: "+57 302 555 0144",
    active: true,
    services: 87,
    completed: 71,
    payment: "Al día",
  },
  {
    id: "EMP-003",
    name: "Flota Caribe S.A.",
    taxId: "901223344-1",
    email: "contacto@flotacaribe.co",
    phone: "+57 304 555 0199",
    active: false,
    services: 12,
    completed: 9,
    payment: "Pendiente",
  },
  {
    id: "EMP-004",
    name: "RutaSur Express",
    taxId: "900445566-2",
    email: "admin@rutasur.co",
    phone: "+57 305 555 0177",
    active: true,
    services: 56,
    completed: 48,
    payment: "Al día",
  },
  {
    id: "EMP-005",
    name: "Cargo Express MX",
    taxId: "CEM920811A1",
    email: "ops@cargoexpress.mx",
    phone: "+52 55 5555 0123",
    active: true,
    services: 203,
    completed: 188,
    payment: "Al día",
  },
];

export const technicians = [
  {
    id: "TEC-001",
    name: "Carlos Mendoza",
    city: "Bogotá",
    vehicle: "Moto Yamaha XTZ",
    plate: "FQR-23B",
    availability: "Disponible",
    status: "online",
    distance: 1.2,
    jobs: 312,
    rating: 4.9,
    lastGps: "Hace 30s",
    lat: 4.711,
    lng: -74.072,
  },
  {
    id: "TEC-002",
    name: "Andrea Ríos",
    city: "Medellín",
    vehicle: "Camioneta Ford Ranger",
    plate: "KLM-91C",
    availability: "En servicio",
    status: "online",
    distance: 3.4,
    jobs: 198,
    rating: 4.8,
    lastGps: "Hace 1m",
    lat: 6.244,
    lng: -75.581,
  },
  {
    id: "TEC-003",
    name: "Julián Pardo",
    city: "Cali",
    vehicle: "Moto Honda CB",
    plate: "RTY-44A",
    availability: "Disponible",
    status: "online",
    distance: 0.8,
    jobs: 421,
    rating: 4.95,
    lastGps: "Hace 10s",
    lat: 3.451,
    lng: -76.531,
  },
  {
    id: "TEC-004",
    name: "María Fernanda López",
    city: "Barranquilla",
    vehicle: "Pickup Toyota Hilux",
    plate: "BAQ-78F",
    availability: "Offline",
    status: "offline",
    distance: null,
    jobs: 156,
    rating: 4.7,
    lastGps: "Hace 2h",
    lat: 10.97,
    lng: -74.79,
  },
  {
    id: "TEC-005",
    name: "Diego Suárez",
    city: "Bogotá",
    vehicle: "Moto Suzuki GN",
    plate: "GTH-12D",
    availability: "En servicio",
    status: "online",
    distance: 5.1,
    jobs: 267,
    rating: 4.6,
    lastGps: "Hace 45s",
    lat: 4.65,
    lng: -74.1,
  },
  {
    id: "TEC-006",
    name: "Laura Castaño",
    city: "Cartagena",
    vehicle: "Camioneta Mazda BT-50",
    plate: "CTG-09E",
    availability: "Disponible",
    status: "online",
    distance: 2.7,
    jobs: 134,
    rating: 4.85,
    lastGps: "Hace 2m",
    lat: 10.39,
    lng: -75.51,
  },
  {
    id: "TEC-007",
    name: "Esteban Quintero",
    city: "Bucaramanga",
    vehicle: "Moto Bajaj NS",
    plate: "BUC-66H",
    availability: "Disponible",
    status: "online",
    distance: 4.0,
    jobs: 89,
    rating: 4.5,
    lastGps: "Hace 1m",
    lat: 7.13,
    lng: -73.12,
  },
  {
    id: "TEC-008",
    name: "Paola Méndez",
    city: "Pereira",
    vehicle: "Pickup Chevrolet D-Max",
    plate: "PER-55G",
    availability: "Offline",
    status: "offline",
    distance: null,
    jobs: 201,
    rating: 4.75,
    lastGps: "Hace 6h",
    lat: 4.81,
    lng: -75.69,
  },
];

const serviceTypes = [
  "Mantenimiento preventivo",
  "Diagnóstico eléctrico",
  "Cambio de neumáticos",
  "Reparación de motor",
  "Lavado técnico",
  "Inspección de frenos",
  "Recarga de aire",
  "Soporte vial",
];
const plates = [
  "XJF-201",
  "MTR-885",
  "BNK-119",
  "QPL-503",
  "ZAR-667",
  "VHN-024",
  "TLP-712",
  "GRA-339",
  "DKE-456",
  "WOC-820",
];

const statusList: ServiceStatus[] = [
  "CREADO",
  "DISPONIBLE",
  "ACEPTADO",
  "EN_PROCESO",
  "FINALIZADO",
  "VALIDADO",
  "PAGO_GENERADO",
  "RECHAZADO",
  "REPROGRAMACION_SOLICITADA",
  "CANCELADO",
];

export const services = Array.from({ length: 28 }).map((_, i) => {
  const company = companies[i % companies.length];
  const tech = technicians[i % technicians.length];
  const date = new Date(2026, 4, 28 - (i % 28), 8 + (i % 10), (i * 7) % 60);
  return {
    id: `SRV-${(10245 + i).toString()}`,
    company: company.name,
    type: serviceTypes[i % serviceTypes.length],
    plate: plates[i % plates.length],
    technician: tech.name,
    date: date.toISOString(),
    status: statusList[i % statusList.length],
    distance: +(0.5 + (i % 12) * 0.8).toFixed(1),
    amount: 80000 + (i % 9) * 35000,
  };
});

export const evidences = Array.from({ length: 9 }).map((_, i) => ({
  id: `EVD-${5001 + i}`,
  serviceId: services[i].id,
  technician: services[i].technician,
  company: services[i].company,
  uploaded: new Date(2026, 4, 27 - (i % 12), 10 + i, 23).toISOString(),
  status: (["PENDIENTE", "APROBADA", "RECHAZADA"] as const)[i % 3],
  files: 3 + (i % 4),
  type: ["image", "pdf", "video"][i % 3],
}));

export const payments = Array.from({ length: 14 }).map((_, i) => {
  const s = services[i % services.length];
  return {
    id: `PAY-${9001 + i}`,
    serviceId: s.id,
    technician: s.technician,
    company: s.company,
    amount: s.amount,
    generated: new Date(2026, 4, 25 - (i % 20), 9, 0).toISOString(),
    status: (["PENDIENTE", "GENERADO", "PAGADO", "ANULADO"] as const)[i % 4],
  };
});

export const notifications = [
  {
    id: 1,
    type: "service_assigned",
    title: "Servicio SRV-10247 asignado",
    desc: "Carlos Mendoza fue asignado al servicio.",
    time: "hace 2 min",
    read: false,
    priority: "high",
  },
  {
    id: 2,
    type: "evidence_uploaded",
    title: "Nueva evidencia cargada",
    desc: "Andrea Ríos subió 4 archivos para SRV-10248.",
    time: "hace 9 min",
    read: false,
    priority: "medium",
  },
  {
    id: 3,
    type: "payment_generated",
    title: "Pago generado PAY-9023",
    desc: "Se generó pago por $215.000 a Julián Pardo.",
    time: "hace 27 min",
    read: false,
    priority: "medium",
  },
  {
    id: 4,
    type: "service_accepted",
    title: "Servicio aceptado",
    desc: "Diego Suárez aceptó SRV-10251.",
    time: "hace 1 h",
    read: true,
    priority: "low",
  },
  {
    id: 5,
    type: "service_rejected",
    title: "Servicio rechazado",
    desc: "Laura Castaño rechazó SRV-10250.",
    time: "hace 2 h",
    read: true,
    priority: "high",
  },
  {
    id: 6,
    type: "technician_offline",
    title: "Técnico desconectado",
    desc: "María Fernanda López está fuera de línea.",
    time: "hace 3 h",
    read: true,
    priority: "low",
  },
];

export const activity = [
  {
    user: "Carlos Mendoza",
    action: "finalizó",
    target: "SRV-10245",
    time: "hace 4 min",
    tone: "success",
  },
  { user: "Sistema", action: "generó pago", target: "PAY-9023", time: "hace 12 min", tone: "info" },
  {
    user: "Andrea Ríos",
    action: "subió evidencia para",
    target: "SRV-10248",
    time: "hace 18 min",
    tone: "default",
  },
  {
    user: "Julián Pardo",
    action: "aceptó",
    target: "SRV-10247",
    time: "hace 31 min",
    tone: "info",
  },
  {
    user: "Laura Castaño",
    action: "rechazó",
    target: "SRV-10250",
    time: "hace 1 h",
    tone: "destructive",
  },
  {
    user: "Diego Suárez",
    action: "inició",
    target: "SRV-10251",
    time: "hace 1 h",
    tone: "primary",
  },
];

export const revenueData = [
  { month: "Ene", revenue: 42000, services: 120 },
  { month: "Feb", revenue: 48500, services: 138 },
  { month: "Mar", revenue: 51200, services: 144 },
  { month: "Abr", revenue: 60100, services: 167 },
  { month: "May", revenue: 72400, services: 198 },
  { month: "Jun", revenue: 81800, services: 221 },
  { month: "Jul", revenue: 88300, services: 245 },
];

export const statusDistribution = [
  { name: "En proceso", value: 32, color: "var(--color-primary)" },
  { name: "Finalizado", value: 48, color: "var(--color-success)" },
  { name: "Pendiente", value: 14, color: "var(--color-info)" },
  { name: "Rechazado", value: 6, color: "var(--color-destructive)" },
];

export const serviceTypeData = [
  { name: "Mantenimiento", value: 38 },
  { name: "Diagnóstico", value: 24 },
  { name: "Neumáticos", value: 18 },
  { name: "Frenos", value: 12 },
  { name: "Eléctrico", value: 8 },
];

export const weeklyServices = [
  { day: "Lun", completados: 24, pendientes: 8 },
  { day: "Mar", completados: 31, pendientes: 11 },
  { day: "Mié", completados: 28, pendientes: 6 },
  { day: "Jue", completados: 35, pendientes: 9 },
  { day: "Vie", completados: 42, pendientes: 14 },
  { day: "Sáb", completados: 22, pendientes: 5 },
  { day: "Dom", completados: 12, pendientes: 3 },
];

export function formatCurrency(v: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
