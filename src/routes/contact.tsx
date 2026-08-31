import { createFileRoute } from "@tanstack/react-router";

import { ContactsList } from "@/components/contacts-list";
import { LincolnLiaisons } from "@/components/lincoln-liaisons";
import { PublicShell } from "@/components/public-shell";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contactos — DMPS Family Info" },
      {
        name: "description",
        content:
          "Directorio de contactos de las Escuelas Públicas de Des Moines: teléfonos, correos y horarios por departamento.",
      },
      { property: "og:title", content: "Contactos — DMPS Family Info" },
      {
        property: "og:description",
        content: "Directorio de contactos del distrito para las familias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://familiasdmps.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  const { selectedSchool } = useSchool();
  const isLincoln = selectedSchool.id === "lincoln";

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{t("contact.title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {isLincoln ? t("liaisons.subtitle") : t("contacts.subtitle")}
        </p>
        <div className="mt-10">{isLincoln ? <LincolnLiaisons /> : <ContactsList />}</div>
      </div>
    </PublicShell>
  );
}
