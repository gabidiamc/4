/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldInput, type Field } from "@/components/admin/field-input";
import { supabase } from "@/integrations/supabase/client";
import { readCache, notifyContentUpdated } from "@/lib/sync";

export const LANGS = [
  { code: "es", label: "Español" },
  { code: "en", label: "Inglés" },
];

export function TranslationsEditor({
  table,
  fkColumn,
  parentId,
  fields,
}: {
  table: string;
  fkColumn: string;
  parentId: string;
  fields: Field[];
}) {
  const queryClient = useQueryClient();
  const [lang, setLang] = useState("es");
  const key = ["admin", table, parentId];

  const rows = useQuery({
    queryKey: key,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from(table)
          .select("*")
          .eq(fkColumn, parentId);
        if (!error && Array.isArray(data) && data.length > 0) return data as any[];
      } catch (err) {
        void err;
      }

      // 1. Try local cache
      const cached = (readCache<any>(table) ?? []).filter(
        (r) => String(r[fkColumn]) === String(parentId),
      );
      if (cached.length > 0) return cached;

      // 2. Check parent table defaults / cache
      const parentTableMap: Record<string, string> = {
        category_translations: "categories",
        announcement_translations: "announcements",
        faq_translations: "faqs",
        school_translations: "schools",
        program_translations: "programs",
        event_translations: "events",
        activity_translations: "activities",
        article_translations: "articles",
      };
      const parentTable = parentTableMap[table];
      if (parentTable) {
        // Try cached parent table
        const parentCached = readCache<any>(parentTable) ?? [];
        const parentFromCache = parentCached.find((item) => String(item.id) === String(parentId));
        if (
          parentFromCache &&
          Array.isArray(parentFromCache[table]) &&
          parentFromCache[table].length > 0
        ) {
          return parentFromCache[table];
        }
      }

      return [];
    },
  });

  const current =
    (rows.data ?? []).find((r) => r["language_code"] === lang) ??
    ({ [fkColumn]: parentId, language_code: lang } as any);
  const [draft, setDraft] = useState<any | null>(null);
  const value = draft && draft["language_code"] === lang ? draft : current;

  const save = useMutation({
    mutationFn: async (payload: any) => {
      const body = {
        ...payload,
        [fkColumn]: parentId,
        language_code: lang,
        updated_at: new Date().toISOString(),
      };
      delete body["id"];

      const existing = (rows.data ?? []).find((r) => r["language_code"] === lang);

      if (existing && existing["id"]) {
        const { error } = await (supabase as any).from(table).update(body).eq("id", existing["id"]);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from(table)
          .insert({ id: `tr_${parentId}_${lang}`, ...body });
        if (error) throw error;
      }

      // Save into localStorage dmps_db_${table}
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(`dmps_db_${table}`);
        let all: any[] = [];
        if (raw) {
          try {
            all = JSON.parse(raw);
          } catch (err) {
            void err;
          }
        }
        const idx = all.findIndex((r) => r[fkColumn] === parentId && r.language_code === lang);
        const trRow = {
          id: existing?.id || `tr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ...body,
        };
        if (idx >= 0) all[idx] = { ...all[idx], ...trRow };
        else all.push(trRow);
        localStorage.setItem(`dmps_db_${table}`, JSON.stringify(all));

        // Update parent table embedded translations if applicable
        const parentTableMap: Record<string, string> = {
          category_translations: "categories",
          announcement_translations: "announcements",
          faq_translations: "faqs",
          school_translations: "schools",
          program_translations: "programs",
          event_translations: "events",
        };
        const parentTable = parentTableMap[table];
        if (parentTable) {
          const pRaw = localStorage.getItem(`dmps_db_${parentTable}`);
          let pItems: any[] = [];
          if (pRaw) {
            try {
              pItems = JSON.parse(pRaw);
            } catch (err) {
              void err;
            }
          }
          const pIdx = pItems.findIndex((item) => item.id === parentId);
          if (pIdx >= 0) {
            const item = pItems[pIdx];
            const trKey = `${table}`;
            const trs: any[] = Array.isArray(item[trKey]) ? [...item[trKey]] : [];
            const trIdx = trs.findIndex((t) => t.language_code === lang);
            if (trIdx >= 0) trs[trIdx] = trRow;
            else trs.push(trRow);
            pItems[pIdx] = { ...item, [trKey]: trs, updated_at: new Date().toISOString() };
            localStorage.setItem(`dmps_db_${parentTable}`, JSON.stringify(pItems));
          }
        }

        notifyContentUpdated(table);
      }
    },
    onSuccess: () => {
      toast.success("Traducción guardada");
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-border p-4">
      <h3 className="text-lg font-bold">Textos por idioma</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {LANGS.map((l) => (
          <Button
            key={l.code}
            type="button"
            variant={lang === l.code ? "default" : "outline"}
            className="min-h-11 rounded-xl"
            onClick={() => {
              setDraft(null);
              setLang(l.code);
            }}
          >
            {l.label}
          </Button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {fields.map((f) => (
          <FieldInput
            key={f.name}
            field={f}
            value={value?.[f.name]}
            onChange={(v) => setDraft({ ...value, language_code: lang, [f.name]: v })}
          />
        ))}
        <Button
          type="button"
          disabled={save.isPending}
          className="min-h-11 rounded-xl"
          onClick={() => save.mutate(value)}
        >
          {save.isPending ? "Guardando…" : "Guardar traducción"}
        </Button>
      </div>
    </div>
  );
}
