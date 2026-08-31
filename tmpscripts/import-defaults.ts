/**
 * One-time import: moves the starter content that lived in the frontend source
 * into the real database, so the admin panel and the public site share one source of truth.
 */
import * as fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { normalizeSchoolId } from "../src/lib/school-scope";

const db = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
  auth: { persistSession: false },
});

const defaults = JSON.parse(await fs.readFile("/tmp/defaults.json", "utf-8")) as Record<
  string,
  Record<string, unknown>[]
>;

const columnsCache = new Map<string, Set<string>>();
async function columns(table: string): Promise<Set<string>> {
  if (columnsCache.has(table)) return columnsCache.get(table)!;
  const { data, error } = await db.from(table).select("*").limit(1);
  if (error) throw new Error(`${table}: ${error.message}`);
  // Fall back to a probe insert-less approach: use PostgREST OpenAPI when table is empty
  let cols: string[];
  if (data && data.length > 0) cols = Object.keys(data[0]!);
  else {
    const res = await fetch(
      `${process.env["SUPABASE_URL"]}/rest/v1/?apikey=${process.env["SUPABASE_SERVICE_ROLE_KEY"]}`,
    );
    const spec = (await res.json()) as {
      definitions: Record<string, { properties: Record<string, unknown> }>;
    };
    cols = Object.keys(spec.definitions[table]?.properties ?? {});
  }
  const set = new Set(cols);
  columnsCache.set(table, set);
  return set;
}

const STATUS_TABLES = new Set([
  "articles",
  "announcements",
  "faqs",
  "programs",
  "events",
  "activities",
]);

const VALID_STATUS = new Set(["draft", "in_review", "scheduled", "published", "archived"]);

function normalizeStatus(value: unknown): string {
  const raw = String(value ?? "").toLowerCase();
  return VALID_STATUS.has(raw) ? raw : "published";
}

const TR_FK: Record<string, string> = {
  article_translations: "article_id",
  category_translations: "category_id",
  announcement_translations: "announcement_id",
  faq_translations: "faq_id",
  school_translations: "school_id",
  program_translations: "program_id",
  event_translations: "event_id",
  activity_translations: "activity_id",
};

async function upsert(table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const cols = await columns(table);
  const parents: Record<string, unknown>[] = [];
  const translations: Record<string, Record<string, unknown>[]> = {};

  for (const row of rows) {
    const parent: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key.endsWith("_translations") && Array.isArray(value)) {
        const fk = TR_FK[key];
        if (!fk) continue;
        translations[key] = translations[key] ?? [];
        for (const tr of value as Record<string, unknown>[]) {
          translations[key]!.push({
            id: `tr_${row["id"]}_${tr["language_code"]}`,
            ...tr,
            [fk]: row["id"],
          });
        }
        continue;
      }
      if (!cols.has(key)) continue;
      if (key === "school_id") parent[key] = normalizeSchoolId(value);
      else if (key === "status" && STATUS_TABLES.has(table)) parent[key] = normalizeStatus(value);
      else parent[key] = value;
    }
    parents.push(parent);
  }

  const { error } = await db.from(table).upsert(parents, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`${table}: ${parents.length}`);

  for (const [trTable, trRows] of Object.entries(translations)) {
    const trCols = await columns(trTable);
    const cleaned = trRows.map((r) =>
      Object.fromEntries(Object.entries(r).filter(([k]) => trCols.has(k))),
    );
    const { error: trError } = await db.from(trTable).upsert(cleaned, { onConflict: "id" });
    if (trError) throw new Error(`${trTable}: ${trError.message}`);
    console.log(`  ${trTable}: ${cleaned.length}`);
  }
}

// --- schools: DB already holds canonical lincoln/east; import any extra ones by slug
const existing = new Set(
  ((await db.from("schools").select("id")).data ?? []).map((s: { id: string }) => s.id),
);
const extraSchools = (defaults["schools"] ?? [])
  .map((s) => ({ ...s, id: normalizeSchoolId(s["id"]) ?? String(s["slug"]) }))
  .filter((s) => !existing.has(String(s["id"])))
  .map((s) => ({ ...s, level: normalizeLevel(s["level"]) }));

function normalizeLevel(level: unknown): string {
  const raw = String(level ?? "").toLowerCase();
  if (raw.includes("high")) return "high";
  if (raw.includes("middle")) return "middle";
  if (raw.includes("elementary") || raw.includes("primar")) return "elementary";
  return "high";
}

await upsert("schools", extraSchools);
await upsert("categories", defaults["categories"] ?? []);
await upsert("official_sources", defaults["sources"] ?? []);
await upsert("contacts", defaults["contacts"] ?? []);
await upsert("articles", defaults["articles"] ?? []);
await upsert("announcements", defaults["announcements"] ?? []);
await upsert(
  "faqs",
  (defaults["faqs"] ?? []).map((f) => ({ status: "published", ...f })),
);
const contactIds = new Set((defaults["contacts"] ?? []).map((c) => String(c["id"])));
const dropMissingContact = (rows: Record<string, unknown>[]) =>
  rows.map((r) =>
    r["contact_id"] && !contactIds.has(String(r["contact_id"])) ? { ...r, contact_id: null } : r,
  );

await upsert("programs", dropMissingContact(defaults["programs"] ?? []));
await upsert("events", dropMissingContact(defaults["events"] ?? []));
// --- activities: the "Bound" starter list uses a different shape than the table
const activities = (defaults["activities"] ?? []).map((a) => ({
  id: String(a["id"]),
  name: String(a["name"]),
  slug: String(a["slug"]),
  activity_type: String(a["activity_type"] ?? "sport"),
  season: a["season"] ?? null,
  gender: a["gender_group"] ?? null,
  grades: Array.isArray(a["levels"]) ? (a["levels"] as string[]).join(", ") : null,
  school_level: "high",
  school_id: "lincoln",
  official_url: a["official_url"] ?? null,
  forms_url: a["registration_url"] ?? null,
  image_url: a["icon_url"] ?? null,
  enrollment_open: Boolean(a["is_active"]),
  status: "published",
  verification_status: a["verified_at"] ? "verified" : "pending",
  verified_at: a["verified_at"] ?? null,
  activity_translations: [
    { language_code: "es", name: String(a["translated_name"] ?? a["name"]) },
    { language_code: "en", name: String(a["name"]) },
  ],
}));
await upsert("activities", activities);

console.log("done");
