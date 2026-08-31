import { Users } from "lucide-react";
import type { ReactNode } from "react";

import { PublicShell } from "@/components/public-shell";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LINCOLN_SCHOOL, useSchool } from "@/lib/school";

/** Envoltura para secciones exclusivas de Lincoln High School. */
export function LincolnOnly({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { selectedSchoolId, setSelectedSchool } = useSchool();

  if (selectedSchoolId !== "lincoln") {
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <Users className="mx-auto size-10 text-primary" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{t("lincolnOnly.title")}</h1>
          <p className="mt-3 text-muted-foreground">
            {t("lincolnOnly.body").replace("{school}", LINCOLN_SCHOOL.name)}
          </p>
          <Button className="mt-6 min-h-11 rounded-xl" onClick={() => setSelectedSchool("lincoln")}>
            {t("lincolnOnly.cta")}
          </Button>
        </div>
      </PublicShell>
    );
  }

  return <>{children}</>;
}
