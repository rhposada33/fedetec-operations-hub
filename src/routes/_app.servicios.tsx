import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Filter, Eye, Radio, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Service, ServiceStatus } from "@/lib/api/types";
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
  const [selected, setSelected] = useState<Service | null>(null);

  const servicesQuery = useQuery({
    queryKey: ["admin", "services", status],
    queryFn: () => adminApi.services(token!, status === "all" ? {} : { estado: status }),
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
                      <Button variant="ghost" size="sm" onClick={() => setSelected(service)}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver
                      </Button>
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
