import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/client";
import { formatCurrency } from "@/lib/api/format";
import { useAuth } from "@/lib/auth";
import type { ServiceType } from "@/lib/api/types";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — Fedetec" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [typeForm, setTypeForm] = useState<ServiceTypeForm>(() => emptyTypeForm());
  const [editingType, setEditingType] = useState<ServiceType | null>(null);

  const serviceTypesQuery = useQuery({
    queryKey: ["admin", "service-types"],
    queryFn: () => adminApi.serviceTypes(token!),
    enabled: Boolean(token),
  });

  const saveTypeMutation = useMutation({
    mutationFn: () => {
      const payload = {
        nombre: typeForm.nombre.trim(),
        valor: Number(typeForm.valor),
        esta_activo: typeForm.esta_activo,
      };
      if (editingType) return adminApi.updateServiceType(token!, editingType.id, payload);
      return adminApi.createServiceType(token!, payload);
    },
    onSuccess: () => {
      toast.success(editingType ? "Tipo actualizado" : "Tipo creado");
      setTypeForm(emptyTypeForm());
      setEditingType(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "service-types"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible guardar el tipo"),
  });

  const deactivateTypeMutation = useMutation({
    mutationFn: (id: number) => adminApi.deactivateServiceType(token!, id),
    onSuccess: () => {
      toast.success("Tipo desactivado");
      queryClient.invalidateQueries({ queryKey: ["admin", "service-types"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible desactivar el tipo"),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Administra el catálogo de servicios.</p>
      </div>
      <div className="mt-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de servicio</CardTitle>
              <CardDescription>
                Valores visibles para técnicos y usados como base de pago.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Nombre</th>
                      <th className="px-4 py-3 font-medium">Valor</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(serviceTypesQuery.data ?? []).map((type) => (
                      <tr key={type.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">{type.nombre}</td>
                        <td className="px-4 py-3">{formatCurrency(type.valor)}</td>
                        <td className="px-4 py-3">{type.esta_activo ? "Activo" : "Inactivo"}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingType(type);
                              setTypeForm({
                                nombre: type.nombre,
                                valor: String(Number(type.valor)),
                                esta_activo: type.esta_activo,
                              });
                            }}
                          >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!type.esta_activo || deactivateTypeMutation.isPending}
                            onClick={() => deactivateTypeMutation.mutate(type.id)}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Desactivar
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(serviceTypesQuery.data ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                          No hay tipos de servicio configurados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{editingType ? "Editar tipo" : "Nuevo tipo"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={typeForm.nombre}
                  onChange={(event) => setTypeForm({ ...typeForm, nombre: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor COP</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={typeForm.valor}
                  onChange={(event) => setTypeForm({ ...typeForm, valor: event.target.value })}
                />
              </div>
              <Row label="Activo" desc="">
                <Switch
                  checked={typeForm.esta_activo}
                  onCheckedChange={(value) => setTypeForm({ ...typeForm, esta_activo: value })}
                />
              </Row>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={!tipoFormValido(typeForm) || saveTypeMutation.isPending}
                  onClick={() => saveTypeMutation.mutate()}
                >
                  <Plus className="mr-2 h-4 w-4" /> {editingType ? "Guardar" : "Crear"}
                </Button>
                {editingType && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingType(null);
                      setTypeForm(emptyTypeForm());
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

type ServiceTypeForm = {
  nombre: string;
  valor: string;
  esta_activo: boolean;
};

function emptyTypeForm(): ServiceTypeForm {
  return { nombre: "", valor: "", esta_activo: true };
}

function tipoFormValido(form: ServiceTypeForm) {
  return (
    form.nombre.trim().length > 0 && Number.isFinite(Number(form.valor)) && Number(form.valor) >= 0
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
