import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Clock,
  LocateFixed,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Star,
  XCircle,
} from "lucide-react";
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
import type { CreateTechnicianPayload, Technician, UpdateTechnicianPayload } from "@/lib/api/types";
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
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [editForm, setEditForm] = useState(() => crearFormularioEditarTecnico());
  const technicians = useQuery({
    queryKey: ["admin", "technicians"],
    queryFn: () => adminApi.technicians(token!),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const user = await authApi.registerTechnician(construirPayloadTecnico(form));
      if (user.tecnico_id && coordenadaValida(form.latitud) && coordenadaValida(form.longitud)) {
        await adminApi.updateTechnician(token!, user.tecnico_id, {
          direccion: form.direccion.trim() || null,
          latitud: Number(form.latitud),
          longitud: Number(form.longitud),
        });
      }
      return user;
    },
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

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("Técnico no seleccionado");
      return adminApi.updateTechnician(
        token!,
        editing.id,
        construirPayloadActualizarTecnico(editForm),
      );
    },
    onSuccess: (tech) => {
      toast.success(`Técnico actualizado: ${tech.correo}`);
      setEditing(null);
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "technicians"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "technician-metrics", tech.id] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("No fue posible actualizar. Revisa si el correo ya existe.");
        return;
      }
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar el técnico");
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
          <TechnicianCard
            key={tech.id}
            tech={tech}
            token={token!}
            onEdit={() => {
              setEditing(tech);
              setEditForm(crearFormularioEditarTecnico(tech));
              setEditOpen(true);
            }}
          />
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
            <TecnicoLocationField form={form} setForm={setForm} />
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

      <Dialog
        open={editOpen}
        onOpenChange={(value) => {
          setEditOpen(value);
          if (!value) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar técnico</DialogTitle>
          </DialogHeader>
          <TecnicoEditForm form={editForm} setForm={setEditForm} />
          <Button
            className="w-full"
            disabled={!formularioEditarTecnicoValido(editForm) || updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            <Pencil className="mr-2 h-4 w-4" /> Guardar cambios
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TechnicianCard({
  tech,
  token,
  onEdit,
}: {
  tech: Technician;
  token: string;
  onEdit: () => void;
}) {
  const metrics = useQuery({
    queryKey: ["admin", "technician-metrics", tech.id],
    queryFn: () => adminApi.technicianMetrics(token, tech.id),
    enabled: Boolean(token),
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
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
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tech.esta_disponible ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
            >
              {tech.esta_disponible ? "Disponible" : "No disponible"}
            </span>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <Stat icon={Phone} label="Teléfono" value={tech.telefono ?? "—"} />
          <Stat icon={Clock} label="Último GPS" value={formatDate(tech.fecha_ultima_ubicacion)} />
          <LocationStat tech={tech} />
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

function LocationStat({ tech }: { tech: Technician }) {
  const hasLocation = tech.latitud !== null && tech.longitud !== null;

  return (
    <div className="col-span-2 rounded-md border border-border bg-muted/30 p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <MapPin className="h-3 w-3" /> Ubicación GPS
      </div>
      <div className="mt-0.5 truncate font-medium">
        {hasLocation ? tech.direccion || "Ubicación registrada" : "Sin ubicación"}
      </div>
      {hasLocation && (
        <div className="mt-1 text-[11px] text-muted-foreground">
          {tech.latitud?.toFixed(6)}, {tech.longitud?.toFixed(6)}
        </div>
      )}
    </div>
  );
}

function TecnicoEditForm({
  form,
  setForm,
}: {
  form: TecnicoEditFormState;
  setForm: (form: TecnicoEditFormState) => void;
}) {
  return (
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
      <Field label="EPS" value={form.eps} onChange={(value) => setForm({ ...form, eps: value })} />
      <Field label="ARL" value={form.arl} onChange={(value) => setForm({ ...form, arl: value })} />
      <Field
        label="Placa vehículo"
        value={form.placa_vehiculo}
        onChange={(value) => setForm({ ...form, placa_vehiculo: value })}
      />
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label>Tiene vehículo</Label>
        <Switch
          checked={form.tiene_vehiculo}
          onCheckedChange={(checked) => setForm({ ...form, tiene_vehiculo: checked })}
        />
      </div>
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label>Disponible</Label>
        <Switch
          checked={form.esta_disponible}
          onCheckedChange={(checked) => setForm({ ...form, esta_disponible: checked })}
        />
      </div>
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label>Usuario activo</Label>
        <Switch
          checked={form.esta_activo}
          onCheckedChange={(checked) => setForm({ ...form, esta_activo: checked })}
        />
      </div>
      <TecnicoLocationField form={form} setForm={setForm} />
    </div>
  );
}

type TecnicoLocationForm = {
  direccion: string;
  latitud: string;
  longitud: string;
};

function TecnicoLocationField<TForm extends TecnicoLocationForm>({
  form,
  setForm,
}: {
  form: TForm;
  setForm: (form: TForm) => void;
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
      } catch {
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
        <Label>Ubicación GPS</Label>
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
          Busca una dirección o selecciona un punto en el mapa para guardar la ubicación GPS.
        </div>
      )}
      <TecnicoMapPickerDialog
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

function TecnicoMapPickerDialog({
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
          <DialogTitle>Seleccionar ubicación GPS</DialogTitle>
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
  latitud: string;
  longitud: string;
};

type TecnicoEditFormState = {
  correo: string;
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
  esta_activo: boolean;
  esta_disponible: boolean;
  latitud: string;
  longitud: string;
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
    latitud: "",
    longitud: "",
  };
}

function crearFormularioEditarTecnico(tech?: Technician): TecnicoEditFormState {
  return {
    correo: tech?.correo ?? "",
    nombre_completo: tech?.nombre_completo ?? "",
    telefono: tech?.telefono ?? "",
    numero_documento: tech?.numero_documento ?? "",
    ciudad: tech?.ciudad ?? "",
    municipio: tech?.municipio ?? "",
    direccion: tech?.direccion ?? "",
    eps: tech?.eps ?? "",
    arl: tech?.arl ?? "",
    tiene_vehiculo: tech?.tiene_vehiculo ?? false,
    placa_vehiculo: tech?.placa_vehiculo ?? "",
    esta_activo: tech?.esta_activo ?? true,
    esta_disponible: tech?.esta_disponible ?? true,
    latitud: tech?.latitud?.toString() ?? "",
    longitud: tech?.longitud?.toString() ?? "",
  };
}

function formularioTecnicoValido(form: TecnicoForm) {
  return (
    form.nombre_completo.trim().length > 0 &&
    form.correo.trim().length > 0 &&
    form.contrasena.length >= 8
  );
}

function formularioEditarTecnicoValido(form: TecnicoEditFormState) {
  const tieneLatitud = form.latitud.trim().length > 0;
  const tieneLongitud = form.longitud.trim().length > 0;
  const gpsValido =
    (!tieneLatitud && !tieneLongitud) ||
    (tieneLatitud &&
      tieneLongitud &&
      coordenadaValida(form.latitud) &&
      coordenadaValida(form.longitud));

  return form.nombre_completo.trim().length > 0 && form.correo.trim().length > 0 && gpsValido;
}

function coordenadaValida(value: string) {
  return value.trim().length > 0 && Number.isFinite(Number(value));
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

function construirPayloadActualizarTecnico(form: TecnicoEditFormState): UpdateTechnicianPayload {
  const payload: UpdateTechnicianPayload = {
    correo: form.correo.trim(),
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
    esta_activo: form.esta_activo,
    esta_disponible: form.esta_disponible,
  };

  if (form.latitud.trim() || form.longitud.trim()) {
    payload.latitud = Number(form.latitud);
    payload.longitud = Number(form.longitud);
  }

  return payload;
}
