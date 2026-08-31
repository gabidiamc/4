import { Check, Compass, GraduationCap, School, ShieldCheck, Sparkles } from "lucide-react";
import { EAST_SCHOOL, LINCOLN_SCHOOL, useSchool, type SchoolId } from "@/lib/school";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function SchoolSelectorModal() {
  const { t, lang } = useI18n();
  const { selectedSchoolId, setSelectedSchool, isModalOpen, closeSchoolModal, isSchoolSelected } =
    useSchool();

  const handleSelect = (id: SchoolId) => {
    setSelectedSchool(id);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeSchoolModal()}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-3xl p-0 border-border bg-card shadow-2xl">
        <div className="relative bg-gradient-to-br from-slate-900 via-primary-deep to-slate-950 p-6 sm:p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="grid size-10 place-items-center rounded-2xl bg-white/10 backdrop-blur text-gold">
              <GraduationCap className="size-6" />
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase text-white/90">
              Des Moines Public Schools
            </span>
          </div>
          <DialogHeader className="text-start">
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t("school.selector.title")}
            </DialogTitle>
            <DialogDescription className="text-slate-200 text-sm sm:text-base mt-2">
              {t("school.selector.subtitle")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Lincoln High Card */}
            <button
              type="button"
              onClick={() => handleSelect("lincoln")}
              className={`group relative flex flex-col justify-between rounded-2xl border-2 p-5 text-start transition-all duration-200 hover:shadow-xl focus-visible:outline-none ${
                selectedSchoolId === "lincoln" && isSchoolSelected
                  ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                  : "border-border bg-card hover:border-blue-400 dark:hover:border-blue-600"
              }`}
            >
              {selectedSchoolId === "lincoln" && isSchoolSelected && (
                <div className="absolute top-4 end-4 grid size-7 place-items-center rounded-full bg-blue-600 text-white shadow">
                  <Check className="size-4 stroke-[3]" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 px-2.5 py-1 text-xs font-bold border border-blue-200 dark:border-blue-800">
                    <ShieldCheck className="size-3.5" />
                    {LINCOLN_SCHOOL.mascot}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("school.selector.southDesMoines")}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors">
                  {LINCOLN_SCHOOL.name}
                </h3>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  {LINCOLN_SCHOOL.motto}
                </p>

                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                  {lang === "es" ? LINCOLN_SCHOOL.description_es : LINCOLN_SCHOOL.description_en}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>{t("school.selector.enterLincoln")}</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  2600 SW 9th St
                </span>
              </div>
            </button>

            {/* East High Card */}
            <button
              type="button"
              onClick={() => handleSelect("east")}
              className={`group relative flex flex-col justify-between rounded-2xl border-2 p-5 text-start transition-all duration-200 hover:shadow-xl focus-visible:outline-none ${
                selectedSchoolId === "east" && isSchoolSelected
                  ? "border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 ring-2 ring-rose-500/20"
                  : "border-border bg-card hover:border-rose-400 dark:hover:border-rose-600"
              }`}
            >
              {selectedSchoolId === "east" && isSchoolSelected && (
                <div className="absolute top-4 end-4 grid size-7 place-items-center rounded-full bg-rose-600 text-white shadow">
                  <Check className="size-4 stroke-[3]" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 px-2.5 py-1 text-xs font-bold border border-rose-200 dark:border-rose-800">
                    <ShieldCheck className="size-3.5" />
                    {EAST_SCHOOL.mascot}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("school.selector.eastDesMoines")}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground group-hover:text-rose-600 transition-colors">
                  {EAST_SCHOOL.name}
                </h3>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                  {EAST_SCHOOL.motto}
                </p>

                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                  {lang === "es" ? EAST_SCHOOL.description_es : EAST_SCHOOL.description_en}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span>{t("school.selector.enterEast")}</span>
                <span className="text-[11px] text-muted-foreground font-normal">815 E 13th St</span>
              </div>
            </button>
          </div>

          <div className="rounded-2xl bg-muted/60 p-4 border border-border flex items-start gap-3 text-xs text-muted-foreground">
            <Sparkles className="size-4 shrink-0 text-gold mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-0.5">
                {t("school.selector.sharedInfoTitle")}
              </p>
              <p>{t("school.selector.sharedInfoBody")}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
