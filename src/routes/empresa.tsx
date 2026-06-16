import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Gift,
  LogOut,
  Plus,
  RefreshCcw,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { ErrorState, LoadingState } from "@/components/async-state";
import { ApiError, companyPortalApi } from "@/lib/api/client";
import { formatCurrency, formatDate, serviceTypeLabel, statusVariant } from "@/lib/api/format";
import type { CreateServicePayload, Service, ServiceRating, ServiceTip } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/empresa")({
  head: () => ({ meta: [{ title: "Empresa — Fedetec" }] }),
  component: EmpresaPortal,
});

function EmpresaPortal() {
  const { token, user, isCompany, isLoading, logout } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    tipo_servicio: "1",
    placa_vehiculo: "",
    latitud: "",
    longitud: "",
    direccion: "",
    fecha_programada: "",
  });

  const services = useQuery({
    queryKey: ["company", "services", token],
    queryFn: () => companyPortalApi.listServices(token!),
    enabled: Boolean(token && isCompany),
    retry: false,
  });
  const report = useCompanyReport(token, services.data ?? [], Boolean(token && isCompany));

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: CreateServicePayload = {
        tipo_servicio: Number(form.tipo_servicio) as 1 | 2 | 3,
        placa_vehiculo: form.placa_vehiculo || null,
        latitud: Number(form.latitud),
        longitud: Number(form.longitud),
        direccion: form.direccion || null,
        fecha_programada: new Date(form.fecha_programada).toISOString(),
      };
      return companyPortalApi.createService(token!, crypto.randomUUID(), payload);
    },
    onSuccess: () => {
      toast.success("Servicio creado");
      queryClient.invalidateQueries({ queryKey: ["company", "services"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible crear el servicio"),
  });

  if (isLoading) return <LoadingState label="Validando sesión..." />;

  if (!token || !isCompany) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login de empresa requerido</CardTitle>
            <CardDescription>
              Inicia sesión con el correo y contraseña de la empresa cliente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Portal empresa</h1>
            <p className="text-sm text-muted-foreground">{user?.correo}</p>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Salir
            </Button>
          </div>
        </div>

        <CompanyReport report={report} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Crear servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field
                label="Tipo servicio (1, 2, 3)"
                value={form.tipo_servicio}
                onChange={(value) => setForm({ ...form, tipo_servicio: value })}
              />
              <Field
                label="Placa vehículo"
                value={form.placa_vehiculo}
                onChange={(value) => setForm({ ...form, placa_vehiculo: value })}
              />
              <Field
                label="Latitud"
                value={form.latitud}
                onChange={(value) => setForm({ ...form, latitud: value })}
              />
              <Field
                label="Longitud"
                value={form.longitud}
                onChange={(value) => setForm({ ...form, longitud: value })}
              />
              <Field
                label="Fecha programada"
                type="datetime-local"
                value={form.fecha_programada}
                onChange={(value) => setForm({ ...form, fecha_programada: value })}
              />
              <Textarea
                placeholder="Dirección"
                value={form.direccion}
                onChange={(event) => setForm({ ...form, direccion: event.target.value })}
              />
              <Button
                className="w-full"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                <Plus className="mr-2 h-4 w-4" /> Crear servicio
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Servicios</CardTitle>
                <CardDescription>Servicios asociados a tu empresa.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => services.refetch()}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              {services.isLoading ? (
                <LoadingState label="Cargando servicios..." />
              ) : services.isError ? (
                <ErrorState error={services.error} onRetry={() => services.refetch()} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="py-2">ID</th>
                        <th>Tipo</th>
                        <th>Placa</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Calificación</th>
                        <th>Propina</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(services.data ?? []).map((service) => (
                        <tr key={service.id} className="border-t border-border">
                          <td className="py-3 font-mono text-xs">{service.id.slice(0, 8)}</td>
                          <td>
                            {service.tipo_servicio_nombre ||
                              serviceTypeLabel(service.tipo_servicio)}
                          </td>
                          <td>{service.placa_vehiculo ?? "—"}</td>
                          <td>{formatDate(service.fecha_programada)}</td>
                          <td>
                            <StatusBadge status={service.estado} />
                          </td>
                          <td className="min-w-[260px] py-3">
                            <RatingCell token={token} service={service} />
                          </td>
                          <td className="min-w-[220px] py-3">
                            <TipCell token={token} service={service} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const ESTADOS_CALIFICABLES = new Set(["FINALIZADO", "VALIDADO", "PAGO_GENERADO"]);

function useCompanyReport(token: string | null, services: Service[], enabled: boolean) {
  const eligibleServices = services.filter((service) => ESTADOS_CALIFICABLES.has(service.estado));
  const ratingQueries = useQueries({
    queries: eligibleServices.map((service) => ({
      queryKey: ["company", "service-rating", service.id],
      queryFn: async () => {
        try {
          return await companyPortalApi.rating(token!, service.id);
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) return null;
          throw error;
        }
      },
      enabled,
      retry: false,
    })),
  });

  const ratings = ratingQueries
    .map((query) => query.data)
    .filter((rating): rating is ServiceRating => Boolean(rating));
  const total = services.length;
  const completed = services.filter((service) => ESTADOS_CALIFICABLES.has(service.estado)).length;
  const assigned = services.filter((service) => service.tecnico_aceptado_id).length;
  const validated = services.filter((service) =>
    ["VALIDADO", "PAGO_GENERADO"].includes(service.estado),
  ).length;
  const paid = services.filter((service) => service.estado === "PAGO_GENERADO").length;
  const byStatus = services.reduce<Record<string, number>>((acc, service) => {
    acc[service.estado] = (acc[service.estado] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total,
    active: services.filter((service) =>
      ["CREADO", "DISPONIBLE", "ACEPTADO", "EN_PROCESO", "REPROGRAMACION_SOLICITADA"].includes(
        service.estado,
      ),
    ).length,
    assigned,
    completed,
    validated,
    paid,
    pendingRating: Math.max(eligibleServices.length - ratings.length, 0),
    rated: ratings.length,
    averageRating:
      ratings.length > 0
        ? ratings.reduce((totalRating, rating) => totalRating + rating.puntuacion, 0) /
          ratings.length
        : null,
    completionRate: percentage(completed, total),
    assignmentRate: percentage(assigned, total),
    validationRate: percentage(validated, completed),
    paymentRate: percentage(paid, completed),
    ratingCoverage: percentage(ratings.length, eligibleServices.length),
    byStatus,
    isLoadingRatings: ratingQueries.some((query) => query.isLoading),
  };
}

function CompanyReport({ report }: { report: ReturnType<typeof useCompanyReport> }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Reportes y cumplimiento</CardTitle>
            <CardDescription>Resumen operativo de servicios y calificaciones.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric
            label="Servicios"
            value={String(report.total)}
            hint={`${report.active} activos`}
          />
          <Metric label="Asignación" value={`${report.assignmentRate}%`} hint="Con técnico" />
          <Metric
            label="Finalización"
            value={`${report.completionRate}%`}
            hint={`${report.completed} cerrados`}
          />
          <Metric
            label="Validación"
            value={`${report.validationRate}%`}
            hint={`${report.validated} validados`}
          />
          <Metric
            label="Pago generado"
            value={`${report.paymentRate}%`}
            hint={`${report.paid} servicios`}
          />
          <Metric
            label="Calificación"
            value={report.averageRating == null ? "—" : `${report.averageRating.toFixed(1)}/5`}
            hint={report.isLoadingRatings ? "Consultando..." : `${report.rated} calificadas`}
          />
          <Metric
            label="Cobertura rating"
            value={`${report.ratingCoverage}%`}
            hint="Servicios calificables"
          />
          <Metric
            label="Pendientes rating"
            value={String(report.pendingRating)}
            hint="Por calificar"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Distribución por estado
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(statusVariant).map(([status, meta]) => {
              const total = report.byStatus[status] ?? 0;
              if (total === 0) return null;
              return (
                <div key={status} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{meta.label}</span>
                    <span className="text-lg font-semibold">{total}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percentage(total, report.total)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function percentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function RatingCell({ token, service }: { token: string; service: Service }) {
  const queryClient = useQueryClient();
  const [puntuacion, setPuntuacion] = useState(5);
  const [comentario, setComentario] = useState("");

  const rating = useQuery({
    queryKey: ["company", "service-rating", service.id],
    queryFn: () => companyPortalApi.rating(token, service.id),
    enabled: ESTADOS_CALIFICABLES.has(service.estado),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: () =>
      companyPortalApi.createRating(token, service.id, {
        puntuacion,
        comentario: comentario.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Calificación registrada");
      queryClient.invalidateQueries({ queryKey: ["company", "service-rating", service.id] });
      setComentario("");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible calificar"),
  });

  if (!ESTADOS_CALIFICABLES.has(service.estado)) {
    return <span className="text-xs text-muted-foreground">Disponible al finalizar</span>;
  }

  if (rating.isLoading) {
    return <span className="text-xs text-muted-foreground">Consultando...</span>;
  }

  if (rating.data) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs font-medium text-success">
          <Star className="h-3.5 w-3.5 fill-current" />
          {rating.data.puntuacion}/5
        </div>
        {rating.data.comentario && (
          <div className="max-w-xs text-xs text-muted-foreground">{rating.data.comentario}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          value={puntuacion}
          onChange={(event) => setPuntuacion(Number(event.target.value))}
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value}/5
            </option>
          ))}
        </select>
        <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          <Star className="mr-1.5 h-3.5 w-3.5" /> Calificar
        </Button>
      </div>
      <Input
        value={comentario}
        onChange={(event) => setComentario(event.target.value)}
        placeholder="Comentario opcional"
        className="h-8 text-xs"
      />
    </div>
  );
}

function TipCell({ token, service }: { token: string; service: Service }) {
  const queryClient = useQueryClient();
  const [valor, setValor] = useState("");

  const tip = useQuery<ServiceTip | null>({
    queryKey: ["company", "service-tip", service.id],
    queryFn: async () => {
      try {
        return await companyPortalApi.tip(token, service.id);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: ESTADOS_CALIFICABLES.has(service.estado),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: () => companyPortalApi.createTip(token, service.id, { valor: Number(valor) }),
    onSuccess: () => {
      toast.success("Propina registrada");
      queryClient.invalidateQueries({ queryKey: ["company", "service-tip", service.id] });
      setValor("");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible registrar la propina"),
  });

  const amount = Number(valor);
  const validAmount = Number.isFinite(amount) && amount >= 0 && valor.trim().length > 0;

  if (!ESTADOS_CALIFICABLES.has(service.estado)) {
    return <span className="text-xs text-muted-foreground">Disponible al finalizar</span>;
  }

  if (tip.isLoading) {
    return <span className="text-xs text-muted-foreground">Consultando...</span>;
  }

  if (tip.data) {
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-success">
        <Gift className="h-3.5 w-3.5" />
        {formatCurrency(tip.data.valor)}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={valor}
        onChange={(event) => setValor(event.target.value)}
        type="number"
        min="0"
        step="1"
        placeholder="COP"
        className="h-8 w-24 text-xs"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={!validAmount || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        <Gift className="mr-1.5 h-3.5 w-3.5" /> Dar
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
