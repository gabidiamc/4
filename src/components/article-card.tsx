import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { ArticleRow, CategoryRow } from "@/lib/content";
import { localizedArticle } from "@/lib/content";
import { useI18n } from "@/lib/i18n";

export function ArticleCard({ article }: { article: ArticleRow; category?: CategoryRow | null }) {
  const { t, lang } = useI18n();
  const locArticle = localizedArticle(article, lang);
  const cleanSummary = locArticle.summary?.replace(/<[^>]*>/g, "").replace(/\*\*(.*?)\*\*/g, "$1");
  const bannerUrl = article.card_banner_url || article.featured_image_url || null;
  const cardBg = article.card_bg?.trim() || null;

  // Check if background might be dark
  const isDarkBg =
    cardBg &&
    (cardBg.includes("#0") ||
      cardBg.includes("#1") ||
      cardBg.includes("#2") ||
      cardBg.includes("#3") ||
      cardBg.includes("rgb(0") ||
      cardBg.includes("rgb(1") ||
      cardBg.includes("rgb(2") ||
      cardBg.includes("rgb(3") ||
      cardBg.includes("0f172a") ||
      cardBg.includes("1e293b") ||
      cardBg.includes("1e3a8a"));

  return (
    <Link
      to="/articles/$slug"
      params={{ slug: article.slug }}
      data-tutorial="card-details"
      style={cardBg ? { background: cardBg } : undefined}
      className={`surface-card group flex h-full flex-col justify-between overflow-hidden p-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/40 ${
        isDarkBg ? "text-white border-white/20" : ""
      }`}
    >
      {bannerUrl && (
        <div className="relative w-full overflow-hidden border-b border-border/50 bg-muted/20">
          <img
            src={bannerUrl}
            alt={locArticle.title || "Banner del artículo"}
            className="w-full h-auto max-h-[600px] object-cover transition-transform duration-300 group-hover:scale-[1.02] rounded-t-2xl"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          {/* Summary / Description only */}
          <p
            className={`text-sm leading-relaxed line-clamp-4 ${
              isDarkBg ? "text-slate-100 font-medium" : "text-foreground/90 font-medium"
            }`}
          >
            {cleanSummary || locArticle.title}
          </p>
        </div>

        {/* Footer read link */}
        <div
          className={`mt-6 pt-4 border-t flex items-center justify-between text-sm font-bold ${
            isDarkBg ? "border-white/20 text-white" : "border-border/60 text-primary"
          }`}
        >
          <span>{t("common.readMore")}</span>
          <span
            className={`grid size-8 place-items-center rounded-lg transition-transform group-hover:translate-x-1 ${
              isDarkBg
                ? "bg-white/20 text-white group-hover:bg-white group-hover:text-slate-900"
                : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
            }`}
          >
            <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
