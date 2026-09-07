/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  ImageIcon,
  Moon,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import defaultLogoAsset from "@/assets/dmps-info-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAppearance, type AppearanceRow } from "@/lib/directory";
import { logAudit, upsertRow } from "@/lib/admin";
import { compressImageFile } from "@/lib/image-compression";
import { safeSetItem } from "@/lib/storage-engine";

export const Route = createFileRoute("/admin/apariencia")({
  component: AdminAparienciaPage,
});

function AdminAparienciaPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const darkFileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

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
    logo_height: 56,
    logo_alt: "DMPS Connect — Des Moines Public Schools",
    show_wordmark: true,
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");

  // Sync initial appearance from query
  useEffect(() => {
    if (appearanceQuery.data) {
      setForm((prev) => ({
        ...prev,
        ...appearanceQuery.data,
      }));
      setIsDirty(false);
    }
  }, [appearanceQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: Partial<AppearanceRow>) => {
      const payload: AppearanceRow = {
        id: "default",
        logo_url: values.logo_url ?? null,
        logo_light_url: values.logo_light_url ?? values.logo_url ?? null,
        logo_dark_url: values.logo_dark_url ?? null,
        favicon_url: values.favicon_url ?? null,
        logo_height: Number(values.logo_height) || 56,
        logo_alt: values.logo_alt ?? "DMPS Connect — Des Moines Public Schools",
        show_wordmark: values.show_wordmark ?? true,
        updated_at: new Date().toISOString(),
        created_at: values.created_at ?? new Date().toISOString(),
      };

      // 1. Persist to server disk storage + IndexedDB + memory
      const saved = await upsertRow("appearance_settings", payload);

      // 2. Direct client storage update
      if (typeof window !== "undefined") {
        try {
          safeSetItem("dmps_db_appearance_settings", JSON.stringify([saved]));
          localStorage.setItem("dmps_appearance_timestamp", String(Date.now()));
          window.dispatchEvent(new CustomEvent("dmps_appearance_updated", { detail: saved }));
          window.dispatchEvent(new Event("storage"));
        } catch {
          // ignore local storage errors
        }
      }

      // 3. Log audit
      try {
        await logAudit(
          "update",
          "appearance_settings",
          "default",
          "Actualización del ícono principal y apariencia del portal",
        );
      } catch {
        // ignore audit failure
      }

      return saved as AppearanceRow;
    },
    onSuccess: (saved) => {
      setIsDirty(false);
      queryClient.setQueryData(["appearance"], saved);
      void queryClient.invalidateQueries({ queryKey: ["appearance"] });

      toast.success("¡Ícono principal y apariencia guardados con éxito!", {
        description:
          "El nuevo logotipo está activo inmediatamente en todas las páginas y persistirá al recargar.",
      });
    },
    onError: (err: Error) => {
      toast.error(`Error al guardar: ${err.message}`);
    },
  });

  // Handle image compression & upload
  const processImageFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("El archivo seleccionado no es una imagen válida (PNG, JPG, SVG o WebP).");
    }

    if (file.size > 20 * 1024 * 1024) {
      throw new Error("La imagen es demasiado grande. El límite recomendado es de 20MB.");
    }

    const isPng = file.type === "image/png" || file.name.endsWith(".png");
    const isSvg = file.type === "image/svg+xml" || file.name.endsWith(".svg");

    if (isSvg) {
      // SVGs should remain uncompressed text
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    return await compressImageFile(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.9,
      mimeType: isPng ? "image/png" : "image/webp",
    });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Procesando imagen...", { id: "logo-upload" });
      const dataUrl = await processImageFile(file);
      setForm((prev) => ({
        ...prev,
        logo_url: dataUrl,
        logo_light_url: dataUrl,
      }));
      setIsDirty(true);
      toast.success("Nuevo ícono cargado en vista previa.", {
        id: "logo-upload",
        description: "Presiona 'Guardar Cambios' para aplicarlo permanentemente en el portal.",
      });
    } catch (err: any) {
      toast.error(err.message || "No se pudo procesar la imagen.", { id: "logo-upload" });
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      toast.loading("Procesando imagen...", { id: "logo-upload" });
      const dataUrl = await processImageFile(file);
      setForm((prev) => ({
        ...prev,
        logo_url: dataUrl,
        logo_light_url: dataUrl,
      }));
      setIsDirty(true);
      toast.success("Nuevo ícono cargado en vista previa.", {
        id: "logo-upload",
        description: "Presiona 'Guardar Cambios' para fijarlo en todo el portal.",
      });
    } catch (err: any) {
      toast.error(err.message || "Error al cargar la imagen soltada.", { id: "logo-upload" });
    }
  };

  const handleRemoveLogo = () => {
    setForm((prev) => ({
      ...prev,
      logo_url: null,
      logo_light_url: null,
    }));
    setIsDirty(true);
    toast.info("Ícono personalizado removido. Se usará el logotipo oficial predeterminado.", {
      description: "Haz clic en 'Guardar Cambios' para confirmar este cambio.",
    });
  };

  const handleApplyUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    setForm((prev) => ({
      ...prev,
      logo_url: trimmed,
      logo_light_url: trimmed,
    }));
    setIsDirty(true);
    setUrlInputOpen(false);
    setCustomUrlInput("");
    toast.success("Enlace de logotipo aplicado a la vista previa.");
  };

  const handleResetToDefault = () => {
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
    setIsDirty(true);
    toast.info("Configuración restablecida a valores iniciales de fábrica.", {
      description: "Recuerda hacer clic en 'Guardar Cambios' para aplicar.",
    });
  };

  // Resolved sources for preview
  const currentLogoSrc = form.logo_url || form.logo_light_url || defaultLogoAsset;
  const currentDarkLogoSrc = form.logo_dark_url || form.logo_url || defaultLogoAsset;
  const activePreviewSrc = previewMode === "dark" ? currentDarkLogoSrc : currentLogoSrc;
  const hasCustomLogo = Boolean(form.logo_url || form.logo_light_url);
  const logoHeightPx = Math.min(Math.max(Number(form.logo_height) || 56, 32), 140);

  return (
    <div className="space-y-8 pb-16">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
      />
      <input
        type="file"
        ref={darkFileInputRef}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const dataUrl = await processImageFile(file);
            setForm((prev) => ({ ...prev, logo_dark_url: dataUrl }));
            setIsDirty(true);
            toast.success("Ícono para modo oscuro cargado.");
          } catch (err: any) {
            toast.error(err.message);
          }
        }}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
      />
      <input
        type="file"
        ref={faviconInputRef}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const dataUrl = await processImageFile(file);
            setForm((prev) => ({ ...prev, favicon_url: dataUrl }));
            setIsDirty(true);
            toast.success("Favicon cargado.");
          } catch (err: any) {
            toast.error(err.message);
          }
        }}
        accept="image/png,image/x-icon,image/svg+xml"
        className="hidden"
      />

      {/* Top Banner & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
            <ImageIcon className="size-4" />
            <span>Identidad y Marca Oficial</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Ícono Principal y Logotipo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Sube o reemplaza el ícono oficial de la cabecera. El cambio se actualizará en tiempo
            real en el portal público y persistirá permanentemente en el servidor.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetToDefault}
            className="min-h-11 rounded-xl font-medium gap-2 border-border"
          >
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Restablecer</span>
          </Button>

          <Button
            type="button"
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            className={`min-h-11 px-5 rounded-xl font-bold gap-2 transition-all shadow-md ${
              isDirty
                ? "bg-primary text-primary-foreground ring-2 ring-primary/40 animate-pulse"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {saveMutation.isPending ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Dirty indicator notification banner */}
      {isDirty && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Tienes cambios pendientes de guardar en el ícono principal.</span>
          </div>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            className="rounded-lg font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          >
            <Save className="size-3.5" />
            <span>Guardar Ahora</span>
          </Button>
        </div>
      )}

      {appearanceQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Upload and Icon Control Section */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" />
                    <span>Ícono y Logotipo Principal</span>
                  </CardTitle>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      hasCustomLogo
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    }`}
                  >
                    {hasCustomLogo ? (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        Ícono Personalizado Activo
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-3.5" />
                        Logotipo Oficial Predeterminado
                      </>
                    )}
                  </span>
                </div>
                <CardDescription>
                  Este ícono es el emblema central que se muestra en la barra superior de todo el
                  portal público, en dispositivos móviles y de escritorio.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Visual Drag & Drop Upload Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all text-center ${
                    isDragging
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : "border-border/80 bg-muted/10 hover:bg-muted/20 hover:border-primary/50"
                  }`}
                >
                  <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
                    <Upload className="size-8" />
                  </div>

                  <h3 className="font-bold text-lg text-foreground">
                    Arrastra tu nuevo ícono aquí
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Compatible con formatos transparentes <strong>PNG</strong>, vectoriales{" "}
                    <strong>SVG</strong>, o imágenes estándar <strong>JPG</strong> y{" "}
                    <strong>WebP</strong>.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    >
                      <Upload className="size-4" />
                      <span>Subir desde dispositivo</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUrlInputOpen(!urlInputOpen)}
                      className="rounded-xl font-medium gap-2 border-border"
                    >
                      <LinkIcon className="size-4" />
                      <span>Pegar URL</span>
                    </Button>
                  </div>
                </div>

                {/* Direct URL Input Popup */}
                {urlInputOpen && (
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Dirección URL de la imagen
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://ejemplo.org/icono.png"
                        className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyUrl}
                        className="rounded-xl font-bold"
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Current Active Icon Details & Action Buttons */}
                <div className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="size-16 rounded-xl bg-muted/30 border border-border/60 p-1 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={currentLogoSrc}
                        alt="Miniatura del ícono"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-foreground truncate">
                        {hasCustomLogo ? "Ícono Personalizado Cargado" : "Logotipo DMPS Oficial"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {hasCustomLogo
                          ? "Listo para reemplazar o eliminar"
                          : "Actualmente activo por defecto"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl font-semibold gap-1.5 border-border"
                    >
                      <Upload className="size-4" />
                      <span>Reemplazar</span>
                    </Button>

                    {hasCustomLogo && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleRemoveLogo}
                        className="rounded-xl font-semibold gap-1.5"
                      >
                        <Trash2 className="size-4" />
                        <span>Eliminar</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Visual Adjustments for the Icon */}
                <div className="pt-2 border-t border-border/60 space-y-4">
                  <h4 className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span>Tamaño y Altura en Pantalla</span>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded-md text-primary">
                      {logoHeightPx}px
                    </span>
                  </h4>

                  <input
                    type="range"
                    min={32}
                    max={120}
                    step={2}
                    value={logoHeightPx}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, logo_height: Number(e.target.value) }));
                      setIsDirty(true);
                    }}
                    className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Compacto (32px)</span>
                    <span>Recomendado (56px)</span>
                    <span>Grande (120px)</span>
                  </div>

                  {/* Show text option */}
                  <label className="flex items-center gap-3 pt-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.show_wordmark !== false}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, show_wordmark: e.target.checked }));
                        setIsDirty(true);
                      }}
                      className="size-4 rounded accent-primary text-primary focus:ring-primary cursor-pointer"
                    />
                    <div className="text-sm">
                      <div className="font-semibold text-foreground">
                        Mostrar texto "DMPS Family Info" junto al logotipo
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Muestra el nombre del portal al lado del ícono en pantallas de escritorio.
                      </div>
                    </div>
                  </label>

                  {/* Alt text input */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      Texto descriptivo (Accesibilidad y SEO)
                    </label>
                    <input
                      type="text"
                      value={form.logo_alt ?? ""}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, logo_alt: e.target.value }));
                        setIsDirty(true);
                      }}
                      placeholder="DMPS Connect — Des Moines Public Schools"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Advanced Options Accordion */}
                <div className="pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>Opciones avanzadas (Modo Oscuro específico y Favicon)</span>
                    {showAdvanced ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 space-y-4 p-4 rounded-2xl bg-muted/20 border border-border/60">
                      {/* Dark mode override */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <Moon className="size-3.5 text-primary" />
                            Logotipo exclusivo para Modo Oscuro (Opcional)
                          </label>
                          {form.logo_dark_url && (
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({ ...prev, logo_dark_url: null }));
                                setIsDirty(true);
                              }}
                              className="text-xs text-destructive hover:underline font-semibold"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Si no se define, se usará automáticamente el ícono principal.
                        </p>
                        <div className="flex items-center gap-3">
                          {form.logo_dark_url && (
                            <div className="size-12 rounded-lg bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shrink-0">
                              <img
                                src={form.logo_dark_url}
                                alt="Dark logo"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => darkFileInputRef.current?.click()}
                            className="rounded-xl gap-1.5"
                          >
                            <Upload className="size-3.5" />
                            <span>
                              {form.logo_dark_url ? "Cambiar imagen oscura" : "Subir imagen oscura"}
                            </span>
                          </Button>
                        </div>
                      </div>

                      {/* Favicon */}
                      <div className="space-y-2 pt-3 border-t border-border/40">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Favicon / Ícono de la pestaña del navegador
                          </label>
                          {form.favicon_url && (
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({ ...prev, favicon_url: null }));
                                setIsDirty(true);
                              }}
                              className="text-xs text-destructive hover:underline font-semibold"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {form.favicon_url && (
                            <div className="size-8 rounded-md bg-muted border border-border p-1 flex items-center justify-center shrink-0">
                              <img
                                src={form.favicon_url}
                                alt="Favicon"
                                className="size-full object-contain"
                              />
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => faviconInputRef.current?.click()}
                            className="rounded-xl gap-1.5"
                          >
                            <Upload className="size-3.5" />
                            <span>
                              {form.favicon_url ? "Cambiar favicon" : "Subir favicon (ICO/PNG)"}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Big Save Button at bottom of form */}
                <Button
                  type="button"
                  onClick={() => saveMutation.mutate(form)}
                  disabled={saveMutation.isPending}
                  className="w-full min-h-12 rounded-xl text-base font-bold gap-2 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {saveMutation.isPending ? (
                    <>
                      <RefreshCw className="size-5 animate-spin" />
                      <span>Guardando permanentemente...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-5" />
                      <span>Guardar Cambios del Ícono Principal</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: High-Fidelity Live Header Preview */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-2xl border-border/80 shadow-sm sticky top-6 overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Eye className="size-5 text-primary" />
                    <span>Vista Previa en Vivo</span>
                  </CardTitle>

                  {/* Mode switcher tabs */}
                  <div className="flex items-center bg-muted p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("light")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        previewMode === "light"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Sun className="size-3.5 text-amber-500" />
                      <span>Claro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("dark")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        previewMode === "dark"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Moon className="size-3.5 text-sky-400" />
                      <span>Oscuro</span>
                    </button>
                  </div>
                </div>
                <CardDescription>
                  Representación idéntica a cómo se renderiza la cabecera en el portal público:
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Simulated Header Navigation Bar */}
                <div
                  className={`rounded-2xl border p-4 transition-all shadow-sm ${
                    previewMode === "dark"
                      ? "bg-[#06182c] border-slate-800 text-slate-100"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 overflow-hidden">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={activePreviewSrc}
                        alt={form.logo_alt ?? "Logo Preview"}
                        style={{ height: `${logoHeightPx}px` }}
                        className="w-auto max-w-[180px] object-contain shrink-0 transition-all"
                      />

                      {form.show_wordmark !== false && (
                        <div className="hidden sm:flex flex-col leading-tight min-w-0">
                          <span
                            className={`font-extrabold text-base tracking-tight truncate ${
                              previewMode === "dark" ? "text-white" : "text-slate-900"
                            }`}
                          >
                            DMPS Family Info
                          </span>
                          <span
                            className={`text-xs font-semibold truncate flex items-center gap-1 ${
                              previewMode === "dark" ? "text-sky-400" : "text-blue-700"
                            }`}
                          >
                            <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                            Abraham Lincoln High School
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 opacity-75 pointer-events-none">
                      <div
                        className={`size-8 rounded-full border flex items-center justify-center text-xs font-bold ${
                          previewMode === "dark"
                            ? "border-slate-700 bg-slate-800/80 text-slate-300"
                            : "border-slate-200 bg-slate-100 text-slate-700"
                        }`}
                      >
                        EN
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Header Preview */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    En Dispositivos Móviles
                  </span>
                  <div
                    className={`rounded-xl border p-3 flex items-center justify-between ${
                      previewMode === "dark"
                        ? "bg-[#06182c] border-slate-800 text-white"
                        : "bg-white border-slate-200 text-slate-900"
                    }`}
                  >
                    <img
                      src={activePreviewSrc}
                      alt="Mobile Preview"
                      style={{ height: `${Math.min(logoHeightPx, 44)}px` }}
                      className="w-auto max-w-[140px] object-contain shrink-0"
                    />
                    <div className="text-[11px] font-semibold opacity-60">Menú Móvil ☰</div>
                  </div>
                </div>

                {/* Verification Notice */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-primary text-sm">
                    <ShieldCheck className="size-4 shrink-0" />
                    <span>Garantía de Persistencia en Servidor</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Al hacer clic en <strong>Guardar Cambios</strong>, la imagen se almacena en la
                    base de datos persistente del servidor y se difunde automáticamente a todas las
                    pestañas abiertas sin necesidad de recargar manualmente.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => saveMutation.mutate(form)}
                  disabled={saveMutation.isPending}
                  className="w-full min-h-11 rounded-xl font-bold gap-2 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="size-4" />
                  <span>
                    {saveMutation.isPending ? "Guardando..." : "Guardar y Publicar Ícono"}
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
