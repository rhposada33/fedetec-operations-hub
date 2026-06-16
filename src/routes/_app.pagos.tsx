import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Wallet, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState, LoadingState } from "@/components/async-state";
import { paymentsApi } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/api/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/pagos")({
  head: () => ({ meta: [{ title: "Pagos — Fedetec" }] }),
  component: PagosPage,
});

const statusTone: Record<string, string> = {
  PENDIENTE: "bg-warning/20 text-warning-foreground",
  GENERADO: "bg-info/15 text-info",
  PAGADO: "bg-success/15 text-success",
  ANULADO: "bg-destructive/15 text-destructive",
};

function PagosPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState("all");
  const reports = useQuery({
    queryKey: ["payments"],
    queryFn: () => paymentsApi.list(token!),
    enabled: Boolean(token),
  });

  if (reports.isLoading) return <LoadingState label="Cargando reportes de pago..." />;
  if (reports.isError)
    return <ErrorState error={reports.error} onRetry={() => reports.refetch()} />;

  const all = reports.data ?? [];
  const list = status === "all" ? all : all.filter((report) => report.estado === status);
  const total = all.reduce((sum, report) => sum + Number(report.valor ?? 0), 0);
  const paid = all
    .filter((report) => report.estado === "PAGADO")
    .reduce((sum, report) => sum + Number(report.valor ?? 0), 0);
  const pending = all
    .filter((report) => report.estado === "PENDIENTE" || report.estado === "GENERADO")
    .reduce((sum, report) => sum + Number(report.valor ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reportes de pago</h1>
        <p className="text-sm text-muted-foreground">Liquidaciones generadas desde el backend</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          icon={Wallet}
          label="Total generado"
          value={formatCurrency(total)}
          tone="primary"
        />
        <SummaryCard icon={TrendingUp} label="Pagado" value={formatCurrency(paid)} tone="success" />
        <SummaryCard
          icon={Clock}
          label="En proceso"
          value={formatCurrency(pending)}
          tone="warning"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Liquidaciones</CardTitle>
            <CardDescription>{list.length} registros</CardDescription>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="GENERADO">Generado</SelectItem>
              <SelectItem value="PAGADO">Pagado</SelectItem>
              <SelectItem value="ANULADO">Anulado</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Pago</th>
                  <th className="px-4 py-3 font-medium">Servicio</th>
                  <th className="px-4 py-3 font-medium">Técnico</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Generado</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Base</th>
                  <th className="px-4 py-3 font-medium text-right">Propina</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {list.map((report) => (
                  <tr
                    key={report.id}
                    className="border-t border-border transition hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{report.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {report.servicio_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{report.tecnico_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {report.empresa_cliente_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(report.fecha_generacion)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone[report.estado]}`}
                      >
                        {report.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(report.valor_base)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-success">
                      {formatCurrency(report.valor_propina)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(report.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: string;
}) {
  const toneCls: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/20 text-warning-foreground",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneCls[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
