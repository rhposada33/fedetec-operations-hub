import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Phone, Search, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ErrorState, LoadingState } from "@/components/async-state";
import { adminApi } from "@/lib/api/client";
import { formatDate } from "@/lib/api/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/tecnicos")({
  head: () => ({ meta: [{ title: "Técnicos — Fedetec" }] }),
  component: TecnicosPage,
});

function TecnicosPage() {
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const technicians = useQuery({
    queryKey: ["admin", "technicians"],
    queryFn: () => adminApi.technicians(token!),
    enabled: Boolean(token),
  });

  const filtered = (technicians.data ?? []).filter((item) =>
    `${item.nombre_completo} ${item.correo}`.toLowerCase().includes(q.toLowerCase()),
  );

  if (technicians.isLoading) return <LoadingState label="Cargando técnicos..." />;
  if (technicians.isError)
    return <ErrorState error={technicians.error} onRetry={() => technicians.refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Técnicos</h1>
          <p className="text-sm text-muted-foreground">
            Red de {filtered.length} técnicos registrados
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar técnico..."
            className="pl-9"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tech) => (
          <Card key={tech.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {tech.nombre_completo
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{tech.nombre_completo}</div>
                    <div className="text-xs text-muted-foreground">{tech.correo}</div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tech.esta_disponible ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {tech.esta_disponible ? "Disponible" : "No disponible"}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <Stat icon={Phone} label="Teléfono" value={tech.telefono ?? "—"} />
                <Stat
                  icon={Clock}
                  label="Último GPS"
                  value={formatDate(tech.fecha_ultima_ubicacion)}
                />
                <Stat icon={MapPin} label="Latitud" value={tech.latitud?.toString() ?? "—"} />
                <Stat icon={MapPin} label="Longitud" value={tech.longitud?.toString() ?? "—"} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
