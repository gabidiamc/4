import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Square,
  Circle,
  Star,
  Heart,
  Hexagon,
  Crop,
  RotateCw,
  Trash2,
  Copy,
  Layers,
  Lock,
  Unlock,
  Undo2,
  Redo2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ZoomIn,
  ZoomOut,
  Sliders,
  Upload,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
} from "lucide-react";

export type CanvaShapeType =
  "rect" | "square" | "rounded" | "circle" | "oval" | "star" | "heart" | "hexagon" | "diamond";

export interface CanvaImageState {
  width: number;
  height: number;
  rotation: number;
  shape: CanvaShapeType;
  cropZoom: number; // 1.0 to 4.0
  cropPanX: number; // in pixels
  cropPanY: number; // in pixels
  isLocked?: boolean;
  align?: "left" | "center" | "right" | "float-left" | "float-right";
  zIndex?: number;
}

export const CANVA_SHAPES: {
  id: CanvaShapeType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  clipPath: string;
  borderRadius?: string;
  aspectRatio?: string;
}[] = [
  {
    id: "rect",
    label: "Rectángulo",
    icon: Square,
    clipPath: "none",
  },
  {
    id: "square",
    label: "Cuadrado (1:1)",
    icon: Square,
    clipPath: "none",
    aspectRatio: "1 / 1",
  },
  {
    id: "rounded",
    label: "Redondeado",
    icon: Square,
    clipPath: "none",
    borderRadius: "1.5rem",
  },
  {
    id: "circle",
    label: "Círculo",
    icon: Circle,
    clipPath: "circle(50% at 50% 50%)",
    aspectRatio: "1 / 1",
  },
  {
    id: "oval",
    label: "Óvalo",
    icon: Circle,
    clipPath: "ellipse(50% 40% at 50% 50%)",
  },
  {
    id: "star",
    label: "Estrella",
    icon: Star,
    clipPath:
      "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
    aspectRatio: "1 / 1",
  },
  {
    id: "heart",
    label: "Corazón",
    icon: Heart,
    clipPath: "url(#canva-mask-heart)",
    aspectRatio: "1 / 1",
  },
  {
    id: "hexagon",
    label: "Hexágono",
    icon: Hexagon,
    clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    aspectRatio: "1 / 1",
  },
  {
    id: "diamond",
    label: "Diamante",
    icon: Square,
    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    aspectRatio: "1 / 1",
  },
];

/**
 * Global SVG Definitions for objectBoundingBox clip paths (e.g. Heart)
 */
export function CanvaSvgMaskDefs() {
  return (
    <svg
      width="0"
      height="0"
      className="absolute pointer-events-none opacity-0 overflow-hidden"
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0 }}
    >
      <defs>
        <clipPath id="canva-mask-heart" clipPathUnits="objectBoundingBox">
          <path d="M 0.5, 0.84 C 0.12, 0.56, 0, 0.40, 0, 0.25 C 0, 0.11, 0.11, 0, 0.26, 0 C 0.36, 0, 0.45, 0.06, 0.5, 0.15 C 0.55, 0.06, 0.64, 0, 0.74, 0 C 0.89, 0, 1, 0.11, 1, 0.25 C 1, 0.40, 0.88, 0.56, 0.5, 0.84 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

/**
 * Apply live Canva transformation & mask styles to an HTMLImageElement
 */
export function applyCanvaStateToImgElement(img: HTMLImageElement, state: CanvaImageState) {
  // Retain original full source if not already saved
  if (!img.dataset.originalSrc) {
    img.dataset.originalSrc = img.src;
  }

  // Size
  img.style.width = `${state.width}px`;
  img.style.height = `${state.height}px`;
  img.style.maxWidth = "100%";
  img.style.objectFit = "cover";

  // Rotation
  img.style.transform = state.rotation ? `rotate(${state.rotation}deg)` : "none";
  img.style.transformOrigin = "center center";

  // Alignment
  if (state.align === "left") {
    img.style.marginLeft = "0";
    img.style.marginRight = "auto";
    img.style.float = "none";
    img.style.display = "block";
  } else if (state.align === "right") {
    img.style.marginLeft = "auto";
    img.style.marginRight = "0";
    img.style.float = "none";
    img.style.display = "block";
  } else if (state.align === "float-left") {
    img.style.float = "left";
    img.style.marginRight = "1.25rem";
    img.style.marginBottom = "1rem";
    img.style.marginLeft = "0";
    img.style.display = "inline-block";
  } else if (state.align === "float-right") {
    img.style.float = "right";
    img.style.marginLeft = "1.25rem";
    img.style.marginBottom = "1rem";
    img.style.marginRight = "0";
    img.style.display = "inline-block";
  } else {
    // Centered by default
    img.style.marginLeft = "auto";
    img.style.marginRight = "auto";
    img.style.float = "none";
    img.style.display = "block";
  }

  // Shape mask
  const shapeDef = CANVA_SHAPES.find((s) => s.id === state.shape);
  if (shapeDef) {
    if (state.shape === "rounded") {
      img.style.borderRadius = "1.5rem";
      img.style.clipPath = "none";
      img.style.setProperty("-webkit-clip-path", "none");
    } else if (state.shape === "rect") {
      img.style.borderRadius = "0.5rem";
      img.style.clipPath = "none";
      img.style.setProperty("-webkit-clip-path", "none");
    } else {
      img.style.borderRadius = "0px";
      img.style.clipPath = shapeDef.clipPath;
      img.style.setProperty("-webkit-clip-path", shapeDef.clipPath);
    }

    if (shapeDef.aspectRatio) {
      img.style.aspectRatio = shapeDef.aspectRatio;
    } else {
      img.style.aspectRatio = "";
    }
  }

  // Internal Crop Pan & Zoom inside the mask (via object-position)
  if (state.cropPanX !== 0 || state.cropPanY !== 0) {
    img.style.objectPosition = `calc(50% + ${state.cropPanX}px) calc(50% + ${state.cropPanY}px)`;
  } else {
    img.style.objectPosition = "center center";
  }

  // Z-Index
  if (state.zIndex) {
    img.style.zIndex = String(state.zIndex);
    img.style.position = img.style.position || "relative";
  }

  // Dataset attributes for lossless full state restoration
  img.dataset.shape = state.shape;
  img.dataset.rotation = String(state.rotation || 0);
  img.dataset.cropZoom = String(state.cropZoom || 1.0);
  img.dataset.cropPanX = String(state.cropPanX || 0);
  img.dataset.cropPanY = String(state.cropPanY || 0);
  img.dataset.locked = state.isLocked ? "true" : "false";
  img.dataset.align = state.align || "center";
}

/**
 * Extract Canva state from an existing HTMLImageElement
 */
export function extractCanvaStateFromImgElement(img: HTMLImageElement): CanvaImageState {
  const width = img.offsetWidth || parseInt(img.style.width, 10) || 400;
  const height = img.offsetHeight || parseInt(img.style.height, 10) || 300;

  const transform = img.style.transform || "";
  const rotMatch = transform.match(/rotate\((-?\d+)deg\)/);
  const rotation = parseInt(img.dataset.rotation || (rotMatch ? rotMatch[1] : "0"), 10) || 0;

  const shape = (img.dataset.shape as CanvaShapeType) || "rect";
  const cropZoom = parseFloat(img.dataset.cropZoom || "1.0") || 1.0;
  const cropPanX = parseFloat(img.dataset.cropPanX || "0") || 0;
  const cropPanY = parseFloat(img.dataset.cropPanY || "0") || 0;
  const isLocked = img.dataset.locked === "true";
  const align = (img.dataset.align as CanvaImageState["align"]) || "center";
  const zIndex = parseInt(img.style.zIndex || "1", 10) || 1;

  return {
    width,
    height,
    rotation,
    shape,
    cropZoom,
    cropPanX,
    cropPanY,
    isLocked,
    align,
    zIndex,
  };
}

/**
 * Helper to render masked Canva state to high-resolution dataURL
 */
export async function renderCanvaImageToDataUrl(
  imageSrc: string,
  state: CanvaImageState,
  maxWidth = 1600,
  maxHeight = 1600,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        let targetW = Math.max(60, state.width || img.width);
        let targetH = Math.max(60, state.height || img.height);

        if (
          state.shape === "square" ||
          state.shape === "circle" ||
          state.shape === "star" ||
          state.shape === "heart" ||
          state.shape === "hexagon" ||
          state.shape === "diamond"
        ) {
          const s = Math.min(targetW, targetH);
          targetW = s;
          targetH = s;
        }

        // Scale to max dimensions
        if (targetW > maxWidth || targetH > maxHeight) {
          const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Apply clip path for mask
        ctx.save();
        const w = targetW;
        const h = targetH;

        if (state.shape === "rounded") {
          const r = Math.min(24, Math.min(w, h) / 4);
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(0, 0, w, h, r);
          } else {
            ctx.rect(0, 0, w, h);
          }
          ctx.clip();
        } else if (state.shape === "circle") {
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
          ctx.clip();
        } else if (state.shape === "oval") {
          ctx.beginPath();
          ctx.ellipse(w / 2, h / 2, w / 2, h * 0.4, 0, 0, Math.PI * 2);
          ctx.clip();
        } else if (state.shape === "star") {
          const pts = [
            [0.5, 0.0],
            [0.61, 0.35],
            [0.98, 0.35],
            [0.68, 0.57],
            [0.79, 0.91],
            [0.5, 0.7],
            [0.21, 0.91],
            [0.32, 0.57],
            [0.02, 0.35],
            [0.39, 0.35],
          ];
          ctx.beginPath();
          pts.forEach(([px, py], i) => {
            if (i === 0) ctx.moveTo(px * w, py * h);
            else ctx.lineTo(px * w, py * h);
          });
          ctx.closePath();
          ctx.clip();
        } else if (state.shape === "heart") {
          ctx.beginPath();
          ctx.moveTo(w * 0.5, h * 0.84);
          ctx.bezierCurveTo(w * 0.12, h * 0.56, 0, h * 0.4, 0, h * 0.25);
          ctx.bezierCurveTo(0, h * 0.11, w * 0.11, 0, w * 0.26, 0);
          ctx.bezierCurveTo(w * 0.36, 0, w * 0.45, h * 0.06, w * 0.5, h * 0.15);
          ctx.bezierCurveTo(w * 0.55, h * 0.06, w * 0.64, 0, w * 0.74, 0);
          ctx.bezierCurveTo(w * 0.89, 0, w, h * 0.11, w, h * 0.25);
          ctx.bezierCurveTo(w, h * 0.4, w * 0.88, h * 0.56, w * 0.5, h * 0.84);
          ctx.closePath();
          ctx.clip();
        } else if (state.shape === "hexagon") {
          const pts = [
            [0.25, 0],
            [0.75, 0],
            [1.0, 0.5],
            [0.75, 1.0],
            [0.25, 1.0],
            [0.0, 0.5],
          ];
          ctx.beginPath();
          pts.forEach(([px, py], i) => {
            if (i === 0) ctx.moveTo(px * w, py * h);
            else ctx.lineTo(px * w, py * h);
          });
          ctx.closePath();
          ctx.clip();
        } else if (state.shape === "diamond") {
          ctx.beginPath();
          ctx.moveTo(w * 0.5, 0);
          ctx.lineTo(w, h * 0.5);
          ctx.lineTo(w * 0.5, h);
          ctx.lineTo(0, h * 0.5);
          ctx.closePath();
          ctx.clip();
        }

        // Calculate cover sizing + crop zoom & pan
        const baseScale = Math.max(w / img.width, h / img.height);
        const finalScale = baseScale * (state.cropZoom || 1);
        const drawW = img.width * finalScale;
        const drawH = img.height * finalScale;
        const drawX = (w - drawW) / 2 + (state.cropPanX || 0);
        const drawY = (h - drawH) / 2 + (state.cropPanY || 0);

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();

        const mime = state.shape === "rect" ? "image/jpeg" : "image/png";
        const result = canvas.toDataURL(mime, 0.92);
        resolve(result);
      } catch (err) {
        console.error("Canvas export error:", err);
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

/**
 * Direct In-Place Canva Overlay Component
 * Renders directly on top of the selected image element inside any container!
 */
export interface CanvaDirectOverlayProps {
  targetElement: HTMLElement;
  containerElement: HTMLElement;
  imageUrl: string;
  initialState?: Partial<CanvaImageState>;
  onUpdate: (newState: CanvaImageState) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onDeselect: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAlign?: (align: "left" | "center" | "right" | "float-left" | "float-right") => void;
  onOpenLink?: () => void;
}

export function CanvaDirectOverlay({
  targetElement,
  containerElement,
  imageUrl,
  initialState,
  onUpdate,
  onDuplicate,
  onDelete,
  onDeselect,
  onBringForward,
  onSendBackward,
  onMoveUp,
  onMoveDown,
  onAlign,
  onOpenLink,
}: CanvaDirectOverlayProps) {
  // Current Transform State
  const [state, setState] = useState<CanvaImageState>(() => ({
    width: targetElement.offsetWidth || 300,
    height: targetElement.offsetHeight || 200,
    rotation: parseInt(targetElement.dataset.rotation || "0", 10) || 0,
    shape: (targetElement.dataset.shape as CanvaShapeType) || "rect",
    cropZoom: parseFloat(targetElement.dataset.cropZoom || "1.0") || 1.0,
    cropPanX: parseFloat(targetElement.dataset.cropPanX || "0") || 0,
    cropPanY: parseFloat(targetElement.dataset.cropPanY || "0") || 0,
    isLocked: targetElement.dataset.locked === "true",
    align: (targetElement.dataset.align as CanvaImageState["align"]) || "center",
    zIndex: parseInt(targetElement.style.zIndex || "1", 10) || 1,
    ...initialState,
  }));

  // History stack for Undo / Redo
  const [history, setHistory] = useState<CanvaImageState[]>([state]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Edit Modes
  const [isCropMode, setIsCropMode] = useState(false);
  const [activeRotationTooltip, setActiveRotationTooltip] = useState<number | null>(null);

  // Smart Snap Guides
  const [snapGuideX, setSnapGuideX] = useState<number | null>(null);

  // Touch / Gesture Refs for Mobile
  const touchDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  const lastTapTimeRef = useRef<number>(0);

  // Pointer Drag Ref
  const dragRef = useRef<{
    type: "move" | "rotate" | "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w" | "panCrop";
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startLeft: number;
    startTop: number;
    startRotation: number;
    centerX: number;
    centerY: number;
    startCropPanX: number;
    startCropPanY: number;
    lastDx?: number;
    lastDy?: number;
  } | null>(null);

  // Live apply state to image element
  const applyLive = useCallback(
    (next: CanvaImageState) => {
      setState(next);
      if (targetElement && targetElement.tagName === "IMG") {
        applyCanvaStateToImgElement(targetElement as HTMLImageElement, next);
      }
      onUpdate(next);
    },
    [targetElement, onUpdate],
  );

  // Push history on state commit
  const commitState = useCallback(
    (newState: CanvaImageState) => {
      applyLive(newState);
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newState];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [applyLive, historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      applyLive(prev);
    }
  }, [applyLive, historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      applyLive(next);
    }
  }, [applyLive, historyIndex, history]);

  // Keyboard Shortcuts: Delete, Esc, Ctrl+Z, Ctrl+Y, Ctrl+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (!state.isLocked && onDelete) {
          e.preventDefault();
          onDelete();
        }
      } else if (e.key === "Escape") {
        if (isCropMode) {
          setIsCropMode(false);
        } else {
          onDeselect();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (onDuplicate) onDuplicate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, isCropMode, onDelete, onDeselect, onDuplicate, redo, undo]);

  // Click Outside to Deselect
  useEffect(() => {
    const handleOutsidePointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        targetElement.contains(target) ||
        target.closest(".canva-direct-overlay-ui") ||
        target.closest(".canva-direct-toolbar") ||
        target.closest(".canva-direct-image-field") ||
        target.closest("[role='dialog']") ||
        target.closest(".quick-image-actions") ||
        target.closest(".article-quick-bar") ||
        (containerElement && containerElement.contains(target)) ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("select") ||
        target.closest("textarea")
      ) {
        return;
      }
      if (isCropMode) {
        setIsCropMode(false);
      } else {
        onDeselect();
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener("pointerdown", handleOutsidePointer);
    }, 60);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", handleOutsidePointer);
    };
  }, [targetElement, containerElement, isCropMode, onDeselect]);

  // Track Target Element Position relative to Container
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const updateRect = useCallback(() => {
    if (!targetElement || !containerElement) return;
    const tRect = targetElement.getBoundingClientRect();
    const cRect = containerElement.getBoundingClientRect();
    setRect({
      left: tRect.left - cRect.left + containerElement.scrollLeft,
      top: tRect.top - cRect.top + containerElement.scrollTop,
      width: tRect.width,
      height: tRect.height,
    });
  }, [targetElement, containerElement]);

  useEffect(() => {
    updateRect();
    const interval = setInterval(updateRect, 100);
    window.addEventListener("resize", updateRect);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateRect);
    };
  }, [updateRect]);

  // Pointer Down Handler for Handles / Drag
  const handlePointerDown = (
    e: React.PointerEvent,
    type: "move" | "rotate" | "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w" | "panCrop",
  ) => {
    if (state.isLocked && type !== "move") return;
    if (state.isLocked && type === "move") return;

    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const tRect = targetElement.getBoundingClientRect();
    const centerX = tRect.left + tRect.width / 2;
    const centerY = tRect.top + tRect.height / 2;

    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: state.width,
      startHeight: state.height,
      startLeft: rect.left,
      startTop: rect.top,
      startRotation: state.rotation,
      centerX,
      centerY,
      startCropPanX: state.cropPanX,
      startCropPanY: state.cropPanY,
    };
  };

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const {
      type,
      startX,
      startY,
      startWidth,
      startHeight,
      centerX,
      centerY,
      startCropPanX,
      startCropPanY,
    } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    dragRef.current.lastDx = dx;
    dragRef.current.lastDy = dy;

    if (type === "rotate") {
      const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      let deg = Math.round((rad * 180) / Math.PI) + 90;
      if (deg < 0) deg += 360;
      if (deg >= 360) deg -= 360;

      // Magnetic Snap to 0, 45, 90, 135, 180, 225, 270, 315
      const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
      for (const s of snapAngles) {
        if (Math.abs(deg - s) <= 4) {
          deg = s === 360 ? 0 : s;
          break;
        }
      }

      setActiveRotationTooltip(deg);
      applyLive({ ...state, rotation: deg });
      return;
    }

    if (type === "panCrop") {
      const next = {
        ...state,
        cropPanX: startCropPanX + dx,
        cropPanY: startCropPanY + dy,
      };
      applyLive(next);
      return;
    }

    if (type === "move") {
      // Smart Center Guide Check
      const cRect = containerElement.getBoundingClientRect();
      const editorCenterX = cRect.width / 2;
      const currentCenterX = rect.left + rect.width / 2 + dx;

      if (Math.abs(currentCenterX - editorCenterX) <= 8) {
        setSnapGuideX(editorCenterX);
      } else {
        setSnapGuideX(null);
      }

      // Live position shift
      targetElement.style.position = "relative";
      targetElement.style.left = `${dx}px`;
      targetElement.style.top = `${dy}px`;
      return;
    }

    // Resizing with Proportional Handling on Corners
    let newW = startWidth;
    let newH = startHeight;
    const isProportional =
      type === "nw" ||
      type === "ne" ||
      type === "se" ||
      type === "sw" ||
      state.shape === "square" ||
      state.shape === "circle" ||
      state.shape === "star" ||
      state.shape === "heart" ||
      state.shape === "hexagon" ||
      state.shape === "diamond";

    const aspectRatio = startWidth / (startHeight || 1);

    if (type === "se") {
      newW = Math.max(60, startWidth + dx);
      newH = isProportional ? newW / aspectRatio : Math.max(60, startHeight + dy);
    } else if (type === "sw") {
      newW = Math.max(60, startWidth - dx);
      newH = isProportional ? newW / aspectRatio : Math.max(60, startHeight + dy);
    } else if (type === "ne") {
      newW = Math.max(60, startWidth + dx);
      newH = isProportional ? newW / aspectRatio : Math.max(60, startHeight - dy);
    } else if (type === "nw") {
      newW = Math.max(60, startWidth - dx);
      newH = isProportional ? newW / aspectRatio : Math.max(60, startHeight - dy);
    } else if (type === "e") {
      newW = Math.max(60, startWidth + dx);
    } else if (type === "w") {
      newW = Math.max(60, startWidth - dx);
    } else if (type === "s") {
      newH = Math.max(60, startHeight + dy);
    } else if (type === "n") {
      newH = Math.max(60, startHeight - dy);
    }

    const next = { ...state, width: Math.round(newW), height: Math.round(newH) };
    applyLive(next);
  };

  // Pointer Up Handler
  const handlePointerUp = () => {
    if (!dragRef.current) return;
    const { type } = dragRef.current;

    if (type === "move") {
      const lastDx = dragRef.current.lastDx || 0;
      const lastDy = dragRef.current.lastDy || 0;
      targetElement.style.left = "";
      targetElement.style.top = "";

      if (lastDy < -28 && onMoveUp) {
        onMoveUp();
      } else if (lastDy > 28 && onMoveDown) {
        onMoveDown();
      } else if (lastDx < -40 && onAlign) {
        onAlign("float-left");
      } else if (lastDx > 40 && onAlign) {
        onAlign("float-right");
      } else {
        commitState({ ...state });
      }
    } else {
      commitState({ ...state });
    }

    dragRef.current = null;
    setActiveRotationTooltip(null);
    setSnapGuideX(null);
    updateRect();
  };

  // Shape Selection Handler
  const handleSelectShape = (shapeId: CanvaShapeType) => {
    let nextW = state.width;
    let nextH = state.height;

    // Enforce 1:1 ratio for geometric shapes
    if (
      shapeId === "square" ||
      shapeId === "circle" ||
      shapeId === "star" ||
      shapeId === "heart" ||
      shapeId === "hexagon" ||
      shapeId === "diamond"
    ) {
      const minDim = Math.min(nextW, nextH);
      nextW = minDim;
      nextH = minDim;
    }

    const next: CanvaImageState = {
      ...state,
      shape: shapeId,
      width: nextW,
      height: nextH,
    };
    commitState(next);
  };

  // Wheel zoom in Crop Mode
  const handleWheel = (e: React.WheelEvent) => {
    if (!isCropMode) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const newZoom = Math.min(4.0, Math.max(1.0, state.cropZoom + delta));
    const next = { ...state, cropZoom: parseFloat(newZoom.toFixed(2)) };
    applyLive(next);
  };

  // Touch handlers for mobile pinch-to-zoom in Crop Mode
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isCropMode) {
      // Check double tap
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        setIsCropMode(true);
      }
      lastTapTimeRef.current = now;
      return;
    }

    if (e.touches.length === 2) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      touchDistanceRef.current = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      initialZoomRef.current = state.cropZoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isCropMode && e.touches.length === 2 && touchDistanceRef.current) {
      e.preventDefault();
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const factor = dist / touchDistanceRef.current;
      const newZoom = Math.min(4.0, Math.max(1.0, initialZoomRef.current * factor));
      const next = { ...state, cropZoom: parseFloat(newZoom.toFixed(2)) };
      applyLive(next);
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  return (
    <>
      <CanvaSvgMaskDefs />

      {/* Smart Snap Guide Line (Center) */}
      {snapGuideX !== null && (
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-50 border-l-2 border-dashed border-primary"
          style={{ left: `${snapGuideX}px` }}
        >
          <span className="absolute top-2 left-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
            Centro
          </span>
        </div>
      )}

      {/* Canva Bounding Box & Transformation Frame */}
      <div
        className={`canva-direct-overlay-ui absolute z-40 select-none ${
          state.isLocked ? "border-2 border-amber-500/90" : "border-2 border-primary shadow-sm"
        } transition-[border-color]`}
        style={{
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          transform: `rotate(${state.rotation}deg)`,
          transformOrigin: "center center",
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          if (!isCropMode) {
            handlePointerDown(e, "move");
          }
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsCropMode(true);
        }}
      >
        {/* Floating Rotation Indicator Tooltip */}
        {activeRotationTooltip !== null && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2.5 py-1 text-xs font-bold text-background shadow-md">
            {activeRotationTooltip}°
          </div>
        )}

        {/* Lock Indicator Badge */}
        {state.isLocked && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            <Lock className="size-3" />
            <span>Bloqueado</span>
          </div>
        )}

        {/* CROP MODE OVERLAY: Semi-transparent backdrop showing uncropped photo outside mask */}
        {isCropMode && (
          <div
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => handlePointerDown(e, "panCrop")}
            onWheel={handleWheel}
          >
            {/* Ghosted underlying image preview */}
            <div className="absolute -inset-24 pointer-events-none flex items-center justify-center overflow-visible opacity-35 filter grayscale-[20%]">
              <img
                src={imageUrl}
                alt="Encuadre"
                className="max-w-none transition-none"
                style={{
                  width: `${state.width * state.cropZoom}px`,
                  height: `${state.height * state.cropZoom}px`,
                  transform: `translate(${state.cropPanX}px, ${state.cropPanY}px)`,
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Visual Crop Guideline Box */}
            <div className="absolute inset-0 border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              <div className="absolute top-0 left-0 size-3 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-0 right-0 size-3 border-t-2 border-r-2 border-primary" />
              <div className="absolute bottom-0 left-0 size-3 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-0 right-0 size-3 border-b-2 border-r-2 border-primary" />
            </div>

            {/* Crop Mode Quick Controller Bar */}
            <div
              className="canva-direct-toolbar absolute -bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/95 px-3 py-1.5 shadow-xl border border-border backdrop-blur-md"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                <ZoomOut className="size-3.5" />
                <input
                  type="range"
                  min="1"
                  max="3.5"
                  step="0.05"
                  value={state.cropZoom}
                  onChange={(e) => {
                    const next = { ...state, cropZoom: parseFloat(e.target.value) };
                    applyLive(next);
                  }}
                  className="h-1.5 w-20 sm:w-28 cursor-pointer accent-primary"
                />
                <ZoomIn className="size-3.5" />
                <span className="min-w-8 text-right font-mono text-[11px] text-foreground">
                  {Math.round(state.cropZoom * 100)}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCropMode(false)}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:opacity-90"
              >
                <Check className="size-3.5" />
                <span>Listo</span>
              </button>
            </div>
          </div>
        )}

        {/* ROTATION HANDLE (Above Top Edge with connecting stalk) */}
        {!state.isLocked && !isCropMode && (
          <div className="absolute -top-8 left-1/2 flex -translate-x-1/2 flex-col items-center">
            <div
              className="group flex size-6 cursor-grab items-center justify-center rounded-full border-2 border-primary bg-background shadow-md transition-transform hover:scale-110 active:cursor-grabbing"
              title="Arrastra para rotar la imagen libremente"
              onPointerDown={(e) => handlePointerDown(e, "rotate")}
            >
              <RotateCw className="size-3 text-primary group-hover:rotate-45 transition-transform" />
            </div>
            {/* Connecting Hairline */}
            <div className="h-2 w-0.5 bg-primary" />
          </div>
        )}

        {/* 8 RESIZE HANDLES (4 Corners + 4 Sides with 44px touch hit-box) */}
        {!state.isLocked && !isCropMode && (
          <>
            {/* NW Corner */}
            <div
              className="absolute -top-2 -left-2 size-4 cursor-nwse-resize rounded-sm border-2 border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "nw")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* NE Corner */}
            <div
              className="absolute -top-2 -right-2 size-4 cursor-nesw-resize rounded-sm border-2 border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "ne")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* SE Corner */}
            <div
              className="absolute -bottom-2 -right-2 size-4 cursor-nwse-resize rounded-sm border-2 border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "se")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* SW Corner */}
            <div
              className="absolute -bottom-2 -left-2 size-4 cursor-nesw-resize rounded-sm border-2 border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "sw")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* N Side */}
            <div
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-2 w-4 cursor-ns-resize rounded-full border border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "n")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* S Side */}
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2 w-4 cursor-ns-resize rounded-full border border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "s")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* E Side */}
            <div
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-4 w-2 cursor-ew-resize rounded-full border border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "e")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* W Side */}
            <div
              className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-4 w-2 cursor-ew-resize rounded-full border border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "w")}
            >
              <div className="absolute -inset-3" />
            </div>
          </>
        )}
      </div>

      {/* DISCREET FLOATING CANVA TOOLBAR (Docked near the bottom or top of the image) */}
      <div
        className="canva-direct-toolbar absolute z-50 flex max-w-[95vw] flex-wrap items-center gap-1.5 rounded-2xl bg-card/95 p-1.5 shadow-2xl border border-border backdrop-blur-md"
        style={{
          left: `${Math.max(10, rect.left)}px`,
          top: `${rect.top + rect.height + 14}px`,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Shape / Mask Picker Chips */}
        <div className="flex items-center gap-1 overflow-x-auto p-0.5 border-r border-border pr-1.5">
          {CANVA_SHAPES.map((shape) => {
            const Icon = shape.icon;
            const isSelected = state.shape === shape.id;
            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => handleSelectShape(shape.id)}
                title={`Aplicar máscara: ${shape.label}`}
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
              </button>
            );
          })}
        </div>

        {/* Recortar (Crop Mode) */}
        <button
          type="button"
          onClick={() => setIsCropMode(!isCropMode)}
          title="Recortar y reencuadrar dentro de la forma (Doble clic)"
          className={`flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold transition-colors ${
            isCropMode
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-foreground hover:bg-muted"
          }`}
        >
          <Crop className="size-3.5 text-primary" />
          <span className="hidden sm:inline">Recortar</span>
        </button>

        {/* Move Up / Down in Article Text */}
        {(onMoveUp || onMoveDown) && (
          <div className="flex items-center gap-0.5 border-l border-border pl-1.5">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                title="Mover arriba (antes del párrafo anterior)"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronUp className="size-4" />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                title="Mover abajo (después del párrafo siguiente)"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronDown className="size-4" />
              </button>
            )}
          </div>
        )}

        {/* Alignment in Article */}
        {onAlign && (
          <div className="flex items-center gap-0.5 border-l border-border pl-1.5">
            <button
              type="button"
              onClick={() => onAlign("float-left")}
              title="Flotar a la izquierda"
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <AlignLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAlign("center")}
              title="Centrar en el texto"
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <AlignCenter className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAlign("float-right")}
              title="Flotar a la derecha"
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <AlignRight className="size-3.5" />
            </button>
          </div>
        )}

        {/* Image Link (Clickable Image) */}
        {onOpenLink && (
          <button
            type="button"
            onClick={onOpenLink}
            title="Poner o cambiar enlace a la imagen"
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-foreground hover:bg-muted border-l border-border pl-2"
          >
            <LinkIcon className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Enlace</span>
          </button>
        )}

        {/* Bring Forward / Send Backward */}
        {onBringForward && onSendBackward && (
          <div className="flex items-center gap-0.5 border-l border-border pl-1.5">
            <button
              type="button"
              onClick={onBringForward}
              title="Traer al frente"
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowUp className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onSendBackward}
              title="Enviar atrás"
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowDown className="size-3.5" />
            </button>
          </div>
        )}

        {/* Duplicate */}
        {onDuplicate && (
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicar imagen (Ctrl+D)"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </button>
        )}

        {/* Lock / Unlock */}
        <button
          type="button"
          onClick={() => {
            const next = { ...state, isLocked: !state.isLocked };
            commitState(next);
          }}
          title={state.isLocked ? "Desbloquear posición" : "Bloquear posición"}
          className={`flex size-7 items-center justify-center rounded-lg transition-colors ${
            state.isLocked
              ? "bg-amber-500 text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {state.isLocked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-l border-border pl-1.5">
          <button
            type="button"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Deshacer (Ctrl+Z)"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <Undo2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Rehacer (Ctrl+Y)"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <Redo2 className="size-3.5" />
          </button>
        </div>

        {/* Delete Button */}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title="Eliminar imagen (Supr / Backspace)"
            className="flex size-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}

        {/* Deselect / Close Overlay Button */}
        <button
          type="button"
          onClick={onDeselect}
          title="Cerrar edición"
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </>
  );
}

/**
 * CanvaDirectImageField
 * Clean, modern in-place Canva image editor component for form inputs (e.g. article cover, sport, tournament)
 */
export interface CanvaDirectImageFieldProps {
  id?: string;
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  aspectRatio?: string;
}

export function CanvaDirectImageField({ id, label, value, onChange }: CanvaDirectImageFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSelected, setIsSelected] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onChange(dataUrl);
      setIsSelected(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-semibold text-foreground">{label}</label>}

      {value ? (
        <div
          ref={containerRef}
          className="relative min-h-[260px] max-h-[460px] w-full rounded-2xl border border-border bg-muted/20 p-6 flex items-center justify-center overflow-hidden select-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Target Image */}
          <img
            ref={imgRef}
            src={value}
            alt={label || "Imagen"}
            referrerPolicy="no-referrer"
            onClick={() => setIsSelected(true)}
            className={`max-h-[360px] max-w-full cursor-pointer transition-all ${
              isSelected ? "ring-2 ring-primary/40" : "hover:brightness-105"
            }`}
            style={{
              borderRadius: "0.75rem",
              objectFit: "cover",
            }}
          />

          {/* Quick Selection Prompt */}
          {!isSelected && isHovered && (
            <div
              onClick={() => setIsSelected(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] cursor-pointer transition-opacity"
            >
              <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-lg">
                <Sparkles className="size-3.5" />
                <span>Haz clic para editar estilo Canva (tamaño, rotar, formas, recorte)</span>
              </span>
            </div>
          )}

          {/* Canva Direct Overlay when Selected */}
          {isSelected && imgRef.current && containerRef.current && (
            <CanvaDirectOverlay
              targetElement={imgRef.current}
              containerElement={containerRef.current}
              imageUrl={value}
              onUpdate={async (newState) => {
                applyCanvaStateToImgElement(imgRef.current!, newState);
                // Export high-res canvas if cropped/masked
                const baked = await renderCanvaImageToDataUrl(value, newState);
                onChange(baked);
              }}
              onDeselect={() => setIsSelected(false)}
              onDelete={() => {
                onChange(null);
                setIsSelected(false);
              }}
            />
          )}

          {/* Floating Actions on Top Right */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-30">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-xl bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm border border-border hover:bg-muted"
              title="Reemplazar imagen"
            >
              <Upload className="size-3" />
              <span>Cambiar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsSelected(false);
              }}
              className="flex items-center gap-1 rounded-xl bg-destructive/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-destructive"
              title="Quitar imagen"
            >
              <Trash2 className="size-3" />
              <span>Quitar</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Haz clic para subir o arrastra una imagen
            </p>
            <p className="text-xs text-muted-foreground">
              Edición visual directa estilo Canva con máscaras y recorte
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
