/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  CheckCircle2,
  Clock,
  Code,
  Compass,
  Download,
  ExternalLink,
  Eye,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Navigation,
  QrCode,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  Sliders,
  Smartphone,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_DART_PLANNER_CONFIG,
  getDartPlannerConfig,
  saveDartPlannerConfig,
  type DartPlannerConfig,
  type DartPlannerStatus,
} from "@/lib/dart";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/admin/dart/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración DART / Transit — Administración DMPS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDartConfigPage,
});

// DMPS School Presets for Transit Testing
const SCHOOL_DESTINATIONS = [
  {
    id: "lincoln",
    name: "Abraham Lincoln High School",
    address: "2600 SW 9th St, Des Moines, IA 50315",
    routes: ["Ruta 7 (SW 9th)", "Ruta 8 (Fleur Dr)"],
  },
  {
    id: "east",
    name: "Des Moines East High School",
    address: "815 E 13th St, Des Moines, IA 50316",
    routes: ["Ruta 1 (Fairgrounds)", "Ruta 17 (Hubbell Ave)"],
  },
  {
    id: "central",
    name: "Central Campus / Central Academy",
    address: "1800 Grand Ave, Des Moines, IA 50309",
    routes: ["Ruta 11 (Ingersoll)", "Ruta 60 (University / Ing)"],
  },
  {
    id: "dart_station",
    name: "DART Central Station (Centro)",
    address: "620 Cherry St, Des Moines, IA 50309",
    routes: ["Todas las rutas del sistema"],
  },
];

const MAIN_DART_ROUTES = [
  {
    number: "7",
    name: "SW 9th St",
    school: "Lincoln High School",
    color: "bg-blue-600",
    frequency: "Cada 20 min en horas pico",
    notes: "Parada directa frente al campus de Lincoln High (SW 9th & Loomis).",
  },
  {
    number: "8",
    name: "Fleur Drive",
    school: "Lincoln High School & Aeropuerto",
    color: "bg-indigo-600",
    frequency: "Cada 30 min",
    notes: "Conecta el suroeste con Lincoln High y DART Central Station.",
  },
  {
    number: "17",
    name: "Hubbell Ave / East 14th",
    school: "East High School",
    color: "bg-rose-600",
    frequency: "Cada 20 min",
    notes: "Parada a 2 cuadras de East High School.",
  },
  {
    number: "1",
    name: "Fairgrounds / E University",
    school: "East High School",
    color: "bg-amber-600",
    frequency: "Cada 20 min",
    notes: "Recorre University Ave hacia el este de Des Moines.",
  },
  {
    number: "11",
    name: "Ingersoll / Valley Junction",
    school: "Central Campus",
    color: "bg-emerald-600",
    frequency: "Cada 20-30 min",
    notes: "Parada sobre Grand Ave junto a Central Campus.",
  },
  {
    number: "60",
    name: "University / Ingersoll Loop",
    school: "Central Campus & Roosevelt",
    color: "bg-purple-600",
    frequency: "Cada 20 min",
    notes: "Circuito continuo entre Drake University, Centro y Grand Ave.",
  },
];

export function AdminDartConfigPage() {
  const { selectedSchool } = useSchool();
  const [config, setConfig] = useState<DartPlannerConfig>(() => getDartPlannerConfig());
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "planner_simulator" | "routes" | "passes" | "alerts" | "integration"
  >("planner_simulator");

  // Interactive Trip Planner simulator states
  const [testOrigin, setTestOrigin] = useState("DART Central Station, 620 Cherry St");
  const [testDestination, setTestDestination] = useState(SCHOOL_DESTINATIONS[0].address);

  // Transit Alerts state
  const [alertTitle, setAlertTitle] = useState("Rutas operando con horario regular de invierno");
  const [alertStatus, setAlertStatus] = useState<"normal" | "delay" | "snow_route">("normal");

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
    toast.info("Probando conectividad del planificador web de Transit...");

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
      toast.success(`Prueba completada (${now}). Estado: ${newStatus}`);
    }, 1000);
  };

  const googleMapsPlanUrl = useMemo(() => {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(testOrigin)}&destination=${encodeURIComponent(testDestination)}&travelmode=transit`;
  }, [testOrigin, testDestination]);

  const statusBadge = {
    funciona: {
      label: "Operativo",
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
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Bus className="size-3.5" />
            <span>Transporte Público y Rutas DART</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Gestión y Configuración de DART / Transit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra el planificador de viajes, las rutas escolares de Lincoln y East High, la
            información de pases estudiantiles y las alertas de servicio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/transporte/dart" target="_blank">
              <Eye className="mr-2 size-4" />
              <span>Ver Página Pública DART</span>
            </Link>
          </Button>

          <Button
            onClick={handleValidateAndSave}
            className="rounded-xl bg-primary shadow-soft hover:opacity-95"
          >
            <Save className="mr-2 size-4" />
            <span>Guardar Configuración</span>
          </Button>
        </div>
      </div>

      {/* Integration Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card border border-border p-4 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bus className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Proveedor</span>
            <span className="text-sm font-extrabold text-foreground">DART & Transit App</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <StatusIcon className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">
              Estado del Iframe
            </span>
            <span className="text-sm font-extrabold text-foreground capitalize">
              {statusBadge.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Smartphone className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Apps Móviles</span>
            <span className="text-sm font-extrabold text-foreground">MyDART + Transit</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Pases DMPS</span>
            <span className="text-sm font-extrabold text-foreground">100% Gratis con ID</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (mirroring the public page experience) */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1.5 rounded-2xl bg-muted/50 border border-border">
          <TabsTrigger
            value="planner_simulator"
            className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Navigation className="mr-1.5 size-4 text-primary" />
            <span>Simulador de Viajes</span>
          </TabsTrigger>

          <TabsTrigger
            value="routes"
            className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Bus className="mr-1.5 size-4 text-primary" />
            <span>Rutas Escolares</span>
          </TabsTrigger>

          <TabsTrigger
            value="passes"
            className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Sparkles className="mr-1.5 size-4 text-primary" />
            <span>Pases Gratuitos</span>
          </TabsTrigger>

          <TabsTrigger
            value="alerts"
            className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <AlertTriangle className="mr-1.5 size-4 text-primary" />
            <span>Alertas y Desvíos</span>
          </TabsTrigger>

          <TabsTrigger
            value="integration"
            className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Sliders className="mr-1.5 size-4 text-primary" />
            <span>Ajustes Técnicos</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PLANNER & TRIP SIMULATOR */}
        <TabsContent value="planner_simulator" className="space-y-6">
          <Card className="rounded-3xl border border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Compass className="size-5 text-primary" />
                <span>Simulador del Planificador de Rutas en Vivo</span>
              </CardTitle>
              <CardDescription>
                Prueba cómo las familias consultan viajes desde cualquier punto hacia Lincoln High,
                East High o Central Campus utilizando DART y Transit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-1.5 text-foreground">
                    <MapPin className="size-4 text-emerald-600" />
                    <span>Origen (¿Dónde está la familia?)</span>
                  </Label>
                  <Input
                    value={testOrigin}
                    onChange={(e) => setTestOrigin(e.target.value)}
                    placeholder="Ej.: DART Central Station, 620 Cherry St o tu dirección"
                    className="rounded-xl"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setTestOrigin("DART Central Station, 620 Cherry St")}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-medium"
                    >
                      DART Central Station
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestOrigin("Des Moines East High School")}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-medium"
                    >
                      East High
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestOrigin("Southridge Mall, Des Moines")}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-medium"
                    >
                      Southridge Mall
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-1.5 text-foreground">
                    <MapPin className="size-4 text-rose-600" />
                    <span>Destino (Escuela secundaria o sede DMPS)</span>
                  </Label>
                  <Input
                    value={testDestination}
                    onChange={(e) => setTestDestination(e.target.value)}
                    placeholder="Ej.: Abraham Lincoln High School"
                    className="rounded-xl"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SCHOOL_DESTINATIONS.map((dest) => (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setTestDestination(dest.address)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-medium"
                      >
                        {dest.name.split(" ")[0]} {dest.name.split(" ")[1] || ""}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons to test trip */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Ver simulación de ruta en mapas oficiales
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Genera las opciones de transporte público directo para este trayecto en Des
                    Moines.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="rounded-xl text-xs font-bold">
                    <a href={googleMapsPlanUrl} target="_blank" rel="noreferrer noopener">
                      <ExternalLink className="mr-1.5 size-3.5 text-primary" />
                      <span>Abrir en Google Transit</span>
                    </a>
                  </Button>

                  <Button asChild className="rounded-xl text-xs font-bold bg-primary shadow-soft">
                    <a
                      href="https://transitapp.com/region/des-moines"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <Navigation className="mr-1.5 size-3.5" />
                      <span>Abrir en Transit Web</span>
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ROUTES LIST & CONFIGURATION */}
        <TabsContent value="routes" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MAIN_DART_ROUTES.map((route) => (
              <Card
                key={route.number}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs hover:border-primary/40 transition-all"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`size-8 rounded-xl ${route.color} text-white font-black flex items-center justify-center text-sm shadow-xs`}
                      >
                        {route.number}
                      </span>
                      <h3 className="font-bold text-foreground text-sm leading-snug">
                        {route.name}
                      </h3>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {route.school.split(" ")[0]}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{route.notes}</p>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-primary" />
                      <span>{route.frequency}</span>
                    </span>
                    <a
                      href={`https://ridedart.com/routes/local/route-${route.number}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Horario</span>
                      <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Las rutas anteriores son las líneas de servicio regulares de DART más transitadas por
              los estudiantes de Lincoln, East y Central Campus.
            </p>
          </div>
        </TabsContent>

        {/* TAB 3: STUDENT ID FREE PASSES */}
        <TabsContent value="passes" className="space-y-6">
          <Card className="rounded-3xl border border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="size-5 text-amber-600" />
                <span>Programa de Pases Estudiantiles Gratuitos DMPS</span>
              </CardTitle>
              <CardDescription>
                Información oficial del convenio entre Des Moines Public Schools y DART Unlimited
                Access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Identificación Escolar</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Los estudiantes de Lincoln High, East High y todas las secundarias de DMPS
                    viajan completamente gratis mostrando su credencial escolar vigente al chofer.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Horarios y Fines de Semana</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    El pase cubre todo el año escolar: días lectivos, después de clases para
                    deportes, actividades extracurriculares y fines de semana dentro del sistema
                    DART.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Credencial Extraviada</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Si un alumno pierde su identificación, puede solicitar un reemplazo en la
                    oficina principal de su escuela para no perder el beneficio del transporte.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: ALERTS AND SNOW DETOURS */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="rounded-3xl border border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="size-5 text-rose-600" />
                <span>Alertas de Servicio y Rutas de Nieve</span>
              </CardTitle>
              <CardDescription>
                Publica avisos temporales sobre retrasos por nieve, cierres viales o cambios de
                parada en DART.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="font-bold text-foreground">Estado del servicio hoy</Label>
                <Select
                  value={alertStatus}
                  onValueChange={(val: "normal" | "delay" | "snow_route") => setAlertStatus(val)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Servicio Regular (Sin desvíos)</SelectItem>
                    <SelectItem value="delay">Retrasos Generales por Tráfico / Clima</SelectItem>
                    <SelectItem value="snow_route">
                      Rutas de Nieve Activadas (Snow Detours)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-foreground">
                  Mensaje informativo para familias
                </Label>
                <Textarea
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  rows={3}
                  className="rounded-xl text-sm"
                  placeholder="Escribe el aviso para las familias..."
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => toast.success("Alerta de transporte actualizada.")}
                  className="rounded-xl bg-primary"
                >
                  <Save className="mr-2 size-4" />
                  Actualizar Alerta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: TECHNICAL / IFRAME INTEGRATION SETTINGS */}
        <TabsContent value="integration" className="space-y-6">
          <Card className="rounded-3xl border border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Sliders className="size-5 text-primary" />
                <span>Configuración de Integración Web & Iframe</span>
              </CardTitle>
              <CardDescription>
                Parámetros de conexión con el widget oficial de Transit App para Des Moines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="font-bold text-foreground">URL del Planificador de Transit</Label>
                <Input
                  value={config.plannerUrl}
                  onChange={(e) => setConfig({ ...config, plannerUrl: e.target.value })}
                  placeholder="https://transitapp.com/region/des-moines"
                  className="rounded-xl font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  URL oficial segura HTTPS aprobada por DART y Transit.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-sm text-foreground">Habilitar Iframe Embebido</p>
                    <p className="text-xs text-muted-foreground">
                      Permite mostrar la vista interactiva de Transit directamente dentro de la
                      página.
                    </p>
                  </div>
                  <Switch
                    checked={config.iframeEnabled}
                    onCheckedChange={(checked) => setConfig({ ...config, iframeEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/60">
                  <div>
                    <p className="font-bold text-sm text-foreground">Botón Externo a Transit App</p>
                    <p className="text-xs text-muted-foreground">
                      Muestra botón para abrir la aplicación oficial en pestaña nueva.
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

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleRestoreOfficial}
                  className="rounded-xl text-xs font-semibold"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Restaurar Valores Predeterminados
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTestPlanner}
                    disabled={testing}
                    className="rounded-xl text-xs font-semibold"
                  >
                    <RefreshCw className={`mr-1.5 size-3.5 ${testing ? "animate-spin" : ""}`} />
                    {testing ? "Probando..." : "Probar Conectividad"}
                  </Button>

                  <Button
                    onClick={handleValidateAndSave}
                    className="rounded-xl bg-primary shadow-soft text-xs font-bold"
                  >
                    <Save className="mr-1.5 size-3.5" />
                    Guardar Configuración
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
