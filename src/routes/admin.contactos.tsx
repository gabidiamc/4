import { createFileRoute } from "@tanstack/react-router";

import { CrudManager } from "@/components/admin/crud-manager";

export const Route = createFileRoute("/admin/contactos")({
  component: () => (
    <CrudManager
      table="contacts"
      title="Directorio de contactos"
      description="Teléfonos, correos, horarios y departamentos. Actualízalos en cualquier momento."
      orderBy="department"
      ascending
      columns={[
        { name: "department", label: "Departamento" },
        { name: "phone", label: "Teléfono" },
        { name: "email", label: "Correo" },
        { name: "is_visible", label: "Visible" },
      ]}
      defaults={{
        department: "",
        is_visible: true,
        languages: [],
        category_ids: [],
        verification_status: "unverified",
      }}
      fields={[
        { name: "department", label: "Departamento", required: true },
        { name: "person_name", label: "Persona de contacto" },
        { name: "job_title", label: "Puesto" },
        { name: "phone", label: "Teléfono" },
        { name: "extension", label: "Extensión" },
        { name: "email", label: "Correo electrónico" },
        { name: "address", label: "Dirección" },
        { name: "hours", label: "Horario" },
        {
          name: "verification_status",
          label: "Verificación",
          type: "select",
          options: [
            { value: "unverified", label: "Sin verificar" },
            { value: "verified", label: "Verificado" },
            { value: "needs_review", label: "Necesita revisión" },
          ],
        },
        { name: "is_visible", label: "Visible al público", type: "checkbox" },
      ]}
    />
  ),
});
