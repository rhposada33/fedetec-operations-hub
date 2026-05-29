import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Mail, Phone, LockKeyhole, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ErrorState, LoadingState } from "@/components/async-state";
import { adminApi, ApiError, companiesApi } from "@/lib/api/client";
import type { Company, UpdateCompanyPayload } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/empresas")({
  head: () => ({ meta: [{ title: "Empresas — Fedetec" }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    identificacion_tributaria: "",
    correo_contacto: "",
    telefono_contacto: "",
    password: "",
  });
  const [editForm, setEditForm] = useState(() => crearFormularioEditarEmpresa());

  const companies = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: () => adminApi.companies(token!),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: () => companiesApi.create(token!, { ...form, esta_activa: true }),
    onSuccess: (company) => {
      toast.success(`Empresa creada. Login: ${company.correo_contacto}`);
      setOpen(false);
      setForm({
        nombre: "",
        identificacion_tributaria: "",
        correo_contacto: "",
        telefono_contacto: "",
        password: "",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No fue posible crear la empresa"),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("Empresa no seleccionada");
      return companiesApi.update(token!, editing.id, construirPayloadActualizarEmpresa(editForm));
    },
    onSuccess: (company) => {
      toast.success(`Empresa actualizada: ${company.nombre}`);
      setEditing(null);
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("No fue posible actualizar. Revisa si el correo ya existe.");
        return;
      }
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar la empresa");
    },
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
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${company.esta_activa ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {company.esta_activa ? "Activa" : "Inactiva"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(company);
                    setEditForm(crearFormularioEditarEmpresa(company));
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
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
                  <LockKeyhole className="h-3 w-3" /> Login empresa
                </div>
                <code className="mt-1 block text-[11px] text-muted-foreground">
                  {company.usuario_id ? "Usuario vinculado" : "Sin usuario vinculado"}
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
            <Field
              label="Contraseña inicial"
              type="password"
              value={form.password}
              onChange={(value) => setForm({ ...form, password: value })}
            />
            <Button
              className="w-full"
              disabled={
                createMutation.isPending ||
                !form.nombre ||
                !form.correo_contacto ||
                form.password.length < 8
              }
              onClick={() => createMutation.mutate()}
            >
              Crear login de empresa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(value) => {
          setEditOpen(value);
          if (!value) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar empresa cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <EmpresaEditForm form={editForm} setForm={setEditForm} />
            <Button
              className="w-full"
              disabled={!formularioEditarEmpresaValido(editForm) || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              <Pencil className="mr-2 h-4 w-4" /> Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmpresaEditForm({
  form,
  setForm,
}: {
  form: EmpresaEditFormState;
  setForm: (form: EmpresaEditFormState) => void;
}) {
  return (
    <>
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
        type="email"
        value={form.correo_contacto}
        onChange={(value) => setForm({ ...form, correo_contacto: value })}
      />
      <Field
        label="Teléfono contacto"
        value={form.telefono_contacto}
        onChange={(value) => setForm({ ...form, telefono_contacto: value })}
      />
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label>Empresa activa</Label>
        <Switch
          checked={form.esta_activa}
          onCheckedChange={(checked) => setForm({ ...form, esta_activa: checked })}
        />
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

type EmpresaEditFormState = {
  nombre: string;
  identificacion_tributaria: string;
  correo_contacto: string;
  telefono_contacto: string;
  esta_activa: boolean;
};

function crearFormularioEditarEmpresa(company?: Company): EmpresaEditFormState {
  return {
    nombre: company?.nombre ?? "",
    identificacion_tributaria: company?.identificacion_tributaria ?? "",
    correo_contacto: company?.correo_contacto ?? "",
    telefono_contacto: company?.telefono_contacto ?? "",
    esta_activa: company?.esta_activa ?? true,
  };
}

function formularioEditarEmpresaValido(form: EmpresaEditFormState) {
  return form.nombre.trim().length > 0 && form.correo_contacto.trim().length > 0;
}

function construirPayloadActualizarEmpresa(form: EmpresaEditFormState): UpdateCompanyPayload {
  return {
    nombre: form.nombre.trim(),
    identificacion_tributaria: form.identificacion_tributaria.trim() || null,
    correo_contacto: form.correo_contacto.trim(),
    telefono_contacto: form.telefono_contacto.trim() || null,
    esta_activa: form.esta_activa,
  };
}
