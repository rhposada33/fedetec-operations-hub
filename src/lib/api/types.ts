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

export type EvidenceStatus = "PENDIENTE" | "APROBADA" | "RECHAZADA";
export type PaymentStatus = "PENDIENTE" | "GENERADO" | "PAGADO" | "ANULADO";

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type CurrentUser = {
  id: string;
  tecnico_id: string | null;
  empresa_cliente_id: string | null;
  correo: string;
  nombre_completo: string;
  telefono: string | null;
  numero_documento: string | null;
  ciudad: string | null;
  municipio: string | null;
  direccion: string | null;
  eps: string | null;
  arl: string | null;
  tiene_vehiculo: boolean;
  placa_vehiculo: string | null;
  esta_activo: boolean;
  roles: string[];
  fecha_creacion: string;
};

export type DashboardResponse = {
  total_servicios: number;
  servicios_por_estado: Array<{ estado: ServiceStatus | string; total: number }>;
};

export type Company = {
  id: string;
  usuario_id: string | null;
  nombre: string;
  identificacion_tributaria: string | null;
  correo_contacto: string | null;
  telefono_contacto: string | null;
  esta_activa: boolean;
  fecha_creacion: string;
};

export type CompanyCreated = Company & {
  usuario_id: string;
};

export type CreateCompanyPayload = {
  nombre: string;
  identificacion_tributaria?: string | null;
  correo_contacto: string;
  telefono_contacto?: string | null;
  esta_activa?: boolean;
  password: string;
};

export type CreateTechnicianPayload = {
  correo: string;
  contrasena: string;
  nombre_completo: string;
  telefono?: string | null;
  numero_documento?: string | null;
  ciudad?: string | null;
  municipio?: string | null;
  direccion?: string | null;
  eps?: string | null;
  arl?: string | null;
  tiene_vehiculo: boolean;
  placa_vehiculo?: string | null;
};

export type Technician = {
  id: string;
  usuario_id: string;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  esta_disponible: boolean;
  latitud: number | null;
  longitud: number | null;
  fecha_ultima_ubicacion: string | null;
  fecha_creacion: string;
};

export type NearbyTechnician = Technician & {
  distancia_metros: number;
};

export type Service = {
  id: string;
  empresa_cliente_id: string;
  tipo_servicio: number;
  placa_vehiculo: string | null;
  latitud: number;
  longitud: number;
  direccion: string | null;
  fecha_programada: string;
  estado: ServiceStatus;
  clave_idempotencia: string;
  tecnico_aceptado_id: string | null;
  fecha_aceptacion: string | null;
  fecha_inicio: string | null;
  fecha_finalizacion: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

export type PublishedService = Service & {
  notificaciones_creadas: number;
  tecnicos_cercanos: number;
};

export type Evidence = {
  id: string;
  servicio_id: string;
  subido_por_usuario_id: string;
  url_archivo: string;
  tipo_archivo: string | null;
  descripcion: string | null;
  estado_aprobacion: EvidenceStatus;
  aprobado_por_usuario_id: string | null;
  fecha_aprobacion: string | null;
  fecha_creacion: string;
};

export type PaymentReport = {
  id: string;
  servicio_id: string;
  tecnico_id: string;
  empresa_cliente_id: string;
  valor: string | number | null;
  estado: PaymentStatus;
  fecha_generacion: string;
};

export type EvidenceApprovalConfig = {
  modo: "AUTO" | "MANUAL";
  roles_permitidos: string[];
};

export type AppConfiguration = {
  aprobacion_evidencias: EvidenceApprovalConfig;
  fecha_actualizacion: string | null;
};

export type ServiceFilters = {
  estado?: string;
  empresa_cliente_id?: string;
  tecnico_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
};

export type CreateServicePayload = {
  empresa_cliente_id?: string | null;
  tipo_servicio: 1 | 2 | 3;
  placa_vehiculo?: string | null;
  latitud: number;
  longitud: number;
  direccion?: string | null;
  fecha_programada: string;
};

export type ServiceRating = {
  id: string;
  servicio_id: string;
  empresa_cliente_id: string;
  tecnico_id: string;
  puntuacion: number;
  comentario: string | null;
  fecha_calificacion: string;
  fecha_creacion: string;
};

export type CreateServiceRatingPayload = {
  puntuacion: number;
  comentario?: string | null;
};
