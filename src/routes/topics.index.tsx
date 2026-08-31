import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { CategoryIcon } from "@/components/category-icon";
import { PublicShell } from "@/components/public-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategories, fetchPublishedArticles, localizedCategory } from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/topics/")({
  head: () => ({
    meta: [
      { title: "Artículos Informativos para Familias — DMPS Family Info" },
      {
        name: "description",
        content:
          "Explora guías y artículos de lectura sobre inscripciones, salud, comidas, transporte y apoyo escolar para las familias.",
      },
      { property: "og:title", content: "Artículos Informativos para Familias — DMPS Family Info" },
      {
        property: "og:description",
        content: "Guías e información de lectura oficial para las familias de DMPS.",
      },
      { property: "og:url", content: "https://familiasdmps.app/topics" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/topics" }],
  }),
  component: TopicsPage,
});

function TopicsPage() {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();
  const categories = useQuery({
    queryKey: ["categories", selectedSchool.id],
    queryFn: () => fetchCategories(selectedSchool.id),
  });
  const articles = useQuery({
    queryKey: ["articles", selectedSchool.id],
    queryFn: () => fetchPublishedArticles(undefined, selectedSchool.id),
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{t("categories.title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("categories.subtitle")}</p>

        {categories.isLoading ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-44 w-full rounded-2xl" />
              </li>
            ))}
          </ul>
        ) : (categories.data ?? []).length === 0 ? (
          <div className="surface-card mt-10 p-8 sm:p-10 rounded-3xl border border-border text-center max-w-2xl mx-auto space-y-3">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <CategoryIcon name="BookOpen" className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Estamos preparando información nueva y verificada para las familias.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vuelve pronto para consultar artículos, eventos y recursos actualizados.
            </p>
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(categories.data ?? []).map((cat) => {
              const loc = localizedCategory(cat, lang);
              const count = (articles.data ?? []).filter(
                (a) =>
                  a.category_id === cat.id ||
                  a.category_id === cat.slug ||
                  a.categories?.slug === cat.slug ||
                  a.categories?.slug === cat.id,
              ).length;
              return (
                <li key={cat.id}>
                  <Link
                    to="/topics/$slug"
                    params={{ slug: cat.slug }}
                    className="surface-card group flex h-full flex-col gap-3 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/40"
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <CategoryIcon name={cat.icon} className="size-6" />
                    </span>
                    <span className="text-xl font-bold group-hover:text-primary transition-colors">
                      {loc.name}
                    </span>
                    <span className="text-sm text-muted-foreground leading-snug">
                      {loc.description}
                    </span>
                    <span className="mt-auto pt-3 text-xs font-bold text-primary">
                      {count} {t("categories.articles")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PublicShell>
  );
}
