import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type SchoolId = "lincoln" | "east";
export type SchoolScope = "lincoln" | "east" | "all";

export interface School {
  id: SchoolId;
  slug: string;
  name: string;
  shortName: string;
  motto: string;
  mascot: string;
  colors: {
    primary: string;
    badgeBg: string;
    border: string;
    accent: string;
    gradient: string;
  };
  address: string;
  cityStateZip: string;
  phone: string;
  bflPhone: string;
  bflEmail: string;
  bflName: string;
  principal: string;
  grades: string;
  officialUrl: string;
  boundUrl: string;
  boundCode: string;
  description_es: string;
  description_en: string;
  silverCordName: string;
  closetName: string;
}

export const LINCOLN_SCHOOL: School = {
  id: "lincoln",
  slug: "lincoln-high-school",
  name: "Abraham Lincoln High School",
  shortName: "Lincoln High",
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
  officialUrl: "https://lincoln.dmschools.org/",
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
  shortName: "East High",
  motto: "Home of the Scarlets",
  mascot: "Scarlets",
  colors: {
    primary: "#9f1239",
    badgeBg:
      "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800",
    border: "border-rose-500",
    accent: "bg-rose-600 text-white hover:bg-rose-700",
    gradient: "from-rose-950 via-rose-900 to-slate-900",
  },
  address: "815 E 13th St",
  cityStateZip: "Des Moines, IA 50316",
  phone: "(515) 242-7788",
  bflPhone: "515-380-1830 / 515-490-7113",
  bflEmail: "rosario.jimenez@dmpschools.org",
  bflName: "Rosario Jiménez & Francisco Hernández (East High)",
  principal: "Leslie Morris",
  grades: "9º - 12º Grado",
  officialUrl: "https://east.dmschools.org/",
  boundUrl: "https://www.gobound.com/ia/schools/dmeast",
  boundCode: "dmeast",
  description_es:
    "Sirviendo al este de Des Moines con rigurosidad académica, carreras técnicas CTE, atletismo de los Scarlets y la red BFL.",
  description_en:
    "Serving East Des Moines with academic rigor, CTE technical pathways, Scarlets athletics, and BFL community networks.",
  silverCordName: "Silver Cord — Voluntariado East High",
  closetName: "Scarlets Closet",
};

export const ALL_SCHOOLS: School[] = [LINCOLN_SCHOOL, EAST_SCHOOL];

export function getSchoolById(id: SchoolId | string | null | undefined): School {
  if (id === "east") return EAST_SCHOOL;
  return LINCOLN_SCHOOL;
}

const STORAGE_KEY = "dmps_selected_school";
const ADMIN_STORAGE_KEY = "dmps_admin_school_filter";

interface SchoolContextType {
  selectedSchoolId: SchoolId;
  selectedSchool: School;
  isSchoolSelected: boolean;
  isModalOpen: boolean;
  setSelectedSchool: (id: SchoolId) => void;
  openSchoolModal: () => void;
  closeSchoolModal: () => void;
  adminSchoolFilter: SchoolScope;
  setAdminSchoolFilter: (scope: SchoolScope) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [selectedSchoolId, setSelectedSchoolIdState] = useState<SchoolId>("lincoln");
  const [isSchoolSelected, setIsSchoolSelected] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [adminSchoolFilter, setAdminSchoolFilterState] = useState<SchoolScope>("all");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "lincoln" || stored === "east") {
        setSelectedSchoolIdState(stored as SchoolId);
        setIsSchoolSelected(true);
        setIsModalOpen(false);
      } else {
        // No valid school selected yet
        setIsSchoolSelected(false);
        const onboardingCompleted =
          localStorage.getItem("dmps_info_onboarding_completed") === "true" ||
          localStorage.getItem("dmps_info_onboarding_skipped") === "true";
        // If onboarding is already done, show school selector modal immediately; otherwise wait for welcome
        setIsModalOpen(onboardingCompleted);
      }

      const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (storedAdmin === "lincoln" || storedAdmin === "east" || storedAdmin === "all") {
        setAdminSchoolFilterState(storedAdmin as SchoolScope);
      }
    } catch {
      // ignore
    }
  }, []);

  const setSelectedSchool = (id: SchoolId) => {
    setSelectedSchoolIdState(id);
    setIsSchoolSelected(true);
    setIsModalOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, id);
      window.dispatchEvent(new CustomEvent("dmps_school_changed", { detail: id }));
    } catch {
      // ignore
    }
  };

  const openSchoolModal = () => setIsModalOpen(true);
  const closeSchoolModal = () => {
    if (isSchoolSelected) {
      setIsModalOpen(false);
    }
  };

  const setAdminSchoolFilter = (scope: SchoolScope) => {
    setAdminSchoolFilterState(scope);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, scope);
    } catch {
      // ignore
    }
  };

  const selectedSchool = getSchoolById(selectedSchoolId);

  return (
    <SchoolContext.Provider
      value={{
        selectedSchoolId,
        selectedSchool,
        isSchoolSelected,
        isModalOpen,
        setSelectedSchool,
        openSchoolModal,
        closeSchoolModal,
        adminSchoolFilter,
        setAdminSchoolFilter,
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
 * Items with school === "all" or undefined/null are shown for all schools.
 */
export function isItemForSchool(
  itemSchool: SchoolScope | string | null | undefined,
  currentSchool: SchoolId,
): boolean {
  if (!itemSchool || itemSchool === "all") return true;
  return itemSchool.toLowerCase() === currentSchool.toLowerCase();
}
