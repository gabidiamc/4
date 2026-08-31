import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarSync, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { CrudManager } from "@/components/admin/crud-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { syncCalendarNow } from "@/lib/dmps-calendar.functions";
import { useSchool } from "@/lib/school";

function DmpsCalendarImport() {
  const { adminSchoolFilter } = useSchool();
  const targetSchool = adminSchoolFilter === "east" ? "east" : "lincoln";
  const sync = useServerFn(syncCalendarNow);

  const importer = useMutation({
    mutationFn: () => sync({ data: { schoolId: targetSchool } }),
    onSuccess: (res) => {
      const total = (res.results ?? []).reduce((acc, r) => acc + (r.imported ?? 0), 0);
      toast.success(`Calendario importado: ${total} eventos oficiales actualizados.`);
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo importar el calendario."),
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarSync className="h-4 w-4" /> Importar del calendario oficial de DMPS
        </CardTitle>
        <CardDescription>
          Trae automáticamente días sin clases, conferencias y eventos del distrito junto con los
          eventos de {targetSchool === "east" ? "East High School" : "Abraham Lincoln High School"}.
          Los eventos se actualizan solos cada 6 horas; usa este botón para forzar la actualización.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => importer.mutate()} disabled={importer.isPending}>
          {importer.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando…
            </>
          ) : (
            <>Importar ahora ({targetSchool === "east" ? "East" : "Lincoln"} + Distrito)</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute("/admin/calendario")({
  component: () => (
    <>
      <DmpsCalendarImport />
      <CrudManager
        table="events"
        title="Calendario escolar"
        description="Fechas clave, días sin clases, conferencias y eventos familiares."
        orderBy="start_date"
        ascending
        columns={[
          { name: "title", label: "Evento" },
          { name: "start_date", label: "Inicio" },
          { name: "event_type", label: "Tipo" },
          { name: "status", label: "Estado" },
        ]}
        defaults={{
          title: "",
          slug: "",
          event_type: "general",
          start_date: new Date().toISOString().slice(0, 10),
          all_day: true,
          is_cancelled: false,
          is_featured: false,
          status: "draft",
          image_url: "",
          location: "",
          official_url: "",
          description: "",
        }}
        fields={[
          { name: "title", label: "Título del evento", required: true },
          { name: "slug", label: "Slug (URL amigable)", required: true },
          {
            name: "event_type",
            label: "Tipo de evento",
            type: "select",
            options: [
              { value: "general", label: "General" },
              { value: "family", label: "Evento familiar" },
              { value: "workshop", label: "Taller / Capacitación" },
              { value: "conference", label: "Conferencias de padres" },
              { value: "sports", label: "Deportes / Juegos" },
              { value: "holiday", label: "Día festivo" },
              { value: "no_school", label: "Sin clases" },
              { value: "deadline", label: "Fecha límite" },
            ],
          },
          { name: "image_url", label: "URL de Imagen / Banner (Opcional)", type: "url" },
          { name: "start_date", label: "Fecha de inicio", type: "date", required: true },
          { name: "end_date", label: "Fecha final (Opcional)", type: "date" },
          { name: "start_time", label: "Hora de inicio (HH:MM)" },
          { name: "end_time", label: "Hora final (HH:MM)" },
          { name: "location", label: "Lugar físico (Dirección o Nombre de Sala) o 'En Línea'" },
          {
            name: "official_url",
            label: "Enlace virtual / Link oficial (Zoom, Teams, Meet o Registro)",
            type: "url",
          },
          { name: "description", label: "Descripción / Detalles", type: "textarea" },
          { name: "all_day", label: "Todo el día", type: "checkbox" },
          { name: "is_featured", label: "Destacar en banner principal público", type: "checkbox" },
          { name: "is_cancelled", label: "Cancelado", type: "checkbox" },
          {
            name: "status",
            label: "Estado de vigencia",
            type: "select",
            options: [
              { value: "published", label: "Publicado (Activo y Vigente)" },
              { value: "draft", label: "Borrador (Oculto)" },
              { value: "archived", label: "Archivado (Desactivado)" },
            ],
          },
        ]}
        translations={{
          table: "event_translations",
          fkColumn: "event_id",
          fields: [
            { name: "title", label: "Título", required: true },
            { name: "description", label: "Descripción", type: "textarea" },
          ],
        }}
      />
    </>
  ),
});
