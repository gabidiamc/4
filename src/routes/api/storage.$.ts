import { createFileRoute } from "@tanstack/react-router";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "persistent_db.json");

function ensureDbFile(): Record<string, any[]> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2), "utf-8");
      return {};
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error("[Storage API] Error reading persistent_db.json:", err);
    return {};
  }
}

function writeDbFile(data: Record<string, any[]>): boolean {
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
            rows?: any[];
            row?: any;
            tables?: Record<string, any[]>;
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
              db[target] = current.filter((r: any) => String(r.id) !== String(body.id));
            } else if (Array.isArray(body.rows)) {
              db[target] = body.rows;
            } else if (body.row && body.row.id) {
              const current = db[target] ?? [];
              const idx = current.findIndex((r: any) => String(r.id) === String(body.row.id));
              if (idx >= 0) {
                current[idx] = { ...current[idx], ...body.row };
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
        } catch (err: any) {
          return new Response(
            JSON.stringify({ success: false, error: err?.message || String(err) }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            },
          );
        }
      },
    },
  },
});
