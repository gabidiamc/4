/**
 * Shared, client-safe types and helpers for the DART public-transit integration.
 * No secrets and no server-only imports live in this file.
 */

export const DART_OFFICIAL_URL = "https://www.ridedart.com/";

/** Realtime data older than this is considered stale and is never shown as live. */
export const REALTIME_MAX_AGE_SECONDS = 180;

export const DART_FEED_KEYS = [
  "gtfs_static",
  "vehicle_positions",
  "trip_updates",
  "service_alerts",
] as const;
export type DartFeedKey = (typeof DART_FEED_KEYS)[number];

export const DART_FEED_LABEL: Record<DartFeedKey, string> = {
  gtfs_static: "GTFS estático (rutas, paradas y horarios)",
  vehicle_positions: "Posiciones de vehículos en tiempo real",
  trip_updates: "Actualizaciones de viajes en tiempo real",
  service_alerts: "Alertas de servicio",
};

export const DART_SECRET_NAME: Record<DartFeedKey, string> = {
  gtfs_static: "DART_GTFS_STATIC_URL",
  vehicle_positions: "DART_GTFS_VEHICLE_POSITIONS_URL",
  trip_updates: "DART_GTFS_TRIP_UPDATES_URL",
  service_alerts: "DART_GTFS_ALERTS_URL",
};

export type DartFeedStatus = {
  feed_key: string;
  configured: boolean;
  connected: boolean;
  last_success_at: string | null;
  last_attempt_at: string | null;
  last_feed_timestamp: string | null;
  last_error: string | null;
  record_count: number;
};

export type GeoPlace = {
  label: string;
  latitude: number;
  longitude: number;
};

export type PlanLeg =
  | {
      mode: "walk";
      seconds: number;
      meters: number;
      from: string;
      to: string;
      fromLat: number;
      fromLon: number;
      toLat: number;
      toLon: number;
    }
  | {
      mode: "bus";
      routeId: string;
      routeShortName: string | null;
      routeLongName: string | null;
      routeColor: string | null;
      routeTextColor: string | null;
      tripId: string;
      headsign: string | null;
      wheelchairAccessible: boolean | null;
      boardStopId: string;
      boardStopName: string;
      boardLat: number;
      boardLon: number;
      alightStopId: string;
      alightStopName: string;
      alightLat: number;
      alightLon: number;
      /** Seconds after midnight, from the official GTFS schedule. */
      scheduledDepartureSeconds: number;
      scheduledArrivalSeconds: number;
      /** Realtime prediction, only present when a fresh feed provided it. */
      realtimeDepartureSeconds: number | null;
      realtimeArrivalSeconds: number | null;
      delaySeconds: number | null;
      stopCount: number;
      shapeId: string | null;
    };

export type PlanItinerary = {
  id: string;
  kind: "recommended" | "fastest" | "least_walking";
  legs: PlanLeg[];
  departureSeconds: number;
  arrivalSeconds: number;
  totalSeconds: number;
  walkSeconds: number;
  transfers: number;
  usesRealtime: boolean;
  alertIds: string[];
};

export type ServiceAlert = {
  alert_id: string;
  header_text: string | null;
  description_text: string | null;
  effect: string | null;
  cause: string | null;
  severity_level: string | null;
  url: string | null;
  active_from: string | null;
  active_until: string | null;
  informed_routes: string[];
  informed_stops: string[];
};

export type NearbyStop = {
  stop_id: string;
  stop_name: string;
  stop_code: string | null;
  stop_lat: number;
  stop_lon: number;
  wheelchair_boarding: number | null;
  meters: number;
  walkMinutes: number;
  routes: {
    routeId: string;
    shortName: string | null;
    longName: string | null;
    color: string | null;
  }[];
  arrivals: {
    routeShortName: string | null;
    headsign: string | null;
    minutes: number;
    realtime: boolean;
  }[];
};

export type VehiclePosition = {
  vehicle_id: string;
  route_id: string | null;
  trip_id: string | null;
  latitude: number | null;
  longitude: number | null;
  bearing: number | null;
  feed_timestamp: string | null;
  speed?: number | null;
  current_status?: string | null;
  occupancy_status?: string | null;
  stop_id?: string | null;
  vehicle_label?: string | null;
  direction_id?: number | null;
};

/** Duration of a leg in seconds, for both walking and bus legs. */
export function legSeconds(leg: PlanLeg): number {
  return leg.mode === "walk"
    ? leg.seconds
    : Math.max(
        0,
        (leg.realtimeArrivalSeconds ?? leg.scheduledArrivalSeconds) -
          (leg.realtimeDepartureSeconds ?? leg.scheduledDepartureSeconds),
      );
}

export type PlanResponse = {
  ok: boolean;
  itineraries: PlanItinerary[];
  alerts: ServiceAlert[];
  realtimeAvailable: boolean;
  realtimeUpdatedAt: string | null;
  scheduleOnly: boolean;
  serviceDate: string;
  message?: string;
  errorCode?:
    | "feeds_missing"
    | "no_schedule"
    | "no_trips"
    | "no_stops_near_origin"
    | "no_stops_near_destination";
};

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                   */
/* ------------------------------------------------------------------ */

export function secondsToClock(seconds: number, locale = "es-US"): string {
  const s = ((seconds % 86400) + 86400) % 86400;
  const d = new Date(Date.UTC(2000, 0, 1, Math.floor(s / 3600), Math.floor((s % 3600) / 60)));
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d);
}

export function formatDuration(seconds: number): string {
  const total = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function minutesFromSeconds(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

export function routeLabel(shortName: string | null, longName: string | null): string {
  if (shortName && longName) return `${shortName} — ${longName}`;
  return shortName ?? longName ?? "Ruta DART";
}

export function normalizeHexColor(color: string | null | undefined): string | null {
  if (!color) return null;
  const c = color.replace("#", "").trim();
  return /^[0-9a-fA-F]{6}$/.test(c) ? `#${c}` : null;
}

export function isRealtimeFresh(timestamp: string | null | undefined): boolean {
  if (!timestamp) return false;
  const age = (Date.now() - new Date(timestamp).getTime()) / 1000;
  return age >= 0 && age <= REALTIME_MAX_AGE_SECONDS;
}

export function dataAgeLabel(timestamp: string | null | undefined): string {
  if (!timestamp) return "Sin datos";
  const seconds = Math.round((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `Hace ${Math.max(0, seconds)} s`;
  if (seconds < 3600) return `Hace ${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.round(seconds / 3600)} h`;
  return `Hace ${Math.round(seconds / 86400)} días`;
}

/** Plain-language instruction for one leg of the trip. */
export function legInstruction(leg: PlanLeg, locale = "es-US"): string {
  if (leg.mode === "walk") {
    return `Camina ${minutesFromSeconds(leg.seconds)} minutos hasta ${leg.to}.`;
  }
  const dep = leg.realtimeDepartureSeconds ?? leg.scheduledDepartureSeconds;
  return `Toma el autobús ${routeLabel(leg.routeShortName, leg.routeLongName)} a las ${secondsToClock(dep, locale)} en ${leg.boardStopName} y baja en ${leg.alightStopName}.`;
}

/* ------------------------------------------------------------------ */
/* DART Official Planner Configuration                                 */
/* ------------------------------------------------------------------ */

export type DartPlannerStatus = "funciona" | "bloqueado" | "pendiente";

export type DartPlannerConfig = {
  plannerUrl: string;
  widgetUrl: string;
  iframeEnabled: boolean;
  externalButtonEnabled: boolean;
  infoText: string;
  verifiedDomain: string;
  heightDesktop: number;
  heightMobile: number;
  lastTestedAt: string | null;
  lastReviewedAt: string | null;
  lastError: string | null;
  status: DartPlannerStatus;
};

export const DEFAULT_DART_PLANNER_CONFIG: DartPlannerConfig = {
  plannerUrl: "https://transitapp.com/en/trip",
  widgetUrl: "",
  iframeEnabled: true,
  externalButtonEnabled: true,
  infoText:
    "Busca una ruta de transporte público desde tu ubicación hasta Lincoln High School u otro destino.",
  verifiedDomain: "transitapp.com",
  heightDesktop: 780,
  heightMobile: 720,
  lastTestedAt: null,
  lastReviewedAt: null,
  lastError: null,
  status: "pendiente",
};

const DART_CONFIG_STORAGE_KEY = "dmps_dart_planner_config_v2";

export function getDartPlannerConfig(): DartPlannerConfig {
  if (typeof window === "undefined") {
    return DEFAULT_DART_PLANNER_CONFIG;
  }
  try {
    const raw = localStorage.getItem(DART_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_DART_PLANNER_CONFIG;
    const parsed = JSON.parse(raw) as Partial<DartPlannerConfig>;
    return {
      plannerUrl: parsed.plannerUrl || DEFAULT_DART_PLANNER_CONFIG.plannerUrl,
      widgetUrl: parsed.widgetUrl ?? DEFAULT_DART_PLANNER_CONFIG.widgetUrl,
      iframeEnabled: parsed.iframeEnabled ?? DEFAULT_DART_PLANNER_CONFIG.iframeEnabled,
      externalButtonEnabled:
        parsed.externalButtonEnabled ?? DEFAULT_DART_PLANNER_CONFIG.externalButtonEnabled,
      infoText: parsed.infoText || DEFAULT_DART_PLANNER_CONFIG.infoText,
      verifiedDomain: parsed.verifiedDomain || DEFAULT_DART_PLANNER_CONFIG.verifiedDomain,
      heightDesktop: Number(parsed.heightDesktop) || DEFAULT_DART_PLANNER_CONFIG.heightDesktop,
      heightMobile: Number(parsed.heightMobile) || DEFAULT_DART_PLANNER_CONFIG.heightMobile,
      lastTestedAt: parsed.lastTestedAt || null,
      lastReviewedAt: parsed.lastReviewedAt || null,
      lastError: parsed.lastError || null,
      status: parsed.status || DEFAULT_DART_PLANNER_CONFIG.status,
    };
  } catch {
    return DEFAULT_DART_PLANNER_CONFIG;
  }
}

export function saveDartPlannerConfig(config: DartPlannerConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DART_CONFIG_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("dart_config_updated"));
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/* DART Routes Data Model & Storage Helpers                           */
/* ------------------------------------------------------------------ */

export type DartRouteItem = {
  id: string;
  route_number: string;
  name: string;
  school_id: string;
  description: string;
  direction_outbound?: string | null;
  direction_inbound?: string | null;
  frequency?: string | null;
  first_bus?: string | null;
  last_bus?: string | null;
  stops_count?: number | null;
  official_url?: string | null;
  is_active: boolean;
  display_order?: number;
};

export const DEFAULT_DART_ROUTES: DartRouteItem[] = [
  {
    id: "dart-rt-7",
    route_number: "7",
    name: "Ruta 7 — Fort Des Moines / SW 9th",
    school_id: "lincoln",
    description: "Servicio directo a la entrada principal de Lincoln High School por SW 9th St.",
    direction_outbound: "Hacia Southridge Mall vía SW 9th",
    direction_inbound: "Hacia DART Central Station (Downtown)",
    frequency: "Cada 20 min en horas pico escolares",
    first_bus: "05:45 AM",
    last_bus: "10:15 PM",
    stops_count: 32,
    official_url: "https://www.ridedart.com/routes/local/7-fort-des-moines",
    is_active: true,
    display_order: 10,
  },
  {
    id: "dart-rt-8",
    route_number: "8",
    name: "Ruta 8 — Fleur Drive / South Campus",
    school_id: "lincoln",
    description: "Conexión sur para Lincoln High y Lincoln South Campus vía Fleur Dr y Bell Ave.",
    direction_outbound: "Hacia Des Moines Airport / Southridge",
    direction_inbound: "Hacia DART Central Station (Downtown)",
    frequency: "Cada 30 min",
    first_bus: "06:00 AM",
    last_bus: "09:30 PM",
    stops_count: 28,
    official_url: "https://www.ridedart.com/routes/local/8-fleur-drive",
    is_active: true,
    display_order: 20,
  },
  {
    id: "dart-rt-1",
    route_number: "1",
    name: "Ruta 1 — Fairgrounds / E University",
    school_id: "east",
    description:
      "Servicio directo hacia East High School por E University Ave, a pasos de Williams Stadium.",
    direction_outbound: "Hacia Iowa State Fairgrounds",
    direction_inbound: "Hacia DART Central Station (Downtown)",
    frequency: "Cada 20 min en horas pico escolares",
    first_bus: "05:50 AM",
    last_bus: "10:30 PM",
    stops_count: 35,
    official_url: "https://www.ridedart.com/routes/local/1-fairgrounds",
    is_active: true,
    display_order: 30,
  },
  {
    id: "dart-rt-17",
    route_number: "17",
    name: "Ruta 17 — Hubbell Ave / East 14th",
    school_id: "east",
    description: "Conecta el noreste de Des Moines y E 14th St con las inmediaciones de East High.",
    direction_outbound: "Hacia Altoona / Hubbell Ave",
    direction_inbound: "Hacia DART Central Station (Downtown)",
    frequency: "Cada 20 min en horas pico",
    first_bus: "06:00 AM",
    last_bus: "09:45 PM",
    stops_count: 30,
    official_url: "https://www.ridedart.com/routes/local/17-hubbell-ave",
    is_active: true,
    display_order: 40,
  },
  {
    id: "dart-rt-6",
    route_number: "6",
    name: "Ruta 6 — Indianola Ave",
    school_id: "lincoln",
    description:
      "Acceso al sureste y vecindarios del sur hacia Lincoln High School y DART Central Station.",
    direction_outbound: "Hacia Southridge Mall vía Indianola Ave",
    direction_inbound: "Hacia DART Central Station (Downtown)",
    frequency: "Cada 30 min",
    first_bus: "06:15 AM",
    last_bus: "08:45 PM",
    stops_count: 26,
    official_url: "https://www.ridedart.com/routes/local/6-indianola-ave",
    is_active: true,
    display_order: 50,
  },
  {
    id: "dart-rt-15",
    route_number: "15",
    name: "Ruta 15 — Park Ave",
    school_id: "lincoln",
    description: "Conexión este-oeste entre SW 9th, Bell Ave y el corredor de Park Ave.",
    direction_outbound: "Hacia Valley Junction",
    direction_inbound: "Hacia DART Central Station (Downtown)",
    frequency: "Cada 35 min",
    first_bus: "06:30 AM",
    last_bus: "08:30 PM",
    stops_count: 24,
    official_url: "https://www.ridedart.com/routes/local/15-park-ave",
    is_active: true,
    display_order: 60,
  },
];

export async function fetchDartRoutes(schoolId?: string): Promise<DartRouteItem[]> {
  try {
    const res = await fetch("/api/storage/dart_routes");
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        let items: DartRouteItem[] = json.data.map((r: Record<string, unknown>) => ({
          id: String(r.id),
          route_number: String(r.route_number ?? ""),
          name: String(r.name ?? ""),
          school_id: String(r.school_id ?? "all"),
          description: String(r.description ?? ""),
          direction_outbound: (r.direction_outbound as string | null) ?? null,
          direction_inbound: (r.direction_inbound as string | null) ?? null,
          frequency: (r.frequency as string | null) ?? null,
          first_bus: (r.first_bus as string | null) ?? null,
          last_bus: (r.last_bus as string | null) ?? null,
          stops_count: r.stops_count ? Number(r.stops_count) : null,
          official_url: (r.official_url as string | null) ?? null,
          is_active: r.is_active !== false,
          display_order: r.display_order ? Number(r.display_order) : 99,
        }));

        items.sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));

        if (schoolId && schoolId !== "all") {
          items = items.filter((r) => r.school_id === schoolId || r.school_id === "all");
        }
        return items;
      }
    }
  } catch (err) {
    console.warn("[DART] Error fetching dart_routes from api:", err);
  }

  // Fallback to DEFAULT_DART_ROUTES
  if (schoolId && schoolId !== "all") {
    return DEFAULT_DART_ROUTES.filter((r) => r.school_id === schoolId || r.school_id === "all");
  }
  return DEFAULT_DART_ROUTES;
}

/* ------------------------------------------------------------------ */
/* DART Service Alerts & Notices                                      */
/* ------------------------------------------------------------------ */

export type DartAlertConfig = {
  enabled: boolean;
  type: "normal" | "delay" | "snow_route" | "detour";
  title: string;
  message: string;
  updatedAt: string;
};

export const DEFAULT_DART_ALERT: DartAlertConfig = {
  enabled: true,
  type: "normal",
  title: "Servicio Regular en Rutas Escolares",
  message:
    "Todas las rutas DART hacia Lincoln High School y East High School operan con horario normal. Recuerda llevar tu credencial estudiantil vigente.",
  updatedAt: new Date().toLocaleDateString("es-US", { dateStyle: "medium" }),
};

const DART_ALERT_STORAGE_KEY = "dmps_dart_service_alert_v1";

export function getDartAlertConfig(): DartAlertConfig {
  if (typeof window === "undefined") {
    return DEFAULT_DART_ALERT;
  }
  try {
    const raw = localStorage.getItem(DART_ALERT_STORAGE_KEY);
    if (!raw) return DEFAULT_DART_ALERT;
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed.enabled ?? DEFAULT_DART_ALERT.enabled,
      type: parsed.type || DEFAULT_DART_ALERT.type,
      title: parsed.title || DEFAULT_DART_ALERT.title,
      message: parsed.message || DEFAULT_DART_ALERT.message,
      updatedAt: parsed.updatedAt || DEFAULT_DART_ALERT.updatedAt,
    };
  } catch {
    return DEFAULT_DART_ALERT;
  }
}

export function saveDartAlertConfig(alert: DartAlertConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DART_ALERT_STORAGE_KEY, JSON.stringify(alert));
    window.dispatchEvent(new Event("dart_alert_updated"));
  } catch {
    // ignore
  }
}
