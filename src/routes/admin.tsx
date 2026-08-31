import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSession } from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel administrativo — DMPS Family Info" },
      { name: "description", content: "Área privada para el personal autorizado de DMPS." },
      { property: "og:title", content: "Panel administrativo — DMPS Family Info" },
      { property: "og:description", content: "Área privada para el personal autorizado." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const session = useAdminSession();
  const navigate = useNavigate();

  if (session.loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 p-8">
        <Skeleton className="h-10 w-1/3 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!session.userId) {
    void navigate({ to: "/admin/login", replace: true });
    return null;
  }

  if (!session.role) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="surface-card max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold">Cuenta sin permisos</h1>
          <p className="mt-2 text-muted-foreground">
            Tu cuenta existe pero todavía no tiene un rol asignado. Pide a un administrador
            principal que te envíe una invitación.
          </p>
          <Button className="mt-6 min-h-11 rounded-xl" onClick={() => void navigate({ to: "/" })}>
            Volver al sitio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminShell email={session.email} role={session.role}>
      <Outlet />
    </AdminShell>
  );
}
