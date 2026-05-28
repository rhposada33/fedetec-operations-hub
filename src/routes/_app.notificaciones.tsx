import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Check, Wrench, UserCheck, XCircle, Image as ImgIcon, Wallet, WifiOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notifications as base } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/notificaciones")({
  head: () => ({ meta: [{ title: "Notificaciones — Fedetec" }] }),
  component: NotifsPage,
});

const iconFor: Record<string, any> = {
  service_assigned: Wrench,
  service_accepted: UserCheck,
  service_rejected: XCircle,
  evidence_uploaded: ImgIcon,
  payment_generated: Wallet,
  technician_offline: WifiOff,
};

function NotifsPage() {
  const [items, setItems] = useState(
    [...base, ...base.map((n) => ({ ...n, id: n.id + 100, time: "hace 4 h" }))].map((n, i) => ({ ...n, id: i + 1 })),
  );
  const [tab, setTab] = useState<"all" | "unread">("all");

  const list = tab === "unread" ? items.filter((n) => !n.read) : items;
  const markAll = () => setItems(items.map((n) => ({ ...n, read: true })));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">{items.filter((n) => !n.read).length} sin leer</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="unread">Sin leer</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={markAll}><Check className="mr-2 h-4 w-4" /> Marcar leídas</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <div className="text-sm font-medium">Todo al día</div>
              <div className="text-xs text-muted-foreground">No hay notificaciones nuevas.</div>
            </div>
          ) : (
            list.map((n) => {
              const Icon = iconFor[n.type] ?? Bell;
              const priorityColor = n.priority === "high" ? "bg-destructive" : n.priority === "medium" ? "bg-warning" : "bg-info";
              return (
                <div key={n.id} className={`flex items-start gap-3 border-b border-border px-5 py-4 last:border-0 transition hover:bg-muted/30 ${!n.read ? "bg-primary/[0.03]" : ""}`}>
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {!n.read && <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${priorityColor}`} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{n.title}</div>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {n.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{n.desc}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{n.time}</div>
                  </div>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => setItems(items.map((x) => x.id === n.id ? { ...x, read: true } : x))}>
                      Marcar
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
