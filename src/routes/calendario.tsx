import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CalendarCheck,
  Clock,
  ExternalLink,
  Filter,
  MapPin,
  Sparkles,
  Search,
  Plus,
  ArrowRight,
  School,
} from "lucide-react";
import { useState, useMemo } from "react";

import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";
import { fetchEvents, localizedEvent, type EventRow } from "@/lib/content";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Fechas y Calendario Escolar — Familias DMPS" },
      {
        name: "description",
        content:
          "Fechas clave, inicio y fin de clases, días festivos, conferencias y eventos escolares oficiales de Des Moines Public Schools.",
      },
      { property: "og:title", content: "Fechas y Calendario Escolar — Familias DMPS" },
      {
        property: "og:description",
        content: "Fechas y eventos oficiales del distrito y de las escuelas secundarias.",
      },
    ],
  }),
  component: CalendarPage,
});

const EVENT_FILTER_TYPES = [
  { id: "all", label_es: "Todos los eventos", label_en: "All events" },
  { id: "no_school", label_es: "Sin clases / Festivos", label_en: "No school / Holidays" },
  { id: "conference", label_es: "Conferencias", label_en: "Conferences" },
  { id: "early_dismissal", label_es: "Salida temprana", label_en: "Early dismissal" },
  { id: "family", label_es: "Eventos familiares", label_en: "Family events" },
  { id: "sports", label_es: "Deportes", label_en: "Sports" },
  { id: "academic", label_es: "Académico", label_en: "Academic" },
];

export function CalendarPage() {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const isSpanish = lang === "es";

  // Fetch events from real database / cache populated via Admin Eventos
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public_calendar_events", selectedSchool.id],
    queryFn: () => fetchEvents(selectedSchool.id),
  });

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Type filter
      if (selectedEventType !== "all" && e.event_type !== selectedEventType) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const loc = localizedEvent(e, lang, selectedSchool.id);
        const term = searchTerm.toLowerCase();
        const titleMatch = (loc.title || e.title || "").toLowerCase().includes(term);
        const descMatch = (loc.description || e.description || "").toLowerCase().includes(term);
        const locMatch = (e.location || "").toLowerCase().includes(term);
        if (!titleMatch && !descMatch && !locMatch) return false;
      }

      return true;
    });
  }, [events, selectedEventType, searchTerm, lang, selectedSchool.id]);

  // Group events by Month (e.g. "Agosto 2026", "Septiembre 2026")
  const groupedEvents = useMemo(() => {
    const groups: { monthKey: string; monthLabel: string; items: EventRow[] }[] = [];

    filteredEvents.forEach((e) => {
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

    return groups.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [filteredEvents, isSpanish]);

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "no_school":
      case "holiday":
        return (
          <Badge className="bg-amber-600 text-white font-semibold">
            {isSpanish ? "Sin clases / Festivo" : "No School / Holiday"}
          </Badge>
        );
      case "conference":
        return (
          <Badge className="bg-purple-600 text-white font-semibold">
            {isSpanish ? "Conferencias" : "Conferences"}
          </Badge>
        );
      case "early_dismissal":
        return (
          <Badge className="bg-sky-600 text-white font-semibold">
            {isSpanish ? "Salida temprana" : "Early Dismissal"}
          </Badge>
        );
      case "family":
        return (
          <Badge className="bg-emerald-600 text-white font-semibold">
            {isSpanish ? "Evento Familiar" : "Family Event"}
          </Badge>
        );
      case "sports":
        return (
          <Badge className="bg-blue-600 text-white font-semibold">
            {isSpanish ? "Deportes" : "Sports"}
          </Badge>
        );
      case "academic":
        return (
          <Badge className="bg-indigo-600 text-white font-semibold">
            {isSpanish ? "Académico" : "Academic"}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-semibold capitalize">
            {type || "General"}
          </Badge>
        );
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
                {isSpanish ? "Calendario escolar oficial" : "Official School Calendar"}
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
                {isSpanish ? "Fechas y Calendario Escolar" : "Key School Dates & Calendar"}
              </h1>
              <p className="mt-3 max-w-2xl text-base sm:text-lg text-muted-foreground">
                {isSpanish
                  ? `Fechas clave, conferencias de familias, días sin clases y eventos oficiales de ${selectedSchool.name}.`
                  : `Key dates, family conferences, no-school days, and official activities for ${selectedSchool.name}.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-xl shadow-soft">
                <Link to="/eventos">
                  <Sparkles className="mr-2 size-4 text-primary" />
                  {isSpanish ? "Ver Todos los Eventos" : "View All Events"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Events Area */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Filter bar */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search within events */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isSpanish ? "Buscar eventos por nombre, lugar..." : "Search dates and events..."
                }
                className="pl-9 rounded-xl"
              />
            </div>

            {/* Total counter */}
            <p className="text-sm font-medium text-muted-foreground">
              {filteredEvents.length}{" "}
              {filteredEvents.length === 1
                ? isSpanish
                  ? "evento programado"
                  : "scheduled event"
                : isSpanish
                  ? "eventos programados"
                  : "scheduled events"}
            </p>
          </div>

          {/* Type filter chips */}
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              {EVENT_FILTER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedEventType(type.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    selectedEventType === type.id
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "border border-border bg-card text-foreground hover:bg-muted/40"
                  }`}
                >
                  <span>{isSpanish ? type.label_es : type.label_en}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-full rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty state when no events exist or match filter */
          <div className="surface-card rounded-3xl border border-dashed border-border p-10 text-center max-w-2xl mx-auto space-y-4 bg-muted/5">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDays className="size-7" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {isSpanish
                ? "No hay eventos programados en este momento"
                : "No scheduled events at this time"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {isSpanish
                ? "Los nuevos eventos escolares, conferencias y días sin clases publicados desde el menú de administración aparecerán organizados aquí."
                : "Upcoming school events, parent conferences, and no-school days published by staff will appear here."}
            </p>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/eventos">
                  {isSpanish ? "Explorar Actividades Escolares" : "Browse School Activities"}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          /* Events list grouped by month */
          <div className="space-y-10">
            {groupedEvents.map((group) => (
              <div key={group.monthKey} className="space-y-4">
                {/* Month title */}
                <div className="flex items-center gap-3 border-b border-border pb-2.5">
                  <span className="flex size-3 rounded-full bg-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {group.monthLabel}
                  </h2>
                  <span className="text-xs font-semibold text-muted-foreground rounded-full bg-muted px-2.5 py-0.5">
                    {group.items.length}{" "}
                    {group.items.length === 1
                      ? isSpanish
                        ? "evento"
                        : "event"
                      : isSpanish
                        ? "eventos"
                        : "events"}
                  </span>
                </div>

                {/* Events in this month */}
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((event) => {
                    const loc = localizedEvent(event, lang, selectedSchool.id);
                    const title = loc.title || event.title;
                    const desc = loc.description || event.description;
                    const rawEvent = event as Record<string, unknown>;
                    const linkUrl =
                      event.official_url ||
                      (typeof rawEvent.link_url === "string" ? rawEvent.link_url : undefined);

                    // Parse day number
                    const dateParts = (event.start_date || "").split("-");
                    const dayNumber = dateParts[2] ? parseInt(dateParts[2], 10) : "";

                    return (
                      <Card
                        key={event.id}
                        className="surface-card flex flex-col justify-between overflow-hidden rounded-2xl border border-border p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {/* Date block */}
                              <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <span className="text-lg font-black leading-none">{dayNumber}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                  {new Date(
                                    parseInt(dateParts[0], 10),
                                    parseInt(dateParts[1], 10) - 1,
                                    parseInt(dateParts[2] || "1", 10),
                                  ).toLocaleDateString(isSpanish ? "es-US" : "en-US", {
                                    weekday: "short",
                                  })}
                                </span>
                              </div>

                              <div className="min-w-0">{getEventTypeBadge(event.event_type)}</div>
                            </div>
                          </div>

                          {/* Event title */}
                          <h3 className="text-base font-bold text-foreground leading-snug">
                            {title}
                          </h3>

                          {/* Description */}
                          {desc && (
                            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                              {desc}
                            </p>
                          )}
                        </div>

                        {/* Event footer: time, location & link */}
                        <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-primary shrink-0" />
                            <span>
                              {event.all_day
                                ? isSpanish
                                  ? "Todo el día"
                                  : "All day"
                                : `${event.start_time || "08:00"} - ${event.end_time || "15:00"}`}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="size-3.5 text-rose-500 shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}

                          {linkUrl && (
                            <div className="pt-1">
                              <a
                                href={linkUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                              >
                                <span>{isSpanish ? "Más información" : "More information"}</span>
                                <ExternalLink className="size-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
