import { useQuery } from "@tanstack/react-query";
import { Clock, Mail, MapPin, Phone, User } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { fetchContacts } from "@/lib/directory";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

/** Directory of contacts published from the staff panel. */
export function ContactsList() {
  const { t } = useI18n();
  const { selectedSchool } = useSchool();
  const contacts = useQuery({
    queryKey: ["contacts", selectedSchool.id],
    queryFn: () => fetchContacts(selectedSchool.id),
  });

  // Contacts store the plain school id ("lincoln" / "east"); district-wide rows have none.
  const targetSchoolId = selectedSchool.id;

  const rows = (contacts.data ?? []).filter((c) => {
    if (c.is_visible === false) return false;
    if (!c.school_id) return true; // District-wide contact
    return c.school_id === targetSchoolId;
  });

  if (contacts.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="text-lg text-muted-foreground">{t("contacts.none")}</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {rows.map((c) => (
        <li key={c.id} className="surface-card space-y-2 p-5">
          <h3 className="text-lg font-bold leading-snug">{c.department}</h3>
          {c.person_name ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                {c.person_name}
                {c.job_title ? ` — ${c.job_title}` : ""}
              </span>
            </p>
          ) : null}
          {c.phone ? (
            <p className="flex items-center gap-2 text-sm">
              <Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <a className="font-medium hover:underline" href={`tel:${c.phone.replace(/\s/g, "")}`}>
                {c.phone}
                {c.extension ? ` ext. ${c.extension}` : ""}
              </a>
            </p>
          ) : null}
          {c.email ? (
            <p className="flex items-center gap-2 text-sm">
              <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <a className="font-medium break-all hover:underline" href={`mailto:${c.email}`}>
                {c.email}
              </a>
            </p>
          ) : null}
          {c.address ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{c.address}</span>
            </p>
          ) : null}
          {c.hours ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{c.hours}</span>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
