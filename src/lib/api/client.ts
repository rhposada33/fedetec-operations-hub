import type {
  AppConfiguration,
  Company,
  CompanyCreated,
  CreateServicePayload,
  CurrentUser,
  DashboardResponse,
  Evidence,
  NearbyTechnician,
  PaymentReport,
  PublishedService,
  Service,
  ServiceFilters,
  Technician,
  TokenResponse,
} from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(
  /\/$/,
  "",
);

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
  apiKey?: string | null;
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
  if (options.apiKey) headers.set("X-API-Key", options.apiKey);

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
};

export const adminApi = {
  dashboard: (token: string, filters: ServiceFilters = {}) =>
    apiFetch<DashboardResponse>(`/api/v1/admin/dashboard${buildQuery(filters)}`, { token }),
  services: (token: string, filters: ServiceFilters = {}) =>
    apiFetch<Service[]>(`/api/v1/admin/servicios${buildQuery(filters)}`, { token }),
  technicians: (token: string, esta_disponible?: boolean | null) =>
    apiFetch<Technician[]>(`/api/v1/admin/tecnicos${buildQuery({ esta_disponible })}`, { token }),
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
};

export const companiesApi = {
  create: (token: string, body: Partial<Company>) =>
    apiFetch<CompanyCreated>("/api/v1/empresas-cliente", { method: "POST", token, body }),
  update: (token: string, id: string, body: Partial<Company>) =>
    apiFetch<Company>(`/api/v1/empresas-cliente/${id}`, {
      method: "PATCH",
      token,
      body,
    }),
};

export const servicesApi = {
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
  nearby: (token: string, latitud: number, longitud: number, radio_metros = 10000) =>
    apiFetch<NearbyTechnician[]>(
      `/api/v1/tecnicos/cercanos${buildQuery({ latitud, longitud, radio_metros })}`,
      { token },
    ),
};

export const companyPortalApi = {
  listServices: (apiKey: string) => apiFetch<Service[]>("/api/v1/servicios", { apiKey }),
  getService: (apiKey: string, id: string) =>
    apiFetch<Service>(`/api/v1/servicios/${id}`, { apiKey }),
  createService: (apiKey: string, idempotencyKey: string, body: CreateServicePayload) =>
    apiFetch<Service>("/api/v1/servicios", {
      method: "POST",
      apiKey,
      headers: { "Idempotency-Key": idempotencyKey },
      body,
    }),
};
