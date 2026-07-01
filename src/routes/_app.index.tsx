import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Gauge, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/async-state";
import { adminApi } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Técnicos — Fedetec" }] }),
  component: TechnicianDashboard,
});

function TechnicianDashboard() {
  const { token, user } = useAuth();
  const technicians = useQuery({
    queryKey: ["admin", "technicians"],
    queryFn: () => adminApi.technicians(token!),
    enabled: Boolean(token),
  });

  if (technicians.isLoading) return <LoadingState label="Cargando técnicos..." />;
  if (technicians.isError) {
    return <ErrorState error={technicians.error} onRetry={() => technicians.refetch()} />;
  }

  const records = technicians.data ?? [];
  const available = records.filter((item) => item.esta_disponible).length;
  const active = records.filter((item) => item.esta_activo).length;
  const metrics = [
    { label: "Técnicos registrados", value: records.length, icon: Users },
    { label: "Técnicos activos", value: active, icon: CheckCircle2 },
    { label: "Disponibles ahora", value: available, icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hola, {user?.nombre_completo?.split(" ")[0] ?? "administrador"}
          </h1>
          <p className="text-sm text-muted-foreground">Resumen del equipo técnico.</p>
        </div>
        <Button asChild><Link to="/tecnicos">Gestionar técnicos</Link></Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5">
              <metric.icon className="h-5 w-5 text-primary" />
              <div className="mt-4 text-3xl font-semibold">{metric.value}</div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad técnica</CardTitle>
          <CardDescription>Estado actual sin información de empresas o servicios.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-semibold">{records.length ? Math.round((available / records.length) * 100) : 0}%</div>
          <p className="mt-1 text-sm text-muted-foreground">{available} de {records.length} técnicos disponibles.</p>
        </CardContent>
      </Card>
    </div>
  );
}
