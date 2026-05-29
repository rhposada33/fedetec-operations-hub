import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Filter,
  Eye,
  Radio,
  Receipt,
  Plus,
  Pencil,
  MapPin,
  LocateFixed,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";
import { ErrorState, LoadingState } from "@/components/async-state";
import { adminApi, servicesApi } from "@/lib/api/client";
import { formatDate, serviceTypeLabel, statusVariant } from "@/lib/api/format";
import type { CreateServicePayload, Service, ServiceStatus } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/servicios")({
  head: () => ({ meta: [{ title: "Servicios — Fedetec" }] }),
  component: ServiciosPage,
});

function ServiciosPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [empresaClienteId, setEmpresaClienteId] = useState("all");
  const [tecnicoId, setTecnicoId] = useState("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [selected, setSelected] = useState<Service | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState(() => crearFormularioServicio());
  const [createForm, setCreateForm] = useState(() => crearFormularioServicio());
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const serviceFilters = useMemo(
    () => ({
      estado: status === "all" ? undefined : status,
      empresa_cliente_id: empresaClienteId === "all" ? undefined : empresaClienteId,
      tecnico_id: tecnicoId === "all" ? undefined : tecnicoId,
      fecha_desde: fechaDesde ? new Date(fechaDesde).toISOString() : undefined,
      fecha_hasta: fechaHasta ? new Date(fechaHasta).toISOString() : undefined,
    }),
    [empresaClienteId, fechaDesde, fechaHasta, status, tecnicoId],
  );

  const servicesQuery = useQuery({
    queryKey: ["admin", "services", serviceFilters],
    queryFn: () => adminApi.services(token!, serviceFilters),
    enabled: Boolean(token),
  });

  const companiesQuery = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: () => adminApi.companies(token!, true),
    enabled: Boolean(token),
  });

  const techniciansQuery = useQuery({
    queryKey: ["admin", "technicians"],
    queryFn: () => adminApi.technicians(token!),
    enabled: Boolean(token),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => servicesApi.publish(token!, id),
    onSuccess: () => {
      toast.success("Servicio publicado");
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible publicar"),
  });

  const paymentMutation = useMutation({
    mutationFn: (id: string) => servicesApi.paymentReport(token!, id),
    onSuccess: () => {
      toast.success("Reporte de pago generado");
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible generar pago"),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = construirPayloadServicio(createForm);
      return servicesApi.create(token!, idempotencyKey, payload);
    },
    onSuccess: () => {
      toast.success("Servicio creado");
      setCreateForm(crearFormularioServicio(createForm.empresa_cliente_id));
      setIdempotencyKey(crypto.randomUUID());
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible crear el servicio"),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("Servicio no seleccionado");
      return servicesApi.update(token!, editing.id, construirPayloadServicio(editForm));
    },
    onSuccess: (service) => {
      toast.success("Servicio actualizado");
      setEditing(null);
      setEditOpen(false);
      setSelected((current) => (current?.id === service.id ? service : current));
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar el servicio"),
  });

  const filtered = useMemo(() => {
    const list = servicesQuery.data ?? [];
    const term = q.toLowerCase();
    return list.filter(
      (service) =>
        !term ||
        service.id.toLowerCase().includes(term) ||
        service.placa_vehiculo?.toLowerCase().includes(term) ||
        service.empresa_cliente_id.toLowerCase().includes(term) ||
        service.tecnico_aceptado_id?.toLowerCase().includes(term),
    );
  }, [q, servicesQuery.data]);

  if (servicesQuery.isLoading) return <LoadingState label="Cargando servicios..." />;
  if (servicesQuery.isError)
    return <ErrorState error={servicesQuery.error} onRetry={() => servicesQuery.refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Servicios</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} servicios encontrados</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo servicio
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, empresa, placa o técnico..."
                className="pl-9"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusVariant).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={empresaClienteId} onValueChange={setEmpresaClienteId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {(companiesQuery.data ?? []).map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tecnicoId} onValueChange={setTecnicoId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los técnicos</SelectItem>
                {(techniciansQuery.data ?? []).map((technician) => (
                  <SelectItem key={technician.id} value={technician.id}>
                    {technician.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Desde</Label>
              <Input
                type="date"
                className="w-[160px]"
                value={fechaDesde}
                onChange={(event) => setFechaDesde(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Hasta</Label>
              <Input
                type="date"
                className="w-[160px]"
                value={fechaHasta}
                onChange={(event) => setFechaHasta(event.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus("all");
                setEmpresaClienteId("all");
                setTecnicoId("all");
                setFechaDesde("");
                setFechaHasta("");
                setQ("");
              }}
            >
              Limpiar
            </Button>
            <Button variant="outline" size="sm" onClick={() => servicesQuery.refetch()}>
              <Filter className="mr-2 h-4 w-4" /> Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Placa</th>
                  <th className="px-4 py-3 font-medium">Técnico</th>
                  <th className="px-4 py-3 font-medium">Programado</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((service) => (
                  <tr
                    key={service.id}
                    className="border-t border-border transition hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{service.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {service.empresa_cliente_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {serviceTypeLabel(service.tipo_servicio)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{service.placa_vehiculo ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {service.tecnico_aceptado_id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(service.fecha_programada)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={service.estado as ServiceStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(service)}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!servicioEditable(service)}
                          onClick={() =>
                            abrirEdicion(service, setEditing, setEditForm, setEditOpen)
                          }
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      No hay servicios para los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{selected.id}</SheetTitle>
                <SheetDescription>{serviceTypeLabel(selected.tipo_servicio)}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <StatusBadge status={selected.estado} />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Empresa" value={selected.empresa_cliente_id} />
                  <Info label="Técnico" value={selected.tecnico_aceptado_id ?? "—"} />
                  <Info label="Placa" value={selected.placa_vehiculo ?? "—"} />
                  <Info label="Programado" value={formatDate(selected.fecha_programada)} />
                  <Info label="Ubicación" value={`${selected.latitud}, ${selected.longitud}`} />
                  <Info label="Dirección" value={selected.direccion ?? "—"} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    disabled={!servicioEditable(selected)}
                    onClick={() => abrirEdicion(selected, setEditing, setEditForm, setEditOpen)}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button
                    disabled={publishMutation.isPending || selected.estado !== "CREADO"}
                    onClick={() => publishMutation.mutate(selected.id)}
                  >
                    <Radio className="mr-2 h-4 w-4" /> Publicar
                  </Button>
                  <Button
                    variant="outline"
                    disabled={
                      paymentMutation.isPending ||
                      !["FINALIZADO", "VALIDADO"].includes(selected.estado)
                    }
                    onClick={() => paymentMutation.mutate(selected.id)}
                  >
                    <Receipt className="mr-2 h-4 w-4" /> Generar pago
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuevo servicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <ServicioFormFields
              form={createForm}
              setForm={setCreateForm}
              companies={companiesQuery.data ?? []}
            />
            <Button
              className="w-full"
              disabled={!formularioServicioValido(createForm) || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              <Plus className="mr-2 h-4 w-4" /> Crear servicio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar servicio</DialogTitle>
          </DialogHeader>
          <ServicioFormFields
            form={editForm}
            setForm={setEditForm}
            companies={companiesQuery.data ?? []}
          />
          <Button
            className="w-full"
            disabled={!formularioServicioValido(editForm) || updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            <Pencil className="mr-2 h-4 w-4" /> Guardar cambios
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServicioFormFields({
  form,
  setForm,
  companies,
}: {
  form: ServicioForm;
  setForm: (form: ServicioForm) => void;
  companies: Array<{ id: string; nombre: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Empresa cliente</Label>
        <Select
          value={form.empresa_cliente_id}
          onValueChange={(value) => setForm({ ...form, empresa_cliente_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una empresa" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Tipo de servicio</Label>
        <Select
          value={form.tipo_servicio}
          onValueChange={(value) => setForm({ ...form, tipo_servicio: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{serviceTypeLabel(1)}</SelectItem>
            <SelectItem value="2">{serviceTypeLabel(2)}</SelectItem>
            <SelectItem value="3">{serviceTypeLabel(3)}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Field
        label="Placa vehículo"
        value={form.placa_vehiculo}
        onChange={(value) => setForm({ ...form, placa_vehiculo: value })}
      />
      <Field
        label="Fecha programada"
        type="datetime-local"
        value={form.fecha_programada}
        onChange={(value) => setForm({ ...form, fecha_programada: value })}
      />
      <LocationField form={form} setForm={setForm} />
    </div>
  );
}

function LocationField({
  form,
  setForm,
}: {
  form: ServicioForm;
  setForm: (form: ServicioForm) => void;
}) {
  const [query, setQuery] = useState(form.direccion);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    setQuery(form.direccion);
  }, [form.direccion]);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 3 || text === form.direccion.trim()) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        setSuggestions(await buscarUbicaciones(text, controller.signal));
      } catch (error) {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.direccion, query]);

  const seleccionarUbicacion = (location: PickedLocation) => {
    setForm({
      ...form,
      latitud: String(location.latitud),
      longitud: String(location.longitud),
      direccion: location.direccion,
    });
    setQuery(location.direccion);
    setSuggestions([]);
  };

  const hasLocation =
    coordenadaValida(form.latitud) &&
    coordenadaValida(form.longitud) &&
    form.direccion.trim().length > 0;

  return (
    <div className="space-y-2 sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <Label>Ubicación del servicio</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => setMapOpen(true)}>
          <MapPin className="mr-2 h-4 w-4" /> Seleccionar en mapa
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={query}
          placeholder="Buscar dirección o referencia..."
          onChange={(event) => setQuery(event.target.value)}
        />
        {(searching || suggestions.length > 0) && (
          <div className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-xl">
            {searching ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Buscando...</div>
            ) : (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition hover:bg-primary/10"
                  onClick={() =>
                    seleccionarUbicacion({
                      latitud: suggestion.latitud,
                      longitud: suggestion.longitud,
                      direccion: suggestion.direccion,
                    })
                  }
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{suggestion.direccion}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {hasLocation ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <div className="text-sm font-medium">{form.direccion}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {Number(form.latitud).toFixed(6)}, {Number(form.longitud).toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
          Busca una dirección o selecciona un punto en el mapa.
        </div>
      )}
      <MapPickerDialog
        open={mapOpen}
        onOpenChange={setMapOpen}
        location={
          coordenadaValida(form.latitud) && coordenadaValida(form.longitud)
            ? {
                latitud: Number(form.latitud),
                longitud: Number(form.longitud),
                direccion: form.direccion,
              }
            : null
        }
        onPick={seleccionarUbicacion}
      />
    </div>
  );
}

function MapPickerDialog({
  open,
  onOpenChange,
  location,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: PickedLocation | null;
  onPick: (location: PickedLocation) => void;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [marker, setMarker] = useState<PickedLocation>(location ?? DEFAULT_PICKER_LOCATION);
  const [dragging, setDragging] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (open) setMarker(location ?? DEFAULT_PICKER_LOCATION);
  }, [location, open]);

  const viewport = useMemo(
    () => buildPickerViewport(marker.latitud, marker.longitud),
    [marker.latitud, marker.longitud],
  );
  const markerPoint = projectPickerPoint({ lat: marker.latitud, lng: marker.longitud }, viewport);

  const updateFromPointer = async (clientX: number, clientY: number, reverse = false) => {
    const element = mapRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const picked = pointFromClient(clientX, clientY, rect, viewport);
    const next = {
      latitud: picked.lat,
      longitud: picked.lng,
      direccion: marker.direccion,
    };
    setMarker(next);
    if (!reverse) return;

    setResolving(true);
    const direccion = await resolverDireccion(picked.lat, picked.lng);
    setMarker({ ...next, direccion });
    setResolving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Seleccionar ubicación del servicio</DialogTitle>
        </DialogHeader>
        <div
          ref={mapRef}
          className="relative h-[420px] overflow-hidden rounded-lg border border-border bg-muted"
          onClick={(event) => updateFromPointer(event.clientX, event.clientY, true)}
          onPointerMove={(event) => dragging && updateFromPointer(event.clientX, event.clientY)}
          onPointerUp={async (event) => {
            if (!dragging) return;
            setDragging(false);
            await updateFromPointer(event.clientX, event.clientY, true);
          }}
        >
          <PickerMapTiles viewport={viewport} />
          <div className="absolute inset-0 bg-primary/5" />
          <button
            type="button"
            className="absolute -translate-x-1/2 -translate-y-full cursor-grab touch-none active:cursor-grabbing"
            style={{ left: `${markerPoint.xPercent}%`, top: `${markerPoint.yPercent}%` }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDragging(true);
            }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20">
              <MapPin className="h-5 w-5" />
            </span>
          </button>
          <div className="absolute left-4 top-4 rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 font-medium">
              <LocateFixed className="h-4 w-4 text-primary" />
              Haz clic o arrastra el marcador
            </div>
            <div className="mt-1 text-muted-foreground">
              La dirección se actualiza al mover el marcador.
            </div>
          </div>
          <div className="absolute bottom-3 right-4 rounded-md bg-background/90 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
            © OpenStreetMap contributors
          </div>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="text-sm font-medium">
            {resolving ? "Resolviendo dirección..." : marker.direccion}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {marker.latitud.toFixed(6)}, {marker.longitud.toFixed(6)}
          </div>
        </div>
        <Button
          onClick={() => {
            onPick(marker);
            onOpenChange(false);
          }}
        >
          <MapPin className="mr-2 h-4 w-4" /> Usar esta ubicación
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function PickerMapTiles({ viewport }: { viewport: PickerViewport }) {
  return (
    <div className="absolute inset-0">
      {viewport.tiles.map((tile) => (
        <img
          key={`${viewport.zoom}-${tile.x}-${tile.y}`}
          alt=""
          draggable={false}
          src={`https://tile.openstreetmap.org/${viewport.zoom}/${tile.wrappedX}/${tile.y}.png`}
          className="absolute max-w-none select-none"
          style={{
            left: `${tile.leftPercent}%`,
            top: `${tile.topPercent}%`,
            width: `${tile.sizePercentX}%`,
            height: `${tile.sizePercentY}%`,
          }}
        />
      ))}
    </div>
  );
}

async function buscarUbicaciones(
  query: string,
  signal?: AbortSignal,
): Promise<LocationSuggestion[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("q", query);

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("No fue posible buscar la ubicación");
  const data = (await response.json()) as NominatimSearchResult[];
  return data.map((item) => ({
    id: item.place_id,
    direccion: item.display_name,
    latitud: Number(item.lat),
    longitud: Number(item.lon),
  }));
}

async function resolverDireccion(latitud: number, longitud: number) {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(latitud));
    url.searchParams.set("lon", String(longitud));
    const response = await fetch(url);
    if (!response.ok) throw new Error("No fue posible resolver la dirección");
    const data = (await response.json()) as { display_name?: string };
    return data.display_name ?? `${latitud.toFixed(6)}, ${longitud.toFixed(6)}`;
  } catch {
    return `${latitud.toFixed(6)}, ${longitud.toFixed(6)}`;
  }
}

function buildPickerViewport(centerLat: number, centerLng: number): PickerViewport {
  const zoom = 15;
  const centerPixel = latLngToPickerPixel(centerLat, centerLng, zoom);
  return {
    centerLat,
    centerLng,
    zoom,
    centerPixel,
    tiles: buildPickerTiles(centerPixel, zoom),
  };
}

function buildPickerTiles(centerPixel: PixelPoint, zoom: number): PickerViewport["tiles"] {
  const minX = centerPixel.x - PICKER_WIDTH / 2;
  const maxX = centerPixel.x + PICKER_WIDTH / 2;
  const minY = centerPixel.y - PICKER_HEIGHT / 2;
  const maxY = centerPixel.y + PICKER_HEIGHT / 2;
  const tileMinX = Math.floor(minX / TILE_SIZE) - 1;
  const tileMaxX = Math.floor(maxX / TILE_SIZE) + 1;
  const tileMinY = Math.floor(minY / TILE_SIZE) - 1;
  const tileMaxY = Math.floor(maxY / TILE_SIZE) + 1;
  const tileLimit = 2 ** zoom;
  const tiles: PickerViewport["tiles"] = [];

  for (let x = tileMinX; x <= tileMaxX; x += 1) {
    for (let y = tileMinY; y <= tileMaxY; y += 1) {
      if (y < 0 || y >= tileLimit) continue;
      const tilePixelX = x * TILE_SIZE;
      const tilePixelY = y * TILE_SIZE;
      tiles.push({
        x,
        wrappedX: ((x % tileLimit) + tileLimit) % tileLimit,
        y,
        leftPercent: ((tilePixelX - minX) / PICKER_WIDTH) * 100,
        topPercent: ((tilePixelY - minY) / PICKER_HEIGHT) * 100,
        sizePercentX: (TILE_SIZE / PICKER_WIDTH) * 100,
        sizePercentY: (TILE_SIZE / PICKER_HEIGHT) * 100,
      });
    }
  }

  return tiles;
}

function projectPickerPoint(point: { lat: number; lng: number }, viewport: PickerViewport) {
  const pixel = latLngToPickerPixel(point.lat, point.lng, viewport.zoom);
  return {
    xPercent: 50 + ((pixel.x - viewport.centerPixel.x) / PICKER_WIDTH) * 100,
    yPercent: 50 + ((pixel.y - viewport.centerPixel.y) / PICKER_HEIGHT) * 100,
  };
}

function pointFromClient(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  viewport: PickerViewport,
) {
  const x =
    viewport.centerPixel.x + ((clientX - rect.left - rect.width / 2) / rect.width) * PICKER_WIDTH;
  const y =
    viewport.centerPixel.y + ((clientY - rect.top - rect.height / 2) / rect.height) * PICKER_HEIGHT;
  return pixelToLatLng(x, y, viewport.zoom);
}

function latLngToPickerPixel(lat: number, lng: number, zoom: number): PixelPoint {
  const sinLat = Math.sin((clamp(lat, -85.05112878, 85.05112878) * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function pixelToLatLng(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const mercator = Math.PI * (1 - (2 * y) / scale);
  const lat = (Math.atan(Math.sinh(mercator)) * 180) / Math.PI;
  return { lat: clamp(lat, -85.05112878, 85.05112878), lng: clamp(lng, -180, 180) };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 break-all font-medium">{value}</div>
    </div>
  );
}

type ServicioForm = {
  empresa_cliente_id: string;
  tipo_servicio: string;
  placa_vehiculo: string;
  latitud: string;
  longitud: string;
  direccion: string;
  fecha_programada: string;
};

type PickedLocation = {
  latitud: number;
  longitud: number;
  direccion: string;
};

type LocationSuggestion = PickedLocation & {
  id: number;
};

type NominatimSearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type PickerViewport = {
  centerLat: number;
  centerLng: number;
  zoom: number;
  centerPixel: PixelPoint;
  tiles: Array<{
    x: number;
    wrappedX: number;
    y: number;
    leftPercent: number;
    topPercent: number;
    sizePercentX: number;
    sizePercentY: number;
  }>;
};

type PixelPoint = {
  x: number;
  y: number;
};

const TILE_SIZE = 256;
const PICKER_WIDTH = 760;
const PICKER_HEIGHT = 420;
const DEFAULT_PICKER_LOCATION: PickedLocation = {
  latitud: 4.711,
  longitud: -74.0721,
  direccion: "Bogotá, Colombia",
};

function crearFormularioServicio(empresaClienteId = ""): ServicioForm {
  const fecha = new Date(Date.now() + 60 * 60 * 1000);
  fecha.setSeconds(0, 0);
  return {
    empresa_cliente_id: empresaClienteId,
    tipo_servicio: "1",
    placa_vehiculo: "",
    latitud: "",
    longitud: "",
    direccion: "",
    fecha_programada: fecha.toISOString().slice(0, 16),
  };
}

function formularioServicioValido(form: ServicioForm) {
  return (
    form.empresa_cliente_id.trim().length > 0 &&
    coordenadaValida(form.latitud) &&
    coordenadaValida(form.longitud) &&
    form.direccion.trim().length > 0 &&
    Boolean(form.fecha_programada)
  );
}

function coordenadaValida(value: string) {
  return value.trim().length > 0 && Number.isFinite(Number(value));
}

function construirPayloadServicio(form: ServicioForm): CreateServicePayload {
  return {
    empresa_cliente_id: form.empresa_cliente_id,
    tipo_servicio: Number(form.tipo_servicio) as 1 | 2 | 3,
    placa_vehiculo: form.placa_vehiculo.trim() || null,
    latitud: Number(form.latitud),
    longitud: Number(form.longitud),
    direccion: form.direccion.trim() || null,
    fecha_programada: new Date(form.fecha_programada).toISOString(),
  };
}

function formularioDesdeServicio(service: Service): ServicioForm {
  return {
    empresa_cliente_id: service.empresa_cliente_id,
    tipo_servicio: String(service.tipo_servicio),
    placa_vehiculo: service.placa_vehiculo ?? "",
    latitud: String(service.latitud),
    longitud: String(service.longitud),
    direccion: service.direccion ?? "",
    fecha_programada: new Date(service.fecha_programada).toISOString().slice(0, 16),
  };
}

function abrirEdicion(
  service: Service,
  setEditing: (service: Service) => void,
  setEditForm: (form: ServicioForm) => void,
  setEditOpen: (open: boolean) => void,
) {
  setEditing(service);
  setEditForm(formularioDesdeServicio(service));
  setEditOpen(true);
}

function servicioEditable(service: Service) {
  return !["FINALIZADO", "VALIDADO", "PAGO_GENERADO", "CANCELADO"].includes(service.estado);
}
