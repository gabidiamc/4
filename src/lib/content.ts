import { supabase } from "@/integrations/supabase/client";
import { readCache, writeCache } from "./sync";
import type { LanguageCode } from "./i18n";
import { filterBySchool, filterBySchoolStrict } from "./school-scope";
import { computeContentStatus, isItemActive } from "./content-lifecycle";
import { SEED_CATEGORIES, SEED_ARTICLES } from "./school-content-data";

export type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | {
      type: "callout";
      text: string;
      title?: string;
      variant?: "info" | "warning" | "success" | "verified";
    }
  | { type: "image"; url: string; alt?: string; caption?: string }
  | { type: "video"; url: string; caption?: string }
  | { type: "link"; url: string; label: string };

type Tr = { language_code: string } & Record<string, unknown>;

function mergeTranslations(
  embedded: Record<string, unknown>[] | undefined,
  extra: Record<string, unknown>[],
): Record<string, unknown>[] {
  const merged = [...(embedded ?? [])];
  for (const et of extra) {
    const idx = merged.findIndex((m) => m["language_code"] === et["language_code"]);
    if (idx >= 0) merged[idx] = et;
    else merged.push(et);
  }
  return merged;
}

export function pickTranslation<T extends Tr>(rows: T[] | null | undefined, lang: string) {
  if (!rows || rows.length === 0) return null;
  return (
    rows.find((r) => r.language_code === lang) ??
    rows.find((r) => r.language_code === "en") ??
    rows[0]!
  );
}

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  card_banner_url?: string | null;
  card_bg?: string | null;
  display_order: number;
  is_featured: boolean;
  is_visible: boolean;
  school_id?: string | null;
  category_translations: { language_code: string; name: string; description: string | null }[];
};

export async function fetchCategories(schoolId?: string): Promise<CategoryRow[]> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select(
        "id, slug, name, description, icon, display_order, is_featured, is_visible, category_translations(language_code, name, description)",
      )
      .order("display_order", { ascending: true });

    if (!error && data && data.length > 0) {
      writeCache("categories", data);
      return filterBySchool(data as unknown as CategoryRow[], schoolId);
    }
  } catch (err) {
    void err;
  }

  // Offline / Cache fallback: merge with category_translations if needed
  const cached = readCache<Record<string, unknown>>("categories") ?? [];
  if (cached.length > 0) {
    const trs = readCache<Record<string, unknown>>("category_translations") ?? [];
    const merged = cached.map((c) => ({
      ...c,
      category_translations: mergeTranslations(
        c["category_translations"] as Record<string, unknown>[] | undefined,
        trs.filter((t) => t["category_id"] === c["id"]),
      ),
    })) as unknown as CategoryRow[];
    return filterBySchool(merged, schoolId);
  }

  return filterBySchool(SEED_CATEGORIES, schoolId);
}

export function localizedCategory(cat: CategoryRow, lang: LanguageCode) {
  const tr = pickTranslation(cat.category_translations, lang) as {
    name: string;
    description: string | null;
  } | null;
  return { name: tr?.name ?? cat.name, description: tr?.description ?? cat.description };
}

export type ArticleRow = {
  id: string;
  slug: string;
  status: string;
  category_id: string | null;
  school_id?: string | null;
  is_featured: boolean;
  published_at: string | null;
  updated_at: string;
  featured_image_url: string | null;
  card_banner_url?: string | null;
  card_bg?: string | null;
  article_translations: {
    language_code: string;
    title: string;
    summary: string | null;
    content_blocks: Block[];
  }[];
  categories?: { slug: string; name: string } | null;
};

const ARTICLE_SELECT =
  "id, slug, status, category_id, school_id, is_featured, published_at, updated_at, featured_image_url, card_banner_url, card_bg, article_translations(language_code, title, summary, content_blocks), categories(slug, name)";

export async function fetchPublishedArticles(
  categoryId?: string,
  schoolId?: string,
): Promise<ArticleRow[]> {
  try {
    let query = supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (categoryId) query = query.eq("category_id", categoryId);
    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      const rows = (data ?? []) as unknown as ArticleRow[];
      writeCache("articles", rows);
      return filterBySchoolStrict(rows, schoolId);
    }
  } catch (err) {
    void err;
  }

  // Offline / Cache fallback: merge with article_translations and categories
  const cached = readCache<Record<string, unknown>>("articles") ?? [];
  if (cached.length > 0) {
    const trs = readCache<Record<string, unknown>>("article_translations") ?? [];
    const cats = readCache<Record<string, unknown>>("categories") ?? [];

    const merged = cached
      .filter((a) => a["status"] === "published" || !a["status"])
      .filter((a) => !categoryId || a["category_id"] === categoryId || a["slug"] === categoryId)
      .map((a) => {
        const catObj = cats.find(
          (c) => c["id"] === a["category_id"] || c["slug"] === a["category_id"],
        );
        return {
          ...a,
          categories: catObj ? { slug: catObj["slug"], name: catObj["name"] } : a["categories"],
          article_translations: mergeTranslations(
            a["article_translations"] as Record<string, unknown>[] | undefined,
            trs.filter((t) => t["article_id"] === a["id"]),
          ),
        };
      }) as unknown as ArticleRow[];

    return filterBySchoolStrict(merged, schoolId);
  }

  // Default seed fallback
  const filteredSeed = SEED_ARTICLES.filter(
    (a) => !categoryId || a.category_id === categoryId || a.slug === categoryId,
  ).map((a) => {
    const cat = SEED_CATEGORIES.find((c) => c.id === a.category_id);
    return {
      ...a,
      categories: cat ? { slug: cat.slug, name: cat.name } : null,
    };
  });

  return filterBySchoolStrict(filteredSeed, schoolId);
}

export async function fetchArticleBySlug(slug: string): Promise<ArticleRow | null> {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("slug", slug)
      .maybeSingle();
    if (!error && data) return (data as unknown as ArticleRow) ?? null;
  } catch (err) {
    void err;
  }

  const cached = readCache<Record<string, unknown>>("articles") ?? [];
  const trs = readCache<Record<string, unknown>>("article_translations") ?? [];
  const cats = readCache<Record<string, unknown>>("categories") ?? [];

  const found = cached.find((a) => a["slug"] === slug || a["id"] === slug);
  if (found) {
    const catObj = cats.find(
      (c) => c["id"] === found["category_id"] || c["slug"] === found["category_id"],
    );
    return {
      ...found,
      categories: catObj ? { slug: catObj["slug"], name: catObj["name"] } : found["categories"],
      article_translations: mergeTranslations(
        found["article_translations"] as Record<string, unknown>[] | undefined,
        trs.filter((t) => t["article_id"] === found["id"]),
      ),
    } as unknown as ArticleRow;
  }

  const seedFound = SEED_ARTICLES.find((a) => a.slug === slug || a.id === slug);
  if (seedFound) {
    const cat = SEED_CATEGORIES.find((c) => c.id === seedFound.category_id);
    return {
      ...seedFound,
      categories: cat ? { slug: cat.slug, name: cat.name } : null,
    };
  }

  return null;
}

export function adaptSchoolText(text: string, schoolId?: string): string {
  if (!text) return text;
  const currentSchool = (
    schoolId ||
    (typeof window !== "undefined"
      ? localStorage.getItem("dmps_selected_school") ||
        localStorage.getItem("dmps_selected_school_v2") ||
        "lincoln"
      : "lincoln")
  ).toLowerCase();

  if (currentSchool === "east") {
    return text
      .replace(/Abraham Lincoln High School/g, "Des Moines East High School")
      .replace(/Lincoln High School/g, "East High School")
      .replace(/Lincoln High/g, "East High")
      .replace(/Escuela Lincoln/g, "Escuela East High")
      .replace(/Lincoln Students/g, "East High Students")
      .replace(/estudiantes de Lincoln/g, "estudiantes de East High")
      .replace(/alumnos de Lincoln/g, "alumnos de East High")
      .replace(/Lincoln Main Campus/g, "East High Main Campus")
      .replace(/Railsplitters/g, "Scarlets")
      .replace(/Railsplitter/g, "Scarlet")
      .replace(/Rails Closet/g, "Scarlet Closet")
      .replace(/Rails/g, "Scarlets")
      .replace(/2600 SW 9th St, Des Moines, IA 50315/g, "815 E 13th St, Des Moines, IA 50316")
      .replace(/lincoln\.bfl\.espanol@dmschools\.org/g, "east.bfl@dmschools.org")
      .replace(/lincoln\.dmschools\.org/g, "east.dmschools.org")
      .replace(/lincolnhigh\.dmschools\.org/g, "easthigh.dmschools.org")
      .replace(/515-242-7500/g, "515-242-7788")
      .replace(/515-242-7300/g, "515-242-7790")
      .replace(/\bLincoln\b/g, "East High");
  }

  if (currentSchool === "roosevelt") {
    return text
      .replace(/Abraham Lincoln High School/g, "Theodore Roosevelt High School")
      .replace(/Lincoln High School/g, "Roosevelt High School")
      .replace(/Lincoln High/g, "Roosevelt High")
      .replace(/Escuela Lincoln/g, "Escuela Roosevelt High")
      .replace(/Lincoln Students/g, "Roosevelt Students")
      .replace(/estudiantes de Lincoln/g, "estudiantes de Roosevelt High")
      .replace(/alumnos de Lincoln/g, "alumnos de Roosevelt High")
      .replace(/Lincoln Main Campus/g, "Roosevelt Main Campus")
      .replace(/Railsplitters/g, "Roughriders")
      .replace(/Railsplitter/g, "Roughrider")
      .replace(/Rails Closet/g, "Rider Closet")
      .replace(/Rails/g, "Roughriders")
      .replace(/2600 SW 9th St, Des Moines, IA 50315/g, "4419 Center St, Des Moines, IA 50312")
      .replace(/lincoln\.bfl\.espanol@dmschools\.org/g, "roosevelt.bfl@dmschools.org")
      .replace(/lincoln\.dmschools\.org/g, "roosevelt.dmschools.org")
      .replace(/515-242-7500/g, "515-242-7272")
      .replace(/515-242-7300/g, "515-242-7275")
      .replace(/\bLincoln\b/g, "Roosevelt High");
  }

  if (currentSchool === "north") {
    return text
      .replace(/Abraham Lincoln High School/g, "North High School")
      .replace(/Lincoln High School/g, "North High School")
      .replace(/Lincoln High/g, "North High")
      .replace(/Escuela Lincoln/g, "Escuela North High")
      .replace(/Lincoln Students/g, "North High Students")
      .replace(/estudiantes de Lincoln/g, "estudiantes de North High")
      .replace(/alumnos de Lincoln/g, "alumnos de North High")
      .replace(/Lincoln Main Campus/g, "North High Main Campus")
      .replace(/Railsplitters/g, "Polar Bears")
      .replace(/Railsplitter/g, "Polar Bear")
      .replace(/Rails Closet/g, "Polar Bear Closet")
      .replace(/Rails/g, "Polar Bears")
      .replace(/2600 SW 9th St, Des Moines, IA 50315/g, "501 Holcomb Ave, Des Moines, IA 50313")
      .replace(/lincoln\.bfl\.espanol@dmschools\.org/g, "north.bfl@dmschools.org")
      .replace(/lincoln\.dmschools\.org/g, "north.dmschools.org")
      .replace(/515-242-7500/g, "515-242-7200")
      .replace(/515-242-7300/g, "515-242-7205")
      .replace(/\bLincoln\b/g, "North High");
  }

  if (currentSchool === "hoover") {
    return text
      .replace(/Abraham Lincoln High School/g, "Herbert Hoover High School")
      .replace(/Lincoln High School/g, "Hoover High School")
      .replace(/Lincoln High/g, "Hoover High")
      .replace(/Escuela Lincoln/g, "Escuela Hoover High")
      .replace(/Lincoln Students/g, "Hoover High Students")
      .replace(/estudiantes de Lincoln/g, "estudiantes de Hoover High")
      .replace(/alumnos de Lincoln/g, "alumnos de Hoover High")
      .replace(/Lincoln Main Campus/g, "Hoover Main Campus")
      .replace(/Railsplitters/g, "Huskies")
      .replace(/Railsplitter/g, "Husky")
      .replace(/Rails Closet/g, "Husky Closet")
      .replace(/Rails/g, "Huskies")
      .replace(/2600 SW 9th St, Des Moines, IA 50315/g, "4800 Aurora Ave, Des Moines, IA 50310")
      .replace(/lincoln\.bfl\.espanol@dmschools\.org/g, "hoover.bfl@dmschools.org")
      .replace(/lincoln\.dmschools\.org/g, "hoover.dmschools.org")
      .replace(/515-242-7500/g, "515-242-7300")
      .replace(/515-242-7300/g, "515-242-7305")
      .replace(/\bLincoln\b/g, "Hoover High");
  }

  if (currentSchool === "central") {
    return text
      .replace(/Abraham Lincoln High School/g, "Central Campus & Central Academy")
      .replace(/Lincoln High School/g, "Central Campus")
      .replace(/Lincoln High/g, "Central Campus")
      .replace(/Escuela Lincoln/g, "Central Campus")
      .replace(/Lincoln Students/g, "Central Campus Students")
      .replace(/estudiantes de Lincoln/g, "estudiantes de Central Campus")
      .replace(/alumnos de Lincoln/g, "alumnos de Central Campus")
      .replace(/Lincoln Main Campus/g, "Central Campus")
      .replace(/Railsplitters/g, "Trailblazers")
      .replace(/Railsplitter/g, "Trailblazer")
      .replace(/Rails Closet/g, "Central Closet")
      .replace(/Rails/g, "Trailblazers")
      .replace(/2600 SW 9th St, Des Moines, IA 50315/g, "1800 Grand Ave, Des Moines, IA 50309")
      .replace(/lincoln\.bfl\.espanol@dmschools\.org/g, "central.bfl@dmschools.org")
      .replace(/lincoln\.dmschools\.org/g, "centralcampus.dmschools.org")
      .replace(/515-242-7500/g, "515-242-7888")
      .replace(/\bLincoln\b/g, "Central Campus");
  }

  return text;
}

function adaptBlock(block: Block, schoolId?: string): Block {
  if ("text" in block && typeof block.text === "string") {
    return { ...block, text: adaptSchoolText(block.text, schoolId) };
  }
  if (block.type === "list" && Array.isArray(block.items)) {
    return { ...block, items: block.items.map((i) => adaptSchoolText(i, schoolId)) };
  }
  return block;
}

export function localizedArticle(article: ArticleRow, lang: LanguageCode, schoolId?: string) {
  const trs = article.article_translations || [];
  const exact = trs.find((t) => t.language_code === lang);
  const fallback =
    trs.find((t) => t.language_code === "es") ||
    trs.find((t) => t.language_code === "en") ||
    trs[0];
  const tr = exact || fallback;

  const rawTitle = (tr as { title?: string } | null)?.title || article.slug;
  const rawSummary = (tr as { summary?: string | null } | null)?.summary ?? null;
  const rawBlocks = ((tr as { content_blocks?: Block[] } | null)?.content_blocks ?? []) as Block[];

  return {
    title: adaptSchoolText(rawTitle, schoolId),
    summary: rawSummary ? adaptSchoolText(rawSummary, schoolId) : null,
    blocks: rawBlocks.map((b) => adaptBlock(b, schoolId)),
    isFallback: !exact,
  };
}

export type AnnouncementRow = {
  id: string;
  level: "info" | "important" | "urgent";
  status: string;
  starts_at: string;
  expires_at?: string | null;
  ends_at?: string | null;
  archived_at?: string | null;
  link_url: string | null;
  is_pinned: boolean;
  show_on_home: boolean;
  school_id?: string | null;
  timezone?: string | null;
  card_banner_url?: string | null;
  card_bg?: string | null;
  announcement_translations: { language_code: string; title: string; message: string }[];
};

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  location: string | null;
  official_url: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_cancelled: boolean;
  status: string;
  school_id?: string | null;
  category_id?: string | null;
  contact_id?: string | null;
  updated_at?: string;
  event_translations?: { language_code: string; title: string; description: string | null }[];
};

export async function fetchEvents(schoolId?: string): Promise<EventRow[]> {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, slug, title, description, event_type, start_date, end_date, start_time, end_time, all_day, location, official_url, image_url, is_featured, is_cancelled, status, school_id, category_id, contact_id, updated_at, event_translations(language_code, title, description)",
      )
      .eq("status", "published")
      .order("start_date", { ascending: true });

    if (!error && data) {
      writeCache("events", data);
      return filterBySchool(data as unknown as EventRow[], schoolId);
    }
  } catch (err) {
    void err;
  }

  const cached = readCache<Record<string, unknown>>("events") ?? [];
  const trs = readCache<Record<string, unknown>>("event_translations") ?? [];
  const merged = cached
    .filter((e) => e["status"] === "published" || !e["status"])
    .map((e) => ({
      ...e,
      event_translations: mergeTranslations(
        e["event_translations"] as Record<string, unknown>[] | undefined,
        trs.filter((t) => t["event_id"] === e["id"]),
      ),
    })) as unknown as EventRow[];

  return filterBySchool(merged, schoolId);
}

export function localizedEvent(e: EventRow, lang: LanguageCode, schoolId?: string) {
  const tr = pickTranslation(e.event_translations, lang) as {
    title: string;
    description: string | null;
  } | null;
  const title = tr?.title || e.title || "";
  const description = tr?.description || e.description || "";
  return {
    title: adaptSchoolText(title, schoolId),
    description: adaptSchoolText(description, schoolId),
  };
}

export async function fetchActiveAnnouncements(schoolId?: string): Promise<AnnouncementRow[]> {
  const isActive = (a: AnnouncementRow) => {
    const item = {
      ...a,
      ends_at: a.ends_at || a.expires_at,
    };
    return isItemActive(item);
  };

  const scoped = (rows: AnnouncementRow[]) => filterBySchool(rows.filter(isActive), schoolId);

  try {
    const { data, error } = await supabase
      .from("announcements")
      .select(
        "id, level, status, starts_at, expires_at, link_url, is_pinned, show_on_home, school_id, announcement_translations(language_code, title, message)",
      )
      .order("is_pinned", { ascending: false })
      .order("starts_at", { ascending: false });
    if (!error) {
      writeCache("announcements", data ?? []);
      return scoped((data ?? []) as unknown as AnnouncementRow[]);
    }
  } catch (err) {
    void err;
  }

  // Offline only: last successful read from this device.
  const cached = readCache<Record<string, unknown>>("announcements") ?? [];
  const trs = readCache<Record<string, unknown>>("announcement_translations") ?? [];
  const merged = cached.map((a) => ({
    ...a,
    announcement_translations: mergeTranslations(
      a["announcement_translations"] as Record<string, unknown>[] | undefined,
      trs.filter((t) => t["announcement_id"] === a["id"]),
    ),
  })) as unknown as AnnouncementRow[];
  return scoped(merged);
}

export async function fetchAllAnnouncements(schoolId?: string): Promise<AnnouncementRow[]> {
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select(
        "id, level, status, starts_at, expires_at, link_url, is_pinned, show_on_home, school_id, announcement_translations(language_code, title, message)",
      )
      .order("is_pinned", { ascending: false })
      .order("starts_at", { ascending: false });
    if (!error) {
      return filterBySchool((data ?? []) as unknown as AnnouncementRow[], schoolId);
    }
  } catch {
    // ignore
  }
  const cached = readCache<Record<string, unknown>>("announcements") ?? [];
  const trs = readCache<Record<string, unknown>>("announcement_translations") ?? [];
  const merged = cached.map((a) => ({
    ...a,
    announcement_translations: mergeTranslations(
      a["announcement_translations"] as Record<string, unknown>[] | undefined,
      trs.filter((t) => t["announcement_id"] === a["id"]),
    ),
  })) as unknown as AnnouncementRow[];
  return filterBySchool(merged, schoolId);
}

export function localizedAnnouncement(a: AnnouncementRow, lang: LanguageCode, schoolId?: string) {
  const tr = pickTranslation(a.announcement_translations, lang) as {
    title: string;
    message: string;
  } | null;
  const title = tr?.title ?? "";
  const message = tr?.message ?? "";
  return {
    title: adaptSchoolText(title, schoolId),
    message: adaptSchoolText(message, schoolId),
  };
}

export type FaqRow = {
  id: string;
  display_order: number;
  category_id: string | null;
  faq_translations: { language_code: string; question: string; answer: string }[];
};

export async function fetchFaqs(schoolId?: string): Promise<FaqRow[]> {
  try {
    const { data, error } = await supabase
      .from("faqs")
      .select(
        "id, display_order, category_id, school_id, faq_translations(language_code, question, answer)",
      )
      .eq("status", "published")
      .order("display_order", { ascending: true });
    if (!error) {
      writeCache("faqs", data ?? []);
      return filterBySchool((data ?? []) as unknown as FaqRow[], schoolId);
    }
  } catch (err) {
    void err;
  }

  // Offline only: last successful read from this device.
  const cached = readCache<Record<string, unknown>>("faqs") ?? [];
  const trs = readCache<Record<string, unknown>>("faq_translations") ?? [];
  const merged = cached
    .filter((f) => f["status"] === "published" || !f["status"])
    .map((f) => ({
      ...f,
      faq_translations: mergeTranslations(
        f["faq_translations"] as Record<string, unknown>[] | undefined,
        trs.filter((t) => t["faq_id"] === f["id"]),
      ),
    })) as unknown as FaqRow[];
  return filterBySchool(merged, schoolId);
}

export function localizedFaq(f: FaqRow, lang: LanguageCode, schoolId?: string) {
  const tr = pickTranslation(f.faq_translations, lang) as {
    question: string;
    answer: string;
  } | null;
  const question = tr?.question ?? "";
  const answer = tr?.answer ?? "";
  return {
    question: adaptSchoolText(question, schoolId),
    answer: adaptSchoolText(answer, schoolId),
  };
}

export type SiteSettings = {
  site_name: string;
  official_notice_en: string;
  official_notice_es: string;
  contact_email: string;
  contact_phone: string;
};

export async function fetchSettings(): Promise<Partial<SiteSettings>> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "general")
      .maybeSingle();
    if (error) return {};
    return (data?.value ?? {}) as Partial<SiteSettings>;
  } catch {
    return {};
  }
}

function blocksToText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "list") return b.items.join(" ");
      if ("text" in b) return b.text;
      if (b.type === "link") return b.label;
      return "";
    })
    .join(" ");
}

export function searchArticles(
  articles: ArticleRow[],
  query: string,
  lang: LanguageCode,
  categoryId?: string,
) {
  const q = query.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  return articles
    .filter((a) => !categoryId || a.category_id === categoryId)
    .map((a) => {
      const loc = localizedArticle(a, lang);
      const haystackTitle = loc.title.toLowerCase();
      const haystackBody = `${loc.summary ?? ""} ${blocksToText(loc.blocks)}`.toLowerCase();
      const allText = a.article_translations
        .map((t) => `${t.title} ${t.summary ?? ""}`)
        .join(" ")
        .toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (haystackTitle.includes(term)) score += 10;
        if (haystackBody.includes(term)) score += 4;
        if (allText.includes(term)) score += 1;
      }
      return { article: a, loc, score };
    })
    .filter((r) => terms.length === 0 || r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export async function logSearch(query: string, results: number, lang: string) {
  try {
    await supabase.from("search_analytics").insert({
      anonymous_query: query.slice(0, 160),
      results_count: results,
      language_code: lang,
    });
  } catch {
    /* analytics is best effort */
  }
}

export async function logPageView(articleId: string, lang: string) {
  try {
    await supabase.from("page_views").insert({ article_id: articleId, language_code: lang });
  } catch {
    /* analytics is best effort */
  }
}

export async function sendFeedback(articleId: string, wasHelpful: boolean) {
  await supabase.from("feedback").insert({ article_id: articleId, was_helpful: wasHelpful });
}
