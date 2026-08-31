import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Building,
  Calendar,
  ExternalLink,
  GraduationCap,
  MapPin,
  Phone,
  School,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { EAST_SCHOOL, LINCOLN_SCHOOL, useSchool, type SchoolId } from "@/lib/school";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/escuelas")({
  head: () => ({
    meta: [
      { title: "Escuelas Secundarias — Lincoln High & East High | DMPS" },
      {
        name: "description",
        content:
          "Información sobre Abraham Lincoln High School y Des Moines East High School: directores, teléfonos, enlaces BFL y servicios de apoyo.",
      },
      { property: "og:title", content: "Escuelas Secundarias — Lincoln High & East High | DMPS" },
      {
        property: "og:description",
        content:
          "Directores, teléfonos, enlaces BFL y servicios de apoyo de las escuelas secundarias de Des Moines.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://dmps-familias.lovable.app/escuelas" },
    ],
    links: [{ rel: "canonical", href: "https://dmps-familias.lovable.app/escuelas" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: "Abraham Lincoln High School",
            parentOrganization: {
              "@type": "EducationalOrganization",
              name: "Des Moines Public Schools",
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: "Des Moines",
              addressRegion: "IA",
              addressCountry: "US",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: "Des Moines East High School",
            parentOrganization: {
              "@type": "EducationalOrganization",
              name: "Des Moines Public Schools",
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: "Des Moines",
              addressRegion: "IA",
              addressCountry: "US",
            },
          },
        ]),
      },
    ],
  }),
  component: EscuelasPage,
});

function EscuelasPage() {
  const { t, lang } = useI18n();
  const { selectedSchool, setSelectedSchool } = useSchool();

  return (
    <PublicShell>
      <section className="hero-wash border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary shadow-soft mb-3">
            <School className="size-4" />
            <span>{t("schoolsPage.badge")}</span>
          </div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">{t("schoolsPage.title")}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {t("schoolsPage.subtitle")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Lincoln High School Card */}
          <div
            className={`surface-card rounded-3xl p-6 sm:p-8 border-2 transition-all flex flex-col justify-between ${
              selectedSchool.id === "lincoln"
                ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20"
                : "border-border hover:border-blue-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 px-3 py-1 text-xs font-bold border border-blue-300 dark:border-blue-800">
                  <ShieldCheck className="size-4" />
                  {LINCOLN_SCHOOL.mascot}
                </span>
                {selectedSchool.id === "lincoln" && (
                  <span className="rounded-full bg-blue-600 text-white px-3 py-0.5 text-xs font-bold">
                    {t("schoolsPage.activeSchool")}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {LINCOLN_SCHOOL.name}
              </h2>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                {LINCOLN_SCHOOL.motto}
              </p>

              <p className="text-sm text-muted-foreground mt-4">
                {lang === "es" ? LINCOLN_SCHOOL.description_es : LINCOLN_SCHOOL.description_en}
              </p>

              <div className="mt-6 space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5 text-foreground">
                  <MapPin className="size-4 text-blue-600 shrink-0" />
                  <span>
                    {LINCOLN_SCHOOL.address}, {LINCOLN_SCHOOL.cityStateZip}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <Phone className="size-4 text-blue-600 shrink-0" />
                  <a href={`tel:${LINCOLN_SCHOOL.phone}`} className="hover:underline font-medium">
                    {t("schoolsPage.mainPhone")}: {LINCOLN_SCHOOL.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <Users className="size-4 text-blue-600 shrink-0" />
                  <a
                    href={`tel:${LINCOLN_SCHOOL.bflPhone}`}
                    className="hover:underline font-medium"
                  >
                    {LINCOLN_SCHOOL.bflName}: {LINCOLN_SCHOOL.bflPhone}
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <GraduationCap className="size-4 text-blue-600 shrink-0" />
                  <span>
                    {t("schoolsPage.principal")}: {LINCOLN_SCHOOL.principal} (
                    {LINCOLN_SCHOOL.grades})
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border/80 flex flex-wrap gap-3">
              <Button
                onClick={() => setSelectedSchool("lincoln")}
                className={
                  selectedSchool.id === "lincoln" ? "bg-blue-600 text-white" : "variant-outline"
                }
              >
                {selectedSchool.id === "lincoln"
                  ? t("schoolsPage.viewingLincoln")
                  : t("schoolsPage.selectLincoln")}
              </Button>
              <a
                href={LINCOLN_SCHOOL.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline px-3 py-2"
              >
                <span>{t("schoolsPage.officialWebsite")}</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>

          {/* East High School Card */}
          <div
            className={`surface-card rounded-3xl p-6 sm:p-8 border-2 transition-all flex flex-col justify-between ${
              selectedSchool.id === "east"
                ? "border-rose-600 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                : "border-border hover:border-rose-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 px-3 py-1 text-xs font-bold border border-rose-300 dark:border-rose-800">
                  <ShieldCheck className="size-4" />
                  {EAST_SCHOOL.mascot}
                </span>
                {selectedSchool.id === "east" && (
                  <span className="rounded-full bg-rose-600 text-white px-3 py-0.5 text-xs font-bold">
                    {t("schoolsPage.activeSchool")}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {EAST_SCHOOL.name}
              </h2>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-1">
                {EAST_SCHOOL.motto}
              </p>

              <p className="text-sm text-muted-foreground mt-4">
                {lang === "es" ? EAST_SCHOOL.description_es : EAST_SCHOOL.description_en}
              </p>

              <div className="mt-6 space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5 text-foreground">
                  <MapPin className="size-4 text-rose-600 shrink-0" />
                  <span>
                    {EAST_SCHOOL.address}, {EAST_SCHOOL.cityStateZip}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <Phone className="size-4 text-rose-600 shrink-0" />
                  <a href={`tel:${EAST_SCHOOL.phone}`} className="hover:underline font-medium">
                    {t("schoolsPage.mainPhone")}: {EAST_SCHOOL.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <Users className="size-4 text-rose-600 shrink-0" />
                  <a href={`tel:${EAST_SCHOOL.bflPhone}`} className="hover:underline font-medium">
                    {EAST_SCHOOL.bflName}: {EAST_SCHOOL.bflPhone}
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-foreground">
                  <GraduationCap className="size-4 text-rose-600 shrink-0" />
                  <span>
                    {t("schoolsPage.principalF")}: {EAST_SCHOOL.principal} ({EAST_SCHOOL.grades})
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border/80 flex flex-wrap gap-3">
              <Button
                onClick={() => setSelectedSchool("east")}
                className={
                  selectedSchool.id === "east" ? "bg-rose-600 text-white" : "variant-outline"
                }
              >
                {selectedSchool.id === "east"
                  ? t("schoolsPage.viewingEast")
                  : t("schoolsPage.selectEast")}
              </Button>
              <a
                href={EAST_SCHOOL.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:underline px-3 py-2"
              >
                <span>{t("schoolsPage.officialWebsite")}</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
