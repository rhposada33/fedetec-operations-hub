import type {
  AppConfiguration,
  Company,
  CompanyCreated,
  CreateCompanyPayload,
  CreateServicePayload,
  CreateServiceRatingPayload,
  CreateServiceTipPayload,
  CreateTechnicianPayload,
  CurrentUser,
  DashboardResponse,
  Evidence,
  NearbyTechnician,
  PaymentReport,
  PublishedService,
  Service,
  ServiceFilters,
  ServiceType,
  ServiceTip,
  ServiceRating,
  Technician,
  TechnicianPerformanceMetrics,
  TechnicianServiceNotification,
  TokenResponse,
  UpdateServicePayload,
  CreateServiceTypePayload,
  UpdateCompanyPayload,
  UpdateServiceTypePayload,
  UpdateTechnicianPayload,
} from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : `HTTP ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

type ApiOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  headers?: HeadersInit;
};

function buildQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response.text();
  return response.json();
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData || options.body instanceof URLSearchParams) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });
  const data = response.status === 204 ? null : await parseResponse(response);
  if (!response.ok) {
    throw new ApiError(response.status, data?.detail ?? data);
  }
  return data as T;
}

export async function login(username: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", password);
  return apiFetch<TokenResponse>("/api/v1/autenticacion/login", {
    method: "POST",
    body,
  });
}

export const authApi = {
  me: (token: string) => apiFetch<CurrentUser>("/api/v1/autenticacion/yo", { token }),
  registerTechnician: (body: CreateTechnicianPayload) =>
    apiFetch<CurrentUser>("/api/v1/autenticacion/registro/tecnico", {
      method: "POST",
      body,
    }),
};

export const adminApi = {
  dashboard: (token: string, filters: ServiceFilters = {}) =>
    apiFetch<DashboardResponse>(`/api/v1/admin/dashboard${buildQuery(filters)}`, { token }),
  services: (token: string, filters: ServiceFilters = {}) =>
    apiFetch<Service[]>(`/api/v1/admin/servicios${buildQuery(filters)}`, { token }),
  technicians: (token: string, esta_disponible?: boolean | null) =>
    apiFetch<Technician[]>(`/api/v1/admin/tecnicos${buildQuery({ esta_disponible })}`, { token }),
  technicianMetrics: (token: string, tecnicoId: string) =>
    apiFetch<TechnicianPerformanceMetrics>(`/api/v1/admin/tecnicos/${tecnicoId}/metricas`, {
      token,
    }),
  updateTechnician: (token: string, tecnicoId: string, body: UpdateTechnicianPayload) =>
    apiFetch<Technician>(`/api/v1/admin/tecnicos/${tecnicoId}`, {
      method: "PATCH",
      token,
      body,
    }),
  companies: (token: string, esta_activa?: boolean | null) =>
    apiFetch<Company[]>(`/api/v1/admin/empresas-cliente${buildQuery({ esta_activa })}`, {
      token,
    }),
  pendingEvidence: (token: string) =>
    apiFetch<Evidence[]>("/api/v1/admin/evidencias/pendientes", { token }),
  updateConfig: (token: string, config: AppConfiguration["aprobacion_evidencias"]) =>
    apiFetch<AppConfiguration>("/api/v1/admin/configuracion", {
      method: "PATCH",
      token,
      body: { aprobacion_evidencias: config },
    }),
  serviceTypes: (token: string, solo_activos = false) =>
    apiFetch<ServiceType[]>(`/api/v1/admin/tipos-servicio${buildQuery({ solo_activos })}`, {
      token,
    }),
  createServiceType: (token: string, body: CreateServiceTypePayload) =>
    apiFetch<ServiceType>("/api/v1/admin/tipos-servicio", {
      method: "POST",
      token,
      body,
    }),
  updateServiceType: (token: string, id: number, body: UpdateServiceTypePayload) =>
    apiFetch<ServiceType>(`/api/v1/admin/tipos-servicio/${id}`, {
      method: "PATCH",
      token,
      body,
    }),
  deactivateServiceType: (token: string, id: number) =>
    apiFetch<ServiceType>(`/api/v1/admin/tipos-servicio/${id}`, {
      method: "DELETE",
      token,
    }),
};

export const companiesApi = {
  create: (token: string, body: CreateCompanyPayload) =>
    apiFetch<CompanyCreated>("/api/v1/empresas-cliente", { method: "POST", token, body }),
  update: (token: string, id: string, body: UpdateCompanyPayload) =>
    apiFetch<Company>(`/api/v1/empresas-cliente/${id}`, {
      method: "PATCH",
      token,
      body,
    }),
};

export const servicesApi = {
  create: (token: string, idempotencyKey: string, body: CreateServicePayload) =>
    apiFetch<Service>("/api/v1/servicios", {
      method: "POST",
      token,
      headers: { "Idempotency-Key": idempotencyKey },
      body,
    }),
  list: (token: string) => apiFetch<Service[]>("/api/v1/servicios", { token }),
  get: (token: string, id: string) => apiFetch<Service>(`/api/v1/servicios/${id}`, { token }),
  update: (token: string, id: string, body: UpdateServicePayload) =>
    apiFetch<Service>(`/api/v1/servicios/${id}`, {
      method: "PATCH",
      token,
      body,
    }),
  publish: (token: string, id: string, radio_metros?: number) =>
    apiFetch<PublishedService>(`/api/v1/servicios/${id}/publicar${buildQuery({ radio_metros })}`, {
      method: "POST",
      token,
    }),
  accept: (token: string, id: string) =>
    apiFetch<Service>(`/api/v1/servicios/${id}/aceptar`, { method: "POST", token }),
  reject: (token: string, id: string, motivo?: string) =>
    apiFetch(`/api/v1/servicios/${id}/rechazar`, { method: "POST", token, body: { motivo } }),
  reschedule: (token: string, id: string, fecha_propuesta: string, motivo?: string) =>
    apiFetch(`/api/v1/servicios/${id}/reprogramar`, {
      method: "POST",
      token,
      body: { fecha_propuesta, motivo },
    }),
  start: (token: string, id: string) =>
    apiFetch<Service>(`/api/v1/servicios/${id}/iniciar`, { method: "POST", token }),
  finish: (token: string, id: string) =>
    apiFetch<Service>(`/api/v1/servicios/${id}/finalizar`, { method: "POST", token }),
  createEvidence: (token: string, id: string, body: Partial<Evidence>) =>
    apiFetch<Evidence>(`/api/v1/servicios/${id}/evidencias`, {
      method: "POST",
      token,
      body,
    }),
  evidence: (token: string, id: string) =>
    apiFetch<Evidence[]>(`/api/v1/servicios/${id}/evidencias`, { token }),
  paymentReport: (token: string, id: string, valor?: number | string | null) =>
    apiFetch<PaymentReport>(`/api/v1/servicios/${id}/reporte-pago`, {
      method: "POST",
      token,
      body: { valor },
    }),
  rating: (token: string, id: string) =>
    apiFetch<ServiceRating>(`/api/v1/servicios/${id}/calificaciones`, { token }),
  createRating: (token: string, id: string, body: CreateServiceRatingPayload) =>
    apiFetch<ServiceRating>(`/api/v1/servicios/${id}/calificaciones`, {
      method: "POST",
      token,
      body,
    }),
  tip: (token: string, id: string) =>
    apiFetch<ServiceTip>(`/api/v1/servicios/${id}/propina`, { token }),
  createTip: (token: string, id: string, body: CreateServiceTipPayload) =>
    apiFetch<ServiceTip>(`/api/v1/servicios/${id}/propina`, {
      method: "POST",
      token,
      body,
    }),
};

export const evidenceApi = {
  approve: (token: string, id: string) =>
    apiFetch<Evidence>(`/api/v1/evidencias/${id}/aprobar`, { method: "POST", token }),
  reject: (token: string, id: string) =>
    apiFetch<Evidence>(`/api/v1/evidencias/${id}/rechazar`, { method: "POST", token }),
};

export const paymentsApi = {
  list: (token: string) => apiFetch<PaymentReport[]>("/api/v1/reportes-pago", { token }),
  get: (token: string, id: string) =>
    apiFetch<PaymentReport>(`/api/v1/reportes-pago/${id}`, { token }),
};

export const technicianApi = {
  me: (token: string) => apiFetch<Technician>("/api/v1/tecnicos/yo", { token }),
  metrics: (token: string) =>
    apiFetch<TechnicianPerformanceMetrics>("/api/v1/tecnicos/yo/metricas", { token }),
  updateLocation: (token: string, latitud: number, longitud: number) =>
    apiFetch<Technician>("/api/v1/tecnicos/yo/ubicacion", {
      method: "PATCH",
      token,
      body: { latitud, longitud },
    }),
  updateAvailability: (token: string, esta_disponible: boolean) =>
    apiFetch<Technician>("/api/v1/tecnicos/yo/disponibilidad", {
      method: "PATCH",
      token,
      body: { esta_disponible },
    }),
  availableServices: (token: string) =>
    apiFetch<Service[]>("/api/v1/tecnicos/yo/servicios-disponibles", { token }),
  notifications: (token: string) =>
    apiFetch<TechnicianServiceNotification[]>("/api/v1/tecnicos/yo/notificaciones", {
      token,
    }),
  nearby: (token: string, latitud: number, longitud: number, radio_metros = 10000) =>
    apiFetch<NearbyTechnician[]>(
      `/api/v1/tecnicos/cercanos${buildQuery({ latitud, longitud, radio_metros })}`,
      { token },
    ),
};

export const companyPortalApi = {
  listServices: (token: string) => servicesApi.list(token),
  getService: (token: string, id: string) => servicesApi.get(token, id),
  createService: (token: string, idempotencyKey: string, body: CreateServicePayload) =>
    servicesApi.create(token, idempotencyKey, body),
  rating: (token: string, id: string) => servicesApi.rating(token, id),
  createRating: (token: string, id: string, body: CreateServiceRatingPayload) =>
    servicesApi.createRating(token, id, body),
  tip: (token: string, id: string) => servicesApi.tip(token, id),
  createTip: (token: string, id: string, body: CreateServiceTipPayload) =>
    servicesApi.createTip(token, id, body),
  evidences: (token: string, estado?: string) =>
    apiFetch<Evidence[]>(`/api/v1/evidencias${buildQuery({ estado })}`, { token }),
  approveEvidence: (token: string, id: string) => evidenceApi.approve(token, id),
  rejectEvidence: (token: string, id: string) => evidenceApi.reject(token, id),
  payments: (token: string) => paymentsApi.list(token),
  generatePayment: (token: string, serviceId: string) =>
    servicesApi.paymentReport(token, serviceId),
};
