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

export const ALL_DEFINED_SCHOOLS: School[] = [LINCOLN_SCHOOL, EAST_SCHOOL];

export const INITIAL_SCHOOLS: School[] = ALL_DEFINED_SCHOOLS;

export function getSchoolById(id: string | null | undefined, customList?: School[]): School {
  const list = customList && customList.length > 0 ? customList : ALL_DEFINED_SCHOOLS;
  if (!id) return LINCOLN_SCHOOL;
  const canonical = normalizeSchoolId(id);
  if (canonical === "east") return EAST_SCHOOL;
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
        const mapped: School[] = cached
          .map((c) => {
            const rawId = String(c.id || c.slug || "lincoln").toLowerCase();
            const baseMatch =
              INITIAL_SCHOOLS.find((s) => s.id === rawId || rawId.includes(s.id)) ||
              (rawId.includes("east") ? EAST_SCHOOL : LINCOLN_SCHOOL);
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
          })
          .filter((s) => s.id === "lincoln" || s.id === "east");
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
        setSelectedSchoolIdState(canonical === "east" ? "east" : "lincoln");
        setIsSchoolSelected(true);
      } else {
        setSelectedSchoolIdState("lincoln");
        setIsSchoolSelected(true);
      }

      const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (storedAdmin) {
        setAdminSchoolFilterState(
          storedAdmin === "east" ? "east" : storedAdmin === "lincoln" ? "lincoln" : "all",
        );
      } else {
        setAdminSchoolFilterState("all");
      }
    } catch {
      // ignore
    }
  }, []);

  const setSelectedSchool = (id: string) => {
    const canonical = normalizeSchoolId(id);
    const safeSchool = canonical === "east" ? "east" : "lincoln";
    setSelectedSchoolIdState(safeSchool);
    setIsSchoolSelected(true);
    setIsModalOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, safeSchool);
      localStorage.setItem(STORAGE_KEY_V2, safeSchool);
      window.dispatchEvent(new CustomEvent("dmps_school_changed", { detail: safeSchool }));
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
