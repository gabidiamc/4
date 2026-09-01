import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { CalendarDays, Save, CheckCircle2, Eye, School, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchool } from "@/lib/school";
import {
  getCalendarSettings,
  saveCalendarSettings,
  type CalendarSettings,
} from "@/lib/calendar-config";
import { FileUploadInput } from "@/components/file-upload-input";

export const Route = createFileRoute("/admin/calendario")({
  component: AdminCalendarPage,
});

function AdminCalendarPage() {
  const { adminSchoolFilter, setAdminSchoolFilter } = useSchool();
  const [selectedSchool, setSelectedSchool] = useState<"lincoln" | "east">(
    adminSchoolFilter === "east" ? "east" : "lincoln",
  );

  const [calendarFile, setCalendarFile] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const current = getCalendarSettings(selectedSchool);
    setCalendarFile(current.imageUrl || current.pdfUrl || "");
  }, [selectedSchool]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarFile.trim()) {
      toast.error("Por favor sube o selecciona el archivo del calendario.");
      return;
    }

    const isPdf =
      calendarFile.toLowerCase().includes("application/pdf") ||
      calendarFile.toLowerCase().endsWith(".pdf");

    const newSettings: CalendarSettings = {
      imageUrl: isPdf ? "" : calendarFile,
      pdfUrl: isPdf ? calendarFile : "",
      title: `Calendario Escolar 2026-2027 — ${
        selectedSchool === "east" ? "East High School" : "Lincoln High School"
      }`,
      subtitle: "Días de clases, recesos, conferencias y fechas clave oficiales.",
      lastUpdated: new Date().toISOString(),
    };

    saveCalendarSettings(selectedSchool, newSettings);
    setIsSaved(true);
    toast.success("¡Calendario guardado y publicado con éxito!");
    setTimeout(() => setIsSaved(false), 3000);
  };

  const isPdf =
    calendarFile.toLowerCase().includes("application/pdf") ||
    calendarFile.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Subir Calendario Escolar
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Sube el calendario escolar (imagen PNG, JPG, WEBP o archivo PDF). Las familias podrán
            verlo y descargarlo en la página pública.
          </p>
        </div>

        {/* Quick School Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-muted p-1 border border-border">
          <button
            type="button"
            onClick={() => {
              setSelectedSchool("lincoln");
              setAdminSchoolFilter("lincoln");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedSchool === "lincoln"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🦁 Lincoln High
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedSchool("east");
              setAdminSchoolFilter("east");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedSchool === "east"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🌹 East High
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Upload Form */}
        <form onSubmit={handleSave} className="space-y-6 lg:col-span-6">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <School className="size-5 text-primary" />
                Archivo del Calendario ({selectedSchool === "east" ? "East High" : "Lincoln High"})
              </CardTitle>
              <CardDescription>
                Selecciona o arrastra el archivo desde tus archivos locales (PDF, PNG, JPG, etc.) o
                pega el enlace.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <FileUploadInput
                id="calendar-upload"
                value={calendarFile}
                onChange={setCalendarFile}
                label="Subir archivo del calendario"
                helperText="Acepta archivos PDF, PNG, JPG, JPEG, WEBP de todos los tipos"
                placeholder="Pega enlace o selecciona tu archivo..."
                accept="image/*,.pdf,application/pdf"
                showPreview={false}
              />

              {calendarFile && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border text-xs">
                  <span className="font-semibold text-foreground truncate max-w-[280px]">
                    {isPdf ? "📄 Documento PDF listo" : "🖼️ Imagen de calendario lista"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCalendarFile("")}
                    className="text-destructive hover:underline font-bold flex items-center gap-1"
                  >
                    <Trash2 className="size-3.5" /> Quitar
                  </button>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 rounded-xl font-bold min-h-12 shadow-sm"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="size-5 text-white" /> ¡Calendario Guardado y Publicado!
                  </>
                ) : (
                  <>
                    <Save className="size-5" /> Guardar y Publicar Calendario
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Live Preview */}
        <div className="space-y-6 lg:col-span-6">
          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/40 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="size-4 text-primary" /> Vista Previa
                </CardTitle>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-500/20">
                  {selectedSchool === "east" ? "East High" : "Lincoln High"}
                </span>
              </div>
              <CardDescription>
                Así se visualizará en la sección pública para las familias
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              {calendarFile ? (
                isPdf ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center space-y-2">
                      <FileText className="size-12 text-primary mx-auto" />
                      <h4 className="font-bold text-foreground text-sm">Documento PDF Oficial</h4>
                      <p className="text-xs text-muted-foreground">
                        El calendario en formato PDF está listo para descargar y consultar.
                      </p>
                    </div>
                    {calendarFile.startsWith("data:") ? (
                      <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border border-border">
                        <iframe
                          src={calendarFile}
                          title="Vista previa PDF"
                          className="h-full w-full"
                        />
                      </div>
                    ) : (
                      <a
                        href={calendarFile}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-center text-xs font-bold text-primary underline"
                      >
                        Abrir PDF en nueva pestaña
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border bg-black/5 p-2">
                    <img
                      src={calendarFile}
                      alt="Vista previa del calendario"
                      className="w-full max-h-[420px] object-contain rounded-lg mx-auto"
                    />
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground text-xs text-center p-4">
                  <CalendarDays className="size-8 text-muted-foreground/50 mb-2" />
                  <span>Ningún archivo de calendario cargado</span>
                  <span className="text-[11px] mt-1 text-muted-foreground/80">
                    Sube un archivo para ver la vista previa en vivo
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
