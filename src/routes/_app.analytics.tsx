import { createFileRoute } from "@tanstack/react-router";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { revenueData, serviceTypeData, weeklyServices, technicians } from "@/lib/mock-data";
import { TrendingUp, TrendingDown, Users, Target } from "lucide-react";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Fedetec" }] }),
  component: AnalyticsPage,
});

const techPerf = technicians.slice(0, 6).map((t) => ({ name: t.name.split(" ")[0], jobs: t.jobs, rating: t.rating * 20 }));
const completion = [
  { week: "S1", rate: 88 }, { week: "S2", rate: 91 }, { week: "S3", rate: 89 },
  { week: "S4", rate: 94 }, { week: "S5", rate: 96 }, { week: "S6", rate: 93 },
];
const radar = [
  { metric: "Velocidad", A: 86 },
  { metric: "Calidad", A: 92 },
  { metric: "Cobertura", A: 78 },
  { metric: "Satisfacción", A: 95 },
  { metric: "Eficiencia", A: 84 },
];

function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Métricas avanzadas de la operación</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Ingresos del mes" value="$88.3M" delta="+18.7%" up icon={TrendingUp} />
        <Metric label="Servicios completados" value="245" delta="+11.2%" up icon={Target} />
        <Metric label="NPS técnico" value="72" delta="+4" up icon={Users} />
        <Metric label="Tiempo medio respuesta" value="6.4 min" delta="-9%" up={false} icon={TrendingDown} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & servicios</CardTitle>
            <CardDescription>Comparativo mensual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="services" stroke="var(--color-info)" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por tipo</CardTitle>
            <CardDescription>Servicios del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={serviceTypeData} dataKey="value" outerRadius={90} label={{ fontSize: 10 }}>
                  {serviceTypeData.map((_, i) => <Cell key={i} fill={`var(--color-chart-${(i % 5) + 1})`} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tasa de completitud</CardTitle>
            <CardDescription>Semanal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={completion}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="week" fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis domain={[80, 100]} fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="rate" stroke="var(--color-success)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-success)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rendimiento técnico</CardTitle>
            <CardDescription>Top 6 del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={techPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="jobs" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salud operativa</CardTitle>
            <CardDescription>Score multidimensional</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radar}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="metric" fontSize={10} stroke="var(--color-muted-foreground)" />
                <Radar dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mapa de calor geográfico</CardTitle>
          <CardDescription>Densidad de servicios por zona</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 12 * 8 }).map((_, i) => {
              const intensity = Math.floor((Math.sin(i * 0.7) + Math.cos(i * 0.3) + 2) * 25);
              const opacity = Math.min(0.9, Math.max(0.05, intensity / 100));
              return (
                <div
                  key={i}
                  className="aspect-square rounded transition hover:scale-110"
                  style={{ background: `color-mix(in oklab, var(--color-primary) ${opacity * 100}%, transparent)` }}
                  title={`${intensity} servicios`}
                />
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Menos</span>
            <div className="flex gap-0.5">
              {[0.1, 0.25, 0.5, 0.75, 0.95].map((o, i) => (
                <div key={i} className="h-3 w-5 rounded" style={{ background: `color-mix(in oklab, var(--color-primary) ${o * 100}%, transparent)` }} />
              ))}
            </div>
            <span>Más</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Servicios completados vs pendientes</CardTitle>
          <CardDescription>Últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyServices}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="completados" stackId="a" fill="var(--color-success)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pendientes" stackId="a" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, delta, up, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 ${up ? "text-success" : "text-destructive"}`} />
        </div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
        <div className={`mt-1 text-xs font-medium ${up ? "text-success" : "text-destructive"}`}>{delta}</div>
      </CardContent>
    </Card>
  );
}
