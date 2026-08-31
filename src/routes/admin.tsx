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

  // El panel administrativo es de acceso directo sin bloqueo de login/registro
  const activeEmail = session.email || "admin@dmschools.org";
  const activeRole = session.role || "super_admin";

  return (
    <AdminShell email={activeEmail} role={activeRole}>
      <Outlet />
    </AdminShell>
  );
}
