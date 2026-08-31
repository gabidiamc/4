import { createFileRoute } from "@tanstack/react-router";

import { CrudManager } from "@/components/admin/crud-manager";

const STATUS = [
  { value: "draft", label: "Borrador" },
  { value: "in_review", label: "En revisión" },
  { value: "scheduled", label: "Programado" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" },
];

export const Route = createFileRoute("/admin/anuncios")({
  component: () => (
    <CrudManager
      table="announcements"
      title="Anuncios"
      description="Avisos con nivel de urgencia y caducidad automática. El texto se escribe en cada idioma."
      columns={[
        { name: "level", label: "Nivel" },
        { name: "status", label: "Estado" },
        { name: "starts_at", label: "Inicia" },
        { name: "expires_at", label: "Caduca" },
      ]}
      defaults={{
        level: "info",
        status: "draft",
        starts_at: new Date().toISOString(),
        expires_at: null,
        show_on_home: true,
        is_pinned: false,
        link_url: null,
        category_ids: [],
      }}
      fields={[
        {
          name: "level",
          label: "Nivel",
          type: "select",
          required: true,
          options: [
            { value: "info", label: "Información" },
            { value: "important", label: "Importante" },
            { value: "urgent", label: "Urgente" },
          ],
        },
        { name: "status", label: "Estado", type: "select", required: true, options: STATUS },
        { name: "starts_at", label: "Empieza", type: "datetime" },
        { name: "expires_at", label: "Caduca automáticamente", type: "datetime" },
        { name: "link_url", label: "Enlace (opcional)", type: "url" },
        { name: "show_on_home", label: "Mostrar en la portada", type: "checkbox" },
        { name: "is_pinned", label: "Fijar arriba", type: "checkbox" },
      ]}
      translations={{
        table: "announcement_translations",
        fkColumn: "announcement_id",
        fields: [
          { name: "title", label: "Título", required: true },
          { name: "message", label: "Mensaje", type: "textarea", required: true },
        ],
      }}
    />
  ),
});
