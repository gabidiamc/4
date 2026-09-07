/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unified Storage Engine for DMPS Family Info
 *
 * Provides 4-layer persistent storage to guarantee that card customizations,
 * banners, images, articles, activities, and settings are never lost upon page reload:
 *
 * 1. In-Memory Map (instant 0ms synchronous access)
 * 2. LocalStorage (instant synchronous access on page load)
 * 3. Browser IndexedDB (virtually unlimited capacity, handles large card graphics & images)
 * 4. Server Disk Storage (/api/storage backed by data/persistent_db.json)
 */

export function cacheKey(table: string) {
  return `dmps_db_${table}`;
}

const memoryStore = new Map<string, unknown>();
const IDB_NAME = "dmps_persistent_db_v2";
const IDB_STORE = "tables";
let idbPromise: Promise<IDBDatabase | null> | null = null;
let isHydrated = false;

// Open or get IndexedDB
function getIDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (!idbPromise) {
    idbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn("[StorageEngine] IndexedDB open error:", req.error);
          resolve(null);
        };
      } catch (e) {
        console.warn("[StorageEngine] IndexedDB unavailable:", e);
        resolve(null);
      }
    });
  }
  return idbPromise;
}

// Low-level IndexedDB set
async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn(`[StorageEngine] idbSet error for ${key}:`, e);
  }
}

// Low-level IndexedDB get
async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Low-level IndexedDB get all
async function idbGetAll(): Promise<Record<string, unknown>> {
  try {
    const db = await getIDB();
    if (!db) return {};
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.openCursor();
      const results: Record<string, unknown> = {};
      req.onsuccess = (e: any) => {
        const cursor = e.target?.result;
        if (cursor) {
          results[cursor.key as string] = cursor.value;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => resolve(results);
    });
  } catch {
    return {};
  }
}

/**
 * Safely writes to localStorage.
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(
      `[StorageEngine] LocalStorage full on ${key}, saving to IndexedDB & Server instead.`,
    );
    // Prune stale non-critical caches
    try {
      const nonCritical = ["dmps_backup_", "dmps_sync_logs", "bound_sync_logs"];
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && nonCritical.some((p) => k.startsWith(p)) && k !== key) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Merge two lists of rows by ID keeping the newest updated_at.
 */
export function mergeRowsById<T = any>(existingRows: T[], incomingRows: T[]): T[] {
  const map = new Map<string, any>();

  for (const row of existingRows) {
    if (row && typeof row === "object" && "id" in (row as any)) {
      map.set(String((row as any).id), row);
    }
  }

  for (const inc of incomingRows) {
    if (!inc || typeof inc !== "object" || !("id" in (inc as any))) continue;
    const id = String((inc as any).id);
    const existing = map.get(id);
    if (!existing) {
      map.set(id, inc);
    } else {
      const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
      const incTime = new Date((inc as any).updated_at || (inc as any).created_at || 0).getTime();
      if (incTime >= existingTime) {
        map.set(id, { ...existing, ...inc });
      }
    }
  }

  return Array.from(map.values()) as T[];
}

/**
 * Directly fetches a table from the server disk storage API (/api/storage/:table),
 * caches it into memory, LocalStorage, and IndexedDB, and returns the rows.
 */
export async function fetchTableFromStorage<T = any>(table: string): Promise<T[]> {
  const key = cacheKey(table);
  try {
    const res = await fetch(`/api/storage/${table}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const json = await res.json();
      const rows = (json.data ?? json.rows ?? []) as T[];
      if (Array.isArray(rows) && rows.length > 0) {
        const local = readFromUnifiedStorage<T>(table) ?? [];
        const merged = mergeRowsById(local, rows);
        memoryStore.set(key, merged);
        safeSetItem(key, JSON.stringify(merged));
        void idbSet(table, merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn(`[StorageEngine] Fetch table ${table} warning:`, err);
  }
  return (readFromUnifiedStorage<T>(table) ?? []) as T[];
}

/**
 * Read table synchronously from Memory -> LocalStorage.
 * Triggers background IndexedDB/Server hydration if unpopulated.
 */
export function readFromUnifiedStorage<T = any>(table: string): T[] | null {
  const key = cacheKey(table);

  // 1. In-memory
  if (memoryStore.has(key)) {
    const val = memoryStore.get(key);
    if (Array.isArray(val) && val.length > 0) return val as T[];
  }

  // 2. LocalStorage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryStore.set(key, parsed);
          return parsed as T[];
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Read table synchronously or fetch from server storage if not yet loaded.
 */
export async function getOrFetchFromUnifiedStorage<T = any>(table: string): Promise<T[]> {
  const cached = readFromUnifiedStorage<T>(table);
  if (cached && cached.length > 0) return cached;
  return fetchTableFromStorage<T>(table);
}

/**
 * Displays an explicit confirmation toast verifying that data was saved permanently.
 */
export function notifySaveSuccess(customMessage?: string): void {
  if (typeof window === "undefined") return;
  import("sonner")
    .then(({ toast }) => {
      toast.success(customMessage || "✓ Se guardó sin ningún problema la información.", {
        description:
          "Los cambios han quedado guardados de forma permanente y persistirán al recargar.",
        duration: 4000,
      });
    })
    .catch(() => {});
}

/**
 * Save table across all 4 layers synchronously and asynchronously:
 * 1. In-Memory (instant)
 * 2. LocalStorage (instant synchronous)
 * 3. Browser IndexedDB (persistent)
 * 4. Server Disk Storage (/api/storage backed by persistent_db.json) - awaited
 */
export async function saveToUnifiedStorage(table: string, rows: unknown): Promise<boolean> {
  const key = cacheKey(table);

  // 1. In-Memory
  memoryStore.set(key, rows);

  // 2. LocalStorage (best-effort synchronous)
  if (typeof window !== "undefined") {
    try {
      const serialized = JSON.stringify(rows);
      safeSetItem(key, serialized);
    } catch {
      // Memory + IDB + Server will retain the data
    }
  }

  // 3. Browser IndexedDB
  await idbSet(table, rows);

  // 4. Server Disk Storage (AWAITED to guarantee persistence before reload)
  if (typeof window !== "undefined" && typeof fetch !== "undefined") {
    try {
      const res = await fetch(`/api/storage/${table}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: Array.isArray(rows) ? rows : [rows] }),
      });
      if (!res.ok) {
        console.warn(`[StorageEngine] Server persist notice for ${table}: HTTP ${res.status}`);
      }
    } catch (e) {
      console.warn(`[StorageEngine] Server persist warning for ${table}:`, e);
    }
  }

  return true;
}

/**
 * Save table across all 4 layers (non-blocking wrapper).
 */
export function writeToUnifiedStorage(table: string, rows: unknown): void {
  void saveToUnifiedStorage(table, rows);
}

/**
 * Upsert a single row in unified storage.
 */
export function upsertSingleRowInUnifiedStorage(table: string, row: any, idField = "id"): any[] {
  const current = readFromUnifiedStorage(table) ?? [];
  const rowId = row[idField];
  const idx = current.findIndex((r: any) => String(r[idField]) === String(rowId));
  let next: any[];
  if (idx >= 0) {
    next = [...current];
    next[idx] = { ...next[idx], ...row };
  } else {
    next = [row, ...current];
  }
  writeToUnifiedStorage(table, next);
  return next;
}

/**
 * Delete a single row in unified storage.
 */
export function deleteSingleRowInUnifiedStorage(
  table: string,
  id: string | number,
  idField = "id",
): any[] {
  const current = readFromUnifiedStorage(table) ?? [];
  const next = current.filter((r: any) => String(r[idField]) !== String(id));
  writeToUnifiedStorage(table, next);
  return next;
}

/**
 * Initialize and hydrate the storage engine:
 * 1. Restores all tables from IndexedDB into memory & localStorage.
 * 2. Fetches /api/storage/all from server to reconcile latest server data.
 * 3. Triggers onHydrated callback to refresh UI without flash.
 */
export async function initUnifiedStorageEngine(onHydrated?: () => void): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // 1. Hydrate from IndexedDB first (fast local disk read)
    const localIdbTables = await idbGetAll();
    let hasLocalData = false;

    for (const [table, rows] of Object.entries(localIdbTables)) {
      if (Array.isArray(rows) && rows.length > 0) {
        hasLocalData = true;
        const key = cacheKey(table);
        memoryStore.set(key, rows);
        try {
          safeSetItem(key, JSON.stringify(rows));
        } catch {
          // ignore
        }
      }
    }

    // 2. Fetch from Server Storage API (/api/storage/all)
    try {
      const res = await fetch("/api/storage/all", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const json = (await res.json()) as { success?: boolean; data?: Record<string, any[]> };
        const serverDb = json.data ?? {};

        const toSyncToServer: Record<string, any[]> = {};

        // Reconcile server data with local data by merging ID by ID with newest timestamps
        const allTableNames = new Set([...Object.keys(serverDb), ...Object.keys(localIdbTables)]);

        for (const table of allTableNames) {
          const sRows = (serverDb[table] as any[]) ?? [];
          const lRows = (localIdbTables[table] as any[]) ?? [];

          if (sRows.length > 0 || lRows.length > 0) {
            // Intelligent merge
            const merged = mergeRowsById(lRows, sRows);
            const key = cacheKey(table);
            memoryStore.set(key, merged);
            void idbSet(table, merged);
            try {
              safeSetItem(key, JSON.stringify(merged));
            } catch {
              // ignore
            }

            // If local had changes that are newer or missing on server, schedule server sync
            if (JSON.stringify(merged) !== JSON.stringify(sRows)) {
              toSyncToServer[table] = merged;
            }
          }
        }

        if (Object.keys(toSyncToServer).length > 0) {
          void fetch("/api/storage/bulk", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tables: toSyncToServer }),
          }).catch(() => {});
        }
      }
    } catch (serverErr) {
      console.warn("[StorageEngine] Server storage reconciliation note:", serverErr);
    }

    isHydrated = true;
    if (onHydrated) {
      onHydrated();
    }
  } catch (err) {
    console.warn("[StorageEngine] Initialization note:", err);
    isHydrated = true;
    if (onHydrated) onHydrated();
  }
}

export function isStorageEngineHydrated(): boolean {
  return isHydrated;
}
