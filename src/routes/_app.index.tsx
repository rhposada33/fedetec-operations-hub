import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Building2, ClipboardCheck, Receipt, Users } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/async-state";
import { adminApi, paymentsApi } from "@/lib/api/client";
import { formatCurrency } from "@/lib/api/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Fedetec" },
      { name: "description", content: "Resumen operativo de Fedetec." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { token, user } = useAuth();
  const dashboard = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.dashboard(token!),
    enabled: Boolean(token),
  });
  const services = useQuery({
    queryKey: ["admin", "services", "recent"],
    queryFn: () => adminApi.services(token!),
    enabled: Boolean(token),
  });
  const technicians = useQuery({
    queryKey: ["admin", "technicians"],
    queryFn: () => adminApi.technicians(token!),
    enabled: Boolean(token),
  });
  const companies = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: () => adminApi.companies(token!),
    enabled: Boolean(token),
  });
  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: () => paymentsApi.list(token!),
    enabled: Boolean(token),
  });
  const pendingEvidenceQuery = useQuery({
    queryKey: ["admin", "evidence", "pending"],
    queryFn: () => adminApi.pendingEvidence(token!),
    enabled: Boolean(token),
  });

  if (dashboard.isLoading) return <LoadingState label="Cargando dashboard..." />;
  if (dashboard.isError)
    return <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />;

  const metrics = dashboard.data?.servicios_por_estado ?? [];
  const totalPayments = (payments.data ?? []).reduce(
    (sum, item) => sum + Number(item.valor ?? 0),
    0,
  );
  const availableTechs = (technicians.data ?? []).filter((item) => item.esta_disponible).length;
  const kpis = [
    { label: "Servicios", value: dashboard.data?.total_servicios ?? 0, icon: Activity },
    { label: "Técnicos disponibles", value: availableTechs, icon: Users },
    {
      label: "Empresas activas",
      value: (companies.data ?? []).filter((c) => c.esta_activa).length,
      icon: Building2,
    },
    {
      label: "Evidencias pendientes",
      value: pendingEvidenceQuery.data?.length ?? 0,
      icon: ClipboardCheck,
    },
    { label: "Pagos generados", value: formatCurrency(totalPayments), icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Buenos días, {user?.nombre_completo?.split(" ")[0] ?? "Fedetec"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Operación conectada al backend en tiempo real.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/servicios">Ver servicios</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <kpi.icon className="h-4 w-4" />
              </div>
              <div className="mt-4 text-2xl font-semibold tracking-tight">{kpi.value}</div>
              <div className="text-xs text-muted-foreground">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Estado de servicios</CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={metrics}
                  dataKey="total"
                  nameKey="estado"
                  innerRadius={55}
                  outerRadius={85}
                >
                  {metrics.map((item, index) => (
                    <Cell
                      key={item.estado}
                      fill={index % 2 === 0 ? "var(--color-primary)" : "var(--color-success)"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {metrics.map((item) => (
                <div key={item.estado} className="flex items-center justify-between text-xs">
                  <StatusBadge status={item.estado} />
                  <span className="font-medium">{item.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Servicios recientes</CardTitle>
            <CardDescription>Últimos registros cargados desde API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">ID</th>
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {(services.data ?? []).slice(0, 8).map((service) => (
                    <tr key={service.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 font-mono text-xs">{service.id.slice(0, 8)}</td>
                      <td className="py-3 text-muted-foreground">Tipo {service.tipo_servicio}</td>
                      <td className="py-3">
                        <StatusBadge status={service.estado} />
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(service.fecha_creacion).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
