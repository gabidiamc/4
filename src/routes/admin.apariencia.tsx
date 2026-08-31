import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, ImageIcon, RotateCcw, Save, ShieldCheck, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import logoNameDefault from "@/assets/images/dmps_family_logo_1786146361441.jpg";
import { FieldInput } from "@/components/admin/field-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAppearance, type AppearanceRow } from "@/lib/directory";
import { logAudit, upsertRow } from "@/lib/admin";

export const Route = createFileRoute("/admin/apariencia")({
  component: AdminAparienciaPage,
});

function AdminAparienciaPage() {
  const queryClient = useQueryClient();

  const appearanceQuery = useQuery({
    queryKey: ["appearance"],
    queryFn: fetchAppearance,
  });

  const [form, setForm] = useState<Partial<AppearanceRow>>({
    id: "default",
    logo_url: null,
    logo_light_url: null,
    logo_dark_url: null,
    favicon_url: null,
    logo_height: 64,
    logo_alt: "DMPS Connect — Des Moines Public Schools",
    show_wordmark: true,
  });

  useEffect(() => {
    if (appearanceQuery.data) {
      setForm((prev) => ({
        ...prev,
        ...appearanceQuery.data,
      }));
    }
  }, [appearanceQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: Partial<AppearanceRow>) => {
      const payload = {
        id: "default",
        logo_url: values.logo_url ?? null,
        logo_light_url: values.logo_light_url ?? null,
        logo_dark_url: values.logo_dark_url ?? null,
        favicon_url: values.favicon_url ?? null,
        logo_height: Number(values.logo_height) || 64,
        logo_alt: values.logo_alt ?? "DMPS Connect — Des Moines Public Schools",
        show_wordmark: values.show_wordmark ?? true,
      };
      const saved = await upsertRow("appearance_settings", payload);
      await logAudit(
        "update",
        "appearance_settings",
        "default",
        "Actualización de logotipos y apariencia",
      );
      return saved;
    },
    onSuccess: (saved) => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("dmps_db_appearance_settings", JSON.stringify([saved]));
          window.dispatchEvent(new Event("dmps_appearance_updated"));
        } catch {
          // ignore
        }
      }
      toast.success("Apariencia y logotipo guardados y aplicados en la cabecera");
      void queryClient.invalidateQueries({ queryKey: ["appearance"] });
      void queryClient.refetchQueries({ queryKey: ["appearance"] });
    },
    onError: (err: Error) => {
      toast.error(`Error al guardar: ${err.message}`);
    },
  });

  const updateFieldAndSave = (key: keyof AppearanceRow, value: unknown) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      saveMutation.mutate(updated);
      return updated;
    });
  };

  const handleReset = () => {
    setForm({
      id: "default",
      logo_url: null,
      logo_light_url: null,
      logo_dark_url: null,
      favicon_url: null,
      logo_height: 56,
      logo_alt: "DMPS Connect — Des Moines Public Schools",
      show_wordmark: true,
    });
    toast.info("Valores restablecidos a los predeterminados. Haga clic en Guardar para aplicar.");
  };

  const currentLogoSrc = form.logo_url || form.logo_light_url || logoNameDefault;
  const currentLogoDarkSrc = form.logo_dark_url || form.logo_url || logoNameDefault;
  const logoHeightPx = Math.min(Math.max(Number(form.logo_height) || 56, 32), 100);

  return (
    <div className="space-y-8 pb-12">
      {/* Encabezado de la página */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
            <ImageIcon className="size-4" />
            <span>Personalización de Marca</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Logotipos y Apariencia
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Suba directamente la imagen de su logotipo desde su equipo o dispositivo. Se aplicará
            instantáneamente en el encabezado, pie de página y pantalla de acceso.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="min-h-11 rounded-xl font-semibold gap-2 border-border"
          >
            <RotateCcw className="size-4" />
            <span>Restablecer</span>
          </Button>

          <Button
            type="button"
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            className="min-h-11 rounded-xl font-semibold gap-2 shadow-xs"
          >
            <Save className="size-4" />
            <span>{saveMutation.isPending ? "Guardando..." : "Guardar Cambios"}</span>
          </Button>
        </div>
      </div>

      {appearanceQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-60 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulario principal de carga de logotipos */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <ImageIcon className="size-5 text-primary" />
                  <span>Cargar Logotipos Oficiales</span>
                </CardTitle>
                <CardDescription>
                  Puede subir archivos PNG, JPG, SVG o WebP. Seleccione el archivo directamente
                  desde su computadora o teléfono.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logotipo Principal */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                  <FieldInput
                    field={{
                      name: "logo_url",
                      label: "Logotipo Principal (Uso General)",
                      type: "image",
                      help: "Este logotipo se mostrará en la cabecera principal de todas las páginas.",
                    }}
                    value={form.logo_url}
                    onChange={(val) => updateFieldAndSave("logo_url", val)}
                  />
                </div>

                {/* Logotipo Modo Claro */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                  <FieldInput
                    field={{
                      name: "logo_light_url",
                      label: "Logotipo para Modo Claro (Opcional)",
                      type: "image",
                      help: "Si no se especifica, se utilizará el logotipo principal.",
                    }}
                    value={form.logo_light_url}
                    onChange={(val) => updateFieldAndSave("logo_light_url", val)}
                  />
                </div>

                {/* Logotipo Modo Oscuro */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                  <FieldInput
                    field={{
                      name: "logo_dark_url",
                      label: "Logotipo para Modo Oscuro (Opcional)",
                      type: "image",
                      help: "Versión en tonos claros para destacar sobre fondos oscuros.",
                    }}
                    value={form.logo_dark_url}
                    onChange={(val) => updateFieldAndSave("logo_dark_url", val)}
                  />
                </div>

                {/* Favicon */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                  <FieldInput
                    field={{
                      name: "favicon_url",
                      label: "Icono de Pestaña / Favicon (Opcional)",
                      type: "image",
                      help: "Icono pequeño (PNG o ICO) para la pestaña del navegador.",
                    }}
                    value={form.favicon_url}
                    onChange={(val) => updateFieldAndSave("favicon_url", val)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ajustes de tamaño e identidad */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Ajustes Visuales</CardTitle>
                <CardDescription>
                  Ajuste la altura y el comportamiento del texto junto al logotipo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>Altura del Logotipo ({logoHeightPx}px)</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Min: 32px | Máx: 160px
                    </span>
                  </label>
                  <input
                    type="range"
                    min={32}
                    max={160}
                    value={logoHeightPx}
                    onChange={(e) => updateFieldAndSave("logo_height", Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-border/50">
                  <FieldInput
                    field={{
                      name: "show_wordmark",
                      label: "Mostrar texto 'DMPS Family Info' junto al logotipo",
                      type: "checkbox",
                    }}
                    value={form.show_wordmark}
                    onChange={(val) => updateFieldAndSave("show_wordmark", Boolean(val))}
                  />
                </div>

                <div className="pt-2 border-t border-border/50">
                  <FieldInput
                    field={{
                      name: "logo_alt",
                      label: "Texto alternativo (Accesibilidad)",
                      type: "text",
                      help: "Descripción de la imagen para lectores de pantalla.",
                    }}
                    value={form.logo_alt}
                    onChange={(val) => updateFieldAndSave("logo_alt", val)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral: Vista Previa en Tiempo Real */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-2xl border-border/80 shadow-xs sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Eye className="size-5 text-primary" />
                    <span>Vista Previa en Tiempo Real</span>
                  </CardTitle>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    En directo
                  </span>
                </div>
                <CardDescription>
                  Así se verá la cabecera en el sitio según la configuración elegida:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Previsualización en Fondo Claro */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    En Modo Claro (Fondo Blanco)
                  </span>
                  <div className="p-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-sm flex items-center gap-3 overflow-hidden">
                    <img
                      src={currentLogoSrc}
                      alt="Vista previa"
                      referrerPolicy="no-referrer"
                      style={{ height: `${logoHeightPx}px` }}
                      className="max-w-[180px] object-contain shrink-0"
                    />
                    {form.show_wordmark !== false ? (
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="font-extrabold text-slate-900 text-base truncate">
                          DMPS Family Info
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          Des Moines Public Schools
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Previsualización en Fondo Oscuro */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    En Modo Oscuro (Fondo Oscuro)
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-sm flex items-center gap-3 overflow-hidden">
                    <img
                      src={currentLogoDarkSrc}
                      alt="Vista previa oscuro"
                      referrerPolicy="no-referrer"
                      style={{ height: `${logoHeightPx}px` }}
                      className="max-w-[180px] object-contain shrink-0"
                    />
                    {form.show_wordmark !== false ? (
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="font-extrabold text-slate-100 text-base truncate">
                          DMPS Family Info
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          Des Moines Public Schools
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary-foreground/90 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <ShieldCheck className="size-4 shrink-0" />
                    <span>Confirmación de cambios</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Al presionar <strong>"Guardar Cambios"</strong>, la nueva imagen se guardará en
                    la base de datos y se actualizará automáticamente en todo el portal.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => saveMutation.mutate(form)}
                  disabled={saveMutation.isPending}
                  className="w-full min-h-12 rounded-xl text-base font-semibold gap-2 shadow-xs"
                >
                  <Save className="size-4" />
                  <span>
                    {saveMutation.isPending
                      ? "Guardando cambios..."
                      : "Guardar Cambios de Logotipo"}
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
