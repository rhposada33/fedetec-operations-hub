import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImageIcon, FileText, Video, Check, X, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { evidences, formatDate } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/evidencias")({
  head: () => ({ meta: [{ title: "Evidencias — Fedetec" }] }),
  component: EvidenciasPage,
});

const fileIcon = { image: ImageIcon, pdf: FileText, video: Video } as const;

function EvidenciasPage() {
  const [tab, setTab] = useState<"all" | "PENDIENTE" | "APROBADA" | "RECHAZADA">("all");
  const [active, setActive] = useState(evidences[0]);
  const list = tab === "all" ? evidences : evidences.filter((e) => e.status === tab);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Evidencias</h1>
          <p className="text-sm text-muted-foreground">Flujo de aprobación de evidencias técnicas</p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="PENDIENTE">Pendiente</TabsTrigger>
            <TabsTrigger value="APROBADA">Aprobada</TabsTrigger>
            <TabsTrigger value="RECHAZADA">Rechazada</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          {list.map((e) => {
            const Icon = fileIcon[e.type as keyof typeof fileIcon] ?? FileText;
            const isActive = active?.id === e.id;
            return (
              <Card key={e.id} className={`cursor-pointer transition ${isActive ? "border-primary ring-1 ring-primary/30" : "hover:border-border/80"}`} onClick={() => setActive(e)}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{e.id}</span>
                      <StatusPill status={e.status} />
                    </div>
                    <div className="truncate text-sm font-medium">{e.company}</div>
                    <div className="text-[11px] text-muted-foreground">{e.technician} · {e.files} archivos</div>
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground">
                    <Calendar className="ml-auto mb-0.5 h-3 w-3" />
                    {formatDate(e.uploaded)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="lg:col-span-3">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Evidencia</div>
                <div className="font-mono text-lg font-semibold">{active.id}</div>
              </div>
              <StatusPill status={active.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: active.files }).map((_, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted via-muted/60 to-primary/10">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-40" />
                  </div>
                  <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] backdrop-blur">IMG-{i + 1}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <div><div className="text-muted-foreground">Servicio</div><div className="font-medium">{active.serviceId}</div></div>
              <div><div className="text-muted-foreground">Empresa</div><div className="font-medium">{active.company}</div></div>
              <div><div className="text-muted-foreground">Técnico</div><div className="font-medium">{active.technician}</div></div>
              <div><div className="text-muted-foreground">Subido</div><div className="font-medium">{formatDate(active.uploaded)}</div></div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => toast.success("Evidencia aprobada")}>
                <Check className="mr-2 h-4 w-4" /> Aprobar
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => toast.error("Evidencia rechazada")}>
                <X className="mr-2 h-4 w-4" /> Rechazar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDIENTE: "bg-warning/20 text-warning-foreground border-warning/30",
    APROBADA: "bg-success/15 text-success border-success/25",
    RECHAZADA: "bg-destructive/15 text-destructive border-destructive/25",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${map[status]}`}>{status}</span>;
}
