/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { readCache, writeCache, notifyContentUpdated } from "./sync";
import type { LanguageCode } from "./i18n";
import { filterBySchool } from "./school-scope";

export type MenuSection = "main_header" | "resources_dropdown" | "footer_links";

export interface PublicMenuItem {
  id: string;
  section: MenuSection;
  label_es: string;
  label_en: string;
  label_kar: string;
  desc_es?: string;
  desc_en?: string;
  desc_kar?: string;
  path: string;
  icon: string;
  icon_color?: string;
  display_order: number;
  is_visible: boolean;
  is_external?: boolean;
  school_id?: string | null;
  admin_route?: string;
  badge?: string;
  updated_at?: string;
}

export const MENU_SECTIONS: { id: MenuSection; label: string; description: string }[] = [
  {
    id: "main_header",
    label: "Barra Superior Principal (Header)",
    description:
      "Enlaces visibles en la barra de navegación superior en pantallas de escritorio y menú móvil.",
  },
  {
    id: "resources_dropdown",
    label: "Menú Desplegable de Recursos",
    description:
      "Elementos dentro del menú desplegable 'Recursos' tanto en escritorio como en móvil.",
  },
  {
    id: "footer_links",
    label: "Enlaces del Pie de Página (Footer)",
    description: "Enlaces rápidos listados en el pie de página de todo el sitio público.",
  },
];

export const DEFAULT_PUBLIC_MENU_ITEMS: PublicMenuItem[] = [
  // --- Barra Superior (Main Header) ---
  {
    id: "nav_home",
    section: "main_header",
    label_es: "Inicio",
    label_en: "Home",
    label_kar: "ဟံၣ်",
    path: "/",
    icon: "Home",
    display_order: 10,
    is_visible: true,
    admin_route: "/admin",
  },
  {
    id: "nav_announcements",
    section: "main_header",
    label_es: "Avisos",
    label_en: "Announcements",
    label_kar: "တၢ်ဟ့ၣ်သ့ၣ်ညါ",
    path: "/announcements",
    icon: "Megaphone",
    display_order: 20,
    is_visible: true,
    admin_route: "/admin/anuncios",
  },
  {
    id: "nav_calendar",
    section: "main_header",
    label_es: "Calendario",
    label_en: "Calendar",
    label_kar: "မုၢ်နံၤမုၢ်သီလံာ်",
    path: "/calendario",
    icon: "CalendarDays",
    display_order: 30,
    is_visible: true,
    admin_route: "/admin/calendario",
  },
  {
    id: "nav_resources",
    section: "main_header",
    label_es: "Recursos",
    label_en: "Resources",
    label_kar: "တၢ်မၤစၢၤခိၣ်ဖုး",
    path: "/programas",
    icon: "FolderTree",
    display_order: 40,
    is_visible: true,
    admin_route: "/admin/recursos",
  },
  {
    id: "nav_teams",
    section: "main_header",
    label_es: "Equipos 9º",
    label_en: "9th Grade Teams",
    label_kar: "ကရူၢ် ၉ တီၤ",
    path: "/equipos",
    icon: "Users",
    display_order: 50,
    is_visible: true,
    school_id: "lincoln",
    admin_route: "/admin/articulos",
  },
  {
    id: "nav_articles",
    section: "main_header",
    label_es: "Artículos",
    label_en: "Articles",
    label_kar: "လံာ်တၢ်ကွဲးတဖၣ်",
    path: "/topics",
    icon: "BookOpen",
    display_order: 60,
    is_visible: true,
    admin_route: "/admin/articulos",
  },
  {
    id: "nav_contact",
    section: "main_header",
    label_es: "Contacto",
    label_en: "Contact",
    label_kar: "တၢ်ဆဲးကျိး",
    path: "/contact",
    icon: "Phone",
    display_order: 70,
    is_visible: true,
    admin_route: "/admin/contactos",
  },

  // --- Submenú de Recursos (Resources Dropdown) ---
  {
    id: "res_programs",
    section: "resources_dropdown",
    label_es: "Programas Académicos",
    label_en: "Academic Programs",
    label_kar: "တၢ်ကူၣ်ဘၣ်ကူၣ်သ့ တၢ်ရဲၣ်တၢ်ကျဲၤ",
    desc_es: "Programas académicos y del distrito",
    desc_en: "Academic and community programs",
    desc_kar: "တၢ်ကူၣ်ဘၣ်ကူၣ်သ့ ဒီးတၢ်ရဲၣ်တၢ်ကျဲၤတဖၣ်",
    path: "/programas",
    icon: "GraduationCap",
    icon_color: "text-primary bg-primary/10",
    display_order: 10,
    is_visible: true,
    admin_route: "/admin/programas",
  },
  {
    id: "res_sports",
    section: "resources_dropdown",
    label_es: "Deportes y Actividades",
    label_en: "Sports & Activities",
    label_kar: "တၢ်လုၢ်တၢ်စှီၤ ဒီးတၢ်မၤတဖၣ်",
    desc_es: "Atletismo, deportes y clubes estudiantiles",
    desc_en: "Athletics, sports and student clubs",
    desc_kar: "တၢ်လုၢ်တၢ်စှီၤ ဒီးတၢ်ဖိတဖၣ်အတၢ်ကရူၢ်",
    path: "/deportes-actividades",
    icon: "Trophy",
    icon_color: "text-primary bg-primary/10",
    display_order: 20,
    is_visible: true,
    admin_route: "/admin/actividades",
  },
  {
    id: "res_dart",
    section: "resources_dropdown",
    label_es: "Rutas de Transporte DART",
    label_en: "DART Transit Routes",
    label_kar: "DART လ့ၣ်ကရီၤတၢ်ကျဲ",
    desc_es: "Rutas, paradas y mapa interactivo de autobuses",
    desc_en: "Routes, stops and interactive bus map",
    desc_kar: "လ့ၣ်ကရီၤကျဲ ဒီးတၢ်ဂီၤဟီၣ်ခိၣ်",
    path: "/transporte/dart",
    icon: "Bus",
    icon_color: "text-primary bg-primary/10",
    display_order: 30,
    is_visible: true,
    admin_route: "/admin/dart/configuracion",
  },
  {
    id: "res_bell",
    section: "resources_dropdown",
    label_es: "Horario de Campanas",
    label_en: "Bell Schedule",
    label_kar: "တၢ်ကိးနၣ်ရံၣ် တၢ်ဆၢကတီၢ်",
    desc_es: "Horarios regulares, días especiales y períodos",
    desc_en: "Regular schedule, late start and periods",
    desc_kar: "တၢ်မၤလိဆၢကတီၢ် ဒီးနၣ်ရံၣ်",
    path: "/horario-campanas",
    icon: "Clock",
    icon_color: "text-primary bg-primary/10",
    display_order: 40,
    is_visible: true,
    school_id: "lincoln",
    admin_route: "/admin/recursos",
  },
  {
    id: "res_volunteers",
    section: "resources_dropdown",
    label_es: "Voluntariado y Silver Cord",
    label_en: "Volunteering & Silver Cord",
    label_kar: "တၢ်မၤစၢၤလၢသး ဒီး Silver Cord",
    desc_es: "Horas de servicio comunitario y oportunidades",
    desc_en: "Community service hours and opportunities",
    desc_kar: "တၢ်မၤစၢၤပှၤဂၤ အတၢ်ဆၢကတီၢ်",
    path: "/voluntarios",
    icon: "HeartHandshake",
    icon_color: "text-rose-600 bg-rose-500/10",
    display_order: 50,
    is_visible: true,
    admin_route: "/admin/recursos",
  },
  {
    id: "res_bfl",
    section: "resources_dropdown",
    label_es: "Estado BFL (Enlaces Familiares)",
    label_en: "BFL Liaison Status",
    label_kar: "BFL ဟံၣ်ဖိဃီဖိ တၢ်ဆဲးကျိး",
    desc_es: "Disponibilidad de enlaces bilingües y contacto directo",
    desc_en: "Bilingual liaison availability and direct contact",
    desc_kar: "တၢ်ကတိၤကျိာ်ခံဘိ ပှၤမၤစၢၤအတၢ်အိၣ်သး",
    path: "/bfl-status",
    icon: "Activity",
    icon_color: "text-blue-600 bg-blue-500/10",
    display_order: 60,
    is_visible: true,
    admin_route: "/admin/contactos",
  },
  {
    id: "res_jobs",
    section: "resources_dropdown",
    label_es: "Bolsa de Empleo y Oportunidades",
    label_en: "Job Board & Opportunities",
    label_kar: "တၢ်မၤအတၢ်ခွဲးတၢ်ယာ်တဖၣ်",
    desc_es: "Vacantes en DMPS y empleos para familias",
    desc_en: "DMPS openings and family career opportunities",
    desc_kar: "DMPS တၢ်မၤတဖၣ် လၢဟံၣ်ဖိဃီဖိအဂီၢ်",
    path: "/empleos",
    icon: "Briefcase",
    icon_color: "text-primary bg-primary/10",
    display_order: 70,
    is_visible: true,
    admin_route: "/admin/recursos",
  },
  {
    id: "res_faq",
    section: "resources_dropdown",
    label_es: "Preguntas Frecuentes",
    label_en: "Frequently Asked Questions",
    label_kar: "တၢ်သံကွၢ်တဖၣ်လၢ ညီနုၢ်သံကွၢ်ဝဲ",
    desc_es: "Respuestas claras a dudas frecuentes de familias",
    desc_en: "Quick answers to common parent questions",
    desc_kar: "တၢ်စံးဆၢတဖၣ်လၢ ဟံၣ်ဖိဃီဖိတၢ်သံကွၢ်အဂီၢ်",
    path: "/faq",
    icon: "HelpCircle",
    icon_color: "text-primary bg-primary/10",
    display_order: 80,
    is_visible: true,
    admin_route: "/admin/articulos",
  },
  {
    id: "res_tutorial",
    section: "resources_dropdown",
    label_es: "Guía Interactiva de Inicio",
    label_en: "Interactive App Tutorial",
    label_kar: "တၢ်သိၣ်လိတၢ်သူ App အဂ့ၢ်",
    desc_es: "Recorrido guiado por las funciones del portal",
    desc_en: "Guided walk-through of portal features",
    desc_kar: "တၢ်ဒုးနဲၣ်တၢ်သူ App အကျဲ",
    path: "#tutorial",
    icon: "Compass",
    icon_color: "text-primary bg-primary/10",
    display_order: 90,
    is_visible: true,
    admin_route: "/admin",
  },

  // --- Pie de Página (Footer Links) ---
  {
    id: "footer_home",
    section: "footer_links",
    label_es: "Inicio",
    label_en: "Home",
    label_kar: "ဟံၣ်",
    path: "/",
    icon: "Home",
    display_order: 10,
    is_visible: true,
    admin_route: "/admin",
  },
  {
    id: "footer_articles",
    section: "footer_links",
    label_es: "Artículos y Temas",
    label_en: "Articles & Topics",
    label_kar: "လံာ်တၢ်ကွဲး ဒီးတၢ်ဂ့ၢ်တဖၣ်",
    path: "/topics",
    icon: "BookOpen",
    display_order: 20,
    is_visible: true,
    admin_route: "/admin/articulos",
  },
  {
    id: "footer_calendar",
    section: "footer_links",
    label_es: "Calendario Escolar",
    label_en: "School Calendar",
    label_kar: "မုၢ်နံၤမုၢ်သီလံာ်",
    path: "/calendario",
    icon: "CalendarDays",
    display_order: 30,
    is_visible: true,
    admin_route: "/admin/calendario",
  },
  {
    id: "footer_programs",
    section: "footer_links",
    label_es: "Programas",
    label_en: "Programs",
    label_kar: "တၢ်ရဲၣ်တၢ်ကျဲၤတဖၣ်",
    path: "/programas",
    icon: "GraduationCap",
    display_order: 40,
    is_visible: true,
    admin_route: "/admin/programas",
  },
  {
    id: "footer_sports",
    section: "footer_links",
    label_es: "Deportes y Actividades",
    label_en: "Sports & Activities",
    label_kar: "တၢ်လုၢ်တၢ်စှီၤတဖၣ်",
    path: "/deportes-actividades",
    icon: "Trophy",
    display_order: 50,
    is_visible: true,
    admin_route: "/admin/actividades",
  },
  {
    id: "footer_apps",
    section: "footer_links",
    label_es: "Aplicaciones Escolares",
    label_en: "School Apps",
    label_kar: "ကၠိ App တဖၣ်",
    path: "/apps",
    icon: "Smartphone",
    display_order: 60,
    is_visible: true,
    admin_route: "/admin/recursos",
  },
  {
    id: "footer_bell",
    section: "footer_links",
    label_es: "Horario de Campanas",
    label_en: "Bell Schedule",
    label_kar: "တၢ်ကိးနၣ်ရံၣ် တၢ်ဆၢကတီၢ်",
    path: "/horario-campanas",
    icon: "Clock",
    display_order: 70,
    is_visible: true,
    school_id: "lincoln",
    admin_route: "/admin/recursos",
  },
  {
    id: "footer_dart",
    section: "footer_links",
    label_es: "Transporte DART",
    label_en: "DART Transit",
    label_kar: "DART လ့ၣ်ကရီၤတၢ်ကျဲ",
    path: "/transporte/dart",
    icon: "Bus",
    display_order: 80,
    is_visible: true,
    admin_route: "/admin/dart/configuracion",
  },
  {
    id: "footer_announcements",
    section: "footer_links",
    label_es: "Avisos Oficiales",
    label_en: "Official Announcements",
    label_kar: "ပဒိၣ်တၢ်ဟ့ၣ်သ့ၣ်ညါ",
    path: "/announcements",
    icon: "Megaphone",
    display_order: 90,
    is_visible: true,
    admin_route: "/admin/anuncios",
  },
  {
    id: "footer_faq",
    section: "footer_links",
    label_es: "Preguntas Frecuentes",
    label_en: "FAQ",
    label_kar: "တၢ်သံကွၢ်တဖၣ်",
    path: "/faq",
    icon: "HelpCircle",
    display_order: 100,
    is_visible: true,
    admin_route: "/admin/articulos",
  },
  {
    id: "footer_volunteers",
    section: "footer_links",
    label_es: "Voluntariado",
    label_en: "Volunteering",
    label_kar: "တၢ်မၤစၢၤလၢသး",
    path: "/voluntarios",
    icon: "HeartHandshake",
    display_order: 110,
    is_visible: true,
    admin_route: "/admin/recursos",
  },
  {
    id: "footer_bfl",
    section: "footer_links",
    label_es: "Estado BFL",
    label_en: "BFL Liaison Status",
    label_kar: "BFL တၢ်အိၣ်သး",
    path: "/bfl-status",
    icon: "Activity",
    display_order: 120,
    is_visible: true,
    admin_route: "/admin/contactos",
  },
  {
    id: "footer_contact",
    section: "footer_links",
    label_es: "Directorio y Contacto",
    label_en: "Directory & Contact",
    label_kar: "တၢ်ဆဲးကျိး",
    path: "/contact",
    icon: "Phone",
    display_order: 130,
    is_visible: true,
    admin_route: "/admin/contactos",
  },
  {
    id: "footer_tutorial",
    section: "footer_links",
    label_es: "Guía de Inicio (Tutorial)",
    label_en: "App Guide (Tutorial)",
    label_kar: "တၢ်သိၣ်လိ App",
    path: "#tutorial",
    icon: "Compass",
    display_order: 140,
    is_visible: true,
    admin_route: "/admin",
  },
  {
    id: "footer_accessibility",
    section: "footer_links",
    label_es: "Accesibilidad",
    label_en: "Accessibility",
    label_kar: "တၢ်သူလၢပှၤကိးဂၤဒဲးအဂီၢ်",
    path: "/accessibility",
    icon: "ShieldCheck",
    display_order: 150,
    is_visible: true,
    admin_route: "/admin/apariencia",
  },
  {
    id: "footer_staff",
    section: "footer_links",
    label_es: "Acceso del Personal",
    label_en: "Staff Portal",
    label_kar: "ပှၤမၤတၢ်ဖိ အတၢ်နုာ်လီၤ",
    path: "/admin/login",
    icon: "Users",
    display_order: 160,
    is_visible: true,
    admin_route: "/admin/login",
  },
];

export const NAVIGATION_CACHE_KEY = "public_navigation_menu";

/**
 * Merges cached or stored menu items with standard defaults so any new item or field
 * is consistently present without losing user edits.
 */
export function mergeWithDefaults(
  savedRows: PublicMenuItem[] | null | undefined,
): PublicMenuItem[] {
  if (!savedRows || !Array.isArray(savedRows) || savedRows.length === 0) {
    return [...DEFAULT_PUBLIC_MENU_ITEMS];
  }

  const map = new Map<string, PublicMenuItem>();

  // First, insert defaults
  for (const def of DEFAULT_PUBLIC_MENU_ITEMS) {
    map.set(def.id, { ...def });
  }

  // Then override with saved modifications or custom added items
  for (const row of savedRows) {
    if (!row || !row.id) continue;
    const existing = map.get(row.id);
    if (existing) {
      map.set(row.id, {
        ...existing,
        ...row,
        // Ensure booleans and required strings are properly preserved
        is_visible: row.is_visible !== undefined ? Boolean(row.is_visible) : existing.is_visible,
        display_order:
          typeof row.display_order === "number" ? row.display_order : existing.display_order,
      });
    } else {
      map.set(row.id, row);
    }
  }

  return Array.from(map.values()).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

/**
 * Reads the public menu items from local cache or defaults.
 */
export function getCachedPublicMenuItems(): PublicMenuItem[] {
  const cached = readCache<PublicMenuItem>(NAVIGATION_CACHE_KEY);
  return mergeWithDefaults(cached);
}

/**
 * Fetches public menu items, falling back to cache and defaults.
 */
export async function fetchPublicMenuItems(schoolId?: string): Promise<PublicMenuItem[]> {
  try {
    // Attempt reading from custom database storage or site_settings
    const { data, error } = await (supabase as any)
      .from("site_settings")
      .select("navigation_menu")
      .single();

    if (!error && data?.navigation_menu && Array.isArray(data.navigation_menu)) {
      const merged = mergeWithDefaults(data.navigation_menu as PublicMenuItem[]);
      writeCache(NAVIGATION_CACHE_KEY, merged);
      return filterBySchool(merged, schoolId);
    }
  } catch {
    // silent catch, fall back to cached rows
  }

  const cached = getCachedPublicMenuItems();
  return filterBySchool(cached, schoolId);
}

/**
 * Saves a single menu item and updates both cache and persistent store.
 */
export async function savePublicMenuItem(item: PublicMenuItem): Promise<PublicMenuItem[]> {
  const all = getCachedPublicMenuItems();
  const index = all.findIndex((i) => i.id === item.id);
  const updatedItem: PublicMenuItem = {
    ...item,
    updated_at: new Date().toISOString(),
  };

  let updatedList: PublicMenuItem[];
  if (index >= 0) {
    updatedList = [...all];
    updatedList[index] = updatedItem;
  } else {
    updatedList = [...all, updatedItem];
  }

  return saveAllPublicMenuItems(updatedList);
}

/**
 * Saves all menu items, writing directly to cache and remote settings.
 */
export async function saveAllPublicMenuItems(items: PublicMenuItem[]): Promise<PublicMenuItem[]> {
  const sorted = [...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  // 1. Write to local storage immediately
  writeCache(NAVIGATION_CACHE_KEY, sorted);

  // 2. Also dispatch real-time content notification so all open tabs update instantly
  notifyContentUpdated(NAVIGATION_CACHE_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dmps_navigation_updated", { detail: { items: sorted } }));
  }

  // 3. Attempt persisting to supabase site_settings if available
  try {
    await (supabase as any)
      .from("site_settings")
      .upsert({ id: "main", navigation_menu: sorted, updated_at: new Date().toISOString() });
  } catch {
    // ignore
  }

  return sorted;
}

/**
 * Restores menu items to the official default system list.
 */
export async function resetPublicMenuItemsToDefault(): Promise<PublicMenuItem[]> {
  return saveAllPublicMenuItems([...DEFAULT_PUBLIC_MENU_ITEMS]);
}

/**
 * Localizes a menu item for the current language.
 */
export function localizedMenuItem(
  item: PublicMenuItem,
  lang: LanguageCode,
): { label: string; desc?: string } {
  let label = item.label_es || "";
  let desc = item.desc_es;

  if (lang === "en") {
    label = item.label_en || item.label_es || "";
    desc = item.desc_en || item.desc_es;
  } else if (lang === "kar") {
    label = item.label_kar || item.label_es || item.label_en || "";
    desc = item.desc_kar || item.desc_es || item.desc_en;
  }

  return {
    label: label.trim() || item.label_es || "Enlace",
    desc: desc?.trim(),
  };
}
