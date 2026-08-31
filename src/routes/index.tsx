import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Clock, Languages, Sparkles } from "lucide-react";

import mascot from "@/assets/mascot.png";
import { AnnouncementCard } from "@/components/announcement-card";
import { ArticleCard } from "@/components/article-card";
import { CategoryIcon } from "@/components/category-icon";
import { PublicShell } from "@/components/public-shell";
import { SearchInput } from "@/components/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchActiveAnnouncements,
  fetchCategories,
  fetchPublishedArticles,
  localizedCategory,
} from "@/lib/content";
import { computeContentStatus, getStatusBadgeInfo } from "@/lib/content-lifecycle";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DMPS Family Info — Recursos e información para familias" },
      {
        name: "description",
        content:
          "Recursos, programas, calendarios, rutas y artículos informativos para las familias de DMPS.",
      },
      {
        property: "og:title",
        content: "DMPS Family Info — Centro multilingüe de recursos para familias",
      },
      {
        property: "og:description",
        content: "Centro multilingüe de recursos e información para las familias.",
      },
      { property: "og:url", content: "https://familiasdmps.app/" },
      { property: "og:image", content: "https://familiasdmps.app/og-preview.jpg" },
      { name: "twitter:image", content: "https://familiasdmps.app/og-preview.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/" }],
  }),
  component: Index,
});

const KEY_DISTRICT_DATES = [
  {
    id: "first-day",
    title_es: "Primer día de clases (Año Escolar 2026-2027)",
    title_en: "First Day of School (2026-2027 School Year)",
    starts_at: "2026-08-26T08:00:00-05:00",
    ends_at: "2026-08-26T15:30:00-05:00",
    tag_es: "Distrito",
    tag_en: "District-wide",
  },
  {
    id: "fall-conferences",
    title_es: "Conferencias de otoño de familias y maestros",
    title_en: "Fall Family-Teacher Conferences",
    starts_at: "2026-10-22T08:00:00-05:00",
    ends_at: "2026-10-23T17:00:00-05:00",
    tag_es: "Conferencias",
    tag_en: "Conferences",
  },
  {
    id: "winter-break",
    title_es: "Vacaciones de invierno (Sin clases)",
    title_en: "Winter Break (No School)",
    starts_at: "2026-12-21T00:00:00-06:00",
    ends_at: "2027-01-04T23:59:59-06:00",
    tag_es: "Receso",
    tag_en: "Break",
  },
  {
    id: "spring-break",
    title_es: "Vacaciones de primavera (Spring Break)",
    title_en: "Spring Break (No School)",
    starts_at: "2027-03-15T00:00:00-05:00",
    ends_at: "2027-03-19T23:59:59-05:00",
    tag_es: "Receso",
    tag_en: "Break",
  },
  {
    id: "last-day",
    title_es: "Último día de clases (Medio día)",
    title_en: "Last Day of School (Half Day)",
    starts_at: "2027-06-03T08:00:00-05:00",
    ends_at: "2027-06-03T12:00:00-05:00",
    tag_es: "Fin de curso",
    tag_en: "End of Year",
  },
];

function Index() {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();
  const categories = useQuery({
    queryKey: ["categories", selectedSchool.id],
    queryFn: () => fetchCategories(selectedSchool.id),
  });
  const announcements = useQuery({
    queryKey: ["announcements", selectedSchool.id],
    queryFn: () => fetchActiveAnnouncements(selectedSchool.id),
  });
  const articles = useQuery({
    queryKey: ["articles", selectedSchool.id],
    queryFn: () => fetchPublishedArticles(undefined, selectedSchool.id),
  });

  const categoriesList = categories.data ?? [];
  const featured = (articles.data ?? []).filter((a) => a.is_featured).slice(0, 6);

  return (
    <PublicShell>
      <section className="hero-wash border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-primary shadow-soft">
            <span
              className={`size-2.5 rounded-full ${
                selectedSchool.id === "lincoln" ? "bg-blue-600" : "bg-rose-600"
              }`}
            />
            <span>{selectedSchool.name}</span>
            <span className="text-muted-foreground">• {selectedSchool.mascot}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {t("home.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {t("home.subtitle")}
          </p>
          <div className="mx-auto mt-8 max-w-2xl" data-tutorial="search">
            <SearchInput />
          </div>
        </div>
      </section>

      {/* Categorías Principales */}
      <section
        id="home-categories-grid"
        data-tutorial="categories"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
        aria-labelledby="popular-heading"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <h2 id="popular-heading" className="text-2xl font-bold sm:text-3xl">
              {t("home.popular")}
            </h2>
            <p className="mt-1 text-muted-foreground">{t("home.popularHint")}</p>
          </div>
          <Link
            to="/topics"
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t("home.viewAll")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-36 w-full rounded-2xl" />
                </li>
              ))
            : categoriesList.map((cat) => {
                const loc = localizedCategory(cat, lang);
                return (
                  <li key={cat.id}>
                    <Link
                      to="/topics/$slug"
                      params={{ slug: cat.slug }}
                      className="surface-card group flex h-full flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <CategoryIcon name={cat.icon} className="size-5" />
                      </span>
                      <span className="text-base font-bold transition-colors group-hover:text-primary">
                        {loc.name}
                      </span>
                      <span className="text-xs leading-snug text-muted-foreground line-clamp-2">
                        {loc.description}
                      </span>
                    </Link>
                  </li>
                );
              })}
        </ul>
      </section>

      {/* Avisos Activos */}
      <section
        id="home-announcements"
        data-tutorial="notices"
        className="border-y border-border bg-secondary/30 py-12"
        aria-labelledby="ann-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div>
              <h2 id="ann-heading" className="text-2xl font-bold sm:text-3xl">
                {t("home.announcements")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("nav.announcementsDesc")}</p>
            </div>
            <Link
              to="/announcements"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("home.viewAll")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {announcements.isLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                ))
              : (announcements.data ?? [])
                  .filter((a) => a.show_on_home)
                  .slice(0, 4)
                  .map((a) => <AnnouncementCard key={a.id} announcement={a} />)}
          </div>
        </div>
      </section>

      {/* Fechas Clave y Calendario */}
      <section
        id="home-key-dates"
        data-tutorial="calendar"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
        aria-labelledby="dates-heading"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" aria-hidden="true" />
              <h2 id="dates-heading" className="text-2xl font-bold sm:text-3xl">
                {lang === "es" ? "Fechas y Calendario Escolar" : "Key School Dates & Calendar"}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {lang === "es"
                ? "Fechas académicas importantes y días sin clases del distrito."
                : "Important academic milestones and no-school days across the district."}
            </p>
          </div>
          <Link
            to="/calendario"
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
          >
            {lang === "es" ? "Ver calendario completo" : "View full calendar"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KEY_DISTRICT_DATES.slice(0, 3).map((item) => {
            const status = computeContentStatus(item);
            const badge = getStatusBadgeInfo(status, lang);
            const title = lang === "es" ? item.title_es : item.title_en;
            const tag = lang === "es" ? item.tag_es : item.tag_en;
            const startDate = new Date(item.starts_at);
            const formattedDate = startDate.toLocaleDateString(lang === "es" ? "es-US" : "en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={item.id}
                className="surface-card flex flex-col justify-between rounded-2xl border border-border p-4 shadow-soft transition-all hover:border-primary/30"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {tag}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
                    >
                      <span className={`size-1.5 rounded-full ${badge.dotClassName}`} />
                      {badge.label}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-foreground">{title}</h3>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Artículos Informativos y Políticas */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="featured-heading">
        <div className="mb-6">
          <h2 id="featured-heading" className="text-2xl font-bold sm:text-3xl">
            {t("home.featured")}
          </h2>
          <p className="mt-1 text-muted-foreground">{t("home.featuredHint")}</p>
        </div>

        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-44 w-full rounded-2xl" />
                </li>
              ))
            : featured.map((a) => {
                const category = categoriesList.find((c) => c.id === a.category_id);
                return (
                  <li key={a.id}>
                    <ArticleCard article={a} category={category} />
                  </li>
                );
              })}
        </ul>
      </section>

      {/* Banner de Ayuda y Contacto */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="surface-card grid items-center gap-6 overflow-hidden bg-primary-soft p-6 sm:p-10 md:grid-cols-[auto_minmax(0,1fr)]">
          <img
            src={mascot}
            alt=""
            loading="lazy"
            className="mx-auto h-36 w-auto object-contain md:h-44"
          />
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <Languages className="size-6 shrink-0 text-primary" aria-hidden="true" />
              {t("home.help.title")}
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">{t("home.help.body")}</p>
            <Link
              to="/contact"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
            >
              {t("contact.title")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
