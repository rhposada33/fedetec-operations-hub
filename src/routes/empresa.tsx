import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, LogOut, Plus, RefreshCcw, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { ErrorState, LoadingState } from "@/components/async-state";
import { companyPortalApi } from "@/lib/api/client";
import { formatDate, serviceTypeLabel } from "@/lib/api/format";
import type { CreateServicePayload, Service } from "@/lib/api/types";
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
                      </tr>
                    </thead>
                    <tbody>
                      {(services.data ?? []).map((service) => (
                        <tr key={service.id} className="border-t border-border">
                          <td className="py-3 font-mono text-xs">{service.id.slice(0, 8)}</td>
                          <td>{serviceTypeLabel(service.tipo_servicio)}</td>
                          <td>{service.placa_vehiculo ?? "—"}</td>
                          <td>{formatDate(service.fecha_programada)}</td>
                          <td>
                            <StatusBadge status={service.estado} />
                          </td>
                          <td className="min-w-[260px] py-3">
                            <RatingCell token={token} service={service} />
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
