import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import logoName from "@/assets/dmps-info-logo.png";
import logoMark from "@/assets/dmps-info-logo.png";
import { fetchAppearance } from "@/lib/directory";
import { useTheme } from "@/lib/theme";
import { useSchool } from "@/lib/school";

export function SiteLogo({
  variant = "full",
  className = "",
  compact = false,
}: {
  variant?: "full" | "mark";
  className?: string;
  compact?: boolean;
}) {
  const { resolved } = useTheme();
  const [realtimeAppearance, setRealtimeAppearance] = useState<AppearanceRow | null>(null);

  const { data: queriedAppearance, refetch } = useQuery({
    queryKey: ["appearance"],
    queryFn: fetchAppearance,
    staleTime: 5 * 1000,
  });

  const appearance = realtimeAppearance ?? queriedAppearance;

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<AppearanceRow>;
      if (customEvt?.detail && typeof customEvt.detail === "object") {
        setRealtimeAppearance(customEvt.detail);
      }
      void refetch();
    };
    window.addEventListener("dmps_appearance_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("dmps_appearance_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refetch]);

  useEffect(() => {
    if (appearance?.favicon_url) {
      let iconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!iconLink) {
        iconLink = document.createElement("link");
        iconLink.rel = "icon";
        document.head.appendChild(iconLink);
      }
      iconLink.href = appearance.favicon_url;
    }
  }, [appearance?.favicon_url]);

  const { selectedSchool } = useSchool();
  // Primary custom logo takes priority; fallback to theme-specific overrides if configured
  let custom: string | null = null;
  if (resolved === "dark" && appearance?.logo_dark_url) {
    custom = appearance.logo_dark_url;
  } else if (resolved === "light" && appearance?.logo_light_url) {
    custom = appearance.logo_light_url;
  } else if (appearance?.logo_url) {
    custom = appearance.logo_url;
  }

  const src = custom || (variant === "full" ? logoName : logoMark);
  const alt = appearance?.logo_alt ?? `DMPS Connect — ${selectedSchool.name}`;
  const height = Math.min(Math.max(appearance?.logo_height ?? 64, 32), 160);

  return (
    <Link
      to="/"
      className={`flex min-w-0 items-center gap-3.5 py-1 focus-visible:outline-none ${className}`}
      aria-label="DMPS Family Info — home"
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className="h-12 w-auto max-w-[240px] sm:max-w-[320px] shrink-0 object-contain transition-all sm:h-[var(--logo-h)]"
        style={{ ["--logo-h" as string]: compact ? "44px" : `${height}px` }}
        height={height}
      />

      {appearance?.show_wordmark === false ? null : (
        <span className="hidden min-w-0 flex-col leading-tight sm:flex">
          <span className="truncate font-display text-base font-extrabold text-foreground">
            DMPS Family Info
          </span>
          <span className="truncate text-xs font-semibold text-primary flex items-center gap-1">
            <span
              className={`inline-block size-2 rounded-full ${
                selectedSchool.id === "lincoln" ? "bg-blue-600" : "bg-rose-600"
              }`}
            />
            {selectedSchool.shortName}
          </span>
        </span>
      )}
    </Link>
  );
}
