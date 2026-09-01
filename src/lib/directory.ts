import { supabase } from "@/integrations/supabase/client";
import type { LanguageCode } from "./i18n";
import { pickTranslation } from "./content";
import { readCache, writeCache } from "./sync";
import { filterBySchool, filterBySchoolStrict } from "./school-scope";
import {
  computeContentStatus,
  isItemActive,
  isItemUpcoming,
  isRegistrationOpen,
  type ContentStatus,
} from "./content-lifecycle";

/* ---------------- appearance ---------------- */

export type AppearanceRow = {
  id: string;
  logo_url: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  logo_height: number;
  logo_alt: string | null;
  show_wordmark: boolean;
  light_theme: Record<string, string>;
  dark_theme: Record<string, string>;
};

export async function fetchAppearance(): Promise<AppearanceRow | null> {
  try {
    const { data, error } = await supabase
      .from("appearance_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (!error) {
      if (data) {
        writeCache("appearance_settings", [data]);
        return data as unknown as AppearanceRow;
      }
      return null;
    }
  } catch {
    // ignore
  }

  const cached = readCache<AppearanceRow>("appearance_settings");
  return cached?.[0] ?? null;
}

/* ---------------- schools ---------------- */

export type SchoolRow = {
  id: string;
  slug: string;
  name: string;
  level: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  website_url: string | null;
  hours: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  is_visible: boolean;
  verified_at: string | null;
  school_translations?: { language_code: string; name: string; description: string | null }[];
};

/* ---------------- schools ---------------- */

export async function fetchSchools(): Promise<SchoolRow[]> {
  try {
    const { data, error } = await supabase
      .from("schools")
      .select("*, school_translations(language_code, name, description)")
      .order("name", { ascending: true });
    if (error) return [];
    return (data ?? []) as unknown as SchoolRow[];
  } catch {
    return [];
  }
}

export async function fetchSchoolBySlug(slug: string): Promise<SchoolRow | null> {
  try {
    const { data, error } = await supabase
      .from("schools")
      .select("*, school_translations(language_code, name, description)")
      .eq("slug", slug)
      .maybeSingle();
    if (error) return null;
    return (data as unknown as SchoolRow) ?? null;
  } catch {
    return null;
  }
}

export function localizedSchool(s: SchoolRow, lang: LanguageCode) {
  const tr = pickTranslation(s.school_translations ?? [], lang) as {
    name: string;
    description: string | null;
  } | null;
  return { name: tr?.name ?? s.name, description: tr?.description ?? s.description };
}

/* ---------------- programs ---------------- */

export type ProgramRow = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  program_type: string;
  school_level: string | null;
  school_id?: string | null;
  grades: string | null;
  languages: string[];
  is_free: boolean;
  cost: string | null;
  enrollment_open: boolean;
  start_date: string | null;
  end_date: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  registration_starts_at?: string | null;
  registration_ends_at?: string | null;
  requirements: string | null;
  application_process: string | null;
  image_url: string | null;
  card_banner_url?: string | null;
  card_bg?: string | null;
  video_url: string | null;
  official_url: string | null;
  contact_id: string | null;
  category_id: string | null;
  status: string;
  archived_at?: string | null;
  timezone?: string | null;
  verified_at: string | null;
  program_translations?: {
    language_code: string;
    name: string;
    summary: string | null;
    description: string | null;
    requirements?: string | null;
    application_process?: string | null;
  }[];
};

export async function fetchPrograms(schoolId?: string): Promise<ProgramRow[]> {
  try {
    const { data, error } = await supabase
      .from("programs")
      .select("*, program_translations(language_code, name, summary, description)")
      .order("name", { ascending: true });
    if (error) return [];
    return filterBySchoolStrict((data ?? []) as unknown as ProgramRow[], schoolId);
  } catch {
    return [];
  }
}

export function localizedProgram(p: ProgramRow, lang: LanguageCode) {
  const tr = pickTranslation(p.program_translations ?? [], lang) as {
    name: string;
    summary: string | null;
    description: string | null;
    requirements?: string | null;
    application_process?: string | null;
  } | null;
  return {
    name: tr?.name ?? p.name,
    summary: tr?.summary ?? p.summary,
    description: tr?.description ?? p.description,
    requirements: tr?.requirements ?? p.requirements,
    application_process: tr?.application_process ?? p.application_process,
  };
}

/* ---------------- activities ---------------- */

export type ActivityRow = {
  id: string;
  slug: string;
  name: string;
  activity_type: string;
  season: string | null;
  school_id: string | null;
  school_level: string | null;
  grades: string | null;
  gender: string | null;
  description: string | null;
  schedule: string | null;
  location: string | null;
  requirements: string | null;
  forms_url: string | null;
  registration_info: string | null;
  official_url: string | null;
  image_url: string | null;
  contact_id: string | null;
  enrollment_open: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  registration_starts_at?: string | null;
  registration_ends_at?: string | null;
  archived_at?: string | null;
  status: string;
  updated_at: string;
  activity_translations?: { language_code: string; name: string; description: string | null }[];
};

export async function fetchActivities(schoolId?: string): Promise<ActivityRow[]> {
  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*, activity_translations(language_code, name, description)")
      .order("name", { ascending: true });
    if (error) return [];
    return filterBySchoolStrict((data ?? []) as unknown as ActivityRow[], schoolId);
  } catch {
    return [];
  }
}

export function localizedActivity(a: ActivityRow, lang: LanguageCode) {
  const tr = pickTranslation(a.activity_translations ?? [], lang) as {
    name: string;
    description: string | null;
  } | null;
  return { name: tr?.name ?? a.name, description: tr?.description ?? a.description };
}

/* ---------------- events ---------------- */

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  registration_starts_at?: string | null;
  registration_ends_at?: string | null;
  all_day: boolean;
  location: string | null;
  school_id: string | null;
  category_id: string | null;
  event_type: string;
  image_url: string | null;
  official_url: string | null;
  is_featured: boolean;
  is_cancelled: boolean;
  is_postponed?: boolean;
  status: string;
  archived_at?: string | null;
  timezone?: string | null;
  event_translations?: { language_code: string; title: string; description: string | null }[];
};

/* ---------------- events ---------------- */

export async function fetchEvents(schoolId?: string): Promise<EventRow[]> {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*, event_translations(language_code, title, description)")
      .order("start_date", { ascending: true });
    if (error) return [];
    return filterBySchool((data ?? []) as unknown as EventRow[], schoolId);
  } catch {
    return [];
  }
}

export async function fetchActiveEvents(schoolId?: string): Promise<EventRow[]> {
  const all = await fetchEvents(schoolId);
  return all.filter((e) => isItemActive(e));
}

export async function fetchUpcomingEvents(schoolId?: string): Promise<EventRow[]> {
  const all = await fetchEvents(schoolId);
  return all.filter((e) => isItemUpcoming(e) || isItemActive(e));
}

export function localizedEvent(e: EventRow, lang: LanguageCode) {
  const tr = pickTranslation(e.event_translations ?? [], lang) as {
    title: string;
    description: string | null;
  } | null;
  return { title: tr?.title ?? e.title, description: tr?.description ?? e.description };
}

/* ---------------- contacts ---------------- */

export type ContactRow = {
  id: string;
  department: string;
  person_name: string | null;
  job_title: string | null;
  phone: string | null;
  extension: string | null;
  email: string | null;
  address: string | null;
  hours: string | null;
  languages: string[];
  school_id: string | null;
  category_ids: string[];
  verification_status: string;
  verified_at: string | null;
  is_visible: boolean;
};

export type OfficialSourceRow = {
  id: string;
  name: string;
  url: string;
  source_type: string;
  category_id: string | null;
  last_reviewed_at: string | null;
  link_status: string;
  notes: string | null;
  images_allowed: boolean;
  is_verified: boolean;
};

export async function fetchContacts(schoolId?: string): Promise<ContactRow[]> {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("department", { ascending: true });
    if (error) return [];
    return filterBySchool((data ?? []) as unknown as ContactRow[], schoolId);
  } catch {
    return [];
  }
}

/* ---------------- family reports ---------------- */

export async function submitUpdateRequest(input: {
  kind: string;
  message: string;
  page_url?: string | undefined;
  entity_type?: string | undefined;
  entity_id?: string | undefined;
  reporter_email?: string | undefined;
}) {
  try {
    const { error } = await supabase.from("update_requests").insert({
      kind: input.kind,
      message: input.message.slice(0, 2000),
      page_url: input.page_url ?? null,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
      reporter_email: input.reporter_email?.slice(0, 200) || null,
    });
    if (error) console.warn("submitUpdateRequest error:", error);
  } catch (e) {
    console.warn("submitUpdateRequest exception:", e);
  }
}

/* ---------------- official sources ---------------- */

export async function fetchSources(): Promise<OfficialSourceRow[]> {
  try {
    const { data, error } = await supabase
      .from("official_sources")
      .select("*")
      .order("name", { ascending: true });
    if (error) return [];
    return (data ?? []) as unknown as OfficialSourceRow[];
  } catch {
    return [];
  }
}

export function formatEventDate(e: EventRow, lang: LanguageCode) {
  const locale = lang;
  const start = new Date(`${e.start_date}T12:00:00`);
  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  let label = fmt.format(start);
  if (e.end_date && e.end_date !== e.start_date) {
    label += ` – ${fmt.format(new Date(`${e.end_date}T12:00:00`))}`;
  }
  if (!e.all_day && e.start_time) label += ` · ${e.start_time.slice(0, 5)}`;
  return label;
}
