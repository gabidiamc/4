import { createFileRoute } from "@tanstack/react-router";

import { CrudManager } from "@/components/admin/crud-manager";

export const Route = createFileRoute("/admin/categorias")({
  component: () => (
    <CrudManager
      table="categories"
      title="Categorías"
      description="Organiza los temas que ven las familias en el sitio público."
      orderBy="display_order"
      ascending
      columns={[
        { name: "name", label: "Nombre" },
        { name: "slug", label: "Slug" },
        { name: "display_order", label: "Orden" },
        { name: "is_visible", label: "Visible" },
      ]}
      defaults={{
        name: "",
        slug: "",
        school_id: "lincoln",
        description: "",
        icon: "BookOpen",
        display_order: 0,
        is_visible: true,
        is_featured: false,
      }}
      fields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug (dirección web)", required: true },
        { name: "description", label: "Descripción corta", type: "textarea" },
        {
          name: "icon",
          label: "Icono (nombre de Lucide)",
          help: "Ej.: BookOpen, GraduationCap, Bus, Utensils, HeartPulse",
        },
        { name: "display_order", label: "Orden", type: "number" },
        { name: "is_visible", label: "Visible en el sitio", type: "checkbox" },
        { name: "is_featured", label: "Destacada en la portada", type: "checkbox" },
      ]}
      translations={{
        table: "category_translations",
        fkColumn: "category_id",
        fields: [
          { name: "name", label: "Nombre", required: true },
          { name: "description", label: "Descripción", type: "textarea" },
        ],
      }}
    />
  ),
});
