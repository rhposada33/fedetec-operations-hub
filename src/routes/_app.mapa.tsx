import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layers, Maximize2, Navigation, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { technicians, services } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/mapa")({
  head: () => ({ meta: [{ title: "Mapa operativo — Fedetec" }] }),
  component: MapaPage,
});

const markers = [
  ...services.slice(0, 10).map((s, i) => ({
    kind: "service" as const,
    id: s.id,
    label: s.company,
    status: s.status,
    x: 8 + (i * 9) % 85,
    y: 12 + (i * 13) % 75,
  })),
  ...technicians.map((t, i) => ({
    kind: "tech" as const,
    id: t.id,
    label: t.name,
    status: t.status,
    x: 14 + (i * 11) % 80,
    y: 25 + (i * 17) % 65,
  })),
];

const serviceColor = (s: string) =>
  s.startsWith("EN_PROCESO") ? "bg-primary"
  : s === "FINALIZADO" || s === "VALIDADO" || s === "PAGO_GENERADO" ? "bg-success"
  : s === "RECHAZADO" || s === "CANCELADO" ? "bg-destructive"
  : "bg-info";

function MapaPage() {
  const [show, setShow] = useState({ tech: true, srv: true });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mapa operativo</h1>
          <p className="text-sm text-muted-foreground">Estado en vivo de técnicos y servicios</p>
        </div>
        <div className="flex gap-2">
          <Button variant={show.tech ? "default" : "outline"} size="sm" onClick={() => setShow({ ...show, tech: !show.tech })}>
            <Users className="mr-2 h-4 w-4" /> Técnicos
          </Button>
          <Button variant={show.srv ? "default" : "outline"} size="sm" onClick={() => setShow({ ...show, srv: !show.srv })}>
            <Navigation className="mr-2 h-4 w-4" /> Servicios
          </Button>
          <Button variant="outline" size="sm"><Layers className="mr-2 h-4 w-4" /> Capas</Button>
          <Button variant="outline" size="sm"><Maximize2 className="mr-2 h-4 w-4" /> Pantalla completa</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative h-[calc(100vh-260px)] min-h-[480px] w-full bg-gradient-to-br from-info/10 via-muted to-primary/10">
            <svg className="absolute inset-0 h-full w-full opacity-30 text-muted-foreground">
              <defs>
                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapGrid)" />
            </svg>

            {/* Routes */}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              {[
                "M 80 100 Q 200 60 320 180",
                "M 140 280 Q 260 200 420 240",
                "M 60 380 Q 200 320 360 380",
              ].map((d, i) => (
                <path key={i} d={d} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
              ))}
            </svg>

            {markers.map((m) => {
              if (m.kind === "tech" && !show.tech) return null;
              if (m.kind === "service" && !show.srv) return null;
              const color = m.kind === "tech"
                ? (m.status === "online" ? "bg-info" : "bg-muted-foreground/60")
                : serviceColor(m.status);
              return (
                <div key={`${m.kind}-${m.id}`} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
                  <span className={`relative flex h-3.5 w-3.5 rounded-full ring-2 ring-background ${color}`}>
                    {m.kind === "tech" && m.status === "online" && (
                      <span className={`absolute inset-0 animate-ping rounded-full ${color} opacity-60`} />
                    )}
                  </span>
                  <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 min-w-max -translate-x-1/2 rounded-lg border border-border bg-popover px-2 py-1 text-[11px] opacity-0 shadow-md transition group-hover:opacity-100">
                    <div className="font-medium">{m.label}</div>
                    <div className="text-[10px] text-muted-foreground">{m.id}</div>
                  </div>
                </div>
              );
            })}

            <div className="absolute bottom-4 left-4 rounded-xl border border-border bg-background/90 p-3 text-xs backdrop-blur">
              <div className="mb-2 font-semibold">Leyenda</div>
              <Legend color="bg-primary" label="En proceso" />
              <Legend color="bg-success" label="Completado" />
              <Legend color="bg-destructive" label="Cancelado/Rechazado" />
              <Legend color="bg-info" label="Técnico disponible" />
            </div>

            <div className="absolute right-4 top-4 rounded-xl border border-border bg-background/90 p-3 text-xs backdrop-blur">
              <div className="font-semibold">En vivo</div>
              <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> 62 técnicos · 28 servicios
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
