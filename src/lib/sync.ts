/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

/** True when the backend connection details are present in this build. */
const isSupabaseConfigured = () =>
  Boolean(import.meta.env["VITE_SUPABASE_URL"] && import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]);

/** Tables that are replicated in real time to every device. */
export const REALTIME_TABLES = [
  "articles",
  "article_translations",
  "article_tags",
  "article_relations",
  "tags",
  "categories",
  "category_translations",
  "announcements",
  "announcement_translations",
  "faqs",
  "faq_translations",
  "schools",
  "school_translations",
  "programs",
  "program_translations",
  "program_schools",
  "events",
  "event_translations",
  "contacts",
  "activities",
  "activity_translations",
  "appearance_settings",
  "site_settings",
  "update_requests",
  "broken_link_reports",
] as const;

export function cacheKey(table: string) {
  return `dmps_db_${table}`;
}

export function readCache<T = any>(table: string): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(table));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

export function writeCache(table: string, rows: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(table), JSON.stringify(rows));
  } catch {
    // ignore quota errors
  }
}

export function notifyContentUpdated(table?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("dmps_content_updated", { detail: { table } }));
}

/**
 * Subscribes to database changes so any edit made by staff shows up
 * immediately on every open device, without a manual refresh.
 */
export function useRealtimeContentSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    const refresh = (table?: string) => {
      if (cancelled) return;
      if (table) {
        // Drop the offline cache so the next read comes from the database.
        try {
          localStorage.removeItem(cacheKey(table));
        } catch {
          // ignore
        }
      }
      void queryClient.invalidateQueries();
      notifyContentUpdated(table);
      if (table === "appearance_settings") {
        window.dispatchEvent(new Event("dmps_appearance_updated"));
      }
    };

    const channel = supabase.channel("dmps-content-sync");
    for (const table of REALTIME_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => refresh(table));
    }
    channel.subscribe();

    const onFocus = () => {
      if (!cancelled) void queryClient.invalidateQueries();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Fuerza que los cambios guardados por el personal aparezcan de inmediato en el
 * sitio público: borra el caché local de todas las tablas, vuelve a pedir los
 * datos a la base y avisa a las pantallas abiertas en este dispositivo.
 */
export async function applyChangesNow(queryClient: {
  invalidateQueries: () => Promise<void> | void;
  refetchQueries: () => Promise<void> | void;
}) {
  if (typeof window !== "undefined") {
    for (const table of REALTIME_TABLES) {
      try {
        localStorage.removeItem(cacheKey(table));
      } catch {
        // ignore
      }
    }
  }
  await queryClient.invalidateQueries();
  await queryClient.refetchQueries();
  if (typeof window !== "undefined") {
    notifyContentUpdated();
    window.dispatchEvent(new Event("dmps_appearance_updated"));
  }
}
