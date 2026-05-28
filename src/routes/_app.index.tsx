import { createFileRoute } from "@tanstack/react-router";
import {
  Activity, CheckCircle2, ClipboardCheck, MapPin, Wallet, TrendingUp, ArrowUpRight, MoreHorizontal,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  activity, notifications, revenueData, services, statusDistribution, technicians, weeklyServices,
  formatCurrency, formatDate,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Fedetec" },
      { name: "description", content: "Resumen operativo, KPIs y actividad en tiempo real de Fedetec." },
    ],
  }),
  component: Dashboard,
});

const kpis = [
  { label: "Servicios activos", value: "284", delta: "+12.4%", icon: Activity, tone: "primary" },
  { label: "Servicios completados", value: "1,948", delta: "+8.1%", icon: CheckCircle2, tone: "success" },
  { label: "Validaciones pendientes", value: "37", delta: "-3.2%", icon: ClipboardCheck, tone: "warning" },
  { label: "Técnicos en línea", value: "62", delta: "+5", icon: MapPin, tone: "info" },
  { label: "Pagos del mes", value: "$88.3M", delta: "+18.7%", icon: Wallet, tone: "primary" },
];

const toneClass: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  info: "bg-info/10 text-info",
};

function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Buenos días, Sofía</h1>
          <p className="text-sm text-muted-foreground">
            Esto es lo que está pasando en la operación de Fedetec hoy.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          Sistema operando con normalidad
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass[k.tone]}`}>
                  <k.icon className="h-4 w-4" />
                </div>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                  <ArrowUpRight className="h-3 w-3" /> {k.delta}
                </span>
              </div>
              <div className="mt-4 text-2xl font-semibold tracking-tight">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ingresos & servicios</CardTitle>
              <CardDescription>Tendencia mensual de pagos generados</CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3.5 w-3.5" /> +24% YoY
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de servicios</CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDistribution} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {statusDistribution.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {statusDistribution.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </div>
                  <span className="font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Servicios semanales</CardTitle>
            <CardDescription>Completados vs pendientes (últimos 7 días)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyServices}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="completados" fill="var(--color-success)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pendientes" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Tiempo real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-[10px]">
                    {a.user.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-xs">
                    <span className="font-medium">{a.user}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    <span className="font-medium text-primary">{a.target}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{a.time}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Servicios recientes</CardTitle>
              <CardDescription>Últimos 6 registros</CardDescription>
            </div>
            <button className="text-xs text-primary hover:underline">Ver todos</button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">ID</th>
                    <th className="pb-2 font-medium">Empresa</th>
                    <th className="pb-2 font-medium">Técnico</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {services.slice(0, 6).map((s) => (
                    <tr key={s.id} className="border-b border-border/60 last:border-0 transition hover:bg-muted/40">
                      <td className="py-3 font-mono text-xs">{s.id}</td>
                      <td className="py-3">{s.company}</td>
                      <td className="py-3 text-muted-foreground">{s.technician}</td>
                      <td className="py-3"><StatusBadge status={s.status} /></td>
                      <td className="py-3 text-right font-medium">{formatCurrency(s.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapa operativo</CardTitle>
            <CardDescription>Servicios cercanos en curso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-48 overflow-hidden rounded-lg border border-border bg-gradient-to-br from-info/10 via-muted to-primary/10">
              <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              {[
                { x: "20%", y: "30%", c: "bg-primary" },
                { x: "60%", y: "45%", c: "bg-success" },
                { x: "40%", y: "70%", c: "bg-info" },
                { x: "75%", y: "20%", c: "bg-primary" },
                { x: "30%", y: "55%", c: "bg-destructive" },
              ].map((p, i) => (
                <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y }}>
                  <span className={`relative flex h-3 w-3 ${p.c} rounded-full`}>
                    <span className={`absolute inset-0 ${p.c} animate-ping rounded-full opacity-60`} />
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {technicians.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${t.status === "online" ? "bg-success" : "bg-muted-foreground"}`} />
                    <span className="font-medium">{t.name}</span>
                  </div>
                  <span className="text-muted-foreground">{t.distance ? `${t.distance} km` : "—"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Notificaciones recientes</CardTitle>
            <CardDescription>Eventos de las últimas horas</CardDescription>
          </div>
          <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-lg border border-border bg-muted/30 p-3 transition hover:bg-muted/60">
              <div className="flex items-start gap-2">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-muted-foreground/40" : "bg-primary"}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">{n.desc}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{n.time}</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="text-[11px] text-muted-foreground">
        Última actualización: {formatDate(new Date().toISOString())}
      </div>
    </div>
  );
}
