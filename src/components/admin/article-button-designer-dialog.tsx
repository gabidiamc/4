import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  ExternalLink,
  Play,
  BookOpen,
  Download,
  Sparkles,
  Calendar,
  Check,
  Search,
  Sliders,
  Palette,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchPublishedArticles, type ArticleRow } from "@/lib/content";

export interface ArticleButtonConfig {
  mode: "next_article" | "custom_link";
  targetSlug: string;
  customUrl: string;
  label: string;
  sublabel: string;
  bgColor: string;
  textColor: string;
  shape: "pill" | "rounded-xl" | "rounded-md" | "square";
  styleType: "solid" | "gradient" | "outline" | "elevated";
  size: "sm" | "md" | "lg";
  align: "left" | "center" | "right" | "full";
  icon: "arrow" | "external" | "play" | "book" | "download" | "sparkles" | "calendar" | "none";
  insertPosition: "end" | "cursor";
  openInNewTab: boolean;
}

const PRESET_BUTTON_COLORS = [
  { name: "Azul Escolar DMPS", bg: "#1e40af", text: "#ffffff", border: "#1d4ed8" },
  { name: "Celeste Océano", bg: "#0284c7", text: "#ffffff", border: "#0369a1" },
  { name: "Verde Esmeralda", bg: "#059669", text: "#ffffff", border: "#047857" },
  { name: "Púrpura / Violeta", bg: "#7c3aed", text: "#ffffff", border: "#6d28d9" },
  { name: "Ámbar Cálido", bg: "#d97706", text: "#ffffff", border: "#b45309" },
  { name: "Rosa / Magenta", bg: "#db2777", text: "#ffffff", border: "#be185d" },
  { name: "Naranja Atardecer", bg: "#ea580c", text: "#ffffff", border: "#c2410c" },
  { name: "Negro Elegante", bg: "#0f172a", text: "#ffffff", border: "#1e293b" },
  { name: "Blanco Bordeado", bg: "#ffffff", text: "#0f172a", border: "#cbd5e1" },
];

const ICONS_MAP = {
  arrow: ArrowRight,
  external: ExternalLink,
  play: Play,
  book: BookOpen,
  download: Download,
  sparkles: Sparkles,
  calendar: Calendar,
  none: null,
};

interface ArticleButtonDesignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (html: string, position: "end" | "cursor") => void;
  defaultMode?: "next_article" | "custom_link";
}

export function ArticleButtonDesignerDialog({
  open,
  onOpenChange,
  onInsert,
  defaultMode = "next_article",
}: ArticleButtonDesignerDialogProps) {
  const [mode, setMode] = useState<"next_article" | "custom_link">(defaultMode);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");

  const [selectedSlug, setSelectedSlug] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [label, setLabel] = useState("Siguiente: Continuar leyendo");
  const [sublabel, setSublabel] = useState("");

  const [bgColor, setBgColor] = useState("#1e40af");
  const [textColor, setTextColor] = useState("#ffffff");
  const [shape, setShape] = useState<"pill" | "rounded-xl" | "rounded-md" | "square">("pill");
  const [styleType, setStyleType] = useState<"solid" | "gradient" | "outline" | "elevated">(
    "solid",
  );
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [align, setAlign] = useState<"left" | "center" | "right" | "full">("center");
  const [icon, setIcon] = useState<
    "arrow" | "external" | "play" | "book" | "download" | "sparkles" | "calendar" | "none"
  >("arrow");
  const [insertPosition, setInsertPosition] = useState<"end" | "cursor">("end");
  const [openInNewTab, setOpenInNewTab] = useState(false);

  // Fetch articles to populate the selector
  useEffect(() => {
    if (open) {
      setMode(defaultMode);
      setIsLoadingArticles(true);
      fetchPublishedArticles()
        .then((data) => {
          setArticles(data || []);
          if (data && data.length > 0 && !selectedSlug) {
            const first = data[0];
            const title = first.article_translations?.[0]?.title || first.slug;
            setSelectedSlug(first.slug);
            if (defaultMode === "next_article") {
              setLabel(`Siguiente: ${title}`);
              setInsertPosition("end");
            }
          }
        })
        .finally(() => setIsLoadingArticles(false));
    }
  }, [open, defaultMode]);

  // Filter articles by search term
  const filteredArticles = useMemo(() => {
    if (!articleSearch.trim()) return articles;
    const q = articleSearch.toLowerCase();
    return articles.filter((a) => {
      const t = (a.article_translations?.[0]?.title || "").toLowerCase();
      const s = a.slug.toLowerCase();
      return t.includes(q) || s.includes(q);
    });
  }, [articles, articleSearch]);

  const handleSelectArticle = (slug: string) => {
    setSelectedSlug(slug);
    const found = articles.find((a) => a.slug === slug);
    if (found) {
      const title = found.article_translations?.[0]?.title || found.slug;
      setLabel(`Siguiente: ${title}`);
    }
  };

  const finalUrl = useMemo(() => {
    if (mode === "next_article") {
      return `/articles/${selectedSlug || "inicio"}`;
    }
    return customUrl.trim() || "#";
  }, [mode, selectedSlug, customUrl]);

  // Generate HTML for the rich text editor
  const generateButtonHtml = (): string => {
    const radius =
      shape === "pill"
        ? "9999px"
        : shape === "rounded-xl"
          ? "1rem"
          : shape === "rounded-md"
            ? "0.5rem"
            : "0px";

    const padding =
      size === "sm" ? "0.6rem 1.25rem" : size === "lg" ? "1.1rem 2.25rem" : "0.875rem 1.75rem";

    const fontSize = size === "sm" ? "0.875rem" : size === "lg" ? "1.125rem" : "1rem";

    let bgStyle = `background-color: ${bgColor};`;
    let borderStyle = `border: 1px solid ${bgColor};`;
    let shadowStyle = "box-shadow: 0 4px 14px rgba(0,0,0,0.12);";

    if (styleType === "gradient") {
      bgStyle = `background: linear-gradient(135deg, ${bgColor} 0%, #3b82f6 100%);`;
      borderStyle = "border: none;";
      shadowStyle = "box-shadow: 0 6px 20px rgba(37,99,235,0.25);";
    } else if (styleType === "outline") {
      bgStyle = "background-color: transparent;";
      borderStyle = `border: 2.5px solid ${bgColor};`;
      shadowStyle = "box-shadow: none;";
    } else if (styleType === "elevated") {
      bgStyle = `background-color: ${bgColor};`;
      borderStyle = `border: 1px solid ${bgColor}; border-bottom: 4px solid rgba(0,0,0,0.25);`;
      shadowStyle = "box-shadow: 0 8px 24px rgba(0,0,0,0.18);";
    }

    const effectiveTextColor = styleType === "outline" ? bgColor : textColor;

    const textAlign = align === "full" ? "center" : align;

    const widthStyle =
      align === "full"
        ? "width: 100%; max-width: 100%; box-sizing: border-box;"
        : "display: inline-flex;";

    const wrapperAlign =
      align === "center"
        ? "text-align: center;"
        : align === "right"
          ? "text-align: right;"
          : align === "full"
            ? "text-align: center; width: 100%;"
            : "text-align: left;";

    let iconSymbol = "";
    if (icon === "arrow") iconSymbol = " →";
    else if (icon === "external") iconSymbol = " ↗";
    else if (icon === "play") iconSymbol = " ▶";
    else if (icon === "book") iconSymbol = " 📖";
    else if (icon === "download") iconSymbol = " 📥";
    else if (icon === "sparkles") iconSymbol = " ✨";
    else if (icon === "calendar") iconSymbol = " 📅";

    const sublabelHtml = sublabel.trim()
      ? `<span style="display: block; font-size: 0.75rem; font-weight: 500; opacity: 0.85; margin-top: 2px;">${sublabel.trim()}</span>`
      : "";

    const targetAttr = openInNewTab ? 'target="_blank" rel="noopener noreferrer"' : "";

    return `
      <div class="article-button-wrapper" style="margin: 1.75rem 0; ${wrapperAlign} clear: both;">
        <a href="${finalUrl}" ${targetAttr} class="article-interactive-button" style="text-decoration: none; font-family: inherit; font-weight: 700; ${fontSize} line-height: 1.25; border-radius: ${radius}; padding: ${padding}; ${bgStyle} ${borderStyle} color: ${effectiveTextColor}; ${shadowStyle} ${widthStyle} align-items: center; justify-content: center; gap: 0.5rem; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;">
          <span>${label.trim()}${iconSymbol}</span>
          ${sublabelHtml}
        </a>
      </div>
      <p><br></p>
    `;
  };

  const handleApply = () => {
    const html = generateButtonHtml();
    onInsert(html, insertPosition);
    onOpenChange(false);
  };

  const SelectedIcon = ICONS_MAP[icon];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-foreground">
            <Sparkles className="size-5 text-primary" />
            <span>Diseñador de Botones y Navegación</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Crea botones atractivos para continuar al siguiente artículo o enlaces destacados dentro
            del contenido.
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setMode("next_article")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === "next_article"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-4 text-primary" />
              <span>Siguiente Artículo</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("custom_link")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === "custom_link"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon className="size-4 text-primary" />
              <span>Enlace Personalizado (CTA)</span>
            </button>
          </div>

          {/* Destination Selector */}
          {mode === "next_article" ? (
            <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-3 sm:p-4">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Seleccionar Artículo de Destino</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  {articles.length} artículos disponibles
                </span>
              </label>

              <div className="relative">
                <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  placeholder="Buscar artículo por título o tema..."
                  className="pl-9 text-xs rounded-xl h-9"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-border/60 bg-card p-1">
                {isLoadingArticles ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    Cargando artículos...
                  </p>
                ) : filteredArticles.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    No se encontraron artículos con esa búsqueda.
                  </p>
                ) : (
                  filteredArticles.map((art) => {
                    const title = art.article_translations?.[0]?.title || art.slug;
                    const isSelected = selectedSlug === art.slug;
                    return (
                      <button
                        key={art.id || art.slug}
                        type="button"
                        onClick={() => handleSelectArticle(art.slug)}
                        className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-bold"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <span className="truncate">{title}</span>
                        {isSelected && <Check className="size-3.5 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-3 sm:p-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  URL de Destino (Enlace)
                </label>
                <Input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://... o /calendario o /documento.pdf"
                  className="rounded-xl text-xs h-9"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={openInNewTab}
                  onChange={(e) => setOpenInNewTab(e.target.checked)}
                  className="rounded accent-primary"
                />
                <span>Abrir en nueva pestaña (target="_blank")</span>
              </label>
            </div>
          )}

          {/* Button Text & Subtext */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Texto Principal del Botón
              </label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej: Continuar con el siguiente artículo"
                className="rounded-xl text-xs h-9"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Subtexto / Etiqueta Opcional
              </label>
              <Input
                value={sublabel}
                onChange={(e) => setSublabel(e.target.value)}
                placeholder="Ej: Lectura de 3 min • Paso 2"
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>

          {/* Color Customization */}
          <div>
            <label className="text-xs font-bold text-foreground flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Palette className="size-3.5 text-primary" />
                <span>Color y Apariencia</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Color HEX:</span>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="size-6 cursor-pointer rounded-md border border-border"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-20 rounded-md border border-border px-2 py-0.5 text-xs font-mono"
                />
              </div>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PRESET_BUTTON_COLORS.map((c) => {
                const isSelected = bgColor.toLowerCase() === c.bg.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setBgColor(c.bg);
                      setTextColor(c.text);
                    }}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 shadow-xs bg-muted/60"
                        : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className="size-4 shrink-0 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: c.bg }}
                    />
                    <span className="text-[11px] font-semibold truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shape & Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Forma del Botón
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "pill", label: "Píldora", icon: "🟢" },
                  { id: "rounded-xl", label: "Curvo", icon: "🔲" },
                  { id: "rounded-md", label: "Medio", icon: "⏹️" },
                  { id: "square", label: "Recto", icon: "◻️" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShape(s.id as ArticleButtonConfig["shape"])}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                      shape === s.id
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/60 text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-base">{s.icon}</span>
                    <span className="text-[10px] mt-0.5">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Decoración / Estilo Visual
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "solid", label: "Sólido" },
                  { id: "gradient", label: "Gradiente" },
                  { id: "outline", label: "Contorno" },
                  { id: "elevated", label: "3D Elevado" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStyleType(st.id as ArticleButtonConfig["styleType"])}
                    className={`rounded-xl border p-2 text-center text-xs transition-all ${
                      styleType === st.id
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/60 text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Size, Alignment, Icon & Position */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Tamaño</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as ArticleButtonConfig["size"])}
                className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="sm">Pequeño</option>
                <option value="md">Mediano (Normal)</option>
                <option value="lg">Grande (Destacado)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Alineación</label>
              <select
                value={align}
                onChange={(e) => setAlign(e.target.value as ArticleButtonConfig["align"])}
                className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="center">Centrado</option>
                <option value="left">Izquierda</option>
                <option value="right">Derecha</option>
                <option value="full">Ancho Completo (100%)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Icono</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value as ArticleButtonConfig["icon"])}
                className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="arrow">Flecha Siguiente (→)</option>
                <option value="external">Flecha Externa (↗)</option>
                <option value="play">Reproducir (▶)</option>
                <option value="book">Libro (📖)</option>
                <option value="download">Descargar (📥)</option>
                <option value="sparkles">Estrella (✨)</option>
                <option value="calendar">Calendario (📅)</option>
                <option value="none">Sin Icono</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Insertar En</label>
              <select
                value={insertPosition}
                onChange={(e) =>
                  setInsertPosition(e.target.value as ArticleButtonConfig["insertPosition"])
                }
                className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-primary"
              >
                <option value="end">Al final del artículo</option>
                <option value="cursor">En el cursor (en medio)</option>
              </select>
            </div>
          </div>

          {/* REAL TIME PREVIEW */}
          <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/30 p-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              Vista Previa en Tiempo Real
            </span>

            <div
              className={`p-4 rounded-xl bg-card border border-border/40 min-h-[90px] flex items-center ${
                align === "center" || align === "full"
                  ? "justify-center"
                  : align === "right"
                    ? "justify-end"
                    : "justify-start"
              }`}
            >
              <div
                style={{
                  backgroundColor: styleType === "outline" ? "transparent" : bgColor,
                  background:
                    styleType === "gradient"
                      ? `linear-gradient(135deg, ${bgColor} 0%, #3b82f6 100%)`
                      : undefined,
                  color: styleType === "outline" ? bgColor : textColor,
                  borderRadius:
                    shape === "pill"
                      ? "9999px"
                      : shape === "rounded-xl"
                        ? "1rem"
                        : shape === "rounded-md"
                          ? "0.5rem"
                          : "0px",
                  border:
                    styleType === "outline"
                      ? `2.5px solid ${bgColor}`
                      : styleType === "elevated"
                        ? `1px solid ${bgColor}`
                        : "none",
                  borderBottom: styleType === "elevated" ? "4px solid rgba(0,0,0,0.25)" : undefined,
                  boxShadow:
                    styleType === "elevated"
                      ? "0 8px 24px rgba(0,0,0,0.18)"
                      : styleType === "solid"
                        ? "0 4px 14px rgba(0,0,0,0.12)"
                        : undefined,
                  padding:
                    size === "sm"
                      ? "0.6rem 1.25rem"
                      : size === "lg"
                        ? "1.1rem 2.25rem"
                        : "0.875rem 1.75rem",
                  fontSize: size === "sm" ? "0.875rem" : size === "lg" ? "1.125rem" : "1rem",
                  width: align === "full" ? "100%" : "auto",
                  textAlign: "center",
                }}
                className="font-bold inline-flex flex-col items-center justify-center transition-all cursor-default select-none"
              >
                <div className="flex items-center gap-2">
                  <span>{label || "Texto del Botón"}</span>
                  {SelectedIcon && <SelectedIcon className="size-4" />}
                </div>
                {sublabel.trim() && (
                  <span className="text-[11px] opacity-85 font-medium mt-0.5">
                    {sublabel.trim()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex sm:justify-between items-center gap-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            type="button"
            className="rounded-xl text-xs font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            className="rounded-xl text-xs font-bold gap-2 px-5 min-h-10"
            onClick={handleApply}
          >
            <Check className="size-4" />
            <span>
              {insertPosition === "end" ? "Insertar al final del artículo" : "Insertar en el texto"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
