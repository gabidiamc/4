import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Heading2,
  Heading3,
  Type,
  Image as ImageIcon,
  Palette,
  Highlighter,
  AlertCircle,
  Link as LinkIcon,
  Trash2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const PRESET_TEXT_COLORS = [
  { name: "Por defecto", hex: "inherit" },
  { name: "Rojo", hex: "#ef4444" },
  { name: "Azul", hex: "#2563eb" },
  { name: "Verde", hex: "#10b981" },
  { name: "Dorado", hex: "#d97706" },
  { name: "Morado", hex: "#8b5cf6" },
  { name: "Rosa", hex: "#ec4899" },
  { name: "Gris Oscuro", hex: "#1f2937" },
];

const PRESET_BG_COLORS = [
  { name: "Sin resalte", hex: "transparent" },
  { name: "Amarillo", hex: "#fef08a" },
  { name: "Verde", hex: "#dcfce7" },
  { name: "Azul", hex: "#e0f2fe" },
  { name: "Rosa", hex: "#fce7f3" },
  { name: "Morado", hex: "#f3e8ff" },
];

interface VisualRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function VisualRichEditor({
  value,
  onChange,
  placeholder = "Escribe aquí el contenido del artículo...",
}: VisualRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Sync value to editor DOM when value changes externally
  useEffect(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      if (value !== currentHtml) {
        // If empty value, set placeholder break
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const applyTextColor = (hex: string) => {
    if (hex === "inherit") {
      exec("removeFormat");
    } else {
      exec("foreColor", hex);
    }
    setShowColorMenu(false);
  };

  const applyBgColor = (hex: string) => {
    exec("hiliteColor", hex);
    setShowBgMenu(false);
  };

  const insertCallout = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const calloutHtml = `
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1rem 0; color: #1e3a8a; font-weight: 500;">
        💡 <strong>Nota importante:</strong> Escribe aquí el aviso o información destacada...
      </div>
      <p><br></p>
    `;
    document.execCommand("insertHTML", false, calloutHtml);
    handleInput();
  };

  const handleInsertImage = () => {
    if (!imageUrl.trim()) return;
    if (!editorRef.current) return;
    editorRef.current.focus();

    const captionHtml = imageCaption.trim()
      ? `<figcaption style="text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 0.375rem;">${imageCaption.trim()}</figcaption>`
      : "";

    const imgHtml = `
      <figure style="margin: 1.25rem 0; text-align: center;">
        <img src="${imageUrl.trim()}" alt="${imageCaption.trim()}" style="max-width: 100%; height: auto; border-radius: 1rem; border: 1px solid rgba(0,0,0,0.1); display: inline-block; shadow: 0 2px 8px rgba(0,0,0,0.05);" />
        ${captionHtml}
      </figure>
      <p><br></p>
    `;
    document.execCommand("insertHTML", false, imgHtml);
    setImageUrl("");
    setImageCaption("");
    setImageDialogOpen(false);
    handleInput();
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    if (!editorRef.current) return;
    editorRef.current.focus();

    const text = linkText.trim() || linkUrl.trim();
    const linkHtml = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 600; text-decoration: underline;">${text}</a>`;
    document.execCommand("insertHTML", false, linkHtml);
    setLinkUrl("");
    setLinkText("");
    setLinkDialogOpen(false);
    handleInput();
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
      {/* Visual Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/80 bg-muted/40 p-2 text-foreground">
        {/* Basic Text Formats */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Negrita (Ctrl+B)"
          onClick={() => exec("bold")}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Cursiva (Ctrl+I)"
          onClick={() => exec("italic")}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Subrayado (Ctrl+U)"
          onClick={() => exec("underline")}
        >
          <Underline className="size-4" />
        </Button>

        <div className="h-5 w-px bg-border/80 mx-1" />

        {/* Text Color Dropdown */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold hover:bg-background"
            onClick={() => {
              setShowColorMenu(!showColorMenu);
              setShowBgMenu(false);
            }}
          >
            <Palette className="size-4 text-primary" />
            <span>Color</span>
          </Button>

          {showColorMenu && (
            <div className="absolute left-0 top-10 z-50 flex w-48 flex-col rounded-xl border border-border bg-popover p-2 shadow-lg animate-in fade-in zoom-in-95">
              <span className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Color de letra
              </span>
              <div className="grid grid-cols-4 gap-1.5 p-1">
                {PRESET_TEXT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    className="size-7 rounded-full border border-border/60 transition-transform hover:scale-110 focus:outline-hidden"
                    style={{ backgroundColor: c.hex === "inherit" ? "#ffffff" : c.hex }}
                    onClick={() => applyTextColor(c.hex)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Dropdown */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold hover:bg-background"
            onClick={() => {
              setShowBgMenu(!showBgMenu);
              setShowColorMenu(false);
            }}
          >
            <Highlighter className="size-4 text-amber-500" />
            <span>Resaltar</span>
          </Button>

          {showBgMenu && (
            <div className="absolute left-0 top-10 z-50 flex w-48 flex-col rounded-xl border border-border bg-popover p-2 shadow-lg animate-in fade-in zoom-in-95">
              <span className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Fondo de texto
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1">
                {PRESET_BG_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    className="flex items-center gap-1.5 rounded-lg border border-border/60 p-1.5 text-xs transition-transform hover:scale-105"
                    onClick={() => applyBgColor(c.hex)}
                  >
                    <span
                      className="size-4 rounded-md border border-border"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="truncate text-[11px]">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-border/80 mx-1" />

        {/* Text Block Headers */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Párrafo normal"
          onClick={() => exec("formatBlock", "<p>")}
        >
          <Type className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 rounded-lg px-2 text-xs font-bold hover:bg-background"
          title="Título grande"
          onClick={() => exec("formatBlock", "<h2>")}
        >
          <Heading2 className="size-4 mr-1" /> Título
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 rounded-lg px-2 text-xs font-bold hover:bg-background"
          title="Subtítulo mediano"
          onClick={() => exec("formatBlock", "<h3>")}
        >
          <Heading3 className="size-4 mr-1" /> Subtítulo
        </Button>

        <div className="h-5 w-px bg-border/80 mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Alinear a la izquierda"
          onClick={() => exec("justifyLeft")}
        >
          <AlignLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Centrar texto"
          onClick={() => exec("justifyCenter")}
        >
          <AlignCenter className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Alinear a la derecha"
          onClick={() => exec("justifyRight")}
        >
          <AlignRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Lista con viñetas"
          onClick={() => exec("insertUnorderedList")}
        >
          <List className="size-4" />
        </Button>

        <div className="h-5 w-px bg-border/80 mx-1" />

        {/* Insert Elements */}
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={insertCallout}
        >
          <AlertCircle className="size-4" />
          <span>Aviso destacado</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={() => setImageDialogOpen(true)}
        >
          <ImageIcon className="size-4" />
          <span>Imagen</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={() => setLinkDialogOpen(true)}
        >
          <LinkIcon className="size-4" />
          <span>Enlace</span>
        </Button>
      </div>

      {/* Main ContentEditable Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[260px] max-h-[500px] overflow-y-auto p-4 sm:p-5 text-base leading-relaxed text-foreground outline-hidden [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:my-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-2 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2"
        data-placeholder={placeholder}
      />

      {/* Insert Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insertar Imagen en el artículo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">
                Dirección URL de la imagen
              </label>
              <Input
                placeholder="https://ejemplo.com/imagen.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="mt-1 min-h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">
                Pie de foto / Leyenda (Opcional)
              </label>
              <Input
                placeholder="Ejemplo: Estudiantes en la escuela"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="mt-1 min-h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={() => setImageDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="min-h-11 rounded-xl" onClick={handleInsertImage}>
              Insertar Imagen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insert Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insertar Enlace</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">
                Texto visible del enlace
              </label>
              <Input
                placeholder="Ejemplo: Haz clic aquí para ver más"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="mt-1 min-h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Dirección Web (URL)</label>
              <Input
                placeholder="https://ejemplo.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="mt-1 min-h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={() => setLinkDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="min-h-11 rounded-xl" onClick={handleInsertLink}>
              Insertar Enlace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
