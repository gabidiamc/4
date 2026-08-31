import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Clock, Info, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PublicShell } from "@/components/public-shell";
import { SearchInput } from "@/components/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAllAnnouncements,
  fetchCategories,
  fetchFaqs,
  fetchPublishedArticles,
  logSearch,
} from "@/lib/content";
import {
  fetchActivities,
  fetchContacts,
  fetchEvents,
  fetchPrograms,
  fetchSources,
} from "@/lib/directory";
import {
  SEARCH_GROUP_ORDER,
  globalSearch,
  searchGroupLabel,
  type GlobalSearchResult,
  type SearchGroupKey,
} from "@/lib/global-search";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

type StatusFilterKey =
  "all" | "active" | "upcoming" | "happening_now" | "completed" | "out_of_season";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({ q: (search["q"] as string) ?? "" }),
  head: () => ({
    meta: [
      { title: "Búsqueda — DMPS Family Info" },
      {
        name: "description",
        content:
          "Busca avisos, noticias, calendario, programas, deportes, contactos y recursos oficiales con control de vigencia.",
      },
      { property: "og:title", content: "Búsqueda — DMPS Family Info" },
      {
        property: "og:description",
        content:
          "Busca avisos, noticias, calendario, programas, deportes, contactos y recursos oficiales con control de vigencia.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();
  const schoolId = selectedSchool.id;

  const [groupFilter, setGroupFilter] = useState<SearchGroupKey | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");

  const announcements = useQuery({
    queryKey: ["announcements-all", schoolId],
    queryFn: () => fetchAllAnnouncements(schoolId),
  });
  const articles = useQuery({
    queryKey: ["articles", schoolId],
    queryFn: () => fetchPublishedArticles(undefined, schoolId),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const events = useQuery({ queryKey: ["events", schoolId], queryFn: () => fetchEvents(schoolId) });
  const programs = useQuery({
    queryKey: ["programs", schoolId],
    queryFn: () => fetchPrograms(schoolId),
  });
  const activities = useQuery({
    queryKey: ["activities", schoolId],
    queryFn: () => fetchActivities(schoolId),
  });
  const faqs = useQuery({ queryKey: ["faqs", schoolId], queryFn: () => fetchFaqs(schoolId) });
  const contacts = useQuery({
    queryKey: ["contacts", schoolId],
    queryFn: () => fetchContacts(schoolId),
  });
  const sources = useQuery({ queryKey: ["sources"], queryFn: fetchSources });

  const loading =
    announcements.isLoading ||
    articles.isLoading ||
    categories.isLoading ||
    events.isLoading ||
    programs.isLoading ||
    activities.isLoading ||
    faqs.isLoading ||
    contacts.isLoading ||
    sources.isLoading;

  const allResults = useMemo(
    () =>
      globalSearch(q, {
        lang,
        schoolId,
        isLincoln: schoolId === "lincoln",
        announcements: announcements.data ?? [],
        articles: articles.data ?? [],
        categories: categories.data ?? [],
        events: events.data ?? [],
        programs: programs.data ?? [],
        activities: activities.data ?? [],
        faqs: faqs.data ?? [],
        contacts: contacts.data ?? [],
        sources: sources.data ?? [],
      }),
    [
      q,
      lang,
      schoolId,
      announcements.data,
      articles.data,
      categories.data,
      events.data,
      programs.data,
      activities.data,
      faqs.data,
      contacts.data,
      sources.data,
    ],
  );

  // Check if all matched query results are expired / out of season / completed
  const hasOnlyExpiredResults = useMemo(() => {
    if (!q || allResults.length === 0) return false;
    return allResults.every(
      (r) =>
        r.isExpired ||
        r.lifecycleStatus === "completed" ||
        r.lifecycleStatus === "out_of_season" ||
        r.lifecycleStatus === "registration_closed" ||
        r.lifecycleStatus === "archived",
    );
  }, [q, allResults]);

  // Filter by group and status
  const visible = useMemo(() => {
    return allResults.filter((r) => {
      if (groupFilter !== "all" && r.group !== groupFilter) return false;

      if (statusFilter === "active") {
        return (
          r.lifecycleStatus === "active" ||
          r.lifecycleStatus === "happening_now" ||
          r.lifecycleStatus === "upcoming"
        );
      }
      if (statusFilter === "happening_now") {
        return r.lifecycleStatus === "happening_now";
      }
      if (statusFilter === "upcoming") {
        return r.lifecycleStatus === "upcoming";
      }
      if (statusFilter === "completed") {
        return (
          r.lifecycleStatus === "completed" ||
          r.lifecycleStatus === "registration_closed" ||
          r.isExpired
        );
      }
      if (statusFilter === "out_of_season") {
        return r.lifecycleStatus === "out_of_season";
      }

      return true;
    });
  }, [allResults, groupFilter, statusFilter]);

  const groupCounts = useMemo(() => {
    const map = new Map<SearchGroupKey, number>();
    for (const item of allResults) map.set(item.group, (map.get(item.group) ?? 0) + 1);
    return map;
  }, [allResults]);

  const grouped = useMemo(() => {
    const map = new Map<SearchGroupKey, GlobalSearchResult[]>();
    for (const item of visible) {
      const list = map.get(item.group);
      if (list) list.push(item);
      else map.set(item.group, [item]);
    }
    return SEARCH_GROUP_ORDER.filter((g) => map.has(g)).map(
      (g) => [g, map.get(g) ?? []] as [SearchGroupKey, GlobalSearchResult[]],
    );
  }, [visible]);

  useEffect(() => {
    if (q && !loading) void logSearch(q, visible.length, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, loading]);

  useEffect(() => {
    setGroupFilter("all");
    setStatusFilter("all");
  }, [q]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-extrabold leading-tight sm:text-4xl">{t("search.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {t("search.intro")}
        </p>
        <div className="mt-5 sm:mt-6">
          <SearchInput size="sm" defaultValue={q} />
        </div>

        {loading ? (
          <div className="mt-10 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground sm:text-base" aria-live="polite">
                {visible.length} {t("search.count")}
                {q ? ` · ${t("search.for")} “${q}”` : ""}
              </p>

              {/* Status segmented filters */}
              {allResults.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`min-h-8 rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                      statusFilter === "all"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "es" ? "Todos" : "All"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("active")}
                    className={`min-h-8 rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                      statusFilter === "active"
                        ? "bg-emerald-600 text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "es" ? "Vigente" : "Active & Upcoming"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("completed")}
                    className={`min-h-8 rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                      statusFilter === "completed"
                        ? "bg-neutral-600 text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "es" ? "Finalizado" : "Completed / Past"}
                  </button>
                </div>
              ) : null}
            </div>

            {/* Fallback alert banner if no active information was found but older records exist */}
            {hasOnlyExpiredResults && (
              <div
                id="search-expired-fallback-banner"
                className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                role="status"
              >
                <Info className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold">{t("search.no_active_fallback")}</p>
                </div>
              </div>
            )}

            {allResults.length > 0 ? (
              <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                  <FilterChip
                    active={groupFilter === "all"}
                    label={t("search.allChip")}
                    count={allResults.length}
                    onClick={() => setGroupFilter("all")}
                  />
                  {SEARCH_GROUP_ORDER.filter((g) => groupCounts.has(g)).map((group) => (
                    <FilterChip
                      key={group}
                      active={groupFilter === group}
                      label={searchGroupLabel(group, lang)}
                      count={groupCounts.get(group) ?? 0}
                      onClick={() => setGroupFilter(group)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {visible.length === 0 ? (
              <div className="surface-card mt-6 p-6">
                <h2 className="text-lg font-bold sm:text-xl">{t("search.none")}</h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {t("search.noneHint")}
                </p>
                <Link
                  to="/topics"
                  className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
                >
                  {t("categories.title")}
                </Link>
              </div>
            ) : (
              <div className="mt-8 space-y-10">
                {grouped.map(([group, items]) => (
                  <section key={group}>
                    <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {searchGroupLabel(group, lang)}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.7rem] font-bold text-foreground/70">
                        {items.length}
                      </span>
                    </h2>
                    <ul className="mt-3 space-y-3">
                      {items.map((item) => (
                        <li key={item.id}>
                          <ResultCard result={item} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-card text-foreground/75 hover:bg-secondary hover:text-foreground"
      }`}
    >
      <span>{label}</span>
      <span className="text-xs font-bold opacity-70">{count}</span>
    </button>
  );
}

function ResultCard({ result }: { result: GlobalSearchResult }) {
  const body = (
    <>
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${
          result.isDeactivated
            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            : "bg-primary/10 text-primary"
        }`}
      >
        <Search className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`min-w-0 text-base font-bold leading-snug ${
              result.isDeactivated
                ? "text-muted-foreground line-through opacity-85"
                : "text-foreground"
            }`}
          >
            {result.title}
          </h3>
          {result.badgeLabel && result.badgeClass ? (
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${result.badgeClass}`}
            >
              {result.badgeLabel}
            </span>
          ) : null}
          {result.external ? (
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : null}
        </div>

        {result.isDeactivated && (
          <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
            Este recurso se encuentra actualmente desactivado o fuera de vigencia.
          </p>
        )}

        {result.completedDateLabel ? (
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>{result.completedDateLabel}</span>
          </p>
        ) : null}

        {result.snippet ? (
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {result.snippet}
          </p>
        ) : null}
      </div>
    </>
  );

  const className = `surface-card flex items-start gap-3 p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40 sm:gap-4 sm:p-5 ${
    result.isDeactivated
      ? "opacity-75 bg-muted/40 hover:opacity-100"
      : result.isExpired
        ? "opacity-85 hover:opacity-100"
        : ""
  }`;

  if (result.external) {
    return (
      <a href={result.href} target="_blank" rel="noreferrer noopener" className={className}>
        {body}
      </a>
    );
  }

  return (
    <Link to={result.href as "/"} className={className}>
      {body}
    </Link>
  );
}
