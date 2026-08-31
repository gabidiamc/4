export type GenderGroup = "Girls" | "Boys" | "Coed" | "Activity";
export type BoundCategory = "girls" | "boys" | "coed" | "extracurricular" | "girls_coop";
export type BoundActivityType = "sport" | "coop" | "extracurricular" | "club";

export type BoundStatus =
  | "En temporada"
  | "Próximamente"
  | "Fuera de temporada"
  | "Registro abierto"
  | "Registro cerrado"
  | "Sin fechas publicadas"
  | "Información pendiente de actualización";

export type BoundEventStatus =
  "Programado" | "En curso" | "Finalizado" | "Cancelado" | "Pospuesto" | "Reprogramado";

export interface BoundActivity {
  id: string;
  bound_id: string;
  name: string;
  translated_name: string | null;
  slug: string;
  category: BoundCategory;
  gender_group: GenderGroup;
  activity_type: BoundActivityType;
  official_url: string;
  registration_url: string | null;
  icon_url: string | null;
  season: "Fall" | "Winter" | "Spring" | "Summer" | "Year-Round";
  status: BoundStatus;
  is_active: boolean;
  verified_at: string;
  updated_at: string;
  levels?: string[];
}

export interface BoundTeam {
  id: string;
  activity_id: string;
  bound_team_id: string;
  name: string;
  level: "Varsity" | "Junior Varsity" | "Freshman" | "Middle School" | "Coop Varsity" | "Coop JV";
  class_name: string | null;
  conference: string | null;
  head_coach: string | null;
  official_url: string;
  season: string;
  verified_at: string;
  updated_at: string;
}

export interface BoundEvent {
  id: string;
  team_id: string;
  activity_id: string;
  bound_event_id: string;
  event_type: "game" | "meet" | "match" | "tournament" | "performance" | "event";
  opponent_or_title: string;
  starts_at: string; // ISO string
  ends_at: string | null;
  location_name: string;
  location_address: string | null;
  home_away: "Home" | "Away" | "Neutral";
  status: BoundEventStatus;
  score_display: string | null;
  ticket_url: string | null;
  official_url: string;
  verified_at: string;
  updated_at: string;
  expires_at?: string | null;
  is_active?: boolean;
}

export interface BoundPractice {
  id: string;
  team_id: string;
  bound_practice_id: string;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  status: "Programada" | "Realizada" | "Cancelada";
  official_url: string | null;
  verified_at: string;
  updated_at: string;
}

export interface BoundSyncLog {
  id: string;
  sync_type: string;
  source_url: string;
  started_at: string;
  completed_at: string;
  status: "success" | "warning" | "error";
  items_created: number;
  items_updated: number;
  error_summary: string | null;
}

export interface RegistrationSupportPerson {
  id: string;
  person_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  office: string | null;
  is_verified: boolean;
  is_visible: boolean;
  updated_at: string;
}

export interface RegistrationSettings {
  is_enabled: boolean;
  title: string;
  message: string;
  primary_button_label: string;
  secondary_button_label: string;
  registration_url: string;
  verified_at: string;
  support_persons: RegistrationSupportPerson[];
}

export const LINCOLN_BOUND_BASE_URL = "https://www.gobound.com/ia/schools/dmlincoln";
export const LINCOLN_BOUND_REGISTRATION_URL = "https://www.gobound.com/ia/schools/dmlincoln";

// Authentic Lincoln High School activities on Bound
export const INITIAL_BOUND_TEAMS: BoundTeam[] = [];

// Sample authentic events on Bound
export const INITIAL_BOUND_EVENTS: BoundEvent[] = [];

export const INITIAL_BOUND_PRACTICES: BoundPractice[] = [];

export const INITIAL_REGISTRATION_SUPPORT: RegistrationSupportPerson[] = [];

export const INITIAL_REGISTRATION_SETTINGS: RegistrationSettings = {
  is_enabled: true,
  title: "¿Quieres registrarte en un deporte o actividad?",
  message:
    "Solicita ayuda al personal escolar para completar el proceso de registro de deportes y actividades.",
  primary_button_label: "Registrarse",
  secondary_button_label: "Necesito ayuda",
  registration_url: LINCOLN_BOUND_REGISTRATION_URL,
  verified_at: new Date().toISOString(),
  support_persons: INITIAL_REGISTRATION_SUPPORT,
};

export const INITIAL_SYNC_LOGS: BoundSyncLog[] = [];

// Helper functions for reading & mutating state locally with localStorage sync
import { type SchoolId } from "@/lib/school";

export const EAST_BOUND_BASE_URL = "https://www.gobound.com/ia/schools/dmeast";
export const EAST_BOUND_REGISTRATION_URL = "https://www.gobound.com/ia/schools/dmeast";

/* Activities live in the database (table `activities`), scoped per school. */

type ActivityDbRow = {
  id: string;
  name: string;
  slug: string;
  gender: string | null;
  season: string | null;
  grades: string | null;
  enrollment_open: boolean | null;
  official_url: string | null;
  forms_url: string | null;
  image_url: string | null;
  description: string | null;
  registration_info: string | null;
  status: string | null;
  school_id: string | null;
  verified_at: string | null;
  updated_at: string | null;
};

const CATEGORY_BY_GENDER: Record<string, BoundCategory> = {
  Girls: "girls",
  Boys: "boys",
  Coed: "coed",
  Activity: "extracurricular",
};

function toBoundActivity(row: ActivityDbRow): BoundActivity {
  const gender = (row.gender ?? "Coed") as GenderGroup;
  return {
    id: row.id,
    bound_id: row.slug,
    name: row.name,
    translated_name: row.description || null,
    slug: row.slug,
    category: CATEGORY_BY_GENDER[gender] ?? "coed",
    gender_group: gender,
    activity_type: gender === "Activity" ? "extracurricular" : "sport",
    official_url: row.official_url ?? "",
    registration_url: row.forms_url ?? null,
    icon_url: row.image_url ?? null,
    season: (row.season ?? "Year-Round") as BoundActivity["season"],
    status: (row.registration_info ??
      (row.enrollment_open ? "Registro abierto" : "Registro cerrado")) as BoundStatus,
    is_active: row.status !== "archived" && row.status !== "draft",
    verified_at: row.verified_at ?? row.updated_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    levels: row.grades
      ? row.grades
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean)
      : [],
  };
}

function toActivityDbRow(a: BoundActivity, schoolId: string) {
  return {
    id: a.id,
    name: a.name,
    slug: a.slug,
    gender: a.gender_group,
    season: a.season,
    grades: (a.levels ?? []).join(", ") || null,
    enrollment_open: a.status === "Registro abierto",
    official_url: a.official_url || null,
    forms_url: a.registration_url,
    image_url: a.icon_url,
    description: a.translated_name,
    registration_info: a.status,
    status: (a.is_active ? "published" : "draft") as "published" | "draft",
    school_id: schoolId,
    verified_at: a.verified_at,
  };
}

export function getInitialTeamsForSchool(schoolId: SchoolId = "lincoln"): BoundTeam[] {
  return INITIAL_BOUND_TEAMS;
}

export function getInitialEventsForSchool(schoolId: SchoolId = "lincoln"): BoundEvent[] {
  return INITIAL_BOUND_EVENTS;
}

export function getInitialRegistrationSettingsForSchool(
  schoolId: SchoolId = "lincoln",
): RegistrationSettings {
  return INITIAL_REGISTRATION_SETTINGS;
}

const STORAGE_ACTIVITIES_KEY = "dmps_bound_activities_v5";
const STORAGE_TEAMS_KEY = "dmps_bound_teams_v3";
const STORAGE_EVENTS_KEY = "dmps_bound_events_v5";
const STORAGE_SETTINGS_KEY = "dmps_bound_registration_settings_v5";
const STORAGE_SYNC_LOGS_KEY = "dmps_bound_sync_logs_v2";

/** Helper to find raw stored string across versioned localStorage keys */
function findStoredRaw(baseKey: string, schoolId: string): string | null {
  if (typeof window === "undefined") return null;
  const targetSub = `${baseKey}_${schoolId}`;

  // 1. Direct key
  let raw = localStorage.getItem(targetSub);
  if (raw) return raw;

  // 2. Scan fallback versions
  const versions = ["v5", "v4", "v3", "v2", "v1", "v0", ""];
  for (const v of versions) {
    const k = v ? `dmps_bound_${baseKey}_${v}_${schoolId}` : `dmps_bound_${baseKey}_${schoolId}`;
    raw = localStorage.getItem(k);
    if (raw) {
      try {
        localStorage.setItem(targetSub, raw); // Migrate to current key
      } catch {
        // ignore
      }
      return raw;
    }
  }

  // 3. Scan all keys in localStorage for matching prefix
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(baseKey) && key.includes(schoolId)) {
        const item = localStorage.getItem(key);
        if (item) return item;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/** Reads the activities of one school from the database, localized when possible. */
export async function fetchActivitiesForSchool(
  schoolId: SchoolId = "lincoln",
  lang: string = "es",
): Promise<BoundActivity[]> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase
    .from("activities")
    .select(
      "id, name, slug, gender, season, grades, enrollment_open, official_url, forms_url, image_url, description, registration_info, status, school_id, verified_at, updated_at, activity_translations(language_code, name, description)",
    )
    .in("school_id", [schoolId, `sch-${schoolId}`])
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  type TrRow = { language_code: string; name: string | null; description: string | null };
  return ((data ?? []) as unknown as (ActivityDbRow & { activity_translations?: TrRow[] })[]).map(
    (row) => {
      const trs = row.activity_translations ?? [];
      const tr =
        trs.find((x) => x.language_code === lang) ?? trs.find((x) => x.language_code === "en");
      const localized = tr
        ? { ...row, name: tr.name || row.name, description: tr.description ?? row.description }
        : row;
      return toBoundActivity(localized);
    },
  );
}

/** Saves the activities of one school to the database (visible on every device). */
export async function saveActivitiesForSchool(
  activities: BoundActivity[],
  schoolId: SchoolId = "lincoln",
) {
  const { supabase } = await import("@/integrations/supabase/client");
  const rows = activities.map((a) => toActivityDbRow(a, schoolId));
  const { error } = await supabase.from("activities").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

/** Deletes one activity of a school from the database. */
export async function deleteActivity(id: string) {
  const { supabase } = await import("@/integrations/supabase/client");
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function getStoredTeams(schoolId: SchoolId = "lincoln"): BoundTeam[] {
  const initial = getInitialTeamsForSchool(schoolId);
  if (typeof window === "undefined") return initial;

  try {
    const raw = findStoredRaw("teams", schoolId);
    if (!raw) {
      const key = `${STORAGE_TEAMS_KEY}_${schoolId}`;
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }

    const storedList: BoundTeam[] = JSON.parse(raw);
    if (!Array.isArray(storedList) || storedList.length === 0) return initial;

    const mergedMap = new Map<string, BoundTeam>();
    for (const item of initial) mergedMap.set(item.id, item);
    for (const stored of storedList) {
      if (!stored.id) continue;
      const existing = mergedMap.get(stored.id);
      mergedMap.set(stored.id, existing ? { ...existing, ...stored } : stored);
    }

    const result = Array.from(mergedMap.values());
    const key = `${STORAGE_TEAMS_KEY}_${schoolId}`;
    localStorage.setItem(key, JSON.stringify(result));
    return result;
  } catch {
    return initial;
  }
}

export function saveStoredTeams(teams: BoundTeam[], schoolId: SchoolId = "lincoln") {
  if (typeof window === "undefined") return;
  try {
    const key = `${STORAGE_TEAMS_KEY}_${schoolId}`;
    localStorage.setItem(key, JSON.stringify(teams));
  } catch (e) {
    console.error("Failed to save teams:", e);
  }
}

export function getStoredEvents(schoolId: SchoolId = "lincoln"): BoundEvent[] {
  const initial = getInitialEventsForSchool(schoolId);
  if (typeof window === "undefined") return initial;

  try {
    const raw = findStoredRaw("events", schoolId);
    if (!raw) {
      const key = `${STORAGE_EVENTS_KEY}_${schoolId}`;
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }

    const storedList: BoundEvent[] = JSON.parse(raw);
    if (!Array.isArray(storedList) || storedList.length === 0) return initial;

    const mergedMap = new Map<string, BoundEvent>();
    for (const item of initial) mergedMap.set(item.id, item);
    for (const stored of storedList) {
      if (!stored.id) continue;
      const existing = mergedMap.get(stored.id);
      mergedMap.set(stored.id, existing ? { ...existing, ...stored } : stored);
    }

    const result = Array.from(mergedMap.values());
    const key = `${STORAGE_EVENTS_KEY}_${schoolId}`;
    localStorage.setItem(key, JSON.stringify(result));
    return result;
  } catch {
    return initial;
  }
}

export function saveStoredEvents(events: BoundEvent[], schoolId: SchoolId = "lincoln") {
  if (typeof window === "undefined") return;
  try {
    const key = `${STORAGE_EVENTS_KEY}_${schoolId}`;
    localStorage.setItem(key, JSON.stringify(events));
  } catch (e) {
    console.error("Failed to save events:", e);
  }
}

export function getStoredRegistrationSettings(
  schoolId: SchoolId = "lincoln",
): RegistrationSettings {
  const initial = getInitialRegistrationSettingsForSchool(schoolId);
  if (typeof window === "undefined") return initial;

  try {
    const raw = findStoredRaw("registration_settings", schoolId);
    if (!raw) {
      const key = `${STORAGE_SETTINGS_KEY}_${schoolId}`;
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }

    const stored = JSON.parse(raw);
    return { ...initial, ...stored };
  } catch {
    return initial;
  }
}

export function saveStoredRegistrationSettings(
  settings: RegistrationSettings,
  schoolId: SchoolId = "lincoln",
) {
  if (typeof window === "undefined") return;
  try {
    const key = `${STORAGE_SETTINGS_KEY}_${schoolId}`;
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

export function getStoredSyncLogs(): BoundSyncLog[] {
  if (typeof window === "undefined") return INITIAL_SYNC_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_SYNC_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_SYNC_LOGS_KEY, JSON.stringify(INITIAL_SYNC_LOGS));
      return INITIAL_SYNC_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SYNC_LOGS;
  }
}

export function saveStoredSyncLogs(logs: BoundSyncLog[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_SYNC_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save sync logs:", e);
  }
}

export function formatDateFormatted(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function formatTimeFormatted(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}
