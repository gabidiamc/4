import { ChevronDown, GraduationCap, School, ShieldCheck } from "lucide-react";
import { EAST_SCHOOL, LINCOLN_SCHOOL, useSchool, type SchoolId } from "@/lib/school";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";

export function SchoolSelectorButton({ className = "" }: { className?: string }) {
  const { t, lang } = useI18n();
  const { selectedSchool, setSelectedSchool, openSchoolModal } = useSchool();

  const isLincoln = selectedSchool.id === "lincoln";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-tutorial="school-selector"
          variant="outline"
          size="sm"
          className={`h-10 rounded-xl px-3 font-semibold gap-2 border-border transition-all ${
            isLincoln
              ? "bg-blue-50/80 text-blue-900 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-100 dark:border-blue-800"
              : "bg-rose-50/80 text-rose-900 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-100 dark:border-rose-800"
          } ${className}`}
          aria-label={t("school.button.switch")}
        >
          <div
            className={`grid size-5 place-items-center rounded-md text-white text-[10px] font-extrabold ${
              isLincoln ? "bg-blue-600" : "bg-rose-600"
            }`}
          >
            {isLincoln ? "LHS" : "EHS"}
          </div>
          <div className="flex flex-col items-start text-start leading-none">
            <span className="text-xs font-bold">{selectedSchool.shortName}</span>
            <span className="text-[10px] opacity-75 font-medium">{selectedSchool.mascot}</span>
          </div>
          <ChevronDown className="size-3.5 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-xl border-border">
        <DropdownMenuLabel className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("school.button.selectHighSchool")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={() => setSelectedSchool("lincoln")}
          className={`flex items-start gap-3 rounded-xl p-2.5 cursor-pointer transition-colors ${
            isLincoln ? "bg-blue-50 dark:bg-blue-950/50 font-bold" : ""
          }`}
        >
          <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-blue-600 text-white text-xs font-bold">
            L
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{LINCOLN_SCHOOL.name}</div>
            <div className="text-xs text-muted-foreground">
              {LINCOLN_SCHOOL.mascot} • {t("school.selector.southDesMoines")}
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setSelectedSchool("east")}
          className={`flex items-start gap-3 rounded-xl p-2.5 cursor-pointer transition-colors ${
            !isLincoln ? "bg-rose-50 dark:bg-rose-950/50 font-bold" : ""
          }`}
        >
          <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-rose-600 text-white text-xs font-bold">
            E
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{EAST_SCHOOL.name}</div>
            <div className="text-xs text-muted-foreground">
              {EAST_SCHOOL.mascot} • {t("school.selector.eastDesMoines")}
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={() => openSchoolModal()}
          className="rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <GraduationCap className="size-3.5 mr-2" />
          {t("school.button.compareProfiles")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
