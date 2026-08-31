import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Info, Megaphone } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { localizedAnnouncement, type AnnouncementRow } from "@/lib/content";

const STYLES = {
  urgent: {
    wrap: "border-destructive/30 bg-destructive/5",
    chip: "bg-destructive text-destructive-foreground",
    Icon: AlertTriangle,
  },
  important: {
    wrap: "border-warning/40 bg-warning/10",
    chip: "bg-warning text-warning-foreground",
    Icon: Megaphone,
  },
  info: {
    wrap: "border-primary/20 bg-primary-soft",
    chip: "bg-primary text-primary-foreground",
    Icon: Info,
  },
} as const;

export function AnnouncementCard({ announcement }: { announcement: AnnouncementRow }) {
  const { lang, t } = useI18n();
  const { title, message } = localizedAnnouncement(announcement, lang);
  const style = STYLES[announcement.level];
  const Icon = style.Icon;

  return (
    <article
      className={`rounded-2xl border p-5 shadow-soft sm:p-6 ${style.wrap}`}
      aria-labelledby={`ann-${announcement.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${style.chip}`}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          {t(`level.${announcement.level}`)}
        </span>
        {announcement.expires_at ? (
          <span className="text-xs text-muted-foreground">
            {t("announcements.expires")}{" "}
            {new Date(announcement.expires_at).toLocaleDateString(lang)}
          </span>
        ) : null}
      </div>
      <h3 id={`ann-${announcement.id}`} className="mt-3 text-xl font-bold sm:text-2xl">
        {title}
      </h3>
      <p className="mt-2 text-base text-muted-foreground">{message}</p>
      {announcement.link_url ? (
        <a
          href={announcement.link_url}
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline underline-offset-4"
        >
          {t("common.readMore")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      ) : null}
    </article>
  );
}

export function AnnouncementBanner({ announcement }: { announcement: AnnouncementRow }) {
  const { lang, t } = useI18n();
  const { title } = localizedAnnouncement(announcement, lang);

  return (
    <div className="bg-destructive text-destructive-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm sm:px-6">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        <span className="font-bold uppercase tracking-wide">{t("level.urgent")}</span>
        <span className="min-w-0 flex-1 font-medium">{title}</span>
        <Link to="/announcements" className="shrink-0 font-semibold underline underline-offset-4">
          {t("common.readMore")}
        </Link>
      </div>
    </div>
  );
}
