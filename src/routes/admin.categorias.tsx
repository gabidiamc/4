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
        school_id: "all",
        description: "",
        icon: "BookOpen",
        display_order: 0,
        is_visible: true,
        is_featured: false,
      }}
      fields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug (dirección web)", required: true },
        {
          name: "school_id",
          label: "Escuela",
          type: "select",
          options: [
            { value: "all", label: "Todas las escuelas (Distrito completo)" },
            { value: "lincoln", label: "Abraham Lincoln High School (Lincoln)" },
            { value: "east", label: "Des Moines East High School (East)" },
          ],
          help: "Determina si esta categoría está disponible en una escuela específica o para todo el distrito.",
        },
        { name: "description", label: "Descripción corta", type: "textarea" },
        {
          name: "icon",
          label: "Icono (nombre de Lucide)",
          help: "Ej.: BookOpen, GraduationCap, Bus, Utensils, HeartPulse, Trophy, Sparkles, HelpCircle",
        },
        { name: "display_order", label: "Orden", type: "number" },
        { name: "is_visible", label: "Visible en el sitio", type: "checkbox" },
        { name: "is_featured", label: "Destacada en la portada", type: "checkbox" },
      ]}
    />
  ),
});
