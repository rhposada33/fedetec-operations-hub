import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — Fedetec" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Ajusta la operación y permisos de Fedetec</p>
      </div>

      <Tabs defaultValue="evidencias">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px] lg:grid-cols-6">
          <TabsTrigger value="evidencias">Evidencias</TabsTrigger>
          <TabsTrigger value="notificaciones">Notif.</TabsTrigger>
          <TabsTrigger value="radio">Radio</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="evidencias" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Aprobación de evidencias</CardTitle><CardDescription>Reglas del flujo de validación</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <Row label="Aprobación automática" desc="Si la calidad supera el umbral, se aprueba sin revisión.">
                <Switch defaultChecked />
              </Row>
              <Row label="Requerir 3 fotos mínimas" desc="Bloquea finalización si hay menos evidencia.">
                <Switch defaultChecked />
              </Row>
              <Row label="Permitir video" desc="Aceptar archivos .mp4 hasta 100MB.">
                <Switch />
              </Row>
              <Row label="Umbral de calidad" desc="Score mínimo del clasificador automático.">
                <div className="w-48"><Slider defaultValue={[78]} max={100} /></div>
              </Row>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Notificaciones</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <Row label="Email a empresas" desc="Resumen diario de operación."><Switch defaultChecked /></Row>
              <Row label="Push a técnicos" desc="Asignaciones y cambios de estado."><Switch defaultChecked /></Row>
              <Row label="Alertas críticas por SMS" desc="Solo eventos de alta prioridad."><Switch /></Row>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="radio" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Radio de servicio</CardTitle><CardDescription>Distancia máxima para asignar un técnico</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-2 block text-sm">Radio urbano</Label>
                <Slider defaultValue={[12]} max={50} />
                <div className="mt-1 text-xs text-muted-foreground">12 km</div>
              </div>
              <div>
                <Label className="mb-2 block text-sm">Radio rural</Label>
                <Slider defaultValue={[35]} max={100} />
                <div className="mt-1 text-xs text-muted-foreground">35 km</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagos" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Pagos</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <Row label="Periodicidad de liquidación" desc="">
                <Select defaultValue="weekly">
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diaria</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Retención fiscal" desc="">
                <Select defaultValue="2.5">
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="2.5">2.5%</SelectItem>
                    <SelectItem value="4">4%</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Generar facturas en PDF" desc=""><Switch defaultChecked /></Row>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Roles y permisos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { role: "Admin", perms: ["Todos los permisos"] },
                { role: "Operaciones", perms: ["Servicios", "Técnicos", "Evidencias"] },
                { role: "Finanzas", perms: ["Pagos", "Reportes"] },
                { role: "Soporte", perms: ["Lectura"] },
              ].map((r) => (
                <div key={r.role} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="font-medium">{r.role}</div>
                    <div className="text-xs text-muted-foreground">{r.perms.join(" · ")}</div>
                  </div>
                  <Button variant="outline" size="sm">Editar</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Preferencias del sistema</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <Row label="Idioma" desc="">
                <Select defaultValue="es">
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Zona horaria" desc="">
                <Select defaultValue="bog">
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bog">America/Bogotá (GMT-5)</SelectItem>
                    <SelectItem value="mex">America/Mexico_City (GMT-6)</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Telemetría anónima" desc="Ayúdanos a mejorar Fedetec."><Switch defaultChecked /></Row>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Cambios guardados")}>Guardar cambios</Button>
      </div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
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
