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
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Move,
  X,
  Sliders,
  Check,
  Crop,
  Upload,
  Layers,
  Video,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Unlink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileUploadInput } from "@/components/file-upload-input";
import { ImageAdjuster } from "@/components/image-adjuster";
import { compressImageFile } from "@/lib/image-compression";
import {
  CanvaDirectOverlay,
  applyCanvaStateToImgElement,
} from "@/components/canva-image-direct-editor";
import { ArticleButtonDesignerDialog } from "./article-button-designer-dialog";
import { ArticleVideoDialog } from "./article-video-dialog";
import { ImageLinkDialog } from "./image-link-dialog";

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

  // Dialogs
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const dialogFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingDialogFile, setIsUploadingDialogFile] = useState(false);

  // Classic Adjuster Modal Dialog (Extra fallback)
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);

  // Drag & drop feedback
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);

  // Button Designer Dialog
  const [buttonDesignerOpen, setButtonDesignerOpen] = useState(false);
  const [buttonDesignerMode, setButtonDesignerMode] = useState<"next_article" | "custom_link">(
    "next_article",
  );

  // Video Embed Dialog
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  // Image Link Dialog
  const [imageLinkDialogOpen, setImageLinkDialogOpen] = useState(false);

  // Prevent parent value loop from unmounting selected image DOM node
  const isInternalUpdateRef = useRef(false);

  // In-Editor Image Selection & Canva Direct Editing
  const [selectedImageEl, setSelectedImageEl] = useState<HTMLImageElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // Sync value to editor DOM only when value changes externally (not during internal editing)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      if (value !== currentHtml) {
        const selectedId = selectedImageEl?.getAttribute("data-editor-img-id");
        editorRef.current.innerHTML = value || "";
        if (selectedId) {
          const restored = editorRef.current.querySelector<HTMLImageElement>(
            `[data-editor-img-id="${selectedId}"]`,
          );
          if (restored) setSelectedImageEl(restored);
        }
      }
    }
  }, [value, selectedImageEl]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalUpdateRef.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  // Click on editor listener to detect when an image is clicked
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        const img = target as HTMLImageElement;
        if (!img.getAttribute("data-editor-img-id")) {
          img.setAttribute(
            "data-editor-img-id",
            "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
          );
        }
        setSelectedImageEl(img);
      }
    };

    editor.addEventListener("click", handleClick);
    return () => {
      editor.removeEventListener("click", handleClick);
    };
  }, []);

  // Move selected image up or down among paragraphs in article text
  const moveSelectedImageInText = (direction: "up" | "down") => {
    if (!selectedImageEl || !editorRef.current) return;
    const block =
      selectedImageEl.closest("figure") || selectedImageEl.closest("a") || selectedImageEl;
    if (direction === "up") {
      const prev = block.previousElementSibling;
      if (prev) {
        prev.before(block);
        handleInput();
      }
    } else {
      const next = block.nextElementSibling;
      if (next) {
        next.after(block);
        handleInput();
      }
    }
  };

  // Attach link to image
  const handleApplyImageLink = (url: string, openInNewTab: boolean) => {
    if (!selectedImageEl) return;
    const existingA = selectedImageEl.closest("a");
    if (existingA) {
      existingA.setAttribute("href", url);
      if (openInNewTab) {
        existingA.setAttribute("target", "_blank");
        existingA.setAttribute("rel", "noopener noreferrer");
      } else {
        existingA.removeAttribute("target");
        existingA.removeAttribute("rel");
      }
    } else {
      const a = document.createElement("a");
      a.setAttribute("href", url);
      if (openInNewTab) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
      a.style.display = "inline-block";
      a.style.maxWidth = "100%";
      a.style.textDecoration = "none";
      selectedImageEl.parentNode?.insertBefore(a, selectedImageEl);
      a.appendChild(selectedImageEl);
    }
    selectedImageEl.dataset.linkUrl = url;
    handleInput();
  };

  // Remove link from image
  const handleRemoveImageLink = () => {
    if (!selectedImageEl) return;
    const existingA = selectedImageEl.closest("a");
    if (existingA) {
      existingA.replaceWith(selectedImageEl);
    }
    delete selectedImageEl.dataset.linkUrl;
    handleInput();
  };

  // Insert button HTML
  const handleInsertButton = (buttonHtml: string, position: "end" | "cursor") => {
    if (position === "end" && editorRef.current) {
      editorRef.current.innerHTML += buttonHtml;
      handleInput();
    } else {
      insertHtmlAtSelection(buttonHtml);
    }
  };

  // Insert video HTML
  const handleInsertVideo = (videoHtml: string) => {
    insertHtmlAtSelection(videoHtml);
  };

  const insertHtmlAtSelection = (html: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const el = document.createElement("div");
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node: ChildNode | null;
        let lastNode: ChildNode | null = null;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
        handleInput();
        return;
      }
    }

    // Fallback: append
    try {
      const success = document.execCommand("insertHTML", false, html);
      if (!success) {
        editorRef.current.innerHTML += html;
      }
    } catch {
      editorRef.current.innerHTML += html;
    }
    handleInput();
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
    const calloutHtml = `
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1rem 0; color: #1e3a8a; font-weight: 500;">
        💡 <strong>Nota importante:</strong> Escribe aquí el aviso o información destacada...
      </div>
      <p><br></p>
    `;
    insertHtmlAtSelection(calloutHtml);
  };

  // Dedicated helper to insert an image into the article content
  const insertImageHtml = (src: string, caption = "") => {
    const captionHtml = caption.trim()
      ? `<figcaption style="text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 0.375rem;">${caption.trim()}</figcaption>`
      : "";

    const imgHtml = `
      <figure style="margin: 1.25rem 0; text-align: center; display: block;">
        <img src="${src}" alt="${caption.trim() || "Imagen"}" style="max-width: 100%; width: 100%; height: auto; border-radius: 1rem; border: 1px solid rgba(0,0,0,0.1); display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: transform 0.2s;" />
        ${captionHtml}
      </figure>
      <p><br></p>
    `;
    insertHtmlAtSelection(imgHtml);

    // Auto-select inserted image so controls appear immediately
    setTimeout(() => {
      const imgs = editorRef.current?.querySelectorAll("img");
      if (imgs && imgs.length > 0) {
        const lastImg = imgs[imgs.length - 1];
        setSelectedImageEl(lastImg);
      }
    }, 80);
  };

  // Insert image from Dialog (classic upload or URL)
  const handleInsertImage = () => {
    if (!imageUrl.trim()) return;
    insertImageHtml(imageUrl.trim(), imageCaption.trim());
    setImageUrl("");
    setImageCaption("");
    setImageDialogOpen(false);
  };

  // Upload file from Dialog
  const handleDialogFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingDialogFile(true);
      const optimized = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
        mimeType: "image/jpeg",
      });
      setImageUrl(optimized);
      if (!imageCaption) {
        setImageCaption(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingDialogFile(false);
      if (dialogFileInputRef.current) dialogFileInputRef.current.value = "";
    }
  };

  // 📋 Robust Paste Handler: Captures screenshots, copied files, and copied image blobs!
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Check for files in clipboard
    const files = Array.from(clipboardData.files || []);
    const imageFile = files.find((f) => f.type.startsWith("image/"));

    if (imageFile) {
      e.preventDefault();
      e.stopPropagation();
      try {
        const optimized = await compressImageFile(imageFile, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.85,
          mimeType: "image/jpeg",
        });
        insertImageHtml(optimized, imageFile.name || "Imagen pegada");
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            insertImageHtml(reader.result, "Imagen pegada");
          }
        };
        reader.readAsDataURL(imageFile);
      }
      return;
    }

    // 2. Check for image items (e.g. screenshots from snipping tool, copied from web)
    const items = Array.from(clipboardData.items || []);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();
          try {
            const optimized = await compressImageFile(file, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 0.85,
              mimeType: "image/jpeg",
            });
            insertImageHtml(optimized, "Imagen pegada");
          } catch {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                insertImageHtml(reader.result, "Imagen pegada");
              }
            };
            reader.readAsDataURL(file);
          }
          return;
        }
      }
    }

    // 3. Check for direct image URL in pasted plain text
    const plainText = clipboardData.getData("text/plain")?.trim();
    if (
      plainText &&
      (plainText.startsWith("data:image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg|avif)($|\?)/i.test(plainText) ||
        (plainText.startsWith("http") &&
          (plainText.includes("images.unsplash.com") ||
            plainText.includes("imgur.com") ||
            plainText.includes("cloudinary.com") ||
            plainText.includes("googleusercontent.com"))))
    ) {
      e.preventDefault();
      e.stopPropagation();
      insertImageHtml(plainText, "Imagen");
      return;
    }

    // 4. Check for HTML with <img> tags copied from another web page
    const html = clipboardData.getData("text/html");
    if (html && html.includes("<img")) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const imgs = doc.querySelectorAll("img");
      if (imgs.length > 0 && (!doc.body.textContent || doc.body.textContent.trim().length === 0)) {
        e.preventDefault();
        e.stopPropagation();
        imgs.forEach((img) => {
          if (img.src) {
            insertImageHtml(img.src, img.alt || "Imagen pegada");
          }
        });
        return;
      }

      // Mixed text and images: let browser paste, then sanitize img styles
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.querySelectorAll("img").forEach((img) => {
            if (!img.style.maxWidth) img.style.maxWidth = "100%";
            if (!img.style.borderRadius) img.style.borderRadius = "0.75rem";
            if (!img.style.height) img.style.height = "auto";
          });
          handleInput();
        }
      }, 60);
    }
  };

  // Drag & drop support: drag image files straight into the editor!
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types?.includes("Files")) {
      e.preventDefault();
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    const imgFile = files.find((f) => f.type.startsWith("image/"));
    if (imgFile) {
      e.preventDefault();
      e.stopPropagation();
      try {
        const optimized = await compressImageFile(imgFile, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.85,
          mimeType: "image/jpeg",
        });
        insertImageHtml(optimized, imgFile.name || "Imagen subida");
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            insertImageHtml(reader.result, imgFile.name || "Imagen subida");
          }
        };
        reader.readAsDataURL(imgFile);
      }
    }
  };

  // Quick toolbar image sizing & align presets (Traditional reliable buttons)
  const updateSelectedImageWidth = (percent: number) => {
    if (!selectedImageEl) return;
    selectedImageEl.style.width = `${percent}%`;
    selectedImageEl.style.maxWidth = "100%";
    selectedImageEl.style.height = "auto";
    handleInput();
  };

  const updateSelectedImageRotation = (deltaDeg: number) => {
    if (!selectedImageEl) return;
    const transform = selectedImageEl.style.transform || "";
    const match = transform.match(/rotate\((-?\d+)deg\)/);
    const currentRot = match ? parseInt(match[1], 10) : 0;
    const newRot = (currentRot + deltaDeg) % 360;
    selectedImageEl.style.transform = `rotate(${newRot}deg)`;
    handleInput();
  };

  const updateSelectedImageAlign = (
    align: "left" | "center" | "right" | "float-left" | "float-right",
  ) => {
    if (!selectedImageEl) return;
    const parentFigure = selectedImageEl.closest("figure");

    if (align === "float-left") {
      selectedImageEl.style.float = "left";
      selectedImageEl.style.margin = "0.5rem 1.25rem 0.5rem 0";
      selectedImageEl.style.display = "inline-block";
      if (parentFigure) parentFigure.style.textAlign = "left";
    } else if (align === "float-right") {
      selectedImageEl.style.float = "right";
      selectedImageEl.style.margin = "0.5rem 0 0.5rem 1.25rem";
      selectedImageEl.style.display = "inline-block";
      if (parentFigure) parentFigure.style.textAlign = "right";
    } else if (align === "left") {
      selectedImageEl.style.float = "none";
      selectedImageEl.style.display = "block";
      selectedImageEl.style.marginLeft = "0";
      selectedImageEl.style.marginRight = "auto";
      selectedImageEl.style.marginTop = "1rem";
      selectedImageEl.style.marginBottom = "1rem";
      if (parentFigure) parentFigure.style.textAlign = "left";
    } else if (align === "right") {
      selectedImageEl.style.float = "none";
      selectedImageEl.style.display = "block";
      selectedImageEl.style.marginLeft = "auto";
      selectedImageEl.style.marginRight = "0";
      selectedImageEl.style.marginTop = "1rem";
      selectedImageEl.style.marginBottom = "1rem";
      if (parentFigure) parentFigure.style.textAlign = "right";
    } else {
      // Center
      selectedImageEl.style.float = "none";
      selectedImageEl.style.display = "block";
      selectedImageEl.style.marginLeft = "auto";
      selectedImageEl.style.marginRight = "auto";
      selectedImageEl.style.marginTop = "1rem";
      selectedImageEl.style.marginBottom = "1rem";
      if (parentFigure) parentFigure.style.textAlign = "center";
    }
    handleInput();
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;

    const text = linkText.trim() || linkUrl.trim();
    const linkHtml = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 600; text-decoration: underline;">${text}</a>`;
    insertHtmlAtSelection(linkHtml);
    setLinkUrl("");
    setLinkText("");
    setLinkDialogOpen(false);
  };

  const deleteSelectedImage = () => {
    if (!selectedImageEl) return;
    const parentFigure = selectedImageEl.closest("figure");
    if (parentFigure) {
      parentFigure.remove();
    } else {
      selectedImageEl.remove();
    }
    setSelectedImageEl(null);
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
          <span>Aviso</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={() => {
            saveSelection();
            setLinkDialogOpen(true);
          }}
        >
          <LinkIcon className="size-4" />
          <span>Enlace</span>
        </Button>

        {/* Traditional Image Upload & Insert Button */}
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={() => {
            saveSelection();
            setImageDialogOpen(true);
          }}
          title="Subir o insertar imagen (Sistema clásico)"
        >
          <ImageIcon className="size-4 text-primary" />
          <span>Imagen</span>
        </Button>

        <div className="h-5 w-px bg-border/80 mx-1" />

        {/* Next Article Navigation Button */}
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background bg-primary/5"
          onClick={() => {
            saveSelection();
            setButtonDesignerMode("next_article");
            setButtonDesignerOpen(true);
          }}
          title="Crear botón para ir al siguiente artículo"
        >
          <ArrowRight className="size-4 text-primary" />
          <span>Siguiente Artículo</span>
        </Button>

        {/* Custom Interactive Button / CTA */}
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={() => {
            saveSelection();
            setButtonDesignerMode("custom_link");
            setButtonDesignerOpen(true);
          }}
          title="Insertar botón interactivo decorado en el artículo"
        >
          <Sparkles className="size-4 text-primary" />
          <span>Botón / CTA</span>
        </Button>

        {/* Video Embed */}
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={() => {
            saveSelection();
            setVideoDialogOpen(true);
          }}
          title="Insertar video interactivo (YouTube o MP4)"
        >
          <Video className="size-4 text-primary" />
          <span>Video</span>
        </Button>
      </div>

      {/* Quick Image Action Bar (Visible when an image is selected) */}
      {selectedImageEl && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-primary font-bold flex items-center gap-1 mr-1">
              <Sparkles className="size-3.5" />
              <span>Imagen seleccionada:</span>
            </span>

            <span className="text-muted-foreground mr-0.5">Tamaño:</span>
            <button
              type="button"
              onClick={() => updateSelectedImageWidth(25)}
              className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted font-medium"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => updateSelectedImageWidth(50)}
              className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted font-medium"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => updateSelectedImageWidth(75)}
              className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted font-medium"
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => updateSelectedImageWidth(100)}
              className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted font-medium"
            >
              100%
            </button>

            <div className="h-4 w-px bg-border/80 mx-1" />

            <span className="text-muted-foreground mr-0.5">Alinear:</span>
            <button
              type="button"
              onClick={() => updateSelectedImageAlign("left")}
              className="rounded-md border border-border bg-background p-1 hover:bg-muted text-foreground"
              title="Alinear a la izquierda"
            >
              <AlignLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateSelectedImageAlign("center")}
              className="rounded-md border border-border bg-background p-1 hover:bg-muted text-foreground"
              title="Centrar"
            >
              <AlignCenter className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateSelectedImageAlign("right")}
              className="rounded-md border border-border bg-background p-1 hover:bg-muted text-foreground"
              title="Alinear a la derecha"
            >
              <AlignRight className="size-3.5" />
            </button>

            <div className="h-4 w-px bg-border/80 mx-1" />

            <button
              type="button"
              onClick={() => updateSelectedImageRotation(90)}
              className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted"
              title="Rotar imagen 90°"
            >
              <RotateCw className="size-3.5" />
              <span>+90°</span>
            </button>

            <div className="h-4 w-px bg-border/80 mx-1" />

            {/* Move Up / Down in Text */}
            <button
              type="button"
              onClick={() => moveSelectedImageInText("up")}
              className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted font-medium"
              title="Mover imagen antes del párrafo anterior"
            >
              <ChevronUp className="size-3.5" />
              <span>Subir</span>
            </button>
            <button
              type="button"
              onClick={() => moveSelectedImageInText("down")}
              className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted font-medium"
              title="Mover imagen después del párrafo siguiente"
            >
              <ChevronDown className="size-3.5" />
              <span>Bajar</span>
            </button>

            <div className="h-4 w-px bg-border/80 mx-1" />

            {/* Link to Article or URL */}
            <button
              type="button"
              onClick={() => setImageLinkDialogOpen(true)}
              className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] hover:bg-primary/20 font-bold text-primary"
              title="Hacer que la imagen sea interactiva con un enlace"
            >
              <LinkIcon className="size-3.5" />
              <span>{selectedImageEl.closest("a") ? "Cambiar Enlace" : "Poner Enlace"}</span>
            </button>

            {/* Classic Adjuster Modal as an extra backup */}
            <button
              type="button"
              onClick={() => setIsAdjusterOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-0.5 text-muted-foreground hover:bg-muted font-medium text-[11px]"
              title="Abrir ajustador clásico en ventana flotante (Sistema anterior)"
            >
              <Crop className="size-3.5" />
              <span>Ajustador Clásico</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={deleteSelectedImage}
              className="flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-destructive hover:bg-destructive/20 text-[11px] font-medium"
              title="Eliminar imagen"
            >
              <Trash2 className="size-3.5" />
              <span>Eliminar</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedImageEl(null)}
              className="rounded-md p-1 hover:bg-muted text-muted-foreground"
              title="Cerrar barra"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Visual Canvas Container with In-Place Canva Direct Overlay */}
      <div
        ref={editorContainerRef}
        className="relative min-h-[280px] max-h-[550px] overflow-y-auto overflow-x-hidden"
      >
        {/* Main ContentEditable Canvas with Paste & Drop Support */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`article-rendered-content min-h-[280px] p-4 sm:p-5 text-base leading-relaxed text-foreground outline-hidden transition-colors ${
            isDraggingOver ? "bg-primary/5 ring-2 ring-inset ring-primary/40" : ""
          } [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:my-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-2 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2`}
          data-placeholder={placeholder}
        />

        {/* Drag & Drop Overlay Badge */}
        {isDraggingOver && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-2xl bg-background px-4 py-2 text-sm font-bold text-primary shadow-lg border border-primary/30">
              <Upload className="size-5 animate-bounce" />
              <span>Suelta aquí la imagen para insertarla en el artículo</span>
            </div>
          </div>
        )}

        {/* Canva Direct Editing Overlay (Renders directly over the selected image) */}
        {selectedImageEl && editorContainerRef.current && (
          <CanvaDirectOverlay
            targetElement={selectedImageEl}
            containerElement={editorContainerRef.current}
            imageUrl={selectedImageEl.dataset.originalSrc || selectedImageEl.src}
            onUpdate={(newState) => {
              applyCanvaStateToImgElement(selectedImageEl, newState);
              handleInput();
            }}
            onDuplicate={() => {
              const clone = selectedImageEl.cloneNode(true) as HTMLImageElement;
              selectedImageEl.parentNode?.insertBefore(clone, selectedImageEl.nextSibling);
              setSelectedImageEl(clone);
              handleInput();
            }}
            onDelete={() => {
              deleteSelectedImage();
            }}
            onDeselect={() => {
              setSelectedImageEl(null);
            }}
            onBringForward={() => {
              const currentZ = parseInt(selectedImageEl.style.zIndex || "1", 10);
              selectedImageEl.style.zIndex = String(currentZ + 1);
              selectedImageEl.style.position = selectedImageEl.style.position || "relative";
              handleInput();
            }}
            onSendBackward={() => {
              const currentZ = parseInt(selectedImageEl.style.zIndex || "1", 10);
              selectedImageEl.style.zIndex = String(Math.max(1, currentZ - 1));
              selectedImageEl.style.position = selectedImageEl.style.position || "relative";
              handleInput();
            }}
            onMoveUp={() => moveSelectedImageInText("up")}
            onMoveDown={() => moveSelectedImageInText("down")}
            onAlign={(align) => updateSelectedImageAlign(align)}
            onOpenLink={() => setImageLinkDialogOpen(true)}
          />
        )}
      </div>

      {/* Classic Image Upload & Insert Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="size-5 text-primary" />
              <span>Subir o Insertar Imagen (Sistema Tradicional)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Option 1: Upload from computer/phone */}
            <div className="space-y-2 rounded-2xl border border-border p-3.5 bg-muted/20">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                Opción 1: Subir foto desde el dispositivo
              </span>
              <input
                ref={dialogFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDialogFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => dialogFileInputRef.current?.click()}
                className="w-full min-h-11 rounded-xl font-bold gap-2 border-primary/30 text-primary hover:bg-primary/10"
                disabled={isUploadingDialogFile}
              >
                <Upload className="size-4" />
                <span>
                  {isUploadingDialogFile
                    ? "Optimizando imagen..."
                    : "Seleccionar archivo de imagen"}
                </span>
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Admite JPG, PNG, WEBP, GIF. O simplemente copia cualquier foto y pégala con{" "}
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground font-semibold border border-border">
                  Ctrl+V
                </kbd>{" "}
                en el artículo.
              </p>
            </div>

            {/* Option 2: Image URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Opción 2: O escribe la dirección Web (URL de imagen)
              </label>
              <Input
                placeholder="https://ejemplo.com/foto.jpg o pega un enlace de imagen..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="min-h-11 rounded-xl text-xs"
              />
            </div>

            {/* Image Preview if provided */}
            {imageUrl && (
              <div className="space-y-1 rounded-xl border border-border bg-card p-2 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Vista Previa
                </span>
                <div className="max-h-48 overflow-hidden rounded-lg bg-black/5 flex items-center justify-center p-1">
                  <img
                    src={imageUrl}
                    alt="Previsualización"
                    className="max-h-44 object-contain rounded"
                  />
                </div>
              </div>
            )}

            {/* Optional Caption */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Pie de foto o descripción (Opcional)
              </label>
              <Input
                placeholder="Ejemplo: Participantes del taller escolar 2026"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="min-h-11 rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={() => setImageDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="min-h-11 rounded-xl font-bold bg-primary text-primary-foreground"
              onClick={handleInsertImage}
              disabled={!imageUrl.trim()}
            >
              Insertar en el Artículo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Classic Image Adjuster Modal (Extra fallback if requested) */}
      {isAdjusterOpen && selectedImageEl && (
        <ImageAdjuster
          isOpen={isAdjusterOpen}
          onClose={() => setIsAdjusterOpen(false)}
          imageUrl={selectedImageEl.dataset.originalSrc || selectedImageEl.src}
          onSave={(newVal) => {
            selectedImageEl.src = newVal;
            selectedImageEl.dataset.originalSrc = newVal;
            handleInput();
            setIsAdjusterOpen(false);
          }}
          title="Ajustar imagen (Sistema clásico)"
          defaultAspectRatio="original"
          saveLabel="Guardar Cambios en Artículo"
        />
      )}

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

      {/* Interactive Button Designer Dialog */}
      <ArticleButtonDesignerDialog
        open={buttonDesignerOpen}
        onOpenChange={setButtonDesignerOpen}
        onInsert={handleInsertButton}
        defaultMode={buttonDesignerMode}
      />

      {/* Interactive Video Embed Dialog */}
      <ArticleVideoDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        onInsert={handleInsertVideo}
      />

      {/* Image Link Dialog (Clickable Images) */}
      <ImageLinkDialog
        open={imageLinkDialogOpen}
        onOpenChange={setImageLinkDialogOpen}
        targetImageEl={selectedImageEl}
        onApplyLink={handleApplyImageLink}
        onRemoveLink={handleRemoveImageLink}
      />
    </div>
  );
}
