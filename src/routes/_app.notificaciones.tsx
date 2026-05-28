import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/_app/notificaciones")({
  head: () => ({ meta: [{ title: "Notificaciones — Fedetec" }] }),
  component: NotificacionesPage,
});

function NotificacionesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notificaciones</h1>
        <p className="text-sm text-muted-foreground">Centro de eventos operativos</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Sin feed backend
          </CardTitle>
          <CardDescription>
            El backend actual crea notificaciones para técnicos, pero todavía no expone un endpoint
            de lectura para esta consola.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Cuando exista un endpoint de notificaciones, esta vista puede conectarse con React Query
          usando el mismo cliente API.
        </CardContent>
      </Card>
    </div>
  );
}
