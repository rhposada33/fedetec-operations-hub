import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wrench,
  Users,
  Building2,
  ImageIcon,
  Receipt,
  Map,
  Settings,
  Bell,
  BarChart3,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Servicios", url: "/servicios", icon: Wrench },
  { title: "Técnicos", url: "/tecnicos", icon: Users },
  { title: "Empresas", url: "/empresas", icon: Building2 },
  { title: "Evidencias", url: "/evidencias", icon: ImageIcon },
  { title: "Pagos", url: "/pagos", icon: Receipt },
  { title: "Mapa operativo", url: "/mapa", icon: Map },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Notificaciones", url: "/notificaciones", icon: Bell },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Zap className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold tracking-tight">Fedetec</div>
          <div className="text-[11px] text-muted-foreground">Operations console</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Plataforma
        </div>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
            return (
              <li key={item.url}>
                <Link
                  to={item.url}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span>{item.title}</span>
                  {item.title === "Notificaciones" && (
                    <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      3
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="m-3 rounded-xl border border-sidebar-border bg-gradient-to-br from-primary/10 to-primary/5 p-4">
        <div className="text-xs font-semibold">Soporte 24/7</div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Operación monitoreada en tiempo real. Tiempo medio de respuesta: 47s.
        </p>
        <button className="mt-3 w-full rounded-md bg-primary px-2 py-1.5 text-[11px] font-semibold text-primary-foreground transition hover:bg-primary/90">
          Contactar mesa de ayuda
        </button>
      </div>
    </aside>
  );
}
