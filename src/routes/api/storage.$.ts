import { createFileRoute } from "@tanstack/react-router";
import fs from "node:fs";
import path from "node:path";
import { getInitialDatabase } from "@/lib/server-seeds";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "persistent_db.json");

function ensureDbFile(): Record<string, unknown[]> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    if (!raw.trim()) {
      const initial = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const parsed = JSON.parse(raw);
    // If essential tables are missing, merge initial dataset
    if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      const initial = getInitialDatabase();
      const merged = { ...initial, ...parsed };
      writeDbFile(merged);
      return merged;
    }
    return parsed;
  } catch (err) {
    console.error("[Storage API] Error reading persistent_db.json:", err);
    try {
      return getInitialDatabase();
    } catch {
      return {};
    }
  }
}

function writeDbFile(data: Record<string, unknown[]>): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error("[Storage API] Error writing persistent_db.json:", err);
    return false;
  }
}

export const Route = createFileRoute("/api/storage/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = (params as { _splat?: string })._splat || "";
        const parts = splat.split("/").filter(Boolean);
        const target = parts[0] || "all";

        const db = ensureDbFile();

        if (target === "all") {
          return new Response(JSON.stringify({ success: true, data: db }), {
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store, no-cache, must-revalidate",
            },
          });
        }

        const tableData = db[target] ?? [];
        return new Response(JSON.stringify({ success: true, table: target, data: tableData }), {
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store, no-cache, must-revalidate",
          },
        });
      },

      POST: async ({ params, request }) => {
        const splat = (params as { _splat?: string })._splat || "";
        const parts = splat.split("/").filter(Boolean);
        const target = parts[0] || "bulk";

        try {
          const body = (await request.json()) as {
            rows?: unknown[];
            row?: Record<string, unknown>;
            tables?: Record<string, unknown[]>;
            action?: "delete" | "clear" | "upsert";
            id?: string;
          };

          const db = ensureDbFile();

          if (target === "bulk" && body.tables) {
            for (const [tbl, rows] of Object.entries(body.tables)) {
              if (Array.isArray(rows)) {
                db[tbl] = rows;
              }
            }
            writeDbFile(db);
            return new Response(
              JSON.stringify({ success: true, updated: Object.keys(body.tables) }),
              {
                headers: { "content-type": "application/json" },
              },
            );
          }

          if (target !== "bulk") {
            if (body.action === "clear") {
              delete db[target];
            } else if (body.action === "delete" && body.id) {
              const current = db[target] ?? [];
              db[target] = current.filter((r) => {
                const item = r as Record<string, unknown>;
                return String(item?.["id"]) !== String(body.id);
              });
            } else if (Array.isArray(body.rows)) {
              db[target] = body.rows;
            } else if (body.row && body.row["id"]) {
              const current = db[target] ?? [];
              const targetId = String(body.row["id"]);
              const idx = current.findIndex((r) => {
                const item = r as Record<string, unknown>;
                return String(item?.["id"]) === targetId;
              });
              if (idx >= 0) {
                current[idx] = { ...(current[idx] as Record<string, unknown>), ...body.row };
              } else {
                current.unshift(body.row);
              }
              db[target] = current;
            }

            writeDbFile(db);
            return new Response(JSON.stringify({ success: true, table: target }), {
              headers: { "content-type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ success: false, error: "Invalid payload" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ success: false, error: errorMsg }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
