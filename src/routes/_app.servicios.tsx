import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Filter, Download, Eye, UserPlus, X, MapPin, Calendar, Building2, Wrench, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";
import { services, statusVariant, formatCurrency, formatDate, type ServiceStatus } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/servicios")({
  head: () => ({ meta: [{ title: "Servicios — Fedetec" }] }),
  component: ServiciosPage,
});

function ServiciosPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [selected, setSelected] = useState<(typeof services)[number] | null>(null);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchQ =
        !q ||
        s.id.toLowerCase().includes(q.toLowerCase()) ||
        s.company.toLowerCase().includes(q.toLowerCase()) ||
        s.plate.toLowerCase().includes(q.toLowerCase()) ||
        s.technician.toLowerCase().includes(q.toLowerCase());
      const matchS = status === "all" || s.status === status;
      return matchQ && matchS;
    });
  }, [q, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Servicios</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} servicios encontrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Exportar</Button>
          <Button size="sm" onClick={() => toast.success("Servicio creado", { description: "SRV-10273 listo para publicar" })}>
            <Plus className="mr-2 h-4 w-4" /> Crear servicio
          </Button>
        </div>
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
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusVariant).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Más filtros</Button>
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
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Distancia</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((s) => (
                  <tr key={s.id} className="border-t border-border transition hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{s.id}</td>
                    <td className="px-4 py-3 font-medium">{s.company}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.plate}</td>
                    <td className="px-4 py-3">{s.technician}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(s.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.distance} km</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status as ServiceStatus} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver
                      </Button>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">No hay servicios para los filtros aplicados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <div>Página {page} de {totalPages}</div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="font-mono">{selected.id}</SheetTitle>
                    <SheetDescription>{selected.type}</SheetDescription>
                  </div>
                  <StatusBadge status={selected.status as ServiceStatus} />
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Building2, label: "Empresa", value: selected.company },
                    { icon: Car, label: "Placa", value: selected.plate },
                    { icon: Wrench, label: "Técnico", value: selected.technician },
                    { icon: Calendar, label: "Fecha", value: formatDate(selected.date) },
                    { icon: MapPin, label: "Distancia", value: `${selected.distance} km` },
                  ].map((f) => (
                    <div key={f.label} className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <f.icon className="h-3 w-3" /> {f.label}
                      </div>
                      <div className="mt-1 text-sm font-medium">{f.value}</div>
                    </div>
                  ))}
                  <div className="col-span-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-primary">Monto estimado</div>
                    <div className="mt-1 text-xl font-semibold">{formatCurrency(selected.amount)}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</div>
                  <ol className="mt-3 space-y-3 text-sm">
                    {["Creado", "Publicado", "Asignado", "En proceso"].map((step, i) => (
                      <li key={step} className="flex items-center gap-3">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${i <= 2 ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                        <div className="flex-1">{step}</div>
                        <span className="text-[10px] text-muted-foreground">{i <= 2 ? "✓" : "pendiente"}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => toast.success("Servicio publicado")}>Publicar</Button>
                  <Button variant="outline" onClick={() => toast("Técnico reasignado")}><UserPlus className="mr-1.5 h-4 w-4" />Asignar</Button>
                  <Button variant="outline" onClick={() => toast("Mostrando evidencias")}><Eye className="mr-1.5 h-4 w-4" /> Ver evidencia</Button>
                  <Button variant="destructive" onClick={() => toast.error("Servicio cancelado")}><X className="mr-1.5 h-4 w-4" /> Cancelar</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
