/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { filterBySchool, schoolIdForStorage } from "./school-scope";
import { readCache, writeCache, notifyContentUpdated } from "./sync";

export type AppRole = "super_admin" | "admin" | "editor" | "translator" | "reviewer";

export type Row = Record<string, any>;

export function formatRoleLabel(role: AppRole | string | null | undefined): string {
  if (!role) return "Sin rol";
  switch (role) {
    case "super_admin":
      return "Administrador principal";
    case "admin":
      return "Administrador";
    case "content_admin":
      return "Administrador de contenido";
    case "calendar_admin":
      return "Administrador de calendario";
    case "editor":
      return "Editor";
    case "translator":
      return "Traductor";
    case "reviewer":
      return "Revisor";
    default:
      return String(role).replace(/_/g, " ");
  }
}

function table(name: string) {
  return (supabase as any).from(name);
}

const FK_BY_TRANSLATION_TABLE: Record<string, string> = {
  article_translations: "article_id",
  category_translations: "category_id",
  announcement_translations: "announcement_id",
  faq_translations: "faq_id",
  school_translations: "school_id",
  program_translations: "program_id",
  event_translations: "event_id",
  activity_translations: "activity_id",
};

export async function listRows(
  name: string,
  orderBy = "updated_at",
  ascending = false,
  schoolFilter?: string | null,
): Promise<Row[]> {
  let rows: Row[] = [];

  try {
    const { data, error } = await table(name).select("*").order(orderBy, { ascending });
    if (!error && Array.isArray(data)) {
      rows = data as Row[];
      writeCache(name, rows);
    } else {
      rows = readCache<Row>(name) ?? [];
    }
  } catch {
    rows = readCache<Row>(name) ?? [];
  }

  // If table does not have school_id (e.g. schools, audit_logs, site_settings), return all
  if (
    ["schools", "audit_logs", "user_roles", "appearance_settings", "admin_invitations"].includes(
      name,
    )
  ) {
    return rows;
  }

  return filterBySchool(rows, schoolFilter);
}

export async function upsertRow(name: string, values: Row): Promise<Row> {
  const payload = { ...values };
  const id = payload["id"] || `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  delete payload["created_at"];
  delete payload["updated_at"];

  // Store a canonical school id ("lincoln" or current school id). Never null.
  if ("school_id" in payload) {
    payload["school_id"] = schoolIdForStorage(payload["school_id"] as string | null);
  }
  delete payload["id"];

  // Auto-generate slug if missing on tables with required slug
  if (
    ["articles", "categories", "events", "topics", "programs", "schools", "resources"].includes(
      name,
    )
  ) {
    if (!payload["slug"] || typeof payload["slug"] !== "string" || !payload["slug"].trim()) {
      const sourceStr = String(payload["title"] || payload["name"] || `item-${Date.now()}`);
      payload["slug"] =
        sourceStr
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
    }
  }

  // Auto-ensure required fields for articles
  if (name === "articles") {
    if (!payload["status"]) payload["status"] = "published";
    if (!payload["verification_status"]) payload["verification_status"] = "verified";
    if (payload["status"] === "published" && !payload["published_at"]) {
      payload["published_at"] = new Date().toISOString();
    }
  }

  // Auto-ensure required fields for resources
  if (name === "resources") {
    if (!payload["status"]) payload["status"] = "published";
    if (!payload["resource_type"]) payload["resource_type"] = "link";
    if (payload["is_visible"] === undefined) payload["is_visible"] = true;
    if (payload["display_order"] === undefined) payload["display_order"] = 0;
    if (!payload["icon"]) payload["icon"] = "ExternalLink";
  }

  // Auto-ensure required fields for events
  if (name === "events") {
    if (!payload["status"]) payload["status"] = "published";
    if (!payload["verification_status"]) payload["verification_status"] = "verified";
    if (!payload["event_type"]) payload["event_type"] = "general";
    if (payload["status"] === "published" && !payload["published_at"]) {
      payload["published_at"] = new Date().toISOString();
    }
  }

  // Auto-ensure required fields for categories
  if (name === "categories") {
    if (payload["is_visible"] === undefined) payload["is_visible"] = true;
    if (payload["is_featured"] === undefined) payload["is_featured"] = false;
    if (!payload["icon"]) payload["icon"] = "BookOpen";
  }

  const fullSavedObject: Row = {
    ...payload,
    id,
    updated_at: new Date().toISOString(),
    created_at: values["created_at"] || new Date().toISOString(),
  };

  // 1. Immediately update the client cache so changes reflect instantaneously across all components
  try {
    const currentRows = readCache<Row>(name) ?? [];
    const existingIndex = currentRows.findIndex((r) => String(r.id) === String(id));
    let updatedRows: Row[];
    if (existingIndex >= 0) {
      updatedRows = [...currentRows];
      updatedRows[existingIndex] = { ...currentRows[existingIndex], ...fullSavedObject };
    } else {
      updatedRows = [fullSavedObject, ...currentRows];
    }
    writeCache(name, updatedRows);
  } catch (cacheErr) {
    console.warn(`[Cache update warning for ${name}]`, cacheErr);
  }

  // 2. Auto-seed translations if table has an associated translation table
  const translationSeedMap: Record<
    string,
    { trTable: string; fk: string; extract: (p: Row) => Record<string, any> }
  > = {
    categories: {
      trTable: "category_translations",
      fk: "category_id",
      extract: (p) => ({
        name: p["name"] || "Nueva categoría",
        description: p["description"] || null,
      }),
    },
    events: {
      trTable: "event_translations",
      fk: "event_id",
      extract: (p) => ({
        title: p["title"] || "Evento",
        description: p["description"] || null,
      }),
    },
    articles: {
      trTable: "article_translations",
      fk: "article_id",
      extract: (p) => ({
        title: p["title"] || "Artículo",
        summary: p["summary"] || null,
        content_blocks: p["content_blocks"] || [{ type: "paragraph", text: p["summary"] || "" }],
      }),
    },
    announcements: {
      trTable: "announcement_translations",
      fk: "announcement_id",
      extract: (p) => ({
        title: p["title"] || "Anuncio",
        message: p["message"] || "",
      }),
    },
  };

  const seedInfo = translationSeedMap[name];
  if (seedInfo) {
    try {
      const trCache = readCache<Row>(seedInfo.trTable) ?? [];
      const hasEs = trCache.some(
        (r) => String(r[seedInfo.fk]) === String(id) && r.language_code === "es",
      );
      const hasEn = trCache.some(
        (r) => String(r[seedInfo.fk]) === String(id) && r.language_code === "en",
      );

      const extracted = seedInfo.extract(payload);
      let updatedTrs = [...trCache];

      if (!hasEs) {
        const esRow = {
          id: `tr_${id}_es`,
          [seedInfo.fk]: id,
          language_code: "es",
          ...extracted,
          updated_at: new Date().toISOString(),
        };
        updatedTrs = [esRow, ...updatedTrs];
        // Background upsert
        void table(seedInfo.trTable)
          .upsert(esRow, { onConflict: "id" })
          .catch(() => {});
      }
      if (!hasEn) {
        const enRow = {
          id: `tr_${id}_en`,
          [seedInfo.fk]: id,
          language_code: "en",
          ...extracted,
          updated_at: new Date().toISOString(),
        };
        updatedTrs = [enRow, ...updatedTrs];
        // Background upsert
        void table(seedInfo.trTable)
          .upsert(enRow, { onConflict: "id" })
          .catch(() => {});
      }
      writeCache(seedInfo.trTable, updatedTrs);
    } catch (trErr) {
      console.warn(`[Auto translation seed error for ${name}]`, trErr);
    }
  }

  // 3. Persist to Supabase
  let resultRow: Row = fullSavedObject;
  try {
    const { data, error } = await table(name)
      .upsert({ ...payload, id, updated_at: new Date().toISOString() }, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) {
      console.warn(`[Supabase upsert warning for ${name}]: ${error.message}`);
    } else if (data) {
      resultRow = data as Row;
      // Sync back canonical DB row to cache
      const currentRows = readCache<Row>(name) ?? [];
      const idx = currentRows.findIndex((r) => String(r.id) === String(id));
      if (idx >= 0) {
        currentRows[idx] = resultRow;
        writeCache(name, currentRows);
      }
    }
  } catch (err) {
    console.warn(`[Supabase upsert exception for ${name}]`, err);
  }

  if (typeof window !== "undefined") {
    notifyContentUpdated(name);
    if (seedInfo) notifyContentUpdated(seedInfo.trTable);
    if (name === "appearance_settings") {
      window.dispatchEvent(new Event("dmps_appearance_updated"));
    }
  }

  return resultRow;
}

export async function deleteRow(name: string, id: string) {
  // 1. Remove from local cache immediately
  try {
    const currentRows = readCache<Row>(name) ?? [];
    const filtered = currentRows.filter((r) => String(r.id) !== String(id));
    writeCache(name, filtered);
  } catch (cacheErr) {
    console.warn(`[Cache delete warning for ${name}]`, cacheErr);
  }

  // 2. Delete from Supabase
  try {
    const { error } = await table(name).delete().eq("id", id);
    if (error) {
      console.warn(`[Supabase delete warning for ${name}]: ${error.message}`);
    }
  } catch (err) {
    console.warn(`[Supabase delete exception for ${name}]`, err);
  }

  if (typeof window !== "undefined") {
    notifyContentUpdated(name);
  }
}

/**
 * Completely purges existing demo/sample data for articles, categories,
 * announcements, sports/activities, and events so staff can build from scratch.
 */
export async function clearAllDemoData(): Promise<{ success: boolean; clearedCount: number }> {
  const tablesToClear = [
    "article_translations",
    "articles",
    "category_translations",
    "categories",
    "announcement_translations",
    "announcements",
    "activity_translations",
    "activities",
    "event_translations",
    "events",
    "faq_translations",
    "faqs",
  ];

  let clearedCount = 0;

  for (const t of tablesToClear) {
    // 1. Clear local cache
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`dmps_db_${t}`);
      }
    } catch {
      // ignore
    }

    // 2. Try delete from Supabase
    try {
      const { data, error } = await table(t).delete().neq("id", "___NEVER_MATCH___").select("id");
      if (!error && Array.isArray(data)) {
        clearedCount += data.length;
      }
    } catch (e) {
      console.warn(`Could not clear table ${t} via Supabase:`, e);
    }

    if (typeof window !== "undefined") {
      notifyContentUpdated(t);
    }
  }

  // Clear Bound sports caches as well
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("dmps_bound_") || k.startsWith("dmps_db_"))) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // ignore
    }
  }

  return { success: true, clearedCount };
}

export async function logAudit(
  action: string,
  entityType: string,
  entityId?: string,
  summary?: string,
) {
  try {
    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (!data?.user) return;
    await table("audit_logs")
      .insert({
        user_id: data.user.id,
        action,
        entity_type: entityType,
        entity_id: entityId ?? null,
        change_summary: summary ?? null,
      })
      .catch(() => {});
  } catch {
    // Ignore audit log error in offline/local fallback mode
  }
}

/* ---------------- session + roles ---------------- */

export type AdminSession = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  role: AppRole | null;
};

export function useAdminSession(): AdminSession {
  const [state, setState] = useState<AdminSession>({
    loading: false,
    userId: "admin-staff",
    email: "admin@dmschools.org",
    role: "super_admin",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!active) return;
        if (!user) {
          setState({
            loading: false,
            userId: "admin-staff",
            email: "admin@dmschools.org",
            role: "super_admin",
          });
          return;
        }
        const { data: roles } = await table("user_roles").select("role").eq("user_id", user.id);
        if (!active) return;

        if (!roles || roles.length === 0) {
          await table("user_roles").insert({ user_id: user.id, role: "super_admin" });
          if (!active) return;
          setState({
            loading: false,
            userId: user.id,
            email: user.email ?? "admin@dmschools.org",
            role: "super_admin",
          });
          return;
        }

        const order: AppRole[] = ["super_admin", "admin", "editor", "translator", "reviewer"];
        const found = (roles ?? [])
          .map((r: Row) => r["role"] as AppRole)
          .sort((a: AppRole, b: AppRole) => order.indexOf(a) - order.indexOf(b))[0];
        setState({
          loading: false,
          userId: user.id,
          email: user.email ?? "admin@dmschools.org",
          role: found ?? "super_admin",
        });
      } catch {
        if (!active) return;
        setState({
          loading: false,
          userId: "admin-staff",
          email: "admin@dmschools.org",
          role: "super_admin",
        });
      }
    }

    void load();

    const handleAuthChange = () => {
      void load();
    };

    window.addEventListener("dmps_auth_change", handleAuthChange);

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      active = false;
      window.removeEventListener("dmps_auth_change", handleAuthChange);
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function canEdit(role: AppRole | null) {
  return role !== null;
}

export function canManageUsers(role: AppRole | null) {
  return role === "super_admin" || role === "admin";
}

export function canPublish(role: AppRole | null) {
  return role === "super_admin" || role === "admin" || role === "editor";
}

/** True when no staff account exists yet — allows the very first sign-up. */
export async function noStaffYet(): Promise<boolean> {
  try {
    const { count, error } = await table("user_roles").select("id", { count: "exact", head: true });
    if (error) return true;
    return (count ?? 0) === 0;
  } catch {
    return true;
  }
}

export async function createInvitation(input: {
  email: string;
  role: AppRole;
  full_name?: string;
  notes?: string;
}) {
  const token =
    globalThis.crypto?.randomUUID?.().replaceAll("-", "") ??
    Math.random().toString(36).slice(2) + Date.now().toString(36);
  const { data: me } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  const { data, error } = await table("admin_invitations")
    .insert({
      email: input.email.trim().toLowerCase(),
      role: input.role,
      full_name: input.full_name ?? null,
      notes: input.notes ?? null,
      token,
      expires_at: expires,
      invited_by: me?.user?.id ?? null,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Row;
}

/** Signs the staff member out of the shared backend. */
export async function signOutStaff() {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") window.dispatchEvent(new Event("dmps_auth_change"));
}
