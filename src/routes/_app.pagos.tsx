import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Wallet, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { payments, formatCurrency, formatDate } from "@/lib/mock-data";
import { toast } from "sonner";

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
  const [status, setStatus] = useState("all");
  const list = status === "all" ? payments : payments.filter((p) => p.status === status);
  const total = payments.reduce((a, p) => a + p.amount, 0);
  const paid = payments.filter((p) => p.status === "PAGADO").reduce((a, p) => a + p.amount, 0);
  const pending = payments.filter((p) => p.status === "PENDIENTE" || p.status === "GENERADO").reduce((a, p) => a + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reportes de pago</h1>
          <p className="text-sm text-muted-foreground">Liquidaciones generadas en el período actual</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success("Exportado a CSV")}><FileSpreadsheet className="mr-2 h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={() => toast.success("Exportado a PDF")}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard icon={Wallet} label="Total generado" value={formatCurrency(total)} tone="primary" />
        <SummaryCard icon={TrendingUp} label="Pagado" value={formatCurrency(paid)} tone="success" />
        <SummaryCard icon={Clock} label="En proceso" value={formatCurrency(pending)} tone="warning" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Liquidaciones</CardTitle>
            <CardDescription>{list.length} registros</CardDescription>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
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
                  <th className="px-4 py-3 font-medium text-right">Monto</th>
                  <th className="px-4 py-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-t border-border transition hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.serviceId}</td>
                    <td className="px-4 py-3">{p.technician}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.company}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(p.generated)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone[p.status]}`}>{p.status}</span></td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline de pagos</CardTitle>
          <CardDescription>Eventos recientes</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="relative border-l-2 border-border pl-6">
            {payments.slice(0, 6).map((p, i) => (
              <li key={p.id} className="mb-5 last:mb-0">
                <span className={`absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-background ${p.status === "PAGADO" ? "bg-success" : p.status === "GENERADO" ? "bg-info" : p.status === "ANULADO" ? "bg-destructive" : "bg-warning"}`} />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{p.id} · {p.technician}</div>
                    <div className="text-xs text-muted-foreground">{p.company} · {formatDate(p.generated)}</div>
                  </div>
                  <div className="text-sm font-semibold">{formatCurrency(p.amount)}</div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  const toneCls: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/20 text-warning-foreground",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneCls[tone]}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
