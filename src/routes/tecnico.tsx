import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  LogOut,
  MapPin,
  Play,
  RefreshCw,
  SquareCheck,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingState } from "@/components/async-state";
import { servicesApi, technicianApi } from "@/lib/api/client";
import { formatDate } from "@/lib/api/format";
import type { Service } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/tecnico")({
  head: () => ({ meta: [{ title: "Técnico — Fedetec" }] }),
  component: TecnicoPortal,
});

function TecnicoPortal() {
  const { token, user, isTechnician, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fechaPropuesta, setFechaPropuesta] = useState("");
  const [evidence, setEvidence] = useState({ url_archivo: "", tipo_archivo: "", descripcion: "" });
  const selectedServiceId = selectedService?.id ?? "";

  const me = useQuery({
    queryKey: ["technician", "me"],
    queryFn: () => technicianApi.me(token!),
    enabled: Boolean(token && isTechnician),
  });
  const availableServices = useQuery({
    queryKey: ["technician", "available-services"],
    queryFn: () => technicianApi.availableServices(token!),
    enabled: Boolean(token && isTechnician),
  });
  const notifications = useQuery({
    queryKey: ["technician", "notifications"],
    queryFn: () => technicianApi.notifications(token!),
    enabled: Boolean(token && isTechnician),
  });
  const metrics = useQuery({
    queryKey: ["technician", "metrics"],
    queryFn: () => technicianApi.metrics(token!),
    enabled: Boolean(token && isTechnician),
  });

  const availabilityMutation = useMutation({
    mutationFn: (value: boolean) => technicianApi.updateAvailability(token!, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["technician", "me"] }),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar"),
  });
  const locationMutation = useMutation({
    mutationFn: () => technicianApi.updateLocation(token!, Number(latitud), Number(longitud)),
    onSuccess: () => {
      toast.success("Ubicación actualizada");
      queryClient.invalidateQueries({ queryKey: ["technician", "me"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar GPS"),
  });
  const actionMutation = useMutation({
    mutationFn: (action: "accept" | "reject" | "reschedule" | "start" | "finish" | "evidence") => {
      if (action === "accept") return servicesApi.accept(token!, selectedServiceId);
      if (action === "reject") return servicesApi.reject(token!, selectedServiceId, motivo);
      if (action === "reschedule")
        return servicesApi.reschedule(token!, selectedServiceId, fechaPropuesta, motivo);
      if (action === "start") return servicesApi.start(token!, selectedServiceId);
      if (action === "finish") return servicesApi.finish(token!, selectedServiceId);
      return servicesApi.createEvidence(token!, selectedServiceId, evidence);
    },
    onSuccess: async (service) => {
      toast.success("Acción ejecutada");
      if (
        service &&
        typeof service === "object" &&
        "estado" in service &&
        "empresa_cliente_id" in service
      ) {
        setSelectedService(service as Service);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["technician", "available-services"] }),
        queryClient.invalidateQueries({ queryKey: ["technician", "notifications"] }),
      ]);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible ejecutar la acción"),
  });

  const availableServiceIds = new Set((availableServices.data ?? []).map((service) => service.id));
  const operationalServices = (notifications.data ?? [])
    .map((notification) => notification.servicio)
    .filter((service) => !availableServiceIds.has(service.id))
    .filter((service) =>
      ["ACEPTADO", "EN_PROCESO", "REPROGRAMACION_SOLICITADA"].includes(service.estado),
    );

  if (!token || !isTechnician) {
    return (
      <PortalShell>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Inicia sesión como técnico para acceder.
          </CardContent>
        </Card>
        <Button asChild>
          <Link to="/login">Iniciar sesión</Link>
        </Button>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      right={
        <Button
          variant="outline"
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Salir
        </Button>
      }
    >
      {me.isLoading ? (
        <LoadingState label="Cargando perfil técnico..." />
      ) : me.isError ? (
        <ErrorState error={me.error} onRetry={() => me.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>{user?.nombre_completo}</CardTitle>
              <CardDescription>{user?.correo}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-medium">Disponibilidad</div>
                  <div className="text-xs text-muted-foreground">
                    Controla si puedes recibir servicios.
                  </div>
                </div>
                <Switch
                  checked={me.data?.esta_disponible ?? false}
                  onCheckedChange={(value) => availabilityMutation.mutate(value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Info label="Latitud" value={me.data?.latitud?.toString() ?? "—"} />
                <Info label="Longitud" value={me.data?.longitud?.toString() ?? "—"} />
                <Info label="Último GPS" value={formatDate(me.data?.fecha_ultima_ubicacion)} />
                <Info label="Teléfono" value={me.data?.telefono ?? "—"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rendimiento</CardTitle>
              <CardDescription>Calificación y actividad acumulada.</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.isLoading ? (
                <div className="text-sm text-muted-foreground">Cargando métricas...</div>
              ) : metrics.isError ? (
                <div className="text-sm text-danger">No fue posible cargar rendimiento.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Info
                    label="Calificación"
                    value={formatRating(metrics.data?.calificacion_promedio)}
                  />
                  <Info
                    label="Completados"
                    value={String(metrics.data?.servicios_completados ?? 0)}
                  />
                  <Info label="Aceptados" value={String(metrics.data?.servicios_aceptados ?? 0)} />
                  <Info
                    label="Rechazados"
                    value={String(metrics.data?.servicios_rechazados ?? 0)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actualizar GPS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Latitud" value={latitud} onChange={setLatitud} />
              <Field label="Longitud" value={longitud} onChange={setLongitud} />
              <Button
                className="w-full"
                disabled={!latitud || !longitud}
                onClick={() => locationMutation.mutate()}
              >
                <MapPin className="mr-2 h-4 w-4" /> Guardar ubicación
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Servicio seleccionado</CardTitle>
              <CardDescription>
                Usa la bandeja para seleccionar un servicio y ejecutar acciones.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedService ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {selectedService.id}
                        </div>
                        <div className="mt-1 font-semibold">
                          {serviceTypeLabel(selectedService.tipo_servicio)}
                        </div>
                      </div>
                      <StatusBadge status={selectedService.estado} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <Info label="Placa" value={selectedService.placa_vehiculo ?? "—"} />
                      <Info
                        label="Programado"
                        value={formatDate(selectedService.fecha_programada)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Selecciona un servicio desde la bandeja.
                </div>
              )}
              <Textarea
                placeholder="Motivo para rechazo/reprogramación"
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
              />
              <Field
                label="Fecha propuesta ISO"
                value={fechaPropuesta}
                onChange={setFechaPropuesta}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  disabled={!selectedServiceId || selectedService?.estado !== "DISPONIBLE"}
                  onClick={() => actionMutation.mutate("accept")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aceptar
                </Button>
                <Button
                  variant="destructive"
                  disabled={!selectedServiceId || selectedService?.estado !== "DISPONIBLE"}
                  onClick={() => actionMutation.mutate("reject")}
                >
                  <X className="mr-2 h-4 w-4" /> Rechazar
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    !selectedServiceId ||
                    !fechaPropuesta ||
                    !["DISPONIBLE", "ACEPTADO"].includes(selectedService?.estado ?? "")
                  }
                  onClick={() => actionMutation.mutate("reschedule")}
                >
                  <CalendarClock className="mr-2 h-4 w-4" /> Reprogramar
                </Button>
                <Button
                  variant="outline"
                  disabled={!selectedServiceId || selectedService?.estado !== "ACEPTADO"}
                  onClick={() => actionMutation.mutate("start")}
                >
                  <Play className="mr-2 h-4 w-4" /> Iniciar
                </Button>
                <Button
                  variant="outline"
                  disabled={!selectedServiceId || selectedService?.estado !== "EN_PROCESO"}
                  onClick={() => actionMutation.mutate("finish")}
                >
                  <SquareCheck className="mr-2 h-4 w-4" /> Finalizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Bandeja de servicios</CardTitle>
              <CardDescription>Servicios disponibles para aceptar o rechazar.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                availableServices.refetch();
                notifications.refetch();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            {availableServices.isLoading ? (
              <LoadingState label="Cargando servicios disponibles..." />
            ) : availableServices.isError ? (
              <ErrorState
                error={availableServices.error}
                onRetry={() => availableServices.refetch()}
              />
            ) : availableServices.data?.length ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {availableServices.data.map((service) => (
                  <ServiceInboxCard
                    key={service.id}
                    service={service}
                    selected={selectedServiceId === service.id}
                    onSelect={() => setSelectedService(service)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No hay servicios disponibles para tu perfil.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servicios en curso</CardTitle>
            <CardDescription>
              Servicios aceptados o en proceso desde tus notificaciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.isLoading ? (
              <LoadingState label="Cargando notificaciones..." />
            ) : notifications.isError ? (
              <ErrorState error={notifications.error} onRetry={() => notifications.refetch()} />
            ) : operationalServices.length ? (
              <div className="space-y-3">
                {operationalServices.map((service) => (
                  <ServiceInboxCard
                    key={service.id}
                    service={service}
                    selected={selectedServiceId === service.id}
                    onSelect={() => setSelectedService(service)}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No tienes servicios aceptados o en proceso.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subir evidencia</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Servicio</Label>
            <div className="flex h-10 items-center rounded-md border border-border bg-muted/30 px-3 font-mono text-xs">
              {selectedServiceId || "Selecciona un servicio"}
            </div>
          </div>
          <Field
            label="URL archivo"
            value={evidence.url_archivo}
            onChange={(value) => setEvidence({ ...evidence, url_archivo: value })}
          />
          <Field
            label="Tipo archivo"
            value={evidence.tipo_archivo}
            onChange={(value) => setEvidence({ ...evidence, tipo_archivo: value })}
          />
          <Field
            label="Descripción"
            value={evidence.descripcion}
            onChange={(value) => setEvidence({ ...evidence, descripcion: value })}
          />
          <Button
            className="md:col-span-4"
            disabled={!selectedServiceId || !evidence.url_archivo}
            onClick={() => actionMutation.mutate("evidence")}
          >
            <Upload className="mr-2 h-4 w-4" /> Registrar evidencia
          </Button>
        </CardContent>
      </Card>
    </PortalShell>
  );
}

function formatRating(value: number | null | undefined) {
  return value == null ? "—" : `${value.toFixed(1)}/5`;
}

function ServiceInboxCard({
  service,
  selected,
  onSelect,
  compact = false,
}: {
  service: Service;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-3 text-left transition hover:border-primary hover:bg-primary/5 ${
        selected ? "border-primary bg-primary/5" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-mono text-xs text-muted-foreground">{service.id}</div>
          <div className="mt-1 font-semibold text-text">
            {serviceTypeLabel(service.tipo_servicio)}
          </div>
        </div>
        <StatusBadge status={service.estado} />
      </div>
      <div className={`mt-3 grid gap-2 text-xs ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
        <Info label="Programado" value={formatDate(service.fecha_programada)} />
        {!compact && <Info label="Placa" value={service.placa_vehiculo ?? "—"} />}
        <Info label="Dirección" value={service.direccion ?? "—"} />
        {!compact && <Info label="Empresa" value={service.empresa_cliente_id.slice(0, 8)} />}
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "DISPONIBLE"
      ? "bg-secondary/10 text-secondary"
      : status === "ACEPTADO"
        ? "bg-success/10 text-success"
        : status === "EN_PROCESO"
          ? "bg-warning/10 text-warning"
          : "bg-muted text-muted-foreground";

  return (
    <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function serviceTypeLabel(type: number) {
  if (type === 1) return "Instalación";
  if (type === 2) return "Mantenimiento";
  if (type === 3) return "Soporte";
  return `Tipo ${type}`;
}

function PortalShell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Portal técnico</h1>
            <p className="text-sm text-muted-foreground">
              Operación de campo y ejecución de servicios.
            </p>
          </div>
          {right}
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 break-all font-medium">{value}</div>
    </div>
  );
}
