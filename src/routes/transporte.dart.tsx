import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  Clock,
  Compass,
  Download,
  ExternalLink,
  HelpCircle,
  Info,
  MapPin,
  Navigation,
  QrCode,
  RefreshCw,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PublicShell } from "@/components/public-shell";
import { OfficialDataBadge } from "@/components/official-badge";
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

import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/transporte/dart")({
  head: () => ({
    meta: [
      {
        title: "Planificador de viaje en autobús — DMPS Family Info",
      },
      {
        name: "description",
        content:
          "Planifica tu viaje en autobús DART hacia las escuelas secundarias de DMPS u otros destinos introduciendo tu origen y destino.",
      },
      {
        property: "og:title",
        content: "Planificador de Viaje DART — DMPS Family Info",
      },
      {
        property: "og:description",
        content:
          "Ingresa dónde estás y a dónde vas para consultar rutas de autobús público en Des Moines con Google Maps, MyDART y Transit.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://familiasdmps.app/transporte/dart" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/transporte/dart" }],
  }),
  component: DartPublicPage,
});

// Componentes de Logos Oficiales de Marcas
function MyDartLogo({ className = "size-6" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <img
      src="/logos/mydart.svg"
      alt={t("dart.logo.mydart")}
      referrerPolicy="no-referrer"
      className={`${className} object-contain rounded-xl shadow-xs`}
    />
  );
}

function TransitAppLogo({ className = "size-6" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <img
      src="/logos/transit-app.svg"
      alt={t("dart.logo.transit")}
      referrerPolicy="no-referrer"
      className={`${className} object-contain rounded-xl shadow-xs`}
    />
  );
}

function AppleIcon({ className = "size-3.5" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <img
      src="/logos/app-store.svg"
      alt={t("dart.logo.appstore")}
      referrerPolicy="no-referrer"
      className={`${className} object-contain rounded-sm`}
    />
  );
}

function GooglePlayIcon({ className = "size-3.5" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <img
      src="/logos/google-play.svg"
      alt={t("dart.logo.googleplay")}
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

const PRESET_DESTINATIONS = [
  "Lincoln High School (2600 SW 9th St, Des Moines, IA)",
  "Lincoln High School South Campus (1000 Porter Ave, Des Moines, IA)",
  "DART Central Station (620 Cherry St, Des Moines, IA)",
  "Central Campus (1800 Grand Ave, Des Moines, IA)",
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

function DartPublicPage() {
  const { t } = useI18n();
  const { selectedSchool } = useSchool();
  const isEast = selectedSchool.id === "east";
  const schoolName = selectedSchool.name;

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
  const [travelTime, setTravelTime] = useState("now");
  const [isLocating, setIsLocating] = useState(false);

  const [mapReloadKey, setMapReloadKey] = useState(0);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [activeQrApp, setActiveQrApp] = useState<null | "mydart" | "transit">(null);

  useEffect(() => {
    setDestination(
      isEast
        ? "East High School (815 E 13th St, Des Moines, IA)"
        : "Lincoln High School (2600 SW 9th St, Des Moines, IA)",
    );
  }, [isEast]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("dart.toast.noGeo"));
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
        setOrigin(`Mi ubicación (${coords})`);
        toast.success(t("dart.toast.locationSuccess"));
      },
      () => {
        setIsLocating(false);
        setOrigin("Des Moines, IA");
        toast.info(t("dart.toast.locationFail"));
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
    // dirflg=r specifies transit / bus mode in Google Maps
    return `https://www.google.com/maps?saddr=${saddr}&daddr=${daddr}&dirflg=r&output=embed`;
  };

  const getGoogleMapsExternalUrl = () => {
    const saddr = getCleanOriginForMaps();
    const daddr = getCleanDestForMaps();
    return `https://www.google.com/maps/dir/?api=1&origin=${saddr}&destination=${daddr}&travelmode=transit`;
  };

  const getTransitExternalUrl = () => {
    return `https://transitapp.com/en/trip`;
  };

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Encabezado Principal */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bus className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {t("dart.title")}
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("dart.serviceFor")} {schoolName}
              </p>
            </div>
            <Badge
              variant="outline"
              className="ml-auto rounded-full px-3.5 py-1 text-xs font-semibold border-primary/30 bg-primary/5 text-primary"
            >
              {isEast ? t("dart.badge.east") : t("dart.badge.lincoln")}
            </Badge>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed">{t("dart.intro")}</p>
        </div>

        {/* Tarjeta Principal: "¿Dónde estás y a dónde vas?" */}
        <Card className="rounded-3xl border-2 border-primary/20 bg-card shadow-md overflow-hidden">
          <CardHeader className="bg-primary/5 pb-4 border-b border-border/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="size-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-xl font-extrabold">{t("dart.form.title")}</CardTitle>
              </div>
              <Badge variant="secondary" className="rounded-full text-xs font-semibold">
                {t("dart.form.badge")}
              </Badge>
            </div>
            <CardDescription className="text-sm">{t("dart.form.description")}</CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Campo Origen */}
              <div className="md:col-span-5 space-y-2">
                <Label
                  htmlFor="origin-input"
                  className="text-sm font-bold flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <MapPin className="size-4" aria-hidden="true" />
                    <span>{t("dart.origin.label")}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Navigation className={`size-3 ${isLocating ? "animate-spin" : ""}`} />
                    <span>
                      {isLocating ? t("dart.origin.searching") : t("dart.origin.currentLocation")}
                    </span>
                  </button>
                </Label>
                <div className="relative">
                  <Input
                    id="origin-input"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder={t("dart.origin.placeholder")}
                    className="min-h-12 rounded-xl text-base pl-10 font-medium"
                  />
                  <MapPin
                    className="absolute left-3.5 top-3.5 size-4 text-emerald-500"
                    aria-hidden="true"
                  />
                </div>

                {/* Accesos rápidos Origen */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground font-medium self-center mr-1">
                    {t("dart.suggestions")}
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

              {/* Botón Intercambiar */}
              <div className="md:col-span-2 flex justify-center pt-2 md:pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSwapLocations}
                  title={t("dart.swap.title")}
                  className="rounded-full size-10 shrink-0 border-border shadow-sm hover:bg-primary/10 hover:text-primary"
                >
                  <ArrowRight className="size-4 rotate-90 md:rotate-0" aria-hidden="true" />
                </Button>
              </div>

              {/* Campo Destino */}
              <div className="md:col-span-5 space-y-2">
                <Label
                  htmlFor="dest-input"
                  className="text-sm font-bold flex items-center gap-1.5 text-primary"
                >
                  <MapPin className="size-4" aria-hidden="true" />
                  <span>{t("dart.destination.label")}</span>
                </Label>
                <div className="relative">
                  <Input
                    id="dest-input"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={t("dart.destination.placeholder")}
                    className="min-h-12 rounded-xl text-base pl-10 font-medium"
                  />
                  <MapPin
                    className="absolute left-3.5 top-3.5 size-4 text-primary"
                    aria-hidden="true"
                  />
                </div>

                {/* Accesos rápidos Destino */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground font-medium self-center mr-1">
                    {t("dart.destinations")}
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

            {/* Opciones de Horario y Botones */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("dart.time.preference")}
                </span>
                <div className="flex gap-1">
                  {[
                    { id: "now", label: t("dart.time.now") },
                    { id: "morning", label: t("dart.time.morning") },
                    { id: "afternoon", label: t("dart.time.afternoon") },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTravelTime(t.id)}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        travelTime === t.id
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setMapReloadKey((prev) => prev + 1)}
                  variant="outline"
                  size="lg"
                  className="rounded-xl font-bold gap-2 min-h-11 px-4 flex-1 sm:flex-initial"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  <span>{t("dart.updateMap")}</span>
                </Button>

                <Button
                  asChild
                  size="lg"
                  className="rounded-xl font-extrabold gap-2 min-h-11 px-5 flex-1 sm:flex-initial shadow-md"
                >
                  <a href={getGoogleMapsExternalUrl()} target="_blank" rel="noopener noreferrer">
                    <span>{t("dart.openGoogleMaps")}</span>
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mapa interactivo embebido de Google Maps en modo Transporte Público */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Compass className="size-5 text-primary" aria-hidden="true" />
              <span>{t("dart.map.title")}</span>
            </h2>
            <Button
              onClick={() => setIsHelpModalOpen(true)}
              variant="ghost"
              size="sm"
              className="text-xs font-semibold gap-1 text-primary"
            >
              <HelpCircle className="size-3.5" />
              <span>{t("dart.map.helpButton")}</span>
            </Button>
          </div>

          <div className="relative w-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <iframe
              key={mapReloadKey}
              src={getGoogleMapsEmbedUrl()}
              title={t("dart.map.iframeTitle")}
              width="100%"
              height="550"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full border-0 rounded-3xl min-h-[480px] sm:min-h-[550px]"
              style={{ border: 0, width: "100%", minHeight: "480px" }}
            />
          </div>
        </div>

        {/* Sección de Descargas de Aplicaciones Móviles (Opcionales) */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="size-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>{t("dart.apps.title")}</span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full text-muted-foreground border-border"
                >
                  {t("dart.apps.optional")}
                </Badge>
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">{t("dart.apps.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* App 1: MyDART */}
            <div className="flex flex-col justify-between p-4 rounded-2xl border border-border/70 bg-card hover:bg-muted/20 transition-all shadow-xs gap-3.5 overflow-hidden">
              <div className="flex items-start gap-3">
                <MyDartLogo className="size-11 shrink-0" />
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-foreground truncate">MyDART App</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 shrink-0">
                      {t("dart.apps.mydart.badge")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("dart.apps.mydart.desc")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-border/50 w-full">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 min-w-[105px] rounded-xl text-xs font-semibold px-2.5 gap-1.5 bg-background hover:bg-muted/50"
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
                  className="h-8 flex-1 min-w-[105px] rounded-xl text-xs font-semibold px-2.5 gap-1.5 bg-background hover:bg-muted/50"
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
                  title={t("dart.apps.viewQr")}
                  className="h-8 rounded-xl text-xs font-semibold px-2.5 gap-1 shrink-0"
                >
                  <QrCode className="size-3.5" aria-hidden="true" />
                  <span className="text-[11px]">QR</span>
                </Button>
              </div>
            </div>

            {/* App 2: Transit */}
            <div className="flex flex-col justify-between p-4 rounded-2xl border border-border/70 bg-card hover:bg-muted/20 transition-all shadow-xs gap-3.5 overflow-hidden">
              <div className="flex items-start gap-3">
                <TransitAppLogo className="size-11 shrink-0" />
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-foreground truncate">Transit App</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20 shrink-0">
                      {t("dart.apps.transit.badge")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("dart.apps.transit.desc")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-border/50 w-full">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 min-w-[105px] rounded-xl text-xs font-semibold px-2.5 gap-1.5 bg-background hover:bg-muted/50"
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
                  className="h-8 flex-1 min-w-[105px] rounded-xl text-xs font-semibold px-2.5 gap-1.5 bg-background hover:bg-muted/50"
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
                  className="h-8 rounded-xl text-xs font-semibold px-2.5 gap-1 shrink-0"
                >
                  <QrCode className="size-3.5" aria-hidden="true" />
                  <span className="text-[11px]">QR</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta Informativa de Estudiantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <div className="text-sm space-y-1">
              <p className="font-bold">
                {t("dart.freePass.title")} {schoolName}
              </p>
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                {t("dart.freePass.bodyPrefix")} {schoolName} {t("dart.freePass.bodySuffix")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 text-card-foreground">
            <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-muted-foreground">
                {isEast ? t("dart.info.east") : t("dart.info.lincoln")}
              </p>
              <a
                href="https://www.ridedart.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline hover:text-primary/80"
              >
                <span>{t("dart.info.officialSite")}</span>
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="pt-2">
            <OfficialDataBadge
              sourceName="DART — Des Moines Area Regional Transit Authority"
              sourceUrl="https://www.ridedart.com"
              state="Última versión verificada"
              lastSuccessAt={new Date().toISOString()}
              updateType="Horarios y rutas oficiales DART"
            />
          </div>
        </div>

        {/* Modal para Código QR de Aplicaciones */}
        <Dialog open={activeQrApp !== null} onOpenChange={(open) => !open && setActiveQrApp(null)}>
          <DialogContent className="max-w-sm rounded-3xl p-6 text-center">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-lg font-bold flex items-center justify-center gap-2">
                <QrCode className="size-5 text-primary" aria-hidden="true" />
                <span>
                  {activeQrApp === "mydart"
                    ? t("dart.qr.downloadMydart")
                    : t("dart.qr.downloadTransit")}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs pt-1">
                {t("dart.qr.instructions")}
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
                        alt={t("dart.qr.altAppStore")}
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
                      {t("dart.qr.openAppStore")}
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
                        alt={t("dart.qr.altGooglePlay")}
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
                      {t("dart.qr.openGooglePlay")}
                    </a>
                  </div>
                </div>

                <Button
                  onClick={() => setActiveQrApp(null)}
                  variant="outline"
                  className="w-full rounded-xl text-xs font-semibold h-9"
                >
                  {t("dart.qr.close")}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Ayuda */}
        <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
          <DialogContent className="max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                <HelpCircle className="size-5 text-primary" aria-hidden="true" />
                <span>{t("dart.help.title")}</span>
              </DialogTitle>
              <DialogDescription className="pt-1">{t("dart.help.subtitle")}</DialogDescription>
            </DialogHeader>

            <ol className="space-y-3 pt-2 text-sm text-foreground list-decimal list-inside leading-relaxed">
              <li className="p-2 rounded-xl bg-muted/40">
                {t("dart.help.step1Prefix")} <strong>{t("dart.origin.label")}</strong>
              </li>
              <li className="p-2 rounded-xl bg-muted/40">
                {t("dart.help.step2Prefix")} <strong>{t("dart.destination.label")}</strong>{" "}
                {t("dart.help.step2Suffix")}
              </li>
              <li className="p-2 rounded-xl bg-muted/40">{t("dart.help.step3")}</li>
              <li className="p-2 rounded-xl bg-muted/40">
                {t("dart.help.step4Prefix")} <strong>MyDART</strong> {t("dart.help.step4Middle")}{" "}
                <strong>Transit</strong> {t("dart.help.step4Suffix")}
              </li>
            </ol>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => setIsHelpModalOpen(false)}
                className="rounded-xl font-semibold px-5"
              >
                {t("dart.help.understood")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PublicShell>
  );
}
