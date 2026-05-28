import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — Fedetec" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [autoApproval, setAutoApproval] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updateConfig(token!, {
        modo: autoApproval ? "AUTO" : "MANUAL",
        roles_permitidos: ["ADMIN"],
      }),
    onSuccess: () => {
      toast.success("Configuración guardada");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible guardar"),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Ajusta la operación y permisos de Fedetec</p>
      </div>

      <Tabs defaultValue="evidencias">
        <TabsList className="grid w-full grid-cols-2 lg:w-[420px]">
          <TabsTrigger value="evidencias">Evidencias</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="evidencias" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Aprobación de evidencias</CardTitle>
              <CardDescription>
                Configura si las evidencias quedan pendientes o aprobadas automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Row
                label="Aprobación automática"
                desc="Modo AUTO aprueba la evidencia al crearla. Modo MANUAL requiere revisión admin."
              >
                <Switch checked={autoApproval} onCheckedChange={setAutoApproval} />
              </Row>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias del sistema</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Las demás preferencias aún no tienen endpoint backend.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      {children}
    </div>
  );
}
