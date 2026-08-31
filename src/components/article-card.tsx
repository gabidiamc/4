import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarCheck, FileText } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import type { ArticleRow, CategoryRow } from "@/lib/content";
import { localizedArticle, localizedCategory } from "@/lib/content";
import { useI18n } from "@/lib/i18n";

export function ArticleCard({
  article,
  category,
}: {
  article: ArticleRow;
  category?: CategoryRow | null;
}) {
  const { t, lang } = useI18n();
  const locArticle = localizedArticle(article, lang);
  const locCat = category ? localizedCategory(category, lang) : null;
  const cleanSummary = locArticle.summary?.replace(/<[^>]*>/g, "").replace(/\*\*(.*?)\*\*/g, "$1");

  // Format last reviewed date
  const rawDate = article.updated_at || article.published_at || "2026-08-09T12:00:00Z";
  let formattedDate = "";
  try {
    const d = new Date(rawDate);
    formattedDate = d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    formattedDate = lang === "es" ? "9 ago. 2026" : "Aug 9, 2026";
  }

  return (
    <Link
      to="/articles/$slug"
      params={{ slug: article.slug }}
      data-tutorial="card-details"
      className="surface-card group flex h-full flex-col justify-between p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/40"
    >
      <div className="space-y-3">
        {/* Top bar with icon, category badge & review date metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              {category?.icon ? (
                <CategoryIcon name={category.icon} className="size-5" />
              ) : (
                <BookOpen className="size-5" />
              )}
            </span>

            {locCat?.name ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                <FileText className="size-3" />
                {locCat.name}
              </span>
            ) : null}
          </div>

          {/* Last Reviewed Metadata Indicator */}
          <span
            title={
              lang === "es"
                ? "Información revisada y verificada por la escuela"
                : "Information reviewed and verified by school"
            }
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs"
          >
            <CalendarCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
            <span>
              {lang === "es" ? `Revisado: ${formattedDate}` : `Reviewed: ${formattedDate}`}
            </span>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {locArticle.title}
        </h3>

        {/* Summary */}
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{cleanSummary}</p>
      </div>

      {/* Footer read link */}
      <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-sm font-bold text-primary">
        <span>{t("common.readMore")}</span>
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 transition-transform group-hover:translate-x-1 group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
