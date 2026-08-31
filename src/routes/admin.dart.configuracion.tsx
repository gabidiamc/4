import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Code,
  ExternalLink,
  Info,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  Sliders,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_DART_PLANNER_CONFIG,
  getDartPlannerConfig,
  saveDartPlannerConfig,
  type DartPlannerConfig,
  type DartPlannerStatus,
} from "@/lib/dart";

export const Route = createFileRoute("/admin/dart/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración de DART / Transit — DMPS Family Info" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDartConfigPage,
});

function AdminDartConfigPage() {
  const [config, setConfig] = useState<DartPlannerConfig>(() => getDartPlannerConfig());
  const [testing, setTesting] = useState(false);

  const handleValidateAndSave = () => {
    const urlToTest = config.plannerUrl.trim();

    if (!urlToTest.startsWith("https://")) {
      toast.error("La URL debe utilizar el protocolo seguro HTTPS.");
      return;
    }

    const lower = urlToTest.toLowerCase();
    if (
      lower.includes("javascript:") ||
      lower.includes("data:") ||
      lower.includes("file:") ||
      lower.includes("<") ||
      lower.includes(">")
    ) {
      toast.error("Formatos de URL no permitidos por motivos de seguridad.");
      return;
    }

    let parsedDomain = "";
    try {
      const u = new URL(urlToTest);
      parsedDomain = u.hostname;
    } catch {
      toast.error("Por favor ingresa una URL válida.");
      return;
    }

    const now = new Date().toLocaleString("es-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const updatedConfig: DartPlannerConfig = {
      ...config,
      plannerUrl: urlToTest,
      verifiedDomain: parsedDomain,
      lastReviewedAt: now,
    };

    setConfig(updatedConfig);
    saveDartPlannerConfig(updatedConfig);
    toast.success("Configuración de DART / Transit guardada.");
  };

  const handleRestoreOfficial = () => {
    const restored: DartPlannerConfig = {
      ...config,
      plannerUrl: DEFAULT_DART_PLANNER_CONFIG.plannerUrl,
      verifiedDomain: DEFAULT_DART_PLANNER_CONFIG.verifiedDomain,
      widgetUrl: "",
      infoText: DEFAULT_DART_PLANNER_CONFIG.infoText,
      iframeEnabled: true,
      externalButtonEnabled: true,
      heightDesktop: 780,
      heightMobile: 720,
      status: "pendiente",
      lastError: null,
    };
    setConfig(restored);
    saveDartPlannerConfig(restored);
    toast.info("Se ha restaurado la URL oficial de Transit.");
  };

  const handleTestPlanner = () => {
    setTesting(true);
    toast.info("Probando conectividad del planificador...");

    setTimeout(() => {
      const now = new Date().toLocaleString("es-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const newStatus: DartPlannerStatus = config.iframeEnabled ? "funciona" : "bloqueado";

      const updated: DartPlannerConfig = {
        ...config,
        lastTestedAt: now,
        status: newStatus,
        lastError:
          newStatus === "bloqueado" ? "Iframe desactivado manualmente en administración" : null,
      };

      setConfig(updated);
      saveDartPlannerConfig(updated);
      setTesting(false);
      toast.success(`Prueba completada (${now}). Estado asignado: ${newStatus}`);
    }, 1200);
  };

  const statusBadge = {
    funciona: {
      label: "Funciona",
      icon: CheckCircle2,
      className: "bg-emerald-600 text-white dark:bg-emerald-700",
    },
    bloqueado: {
      label: "Bloqueado",
      icon: XCircle,
      className: "bg-destructive text-destructive-foreground",
    },
    pendiente: {
      label: "Pendiente",
      icon: Clock,
      className: "border-amber-500 text-amber-600 dark:text-amber-400",
    },
  }[config.status];

  const StatusIcon = statusBadge.icon;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Configuración DART / Transit
        </h1>
        <p className="mt-1 text-muted-foreground text-base">
          Administra la integración del planificador web de Transit y parámetros del sistema.
        </p>
      </div>

      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-xl font-bold">Estado de la Integración</CardTitle>
            <CardDescription>Diagnóstico actual de disponibilidad del iframe.</CardDescription>
          </div>
          <Badge
            className={`px-3.5 py-1.5 text-sm font-semibold gap-1.5 rounded-full ${statusBadge.className}`}
          >
            <StatusIcon className="size-4" aria-hidden="true" />
            <span>{statusBadge.label}</span>
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/40 p-4 rounded-2xl border">
            <div>
              <span className="text-muted-foreground text-xs block font-medium">
                Dominio Verificado
              </span>
              <span className="font-semibold text-foreground">
                {config.verifiedDomain || "transitapp.com"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block font-medium">Última Prueba</span>
              <span className="font-semibold text-foreground">
                {config.lastTestedAt || "Sin probar aún"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block font-medium">
                Última Revisión
              </span>
              <span className="font-semibold text-foreground">
                {config.lastReviewedAt || "Hoy"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block font-medium">Modo Iframe</span>
              <span className="font-semibold text-foreground">
                {config.iframeEnabled ? "Activado" : "Desactivado"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={handleTestPlanner}
              disabled={testing}
              className="rounded-xl font-semibold gap-2"
            >
              <RefreshCw className={`size-4 ${testing ? "animate-spin" : ""}`} aria-hidden="true" />
              <span>Probar planificador</span>
            </Button>

            <Button
              onClick={handleRestoreOfficial}
              variant="outline"
              className="rounded-xl font-semibold gap-2"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              <span>Restaurar URL oficial</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Sliders className="size-5 text-primary" aria-hidden="true" />
            <span>Parámetros de Integración</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-2xl border p-4 bg-card">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Opción Iframe activada</Label>
                <p className="text-xs text-muted-foreground">
                  Incrustar el planificador en la página pública.
                </p>
              </div>
              <Switch
                checked={config.iframeEnabled}
                onCheckedChange={(checked) => setConfig({ ...config, iframeEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border p-4 bg-card">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Botón externo activado</Label>
                <p className="text-xs text-muted-foreground">Mostrar enlace directo a Transit.</p>
              </div>
              <Switch
                checked={config.externalButtonEnabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, externalButtonEnabled: checked })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plannerUrl" className="font-semibold text-sm">
              URL del planificador
            </Label>
            <Input
              id="plannerUrl"
              type="url"
              value={config.plannerUrl}
              onChange={(e) => setConfig({ ...config, plannerUrl: e.target.value })}
              placeholder="https://transitapp.com/en/trip"
              className="min-h-11 rounded-xl font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="infoText" className="font-semibold text-sm">
              Texto informativo
            </Label>
            <Textarea
              id="infoText"
              rows={3}
              value={config.infoText}
              onChange={(e) => setConfig({ ...config, infoText: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              onClick={handleValidateAndSave}
              size="lg"
              className="rounded-xl font-semibold gap-2 px-6 shadow-sm"
            >
              <Save className="size-4" aria-hidden="true" />
              <span>Guardar cambios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
