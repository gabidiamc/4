/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("El archivo es demasiado grande. Seleccione un archivo menor a 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.onerror = () => {
      setUploadError("Error al leer el archivo. Intente nuevamente.");
    };
    reader.readAsDataURL(file);
  };

  if (type === "image" || type === "url") {
    const isPdf =
      typeof value === "string" &&
      (value.includes("application/pdf") || value.toLowerCase().endsWith(".pdf"));

    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground">
          {field.label}
        </Label>

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
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onChange(null)}
              className="h-8 rounded-xl px-2.5 gap-1 text-xs shrink-0"
              title="Quitar archivo"
            >
              <Trash2 className="size-3.5" />
              <span>Quitar</span>
            </Button>
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
          >
            <Upload className="size-4" />
            <span>Subir desde dispositivo</span>
          </Button>

          <Input
            id={id}
            type="text"
            placeholder="o pegue una URL directa de imagen..."
            value={value ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              onChange(raw === "" ? null : raw);
            }}
            className="min-h-11 rounded-xl text-sm flex-1"
          />
        </div>

        {uploadError ? <p className="text-xs font-medium text-destructive">{uploadError}</p> : null}
        {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
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
