import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/async-state";
import { adminApi, paymentsApi } from "@/lib/api/client";
import { formatCurrency } from "@/lib/api/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Fedetec" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { token } = useAuth();
  const dashboard = useQuery({
    queryKey: ["admin", "dashboard", "analytics"],
    queryFn: () => adminApi.dashboard(token!),
    enabled: Boolean(token),
  });
  const payments = useQuery({
    queryKey: ["payments", "analytics"],
    queryFn: () => paymentsApi.list(token!),
    enabled: Boolean(token),
  });

  if (dashboard.isLoading || payments.isLoading)
    return <LoadingState label="Cargando analytics..." />;
  if (dashboard.isError)
    return <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />;
  if (payments.isError)
    return <ErrorState error={payments.error} onRetry={() => payments.refetch()} />;

  const statusData = dashboard.data?.servicios_por_estado ?? [];
  const totalPayments = (payments.data ?? []).reduce(
    (sum, report) => sum + Number(report.valor ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores derivados de los endpoints admin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Servicios por estado</CardTitle>
            <CardDescription>
              {dashboard.data?.total_servicios ?? 0} servicios totales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="estado" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagos</CardTitle>
            <CardDescription>Reportes generados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{formatCurrency(totalPayments)}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {payments.data?.length ?? 0} reportes de pago
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
