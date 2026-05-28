import { createFileRoute } from "@tanstack/react-router";
import { Building2, Mail, Phone, Key, TrendingUp, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { companies } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/empresas")({
  head: () => ({ meta: [{ title: "Empresas — Fedetec" }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Empresas cliente</h1>
        <p className="text-sm text-muted-foreground">{companies.length} empresas conectadas vía API</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {companies.map((c) => (
          <Card key={c.id} className="transition hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <div className="text-xs text-muted-foreground">{c.taxId}</div>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {c.active ? "Activa" : "Inactiva"}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3 w-3" /> {c.email}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" /> {c.phone}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/30 p-3 text-center">
                <div>
                  <div className="text-lg font-semibold">{c.services}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Activos</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-success">{c.completed}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Completados</div>
                </div>
                <div>
                  <div className={`text-lg font-semibold ${c.payment === "Al día" ? "text-success" : "text-warning-foreground"}`}>{c.payment === "Al día" ? "✓" : "!"}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.payment}</div>
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <Key className="h-3 w-3" /> API key
                  </div>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(`fdt_live_${c.id}_xkq39d`); toast.success("API key copiada"); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <code className="mt-1 block truncate font-mono text-[11px]">fdt_live_{c.id}_xkq39d•••</code>
              </div>

              <Button variant="outline" className="w-full" size="sm">
                <TrendingUp className="mr-2 h-3.5 w-3.5" /> Ver estadísticas
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
