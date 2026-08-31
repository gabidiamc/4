/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldInput, type Field } from "@/components/admin/field-input";
import { supabase } from "@/integrations/supabase/client";
import { readCache, notifyContentUpdated } from "@/lib/sync";
import { translateToEnglish, translateToKaren, autoTranslateBlocks } from "@/lib/auto-translator";
import { Sparkles } from "lucide-react";

export const LANGS = [
  { code: "es", label: "Español (Principal)", native: "Español" },
  { code: "en", label: "Inglés (English)", native: "English" },
  { code: "ksw", label: "S'gaw Karen (ကညီကျိာ်)", native: "ကညီကျိာ်" },
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

  const existing = (rows.data ?? []).find((r) => r["language_code"] === lang);
  const current =
    existing ??
    ({
      [fkColumn]: parentId,
      language_code: lang,
      translation_status: "draft",
    } as any);

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

      try {
        if (existing && existing["id"]) {
          const { error } = await (supabase as any)
            .from(table)
            .update(body)
            .eq("id", existing["id"]);
          if (error) console.warn(`[Translations update warning for ${table}]`, error.message);
        } else {
          const { error } = await (supabase as any)
            .from(table)
            .insert({ id: `tr_${parentId}_${lang}`, ...body });
          if (error) console.warn(`[Translations insert warning for ${table}]`, error.message);
        }
      } catch (dbErr) {
        console.warn(`[Translations db error for ${table}]`, dbErr);
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

  const handleAutoTranslate = () => {
    const esRow = (rows.data ?? []).find((r) => r["language_code"] === "es") || {};
    const updatedDraft = { ...value, language_code: lang };

    fields.forEach((f) => {
      const esVal = esRow[f.name];
      if (typeof esVal === "string" && esVal.trim()) {
        if (lang === "en") {
          updatedDraft[f.name] = translateToEnglish(esVal);
        } else if (lang === "ksw") {
          updatedDraft[f.name] = translateToKaren(esVal);
        }
      } else if (Array.isArray(esVal)) {
        if (lang === "en") {
          updatedDraft[f.name] = autoTranslateBlocks(esVal).en;
        } else if (lang === "ksw") {
          updatedDraft[f.name] = autoTranslateBlocks(esVal).ksw;
        }
      }
    });

    setDraft(updatedDraft);
    toast.success(
      `Traducción automática generada para ${lang === "en" ? "Inglés" : "S'gaw Karen"}.`,
    );
  };

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">Textos por idioma</h3>
        {lang !== "es" && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAutoTranslate}
            className="gap-1.5 text-xs font-semibold"
          >
            <Sparkles className="size-3.5 text-amber-500" />
            Auto-Traducir desde Español
          </Button>
        )}
      </div>
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
        <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Estado de la traducción:</span>
            <select
              className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium"
              value={value?.["translation_status"] || "draft"}
              onChange={(e) =>
                setDraft({
                  ...value,
                  language_code: lang,
                  translation_status: e.target.value,
                  reviewed_at:
                    e.target.value === "approved"
                      ? new Date().toISOString()
                      : value?.["reviewed_at"],
                })
              }
            >
              <option value="draft">Borrador (Draft)</option>
              <option value="needs_review">Necesita revisión (Needs Review)</option>
              <option value="approved">Aprobada y Verificada (Approved)</option>
            </select>
          </div>
          {lang === "ksw" && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              ⚠️ Nota: La traducción en S'gaw Karen debe ser revisada manualmente por personal
              competente antes de marcarse como aprobada.
            </p>
          )}
        </div>

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
