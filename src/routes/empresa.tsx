import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Key, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { ErrorState, LoadingState } from "@/components/async-state";
import { companyPortalApi } from "@/lib/api/client";
import { getCompanyApiKey, setCompanyApiKey } from "@/lib/api/storage";
import { formatDate, serviceTypeLabel } from "@/lib/api/format";
import type { CreateServicePayload } from "@/lib/api/types";

export const Route = createFileRoute("/empresa")({
  head: () => ({ meta: [{ title: "Empresa — Fedetec" }] }),
  component: EmpresaPortal,
});

function EmpresaPortal() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKeyState] = useState(() => getCompanyApiKey() ?? "");
  const [draftKey, setDraftKey] = useState(apiKey);
  const [form, setForm] = useState({
    tipo_servicio: "1",
    placa_vehiculo: "",
    latitud: "",
    longitud: "",
    direccion: "",
    fecha_programada: "",
  });

  const services = useQuery({
    queryKey: ["company", "services", apiKey],
    queryFn: () => companyPortalApi.listServices(apiKey),
    enabled: Boolean(apiKey),
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
      return companyPortalApi.createService(apiKey, crypto.randomUUID(), payload);
    },
    onSuccess: () => {
      toast.success("Servicio creado");
      queryClient.invalidateQueries({ queryKey: ["company", "services"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible crear el servicio"),
  });

  function saveKey() {
    setCompanyApiKey(draftKey);
    setApiKeyState(draftKey);
    queryClient.invalidateQueries({ queryKey: ["company"] });
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Portal empresa</h1>
            <p className="text-sm text-muted-foreground">Crea y consulta servicios con API key.</p>
          </div>
          <Building2 className="h-8 w-8 text-primary" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API key</CardTitle>
            <CardDescription>La clave se guarda localmente en este navegador.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={draftKey}
                onChange={(event) => setDraftKey(event.target.value)}
                placeholder="fedetec_..."
              />
            </div>
            <Button onClick={saveKey}>Guardar API key</Button>
          </CardContent>
        </Card>

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
                disabled={!apiKey || createMutation.isPending}
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
                <CardDescription>Servicios asociados a la API key.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => services.refetch()}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              {!apiKey ? (
                <div className="text-sm text-muted-foreground">
                  Guarda una API key para consultar servicios.
                </div>
              ) : services.isLoading ? (
                <LoadingState label="Validando API key..." />
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
