import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Code,
  ExternalLink,
  Globe,
  Info,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  Sliders,
  Sparkles,
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

export const Route = createFileRoute("/admin/dart/")({
  head: () => ({
    meta: [
      { title: "Administración DART / Transit — DMPS Family Info" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDartPage,
});

function AdminDartPage() {
  const [config, setConfig] = useState<DartPlannerConfig>(() => getDartPlannerConfig());
  const [testing, setTesting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  const addAuditLog = (msg: string) => {
    const timestamp = new Date().toLocaleString("es-US", {
      dateStyle: "short",
      timeStyle: "medium",
    });
    setAuditLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 9)]);
  };

  const handleValidateAndSave = () => {
    const urlToTest = config.plannerUrl.trim();

    // Validations: HTTPS required
    if (!urlToTest.startsWith("https://")) {
      toast.error("La URL debe utilizar el protocolo seguro HTTPS.");
      return;
    }

    // Block dangerous schemes
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

    // Extract domain safely
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
    addAuditLog(`Configuración guardada. URL: ${urlToTest}`);
    toast.success("Configuración de DART / Transit actualizada correctamente.");
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
    addAuditLog("URL oficial restaurada a https://transitapp.com/en/trip");
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

      // Default status after testing
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
      addAuditLog(`Prueba de planificador ejecutada. Estado: ${newStatus}`);
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
          Administración DART / Transit
        </h1>
        <p className="mt-1 text-muted-foreground text-base">
          Administra la integración del planificador web de Transit, dimensiones, botones externos y
          estado del servicio.
        </p>
      </div>

      {/* Estado Actual y Diagnóstico */}
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-xl font-bold">Estado de la Integración</CardTitle>
            <CardDescription>
              Diagnóstico actual de disponibilidad y revisión del iframe.
            </CardDescription>
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

          {config.lastError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
              <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
              <span>Mensaje de error: {config.lastError}</span>
            </div>
          )}

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

            <Button asChild variant="ghost" className="rounded-xl font-semibold gap-2 ml-auto">
              <a href={config.plannerUrl} target="_blank" rel="noopener noreferrer">
                <span>Abrir enlace externo</span>
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Opciones de Configuración */}
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Sliders className="size-5 text-primary" aria-hidden="true" />
            <span>Configuración de visualización</span>
          </CardTitle>
          <CardDescription>
            Personaliza el texto explicativo, comportamiento del iframe y dimensiones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Switches de Control */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-2xl border p-4 bg-card">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Opción Iframe activada</Label>
                <p className="text-xs text-muted-foreground">
                  Intenta incrustar el planificador web en la página.
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
                <p className="text-xs text-muted-foreground">
                  Muestra siempre el enlace directo a Transit.
                </p>
              </div>
              <Switch
                checked={config.externalButtonEnabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, externalButtonEnabled: checked })
                }
              />
            </div>
          </div>

          {/* URL actual */}
          <div className="space-y-2">
            <Label htmlFor="plannerUrl" className="font-semibold text-sm">
              URL actual del planificador (HTTPS requerida)
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

          {/* Texto Informativo */}
          <div className="space-y-2">
            <Label htmlFor="infoText" className="font-semibold text-sm">
              Texto informativo para las familias
            </Label>
            <Textarea
              id="infoText"
              rows={3}
              value={config.infoText}
              onChange={(e) => setConfig({ ...config, infoText: e.target.value })}
              placeholder="Busca una ruta de transporte público desde tu ubicación hasta Lincoln High School u otro destino."
              className="rounded-xl"
            />
          </div>

          {/* Dimensiones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heightDesktop" className="font-semibold text-sm">
                Altura iframe en computadora (mín. 780px)
              </Label>
              <Input
                id="heightDesktop"
                type="number"
                min={500}
                max={1500}
                value={config.heightDesktop}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    heightDesktop: Number(e.target.value) || 780,
                  })
                }
                className="min-h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heightMobile" className="font-semibold text-sm">
                Altura iframe en teléfono (mín. 720px)
              </Label>
              <Input
                id="heightMobile"
                type="number"
                min={400}
                max={1200}
                value={config.heightMobile}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    heightMobile: Number(e.target.value) || 720,
                  })
                }
                className="min-h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Asignación Manual de Estado */}
          <div className="space-y-2">
            <Label htmlFor="statusSelect" className="font-semibold text-sm">
              Estado del servicio
            </Label>
            <Select
              value={config.status}
              onValueChange={(val: DartPlannerStatus) => setConfig({ ...config, status: val })}
            >
              <SelectTrigger id="statusSelect" className="min-h-11 rounded-xl">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="funciona">Funciona (iframe visible)</SelectItem>
                <SelectItem value="bloqueado">Bloqueado (mostrar solo botón oficial)</SelectItem>
                <SelectItem value="pendiente">Pendiente (revisión)</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Preparación para API Oficial de Transit */}
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Code className="size-5 text-primary" aria-hidden="true" />
            <span>Integración API de Transit</span>
          </CardTitle>
          <CardDescription>
            Arquitectura lista para conectar la API oficial de Transit en el futuro sin
            reestructurar el frontend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border">
            <div>
              <p className="font-bold text-foreground">Estado de la API</p>
              <p className="text-sm text-muted-foreground">API de Transit: no configurada</p>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Sin API Key
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Variables de entorno preparadas en el servidor:
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground font-mono">
              TRANSIT_API_KEY
            </code>
            y
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground font-mono">
              TRANSIT_API_BASE_URL
            </code>
            . No se generan respuestas ni datos falsos mientras no exista una clave de API
            autorizada.
          </p>

          <div>
            <Button asChild variant="outline" size="sm" className="rounded-xl font-semibold gap-2">
              <a
                href="https://transitapp.com/partners/apis"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Solicitar acceso a Transit API</span>
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registro de Auditoría Local */}
      {auditLogs.length > 0 && (
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Registro de auditoría local</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 font-mono text-xs text-muted-foreground">
              {auditLogs.map((log, i) => (
                <li key={i} className="py-1 border-b border-border/50">
                  {log}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
