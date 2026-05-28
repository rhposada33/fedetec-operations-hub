import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star, MapPin, Phone, Car, Clock, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { technicians } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/tecnicos")({
  head: () => ({ meta: [{ title: "Técnicos — Fedetec" }] }),
  component: TecnicosPage,
});

function TecnicosPage() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<(typeof technicians)[number] | null>(null);
  const filtered = technicians.filter((t) =>
    t.name.toLowerCase().includes(q.toLowerCase()) || t.city.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Técnicos</h1>
          <p className="text-sm text-muted-foreground">Red de {technicians.length} técnicos certificados</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar técnico..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Card key={t.id} className="group cursor-pointer transition hover:shadow-md hover:-translate-y-0.5" onClick={() => setSel(t)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/15 text-primary">{t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${t.status === "online" ? "bg-success" : "bg-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {t.city}</div>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.availability === "Disponible" ? "bg-success/15 text-success" : t.availability === "En servicio" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {t.availability}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Vehículo</div>
                  <div className="font-medium">{t.vehicle}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Placa</div>
                  <div className="font-mono">{t.plate}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Trabajos</div>
                  <div className="font-medium">{t.jobs}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Rating</div>
                  <div className="flex items-center gap-1 font-medium"><Star className="h-3 w-3 fill-warning text-warning" /> {t.rating}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t.lastGps}</span>
                <span>{t.distance ? `${t.distance} km` : "—"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mapa de cobertura</CardTitle>
          <CardDescription>Técnicos cercanos visualizados en tiempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-72 overflow-hidden rounded-lg border border-border bg-gradient-to-br from-info/10 via-muted to-primary/5">
            <svg className="absolute inset-0 h-full w-full opacity-30">
              <defs>
                <pattern id="grid2" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid2)" />
            </svg>
            {technicians.map((t, i) => (
              <div key={t.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${15 + (i * 11) % 75}%`, top: `${20 + (i * 17) % 65}%` }}>
                <div className="group relative">
                  <span className={`flex h-3 w-3 rounded-full ${t.status === "online" ? "bg-info" : "bg-muted-foreground/60"}`}>
                    {t.status === "online" && <span className="absolute inset-0 animate-ping rounded-full bg-info opacity-60" />}
                  </span>
                  <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[10px] opacity-0 shadow-sm transition group-hover:opacity-100">
                    {t.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-md">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle>Perfil del técnico</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/15 text-primary">{sel.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{sel.name}</div>
                    <div className="text-xs text-muted-foreground">{sel.city} · {sel.id}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Vehículo" value={sel.vehicle} />
                  <Stat label="Placa" value={sel.plate} />
                  <Stat label="Trabajos" value={sel.jobs.toString()} />
                  <Stat label="Rating" value={`${sel.rating} ★`} />
                  <Stat label="Distancia" value={sel.distance ? `${sel.distance} km` : "—"} />
                  <Stat label="GPS" value={sel.lastGps} />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1"><Phone className="mr-2 h-4 w-4" /> Llamar</Button>
                  <Button variant="outline" className="flex-1"><Car className="mr-2 h-4 w-4" /> Asignar servicio</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
