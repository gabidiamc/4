import React, { useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon, Check, Crop, Move, RotateCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageAdjuster } from "@/components/image-adjuster";

interface FileUploadInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  accept?: string;
  showPreview?: boolean;
  className?: string;
}

export function FileUploadInput({
  id,
  value,
  onChange,
  label,
  helperText,
  placeholder = "Pega un enlace o sube un archivo desde tu dispositivo...",
  accept = "image/*,.pdf,application/pdf",
  showPreview = true,
  className = "",
}: FileUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);

  const isPdf =
    value.toLowerCase().includes("application/pdf") || value.toLowerCase().endsWith(".pdf");
  const isImage =
    value.startsWith("data:image") ||
    value.match(/\.(jpeg|jpg|png|gif|webp|svg|bmp|avif)($|\?)/i) ||
    (!isPdf && value.startsWith("http"));

  const handleFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      onChange(result);
      setIsProcessing(false);
    };

    reader.onerror = () => {
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-xs font-bold text-muted-foreground block">{label}</label>}

      {/* Input row + File selection button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-11 rounded-xl text-xs pr-10"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2.5 top-2.5 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Limpiar"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="min-h-11 rounded-xl gap-2 font-bold shrink-0 bg-card hover:bg-muted border-border"
        >
          <Upload className="size-4 text-primary" />
          <span>{isProcessing ? "Cargando..." : "Subir archivo"}</span>
        </Button>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border/80 bg-muted/20 hover:bg-muted/40"
        }`}
      >
        <Upload className="size-5 text-muted-foreground mb-1" />
        <p className="text-xs font-medium text-foreground">
          Haz clic o arrastra aquí tu archivo (PNG, JPG, PDF, WEBP, etc.)
        </p>
        {helperText && <p className="text-[11px] text-muted-foreground mt-0.5">{helperText}</p>}
      </div>

      {/* Preview & Image Tools */}
      {showPreview && value && (
        <div className="relative mt-2 overflow-hidden rounded-xl border border-border bg-card p-2.5 shadow-2xs space-y-2">
          {isImage ? (
            <>
              <div className="relative flex max-h-56 w-full items-center justify-center overflow-hidden rounded-lg bg-black/5 p-1">
                <img
                  src={value}
                  alt="Vista previa"
                  className="max-h-52 w-auto object-contain rounded-lg"
                />
              </div>

              {/* Quick Adjust Button */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                  <Check className="size-3.5 text-emerald-600" />
                  Imagen lista
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsAdjusterOpen(true)}
                  className="h-8 rounded-lg text-xs font-bold gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Crop className="size-3.5" />
                  <span>Ajustar (Mover / Escalar / Rotar)</span>
                </Button>
              </div>

              {/* Adjuster Modal */}
              {isAdjusterOpen && (
                <ImageAdjuster
                  isOpen={isAdjusterOpen}
                  onClose={() => setIsAdjusterOpen(false)}
                  imageUrl={value}
                  onSave={(newVal) => {
                    onChange(newVal);
                  }}
                  title={label ? `Ajustar imagen: ${label}` : "Ajustar Imagen"}
                />
              )}
            </>
          ) : isPdf ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 text-primary">
              <FileText className="size-8 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate">Documento PDF cargado</div>
                <div className="text-[10px] text-muted-foreground">
                  Listo para visualizar y descargar
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
              <Check className="size-4 text-emerald-600" />
              <span className="truncate">{value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
