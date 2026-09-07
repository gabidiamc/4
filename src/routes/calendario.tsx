import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  CalendarCheck,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Maximize2,
  Minimize2,
  Printer,
  RefreshCw,
  School,
  Search,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Info,
} from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";
import { getCalendarSettings, type CalendarSettings } from "@/lib/calendar-config";
import { SchoolEmblem } from "@/components/school-emblem";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario Escolar Oficial — Familias DMPS" },
      {
        name: "description",
        content:
          "Consulta y descarga el calendario escolar oficial de Des Moines Public Schools (Lincoln High School y East High School).",
      },
      { property: "og:title", content: "Calendario Escolar Oficial — Familias DMPS" },
      {
        property: "og:description",
        content:
          "Calendario escolar oficial con días de clase, recesos festivos y conferencias familiares.",
      },
    ],
  }),
  component: OfficialCalendarPage,
});

export function OfficialCalendarPage() {
  const { t, lang } = useI18n();
  const { selectedSchool, setSelectedSchool, schools } = useSchool();
  const isSpanish = lang === "es";

  const [settings, setSettings] = useState<CalendarSettings>(() =>
    getCalendarSettings(selectedSchool.id),
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync with school changes and real-time updates from admin
  useEffect(() => {
    const update = () => {
      setSettings(getCalendarSettings(selectedSchool.id));
      setImageError(false);
    };
    update();

    window.addEventListener("dmps-calendar-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("dmps-calendar-updated", update);
      window.removeEventListener("storage", update);
    };
  }, [selectedSchool.id]);

  const activeUrl = settings.imageUrl || settings.pdfUrl || "";
  const isPdf =
    activeUrl.toLowerCase().includes("application/pdf") || activeUrl.toLowerCase().endsWith(".pdf");

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handlePrint = () => {
    window.print();
  };

  return (
    <PublicShell>
      {/* Hero Header */}
      <section className="hero-wash border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-bold text-primary shadow-soft">
                <CalendarDays className="size-4" aria-hidden="true" />
                <span>
                  {isSpanish ? "Calendario Escolar Oficial" : "Official District Calendar"}
                </span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
                {isSpanish ? "Calendario Escolar 2026-2027" : "2026-2027 School Calendar"}
              </h1>
              <p className="mt-2 text-base text-muted-foreground max-w-2xl">
                {isSpanish
                  ? `Visualiza y descarga el calendario oficial de ${selectedSchool.name}. Días lectivos, recesos, conferencias y días sin clases.`
                  : `View and download the official school calendar for ${selectedSchool.name}. School days, holidays, and family conferences.`}
              </p>
            </div>

            {/* School Switcher & Quick Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-2xl shadow-soft">
                {schools.map((school) => {
                  const active = selectedSchool.id === school.id;
                  return (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => setSelectedSchool(school.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? "bg-primary text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <SchoolEmblem schoolId={school.id} size="sm" />
                      <span>{school.id === "east" ? "East High" : "Lincoln High"}</span>
                    </button>
                  );
                })}
              </div>

              {activeUrl && (
                <Button asChild className="rounded-xl font-bold gap-2 shadow-soft">
                  <a
                    href={activeUrl}
                    download="Calendario_Escolar_DMPS"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="size-4" />
                    <span>{isSpanish ? "Descargar" : "Download"}</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Banner linking to Separate Events Page */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
              <CalendarCheck className="size-6" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                {isSpanish
                  ? "¿Buscas eventos escolares y reuniones específicas?"
                  : "Looking for specific events and meetings?"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isSpanish
                  ? "Consulta conferencias para padres, partidos deportivos, talleres y reuniones en nuestra sección de Eventos."
                  : "Explore parent conferences, athletics, workshops, and school meetings in the Events section."}
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="default"
            size="sm"
            className="rounded-xl font-bold gap-2 shrink-0"
          >
            <Link to="/eventos">
              <span>{isSpanish ? "Ver Lista de Eventos" : "View Events List"}</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Calendar Viewer Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        {/* Controls toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-2xl shadow-soft">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs font-bold text-primary border-primary/30 bg-primary/5"
            >
              <ShieldCheck className="size-3.5 mr-1" />
              {selectedSchool.name}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isSpanish ? "Documento Oficial DMPS" : "Official DMPS Document"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls (only for images) */}
            {!isPdf && (
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/80">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Alejar"
                >
                  <ZoomOut className="size-3.5" />
                </Button>
                <span className="text-[11px] font-bold px-1 text-muted-foreground min-w-9 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Acercar"
                >
                  <ZoomIn className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetZoom}
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Restablecer tamaño"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </div>
            )}

            {/* Fullscreen Modal trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(true)}
              className="h-8 rounded-xl text-xs font-semibold gap-1.5"
            >
              <Maximize2 className="size-3.5" />
              <span className="hidden sm:inline">
                {isSpanish ? "Pantalla Completa" : "Fullscreen"}
              </span>
            </Button>

            {/* Print Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 rounded-xl text-xs font-semibold gap-1.5"
            >
              <Printer className="size-3.5" />
              <span className="hidden sm:inline">{isSpanish ? "Imprimir" : "Print"}</span>
            </Button>

            {/* Download */}
            {activeUrl && (
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="h-8 rounded-xl text-xs font-bold gap-1.5"
              >
                <a href={activeUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="size-3.5" />
                  <span>{isSpanish ? "Descargar" : "Download"}</span>
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Main Viewer Card */}
        <Card className="rounded-3xl border-border bg-card overflow-hidden shadow-md">
          <CardContent className="p-4 sm:p-6">
            {isPdf ? (
              /* PDF Viewer */
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden h-[700px] w-full">
                  <iframe
                    src={`${activeUrl}#toolbar=1&navpanes=0`}
                    className="w-full h-full border-0"
                    title="Calendario Escolar PDF"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>Documento PDF oficial del ciclo escolar</span>
                  <a
                    href={activeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Abrir en nueva pestaña</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ) : (
              /* Image Viewer with interactive Zoom */
              <div className="flex flex-col items-center justify-center">
                <div className="overflow-auto max-h-[85vh] w-full rounded-2xl border border-border/60 bg-slate-900/5 dark:bg-slate-950 p-2 sm:p-4 flex items-center justify-center">
                  {!imageError && activeUrl ? (
                    <img
                      src={activeUrl}
                      alt={`Calendario Escolar Oficial — ${selectedSchool.name}`}
                      onError={() => setImageError(true)}
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: "center top",
                        transition: "transform 0.15s ease-out",
                      }}
                      className="max-w-full h-auto rounded-xl shadow-lg cursor-zoom-in select-none"
                      onClick={() => setIsFullscreen(true)}
                    />
                  ) : (
                    <div className="py-20 text-center space-y-4">
                      <div className="size-16 rounded-3xl bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto">
                        <FileText className="size-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-foreground">
                          {isSpanish
                            ? "Calendario Escolar en Preparación"
                            : "School Calendar Coming Soon"}
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          {isSpanish
                            ? "El personal administrativo actualizará la imagen del calendario para esta escuela en breve."
                            : "Staff will update the official calendar file for this school shortly."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground mt-3 text-center">
                  {isSpanish
                    ? "Haz clic sobre la imagen para ampliar en pantalla completa o usa los controles de zoom."
                    : "Click the image to expand full-screen or use zoom controls."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Fullscreen Image Lightbox Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[96vw] max-h-[96vh] p-4 bg-background/95 backdrop-blur-md rounded-3xl border-border flex flex-col">
          <DialogHeader className="pb-2 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold">
                {settings.title || `Calendario Escolar — ${selectedSchool.name}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isSpanish ? "Visualizador en alta resolución" : "High-resolution viewer"}
              </DialogDescription>
            </div>
            {activeUrl && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-xl h-8 text-xs font-bold gap-1 mr-6"
              >
                <a href={activeUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="size-3.5" />
                  <span>Descargar</span>
                </a>
              </Button>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-auto flex items-center justify-center p-2">
            {isPdf ? (
              <iframe
                src={activeUrl}
                className="w-full h-[80vh] rounded-2xl border border-border"
                title="Calendario PDF Fullscreen"
              />
            ) : (
              <img
                src={activeUrl}
                alt="Calendario Escolar Fullscreen"
                className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PublicShell>
  );
}
