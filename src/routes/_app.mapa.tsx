import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Layers,
  LocateFixed,
  MapPin,
  Navigation,
  Users,
  Wrench,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/async-state";
import { adminApi } from "@/lib/api/client";
import { formatDate, serviceTypeLabel, statusVariant } from "@/lib/api/format";
import type { Service, Technician } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/mapa")({
  head: () => ({ meta: [{ title: "Mapa operativo — Fedetec" }] }),
  component: MapaPage,
});

const TILE_SIZE = 256;
const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 620;
const MIN_ZOOM = 4;
const MAX_ZOOM = 18;

type MapPoint =
  | {
      id: string;
      kind: "technician";
      lat: number;
      lng: number;
      label: string;
      subtitle: string;
      available: boolean;
      raw: Technician;
    }
  | {
      id: string;
      kind: "service";
      lat: number;
      lng: number;
      label: string;
      subtitle: string;
      status: string;
      raw: Service;
    };

function MapaPage() {
  const { token } = useAuth();
  const [showTechnicians, setShowTechnicians] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [zoomOffset, setZoomOffset] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  const technicians = useQuery({
    queryKey: ["admin", "technicians"],
    queryFn: () => adminApi.technicians(token!),
    enabled: Boolean(token),
  });
  const services = useQuery({
    queryKey: ["admin", "services", "map"],
    queryFn: () => adminApi.services(token!),
    enabled: Boolean(token),
  });

  const technicianPoints = useMemo(
    () =>
      (technicians.data ?? [])
        .filter((tech) => tech.latitud !== null && tech.longitud !== null)
        .map<MapPoint>((tech) => ({
          id: tech.id,
          kind: "technician",
          lat: tech.latitud as number,
          lng: tech.longitud as number,
          label: tech.nombre_completo,
          subtitle: tech.esta_disponible ? "Disponible" : "No disponible",
          available: tech.esta_disponible,
          raw: tech,
        })),
    [technicians.data],
  );

  const servicePoints = useMemo(
    () =>
      (services.data ?? []).map<MapPoint>((service) => ({
        id: service.id,
        kind: "service",
        lat: service.latitud,
        lng: service.longitud,
        label: serviceTypeLabel(service.tipo_servicio),
        subtitle: service.estado,
        status: service.estado,
        raw: service,
      })),
    [services.data],
  );

  const visiblePoints = useMemo(
    () => [...(showTechnicians ? technicianPoints : []), ...(showServices ? servicePoints : [])],
    [servicePoints, showServices, showTechnicians, technicianPoints],
  );

  const viewport = useMemo(
    () => buildViewport(visiblePoints, zoomOffset),
    [visiblePoints, zoomOffset],
  );

  if (technicians.isLoading || services.isLoading) {
    return <LoadingState label="Cargando mapa operativo..." />;
  }
  if (technicians.isError) {
    return <ErrorState error={technicians.error} onRetry={() => technicians.refetch()} />;
  }
  if (services.isError) {
    return <ErrorState error={services.error} onRetry={() => services.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mapa operativo</h1>
          <p className="text-sm text-muted-foreground">
            Técnicos y servicios ubicados con coordenadas reales del backend.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={showTechnicians ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTechnicians((value) => !value)}
          >
            <Users className="mr-2 h-4 w-4" /> Técnicos
          </Button>
          <Button
            variant={showServices ? "default" : "outline"}
            size="sm"
            onClick={() => setShowServices((value) => !value)}
          >
            <Navigation className="mr-2 h-4 w-4" /> Servicios
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoomOffset(0)}>
            <LocateFixed className="mr-2 h-4 w-4" /> Centrar
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px]">
            <div className="relative min-h-[560px] overflow-hidden bg-muted">
              <MapTiles viewport={viewport} />
              <RoadOverlay viewport={viewport} points={visiblePoints} />
              {visiblePoints.map((point) => (
                <MapMarker
                  key={`${point.kind}-${point.id}`}
                  point={point}
                  viewport={viewport}
                  selected={selectedPoint?.id === point.id && selectedPoint.kind === point.kind}
                  onSelect={() => setSelectedPoint(point)}
                />
              ))}

              <div className="absolute left-4 top-4 rounded-lg border border-border bg-background/95 p-2 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoomOffset((value) => Math.min(value + 1, 3))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoomOffset((value) => Math.max(value - 1, -3))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="absolute right-4 top-4 rounded-lg border border-border bg-background/95 p-3 text-xs shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 font-semibold">
                  <Layers className="h-4 w-4 text-primary" />
                  Mapa operativo
                </div>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  <div>{technicianPoints.length} técnicos con GPS</div>
                  <div>{servicePoints.length} servicios geolocalizados</div>
                  <div>Zoom {viewport.zoom}</div>
                </div>
              </div>

              <div className="absolute bottom-3 right-4 rounded-md bg-background/90 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
                © OpenStreetMap contributors
              </div>
            </div>

            <aside className="border-t border-border bg-background p-4 xl:border-l xl:border-t-0">
              {selectedPoint ? (
                <PointDetails point={selectedPoint} />
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                  <div className="mt-3 font-medium">Selecciona un marcador</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Abre el detalle operativo de un técnico o servicio desde el mapa.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MapTiles({ viewport }: { viewport: MapViewport }) {
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

function RoadOverlay({ viewport, points }: { viewport: MapViewport; points: MapPoint[] }) {
  if (points.length < 2) return null;
  const servicePoints = points.filter((point) => point.kind === "service").slice(0, 12);
  const technicianPoints = points.filter((point) => point.kind === "technician").slice(0, 12);
  const lines = servicePoints.flatMap((service) => {
    const nearest = technicianPoints
      .map((tech) => ({
        tech,
        distance: Math.hypot(service.lat - tech.lat, service.lng - tech.lng),
      }))
      .sort((a, b) => a.distance - b.distance)[0]?.tech;
    return nearest ? [{ service, technician: nearest }] : [];
  });

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full">
      {lines.map((line) => {
        const service = projectPoint(line.service, viewport);
        const technician = projectPoint(line.technician, viewport);
        return (
          <line
            key={`${line.service.id}-${line.technician.id}`}
            x1={`${service.xPercent}%`}
            y1={`${service.yPercent}%`}
            x2={`${technician.xPercent}%`}
            y2={`${technician.yPercent}%`}
            stroke="currentColor"
            strokeDasharray="5 7"
            strokeWidth="1.5"
            className="text-primary/45"
          />
        );
      })}
    </svg>
  );
}

function MapMarker({
  point,
  viewport,
  selected,
  onSelect,
}: {
  point: MapPoint;
  viewport: MapViewport;
  selected: boolean;
  onSelect: () => void;
}) {
  const projected = projectPoint(point, viewport);
  const visible =
    projected.xPercent >= -5 &&
    projected.xPercent <= 105 &&
    projected.yPercent >= -5 &&
    projected.yPercent <= 105;
  if (!visible) return null;

  const tone =
    point.kind === "technician"
      ? point.available
        ? "bg-success text-white"
        : "bg-muted-foreground text-white"
      : "bg-primary text-white";
  const Icon = point.kind === "technician" ? Users : Wrench;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group absolute -translate-x-1/2 -translate-y-full"
      style={{ left: `${projected.xPercent}%`, top: `${projected.yPercent}%` }}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-background shadow-lg ring-primary transition ${
          selected ? "ring-4" : "ring-0 group-hover:ring-4"
        } ${tone}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="absolute left-1/2 top-full mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-background bg-current" />
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-3 min-w-max -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground opacity-0 shadow-md transition group-hover:opacity-100">
        {point.label}
      </span>
    </button>
  );
}

function PointDetails({ point }: { point: MapPoint }) {
  if (point.kind === "technician") {
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Técnico</div>
          <h2 className="mt-1 text-lg font-semibold">{point.raw.nombre_completo}</h2>
          <p className="text-sm text-muted-foreground">{point.raw.correo}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Info label="Estado" value={point.raw.esta_disponible ? "Disponible" : "No disponible"} />
          <Info label="Teléfono" value={point.raw.telefono ?? "—"} />
          <Info label="Latitud" value={point.lat.toFixed(6)} />
          <Info label="Longitud" value={point.lng.toFixed(6)} />
          <Info label="Último GPS" value={formatDate(point.raw.fecha_ultima_ubicacion)} />
          <Info label="ID" value={point.raw.id.slice(0, 8)} />
        </div>
      </div>
    );
  }

  const variant = statusVariant[point.raw.estado]?.label ?? point.raw.estado;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Servicio</div>
        <h2 className="mt-1 text-lg font-semibold">{serviceTypeLabel(point.raw.tipo_servicio)}</h2>
        <p className="font-mono text-sm text-muted-foreground">{point.raw.id}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Info label="Estado" value={variant} />
        <Info label="Placa" value={point.raw.placa_vehiculo ?? "—"} />
        <Info label="Programado" value={formatDate(point.raw.fecha_programada)} />
        <Info label="Técnico" value={point.raw.tecnico_aceptado_id?.slice(0, 8) ?? "—"} />
        <Info label="Latitud" value={point.lat.toFixed(6)} />
        <Info label="Longitud" value={point.lng.toFixed(6)} />
      </div>
      <Info label="Dirección" value={point.raw.direccion ?? "—"} />
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

type MapViewport = {
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

function buildViewport(points: MapPoint[], zoomOffset: number): MapViewport {
  const fallback = { lat: 4.711, lng: -74.0721 };
  const bounds = points.length
    ? points.reduce(
        (acc, point) => ({
          minLat: Math.min(acc.minLat, point.lat),
          maxLat: Math.max(acc.maxLat, point.lat),
          minLng: Math.min(acc.minLng, point.lng),
          maxLng: Math.max(acc.maxLng, point.lng),
        }),
        {
          minLat: points[0].lat,
          maxLat: points[0].lat,
          minLng: points[0].lng,
          maxLng: points[0].lng,
        },
      )
    : {
        minLat: fallback.lat,
        maxLat: fallback.lat,
        minLng: fallback.lng,
        maxLng: fallback.lng,
      };

  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  const span = Math.max(bounds.maxLat - bounds.minLat, bounds.maxLng - bounds.minLng, 0.01);
  const baseZoom = span > 8 ? 6 : span > 3 ? 8 : span > 1 ? 10 : span > 0.2 ? 12 : 14;
  const zoom = clamp(baseZoom + zoomOffset, MIN_ZOOM, MAX_ZOOM);
  const centerPixel = latLngToPixel(centerLat, centerLng, zoom);
  const tiles = buildTiles(centerPixel, zoom);

  return {
    centerLat,
    centerLng,
    zoom,
    centerPixel,
    tiles,
  };
}

function buildTiles(centerPixel: PixelPoint, zoom: number): MapViewport["tiles"] {
  const minX = centerPixel.x - VIEWPORT_WIDTH / 2;
  const maxX = centerPixel.x + VIEWPORT_WIDTH / 2;
  const minY = centerPixel.y - VIEWPORT_HEIGHT / 2;
  const maxY = centerPixel.y + VIEWPORT_HEIGHT / 2;
  const tileMinX = Math.floor(minX / TILE_SIZE) - 1;
  const tileMaxX = Math.floor(maxX / TILE_SIZE) + 1;
  const tileMinY = Math.floor(minY / TILE_SIZE) - 1;
  const tileMaxY = Math.floor(maxY / TILE_SIZE) + 1;
  const tileLimit = 2 ** zoom;
  const tiles: MapViewport["tiles"] = [];

  for (let x = tileMinX; x <= tileMaxX; x += 1) {
    for (let y = tileMinY; y <= tileMaxY; y += 1) {
      if (y < 0 || y >= tileLimit) continue;
      const tilePixelX = x * TILE_SIZE;
      const tilePixelY = y * TILE_SIZE;
      tiles.push({
        x,
        wrappedX: ((x % tileLimit) + tileLimit) % tileLimit,
        y,
        leftPercent: ((tilePixelX - minX) / VIEWPORT_WIDTH) * 100,
        topPercent: ((tilePixelY - minY) / VIEWPORT_HEIGHT) * 100,
        sizePercentX: (TILE_SIZE / VIEWPORT_WIDTH) * 100,
        sizePercentY: (TILE_SIZE / VIEWPORT_HEIGHT) * 100,
      });
    }
  }
  return tiles;
}

function projectPoint(point: { lat: number; lng: number }, viewport: MapViewport) {
  const pixel = latLngToPixel(point.lat, point.lng, viewport.zoom);
  return {
    xPercent: 50 + ((pixel.x - viewport.centerPixel.x) / VIEWPORT_WIDTH) * 100,
    yPercent: 50 + ((pixel.y - viewport.centerPixel.y) / VIEWPORT_HEIGHT) * 100,
  };
}

function latLngToPixel(lat: number, lng: number, zoom: number): PixelPoint {
  const sinLat = Math.sin((clamp(lat, -85.05112878, 85.05112878) * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
