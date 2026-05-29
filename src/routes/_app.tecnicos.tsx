import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, Clock, MapPin, Phone, Plus, Search, Star, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ErrorState, LoadingState } from "@/components/async-state";
import { adminApi, ApiError, authApi } from "@/lib/api/client";
import { formatDate } from "@/lib/api/format";
import type { CreateTechnicianPayload, Technician } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/tecnicos")({
  head: () => ({ meta: [{ title: "Técnicos — Fedetec" }] }),
  component: TecnicosPage,
});

function TecnicosPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => crearFormularioTecnico());
  const technicians = useQuery({
    queryKey: ["admin", "technicians"],
    queryFn: () => adminApi.technicians(token!),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: () => authApi.registerTechnician(construirPayloadTecnico(form)),
    onSuccess: (user) => {
      toast.success(`Técnico creado: ${user.correo}`);
      setForm(crearFormularioTecnico());
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "technicians"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("Ese correo ya está registrado. Usa otro correo para crear el técnico.");
        return;
      }
      toast.error(error instanceof Error ? error.message : "No fue posible crear el técnico");
    },
  });

  const filtered = (technicians.data ?? []).filter((item) =>
    `${item.nombre_completo} ${item.correo}`.toLowerCase().includes(q.toLowerCase()),
  );

  if (technicians.isLoading) return <LoadingState label="Cargando técnicos..." />;
  if (technicians.isError)
    return <ErrorState error={technicians.error} onRetry={() => technicians.refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Técnicos</h1>
          <p className="text-sm text-muted-foreground">
            Red de {filtered.length} técnicos registrados
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar técnico..."
              className="pl-9"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo técnico
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tech) => (
          <TechnicianCard key={tech.id} tech={tech} token={token!} />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo técnico</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Nombre completo"
              value={form.nombre_completo}
              onChange={(value) => setForm({ ...form, nombre_completo: value })}
            />
            <Field
              label="Correo"
              type="email"
              value={form.correo}
              onChange={(value) => setForm({ ...form, correo: value })}
            />
            <Field
              label="Contraseña inicial"
              type="password"
              value={form.contrasena}
              onChange={(value) => setForm({ ...form, contrasena: value })}
            />
            <Field
              label="Teléfono"
              value={form.telefono}
              onChange={(value) => setForm({ ...form, telefono: value })}
            />
            <Field
              label="Documento"
              value={form.numero_documento}
              onChange={(value) => setForm({ ...form, numero_documento: value })}
            />
            <Field
              label="Ciudad"
              value={form.ciudad}
              onChange={(value) => setForm({ ...form, ciudad: value })}
            />
            <Field
              label="Municipio"
              value={form.municipio}
              onChange={(value) => setForm({ ...form, municipio: value })}
            />
            <Field
              label="EPS"
              value={form.eps}
              onChange={(value) => setForm({ ...form, eps: value })}
            />
            <Field
              label="ARL"
              value={form.arl}
              onChange={(value) => setForm({ ...form, arl: value })}
            />
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label>Tiene vehículo</Label>
              <Switch
                checked={form.tiene_vehiculo}
                onCheckedChange={(checked) => setForm({ ...form, tiene_vehiculo: checked })}
              />
            </div>
            <Field
              label="Placa vehículo"
              value={form.placa_vehiculo}
              onChange={(value) => setForm({ ...form, placa_vehiculo: value })}
            />
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Dirección</Label>
              <Input
                value={form.direccion}
                onChange={(event) => setForm({ ...form, direccion: event.target.value })}
              />
            </div>
            <Button
              className="sm:col-span-2"
              disabled={!formularioTecnicoValido(form) || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              <Plus className="mr-2 h-4 w-4" /> Crear técnico
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TechnicianCard({ tech, token }: { tech: Technician; token: string }) {
  const metrics = useQuery({
    queryKey: ["admin", "technician-metrics", tech.id],
    queryFn: () => adminApi.technicianMetrics(token, tech.id),
    enabled: Boolean(token),
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/15 text-primary">
                {tech.nombre_completo
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-semibold">{tech.nombre_completo}</div>
              <div className="truncate text-xs text-muted-foreground">{tech.correo}</div>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${tech.esta_disponible ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
          >
            {tech.esta_disponible ? "Disponible" : "No disponible"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <Stat icon={Phone} label="Teléfono" value={tech.telefono ?? "—"} />
          <Stat icon={Clock} label="Último GPS" value={formatDate(tech.fecha_ultima_ubicacion)} />
          <Stat icon={MapPin} label="Latitud" value={tech.latitud?.toString() ?? "—"} />
          <Stat icon={MapPin} label="Longitud" value={tech.longitud?.toString() ?? "—"} />
        </div>
        <div className="mt-4 border-t border-border pt-4">
          {metrics.isLoading ? (
            <div className="text-xs text-muted-foreground">Cargando rendimiento...</div>
          ) : metrics.isError ? (
            <div className="text-xs text-danger">No fue posible cargar rendimiento.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Stat
                icon={Star}
                label="Calificación"
                value={formatRating(metrics.data?.calificacion_promedio)}
              />
              <Stat
                icon={BadgeCheck}
                label="Completados"
                value={String(metrics.data?.servicios_completados ?? 0)}
              />
              <Stat
                icon={Clock}
                label="Aceptados"
                value={String(metrics.data?.servicios_aceptados ?? 0)}
              />
              <Stat
                icon={XCircle}
                label="Rechazados"
                value={String(metrics.data?.servicios_rechazados ?? 0)}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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

function Stat({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function formatRating(value: number | null | undefined) {
  return value == null ? "—" : `${value.toFixed(1)}/5`;
}

type TecnicoForm = {
  correo: string;
  contrasena: string;
  nombre_completo: string;
  telefono: string;
  numero_documento: string;
  ciudad: string;
  municipio: string;
  direccion: string;
  eps: string;
  arl: string;
  tiene_vehiculo: boolean;
  placa_vehiculo: string;
};

function crearFormularioTecnico(): TecnicoForm {
  return {
    correo: "",
    contrasena: "",
    nombre_completo: "",
    telefono: "",
    numero_documento: "",
    ciudad: "",
    municipio: "",
    direccion: "",
    eps: "",
    arl: "",
    tiene_vehiculo: false,
    placa_vehiculo: "",
  };
}

function formularioTecnicoValido(form: TecnicoForm) {
  return (
    form.nombre_completo.trim().length > 0 &&
    form.correo.trim().length > 0 &&
    form.contrasena.length >= 8
  );
}

function construirPayloadTecnico(form: TecnicoForm): CreateTechnicianPayload {
  return {
    correo: form.correo.trim(),
    contrasena: form.contrasena,
    nombre_completo: form.nombre_completo.trim(),
    telefono: form.telefono.trim() || null,
    numero_documento: form.numero_documento.trim() || null,
    ciudad: form.ciudad.trim() || null,
    municipio: form.municipio.trim() || null,
    direccion: form.direccion.trim() || null,
    eps: form.eps.trim() || null,
    arl: form.arl.trim() || null,
    tiene_vehiculo: form.tiene_vehiculo,
    placa_vehiculo: form.placa_vehiculo.trim() || null,
  };
}
