import { createFileRoute } from "@tanstack/react-router";

import { CrudManager } from "@/components/admin/crud-manager";

export const Route = createFileRoute("/admin/escuelas")({
  component: () => (
    <CrudManager
      table="schools"
      title="Escuelas"
      description="Direcciones, teléfonos, horarios y sitios oficiales de cada escuela."
      orderBy="name"
      ascending
      columns={[
        { name: "name", label: "Escuela" },
        { name: "level", label: "Nivel" },
        { name: "phone", label: "Teléfono" },
        { name: "is_visible", label: "Visible" },
      ]}
      defaults={{ name: "", slug: "", level: "elementary", is_visible: true, display_order: 0 }}
      fields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug", required: true },
        {
          name: "level",
          label: "Nivel",
          type: "select",
          options: [
            { value: "preschool", label: "Preescolar" },
            { value: "elementary", label: "Primaria" },
            { value: "middle", label: "Secundaria" },
            { value: "high", label: "Preparatoria" },
            { value: "district", label: "Distrito" },
          ],
        },
        { name: "address", label: "Dirección" },
        { name: "city", label: "Ciudad" },
        { name: "state", label: "Estado" },
        { name: "postal_code", label: "Código postal" },
        { name: "phone", label: "Teléfono" },
        { name: "hours", label: "Horario" },
        { name: "website_url", label: "Sitio oficial", type: "url" },
        { name: "image_url", label: "Imagen (URL)", type: "url" },
        { name: "description", label: "Descripción", type: "textarea" },
        { name: "display_order", label: "Orden", type: "number" },
        { name: "is_visible", label: "Visible", type: "checkbox" },
      ]}
      translations={{
        table: "school_translations",
        fkColumn: "school_id",
        fields: [
          { name: "name", label: "Nombre", required: true },
          { name: "description", label: "Descripción", type: "textarea" },
        ],
      }}
    />
  ),
});
