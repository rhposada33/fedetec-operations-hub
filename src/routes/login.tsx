import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LockKeyhole, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Fedetec" }] }),
  component: LoginPage,
});

function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await auth.login(correo, password);
      toast.success("Sesión iniciada");
      if (user.roles.includes("ADMIN")) await navigate({ to: "/" });
      else if (user.roles.includes("TECNICO")) await navigate({ to: "/tecnico" });
      else await navigate({ to: "/empresa" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Fedetec Operations Hub</CardTitle>
            <CardDescription>Ingresa con tu usuario operativo, técnico o empresa.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="correo">Correo</Label>
              <Input
                id="correo"
                type="email"
                autoComplete="email"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="mr-2 h-4 w-4" />
              )}
              Iniciar sesión
            </Button>
          </form>
          <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Las empresas cliente pueden entrar al portal con su correo y contraseña desde{" "}
            <a className="font-medium text-primary hover:underline" href="/empresa">
              /empresa
            </a>
            .
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
