import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImageIcon, Check, X, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/async-state";
import { adminApi, evidenceApi } from "@/lib/api/client";
import { formatDate } from "@/lib/api/format";
import { useAuth } from "@/lib/auth";
import type { Evidence } from "@/lib/api/types";

export const Route = createFileRoute("/_app/evidencias")({
  head: () => ({ meta: [{ title: "Evidencias — Fedetec" }] }),
  component: EvidenciasPage,
});

function EvidenciasPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<Evidence | null>(null);
  const evidences = useQuery({
    queryKey: ["admin", "evidence", "pending"],
    queryFn: () => adminApi.pendingEvidence(token!),
    enabled: Boolean(token),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => evidenceApi.approve(token!, id),
    onSuccess: () => {
      toast.success("Evidencia aprobada");
      queryClient.invalidateQueries({ queryKey: ["admin", "evidence"] });
      setActive(null);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible aprobar"),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => evidenceApi.reject(token!, id),
    onSuccess: () => {
      toast.success("Evidencia rechazada");
      queryClient.invalidateQueries({ queryKey: ["admin", "evidence"] });
      setActive(null);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible rechazar"),
  });

  if (evidences.isLoading) return <LoadingState label="Cargando evidencias..." />;
  if (evidences.isError)
    return <ErrorState error={evidences.error} onRetry={() => evidences.refetch()} />;

  const list = evidences.data ?? [];
  const selected = active ?? list[0] ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Evidencias pendientes</h1>
        <p className="text-sm text-muted-foreground">Flujo de aprobación de evidencias técnicas</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          {list.map((evidence) => (
            <Card
              key={evidence.id}
              className={`cursor-pointer transition ${selected?.id === evidence.id ? "border-primary ring-1 ring-primary/30" : "hover:border-border/80"}`}
              onClick={() => setActive(evidence)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs">{evidence.id.slice(0, 8)}</div>
                  <div className="truncate text-sm font-medium">
                    {evidence.descripcion ?? evidence.url_archivo}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Servicio {evidence.servicio_id.slice(0, 8)}
                  </div>
                </div>
                <div className="text-right text-[10px] text-muted-foreground">
                  <Calendar className="ml-auto mb-0.5 h-3 w-3" />
                  {formatDate(evidence.fecha_creacion)}
                </div>
              </CardContent>
            </Card>
          ))}
          {list.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No hay evidencias pendientes.
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:col-span-3">
          <CardContent className="space-y-4 p-5">
            {selected ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Evidencia</div>
                    <div className="font-mono text-lg font-semibold">{selected.id}</div>
                  </div>
                  <StatusPill status={selected.estado_aprobacion} />
                </div>
                <a
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-primary hover:underline"
                  href={selected.url_archivo}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4" /> {selected.url_archivo}
                </a>
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
                  <Info label="Servicio" value={selected.servicio_id} />
                  <Info label="Tipo" value={selected.tipo_archivo ?? "—"} />
                  <Info label="Subido" value={formatDate(selected.fecha_creacion)} />
                  <Info label="Descripción" value={selected.descripcion ?? "—"} />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-success hover:bg-success/90"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(selected.id)}
                  >
                    <Check className="mr-2 h-4 w-4" /> Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate(selected.id)}
                  >
                    <X className="mr-2 h-4 w-4" /> Rechazar
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Selecciona una evidencia.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="break-all font-medium">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDIENTE: "bg-warning/20 text-warning-foreground border-warning/30",
    APROBADA: "bg-success/15 text-success border-success/25",
    RECHAZADA: "bg-destructive/15 text-destructive border-destructive/25",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${map[status]}`}>
      {status}
    </span>
  );
}
