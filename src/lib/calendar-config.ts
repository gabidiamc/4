export type CalendarSettings = {
  imageUrl: string;
  pdfUrl: string;
  title: string;
  subtitle: string;
  lastUpdated?: string;
};

const DEFAULT_SETTINGS: Record<string, CalendarSettings> = {
  lincoln: {
    imageUrl:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1600&auto=format&fit=crop&q=80",
    pdfUrl: "https://www.dmschools.org/wp-content/uploads/2024/02/2026-2027-District-Calendar.pdf",
    title: "Calendario Escolar 2026-2027 — Lincoln High School",
    subtitle: "Días de clase, conferencias, festivos y eventos oficiales.",
    lastUpdated: new Date().toISOString(),
  },
  east: {
    imageUrl:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1600&auto=format&fit=crop&q=80",
    pdfUrl: "https://www.dmschools.org/wp-content/uploads/2024/02/2026-2027-District-Calendar.pdf",
    title: "Calendario Escolar 2026-2027 — East High School",
    subtitle: "Días de clase, conferencias, festivos y eventos oficiales.",
    lastUpdated: new Date().toISOString(),
  },
};

export function getCalendarSettings(schoolId: string = "lincoln"): CalendarSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS[schoolId] || DEFAULT_SETTINGS.lincoln;
  }

  try {
    const raw = localStorage.getItem(`dmps_custom_calendar_${schoolId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error reading custom calendar settings", e);
  }

  return DEFAULT_SETTINGS[schoolId] || DEFAULT_SETTINGS.lincoln;
}

export function saveCalendarSettings(schoolId: string, settings: CalendarSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `dmps_custom_calendar_${schoolId}`,
      JSON.stringify({ ...settings, lastUpdated: new Date().toISOString() }),
    );
    window.dispatchEvent(new Event("dmps-calendar-updated"));
  } catch (e) {
    console.error("Error saving custom calendar settings", e);
  }
}
