import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/async-state";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { token, isLoading, isAdmin, isTechnician, isCompany } = useAuth();

  if (!token || (!isLoading && !isAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Acceso administrativo requerido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesión como administrador para usar la consola operativa.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            {isTechnician && (
              <Button asChild variant="outline">
                <Link to="/tecnico">Ir a técnico</Link>
              </Button>
            )}
            {isCompany && (
              <Button asChild variant="outline">
                <Link to="/empresa">Ir a empresa</Link>
              </Button>
            )}
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <LoadingState label="Validando sesión..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
