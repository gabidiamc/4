import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { readCache, writeCache } from "./sync";
import { normalizeSchoolId } from "./school-scope";

export type SchoolId = "lincoln" | string;
export type SchoolScope = "lincoln" | string;

export interface School {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  shortName: string;
  district_name: string;
  city: string;
  state: string;
  official_website_url: string;
  officialUrl: string;
  is_active: boolean;
  motto?: string;
  mascot?: string;
  colors?: {
    primary: string;
    badgeBg: string;
    border: string;
    accent: string;
    gradient: string;
  };
  address?: string;
  cityStateZip?: string;
  phone?: string;
  bflPhone?: string;
  bflEmail?: string;
  bflName?: string;
  principal?: string;
  grades?: string;
  boundUrl?: string;
  boundCode?: string;
  description_es?: string;
  description_en?: string;
  silverCordName?: string;
  closetName?: string;
}

export const LINCOLN_SCHOOL: School = {
  id: "lincoln",
  slug: "lincoln-high-school",
  name: "Abraham Lincoln High School",
  short_name: "Lincoln",
  shortName: "Lincoln",
  district_name: "Des Moines Public Schools",
  city: "Des Moines",
  state: "Iowa",
  official_website_url: "https://lincoln.dmschools.org/",
  officialUrl: "https://lincoln.dmschools.org/",
  is_active: true,
  motto: "Home of the Railsplitters",
  mascot: "Railsplitters",
  colors: {
    primary: "#1e3a8a",
    badgeBg:
      "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800",
    border: "border-blue-500",
    accent: "bg-blue-600 text-white hover:bg-blue-700",
    gradient: "from-blue-900 via-indigo-900 to-slate-900",
  },
  address: "2600 SW 9th St",
  cityStateZip: "Des Moines, IA 50315",
  phone: "(515) 242-7500",
  bflPhone: "(515) 242-7300",
  bflEmail: "lincoln.bfl.espanol@dmschools.org",
  bflName: "Enlace BFL Lincoln (Español)",
  principal: "Paul Williamson",
  grades: "9º - 12º Grado",
  boundUrl: "https://www.gobound.com/ia/schools/dmlincoln",
  boundCode: "dmlincoln",
  description_es:
    "Sirviendo al sur de Des Moines con programas académicos de excelencia, cursos AP, deportes universitarios y soporte bilingüe BFL.",
  description_en:
    "Serving South Des Moines with comprehensive academic excellence, AP courses, athletics, and BFL bilingual support.",
  silverCordName: "Silver Cord — Voluntariado Lincoln",
  closetName: "Rails Closet",
};

export const EAST_SCHOOL: School = {
  id: "east",
  slug: "east-high-school",
  name: "Des Moines East High School",
  short_name: "East",
  shortName: "East",
  district_name: "Des Moines Public Schools",
  city: "Des Moines",
  state: "Iowa",
  official_website_url: "https://east.dmschools.org/",
  officialUrl: "https://east.dmschools.org/",
  is_active: true,
  motto: "For the Service of Humanity",
  mascot: "Scarlets",
  colors: {
    primary: "#881337",
    badgeBg:
      "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800",
    border: "border-rose-500",
    accent: "bg-rose-600 text-white hover:bg-rose-700",
    gradient: "from-rose-900 via-red-950 to-slate-900",
  },
  address: "815 E 13th St",
  cityStateZip: "Des Moines, IA 50316",
  phone: "(515) 242-7788",
  bflPhone: "(515) 242-7790",
  bflEmail: "east.bfl@dmschools.org",
  bflName: "Enlace BFL East (Español)",
  principal: "Jill Versteeg",
  grades: "9º - 12º Grado",
  boundUrl: "https://www.gobound.com/ia/schools/dmeast",
  boundCode: "dmeast",
  description_es:
    "Sirviendo al este de Des Moines con excelencia académica, deportes y programas bilingües.",
  description_en:
    "Serving East Des Moines with academic excellence, athletics, and bilingual programs.",
  silverCordName: "Silver Cord — Voluntariado East",
  closetName: "Scarlet Closet",
};

export const ROOSEVELT_SCHOOL: School = {
  id: "roosevelt",
  slug: "roosevelt-high-school",
  name: "Theodore Roosevelt High School",
  short_name: "Roosevelt",
  shortName: "Roosevelt",
  district_name: "Des Moines Public Schools",
  city: "Des Moines",
  state: "Iowa",
  official_website_url: "https://roosevelt.dmschools.org/",
  officialUrl: "https://roosevelt.dmschools.org/",
  is_active: true,
  motto: "Enter to Grow in Wisdom",
  mascot: "Roughriders",
  colors: {
    primary: "#0369a1",
    badgeBg:
      "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/80 dark:text-sky-200 dark:border-sky-800",
    border: "border-sky-500",
    accent: "bg-sky-600 text-white hover:bg-sky-700",
    gradient: "from-sky-900 via-blue-950 to-slate-900",
  },
  address: "4419 Center St",
  cityStateZip: "Des Moines, IA 50312",
  phone: "(515) 242-7272",
  bflPhone: "(515) 242-7275",
  bflEmail: "roosevelt.bfl@dmschools.org",
  bflName: "Enlace BFL Roosevelt",
  principal: "Steven Schappaugh",
  grades: "9º - 12º Grado",
  boundUrl: "https://www.gobound.com/ia/schools/dmroosevelt",
  boundCode: "dmroosevelt",
  description_es:
    "Sirviendo al oeste de Des Moines con riguroso programa AP, artes y comunidad activa.",
  description_en:
    "Serving West Des Moines with rigorous AP coursework, performing arts, and community engagement.",
  silverCordName: "Silver Cord — Voluntariado Roosevelt",
  closetName: "Rider Closet",
};

export const NORTH_SCHOOL: School = {
  id: "north",
  slug: "north-high-school",
  name: "North High School",
  short_name: "North",
  shortName: "North",
  district_name: "Des Moines Public Schools",
  city: "Des Moines",
  state: "Iowa",
  official_website_url: "https://north.dmschools.org/",
  officialUrl: "https://north.dmschools.org/",
  is_active: true,
  motto: "Polar Bear Pride",
  mascot: "Polar Bears",
  colors: {
    primary: "#15803d",
    badgeBg:
      "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800",
    border: "border-emerald-500",
    accent: "bg-emerald-600 text-white hover:bg-emerald-700",
    gradient: "from-emerald-900 via-green-950 to-slate-900",
  },
  address: "501 Holcomb Ave",
  cityStateZip: "Des Moines, IA 50313",
  phone: "(515) 242-7200",
  bflPhone: "(515) 242-7205",
  bflEmail: "north.bfl@dmschools.org",
  bflName: "Enlace BFL North",
  principal: "Benjamin Graeber",
  grades: "9º - 12º Grado",
  boundUrl: "https://www.gobound.com/ia/schools/dmnorth",
  boundCode: "dmnorth",
  description_es:
    "Comunidad diversa en el norte de Des Moines con fuerte apoyo multilingüe y programas técnicos.",
  description_en:
    "Diverse community in North Des Moines with robust multilingual support and career pathways.",
  silverCordName: "Silver Cord — Voluntariado North",
  closetName: "Polar Bear Closet",
};

export const HOOVER_SCHOOL: School = {
  id: "hoover",
  slug: "hoover-high-school",
  name: "Herbert Hoover High School",
  short_name: "Hoover",
  shortName: "Hoover",
  district_name: "Des Moines Public Schools",
  city: "Des Moines",
  state: "Iowa",
  official_website_url: "https://hoover.dmschools.org/",
  officialUrl: "https://hoover.dmschools.org/",
  is_active: true,
  motto: "Home of the Huskies",
  mascot: "Huskies",
  colors: {
    primary: "#b45309",
    badgeBg:
      "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800",
    border: "border-amber-500",
    accent: "bg-amber-600 text-white hover:bg-amber-700",
    gradient: "from-amber-900 via-yellow-950 to-slate-900",
  },
  address: "4800 Aurora Ave",
  cityStateZip: "Des Moines, IA 50310",
  phone: "(515) 242-7300",
  bflPhone: "(515) 242-7305",
  bflEmail: "hoover.bfl@dmschools.org",
  bflName: "Enlace BFL Hoover",
  principal: "Kathryn Panek",
  grades: "9º - 12º Grado",
  boundUrl: "https://www.gobound.com/ia/schools/dmhoover",
  boundCode: "dmhoover",
  description_es:
    "Educación de excelencia con programa de Bachillerato Internacional (IB) y deportes de primer nivel.",
  description_en:
    "Excellence in education featuring International Baccalaureate (IB) programs and varsity athletics.",
  silverCordName: "Silver Cord — Voluntariado Hoover",
  closetName: "Husky Closet",
};

export const CENTRAL_SCHOOL: School = {
  id: "central",
  slug: "central-campus",
  name: "Central Campus & Central Academy",
  short_name: "Central Campus",
  shortName: "Central Campus",
  district_name: "Des Moines Public Schools",
  city: "Des Moines",
  state: "Iowa",
  official_website_url: "https://centralcampus.dmschools.org/",
  officialUrl: "https://centralcampus.dmschools.org/",
  is_active: true,
  motto: "Discover Your Future",
  mascot: "Trailblazers",
  colors: {
    primary: "#4f46e5",
    badgeBg:
      "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-800",
    border: "border-indigo-500",
    accent: "bg-indigo-600 text-white hover:bg-indigo-700",
    gradient: "from-indigo-900 via-violet-950 to-slate-900",
  },
  address: "1800 Grand Ave",
  cityStateZip: "Des Moines, IA 50309",
  phone: "(515) 242-7888",
  bflPhone: "(515) 242-7888",
  bflEmail: "central.bfl@dmschools.org",
  bflName: "Enlace BFL Central",
  principal: "Tascha Brown",
  grades: "9º - 12º Grado (Carreras y Cursos Avanzados)",
  boundUrl: "https://www.gobound.com/ia/schools/dmschools",
  boundCode: "dmcentral",
  description_es:
    "Centro de carreras técnicas avanzadas, ciencias de la salud, aviación, artes culinarias y Central Academy.",
  description_en:
    "Advanced career & technical education center featuring health sciences, aviation, culinary arts, and gifted Academy.",
  silverCordName: "Silver Cord — Voluntariado Central",
  closetName: "Central Closet",
};

export const ALL_DEFINED_SCHOOLS: School[] = [
  LINCOLN_SCHOOL,
  EAST_SCHOOL,
  ROOSEVELT_SCHOOL,
  NORTH_SCHOOL,
  HOOVER_SCHOOL,
  CENTRAL_SCHOOL,
];

export const INITIAL_SCHOOLS: School[] = ALL_DEFINED_SCHOOLS;

export function getSchoolById(id: string | null | undefined, customList?: School[]): School {
  const list = customList && customList.length > 0 ? customList : ALL_DEFINED_SCHOOLS;
  if (!id) return LINCOLN_SCHOOL;
  const canonical = normalizeSchoolId(id);
  if (canonical === "east") return EAST_SCHOOL;
  if (canonical === "roosevelt") return ROOSEVELT_SCHOOL;
  if (canonical === "north") return NORTH_SCHOOL;
  if (canonical === "hoover") return HOOVER_SCHOOL;
  if (canonical === "central") return CENTRAL_SCHOOL;
  if (canonical === "lincoln") return LINCOLN_SCHOOL;

  const cleanId = String(id).toLowerCase().trim();
  const match = list.find(
    (s) =>
      s.id.toLowerCase() === cleanId ||
      s.slug.toLowerCase() === cleanId ||
      cleanId.includes(s.id.toLowerCase()),
  );
  if (match) return match;
  return LINCOLN_SCHOOL;
}

const STORAGE_KEY = "dmps_selected_school";
const STORAGE_KEY_V2 = "dmps_selected_school_v2";
const ADMIN_STORAGE_KEY = "dmps_admin_school_filter";

interface SchoolContextType {
  selectedSchoolId: string;
  selectedSchool: School;
  schools: School[];
  isSchoolSelected: boolean;
  isModalOpen: boolean;
  setSelectedSchool: (id: string) => void;
  openSchoolModal: () => void;
  closeSchoolModal: () => void;
  adminSchoolFilter: string;
  setAdminSchoolFilter: (scope: string) => void;
  reloadSchools: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [schools, setSchools] = useState<School[]>(INITIAL_SCHOOLS);
  const [selectedSchoolId, setSelectedSchoolIdState] = useState<string>("lincoln");
  const [isSchoolSelected, setIsSchoolSelected] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [adminSchoolFilter, setAdminSchoolFilterState] = useState<string>("all");

  const loadSchoolsList = async () => {
    try {
      const cached = readCache<Record<string, unknown>>("schools");
      if (cached && cached.length > 0) {
        const mapped: School[] = cached.map((c) => {
          const rawId = String(c.id || c.slug || "lincoln").toLowerCase();
          const baseMatch =
            INITIAL_SCHOOLS.find((s) => s.id === rawId || rawId.includes(s.id)) || LINCOLN_SCHOOL;
          return {
            ...baseMatch,
            id: String(c.id || baseMatch.id),
            slug: String(c.slug || baseMatch.slug),
            name: String(c.name || baseMatch.name),
            short_name: String(c.short_name || c.shortName || baseMatch.short_name),
            shortName: String(c.short_name || c.shortName || baseMatch.shortName),
            district_name: String(c.district_name || baseMatch.district_name),
            city: String(c.city || baseMatch.city),
            state: String(c.state || baseMatch.state),
            official_website_url: String(
              c.official_website_url || c.website_url || baseMatch.official_website_url,
            ),
            officialUrl: String(c.official_website_url || c.website_url || baseMatch.officialUrl),
            is_active: c.is_active !== false && c.is_visible !== false,
            motto: String(c.motto || baseMatch.motto),
            mascot: String(c.mascot || baseMatch.mascot),
            address: String(c.address || baseMatch.address),
            cityStateZip: String(c.cityStateZip || baseMatch.cityStateZip),
            phone: String(c.phone || baseMatch.phone),
          };
        });
        if (mapped.length > 0) {
          setSchools(mapped);
          return;
        }
      }
    } catch {
      // fallback to initial
    }
    setSchools(INITIAL_SCHOOLS);
  };

  useEffect(() => {
    void loadSchoolsList();

    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY_V2);
      if (stored) {
        const canonical = normalizeSchoolId(stored);
        setSelectedSchoolIdState(canonical);
        setIsSchoolSelected(true);
      } else {
        setSelectedSchoolIdState("lincoln");
        setIsSchoolSelected(true);
      }

      const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (storedAdmin) {
        setAdminSchoolFilterState(storedAdmin);
      } else {
        setAdminSchoolFilterState("all");
      }
    } catch {
      // ignore
    }
  }, []);

  const setSelectedSchool = (id: string) => {
    const canonical = normalizeSchoolId(id);
    setSelectedSchoolIdState(canonical);
    setIsSchoolSelected(true);
    setIsModalOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, canonical);
      localStorage.setItem(STORAGE_KEY_V2, canonical);
      window.dispatchEvent(new CustomEvent("dmps_school_changed", { detail: canonical }));
    } catch {
      // ignore
    }
  };

  const openSchoolModal = () => setIsModalOpen(true);
  const closeSchoolModal = () => {
    setIsModalOpen(false);
  };

  const setAdminSchoolFilter = (scope: string) => {
    setAdminSchoolFilterState(scope);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, scope);
      window.dispatchEvent(new CustomEvent("dmps_admin_school_filter_changed", { detail: scope }));
    } catch {
      // ignore
    }
  };

  const selectedSchool = getSchoolById(selectedSchoolId, schools);

  return (
    <SchoolContext.Provider
      value={{
        selectedSchoolId,
        selectedSchool,
        schools,
        isSchoolSelected,
        isModalOpen,
        setSelectedSchool,
        openSchoolModal,
        closeSchoolModal,
        adminSchoolFilter,
        setAdminSchoolFilter,
        reloadSchools: loadSchoolsList,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error("useSchool must be used within a SchoolProvider");
  }
  return context;
}

/**
 * Helper to check if an item tagged with a school property matches the currently selected school.
 */
export function isItemForSchool(
  itemSchool: string | null | undefined,
  currentSchool: string,
): boolean {
  if (!itemSchool) return true;
  return itemSchool.toLowerCase() === currentSchool.toLowerCase();
}
