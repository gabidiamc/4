import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  RefreshCw,
  Check,
  X,
  Sliders,
  Crop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ImageAdjusterProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (adjustedDataUrl: string) => void;
  title?: string;
}

export function ImageAdjuster({
  isOpen,
  onClose,
  imageUrl,
  onSave,
  title = "Ajustar Imagen (Mover, Escalar y Rotar)",
}: ImageAdjusterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Transformation states
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees
  const [position, setPosition] = useState({ x: 0, y: 0 }); // offset in px

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Loaded image ref
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset when new image is opened
  useEffect(() => {
    if (isOpen && imageUrl) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imgRef.current = img;
        setImageLoaded(true);
      };
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl]);

  // Redraw canvas whenever transforms change
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const containerWidth = canvas.width;
    const containerHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Save state
    ctx.save();

    // Center origin
    ctx.translate(containerWidth / 2 + position.x, containerHeight / 2 + position.y);

    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);

    // Scale
    ctx.scale(scale, scale);

    // Draw image centered
    const imgAspect = img.width / img.height;
    let drawWidth = containerWidth;
    let drawHeight = containerWidth / imgAspect;

    if (drawHeight > containerHeight) {
      drawHeight = containerHeight;
      drawWidth = containerHeight * imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();
  }, [imageLoaded, position, rotation, scale]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer / Mouse events for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setScale((prev) => Math.min(Math.max(0.2, prev + delta), 4));
  };

  // Quick rotation buttons
  const rotateBy = (deg: number) => {
    setRotation((prev) => (prev + deg + 360) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Save the adjusted image by exporting canvas
  const handleSave = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // Create high-res export canvas
    const exportCanvas = document.createElement("canvas");
    const exportWidth = Math.max(img.width, 1200);
    const exportHeight = Math.max(img.height, Math.round(1200 / (img.width / img.height)));

    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Background fill (soft neutral/transparent)
    ctx.clearRect(0, 0, exportWidth, exportHeight);

    ctx.save();
    // Scale position offset proportionally to high-res canvas
    const scaleFactorX = exportWidth / canvas.width;
    const scaleFactorY = exportHeight / canvas.height;

    ctx.translate(
      exportWidth / 2 + position.x * scaleFactorX,
      exportHeight / 2 + position.y * scaleFactorY,
    );
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    const imgAspect = img.width / img.height;
    let drawWidth = exportWidth;
    let drawHeight = exportWidth / imgAspect;

    if (drawHeight > exportHeight) {
      drawHeight = exportHeight;
      drawWidth = exportHeight * imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    try {
      const dataUrl = exportCanvas.toDataURL("image/png", 0.95);
      onSave(dataUrl);
      onClose();
    } catch {
      // Fallback to canvas
      const fallbackUrl = canvas.toDataURL("image/png");
      onSave(fallbackUrl);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-4 border-b border-border/80 bg-muted/30">
          <DialogTitle className="text-base font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Crop className="size-4 text-primary" />
              {title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="size-3.5" />
              Restablecer
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Interactive Canvas Stage */}
          <div
            ref={containerRef}
            className="relative w-full h-72 sm:h-80 bg-slate-950/90 rounded-xl overflow-hidden border border-border flex items-center justify-center cursor-grab active:cursor-grabbing select-none shadow-inner"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Visual Guide Hint */}
            <div className="absolute top-2 left-2 z-20 pointer-events-none bg-black/60 text-white text-[11px] font-medium px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5">
              <Move className="size-3 text-primary animate-pulse" />
              <span>Arrastra para mover libremente · Rueda para zoom</span>
            </div>

            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>

          {/* Transformation Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Zoom / Scale */}
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1 text-foreground">
                  <ZoomIn className="size-3.5 text-primary" />
                  Tamaño / Escala
                </span>
                <span className="text-muted-foreground font-mono">{Math.round(scale * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScale((prev) => Math.max(0.2, prev - 0.1))}
                  className="size-7 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted text-xs font-bold"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.2"
                  max="3"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setScale((prev) => Math.min(3, prev + 0.1))}
                  className="size-7 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1 text-foreground">
                  <RotateCw className="size-3.5 text-primary" />
                  Rotación Libre
                </span>
                <span className="text-muted-foreground font-mono">{Math.round(rotation)}°</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => rotateBy(-90)}
                  className="h-7 px-2 rounded-lg border border-border bg-card flex items-center gap-1 hover:bg-muted text-[11px] font-bold"
                  title="Girar 90° a la izquierda"
                >
                  <RotateCcw className="size-3" />
                  -90°
                </button>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                  className="flex-1 accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => rotateBy(90)}
                  className="h-7 px-2 rounded-lg border border-border bg-card flex items-center gap-1 hover:bg-muted text-[11px] font-bold"
                  title="Girar 90° a la derecha"
                >
                  <RotateCw className="size-3" />
                  +90°
                </button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex flex-row items-center justify-between gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">
            <X className="size-3.5 mr-1" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow gap-1.5"
          >
            <Check className="size-4" />
            Aplicar Cambios a la Imagen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
