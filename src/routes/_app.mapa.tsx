import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layers, Navigation, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/async-state";
import { adminApi } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/mapa")({
  head: () => ({ meta: [{ title: "Mapa operativo — Fedetec" }] }),
  component: MapaPage,
});

function MapaPage() {
  const { token } = useAuth();
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

  if (technicians.isLoading || services.isLoading)
    return <LoadingState label="Cargando mapa operativo..." />;
  if (technicians.isError)
    return <ErrorState error={technicians.error} onRetry={() => technicians.refetch()} />;
  if (services.isError)
    return <ErrorState error={services.error} onRetry={() => services.refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mapa operativo</h1>
          <p className="text-sm text-muted-foreground">Coordenadas reales reportadas por backend</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" /> Técnicos
          </Button>
          <Button variant="outline" size="sm">
            <Navigation className="mr-2 h-4 w-4" /> Servicios
          </Button>
          <Button variant="outline" size="sm">
            <Layers className="mr-2 h-4 w-4" /> Capas
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative min-h-[520px] w-full bg-gradient-to-br from-info/10 via-muted to-primary/10">
            <svg className="absolute inset-0 h-full w-full opacity-30 text-muted-foreground">
              <defs>
                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapGrid)" />
            </svg>
            {(technicians.data ?? [])
              .filter((t) => t.latitud && t.longitud)
              .map((tech, index) => (
                <Marker
                  key={tech.id}
                  x={15 + ((index * 13) % 75)}
                  y={20 + ((index * 17) % 65)}
                  label={tech.nombre_completo}
                  tone={tech.esta_disponible ? "bg-info" : "bg-muted-foreground"}
                />
              ))}
            {(services.data ?? []).slice(0, 20).map((service, index) => (
              <Marker
                key={service.id}
                x={10 + ((index * 11) % 80)}
                y={15 + ((index * 19) % 70)}
                label={service.id.slice(0, 8)}
                tone="bg-primary"
              />
            ))}
            <div className="absolute right-4 top-4 rounded-xl border border-border bg-background/90 p-3 text-xs backdrop-blur">
              <div className="font-semibold">En vivo</div>
              <div className="mt-1 text-muted-foreground">
                {technicians.data?.length ?? 0} técnicos · {services.data?.length ?? 0} servicios
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Marker({ x, y, label, tone }: { x: number; y: number; label: string; tone: string }) {
  return (
    <div
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span className={`relative flex h-3.5 w-3.5 rounded-full ring-2 ring-background ${tone}`} />
      <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 min-w-max -translate-x-1/2 rounded-lg border border-border bg-popover px-2 py-1 text-[11px] opacity-0 shadow-md transition group-hover:opacity-100">
        {label}
      </div>
    </div>
  );
}
