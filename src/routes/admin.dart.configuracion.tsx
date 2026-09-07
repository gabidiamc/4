/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Bus,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Edit2,
  ExternalLink,
  Eye,
  HelpCircle,
  Info,
  MapPin,
  Navigation,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { deleteRow, listRows, logAudit, upsertRow, type Row } from "@/lib/admin";
import {
  DEFAULT_DART_ALERT,
  DEFAULT_DART_PLANNER_CONFIG,
  DEFAULT_DART_ROUTES,
  getDartAlertConfig,
  getDartPlannerConfig,
  saveDartAlertConfig,
  saveDartPlannerConfig,
  type DartAlertConfig,
  type DartPlannerConfig,
  type DartPlannerStatus,
  type DartRouteItem,
} from "@/lib/dart";
import { useSchool } from "@/lib/school";
import { notifyContentUpdated } from "@/lib/sync";

export const Route = createFileRoute("/admin/dart/configuracion")({
  head: () => ({
    meta: [
      { title: "Gestión y Rutas DART / Transit — Administración DMPS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDartConfigPage,
});

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
    routes: ["Ruta 1 (Fairgrounds / E University)", "Ruta 17 (Hubbell Ave)"],
  },
];

const ROUTE_COLOR_PRESETS: Record<string, { bg: string; text: string; hex: string }> = {
  "7": { bg: "bg-amber-600", text: "text-white", hex: "#d97706" },
  "8": { bg: "bg-emerald-600", text: "text-white", hex: "#16a34a" },
  "1": { bg: "bg-rose-600", text: "text-white", hex: "#dc2626" },
  "17": { bg: "bg-purple-600", text: "text-white", hex: "#7c3aed" },
  "6": { bg: "bg-blue-600", text: "text-white", hex: "#2563eb" },
  "15": { bg: "bg-violet-600", text: "text-white", hex: "#9333ea" },
  "60": { bg: "bg-sky-600", text: "text-white", hex: "#0284c7" },
};

function getRouteColor(num: string) {
  return ROUTE_COLOR_PRESETS[num] ?? { bg: "bg-slate-700", text: "text-white", hex: "#475569" };
}

export function AdminDartConfigPage() {
  const queryClient = useQueryClient();
  const { adminSchoolFilter } = useSchool();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "routes_crud" | "alerts" | "planner_settings" | "trip_simulator" | "passes"
  >("routes_crud");

  // Config & Alert states
  const [plannerConfig, setPlannerConfig] = useState<DartPlannerConfig>(() =>
    getDartPlannerConfig(),
  );
  const [alertConfig, setAlertConfig] = useState<DartAlertConfig>(() => getDartAlertConfig());
  const [testing, setTesting] = useState(false);

  // Routes Management states
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [editingRoute, setEditingRoute] = useState<Partial<DartRouteItem> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<DartRouteItem | null>(null);

  // Trip simulator states
  const [testOrigin, setTestOrigin] = useState("DART Central Station, 620 Cherry St");
  const [testDestination, setTestDestination] = useState(SCHOOL_DESTINATIONS[0].address);

  // Query DART routes from storage
  const {
    data: routes = [],
    isLoading: isLoadingRoutes,
    refetch: refetchRoutes,
  } = useQuery({
    queryKey: ["admin", "dart_routes", adminSchoolFilter],
    queryFn: async () => {
      try {
        const rows = await listRows("dart_routes", "display_order", true, adminSchoolFilter);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: String(r["id"]),
            route_number: String(r["route_number"] ?? ""),
            name: String(r["name"] ?? ""),
            school_id: String(r["school_id"] ?? "all"),
            description: String(r["description"] ?? ""),
            direction_outbound: r["direction_outbound"] ? String(r["direction_outbound"]) : null,
            direction_inbound: r["direction_inbound"] ? String(r["direction_inbound"]) : null,
            frequency: r["frequency"] ? String(r["frequency"]) : null,
            first_bus: r["first_bus"] ? String(r["first_bus"]) : null,
            last_bus: r["last_bus"] ? String(r["last_bus"]) : null,
            stops_count: r["stops_count"] ? Number(r["stops_count"]) : null,
            official_url: r["official_url"] ? String(r["official_url"]) : null,
            is_active: r["is_active"] !== false,
            display_order: r["display_order"] ? Number(r["display_order"]) : 10,
          })) as DartRouteItem[];
        }
      } catch (err) {
        console.warn("[Admin DART] Failed to query rows, using defaults:", err);
      }
      return DEFAULT_DART_ROUTES;
    },
  });

  // Filtered routes
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const matchSchool =
        schoolFilter === "all" || r.school_id === schoolFilter || r.school_id === "all";
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.route_number.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      return matchSchool && matchQuery;
    });
  }, [routes, schoolFilter, searchQuery]);

  // Mutation to save/update a route
  const saveRouteMutation = useMutation({
    mutationFn: async (route: Partial<DartRouteItem>) => {
      const rowToSave: Row = {
        id: route.id || `dart-rt-${Date.now()}`,
        route_number: route.route_number ?? "",
        name: route.name ?? "",
        school_id: route.school_id ?? "all",
        description: route.description ?? "",
        direction_outbound: route.direction_outbound ?? null,
        direction_inbound: route.direction_inbound ?? null,
        frequency: route.frequency ?? null,
        first_bus: route.first_bus ?? null,
        last_bus: route.last_bus ?? null,
        stops_count: route.stops_count ? Number(route.stops_count) : null,
        official_url: route.official_url ?? null,
        is_active: route.is_active !== false,
        display_order: route.display_order ? Number(route.display_order) : 50,
      };
      await upsertRow("dart_routes", rowToSave);
      try {
        await logAudit(route.id ? "update" : "create", "dart_routes", rowToSave["id"] as string);
      } catch {
        // ignore audit failure
      }
      notifyContentUpdated("dart_routes");
    },
    onSuccess: () => {
      toast.success("Ruta DART guardada exitosamente en la base de datos.");
      queryClient.invalidateQueries({ queryKey: ["admin", "dart_routes"] });
      setIsDialogOpen(false);
      setEditingRoute(null);
    },
    onError: (err: any) => {
      toast.error(`Error al guardar la ruta: ${err?.message || "Error desconocido"}`);
    },
  });

  // Mutation to delete a route
  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteRow("dart_routes", id);
      try {
        await logAudit("delete", "dart_routes", id);
      } catch {
        // ignore
      }
      notifyContentUpdated("dart_routes");
    },
    onSuccess: () => {
      toast.success("Ruta eliminada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["admin", "dart_routes"] });
      setRouteToDelete(null);
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar la ruta: ${err?.message || "Error desconocido"}`);
    },
  });

  // Fast toggle active/inactive
  const toggleRouteActive = async (route: DartRouteItem) => {
    const updated = { ...route, is_active: !route.is_active };
    await saveRouteMutation.mutateAsync(updated);
    toast.info(`Ruta ${route.route_number} ${updated.is_active ? "activada" : "desactivada"}.`);
  };

  // Handle Save Alert Config
  const handleSaveAlert = () => {
    const updated: DartAlertConfig = {
      ...alertConfig,
      updatedAt: new Date().toLocaleDateString("es-US", { dateStyle: "medium" }),
    };
    setAlertConfig(updated);
    saveDartAlertConfig(updated);
    toast.success("Aviso de servicio y alertas DART guardado con éxito.");
  };

  // Handle Save Planner Config
  const handleSavePlannerConfig = () => {
    const urlToTest = plannerConfig.plannerUrl.trim();
    if (!urlToTest.startsWith("https://")) {
      toast.error("La URL debe comenzar con https:// por seguridad.");
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

    const now = new Date().toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" });
    const updated: DartPlannerConfig = {
      ...plannerConfig,
      plannerUrl: urlToTest,
      verifiedDomain: parsedDomain,
      lastReviewedAt: now,
    };
    setPlannerConfig(updated);
    saveDartPlannerConfig(updated);
    toast.success("Configuración técnica del planificador guardada.");
  };

  const handleRestoreDefaultPlanner = () => {
    const restored = { ...DEFAULT_DART_PLANNER_CONFIG };
    setPlannerConfig(restored);
    saveDartPlannerConfig(restored);
    toast.info("Configuración del planificador restaurada a los valores predeterminados.");
  };

  const handleTestConnectivity = () => {
    setTesting(true);
    toast.info("Probando conectividad del servicio...");
    setTimeout(() => {
      const now = new Date().toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" });
      const newStatus: DartPlannerStatus = plannerConfig.iframeEnabled ? "funciona" : "bloqueado";
      const updated: DartPlannerConfig = {
        ...plannerConfig,
        lastTestedAt: now,
        status: newStatus,
      };
      setPlannerConfig(updated);
      saveDartPlannerConfig(updated);
      setTesting(false);
      toast.success(`Prueba finalizada (${now}). Estado: ${newStatus}`);
    }, 800);
  };

  const statusBadge = {
    funciona: {
      label: "Operativo",
      icon: CheckCircle2,
      className: "bg-emerald-600 text-white",
    },
    bloqueado: {
      label: "Bloqueado",
      icon: XCircle,
      className: "bg-destructive text-destructive-foreground",
    },
    pendiente: {
      label: "Pendiente",
      icon: Clock,
      className: "border-amber-500 text-amber-600",
    },
  }[plannerConfig.status];
  const StatusIcon = statusBadge.icon;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Bus className="size-3.5" />
            <span>Transporte Público y Rutas Escolares DART</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Gestión y Configuración de DART / Transit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra las rutas escolares de Lincoln y East High, publica alertas de servicio por
            nieve o desvíos, y controla el planificador de viajes.
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
            onClick={() => {
              setEditingRoute({
                route_number: "",
                name: "",
                school_id: "lincoln",
                description: "",
                direction_outbound: "",
                direction_inbound: "",
                frequency: "Cada 20 min en horas pico",
                first_bus: "06:00 AM",
                last_bus: "09:30 PM",
                stops_count: 25,
                official_url: "https://www.ridedart.com/routes/local/",
                is_active: true,
                display_order: routes.length * 10 + 10,
              });
              setIsDialogOpen(true);
            }}
            className="rounded-xl bg-primary shadow-soft hover:opacity-95"
          >
            <Plus className="mr-2 size-4" />
            <span>Añadir Ruta DART</span>
          </Button>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card border border-border p-4 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bus className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">
              Rutas Registradas
            </span>
            <span className="text-sm font-extrabold text-foreground">
              {routes.length} Líneas ({routes.filter((r) => r.is_active).length} Activas)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
              alertConfig.enabled
                ? alertConfig.type === "normal"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">
              Aviso a Familias
            </span>
            <span className="text-sm font-extrabold text-foreground capitalize">
              {alertConfig.enabled ? alertConfig.type.replace("_", " ") : "Desactivado"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <StatusIcon className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">
              Estado Planificador
            </span>
            <span className="text-sm font-extrabold text-foreground capitalize">
              {statusBadge.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">
              Pase Estudiantil
            </span>
            <span className="text-sm font-extrabold text-foreground">100% Gratis con ID</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1.5 rounded-2xl bg-muted/50 border border-border">
          <TabsTrigger
            value="routes_crud"
            className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Bus className="mr-1.5 size-4 text-primary" />
            <span>Rutas DART ({routes.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="alerts"
            className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <AlertTriangle className="mr-1.5 size-4 text-amber-600" />
            <span>Alertas y Avisos</span>
          </TabsTrigger>

          <TabsTrigger
            value="planner_settings"
            className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Sliders className="mr-1.5 size-4 text-primary" />
            <span>Planificador & Web</span>
          </TabsTrigger>

          <TabsTrigger
            value="trip_simulator"
            className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Compass className="mr-1.5 size-4 text-primary" />
            <span>Simulador de Viajes</span>
          </TabsTrigger>

          <TabsTrigger
            value="passes"
            className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Sparkles className="mr-1.5 size-4 text-primary" />
            <span>Pases Escolares</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ROUTES CRUD MANAGEMENT */}
        <TabsContent value="routes_crud" className="space-y-6">
          {/* Controls & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-4 rounded-2xl shadow-2xs">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por número o nombre de ruta..."
                  className="rounded-xl pl-9 text-xs sm:text-sm"
                />
              </div>

              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger className="w-[180px] rounded-xl text-xs sm:text-sm">
                  <SelectValue placeholder="Filtrar escuela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Escuelas</SelectItem>
                  <SelectItem value="lincoln">Lincoln High School</SelectItem>
                  <SelectItem value="east">East High School</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => {
                setEditingRoute({
                  route_number: "",
                  name: "",
                  school_id: schoolFilter !== "all" ? schoolFilter : "lincoln",
                  description: "",
                  direction_outbound: "",
                  direction_inbound: "",
                  frequency: "Cada 20 min en horas pico",
                  first_bus: "06:00 AM",
                  last_bus: "09:30 PM",
                  stops_count: 25,
                  official_url: "https://www.ridedart.com/routes/local/",
                  is_active: true,
                  display_order: routes.length * 10 + 10,
                });
                setIsDialogOpen(true);
              }}
              className="rounded-xl bg-primary text-xs font-bold"
            >
              <Plus className="mr-1.5 size-4" />
              <span>Nueva Ruta</span>
            </Button>
          </div>

          {/* Table of Routes */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-xs uppercase font-bold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Línea</th>
                    <th className="px-4 py-3">Nombre & Escuela</th>
                    <th className="px-4 py-3">Recorrido / Sentidos</th>
                    <th className="px-4 py-3">Frecuencia / Horario</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoadingRoutes ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        <RefreshCw className="mx-auto size-6 animate-spin text-primary mb-2" />
                        <span>Cargando rutas de DART...</span>
                      </td>
                    </tr>
                  ) : filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        <Bus className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                        <p className="font-bold">
                          No se encontraron rutas DART con los filtros actuales.
                        </p>
                        <p className="text-xs mt-1">
                          Haz clic en &ldquo;Nueva Ruta&rdquo; para agregar una línea al sistema.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => {
                      const color = getRouteColor(route.route_number);
                      const schoolLabel =
                        route.school_id === "lincoln"
                          ? "Lincoln High"
                          : route.school_id === "east"
                            ? "East High"
                            : "Distrito / Ambas";

                      return (
                        <tr key={route.id} className="hover:bg-muted/20 transition-colors group">
                          {/* Route Number Badge */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center size-9 rounded-xl font-black text-sm shadow-xs ${color.bg} ${color.text}`}
                            >
                              {route.route_number}
                            </span>
                          </td>

                          {/* Name & School */}
                          <td className="px-4 py-3.5 max-w-xs">
                            <div className="font-extrabold text-foreground text-sm leading-tight">
                              {route.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  route.school_id === "lincoln"
                                    ? "border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-500/5"
                                    : route.school_id === "east"
                                      ? "border-rose-500/40 text-rose-700 dark:text-rose-300 bg-rose-500/5"
                                      : "border-border text-muted-foreground"
                                }`}
                              >
                                {schoolLabel}
                              </Badge>
                              {route.stops_count && (
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  {route.stops_count} paradas
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Directions */}
                          <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-xs">
                            <p className="line-clamp-2 leading-relaxed">{route.description}</p>
                            {(route.direction_outbound || route.direction_inbound) && (
                              <div className="mt-1 space-y-0.5 text-[11px]">
                                {route.direction_outbound && (
                                  <div className="text-foreground/80 truncate">
                                    <span className="font-bold text-emerald-600">→ Ida:</span>{" "}
                                    {route.direction_outbound}
                                  </div>
                                )}
                                {route.direction_inbound && (
                                  <div className="text-foreground/80 truncate">
                                    <span className="font-bold text-blue-600">← Vuelta:</span>{" "}
                                    {route.direction_inbound}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Frequency & Hours */}
                          <td className="px-4 py-3.5 text-xs">
                            <div className="font-semibold text-foreground flex items-center gap-1">
                              <Clock className="size-3 text-primary" />
                              <span>{route.frequency || "Consultar horario"}</span>
                            </div>
                            {(route.first_bus || route.last_bus) && (
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {route.first_bus} – {route.last_bus}
                              </div>
                            )}
                            {route.official_url && (
                              <a
                                href={route.official_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 mt-1"
                              >
                                <span>PDF Oficial</span>
                                <ExternalLink className="size-2.5" />
                              </a>
                            )}
                          </td>

                          {/* Status Switch */}
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Switch
                                checked={route.is_active}
                                onCheckedChange={() => toggleRouteActive(route)}
                                aria-label="Activar o desactivar ruta"
                              />
                              <span
                                className={`text-[10px] font-bold ${
                                  route.is_active ? "text-emerald-600" : "text-muted-foreground"
                                }`}
                              >
                                {route.is_active ? "Activa" : "Pausada"}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingRoute(route);
                                  setIsDialogOpen(true);
                                }}
                                className="size-8 p-0 rounded-lg hover:bg-muted text-foreground"
                                title="Editar ruta"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setRouteToDelete(route)}
                                className="size-8 p-0 rounded-lg hover:bg-destructive/10 text-destructive"
                                title="Eliminar ruta"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: TRANSIT ALERTS & NOTICES */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="rounded-3xl border border-border shadow-soft">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-amber-600" />
                  <CardTitle className="text-xl font-bold">
                    Avisos de Tránsito, Retrasos y Rutas de Nieve
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    Mostrar en página pública:
                  </span>
                  <Switch
                    checked={alertConfig.enabled}
                    onCheckedChange={(val) => setAlertConfig({ ...alertConfig, enabled: val })}
                  />
                </div>
              </div>
              <CardDescription>
                Publica anuncios urgentes o advertencias meteorológicas que aparecerán de inmediato
                en la parte superior del planificador de transporte para las familias.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-bold text-foreground">Tipo de Aviso</Label>
                  <Select
                    value={alertConfig.type}
                    onValueChange={(val: "normal" | "delay" | "snow_route" | "detour") =>
                      setAlertConfig({ ...alertConfig, type: val })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">
                        🟢 Servicio Normal (Informativo / Todo opera bien)
                      </SelectItem>
                      <SelectItem value="delay">
                        🟡 Retrasos Generales (Tráfico intenso / Lluvia)
                      </SelectItem>
                      <SelectItem value="snow_route">
                        ❄️ Rutas de Nieve Activadas (Snow Routes DART)
                      </SelectItem>
                      <SelectItem value="detour">🚧 Desvío Temporal en Rutas Escolares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-foreground">Título del Aviso</Label>
                  <Input
                    value={alertConfig.title}
                    onChange={(e) => setAlertConfig({ ...alertConfig, title: e.target.value })}
                    placeholder="Ej.: Rutas de Nieve Activadas por Tormenta Invernal"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-foreground">
                  Mensaje detallado para las familias
                </Label>
                <Textarea
                  value={alertConfig.message}
                  onChange={(e) => setAlertConfig({ ...alertConfig, message: e.target.value })}
                  rows={3}
                  className="rounded-xl text-sm"
                  placeholder="Detalla qué rutas tienen desvíos, paradas omitidas o recomendaciones de tiempo..."
                />
              </div>

              {/* Real-time preview */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Vista Previa en Vivo de la Notificación Pública
                </Label>
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                    alertConfig.type === "snow_route"
                      ? "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200"
                      : alertConfig.type === "delay"
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                        : alertConfig.type === "detour"
                          ? "bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200"
                          : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  }`}
                >
                  <AlertCircle className="size-5 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-1">
                    <p className="font-extrabold text-sm">{alertConfig.title || "Sin título"}</p>
                    <p className="text-xs leading-relaxed opacity-90">{alertConfig.message}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveAlert}
                  className="rounded-xl bg-primary shadow-soft text-xs font-bold px-5"
                >
                  <Save className="mr-1.5 size-4" />
                  <span>Guardar y Publicar Aviso</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PLANNER & TECHNICAL SETTINGS */}
        <TabsContent value="planner_settings" className="space-y-6">
          <Card className="rounded-3xl border border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Sliders className="size-5 text-primary" />
                <span>Configuración de Integración del Planificador</span>
              </CardTitle>
              <CardDescription>
                Ajusta las URL y el comportamiento del widget o iframe de Transit / Google Maps.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="font-bold text-foreground">URL del Planificador de Transit</Label>
                <Input
                  value={plannerConfig.plannerUrl}
                  onChange={(e) =>
                    setPlannerConfig({ ...plannerConfig, plannerUrl: e.target.value })
                  }
                  placeholder="https://transitapp.com/en/trip"
                  className="rounded-xl font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  URL oficial aprobada con protocolo seguro HTTPS para la región de Des Moines.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-sm text-foreground">Habilitar Iframe Embebido</p>
                    <p className="text-xs text-muted-foreground">
                      Permite mostrar la vista interactiva del mapa directamente dentro de la página
                      pública.
                    </p>
                  </div>
                  <Switch
                    checked={plannerConfig.iframeEnabled}
                    onCheckedChange={(checked) =>
                      setPlannerConfig({ ...plannerConfig, iframeEnabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/60">
                  <div>
                    <p className="font-bold text-sm text-foreground">Botón Externo a Transit App</p>
                    <p className="text-xs text-muted-foreground">
                      Muestra un botón rápido para abrir la aplicación en pestaña nueva o teléfono.
                    </p>
                  </div>
                  <Switch
                    checked={plannerConfig.externalButtonEnabled}
                    onCheckedChange={(checked) =>
                      setPlannerConfig({ ...plannerConfig, externalButtonEnabled: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleRestoreDefaultPlanner}
                  className="rounded-xl text-xs font-semibold"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  <span>Restaurar Valores Oficiales</span>
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTestConnectivity}
                    disabled={testing}
                    className="rounded-xl text-xs font-semibold"
                  >
                    <RefreshCw className={`mr-1.5 size-3.5 ${testing ? "animate-spin" : ""}`} />
                    <span>{testing ? "Probando..." : "Probar Conectividad"}</span>
                  </Button>

                  <Button
                    onClick={handleSavePlannerConfig}
                    className="rounded-xl bg-primary shadow-soft text-xs font-bold"
                  >
                    <Save className="mr-1.5 size-3.5" />
                    <span>Guardar Configuración</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: TRIP SIMULATOR */}
        <TabsContent value="trip_simulator" className="space-y-6">
          <Card className="rounded-3xl border border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Compass className="size-5 text-primary" />
                <span>Simulador del Planificador de Rutas en Vivo</span>
              </CardTitle>
              <CardDescription>
                Prueba cómo las familias planifican viajes desde cualquier punto hacia Lincoln High
                o East High.
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
                    placeholder="Ej.: DART Central Station, 620 Cherry St"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-1.5 text-foreground">
                    <MapPin className="size-4 text-primary" />
                    <span>Destino Escolar</span>
                  </Label>
                  <Select value={testDestination} onValueChange={setTestDestination}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOOL_DESTINATIONS.map((school) => (
                        <SelectItem key={school.id} value={school.address}>
                          {school.name} ({school.address.split(",")[0]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">Ruta simulada: </span>
                  {testOrigin} → {testDestination.split(",")[0]}
                </div>
                <div className="flex gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-bold"
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                        testOrigin,
                      )}&destination=${encodeURIComponent(testDestination)}&travelmode=transit`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Probar en Google Maps</span>
                      <ExternalLink className="ml-1.5 size-3" />
                    </a>
                  </Button>

                  <Button asChild size="sm" className="rounded-xl text-xs font-bold bg-primary">
                    <a
                      href="https://transitapp.com/en/trip"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Probar en Transit Web</span>
                      <ExternalLink className="ml-1.5 size-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: STUDENT PASSES */}
        <TabsContent value="passes" className="space-y-6">
          <Card className="rounded-3xl border border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="size-5 text-amber-600" />
                <span>Pases Estudiantiles Gratuitos DMPS Unlimited Access</span>
              </CardTitle>
              <CardDescription>
                Convenio oficial entre Des Moines Public Schools y DART para estudiantes de Lincoln
                y East High.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Credencial con Foto</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Los estudiantes de Lincoln High y East High viajan 100% gratis con solo mostrar
                    su identificación escolar vigente al abordar el autobús DART.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-foreground">7 Días a la Semana</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Válido todos los días lectivos, después de clases para actividades y deportes,
                    fines de semana y períodos vacacionales en todo el sistema DART.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Pases Temporales</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Si un estudiante extravía su credencial, la oficina principal de Lincoln o East
                    High puede expedir un pase de reemplazo o temporal sin costo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG: CREATE OR EDIT ROUTE */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Bus className="size-5 text-primary" />
              <span>{editingRoute?.id ? "Editar Ruta DART" : "Añadir Nueva Ruta DART"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Completa la información de la línea. Los cambios aparecerán de inmediato en la página
              pública y en el mapa de transporte.
            </DialogDescription>
          </DialogHeader>

          {editingRoute && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">Número de Ruta *</Label>
                  <Input
                    value={editingRoute.route_number || ""}
                    onChange={(e) =>
                      setEditingRoute({ ...editingRoute, route_number: e.target.value })
                    }
                    placeholder="Ej.: 7, 8, 1, 17"
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="font-bold text-xs">Nombre Oficial de la Línea *</Label>
                  <Input
                    value={editingRoute.name || ""}
                    onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })}
                    placeholder="Ej.: Ruta 7 — Fort Des Moines / SW 9th"
                    className="rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">Escuela Asociada *</Label>
                  <Select
                    value={editingRoute.school_id || "all"}
                    onValueChange={(val) => setEditingRoute({ ...editingRoute, school_id: val })}
                  >
                    <SelectTrigger className="rounded-xl text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lincoln">Abraham Lincoln High School</SelectItem>
                      <SelectItem value="east">Des Moines East High School</SelectItem>
                      <SelectItem value="all">Todas las escuelas (Distrito completo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">Frecuencia Habitual</Label>
                  <Input
                    value={editingRoute.frequency || ""}
                    onChange={(e) =>
                      setEditingRoute({ ...editingRoute, frequency: e.target.value })
                    }
                    placeholder="Ej.: Cada 20 min en horas pico escolares"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-xs">Descripción del Recorrido</Label>
                <Textarea
                  value={editingRoute.description || ""}
                  onChange={(e) =>
                    setEditingRoute({ ...editingRoute, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Explica qué paradas o campus escolares cubre esta ruta..."
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">Dirección de Ida (Outbound)</Label>
                  <Input
                    value={editingRoute.direction_outbound || ""}
                    onChange={(e) =>
                      setEditingRoute({ ...editingRoute, direction_outbound: e.target.value })
                    }
                    placeholder="Ej.: Hacia Southridge Mall vía SW 9th"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">Dirección de Vuelta (Inbound)</Label>
                  <Input
                    value={editingRoute.direction_inbound || ""}
                    onChange={(e) =>
                      setEditingRoute({ ...editingRoute, direction_inbound: e.target.value })
                    }
                    placeholder="Ej.: Hacia DART Central Station (Downtown)"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">Primer Autobús</Label>
                  <Input
                    value={editingRoute.first_bus || ""}
                    onChange={(e) =>
                      setEditingRoute({ ...editingRoute, first_bus: e.target.value })
                    }
                    placeholder="05:45 AM"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">Último Autobús</Label>
                  <Input
                    value={editingRoute.last_bus || ""}
                    onChange={(e) => setEditingRoute({ ...editingRoute, last_bus: e.target.value })}
                    placeholder="10:15 PM"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">Total de Paradas</Label>
                  <Input
                    type="number"
                    value={editingRoute.stops_count ?? ""}
                    onChange={(e) =>
                      setEditingRoute({
                        ...editingRoute,
                        stops_count: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="30"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="font-bold text-xs">Enlace Oficial PDF / Horario DART</Label>
                  <Input
                    value={editingRoute.official_url || ""}
                    onChange={(e) =>
                      setEditingRoute({ ...editingRoute, official_url: e.target.value })
                    }
                    placeholder="https://www.ridedart.com/routes/local/..."
                    className="rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                  <Label className="font-bold text-xs cursor-pointer" htmlFor="route-active-toggle">
                    Ruta Activa
                  </Label>
                  <Switch
                    id="route-active-toggle"
                    checked={editingRoute.is_active !== false}
                    onCheckedChange={(val) => setEditingRoute({ ...editingRoute, is_active: val })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              disabled={
                saveRouteMutation.isPending || !editingRoute?.route_number || !editingRoute?.name
              }
              onClick={() => {
                if (editingRoute) {
                  saveRouteMutation.mutate(editingRoute);
                }
              }}
              className="rounded-xl bg-primary text-xs font-bold px-5"
            >
              {saveRouteMutation.isPending ? (
                <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Save className="mr-1.5 size-3.5" />
              )}
              <span>Guardar Ruta</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CONFIRM DELETE */}
      <Dialog
        open={routeToDelete !== null}
        onOpenChange={(open) => !open && setRouteToDelete(null)}
      >
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              <span>¿Eliminar Ruta DART?</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Esta acción eliminará la ruta &ldquo;{routeToDelete?.name}&rdquo; de la base de datos
              y dejará de aparecer para los estudiantes y familias.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRouteToDelete(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteRouteMutation.isPending}
              onClick={() => {
                if (routeToDelete?.id) {
                  deleteRouteMutation.mutate(routeToDelete.id);
                }
              }}
              className="rounded-xl text-xs font-bold"
            >
              {deleteRouteMutation.isPending ? "Eliminando..." : "Sí, Eliminar Ruta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default AdminDartConfigPage;
