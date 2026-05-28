import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut, MapPin, Play, SquareCheck, Upload, CalendarClock, X } from "lucide-react";
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
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/tecnico")({
  head: () => ({ meta: [{ title: "Técnico — Fedetec" }] }),
  component: TecnicoPortal,
});

function TecnicoPortal() {
  const { token, user, isTechnician, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serviceId, setServiceId] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fechaPropuesta, setFechaPropuesta] = useState("");
  const [evidence, setEvidence] = useState({ url_archivo: "", tipo_archivo: "", descripcion: "" });

  const me = useQuery({
    queryKey: ["technician", "me"],
    queryFn: () => technicianApi.me(token!),
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
      if (action === "accept") return servicesApi.accept(token!, serviceId);
      if (action === "reject") return servicesApi.reject(token!, serviceId, motivo);
      if (action === "reschedule")
        return servicesApi.reschedule(token!, serviceId, fechaPropuesta, motivo);
      if (action === "start") return servicesApi.start(token!, serviceId);
      if (action === "finish") return servicesApi.finish(token!, serviceId);
      return servicesApi.createEvidence(token!, serviceId, evidence);
    },
    onSuccess: () => toast.success("Acción ejecutada"),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible ejecutar la acción"),
  });

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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
              <CardTitle>Acciones de servicio</CardTitle>
              <CardDescription>Ingresa el ID del servicio asignado o publicado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Servicio ID" value={serviceId} onChange={setServiceId} />
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
                <Button disabled={!serviceId} onClick={() => actionMutation.mutate("accept")}>
                  Aceptar
                </Button>
                <Button
                  variant="destructive"
                  disabled={!serviceId}
                  onClick={() => actionMutation.mutate("reject")}
                >
                  <X className="mr-2 h-4 w-4" /> Rechazar
                </Button>
                <Button
                  variant="outline"
                  disabled={!serviceId || !fechaPropuesta}
                  onClick={() => actionMutation.mutate("reschedule")}
                >
                  <CalendarClock className="mr-2 h-4 w-4" /> Reprogramar
                </Button>
                <Button
                  variant="outline"
                  disabled={!serviceId}
                  onClick={() => actionMutation.mutate("start")}
                >
                  <Play className="mr-2 h-4 w-4" /> Iniciar
                </Button>
                <Button
                  variant="outline"
                  disabled={!serviceId}
                  onClick={() => actionMutation.mutate("finish")}
                >
                  <SquareCheck className="mr-2 h-4 w-4" /> Finalizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Subir evidencia</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Servicio ID" value={serviceId} onChange={setServiceId} />
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
            disabled={!serviceId || !evidence.url_archivo}
            onClick={() => actionMutation.mutate("evidence")}
          >
            <Upload className="mr-2 h-4 w-4" /> Registrar evidencia
          </Button>
        </CardContent>
      </Card>
    </PortalShell>
  );
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
