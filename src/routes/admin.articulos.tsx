/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Plus,
  Trash2,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Globe,
  Eye,
  Archive,
  RotateCcw,
  Copy,
  Calendar,
  Clock,
  AlertTriangle,
  FileCheck2,
  Link2,
  ExternalLink,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Info,
  Save,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "sonner";

import { VisualRichEditor } from "@/components/admin/visual-rich-editor";
import { LANGS } from "@/components/admin/translations-editor";
import { PublicPreviewModal, type PreviewData } from "@/components/admin/public-preview-modal";
import {
  ConfirmActionDialog,
  type ConfirmActionConfig,
} from "@/components/admin/confirm-action-dialog";
import { FileUploadInput } from "@/components/file-upload-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/lib/school";
import { deleteRow, listRows, logAudit, upsertRow, type Row } from "@/lib/admin";
import { notifyContentUpdated, readCache, writeCache } from "@/lib/sync";
import { computeContentStatus, formatDesMoinesDate } from "@/lib/content-lifecycle";

export const Route = createFileRoute("/admin/articulos")({
  component: ArticlesAdmin,
});

function formatStatusLabel(status: string): string {
  switch (status) {
    case "published":
      return "Publicado";
    case "draft":
      return "Borrador";
    case "in_review":
      return "En revisión";
    case "scheduled":
      return "Programado";
    case "archived":
      return "Archivado";
    case "completed":
      return "Finalizado";
    default:
      return status.replace(/_/g, " ");
  }
}

function blocksToHtml(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
  return blocks
    .map((b) => {
      if (b.type === "paragraph") {
        return typeof b.text === "string" && (b.text.includes("<") || b.text.includes(">"))
          ? b.text
          : `<p>${b.text || ""}</p>`;
      }
      if (b.type === "heading") {
        const lvl = b.level || "h2";
        return `<${lvl}>${b.text || ""}</${lvl}>`;
      }
      if (b.type === "callout") {
        return `<div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1rem 0; color: #1e3a8a; font-weight: 500;">💡 ${b.text || ""}</div>`;
      }
      if (b.type === "list") {
        const items = Array.isArray(b.items)
          ? b.items.map((i: string) => `<li>${i}</li>`).join("")
          : "";
        return `<ul>${items}</ul>`;
      }
      if (b.type === "image" && b.url) {
        return `<figure style="text-align:center; margin: 1rem 0;"><img src="${b.url}" alt="${b.alt || ""}" style="max-width:100%; border-radius: 1rem;" /></figure>`;
      }
      return b.text ? `<p>${b.text}</p>` : "";
    })
    .join("\n");
}

function ArticlesAdmin() {
  const queryClient = useQueryClient();
  const { adminSchoolFilter } = useSchool();
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmActionConfig | null>(null);

  const articles = useQuery({
    queryKey: ["admin", "articles", adminSchoolFilter],
    queryFn: () => listRows("articles", "updated_at", false, adminSchoolFilter),
  });

  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => listRows("categories", "display_order", true),
  });

  const categoriesList = categories.data ?? [];

  // Filter articles based on tab & search
  const filteredArticles = useMemo(() => {
    const raw = articles.data ?? [];
    return raw.filter((row: any) => {
      const computed = computeContentStatus({
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        status: row.status,
        archived_at: row.archived_at,
      });

      if (activeTab === "drafts" && row.status !== "draft" && row.status !== "in_review")
        return false;
      if (activeTab === "published" && (row.status !== "published" || computed === "archived"))
        return false;
      if (activeTab === "upcoming" && computed !== "upcoming") return false;
      if (activeTab === "completed" && computed !== "completed") return false;
      if (activeTab === "archived" && row.status !== "archived" && computed !== "archived")
        return false;
      if (activeTab === "unverified" && row.source_name && row.source_name.trim().length > 0)
        return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const title = String(row.title || row.name || row.slug || "").toLowerCase();
        const summary = String(row.summary || "").toLowerCase();
        if (!title.includes(q) && !summary.includes(q)) return false;
      }

      return true;
    });
  }, [articles.data, activeTab, search]);

  // Tab counts
  const counts = useMemo(() => {
    const raw = articles.data ?? [];
    let drafts = 0;
    let published = 0;
    let upcoming = 0;
    let completed = 0;
    let archived = 0;
    let unverified = 0;

    raw.forEach((row: any) => {
      const computed = computeContentStatus({
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        status: row.status,
        archived_at: row.archived_at,
      });
      if (row.status === "draft" || row.status === "in_review") drafts++;
      if (row.status === "published" && computed !== "archived") published++;
      if (computed === "upcoming") upcoming++;
      if (computed === "completed") completed++;
      if (row.status === "archived" || computed === "archived") archived++;
      if (!row.source_name || row.source_name.trim().length === 0) unverified++;
    });

    return { all: raw.length, drafts, published, upcoming, completed, archived, unverified };
  }, [articles.data]);

  // Logical Archive Mutation
  const archiveMutation = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const newStatus = archive ? "archived" : "published";
      await upsertRow("articles", { id, status: newStatus, updated_at: new Date().toISOString() });
      try {
        await logAudit("update", "articles", id, archive ? "Archivado lógico" : "Restaurado");
      } catch {
        // ignore
      }
    },
    onSuccess: (_, v) => {
      toast.success(
        v.archive ? "Artículo archivado lógicamente." : "Artículo restaurado a publicado.",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
      void queryClient.invalidateQueries({ queryKey: ["published-articles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Permanent Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteRow("articles", id);
      try {
        await logAudit("delete", "articles", id, "Eliminado permanentemente");
      } catch {
        // ignore
      }
    },
    onSuccess: () => {
      toast.success("Artículo eliminado con éxito de la base de datos y la página pública.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
      void queryClient.invalidateQueries({ queryKey: ["published-articles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Duplicate as Draft Mutation
  const duplicateMutation = useMutation({
    mutationFn: async (row: Row) => {
      const newId = `art_${Date.now()}`;
      const newSlug = `${String(row["slug"] || "articulo")}-copia-${Date.now().toString().slice(-4)}`;
      const duplicated = {
        ...row,
        id: newId,
        slug: newSlug,
        title: `${String(row["title"] || "Artículo")} (Copia Borrador)`,
        status: "draft",
        updated_at: new Date().toISOString(),
      };
      await upsertRow("articles", duplicated);
      try {
        await logAudit("create", "articles", newId, "Duplicado como borrador");
      } catch {
        // ignore
      }
      return duplicated;
    },
    onSuccess: (dupe) => {
      toast.success("Artículo duplicado como borrador con éxito.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
      setEditingRow(dupe);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Artículos y Recursos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea, programa y organiza artículos informativos con validación de fechas, fuentes y
            vista previa.
          </p>
        </div>
        <Button
          className="min-h-11 gap-2 rounded-xl px-5 text-sm font-bold shadow-soft"
          onClick={() =>
            setEditingRow({
              id: null,
              slug: "",
              category_id: categoriesList[0]?.id || "",
              school_id: adminSchoolFilter === "all" ? "sch-lincoln" : adminSchoolFilter,
              status: "draft",
              is_featured: false,
              starts_at: new Date().toISOString().slice(0, 10),
              ends_at: null,
              verified_at: new Date().toISOString().slice(0, 10),
              source_name: "Abraham Lincoln High School",
            })
          }
        >
          <Plus className="size-4" aria-hidden="true" />
          Crear artículo
        </Button>
      </div>

      {/* Tabs bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none border-b border-border/80">
        {[
          { id: "all", label: "Todo", count: counts.all },
          { id: "published", label: "Publicados", count: counts.published },
          { id: "drafts", label: "Borradores", count: counts.drafts },
          { id: "upcoming", label: "Próximamente", count: counts.upcoming },
          { id: "completed", label: "Finalizados", count: counts.completed },
          { id: "archived", label: "Archivados", count: counts.archived },
          { id: "unverified", label: "Por verificar fuente", count: counts.unverified },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-2xs"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-background text-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and context */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o resumen…"
            className="pl-10 min-h-10 rounded-xl text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span>Vista activa:</span>
          <span className="font-bold text-foreground">
            {adminSchoolFilter === "all"
              ? "Distrito Completo"
              : `${adminSchoolFilter.toUpperCase()} High`}
          </span>
          <span>({filteredArticles.length} resultados)</span>
        </div>
      </div>

      {/* Articles Table */}
      {articles.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground space-y-2">
          <p className="font-bold text-foreground">No se encontraron artículos</p>
          <p className="text-xs">
            Prueba cambiando los filtros de estado o el término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="surface-card overflow-x-auto rounded-2xl border border-border/80 shadow-2xs">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="px-4 py-3 text-start font-bold">Título / Identificador</th>
                <th className="px-4 py-3 text-start font-bold">Escuela</th>
                <th className="px-4 py-3 text-start font-bold">Categoría</th>
                <th className="px-4 py-3 text-start font-bold">Fechas / Vigencia</th>
                <th className="px-4 py-3 text-start font-bold">Estado</th>
                <th className="px-4 py-3 text-end font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((row: any) => {
                const categoryObj = categoriesList.find((c) => c.id === row["category_id"]);
                const catName = categoryObj?.name || "Sin categoría";
                const rowSchool = String(row["school_id"] || "all");

                return (
                  <tr
                    key={String(row["id"])}
                    className="border-b border-border/60 transition-colors hover:bg-muted/30 last:border-0"
                  >
                    <td className="max-w-[20rem] truncate px-4 py-3.5">
                      <p className="font-bold text-foreground">
                        {String(row["title"] || row["name"] || row["slug"])}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {String(row["slug"])}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                          rowSchool.includes("lincoln")
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                            : rowSchool.includes("east")
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {rowSchool.includes("lincoln")
                          ? "Lincoln"
                          : rowSchool.includes("east")
                            ? "East"
                            : "Distrito (Ambas)"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-foreground">
                      <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {catName}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {row["starts_at"] ? (
                        <span>Inicio: {String(row["starts_at"]).slice(0, 10)}</span>
                      ) : null}
                      {row["ends_at"] ? (
                        <span className="block text-amber-600 dark:text-amber-400 font-semibold">
                          Fin: {String(row["ends_at"]).slice(0, 10)}
                        </span>
                      ) : (
                        <span className="block text-slate-500 font-medium">Permanente</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          row["status"] === "published"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : row["status"] === "archived"
                              ? "bg-muted text-muted-foreground"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {formatStatusLabel(String(row["status"] || "published"))}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-end">
                      <div className="flex justify-end gap-1.5">
                        {/* Preview */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                          title="Vista previa"
                          onClick={() => {
                            setPreviewData({
                              type: "article",
                              title: String(row["title"] || "Artículo"),
                              summary: String(row["summary"] || ""),
                              body: String(row["content"] || ""),
                              category: catName,
                              school_id: rowSchool,
                              starts_at: row["starts_at"],
                              ends_at: row["ends_at"],
                              source_name: row["source_name"],
                              official_url: row["official_url"],
                              image_url: row["featured_image_url"],
                              image_alt: row["image_alt"],
                              status: row["status"],
                            });
                          }}
                        >
                          <Eye className="size-4" />
                        </Button>

                        {/* Duplicate as Draft */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                          title="Duplicar como borrador"
                          onClick={() => duplicateMutation.mutate(row)}
                        >
                          <Copy className="size-4" />
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                          title="Editar"
                          onClick={() => setEditingRow({ ...row })}
                        >
                          <Pencil className="size-4" />
                        </Button>

                        {/* Logical Archive or Restore */}
                        {row["status"] === "archived" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-xl text-emerald-600 hover:bg-emerald-500/10"
                            title="Restaurar artículo"
                            onClick={() =>
                              archiveMutation.mutate({ id: String(row["id"]), archive: false })
                            }
                          >
                            <RotateCcw className="size-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Archivar lógicamente (se oculta públicamente pero se preserva)"
                            onClick={() =>
                              setConfirmConfig({
                                title: "¿Archivar artículo lógicamente?",
                                description: `El artículo "${row["title"]}" se ocultará del portal público, pero todos sus datos e historial permanecerán seguros en la base de datos.`,
                                consequence:
                                  "Dejará de aparecer en la portada y categorías públicas.",
                                confirmText: "Archivar contenido",
                                variant: "warning",
                                onConfirm: () =>
                                  archiveMutation.mutateAsync({
                                    id: String(row["id"]),
                                    archive: true,
                                  }),
                              })
                            }
                          >
                            <Archive className="size-4" />
                          </Button>
                        )}

                        {/* Permanent Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Eliminar permanentemente de la base de datos"
                          onClick={() =>
                            setConfirmConfig({
                              title: "¿Eliminar artículo permanentemente?",
                              description: `Se borrará el artículo "${row["title"]}" por completo. Esta acción no se puede deshacer y se reflejará al instante en la página pública.`,
                              consequence:
                                "Se eliminará inmediatamente sin necesidad de recargar la página.",
                              confirmText: "Eliminar definitivamente",
                              variant: "danger",
                              onConfirm: () => deleteMutation.mutateAsync(String(row["id"])),
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Step-by-Step Article Editor Modal */}
      {editingRow && (
        <ArticleStepEditorModal
          editingRow={editingRow}
          categoriesList={categoriesList}
          onClose={() => setEditingRow(null)}
          onSuccess={() => {
            setEditingRow(null);
            void queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
            void queryClient.invalidateQueries({ queryKey: ["articles"] });
            void queryClient.invalidateQueries({ queryKey: ["published-articles"] });
          }}
        />
      )}

      {/* Multi-device Public Preview Modal */}
      <PublicPreviewModal
        open={previewData !== null}
        onOpenChange={(o) => !o && setPreviewData(null)}
        data={previewData}
      />

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmConfig !== null}
        onOpenChange={(o) => !o && setConfirmConfig(null)}
        config={confirmConfig}
      />
    </div>
  );
}

function ArticleStepEditorModal({
  editingRow,
  categoriesList,
  onClose,
  onSuccess,
}: {
  editingRow: Row;
  categoriesList: Row[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const articleId = editingRow["id"] ? String(editingRow["id"]) : null;
  const { adminSchoolFilter } = useSchool();

  // Steps: 1. Basic Info, 2. Content, 3. Dates & Verification, 4. Publishing & Preview
  const [activeStep, setActiveStep] = useState<number>(1);
  const [lang, setLang] = useState("es");

  // Initial Content Calculation
  const initialTitle = String(editingRow["title"] || editingRow["name"] || "");
  const initialSummary = String(editingRow["summary"] || "");
  const initialHtml = (() => {
    if (editingRow["bodyHtml"]) return String(editingRow["bodyHtml"]);
    if (editingRow["content"]) return String(editingRow["content"]);
    if (
      Array.isArray(editingRow["article_translations"]) &&
      editingRow["article_translations"].length > 0
    ) {
      const tr =
        editingRow["article_translations"].find((t: any) => t.language_code === "es") ||
        editingRow["article_translations"][0];
      return tr.content_blocks
        ? blocksToHtml(tr.content_blocks)
        : String(tr.body || tr.content || "");
    }
    return "";
  })();

  // Form Fields
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [bodyHtml, setBodyHtml] = useState(initialHtml);
  const [schoolId, setSchoolId] = useState(
    String(
      editingRow["school_id"] ||
        (adminSchoolFilter === "east"
          ? "east"
          : adminSchoolFilter === "lincoln"
            ? "lincoln"
            : "all"),
    ),
  );
  const [categoryId, setCategoryId] = useState(String(editingRow["category_id"] || ""));
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Dates
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const [startsAt, setStartsAt] = useState(
    String(editingRow["starts_at"] || todayDateStr).slice(0, 10) || todayDateStr,
  );
  const [endsAt, setEndsAt] = useState(String(editingRow["ends_at"] || "").slice(0, 10));
  const [isPermanent, setIsPermanent] = useState(!editingRow["ends_at"]);

  // Sources & Verification
  const [sourceName, setSourceName] = useState(String(editingRow["source_name"] || ""));
  const [officialUrl, setOfficialUrl] = useState(String(editingRow["official_url"] || ""));
  const [verifiedAt, setVerifiedAt] = useState(
    String(editingRow["verified_at"] || todayDateStr).slice(0, 10) || todayDateStr,
  );
  const [adminNote, setAdminNote] = useState(String(editingRow["admin_note"] || ""));

  // Publishing & Media
  const [slug, setSlug] = useState(String(editingRow["slug"] || ""));
  const [status, setStatus] = useState(String(editingRow["status"] || "published"));
  const [featuredImage, setFeaturedImage] = useState(
    String(editingRow["featured_image_url"] || editingRow["card_banner_url"] || ""),
  );
  const [cardBanner, setCardBanner] = useState(
    String(editingRow["card_banner_url"] || editingRow["featured_image_url"] || ""),
  );
  const [cardBg, setCardBg] = useState(String(editingRow["card_bg"] || ""));
  const [imageAlt, setImageAlt] = useState(String(editingRow["image_alt"] || ""));
  const [isFeatured, setIsFeatured] = useState(Boolean(editingRow["is_featured"]));

  const [isSaving, setIsSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [permanentConfirmOpen, setPermanentConfirmOpen] = useState(false);

  // Track if we loaded language switch
  const lastLoadedLangRef = useRef<string>("es");

  // Load translations on explicit language switch only
  useEffect(() => {
    if (lastLoadedLangRef.current === lang) return;
    lastLoadedLangRef.current = lang;

    let isMounted = true;
    async function loadLangData() {
      if (!articleId) return;
      let localTrs: any[] = Array.isArray(editingRow["article_translations"])
        ? editingRow["article_translations"]
        : [];

      if (localTrs.length === 0) {
        try {
          const raw = localStorage.getItem("dmps_db_article_translations");
          if (raw) {
            const all = JSON.parse(raw);
            localTrs = all.filter((r: any) => r.article_id === articleId);
          }
        } catch {
          // ignore
        }
      }

      if (localTrs.length === 0) {
        try {
          const { data } = await (supabase as any)
            .from("article_translations")
            .select("*")
            .eq("article_id", articleId);
          if (Array.isArray(data) && data.length > 0) localTrs = data;
        } catch (err) {
          void err;
        }
      }

      const tr = localTrs.find((t) => t.language_code === lang);
      if (tr && isMounted) {
        if (tr.title) setTitle(tr.title);
        if (tr.summary) setSummary(tr.summary);
        if (tr.content_blocks) setBodyHtml(blocksToHtml(tr.content_blocks));
        else if (tr.body || tr.content) setBodyHtml(tr.body || tr.content);
      }
    }
    loadLangData();
    return () => {
      isMounted = false;
    };
  }, [articleId, lang, editingRow]);

  // Validation logic
  const handleValidateAndSave = async (forcePermanent = false) => {
    if (!title.trim()) {
      toast.error("El título del artículo es obligatorio.");
      setActiveStep(1);
      return;
    }

    // Validate dates
    if (startsAt && endsAt) {
      if (new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
        toast.error(
          "Error en fechas: La fecha de término no puede ser anterior a la fecha de inicio.",
        );
        setActiveStep(3);
        return;
      }
    }

    // Check if user publishes without an end date and hasn't explicitly confirmed permanent
    if (!endsAt && !isPermanent && !forcePermanent && status === "published") {
      setPermanentConfirmOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      let finalCategoryId = categoryId;
      if (isCreatingNewCategory && newCategoryName.trim()) {
        const catNameClean = newCategoryName.trim();
        const catSlugClean = catNameClean
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-");

        const newCatRow = {
          id: `cat_${Date.now()}`,
          name: catNameClean,
          slug: catSlugClean || `cat-${Date.now()}`,
          icon: "BookOpen",
          display_order: categoriesList.length + 1,
          is_featured: true,
          is_visible: true,
        };
        await upsertRow("categories", newCatRow);
        finalCategoryId = newCatRow.id;
      }

      const finalSlug =
        slug.trim() ||
        title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "") ||
        `articulo${Date.now()}`;

      const bannerUrlFinal = cardBanner.trim() || null;
      const articleData = {
        id: articleId || `art_${Date.now()}`,
        slug: finalSlug,
        category_id: finalCategoryId || null,
        school_id: schoolId || null,
        title: title.trim(),
        summary: summary.trim(),
        status: status || "published",
        is_featured: isFeatured,
        featured_image_url: bannerUrlFinal,
        card_banner_url: bannerUrlFinal,
        card_bg: cardBg.trim() || null,
        image_alt: imageAlt.trim() || null,
        starts_at: startsAt ? `${startsAt}T00:00:00` : null,
        ends_at: endsAt ? `${endsAt}T23:59:59` : null,
        source_name: sourceName.trim() || null,
        official_url: officialUrl.trim() || null,
        verified_at: verifiedAt ? `${verifiedAt}T00:00:00` : new Date().toISOString(),
        admin_note: adminNote.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const savedArt = await upsertRow("articles", articleData);
      const newArticleId = String(savedArt.id);

      // Save translation to unified persistent storage and server disk
      const trBody = {
        id: `tr_${newArticleId}_${lang}`,
        article_id: newArticleId,
        language_code: lang,
        title: title.trim(),
        summary: summary.trim(),
        content_blocks: [{ type: "paragraph", text: bodyHtml }],
        updated_at: new Date().toISOString(),
      };

      await upsertRow("article_translations", trBody);
      notifyContentUpdated("articles");
      notifyContentUpdated("article_translations");

      // Log audit
      try {
        await logAudit(
          articleId ? "update" : "create",
          "articles",
          newArticleId,
          `Artículo ${status === "published" ? "publicado" : "guardado como borrador"}`,
        );
      } catch (auditErr) {
        console.warn("[audit log error]", auditErr);
      }

      toast.success("¡Artículo guardado y sincronizado en vivo exitosamente!");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar el artículo");
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { num: 1, label: "1. Tarjeta y Portada (Todo Junto)" },
    { num: 2, label: "2. Contenido Completo" },
    { num: 3, label: "3. Fechas y Vigencia" },
    { num: 4, label: "4. Publicación y Estado" },
  ];

  return (
    <Dialog open onOpenChange={(open) => !isSaving && !open && onClose()}>
      <DialogContent
        onPointerDownOutside={(e) => isSaving && e.preventDefault()}
        onEscapeKeyDown={(e) => isSaving && e.preventDefault()}
        className="max-h-[94dvh] overflow-y-auto sm:max-w-4xl lg:max-w-6xl p-0 gap-0 rounded-2xl"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-extrabold flex items-center gap-2 text-foreground">
              <Sparkles className="size-5 text-primary" />
              <span>{articleId ? "Editar Artículo" : "Nuevo Artículo Informativo"}</span>
            </DialogTitle>

            <span className="text-xs font-bold text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-xl">
              Traducción automática activa
            </span>
          </div>

          {/* Step Navigator */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {steps.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveStep(s.num)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-start border ${
                  activeStep === s.num
                    ? "bg-primary text-white border-primary shadow-2xs"
                    : activeStep > s.num
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step Body Content */}
        <div className="p-6 space-y-5">
          {/* STEP 1: All-in-One Card Editor (Description, Banner with mover/rotar/escalar, Background, Categories & Real-time Live Preview) */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Input Form (Title, Description, Banner, Colors, Category, School) */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-foreground block">
                      Título del artículo <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Ej: Guía de Inscripciones y Requisitos Escolares"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1.5 min-h-11 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-foreground block">
                      Descripción o Resumen de la Tarjeta{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      placeholder="Escribe la descripción o resumen que aparecerá directamente en la portada de la tarjeta..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="mt-1.5 min-h-[90px] rounded-xl text-xs sm:text-sm leading-relaxed"
                      rows={3}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Este texto se muestra en la tarjeta de la página principal y en el catálogo.
                    </p>
                  </div>

                  {/* Banner Upload & Free Image Transform (Move, Scale, Rotate) */}
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Banner de la Tarjeta (Imagen de Portada)
                      </label>
                      <span className="text-[11px] text-primary font-semibold">
                        Soporta Mover, Escalar y Rotar
                      </span>
                    </div>
                    <FileUploadInput
                      id="card-banner-input"
                      value={cardBanner}
                      onChange={setCardBanner}
                      helperText="Sube o pega la imagen. Podrás rotarla, ampliarla y moverla libremente."
                      placeholder="https://... o sube una imagen"
                      accept="image/*"
                    />
                  </div>

                  {/* Card Background Colors & Gradients */}
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Fondo de la Tarjeta
                      </label>
                      {cardBg && (
                        <button
                          type="button"
                          onClick={() => setCardBg("")}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          Restablecer por defecto
                        </button>
                      )}
                    </div>

                    {/* Gradients */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                        Degradados Rápidos
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { name: "Por defecto", val: "" },
                          {
                            name: "Amanecer",
                            val: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
                          },
                          {
                            name: "Océano",
                            val: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
                          },
                          {
                            name: "Rosa",
                            val: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                          },
                          {
                            name: "Menta",
                            val: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                          },
                          {
                            name: "Lavanda",
                            val: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
                          },
                          {
                            name: "Noche",
                            val: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
                          },
                          {
                            name: "Escarlata",
                            val: "linear-gradient(135deg, #e11d48 0%, #fb923c 100%)",
                          },
                        ].map((g) => (
                          <button
                            key={g.name}
                            type="button"
                            onClick={() => setCardBg(g.val)}
                            style={g.val ? { background: g.val } : undefined}
                            className={`h-7 rounded-lg px-2 text-[11px] font-bold transition-all border text-start flex items-center justify-between cursor-pointer ${
                              cardBg === g.val
                                ? "border-primary ring-2 ring-primary/40 shadow-xs"
                                : "border-border hover:scale-[1.02]"
                            } ${
                              g.val.includes("#0f172a") || g.val.includes("#e11d48")
                                ? "text-white"
                                : "text-foreground bg-card"
                            }`}
                          >
                            <span className="truncate">{g.name}</span>
                            {cardBg === g.val && <span className="text-[10px]">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Solids */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                        Colores Sólidos
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: "Blanco", val: "#ffffff" },
                          { name: "Gris Suave", val: "#f8fafc" },
                          { name: "Azul Tenue", val: "#eff6ff" },
                          { name: "Rosa Tenue", val: "#fff1f2" },
                          { name: "Verde Tenue", val: "#ecfdf5" },
                          { name: "Ámbar Tenue", val: "#fffbeb" },
                          { name: "Púrpura Tenue", val: "#faf5ff" },
                          { name: "Carbón Oscuro", val: "#0f172a" },
                        ].map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setCardBg(c.val)}
                            style={{ backgroundColor: c.val }}
                            className={`size-6 rounded-lg border transition-transform hover:scale-110 cursor-pointer ${
                              cardBg === c.val
                                ? "border-primary ring-2 ring-primary/40 shadow-xs"
                                : "border-border"
                            }`}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Custom Hex */}
                    <div>
                      <Input
                        value={cardBg}
                        onChange={(e) => setCardBg(e.target.value)}
                        placeholder="Ej: #f0fdf4 o linear-gradient(...)"
                        className="h-8 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* School & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* School Scope */}
                    <div className="rounded-2xl border border-border/80 bg-card p-3.5 space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Escuela
                      </label>
                      <select
                        value={schoolId}
                        onChange={(e) => setSchoolId(e.target.value)}
                        className="w-full min-h-10 rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                      >
                        <option value="all">Todas las escuelas (Distrito)</option>
                        <option value="lincoln">Lincoln High School</option>
                        <option value="east">East High School</option>
                      </select>
                    </div>

                    {/* Category */}
                    <div className="rounded-2xl border border-border/80 bg-card p-3.5 space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Categoría
                      </label>
                      {!isCreatingNewCategory ? (
                        <div className="flex gap-1.5">
                          <select
                            value={categoryId}
                            onChange={(e) => {
                              if (e.target.value === "NEW") setIsCreatingNewCategory(true);
                              else setCategoryId(e.target.value);
                            }}
                            className="min-h-10 flex-1 rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground"
                          >
                            <option value="">Selecciona categoría...</option>
                            {categoriesList.map((cat) => (
                              <option key={String(cat.id)} value={String(cat.id)}>
                                {String(cat.name)}
                              </option>
                            ))}
                            <option value="NEW">+ Nueva categoría...</option>
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-10 rounded-xl px-2.5"
                            onClick={() => setIsCreatingNewCategory(true)}
                          >
                            <FolderPlus className="size-4 text-primary" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <Input
                            placeholder="Nombre de categoría"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="min-h-10 rounded-xl text-xs"
                            autoFocus
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="min-h-10 rounded-xl text-xs"
                            onClick={() => setIsCreatingNewCategory(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Live Real-time Card Preview (Together with Form) */}
                <div className="lg:col-span-5 sticky top-2">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Vista Previa en Vivo de la Tarjeta
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                        En Tiempo Real
                      </span>
                    </div>

                    {/* Exact Article Card Render */}
                    <div
                      style={cardBg ? { background: cardBg } : undefined}
                      className={`rounded-2xl border overflow-hidden transition-all duration-300 shadow-md ${
                        cardBg &&
                        (cardBg.includes("#0") ||
                          cardBg.includes("#1") ||
                          cardBg.includes("0f172a") ||
                          cardBg.includes("e11d48"))
                          ? "text-white border-white/20"
                          : "bg-card text-foreground border-border/80"
                      }`}
                    >
                      {/* Banner */}
                      {cardBanner ? (
                        <div className="relative w-full overflow-hidden border-b border-border/40 bg-muted/20">
                          <img
                            src={cardBanner}
                            alt="Preview banner"
                            className="w-full h-auto max-h-[600px] object-cover rounded-t-2xl"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-28 w-full bg-muted/40 border-b border-dashed border-border/60 flex flex-col items-center justify-center text-xs text-muted-foreground gap-1 p-3 text-center">
                          <Sparkles className="size-4 text-primary/60" />
                          <span>Sube una imagen para ver el banner aquí</span>
                        </div>
                      )}

                      {/* Description & Action */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                              cardBg &&
                              (cardBg.includes("#0") ||
                                cardBg.includes("0f172a") ||
                                cardBg.includes("e11d48"))
                                ? "bg-white/20 text-white"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {categoriesList.find((c) => c.id === categoryId)?.name || "Artículo"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {schoolId === "east"
                              ? "East High"
                              : schoolId === "lincoln"
                                ? "Lincoln"
                                : "Todas las escuelas"}
                          </span>
                        </div>

                        <p
                          className={`text-xs font-medium leading-relaxed line-clamp-4 ${
                            cardBg &&
                            (cardBg.includes("#0") ||
                              cardBg.includes("0f172a") ||
                              cardBg.includes("e11d48"))
                              ? "text-slate-200"
                              : "text-muted-foreground"
                          }`}
                        >
                          {summary ||
                            "Escribe la descripción o resumen en el formulario para ver cómo luce la tarjeta al instante..."}
                        </p>

                        <div
                          className={`pt-2.5 border-t flex items-center justify-between text-xs font-bold ${
                            cardBg &&
                            (cardBg.includes("#0") ||
                              cardBg.includes("0f172a") ||
                              cardBg.includes("e11d48"))
                              ? "border-white/20 text-white"
                              : "border-border/60 text-primary"
                          }`}
                        >
                          <span>Leer más</span>
                          <span>→</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground text-center pt-1">
                      💡 La tarjeta se adapta dinámicamente al tamaño de tu imagen y a los colores
                      seleccionados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Full Rich Article Body Content */}
          {activeStep === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <label className="text-sm font-bold text-foreground block mb-1.5">
                  Cuerpo principal del artículo
                </label>
                <VisualRichEditor
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  placeholder="Redacta el contenido informativo. Puedes usar negritas, listas, subtítulos y cajas destacadas..."
                />
              </div>
            </div>
          )}

          {/* STEP 3: Dates & Source Verification */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Calendar className="size-4 text-primary" />
                    <span>Control de Fechas y Vigencia (America/Chicago)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPermanent}
                      onChange={(e) => {
                        setIsPermanent(e.target.checked);
                        if (e.target.checked) setEndsAt("");
                      }}
                      className="rounded accent-primary"
                    />
                    <span>Contenido permanente (sin fecha de caducidad)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Fecha de inicio (Publicación visible)
                    </label>
                    <Input
                      type="date"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="mt-1 min-h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Fecha de finalización (Caducidad automática)
                    </label>
                    <Input
                      type="date"
                      disabled={isPermanent}
                      value={endsAt}
                      onChange={(e) => {
                        setEndsAt(e.target.value);
                        if (e.target.value) setIsPermanent(false);
                      }}
                      className="mt-1 min-h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Source & Verification */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileCheck2 className="size-4 text-primary" />
                  <span>Fuente Oficial y Verificación</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Nombre de la fuente oficial
                    </label>
                    <Input
                      placeholder="Ej: Distrito Escolar DMPS / Departamento de Transporte"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      className="mt-1 min-h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Enlace oficial (URL con https://)
                    </label>
                    <Input
                      placeholder="https://www.dmschools.org/..."
                      value={officialUrl}
                      onChange={(e) => setOfficialUrl(e.target.value)}
                      className="mt-1 min-h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Nota interna de verificación administrativa
                  </label>
                  <Input
                    placeholder="Ej: Verificado con el boletín oficial de agosto 2026"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="mt-1 min-h-10 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Publishing & Preview */}
          {activeStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
                <h3 className="text-base font-bold text-foreground">Estado de Publicación</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Estado del contenido
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground"
                    >
                      <option value="published">Publicado (Visible)</option>
                      <option value="draft">Borrador (Oculto)</option>
                      <option value="in_review">En revisión por equipo</option>
                      <option value="archived">Archivado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Dirección web (Slug)
                    </label>
                    <Input
                      placeholder="guia-inscripciones"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="mt-1 min-h-11 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border/60">
                  <div>
                    <p className="font-bold text-sm text-foreground">
                      Vista previa multi-dispositivo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Comprueba la visualización en teléfonos, tabletas y computadoras antes de
                      publicar.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const cat =
                        categoriesList.find((c) => c.id === categoryId)?.name || "General";
                      setPreviewData({
                        type: "article",
                        title: title || "Vista previa de artículo",
                        summary,
                        body: bodyHtml,
                        category: cat,
                        school_id: schoolId,
                        starts_at: startsAt,
                        ends_at: endsAt,
                        source_name: sourceName,
                        official_url: officialUrl,
                        image_url: featuredImage,
                        image_alt: imageAlt,
                        status,
                      });
                      setPreviewOpen(true);
                    }}
                    className="min-h-11 gap-2 rounded-xl font-bold border-border shadow-2xs"
                  >
                    <Eye className="size-4 text-primary" />
                    <span>Ver Vista Previa</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-t border-border/80 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            className="min-h-11 rounded-xl text-muted-foreground"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick save button accessible at any step */}
            <Button
              type="button"
              variant="outline"
              disabled={isSaving || !title.trim()}
              className="min-h-11 rounded-xl font-bold px-4 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => handleValidateAndSave()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="size-4 mr-1.5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </Button>

            {activeStep > 1 && (
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                className="min-h-11 rounded-xl"
                onClick={() => setActiveStep(activeStep - 1)}
              >
                Anterior
              </Button>
            )}

            {activeStep < 4 ? (
              <Button
                type="button"
                disabled={isSaving}
                className="min-h-11 rounded-xl font-bold px-6"
                onClick={() => setActiveStep(activeStep + 1)}
              >
                <span>Siguiente</span>
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isSaving || !title.trim()}
                className="min-h-11 rounded-xl font-bold px-8 shadow-soft bg-primary text-white hover:bg-primary/90"
                onClick={() => handleValidateAndSave()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    <span>Guardando y Sincronizando...</span>
                  </>
                ) : (
                  <span>Guardar y Validar</span>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Confirmation modal for permanent content */}
      <ConfirmActionDialog
        open={permanentConfirmOpen}
        onOpenChange={setPermanentConfirmOpen}
        config={{
          title: "Contenido sin fecha de finalización",
          description:
            "Este artículo no tiene una fecha de término establecida. ¿Deseas confirmarlo como información permanente o prefieres agregar una fecha de caducidad?",
          consequence:
            "El contenido permanecerá activo en el portal público de forma indefinida hasta que sea archivado manualmente.",
          confirmText: "Sí, es información permanente",
          cancelText: "Volver y agregar fecha",
          variant: "warning",
          onConfirm: () => {
            setIsPermanent(true);
            void handleValidateAndSave(true);
          },
        }}
      />

      {/* Public Preview Modal */}
      <PublicPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        data={previewData}
        onPublish={() => {
          setStatus("published");
          void handleValidateAndSave();
        }}
        onSaveDraft={() => {
          setStatus("draft");
          void handleValidateAndSave();
        }}
      />
    </Dialog>
  );
}
