/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Bus,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  CornerUpLeft,
  CornerUpRight,
  Download,
  ExternalLink,
  Footprints,
  HelpCircle,
  Info,
  Locate,
  MapPin,
  Navigation,
  Phone,
  Play,
  QrCode,
  Radio,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

import { OfficialDataBadge } from "@/components/official-badge";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  getDartTransitOptions,
  type DartTransitOption,
  type NavigationStep,
  DES_MOINES_LANDMARKS,
} from "@/lib/dart-transit-engine";
import {
  DEFAULT_DART_ROUTES,
  fetchDartRoutes,
  getDartAlertConfig,
  getDartPlannerConfig,
  type DartAlertConfig,
  type DartRouteItem,
  type VehiclePosition,
} from "@/lib/dart";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/transporte/dart")({
  head: () => ({
    meta: [
      {
        title: "Rutas de Transporte y Planificador DART — DMPS Family Info",
      },
      {
        name: "description",
        content:
          "Consulta rutas escolares DART hacia Lincoln High School y East High School, horarios, pase estudiantil gratuito y mapa en vivo en Des Moines.",
      },
      {
        property: "og:title",
        content: "Rutas y Planificador DART — Familias DMPS",
      },
      {
        property: "og:description",
        content:
          "Rutas de autobús público directo a Abraham Lincoln High School y East High School con horarios oficiales, pase gratis y mapa interactivo.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://familiasdmps.app/transporte/dart" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/transporte/dart" }],
  }),
  component: DartPublicPage,
});

// Official Brand Logos
function MyDartLogo({ className = "size-6" }: { className?: string }) {
  return (
    <img
      src="/logos/mydart.svg"
      alt="MyDART App"
      referrerPolicy="no-referrer"
      className={`${className} object-contain rounded-xl shadow-xs`}
    />
  );
}

function TransitAppLogo({ className = "size-6" }: { className?: string }) {
  return (
    <img
      src="/logos/transit-app.svg"
      alt="Transit App"
      referrerPolicy="no-referrer"
      className={`${className} object-contain rounded-xl shadow-xs`}
    />
  );
}

function AppleIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <img
      src="/logos/app-store.svg"
      alt="App Store"
      referrerPolicy="no-referrer"
      className={`${className} object-contain rounded-sm`}
    />
  );
}

function GooglePlayIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <img
      src="/logos/google-play.svg"
      alt="Google Play"
      referrerPolicy="no-referrer"
      className={`${className} object-contain rounded-sm`}
    />
  );
}

const PRESET_ORIGINS = [
  "Mi ubicación actual",
  "DART Central Station (620 Cherry St)",
  "Southridge Mall (1111 E Army Post Rd)",
  "Downtown Des Moines",
  "Merle Hay Mall",
];

const APP_LINKS = {
  mydart: {
    ios: "https://apps.apple.com/us/app/mydart-des-moines/id1294661597",
    android: "https://play.google.com/store/apps/details?id=co.bytemark.mydart",
  },
  transit: {
    ios: "https://apps.apple.com/us/app/transit-bus-subway-times/id498860701",
    android: "https://play.google.com/store/apps/details?id=com.thetransitapp.droid",
  },
};

const ROUTE_COLOR_PRESETS: Record<string, { bg: string; text: string; border: string }> = {
  "7": { bg: "bg-amber-600", text: "text-white", border: "border-amber-500" },
  "8": { bg: "bg-emerald-600", text: "text-white", border: "border-emerald-500" },
  "1": { bg: "bg-rose-600", text: "text-white", border: "border-rose-500" },
  "17": { bg: "bg-purple-600", text: "text-white", border: "border-purple-500" },
  "6": { bg: "bg-blue-600", text: "text-white", border: "border-blue-500" },
  "15": { bg: "bg-violet-600", text: "text-white", border: "border-violet-500" },
  "60": { bg: "bg-sky-600", text: "text-white", border: "border-sky-500" },
};

function getRouteColor(num: string) {
  return (
    ROUTE_COLOR_PRESETS[num] ?? {
      bg: "bg-slate-700",
      text: "text-white",
      border: "border-slate-600",
    }
  );
}

function DartPublicPage() {
  const { t } = useI18n();
  const { selectedSchool, setSelectedSchool } = useSchool();
  const isEast = selectedSchool.id === "east";
  const schoolName = selectedSchool.name;

  // Active Tab
  const [activeTab, setActiveTab] = useState<"planner" | "routes" | "passes" | "apps">("planner");

  // Transit alert config
  const [alertConfig, setAlertConfig] = useState<DartAlertConfig>(() => getDartAlertConfig());

  // Listen for admin alert updates
  useEffect(() => {
    const handleAlertUpdate = () => {
      setAlertConfig(getDartAlertConfig());
    };
    window.addEventListener("dart_alert_updated", handleAlertUpdate);
    return () => window.removeEventListener("dart_alert_updated", handleAlertUpdate);
  }, []);

  // Fetch dynamic DART routes from storage engine
  const { data: routes = DEFAULT_DART_ROUTES, isLoading: isLoadingRoutes } = useQuery({
    queryKey: ["dart_routes"],
    queryFn: async () => {
      return await fetchDartRoutes();
    },
    staleTime: 1000 * 60 * 5,
  });

  // Destinations presets based on current school
  const presetDestinations = isEast
    ? [
        "East High School (815 E 13th St, Des Moines, IA)",
        "East High Williams Stadium (E 14th St, Des Moines, IA)",
        "DART Central Station (620 Cherry St, Des Moines, IA)",
        "Central Campus (1800 Grand Ave, Des Moines, IA)",
      ]
    : [
        "Lincoln High School (2600 SW 9th St, Des Moines, IA)",
        "Lincoln High School South Campus (1000 Porter Ave, Des Moines, IA)",
        "DART Central Station (620 Cherry St, Des Moines, IA)",
        "Central Campus (1800 Grand Ave, Des Moines, IA)",
      ];

  // Form states for Origin and Destination
  const [origin, setOrigin] = useState("Mi ubicación actual");
  const [destination, setDestination] = useState(
    isEast
      ? "East High School (815 E 13th St, Des Moines, IA)"
      : "Lincoln High School (2600 SW 9th St, Des Moines, IA)",
  );
  const [travelTime, setTravelTime] = useState<"now" | "morning" | "afternoon" | "custom">("now");
  const [isLocating, setIsLocating] = useState(false);
  const [mapReloadKey, setMapReloadKey] = useState(0);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [activeQrApp, setActiveQrApp] = useState<null | "mydart" | "transit">(null);

  // Dynamic DART Transit Options matching user's origin and destination
  const transitOptions = useMemo(() => {
    return getDartTransitOptions(
      origin,
      destination,
      travelTime,
      selectedSchool.id as "lincoln" | "east",
    );
  }, [origin, destination, travelTime, selectedSchool.id]);

  const [selectedOptionId, setSelectedOptionId] = useState<string>("opt-rt-7");

  // Keep selected option valid when school/options change
  useEffect(() => {
    if (transitOptions.length > 0 && !transitOptions.some((o) => o.id === selectedOptionId)) {
      setSelectedOptionId(transitOptions[0].id);
    }
  }, [transitOptions, selectedOptionId]);

  const activeOption = useMemo(() => {
    return transitOptions.find((o) => o.id === selectedOptionId) || transitOptions[0] || null;
  }, [transitOptions, selectedOptionId]);

  // Turn-by-turn Navigation State (Google Maps Navigation Mode)
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Live GPS tracking verification
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  const [liveLocation, setLiveLocation] = useState<{
    lat: number;
    lon: number;
    accuracy: number;
    speed: number | null;
  } | null>(null);
  const [isTrackingLiveGps, setIsTrackingLiveGps] = useState(false);

  // Audio Speech Synthesis narration helper
  const speakInstruction = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.info("La síntesis de voz no está soportada en este navegador.");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-US";
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // Start Navigation
  const handleStartNavigation = (optionId?: string) => {
    if (optionId) {
      setSelectedOptionId(optionId);
    }
    setIsNavigating(true);
    setActiveStepIndex(0);

    const targetOpt = optionId
      ? transitOptions.find((o) => o.id === optionId) || activeOption
      : activeOption;

    if (targetOpt && targetOpt.steps.length > 0) {
      speakInstruction(
        `Iniciando viaje con ${targetOpt.routeName}. ${targetOpt.steps[0].instruction}`,
      );
    }

    // Auto-scroll to navigation view
    const navEl = document.getElementById("navigation-hud-section");
    if (navEl) {
      navEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    toast.success("Modo navegación en vivo iniciado.");
  };

  const handleStopNavigation = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsNavigating(false);
    setActiveStepIndex(0);
    stopLiveGpsTracking();
    toast.info("Navegación finalizada.");
  };

  const handleNextStep = () => {
    if (!activeOption) return;
    if (activeStepIndex < activeOption.steps.length - 1) {
      const nextIdx = activeStepIndex + 1;
      setActiveStepIndex(nextIdx);
      speakInstruction(activeOption.steps[nextIdx].instruction);
    } else {
      toast.success("¡Has llegado a tu destino!");
      speakInstruction(`Has llegado a tu destino en ${schoolName}`);
    }
  };

  const handlePrevStep = () => {
    if (!activeOption) return;
    if (activeStepIndex > 0) {
      const prevIdx = activeStepIndex - 1;
      setActiveStepIndex(prevIdx);
      speakInstruction(activeOption.steps[prevIdx].instruction);
    }
  };

  // Live GPS tracking watcher
  const startLiveGpsTracking = () => {
    if (!navigator.geolocation) {
      toast.error("La geolocalización no está disponible en este dispositivo.");
      return;
    }
    setIsTrackingLiveGps(true);
    toast.success("Verificando tu posición en vivo con GPS...");

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLiveLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
        });
      },
      (err) => {
        console.warn("GPS watch warning:", err);
        setIsTrackingLiveGps(false);
        toast.info("No se pudo obtener señal continua de GPS.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 },
    );
    setGpsWatchId(id);
  };

  const stopLiveGpsTracking = () => {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }
    setIsTrackingLiveGps(false);
  };

  const toggleLiveGpsTracking = () => {
    if (isTrackingLiveGps) {
      stopLiveGpsTracking();
      toast.info("Rastreo GPS pausado.");
    } else {
      startLiveGpsTracking();
    }
  };

  // Clean up GPS watch on unmount
  useEffect(() => {
    return () => {
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [gpsWatchId]);
  const [isLocating, setIsLocating] = useState(false);
  const [mapReloadKey, setMapReloadKey] = useState(0);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [activeQrApp, setActiveQrApp] = useState<null | "mydart" | "transit">(null);

  // Route catalog filters
  const [routeSearchQuery, setRouteSearchQuery] = useState("");
  const [routeSchoolFilter, setRouteSchoolFilter] = useState<string>("current");

  // Keep destination synced when user switches school
  useEffect(() => {
    setDestination(
      isEast
        ? "East High School (815 E 13th St, Des Moines, IA)"
        : "Lincoln High School (2600 SW 9th St, Des Moines, IA)",
    );
  }, [isEast]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        t("dart.toast.noGeo", "La geolocalización no está disponible en este navegador."),
      );
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
        setOrigin(`Mi ubicación (${coords})`);
        toast.success(t("dart.toast.locationSuccess", "Ubicación obtenida correctamente."));
      },
      () => {
        setIsLocating(false);
        setOrigin("Des Moines, IA");
        toast.info(
          t(
            "dart.toast.locationFail",
            "No se pudo obtener la ubicación exacta. Se usó Des Moines, IA.",
          ),
        );
      },
      { timeout: 8000 },
    );
  };

  const getCleanOriginForMaps = () => {
    if (origin.includes("Mi ubicación")) {
      return "Current+Location";
    }
    return encodeURIComponent(origin.trim() || "Des Moines, IA");
  };

  const getCleanDestForMaps = () => {
    const fallbackDest = isEast
      ? "East High School, 815 E 13th St, Des Moines, IA"
      : "Lincoln High School, 2600 SW 9th St, Des Moines, IA";
    return encodeURIComponent(destination.trim() || fallbackDest);
  };

  const getGoogleMapsEmbedUrl = () => {
    const saddr = getCleanOriginForMaps();
    const daddr = getCleanDestForMaps();
    return `https://www.google.com/maps?saddr=${saddr}&daddr=${daddr}&dirflg=r&output=embed`;
  };

  const getGoogleMapsExternalUrl = () => {
    const saddr = getCleanOriginForMaps();
    const daddr = getCleanDestForMaps();
    return `https://www.google.com/maps/dir/?api=1&origin=${saddr}&destination=${daddr}&travelmode=transit`;
  };

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Filter routes for catalog
  const filteredCatalogRoutes = useMemo(() => {
    return routes.filter((r) => {
      if (!r.is_active) return false;
      if (routeSchoolFilter === "current") {
        if (r.school_id !== selectedSchool.id && r.school_id !== "all") return false;
      } else if (routeSchoolFilter === "lincoln") {
        if (r.school_id !== "lincoln" && r.school_id !== "all") return false;
      } else if (routeSchoolFilter === "east") {
        if (r.school_id !== "east" && r.school_id !== "all") return false;
      }
      if (routeSearchQuery.trim()) {
        const q = routeSearchQuery.toLowerCase();
        return (
          r.route_number.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [routes, routeSchoolFilter, selectedSchool.id, routeSearchQuery]);

  // Direct routes for Lincoln / East highlight pills
  const schoolDirectRoutes = useMemo(() => {
    return routes.filter(
      (r) => r.is_active && (r.school_id === selectedSchool.id || r.school_id === "all"),
    );
  }, [routes, selectedSchool.id]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header & School Switcher */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                <Bus className="size-6" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
                  {t("dart.title", "Planificador y Rutas de Transporte DART")}
                </h1>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span>{t("dart.serviceFor", "Servicio oficial para")}</span>
                  <span className="font-extrabold text-foreground">{schoolName}</span>
                </p>
              </div>
            </div>

            {/* Quick School Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border">
              <button
                type="button"
                onClick={() => setSelectedSchool("lincoln")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedSchool.id === "lincoln"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bus className="size-3.5" />
                <span>Lincoln High</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSchool("east")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedSchool.id === "east"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bus className="size-3.5" />
                <span>East High</span>
              </button>
            </div>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t(
              "dart.intro",
              "Los estudiantes de Lincoln High School y East High School viajan gratis en DART con su credencial escolar. Consulta rutas directas, paradas en el campus y horarios en tiempo real.",
            )}
          </p>
        </div>

        {/* Live Service Alert Banner (Admin Configured) */}
        {alertConfig.enabled && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-xs transition-all ${
              alertConfig.type === "snow_route"
                ? "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200"
                : alertConfig.type === "delay"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                  : alertConfig.type === "detour"
                    ? "bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200"
                    : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
            }`}
          >
            {alertConfig.type === "snow_route" ? (
              <Snowflake className="size-5 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
            ) : alertConfig.type === "normal" ? (
              <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="size-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            )}
            <div className="space-y-0.5 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-extrabold text-sm sm:text-base">
                  {alertConfig.title || "Aviso de Servicio DART"}
                </p>
                {alertConfig.updatedAt && (
                  <span className="text-[10px] font-semibold opacity-75">
                    Actualizado: {alertConfig.updatedAt}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed opacity-95">{alertConfig.message}</p>
            </div>
          </div>
        )}

        {/* Direct School Route Pills Banner */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="size-3.5 text-primary" />
              <span>Líneas Directas para {schoolName}</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("routes")}
              className="text-xs font-bold text-primary hover:underline"
            >
              Ver todas las paradas →
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {schoolDirectRoutes.map((route) => {
              const color = getRouteColor(route.route_number);
              return (
                <div
                  key={route.id}
                  onClick={() => {
                    setActiveTab("routes");
                    setRouteSearchQuery(route.route_number);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 transition-all cursor-pointer shadow-xs"
                >
                  <span
                    className={`size-6 rounded-lg font-black text-xs flex items-center justify-center ${color.bg} ${color.text}`}
                  >
                    {route.route_number}
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-foreground truncate max-w-[200px]">
                      {route.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {route.frequency || "Ver horarios"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Organized Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val: any) => setActiveTab(val)}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto p-1.5 rounded-2xl bg-muted/60 border border-border">
            <TabsTrigger
              value="planner"
              className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
            >
              <Compass className="mr-1.5 size-4 text-primary" />
              <span>Planificador & Mapa</span>
            </TabsTrigger>

            <TabsTrigger
              value="routes"
              className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
            >
              <Bus className="mr-1.5 size-4 text-primary" />
              <span>Rutas Escolares ({filteredCatalogRoutes.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="passes"
              className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
            >
              <Sparkles className="mr-1.5 size-4 text-amber-600" />
              <span>Pase Estudiantil Gratis</span>
            </TabsTrigger>

            <TabsTrigger
              value="apps"
              className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-soft"
            >
              <Smartphone className="mr-1.5 size-4 text-primary" />
              <span>Apps Móviles & Ayuda</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PLANNER & INTERACTIVE LIVE MAP */}
          <TabsContent value="planner" className="space-y-6">
            {/* Origin & Destination Search Card */}
            <Card className="rounded-3xl border-2 border-primary/20 bg-card shadow-md overflow-hidden">
              <CardHeader className="bg-primary/5 pb-4 border-b border-border/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Compass className="size-5 text-primary" aria-hidden="true" />
                    <CardTitle className="text-xl font-extrabold">
                      {t("dart.form.title", "¿Dónde estás y a dónde vas?")}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="rounded-full text-xs font-semibold">
                    {t("dart.form.badge", "Planificador Rápido")}
                  </Badge>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  {t(
                    "dart.form.description",
                    "Ingresa tu ubicación y la escuela de destino para ver qué autobús DART tomar y a qué hora pasa.",
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Origin */}
                  <div className="md:col-span-5 space-y-2">
                    <Label
                      htmlFor="origin-input"
                      className="text-sm font-bold flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <MapPin className="size-4" aria-hidden="true" />
                        <span>{t("dart.origin.label", "Origen (Dónde estás)")}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocating}
                        className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <Navigation className={`size-3 ${isLocating ? "animate-spin" : ""}`} />
                        <span>
                          {isLocating
                            ? t("dart.origin.searching", "Buscando...")
                            : t("dart.origin.currentLocation", "Mi ubicación")}
                        </span>
                      </button>
                    </Label>
                    <div className="relative">
                      <Input
                        id="origin-input"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder={t(
                          "dart.origin.placeholder",
                          "Ej.: Mi casa, DART Central Station...",
                        )}
                        className="min-h-12 rounded-xl text-base pl-10 font-medium"
                      />
                      <MapPin
                        className="absolute left-3.5 top-3.5 size-4 text-emerald-500"
                        aria-hidden="true"
                      />
                    </div>

                    {/* Quick origin presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[11px] text-muted-foreground font-medium self-center mr-1">
                        Sugerencias:
                      </span>
                      {PRESET_ORIGINS.slice(0, 3).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setOrigin(preset)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                            origin === preset
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 hover:bg-muted text-foreground border-border"
                          }`}
                        >
                          {preset.split("(")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="md:col-span-2 flex justify-center pt-2 md:pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleSwapLocations}
                      title={t("dart.swap.title", "Intercambiar origen y destino")}
                      className="rounded-full size-10 shrink-0 border-border shadow-sm hover:bg-primary/10 hover:text-primary"
                    >
                      <ArrowRight className="size-4 rotate-90 md:rotate-0" aria-hidden="true" />
                    </Button>
                  </div>

                  {/* Destination */}
                  <div className="md:col-span-5 space-y-2">
                    <Label
                      htmlFor="dest-input"
                      className="text-sm font-bold flex items-center gap-1.5 text-primary"
                    >
                      <MapPin className="size-4" aria-hidden="true" />
                      <span>{t("dart.destination.label", "Destino (A dónde vas)")}</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="dest-input"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder={t(
                          "dart.destination.placeholder",
                          "Ej.: Lincoln High School...",
                        )}
                        className="min-h-12 rounded-xl text-base pl-10 font-medium"
                      />
                      <MapPin
                        className="absolute left-3.5 top-3.5 size-4 text-primary"
                        aria-hidden="true"
                      />
                    </div>

                    {/* Quick destination presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[11px] text-muted-foreground font-medium self-center mr-1">
                        Destinos:
                      </span>
                      {presetDestinations.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDestination(preset)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                            destination === preset
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 hover:bg-muted text-foreground border-border"
                          }`}
                        >
                          {preset.split("(")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Departure times and Direct Links */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Horario de viaje:
                    </span>
                    <div className="flex gap-1">
                      {[
                        { id: "now", label: "Ahora" },
                        { id: "morning", label: "Entrada escolar (7:30 AM)" },
                        { id: "afternoon", label: "Salida escolar (3:30 PM)" },
                      ].map((pref) => (
                        <button
                          key={pref.id}
                          type="button"
                          onClick={() => setTravelTime(pref.id)}
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                            travelTime === pref.id
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {pref.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => handleStartNavigation()}
                      size="lg"
                      className="rounded-xl font-extrabold gap-2 min-h-11 px-5 flex-1 sm:flex-initial shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Play className="size-4 fill-white" aria-hidden="true" />
                      <span>Iniciar Viaje (Modo GPS)</span>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="rounded-xl font-bold gap-2 min-h-11 px-4 flex-1 sm:flex-initial border-border shadow-xs hover:bg-muted"
                    >
                      <a
                        href={getGoogleMapsExternalUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Abrir en Google Maps</span>
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NAVIGATION HUD (Google Maps Navigation Style) */}
            {isNavigating && activeOption && (
              <div
                id="navigation-hud-section"
                className="rounded-3xl border-2 border-emerald-500/40 bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
              >
                {/* Top Maneuver Banner */}
                <div className="bg-emerald-700 dark:bg-emerald-800 text-white p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-600/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-3 rounded-full bg-white animate-pulse" />
                      <span className="text-xs font-black tracking-wider uppercase text-emerald-100">
                        Navegación en Vivo • DART Tránsito
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-900/80 text-emerald-100 border-none font-bold text-xs">
                        Paso {activeStepIndex + 1} de {activeOption.steps.length}
                      </Badge>
                      <Button
                        onClick={handleStopNavigation}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-emerald-800/80 hover:text-white text-xs h-8 px-2.5 rounded-lg"
                      >
                        <Square className="size-3.5 mr-1 fill-white" />
                        <span>Detener</span>
                      </Button>
                    </div>
                  </div>

                  {/* Active Step Maneuver Box */}
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-white text-emerald-800 p-3.5 shadow-md shrink-0">
                      {activeOption.steps[activeStepIndex]?.iconType === "turn-right" ? (
                        <CornerUpRight className="size-8 stroke-[2.5]" />
                      ) : activeOption.steps[activeStepIndex]?.iconType === "turn-left" ? (
                        <CornerUpLeft className="size-8 stroke-[2.5]" />
                      ) : activeOption.steps[activeStepIndex]?.iconType === "bus" ? (
                        <Bus className="size-8 stroke-[2.5]" />
                      ) : activeOption.steps[activeStepIndex]?.iconType === "destination" ? (
                        <MapPin className="size-8 stroke-[2.5]" />
                      ) : (
                        <Footprints className="size-8 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <h2 className="text-lg sm:text-2xl font-black leading-tight text-white">
                        {activeOption.steps[activeStepIndex]?.instruction}
                      </h2>
                      {activeOption.steps[activeStepIndex]?.detail && (
                        <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                          {activeOption.steps[activeStepIndex]?.detail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Next Maneuver Preview */}
                  {activeStepIndex < activeOption.steps.length - 1 && (
                    <div className="flex items-center gap-2 bg-emerald-800/80 rounded-xl px-3.5 py-2 text-xs text-emerald-100 font-medium">
                      <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                        Luego:
                      </span>
                      <span className="truncate">
                        {activeOption.steps[activeStepIndex + 1]?.instruction}
                      </span>
                    </div>
                  )}

                  {/* Trip Summary Stats */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-emerald-100/90 font-semibold">
                    <div className="flex items-center gap-3">
                      <span>Llegada estimada en ~{activeOption.totalDurationMinutes} min</span>
                      <span>•</span>
                      <span>{activeOption.stopsCount} paradas a bordo</span>
                    </div>

                    {isTrackingLiveGps && liveLocation && (
                      <span className="inline-flex items-center gap-1 text-emerald-200 text-[11px]">
                        <Locate className="size-3 animate-pulse" />
                        <span>GPS Activo (±{Math.round(liveLocation.accuracy)}m)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Navigation Controls Bar */}
                <div className="p-4 sm:p-5 bg-card border-t border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePrevStep}
                      disabled={activeStepIndex === 0}
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold gap-1 text-xs"
                    >
                      <ChevronLeft className="size-4" />
                      <span>Anterior</span>
                    </Button>

                    <Button
                      onClick={handleNextStep}
                      size="sm"
                      className="rounded-xl font-bold gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <span>
                        {activeStepIndex === activeOption.steps.length - 1
                          ? "Llegar a destino"
                          : "Siguiente paso"}
                      </span>
                      <ChevronRight className="size-4" />
                    </Button>

                    <Button
                      onClick={() =>
                        speakInstruction(activeOption.steps[activeStepIndex]?.instruction || "")
                      }
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-semibold gap-1 text-xs"
                      title="Escuchar instrucción por voz"
                    >
                      {isSpeaking ? (
                        <VolumeX className="size-4 text-primary animate-pulse" />
                      ) : (
                        <Volume2 className="size-4" />
                      )}
                      <span className="hidden sm:inline">{isSpeaking ? "Hablando..." : "Voz"}</span>
                    </Button>

                    <Button
                      onClick={toggleLiveGpsTracking}
                      variant={isTrackingLiveGps ? "default" : "outline"}
                      size="sm"
                      className={`rounded-xl font-semibold gap-1 text-xs ${
                        isTrackingLiveGps ? "bg-emerald-600 text-white" : ""
                      }`}
                      title="Verificar posición GPS en tiempo real"
                    >
                      <Locate className={`size-4 ${isTrackingLiveGps ? "animate-pulse" : ""}`} />
                      <span className="hidden sm:inline">
                        {isTrackingLiveGps ? "GPS Conectado" : "Verificar GPS"}
                      </span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-xs font-bold text-primary gap-1"
                    >
                      <a
                        href={getGoogleMapsExternalUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Abrir app Google Maps</span>
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Step-by-Step Checklist */}
                <div className="p-4 sm:p-5 border-t border-border/60 bg-muted/20 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Todos los pasos de la ruta
                  </h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeOption.steps.map((step, idx) => {
                      const isCompleted = idx < activeStepIndex;
                      const isCurrent = idx === activeStepIndex;

                      return (
                        <div
                          key={step.id}
                          onClick={() => {
                            setActiveStepIndex(idx);
                            speakInstruction(step.instruction);
                          }}
                          className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isCurrent
                              ? "bg-emerald-500/10 border-emerald-500/50 shadow-xs"
                              : isCompleted
                                ? "bg-card/60 border-border text-muted-foreground"
                                : "bg-card border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="pt-0.5">
                            {isCompleted ? (
                              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                            ) : isCurrent ? (
                              <div className="size-4 rounded-full border-2 border-emerald-600 dark:border-emerald-400 flex items-center justify-center">
                                <div className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                              </div>
                            ) : (
                              <div className="size-4 rounded-full border border-muted-foreground/40 flex items-center justify-center text-[10px] font-bold">
                                {idx + 1}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-bold ${
                                isCurrent
                                  ? "text-emerald-700 dark:text-emerald-300 font-extrabold"
                                  : isCompleted
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground"
                              }`}
                            >
                              {step.instruction}
                            </p>
                            {step.detail && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                {step.detail}
                              </p>
                            )}
                          </div>
                          {step.durationMinutes > 0 && (
                            <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                              {step.durationMinutes} min
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* AVAILABLE DART BUSES LIST WITH ARRIVAL TIMES */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div>
                  <div className="flex items-center gap-2">
                    <Bus className="size-5 text-primary" aria-hidden="true" />
                    <h2 className="font-bold text-lg text-foreground">
                      Autobuses DART Cercanos y Horarios en Vivo
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Líneas oficiales DART Des Moines (RideDART) calculadas para tu trayecto escolar.
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="text-xs font-semibold gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                >
                  <Radio className="size-3 animate-pulse text-emerald-500" />
                  <span>DART Des Moines Oficial</span>
                </Badge>
              </div>

              {/* Transit Cards Grid */}
              <div className="grid grid-cols-1 gap-4">
                {transitOptions.map((option) => {
                  const isSelected = option.id === selectedOptionId;

                  return (
                    <Card
                      key={option.id}
                      className={`rounded-3xl border-2 transition-all overflow-hidden ${
                        isSelected
                          ? "border-primary bg-card shadow-md ring-2 ring-primary/15"
                          : "border-border bg-card/80 hover:border-primary/40 hover:shadow-sm"
                      }`}
                    >
                      <CardContent className="p-5 sm:p-6 space-y-4">
                        {/* Card Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-3">
                            <span
                              className={`inline-flex items-center justify-center size-12 rounded-2xl font-black text-xl shadow-xs shrink-0 ${option.badgeColor.bg} ${option.badgeColor.text}`}
                            >
                              {option.routeNumber}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base sm:text-lg font-black text-foreground">
                                  {option.routeName}
                                </h3>
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-none font-extrabold text-xs">
                                  {option.statusText}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                {option.headsign} • {option.frequencyText}
                              </p>
                            </div>
                          </div>

                          {/* Next Bus Arrival Countdown Badge */}
                          <div className="bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 text-right self-start sm:self-auto shrink-0">
                            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                              Próximo autobús DART
                            </div>
                            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                              En {option.minutesUntilNext} min ({option.nextDepartures[0]})
                            </div>
                            <div className="text-[11px] text-muted-foreground font-medium">
                              Siguientes: {option.nextDepartures.slice(1).join(" • ")}
                            </div>
                          </div>
                        </div>

                        {/* Route Segments Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/70 text-xs">
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <Footprints className="size-3.5 text-emerald-600" />
                              <span>Caminata a la parada</span>
                            </span>
                            <p className="font-bold text-foreground">{option.boardStopName}</p>
                            <p className="text-muted-foreground text-[11px]">
                              A pie ~{option.boardStopDistanceMeters} m (
                              {option.boardStopWalkMinutes} min)
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <Bus className="size-3.5 text-primary" />
                              <span>En autobús DART</span>
                            </span>
                            <p className="font-bold text-foreground">
                              {option.stopsCount} paradas a bordo (~{option.busRideMinutes} min)
                            </p>
                            <p className="text-muted-foreground text-[11px]">
                              Baja en {option.alightStopName}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3.5 text-amber-500" />
                              <span>Tiempo total de viaje</span>
                            </span>
                            <p className="font-extrabold text-foreground text-sm">
                              ~{option.totalDurationMinutes} minutos
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                              Pase escolar DMPS: 100% Gratis
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              onClick={() => handleStartNavigation(option.id)}
                              size="default"
                              className="rounded-xl font-extrabold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            >
                              <Play className="size-4 fill-white" />
                              <span>Iniciar Viaje</span>
                            </Button>

                            <Button
                              onClick={() => {
                                setSelectedOptionId(option.id);
                                toast.success(`Seleccionada ${option.routeName}`);
                              }}
                              variant={isSelected ? "secondary" : "outline"}
                              size="default"
                              className="rounded-xl font-bold text-xs"
                            >
                              {isSelected ? "Seleccionada" : "Ver pasos"}
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="text-xs font-semibold gap-1 text-primary hover:underline"
                            >
                              <a
                                href={option.officialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span>Horario oficial DART DM</span>
                                <ExternalLink className="size-3" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* INTEGRATED GOOGLE MAPS TRANSIT VIEW */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <Compass className="size-5 text-primary" aria-hidden="true" />
                  <h2 className="font-bold text-lg text-foreground">
                    Mapa en Vivo — Google Maps Tránsito
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={toggleLiveGpsTracking}
                    variant={isTrackingLiveGps ? "default" : "outline"}
                    size="sm"
                    className={`rounded-xl font-bold text-xs gap-1.5 ${
                      isTrackingLiveGps ? "bg-emerald-600 text-white" : ""
                    }`}
                  >
                    <Locate className={`size-3.5 ${isTrackingLiveGps ? "animate-pulse" : ""}`} />
                    <span>
                      {isTrackingLiveGps ? "GPS en vivo activo" : "Verificar mi posición"}
                    </span>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold text-xs gap-1 text-primary"
                  >
                    <a href={getGoogleMapsExternalUrl()} target="_blank" rel="noopener noreferrer">
                      <span>Google Maps App</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>

                  <Button
                    onClick={() => setMapReloadKey((k) => k + 1)}
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                    title="Recargar mapa de Google"
                  >
                    <RefreshCw className="size-3.5" />
                    <span className="hidden sm:inline">Recargar</span>
                  </Button>
                </div>
              </div>

              {/* GPS Location Tracker Card if Active */}
              {isTrackingLiveGps && liveLocation && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Radio className="size-4 text-emerald-500 animate-pulse shrink-0" />
                    <span>
                      <strong>Ubicación verificada por GPS:</strong> Lat{" "}
                      {liveLocation.lat.toFixed(5)}, Lon {liveLocation.lon.toFixed(5)} (Margen de
                      precisión: ±{Math.round(liveLocation.accuracy)} m)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopLiveGpsTracking}
                    className="text-[11px] underline font-bold hover:text-emerald-600"
                  >
                    Pausar GPS
                  </button>
                </div>
              )}

              {/* Google Maps Transit Iframe */}
              <div className="relative w-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <iframe
                  key={mapReloadKey}
                  src={getGoogleMapsEmbedUrl()}
                  title="Google Maps Transit DMPS"
                  width="100%"
                  height="550"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full border-0 rounded-3xl min-h-[480px] sm:min-h-[550px]"
                  style={{ border: 0, width: "100%", minHeight: "480px" }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground px-2 pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span>
                    Ruta sincronizada con Google Maps Tránsito y paradas oficiales de DART Des
                    Moines
                  </span>
                </span>
                <span className="text-[11px]">
                  Des Moines Area Regional Transit Authority (DART)
                </span>
              </div>
            </div>

            {/* DART DES MOINES (RideDART.com) OFFICIAL PORTAL CARD */}
            <Card className="rounded-3xl border border-border bg-card/80 p-5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-foreground text-sm sm:text-base">
                      Servicio Oficial DART Des Moines (RideDART)
                    </span>
                    <Badge variant="secondary" className="text-[11px] font-semibold">
                      ridedart.com
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Atención al cliente, horarios completos y alertas del sistema de transporte de
                    Greater Des Moines.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold gap-1.5"
                  >
                    <a href="https://www.ridedart.com/" target="_blank" rel="noopener noreferrer">
                      <span>Sitio Oficial DART DM</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold gap-1.5"
                  >
                    <a
                      href="https://www.ridedart.com/riding-dart/service-alerts"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <AlertCircle className="size-3 text-amber-500" />
                      <span>Alertas de Servicio</span>
                    </a>
                  </Button>

                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="rounded-xl text-xs font-bold gap-1.5"
                  >
                    <a href="tel:5152838100">
                      <Phone className="size-3 text-primary" />
                      <span>(515) 283-8100</span>
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: ROUTE CATALOG & DETAILS */}
          <TabsContent value="routes" className="space-y-6">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-4 rounded-2xl shadow-2xs">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    value={routeSearchQuery}
                    onChange={(e) => setRouteSearchQuery(e.target.value)}
                    placeholder="Buscar ruta o parada..."
                    className="rounded-xl pl-9 text-xs sm:text-sm"
                  />
                </div>

                <div className="flex rounded-xl bg-muted/60 p-1 border border-border text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setRouteSchoolFilter("current")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      routeSchoolFilter === "current"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isEast ? "East High" : "Lincoln High"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteSchoolFilter("all")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      routeSchoolFilter === "all"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Todas las Líneas
                  </button>
                </div>
              </div>

              {routeSearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRouteSearchQuery("")}
                  className="rounded-xl text-xs"
                >
                  Limpiar filtro
                </Button>
              )}
            </div>

            {/* Routes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalogRoutes.map((route) => {
                const color = getRouteColor(route.route_number);
                const isCurrentSchoolRoute =
                  route.school_id === selectedSchool.id || route.school_id === "all";

                return (
                  <Card
                    key={route.id}
                    className={`rounded-3xl border transition-all hover:shadow-md ${
                      isCurrentSchoolRoute
                        ? "border-primary/40 bg-card"
                        : "border-border/70 bg-card/60"
                    }`}
                  >
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center justify-center size-12 rounded-2xl font-black text-lg shadow-sm ${color.bg} ${color.text}`}
                          >
                            {route.route_number}
                          </span>
                          <div>
                            <CardTitle className="text-base font-extrabold text-foreground leading-tight">
                              {route.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  route.school_id === "lincoln"
                                    ? "border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-500/10"
                                    : route.school_id === "east"
                                      ? "border-rose-500/40 text-rose-700 dark:text-rose-300 bg-rose-500/10"
                                      : "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                                }`}
                              >
                                {route.school_id === "lincoln"
                                  ? "Lincoln High"
                                  : route.school_id === "east"
                                    ? "East High"
                                    : "Lincoln & East"}
                              </Badge>
                              {route.stops_count && (
                                <span className="text-[11px] text-muted-foreground">
                                  {route.stops_count} paradas
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {route.description}
                      </p>

                      {(route.direction_outbound || route.direction_inbound) && (
                        <div className="space-y-1 p-2.5 rounded-xl bg-muted/40 text-[11px] border border-border/50">
                          {route.direction_outbound && (
                            <div className="text-foreground flex items-center gap-1.5 truncate">
                              <span className="font-bold text-emerald-600 shrink-0">→ Ida:</span>
                              <span className="truncate">{route.direction_outbound}</span>
                            </div>
                          )}
                          {route.direction_inbound && (
                            <div className="text-foreground flex items-center gap-1.5 truncate">
                              <span className="font-bold text-blue-600 shrink-0">← Vuelta:</span>
                              <span className="truncate">{route.direction_inbound}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground flex items-center gap-1">
                            <Clock className="size-3 text-primary" />
                            <span>{route.frequency || "Consultar horario"}</span>
                          </div>
                          {(route.first_bus || route.last_bus) && (
                            <span className="text-[11px] text-muted-foreground">
                              {route.first_bus} – {route.last_bus}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {route.official_url && (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs"
                            >
                              <a
                                href={route.official_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span>PDF Oficial</span>
                                <ExternalLink className="ml-1 size-3" />
                              </a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveTab("planner");
                              setDestination(
                                route.school_id === "east"
                                  ? "East High School (815 E 13th St, Des Moines, IA)"
                                  : "Lincoln High School (2600 SW 9th St, Des Moines, IA)",
                              );
                            }}
                            className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
                          >
                            <span>Planificar</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 3: FREE STUDENT PASSES GUIDE */}
          <TabsContent value="passes" className="space-y-6">
            <Card className="rounded-3xl border-2 border-emerald-500/20 bg-card shadow-md overflow-hidden">
              <CardHeader className="bg-emerald-500/5 pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-extrabold text-foreground">
                      Pase Estudiantil Ilimitado y Gratuito en DART
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Convenio oficial entre Des Moines Public Schools (DMPS) y DART para alumnos de
                      Lincoln y East High.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                    <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                      1
                    </div>
                    <h4 className="font-extrabold text-sm text-foreground">
                      ¿Cómo viaja gratis mi estudiante?
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Solo debe mostrar su credencial escolar con foto emitida por Lincoln High
                      School o East High School al subir al autobús por la puerta delantera.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                    <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm">
                      2
                    </div>
                    <h4 className="font-extrabold text-sm text-foreground">
                      ¿Cuándo y dónde es válido?
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      El pase es válido los 7 días de la semana, incluyendo después de clases para
                      clubes y deportes, fines de semana y vacaciones escolares en todas las rutas
                      locales de DART.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                    <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-sm">
                      3
                    </div>
                    <h4 className="font-extrabold text-sm text-foreground">
                      ¿Extravió o dañó su credencial?
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      El estudiante debe presentarse en la oficina principal de su escuela para
                      solicitar una reposición o un pase temporal de autobús sin costo.
                    </p>
                  </div>
                </div>

                {/* Rules & safety */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <ShieldCheck className="size-4 text-amber-600" />
                    <span>Reglas de Seguridad y Convivencia en DART</span>
                  </div>
                  <ul className="text-xs space-y-1 list-disc list-inside leading-relaxed opacity-90">
                    <li>
                      Esperar el autobús sobre la banqueta al menos 5 minutos antes de la hora
                      programada.
                    </li>
                    <li>
                      Subir ordenadamente por la puerta delantera y mostrar la credencial al
                      operador.
                    </li>
                    <li>
                      Ceder los primeros asientos a personas de la tercera edad o con movilidad
                      reducida.
                    </li>
                    <li>
                      Permanecer sentado o sujetarse firmemente de los pasamanos mientras el autobús
                      esté en movimiento.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: MOBILE APPS & CONTACT */}
          <TabsContent value="apps" className="space-y-6">
            {/* Mobile apps cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* App 1: MyDART */}
              <div className="flex flex-col justify-between p-5 rounded-3xl border border-border bg-card shadow-xs gap-4">
                <div className="flex items-start gap-3.5">
                  <MyDartLogo className="size-12 shrink-0" />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-extrabold text-foreground truncate">
                        MyDART App
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 shrink-0">
                        App Oficial DART
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Planifica viajes, compra boletos familiares y revisa el saldo de tus viajes en
                      los autobuses de Des Moines.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 min-w-[105px] rounded-xl text-xs font-semibold px-2.5 gap-1.5 bg-background hover:bg-muted/50"
                  >
                    <a href={APP_LINKS.mydart.ios} target="_blank" rel="noopener noreferrer">
                      <AppleIcon className="size-3.5 shrink-0" />
                      <span className="truncate">App Store</span>
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 min-w-[105px] rounded-xl text-xs font-semibold px-2.5 gap-1.5 bg-background hover:bg-muted/50"
                  >
                    <a href={APP_LINKS.mydart.android} target="_blank" rel="noopener noreferrer">
                      <GooglePlayIcon className="size-3.5 shrink-0" />
                      <span className="truncate">Google Play</span>
                    </a>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveQrApp("mydart")}
                    variant="secondary"
                    size="sm"
                    title="Ver Código QR"
                    className="h-9 rounded-xl text-xs font-semibold px-3 gap-1 shrink-0"
                  >
                    <QrCode className="size-3.5" aria-hidden="true" />
                    <span>QR</span>
                  </Button>
                </div>
              </div>

              {/* App 2: Transit */}
              <div className="flex flex-col justify-between p-5 rounded-3xl border border-border bg-card shadow-xs gap-4">
                <div className="flex items-start gap-3.5">
                  <TransitAppLogo className="size-12 shrink-0" />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-extrabold text-foreground truncate">
                        Transit App
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20 shrink-0">
                        GPS & Navegación en Vivo
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Rastreo de autobuses en tiempo real con cuenta regresiva de llegada a tu
                      parada y navegación paso a paso.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 min-w-[105px] rounded-xl text-xs font-semibold px-2.5 gap-1.5 bg-background hover:bg-muted/50"
                  >
                    <a href={APP_LINKS.transit.ios} target="_blank" rel="noopener noreferrer">
                      <AppleIcon className="size-3.5 shrink-0" />
                      <span className="truncate">App Store</span>
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 min-w-[105px] rounded-xl text-xs font-semibold px-2.5 gap-1.5 bg-background hover:bg-muted/50"
                  >
                    <a href={APP_LINKS.transit.android} target="_blank" rel="noopener noreferrer">
                      <GooglePlayIcon className="size-3.5 shrink-0" />
                      <span className="truncate">Google Play</span>
                    </a>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveQrApp("transit")}
                    variant="secondary"
                    size="sm"
                    title="Ver Código QR"
                    className="h-9 rounded-xl text-xs font-semibold px-3 gap-1 shrink-0"
                  >
                    <QrCode className="size-3.5" aria-hidden="true" />
                    <span>QR</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* DART Customer Service & Contacts */}
            <div className="p-5 rounded-3xl border border-border bg-card shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Phone className="size-4 text-primary" />
                <span>Atención al Cliente y Contacto DART</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="font-bold text-foreground block">Teléfono de Información</span>
                  <a
                    href="tel:5152838100"
                    className="text-primary font-extrabold text-sm hover:underline"
                  >
                    (515) 283-8100
                  </a>
                  <p className="text-[11px] text-muted-foreground">
                    Lunes a Viernes 6:00 AM – 7:00 PM
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="font-bold text-foreground block">Estación Central DART</span>
                  <p className="text-foreground font-semibold">620 Cherry St, Des Moines, IA</p>
                  <p className="text-[11px] text-muted-foreground">
                    Ventanilla de atención y salas de espera
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="font-bold text-foreground block">Sitio Web Oficial</span>
                  <a
                    href="https://www.ridedart.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-bold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>ridedart.com</span>
                    <ExternalLink className="size-3" />
                  </a>
                  <p className="text-[11px] text-muted-foreground">
                    Horarios en PDF y alertas del sistema
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Verified source badge */}
        <div className="pt-2">
          <OfficialDataBadge
            sourceName="DART — Des Moines Area Regional Transit Authority"
            sourceUrl="https://www.ridedart.com"
            state="Líneas y horarios escolares verificados"
            lastSuccessAt={new Date().toISOString()}
            updateType="Convenio Escolar DMPS & Horarios DART"
          />
        </div>

        {/* Modal QR Code */}
        <Dialog open={activeQrApp !== null} onOpenChange={(open) => !open && setActiveQrApp(null)}>
          <DialogContent className="max-w-sm rounded-3xl p-6 text-center">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-lg font-bold flex items-center justify-center gap-2">
                <QrCode className="size-5 text-primary" aria-hidden="true" />
                <span>
                  {activeQrApp === "mydart" ? "Descargar MyDART App" : "Descargar Transit App"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs pt-1">
                Apunta con la cámara de tu teléfono al código QR para instalar la aplicación
                oficial.
              </DialogDescription>
            </DialogHeader>

            {activeQrApp && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  {/* iOS QR */}
                  <div className="flex flex-col items-center p-3 rounded-2xl border border-border bg-muted/20 space-y-2">
                    <span className="text-[11px] font-bold">iPhone (iOS)</span>
                    <div className="p-1.5 bg-white rounded-xl border shadow-xs">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                          APP_LINKS[activeQrApp].ios,
                        )}`}
                        alt="QR App Store"
                        width={110}
                        height={110}
                        className="size-24 object-contain rounded-md"
                      />
                    </div>
                    <a
                      href={APP_LINKS[activeQrApp].ios}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-primary underline"
                    >
                      Abrir App Store
                    </a>
                  </div>

                  {/* Android QR */}
                  <div className="flex flex-col items-center p-3 rounded-2xl border border-border bg-muted/20 space-y-2">
                    <span className="text-[11px] font-bold">Android</span>
                    <div className="p-1.5 bg-white rounded-xl border shadow-xs">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                          APP_LINKS[activeQrApp].android,
                        )}`}
                        alt="QR Google Play"
                        width={110}
                        height={110}
                        className="size-24 object-contain rounded-md"
                      />
                    </div>
                    <a
                      href={APP_LINKS[activeQrApp].android}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-primary underline"
                    >
                      Abrir Google Play
                    </a>
                  </div>
                </div>

                <Button
                  onClick={() => setActiveQrApp(null)}
                  variant="outline"
                  className="w-full rounded-xl text-xs font-semibold h-9"
                >
                  Cerrar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Help */}
        <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
          <DialogContent className="max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                <HelpCircle className="size-5 text-primary" aria-hidden="true" />
                <span>¿Cómo usar el planificador de autobús?</span>
              </DialogTitle>
              <DialogDescription className="pt-1">
                Guía paso a paso para familias de Lincoln y East High.
              </DialogDescription>
            </DialogHeader>

            <ol className="space-y-3 pt-2 text-sm text-foreground list-decimal list-inside leading-relaxed">
              <li className="p-2 rounded-xl bg-muted/40">
                Escribe tu dirección o presiona <strong>Mi ubicación</strong>.
              </li>
              <li className="p-2 rounded-xl bg-muted/40">
                Selecciona la escuela de destino (Lincoln High o East High).
              </li>
              <li className="p-2 rounded-xl bg-muted/40">
                Elige la hora en que deseas viajar o consulta la entrada y salida escolar.
              </li>
              <li className="p-2 rounded-xl bg-muted/40">
                Presiona <strong>Ver Ruta en Google Maps Tránsito</strong> para obtener la
                indicación paso a paso con número de autobús y transbordos.
              </li>
            </ol>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => setIsHelpModalOpen(false)}
                className="rounded-xl font-semibold px-5"
              >
                Entendido
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PublicShell>
  );
}

export default DartPublicPage;
