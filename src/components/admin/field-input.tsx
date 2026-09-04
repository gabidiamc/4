/* eslint-disable @typescript-eslint/no-explicit-any */
import { Crop, ImagePlus, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImageFile } from "@/lib/image-compression";
import { ImageAdjuster } from "@/components/image-adjuster";
import { CanvaDirectImageField } from "@/components/canva-image-direct-editor";

export type Field = {
  name: string;
  label: string;
  type?:
    "text" | "textarea" | "number" | "checkbox" | "date" | "datetime" | "select" | "url" | "image";
  options?: { value: string; label: string }[];
  required?: boolean;
  help?: string;
};

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: any;
  onChange: (v: any) => void;
}) {
  const id = `f-${field.name}`;
  const type = field.type ?? "text";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editorMode, setEditorMode] = useState<"classic" | "canva">("classic");

  if (type === "checkbox") {
    return (
      <label className="flex min-h-11 items-center gap-3 font-medium cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="size-5 rounded border-border text-primary focus:ring-primary"
        />
        {field.label}
      </label>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !file.type.startsWith("image/") &&
      !file.type.includes("pdf") &&
      !file.name.endsWith(".pdf")
    ) {
      setUploadError("Por favor seleccione un archivo válido (PNG, JPG, PDF, SVG, WebP, etc.).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError("El archivo es demasiado grande. Seleccione un archivo menor a 20MB.");
      return;
    }

    setIsUploading(true);
    try {
      const optimizedUrl = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.82,
        mimeType: "image/jpeg",
      });
      onChange(optimizedUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) onChange(result);
      };
      reader.onerror = () => {
        setUploadError("Error al leer el archivo. Intente nuevamente.");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const files = Array.from(clipboardData.files || []);
    const imgFile = files.find((f) => f.type.startsWith("image/"));
    if (imgFile) {
      e.preventDefault();
      try {
        setIsUploading(true);
        const optimized = await compressImageFile(imgFile, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.85,
        });
        onChange(optimized);
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) onChange(reader.result as string);
        };
        reader.readAsDataURL(imgFile);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    const items = Array.from(clipboardData.items || []);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          try {
            setIsUploading(true);
            const optimized = await compressImageFile(file, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 0.85,
            });
            onChange(optimized);
          } catch {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result) onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
          } finally {
            setIsUploading(false);
          }
          return;
        }
      }
    }

    const text = clipboardData.getData("text/plain")?.trim();
    if (
      text &&
      (text.startsWith("data:image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg|avif)($|\?)/i.test(text) ||
        (text.startsWith("http") &&
          (text.includes("images.unsplash.com") ||
            text.includes("cloudinary.com") ||
            text.includes("imgur.com"))))
    ) {
      e.preventDefault();
      onChange(text);
    }
  };

  if (type === "image" && editorMode === "canva") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={id}
            className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <Sparkles className="size-4 text-primary" />
            <span>{field.label} (Modo Canva Activo)</span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditorMode("classic")}
            className="h-7 text-xs font-semibold rounded-lg text-foreground hover:bg-muted"
          >
            ← Volver a Subida Clásica
          </Button>
        </div>
        <CanvaDirectImageField
          id={id}
          label={field.label}
          value={typeof value === "string" ? value : null}
          onChange={(v) => onChange(v)}
        />
      </div>
    );
  }

  if (type === "url" || type === "image") {
    const isPdf =
      typeof value === "string" &&
      (value.includes("application/pdf") || value.toLowerCase().endsWith(".pdf"));

    return (
      <div onPaste={handlePaste} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-sm font-semibold text-foreground">
            {field.label}
          </Label>

          {type === "image" && (
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setEditorMode("classic")}
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                  editorMode === "classic"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📁 Subida Clásica
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("canva")}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                  editorMode === "canva"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-primary hover:text-primary/80"
                }`}
              >
                <Sparkles className="size-3" />
                <span>Canva (Extra)</span>
              </button>
            </div>
          )}
        </div>

        {value ? (
          <div className="relative flex items-center gap-4 p-3 rounded-2xl border border-border bg-card/60 shadow-xs">
            <div className="relative size-16 shrink-0 rounded-xl border border-border/80 bg-muted/40 p-1 flex items-center justify-center overflow-hidden">
              {isPdf ? (
                <span className="text-2xl">📄</span>
              ) : (
                <img
                  src={String(value)}
                  alt={field.label}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {isPdf ? "Documento PDF cargado" : "Archivo cargado"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate font-mono">
                {String(value).startsWith("data:") ? "Archivo local (Data URL)" : String(value)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!isPdf && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdjusterOpen(true)}
                    className="h-8 rounded-xl px-2.5 gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10"
                    title="Ajustar imagen en ventana flotante (Sistema anterior)"
                  >
                    <Crop className="size-3.5" />
                    <span className="hidden sm:inline">Ajustar (Clásico)</span>
                  </Button>
                  {type === "image" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditorMode("canva")}
                      className="h-8 rounded-xl px-2.5 gap-1.5 text-xs font-semibold border-primary/30 bg-primary/5 text-primary hover:bg-primary/15"
                      title="Editar visualmente con Canva (Extra)"
                    >
                      <Sparkles className="size-3.5" />
                      <span className="hidden sm:inline">Modo Canva</span>
                    </Button>
                  )}
                </>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange(null)}
                className="h-8 rounded-xl px-2.5 gap-1 text-xs"
                title="Quitar archivo"
              >
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">Quitar</span>
              </Button>
            </div>

            {/* Canvas Image Adjuster Dialog */}
            {!isPdf && isAdjusterOpen && (
              <ImageAdjuster
                isOpen={isAdjusterOpen}
                onClose={() => setIsAdjusterOpen(false)}
                imageUrl={String(value)}
                onSave={(newVal) => {
                  onChange(newVal);
                  setIsAdjusterOpen(false);
                }}
                title={`Ajustar imagen: ${field.label}`}
                defaultAspectRatio="original"
                saveLabel="Guardar y Aplicar al Recurso"
              />
            )}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-11 rounded-xl font-semibold gap-2 border-primary/30 text-primary hover:bg-primary/5 shrink-0"
            disabled={isUploading}
          >
            <Upload className="size-4" />
            <span>{isUploading ? "Cargando..." : "Subir desde dispositivo"}</span>
          </Button>

          <Input
            id={id}
            type="text"
            placeholder="o pega una URL directa de imagen o presiona Ctrl+V..."
            value={value ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              onChange(raw === "" ? null : raw);
            }}
            className="min-h-11 rounded-xl text-sm flex-1"
          />
        </div>

        {uploadError ? <p className="text-xs font-medium text-destructive">{uploadError}</p> : null}
        {field.help ? (
          <p className="text-xs text-muted-foreground">{field.help}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            💡 Puedes subir un archivo, escribir una URL o simplemente copiar una foto y pegarla con{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground font-semibold border border-border">
              Ctrl+V
            </kbd>
            .
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-foreground">
        {field.label}
      </Label>
      {type === "textarea" ? (
        <Textarea
          id={id}
          value={value ?? ""}
          required={field.required ?? false}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-24 rounded-xl text-base"
        />
      ) : type === "select" ? (
        <select
          id={id}
          value={value ?? ""}
          required={field.required ?? false}
          onChange={(e) => onChange(e.target.value || null)}
          className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-base"
        >
          <option value="">—</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={id}
          type={
            type === "number"
              ? "number"
              : type === "date"
                ? "date"
                : type === "datetime"
                  ? "datetime-local"
                  : "text"
          }
          value={type === "datetime" ? toLocalDatetime(value) : (value ?? "")}
          required={field.required ?? false}
          onChange={(e) => {
            const raw = e.target.value;
            if (type === "number") onChange(raw === "" ? null : Number(raw));
            else if (type === "datetime") onChange(raw ? new Date(raw).toISOString() : null);
            else onChange(raw === "" ? null : raw);
          }}
          className="min-h-11 rounded-xl text-base"
        />
      )}
      {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
    </div>
  );
}

function toLocalDatetime(value: any) {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
