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

import {
  cacheKey,
  safeSetItem,
  readFromUnifiedStorage,
  writeToUnifiedStorage,
  initUnifiedStorageEngine,
} from "./storage-engine";

export { cacheKey, safeSetItem };

export function readCache<T = any>(table: string): T[] | null {
  return readFromUnifiedStorage<T>(table);
}

export function writeCache(table: string, rows: unknown) {
  writeToUnifiedStorage(table, rows);
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

  // 0. Initialize and hydrate the unified persistent storage engine (IndexedDB + Server Disk)
  useEffect(() => {
    void initUnifiedStorageEngine(() => {
      void queryClient.invalidateQueries();
    });
  }, [queryClient]);

  // 1. In-browser instant event & cross-tab sync (always works whether Supabase is configured or local)
  useEffect(() => {
    let cancelled = false;

    const handleLocalUpdate = (e: Event) => {
      if (cancelled) return;
      const custom = e as CustomEvent<{ table?: string }>;
      const table = custom.detail?.table;

      // Always invalidate the root queries to guarantee real-time UI updates
      void queryClient.invalidateQueries();

      if (table) {
        void queryClient.invalidateQueries({ queryKey: [table] });
        void queryClient.invalidateQueries({ queryKey: ["admin", table] });
        if (table === "articles" || table === "article_translations") {
          void queryClient.invalidateQueries({ queryKey: ["articles"] });
          void queryClient.invalidateQueries({ queryKey: ["article"] });
          void queryClient.invalidateQueries({ queryKey: ["published-articles"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
        }
        if (table === "contacts") {
          void queryClient.invalidateQueries({ queryKey: ["contacts"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "contacts"] });
        }
        if (table === "categories" || table === "category_translations") {
          void queryClient.invalidateQueries({ queryKey: ["categories"] });
          void queryClient.invalidateQueries({ queryKey: ["category"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
        }
        if (table === "announcements" || table === "announcement_translations") {
          void queryClient.invalidateQueries({ queryKey: ["announcements"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
        }
        if (table === "events" || table === "event_translations") {
          void queryClient.invalidateQueries({ queryKey: ["events"] });
          void queryClient.invalidateQueries({ queryKey: ["public_calendar_events"] });
          void queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
        }
        if (table === "activities" || table === "activity_translations") {
          void queryClient.invalidateQueries({ queryKey: ["activities"] });
          void queryClient.invalidateQueries({ queryKey: ["athletics"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
        }
      }
    };

    // Listen to local content updates emitted by upsertRow, deleteRow, etc.
    window.addEventListener("dmps_content_updated", handleLocalUpdate);

    // Cross-tab synchronization via localStorage changes
    const handleStorage = (e: StorageEvent) => {
      if (cancelled) return;
      if (e.key && e.key.startsWith("dmps_db_")) {
        const table = e.key.replace("dmps_db_", "");
        void queryClient.invalidateQueries();
        void queryClient.invalidateQueries({ queryKey: [table] });
        void queryClient.invalidateQueries({ queryKey: ["admin", table] });
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("dmps_content_updated", handleLocalUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [queryClient]);

  // 2. Supabase postgres_changes real-time subscription
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
 * sitio público: sincroniza el motor de almacenamiento persistente y avisa
 * a todas las vistas abiertas sin borrar los datos del usuario.
 */
export async function applyChangesNow(queryClient: {
  invalidateQueries: () => Promise<void> | void;
  refetchQueries: () => Promise<void> | void;
}) {
  await queryClient.invalidateQueries();
  await queryClient.refetchQueries();
  if (typeof window !== "undefined") {
    notifyContentUpdated();
    window.dispatchEvent(new Event("dmps_appearance_updated"));
  }
}
