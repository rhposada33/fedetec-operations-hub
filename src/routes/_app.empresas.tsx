import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Mail, Phone, Key, Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "@/components/async-state";
import { adminApi, companiesApi } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/empresas")({
  head: () => ({ meta: [{ title: "Empresas — Fedetec" }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    identificacion_tributaria: "",
    correo_contacto: "",
    telefono_contacto: "",
  });

  const companies = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: () => adminApi.companies(token!),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: () => companiesApi.create(token!, { ...form, esta_activa: true }),
    onSuccess: (company) => {
      setApiKey(company.api_key);
      setOpen(false);
      setForm({
        nombre: "",
        identificacion_tributaria: "",
        correo_contacto: "",
        telefono_contacto: "",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible crear la empresa"),
  });

  if (companies.isLoading) return <LoadingState label="Cargando empresas..." />;
  if (companies.isError)
    return <ErrorState error={companies.error} onRetry={() => companies.refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas cliente</h1>
          <p className="text-sm text-muted-foreground">
            {companies.data?.length ?? 0} empresas conectadas vía API
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(companies.data ?? []).map((company) => (
          <Card key={company.id} className="transition hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{company.nombre}</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {company.identificacion_tributaria ?? "Sin NIT"}
                  </div>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${company.esta_activa ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
              >
                {company.esta_activa ? "Activa" : "Inactiva"}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" /> {company.correo_contacto ?? "—"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" /> {company.telefono_contacto ?? "—"}
                </div>
              </div>
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <Key className="h-3 w-3" /> API key
                </div>
                <code className="mt-1 block text-[11px] text-muted-foreground">
                  Solo visible al crear
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva empresa cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field
              label="Nombre"
              value={form.nombre}
              onChange={(value) => setForm({ ...form, nombre: value })}
            />
            <Field
              label="Identificación tributaria"
              value={form.identificacion_tributaria}
              onChange={(value) => setForm({ ...form, identificacion_tributaria: value })}
            />
            <Field
              label="Correo contacto"
              value={form.correo_contacto}
              onChange={(value) => setForm({ ...form, correo_contacto: value })}
            />
            <Field
              label="Teléfono contacto"
              value={form.telefono_contacto}
              onChange={(value) => setForm({ ...form, telefono_contacto: value })}
            />
            <Button
              className="w-full"
              disabled={createMutation.isPending || !form.nombre}
              onClick={() => createMutation.mutate()}
            >
              Crear y generar API key
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!apiKey} onOpenChange={(open) => !open && setApiKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API key generada</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Copia esta clave ahora. No volverá a mostrarse.
          </p>
          <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs break-all">
            {apiKey}
          </div>
          <Button
            onClick={() => {
              navigator.clipboard?.writeText(apiKey ?? "");
              toast.success("API key copiada");
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> Copiar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
