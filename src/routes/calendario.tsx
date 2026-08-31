import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Download,
  ExternalLink,
  Maximize2,
  Sparkles,
  CalendarCheck,
  Building,
  Video,
  Clock,
  MapPin,
  ChevronRight,
  Filter,
  ArrowRight,
  Calendar as CalendarIcon,
  FileText,
} from "lucide-react";
import { useState, useMemo } from "react";

import calendarImage from "@/assets/dmps-calendar-2026-2027.jpg.asset.json";
import calendarPdf from "@/assets/dmps-calendar-2026-2027.pdf.asset.json";
import { PublicShell } from "@/components/public-shell";
import { OfficialDataBadge } from "@/components/official-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";
import { fetchEvents, localizedEvent, type EventRow } from "@/lib/content";
import { formatDesMoinesDate } from "@/lib/content-lifecycle";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario escolar 2026-2027 — Familias DMPS" },
      {
        name: "description",
        content:
          "Calendario oficial 2026-2027 de Des Moines Public Schools: inicio y fin de clases, días sin clases, conferencias y eventos escolares.",
      },
      { property: "og:title", content: "Calendario escolar 2026-2027 — Familias DMPS" },
      {
        property: "og:description",
        content: "Calendario oficial 2026-2027 de DMPS para las familias.",
      },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();
  const [activeTab, setActiveTab] = useState<"agenda" | "district_pdf">("agenda");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public_calendar_events", selectedSchool.id],
    queryFn: () => fetchEvents(selectedSchool.id),
  });

  const isSpanish = lang === "es";

  // Group events by Month (e.g. "Agosto 2026", "Septiembre 2026")
  const groupedEvents = useMemo(() => {
    const filtered = events.filter((e) => {
      if (selectedEventType === "all") return true;
      return e.event_type === selectedEventType;
    });

    const groups: { monthKey: string; monthLabel: string; items: EventRow[] }[] = [];

    filtered.forEach((e) => {
      if (!e.start_date) return;
      const [year, month] = e.start_date.split("-");
      const monthKey = `${year}-${month}`;
      
      const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const monthLabel = dateObj.toLocaleDateString(isSpanish ? "es-ES" : "en-US", {
        month: "long",
        year: "numeric",
      });

      let group = groups.find((g) => g.monthKey === monthKey);
      if (!group) {
        group = {
          monthKey,
          monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          items: [],
        };
        groups.push(group);
      }
      group.items.push(e);
    });

    return groups;
  }, [events, selectedEventType, isSpanish]);

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "no_school":
      case "holiday":
        return <Badge className="bg-amber-600 text-white font-medium">{isSpanish ? "Sin clases / Festivo" : "No School / Holiday"}</Badge>;
      case "conference":
        return <Badge className="bg-purple-600 text-white font-medium">{isSpanish ? "Conferencias" : "Conferences"}</Badge>;
      case "family":
        return <Badge className="bg-emerald-600 text-white font-medium">{isSpanish ? "Evento Familiar" : "Family Event"}</Badge>;
      case "deadline":
        return <Badge className="bg-rose-600 text-white font-medium">{isSpanish ? "Fecha Límite" : "Deadline"}</Badge>;
      case "sports":
        return <Badge className="bg-blue-600 text-white font-medium">{isSpanish ? "Deportes" : "Sports"}</Badge>;
      default:
        return <Badge variant="outline" className="font-medium capitalize">{type || "General"}</Badge>;
    }
  };

  return (
    <PublicShell>
      {/* Hero Header */}
      <section className="hero-wash border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-primary shadow-soft">
                <CalendarDays className="size-4" aria-hidden="true" />
                {isSpanish ? "Calendario escolar 2026-2027" : "2026-2027 School Calendar"}
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
                {t("calendar.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-base sm:text-lg text-muted-foreground">
                {isSpanish
                  ? `Fechas clave, inicio y fin de cursos, vacaciones, conferencias y actividades para ${selectedSchool.name}.`
                  : `Key dates, school start/end, breaks, conferences, and activities for ${selectedSchool.name}.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-xl shadow-soft">
                <Link to="/eventos">
                  <Sparkles className="mr-2 size-4" />
                  {isSpanish ? "Ver Eventos y Talleres" : "View Events & Workshops"}
                </Link>
              </Button>
            </div>
          </div>

          {/* Navigation View Tabs */}
          <div className="mt-8 flex border-b border-border/80 gap-6">
            <button
              onClick={() => setActiveTab("agenda")}
              className={`flex items-center gap-2 pb-3 text-sm sm:text-base font-bold transition border-b-2 -mb-px ${
                activeTab === "agenda"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarIcon className="size-4" />
              {isSpanish ? "Agenda de Fechas y Eventos" : "Key Dates & Schedule"}
              {events.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-bold">
                  {events.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("district_pdf")}
              className={`flex items-center gap-2 pb-3 text-sm sm:text-base font-bold transition border-b-2 -mb-px ${
                activeTab === "district_pdf"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-4" />
              {isSpanish ? "Calendario Distrital Oficial (PDF / Imagen)" : "Official District Calendar (PDF / Image)"}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {activeTab === "agenda" ? (
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Filter Bar */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedEventType("all")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedEventType === "all"
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {isSpanish ? "Todas las fechas" : "All dates"}
              </button>
              <button
                onClick={() => setSelectedEventType("no_school")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedEventType === "no_school"
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {isSpanish ? "Días sin clases / Vacaciones" : "No School Days"}
              </button>
              <button
                onClick={() => setSelectedEventType("conference")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedEventType === "conference"
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {isSpanish ? "Conferencias" : "Conferences"}
              </button>
              <button
                onClick={() => setSelectedEventType("family")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedEventType === "family"
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {isSpanish ? "Eventos Familiares" : "Family Events"}
              </button>
            </div>

            <div className="text-xs text-muted-foreground">
              {isSpanish ? "Zona horaria: America/Chicago" : "Timezone: America/Chicago"}
            </div>
          </div>

          {/* Grouped Events */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : groupedEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <CalendarCheck className="mx-auto size-10 text-muted-foreground/60" />
              <h3 className="mt-3 text-lg font-bold text-foreground">
                {isSpanish ? "No hay fechas registradas para este filtro" : "No dates found for this filter"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isSpanish
                  ? "Consulte el calendario en PDF oficial o explore los eventos escolares."
                  : "Check the official district PDF calendar or browse community events."}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Button variant="outline" className="rounded-xl" onClick={() => setActiveTab("district_pdf")}>
                  {isSpanish ? "Ver Calendario PDF" : "View PDF Calendar"}
                </Button>
                <Button asChild className="rounded-xl">
                  <Link to="/eventos">
                    {isSpanish ? "Explorar Eventos" : "Explore Events"}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedEvents.map((group) => (
                <div key={group.monthKey} className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft">
                  <h2 className="text-xl font-extrabold text-foreground border-b border-border pb-3 flex items-center gap-2">
                    <CalendarDays className="size-5 text-primary" />
                    {group.monthLabel}
                  </h2>

                  <div className="mt-4 divide-y divide-border/60">
                    {group.items.map((evt) => {
                      const { title, description } = localizedEvent(evt, lang, selectedSchool.id);

                      return (
                        <div
                          key={evt.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-2 last:pb-2"
                        >
                          <div className="flex items-start gap-4">
                            {/* Date Box */}
                            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 text-center font-bold">
                              <div>
                                <div className="text-xs uppercase leading-none font-semibold">
                                  {new Date(evt.start_date + "T00:00:00").toLocaleDateString(
                                    isSpanish ? "es-ES" : "en-US",
                                    { weekday: "short" },
                                  )}
                                </div>
                                <div className="text-lg font-black leading-tight">
                                  {evt.start_date.split("-")[2]}
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                {getEventTypeBadge(evt.event_type)}
                                {evt.all_day ? (
                                  <span className="text-xs text-muted-foreground">{isSpanish ? "Todo el día" : "All day"}</span>
                                ) : evt.start_time ? (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                    <Clock className="size-3" />
                                    {evt.start_time} {evt.end_time ? `- ${evt.end_time}` : ""}
                                  </span>
                                ) : null}
                              </div>

                              <h3 className="mt-1 text-base font-bold text-foreground">{title}</h3>

                              {description && (
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 max-w-2xl">
                                  {description}
                                </p>
                              )}

                              {evt.location && (
                                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="size-3 text-rose-500" />
                                  <span>{evt.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {evt.official_url ? (
                              <Button asChild size="sm" variant="outline" className="rounded-xl">
                                <a href={evt.official_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-1.5 size-3.5" />
                                  {isSpanish ? "Enlace" : "Link"}
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* PDF District Calendar Section */
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap gap-3">
            <Button asChild className="min-h-11 rounded-xl">
              <a href={calendarPdf.url} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-2 size-4" aria-hidden="true" />
                {isSpanish ? "Descargar PDF oficial" : "Download Official PDF"}
              </a>
            </Button>
            <Button asChild variant="outline" className="min-h-11 rounded-xl">
              <a href={calendarImage.url} target="_blank" rel="noopener noreferrer">
                <Maximize2 className="mr-2 size-4" aria-hidden="true" />
                {isSpanish ? "Ver imagen completa" : "View Full Image"}
              </a>
            </Button>
            <Button asChild variant="ghost" className="min-h-11 rounded-xl">
              <a href="https://www.dmschools.org/calendar/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 size-4" aria-hidden="true" />
                {isSpanish ? "Sitio oficial de DMPS" : "Official DMPS Website"}
              </a>
            </Button>
          </div>

          <div className="surface-card mt-6 overflow-hidden p-2 sm:p-4 rounded-2xl border border-border shadow-soft">
            <a href={calendarImage.url} target="_blank" rel="noopener noreferrer">
              <img
                src={calendarImage.url}
                alt="Calendario escolar 2026-2027 de Des Moines Public Schools"
                width={1275}
                height={1650}
                className="w-full rounded-xl"
              />
            </a>
          </div>

          <div className="mt-6">
            <OfficialDataBadge
              sourceName="Des Moines Public Schools — Calendario Distrital Oficial"
              sourceUrl="https://www.dmschools.org/calendar/"
              state="Última versión verificada"
              lastSuccessAt={new Date().toISOString()}
              updateType="Calendario oficial DMPS 2026-2027"
            />
          </div>
        </section>
      )}
    </PublicShell>
  );
}
