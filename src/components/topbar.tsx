import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Moon, Sun, Search, Menu, ChevronRight, Settings, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { AppSidebar } from "./app-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/servicios": "Servicios",
  "/tecnicos": "Técnicos",
  "/empresas": "Empresas cliente",
  "/evidencias": "Evidencias",
  "/pagos": "Reportes de pago",
  "/mapa": "Mapa operativo",
  "/analytics": "Analytics",
  "/notificaciones": "Notificaciones",
  "/configuracion": "Configuración",
};

export function Topbar() {
  const { theme, toggle } = useTheme();
  const auth = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [sheetOpen, setSheetOpen] = useState(false);
  const unread = 0;
  const title = titleMap[pathname] ?? "Fedetec";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button className="rounded-md p-2 text-muted-foreground transition hover:bg-accent lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AppSidebar onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="hidden text-muted-foreground sm:inline">Fedetec</span>
        <ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground sm:inline" />
        <span className="truncate font-medium">{title}</span>
      </div>

      <div className="relative ml-auto hidden flex-1 max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Buscar servicios, técnicos, empresas..."
          className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none transition focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/15"
        />
        <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline">
          ⌘K
        </kbd>
      </div>

      <button
        onClick={toggle}
        className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {unread}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notificaciones</span>
            <span className="text-[10px] font-normal text-muted-foreground">{unread} nuevas</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="py-3 text-xs text-muted-foreground">
            No hay endpoint de notificaciones disponible todavía.
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition hover:bg-accent">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                SC
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left text-xs leading-tight sm:block">
              <div className="font-semibold">{auth.user?.nombre_completo ?? "Usuario"}</div>
              <div className="text-muted-foreground">
                {auth.user?.roles.join(", ") || "Operación"}
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" /> Perfil
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" /> Configuración
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => {
              auth.logout();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
