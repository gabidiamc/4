import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  CheckCircle2,
  FileText,
  Eye,
  Sparkles,
  School,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchool } from "@/lib/school";
import {
  getCalendarSettings,
  saveCalendarSettings,
  type CalendarSettings,
} from "@/lib/calendar-config";

export const Route = createFileRoute("/admin/calendario")({
  component: AdminCalendarPage,
});

const PRESET_CALENDARS = [
  {
    name: "Calendario Oficial DMPS 2026-2027",
    imageUrl:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1600&auto=format&fit=crop&q=80",
    pdfUrl: "https://www.dmschools.org/wp-content/uploads/2024/02/2026-2027-District-Calendar.pdf",
  },
  {
    name: "Calendario Anual Académico",
    imageUrl:
      "https://images.unsplash.com/photo-1584697964190-7f4178550186?w=1600&auto=format&fit=crop&q=80",
    pdfUrl: "https://www.dmschools.org",
  },
  {
    name: "Horario y Fechas Clave High School",
    imageUrl:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&auto=format&fit=crop&q=80",
    pdfUrl: "https://www.dmschools.org",
  },
];

function AdminCalendarPage() {
  const { adminSchoolFilter } = useSchool();
  const targetSchool = adminSchoolFilter === "east" ? "east" : "lincoln";

  const [settings, setSettings] = useState<CalendarSettings>({
    imageUrl: "",
    pdfUrl: "",
    title: "",
    subtitle: "",
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const current = getCalendarSettings(targetSchool);
    setSettings(current);
  }, [targetSchool]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.imageUrl.trim()) {
      toast.error("Por favor ingresa la URL o imagen del calendario.");
      return;
    }
    saveCalendarSettings(targetSchool, settings);
    setIsSaved(true);
    toast.success("¡Calendario escolar actualizado exitosamente para la página pública!");
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSettings((prev) => ({ ...prev, imageUrl: result }));
      toast.success("Imagen cargada desde tu dispositivo.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Configurar Calendario Escolar
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Sube la imagen oficial o pon la URL del calendario para que aparezca directamente en la
            página pública para las familias.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
          <School className="size-4" />
          Editando para: {targetSchool === "east" ? "East High School" : "Lincoln High School"}
        </div>
      </div>

      {/* Main Card */}
      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="size-5 text-primary" /> Imagen y Documento del Calendario
              </CardTitle>
              <CardDescription>
                Define la imagen del calendario escolar y el enlace opcional para descargar en PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Image URL */}
              <div className="space-y-2">
                <Label
                  htmlFor="calendar-image-url"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  URL de la Imagen del Calendario *
                </Label>
                <div className="relative">
                  <Input
                    id="calendar-image-url"
                    value={settings.imageUrl}
                    onChange={(e) => setSettings({ ...settings, imageUrl: e.target.value })}
                    placeholder="https://ejemplo.com/calendario-escolar.jpg o sube un archivo"
                    className="pr-10 min-h-11 rounded-xl"
                    required
                  />
                  <ImageIcon className="absolute right-3 top-3 size-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Or File Upload */}
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
                <Upload className="mx-auto size-6 text-muted-foreground mb-2" />
                <p className="text-xs font-medium text-foreground">
                  O sube una imagen de tu computadora/móvil:
                </p>
                <input
                  type="file"
                  id="calendar-file-input"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="calendar-file-input"
                  className="mt-2 inline-flex items-center gap-2 cursor-pointer rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
                >
                  Seleccionar archivo de imagen
                </label>
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground">
                  Plantillas y ejemplos rápidos:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CALENDARS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          imageUrl: p.imageUrl,
                          pdfUrl: p.pdfUrl,
                        }))
                      }
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF Document URL */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Label
                  htmlFor="calendar-pdf-url"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  URL del Calendario en PDF (Opcional para botón "Descargar PDF")
                </Label>
                <div className="relative">
                  <Input
                    id="calendar-pdf-url"
                    value={settings.pdfUrl}
                    onChange={(e) => setSettings({ ...settings, pdfUrl: e.target.value })}
                    placeholder="https://www.dmschools.org/.../calendario.pdf"
                    className="pr-10 min-h-11 rounded-xl"
                  />
                  <LinkIcon className="absolute right-3 top-3 size-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-border">
                <div className="space-y-2">
                  <Label
                    htmlFor="calendar-title"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Título de cabecera
                  </Label>
                  <Input
                    id="calendar-title"
                    value={settings.title}
                    onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    placeholder="Calendario Escolar 2026-2027"
                    className="min-h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="calendar-subtitle"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Subtítulo / Nota
                  </Label>
                  <Input
                    id="calendar-subtitle"
                    value={settings.subtitle}
                    onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                    placeholder="Días sin clases, inicio y fin del ciclo escolar"
                    className="min-h-11 rounded-xl"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" size="lg" className="w-full gap-2 rounded-xl font-bold">
                {isSaved ? (
                  <>
                    <CheckCircle2 className="size-5" /> ¡Guardado y Publicado!
                  </>
                ) : (
                  <>
                    <Save className="size-5" /> Guardar y Publicar Calendario
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-6 lg:col-span-5">
          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/40 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="size-4 text-primary" /> Vista Previa en Vivo
                </CardTitle>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600">
                  Público
                </span>
              </div>
              <CardDescription>
                Así lo verán las familias en <code className="text-xs font-mono">/calendario</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {settings.title || "Calendario Escolar 2026-2027"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {settings.subtitle || "Días de clase, conferencias y eventos oficiales."}
                </p>
              </div>

              {settings.imageUrl ? (
                <div className="overflow-hidden rounded-xl border border-border bg-black/5">
                  <img
                    src={settings.imageUrl}
                    alt="Calendario Escolar"
                    className="w-full max-h-80 object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop";
                    }}
                  />
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground text-xs">
                  Sin imagen configurada
                </div>
              )}

              {settings.pdfUrl && (
                <div className="flex items-center justify-between rounded-xl bg-primary/5 p-3 text-xs border border-primary/10">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <FileText className="size-4 text-primary" /> Archivo PDF disponible
                  </span>
                  <a
                    href={settings.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-primary underline"
                  >
                    Abrir PDF
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
