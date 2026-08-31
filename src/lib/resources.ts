/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { readCache, writeCache } from "./sync";
import { filterBySchool } from "./school-scope";
import type { LanguageCode } from "./i18n";
import {
  fetchEntityTranslations,
  getLocalizedField,
  type ContentTranslation,
} from "./translations";

export type ResourceType = "link" | "document" | "tool" | "guide" | "contact" | "map";

export interface ResourceRow {
  id: string;
  school_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  resource_type: ResourceType;
  url: string;
  description: string | null;
  icon: string;
  is_visible: boolean;
  display_order: number;
  status: "draft" | "in_review" | "published" | "archived";
  created_at?: string;
  updated_at?: string;
  translations?: ContentTranslation[];
  category?: { id: string; name: string; slug: string } | null;
}

export const RESOURCE_TYPES: { type: ResourceType; label: string; icon: string }[] = [
  { type: "tool", label: "Herramienta interactiva", icon: "Wrench" },
  { type: "guide", label: "Guía paso a paso", icon: "BookOpen" },
  { type: "document", label: "Documento oficial / PDF", icon: "FileText" },
  { type: "link", label: "Portal o enlace externo", icon: "ExternalLink" },
  { type: "map", label: "Mapa o rutas", icon: "MapPin" },
  { type: "contact", label: "Canal de contacto directo", icon: "Phone" },
];

export const INITIAL_LINCOLN_RESOURCES: ResourceRow[] = [
  {
    id: "res_infinite_campus",
    school_id: "lincoln",
    category_id: null,
    title: "Portal de Familias Infinite Campus",
    slug: "infinite-campus-portal",
    resource_type: "tool",
    url: "https://desmoinesia.infinitecampus.org/campus/portal/desmoines.jsp",
    description:
      "Consulta calificaciones, asistencia, horarios y boletas de calificaciones en tiempo real.",
    icon: "GraduationCap",
    is_visible: true,
    display_order: 1,
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "res_dart_lincoln",
    school_id: "lincoln",
    category_id: null,
    title: "Rutas de Autobús DART hacia Lincoln High School",
    slug: "rutas-dart-lincoln",
    resource_type: "map",
    url: "/transporte/dart",
    description:
      "Horarios, mapas interactivos y transbordos gratuitos para estudiantes con credencial escolar.",
    icon: "Bus",
    is_visible: true,
    display_order: 2,
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "res_silver_cord_lincoln",
    school_id: "lincoln",
    category_id: null,
    title: "Registro de Horas de Voluntariado Silver Cord",
    slug: "silver-cord-registro",
    resource_type: "guide",
    url: "https://lincoln.dmschools.org/students/silver-cord/",
    description:
      "Guía y formato para registrar horas de servicio comunitario y obtener el cordón de honor al graduarse.",
    icon: "Award",
    is_visible: true,
    display_order: 3,
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "res_bfl_lincoln_support",
    school_id: "lincoln",
    category_id: null,
    title: "Enlace Bilingüe para Familias (BFL) — Lincoln",
    slug: "enlace-bilingual-bfl-lincoln",
    resource_type: "contact",
    url: "tel:5152427300",
    description:
      "Soporte gratuito en español para trámites de inscripción, conferencias y preguntas generales.",
    icon: "PhoneCall",
    is_visible: true,
    display_order: 4,
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function fetchResources(
  schoolId: string,
  categoryId?: string,
): Promise<ResourceRow[]> {
  try {
    let query = (supabase as any)
      .from("resources")
      .select("*")
      .eq("school_id", schoolId)
      .eq("status", "published")
      .order("display_order", { ascending: true });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      writeCache("resources", data);
      return filterBySchool(data as ResourceRow[], schoolId);
    }
  } catch (err) {
    void err;
  }

  // Cache or Initial fallback
  const cached = readCache<ResourceRow>("resources");
  if (cached && cached.length > 0) {
    let filtered = filterBySchool(cached, schoolId).filter(
      (r) => r.status === "published" || !r.status,
    );
    if (categoryId) {
      filtered = filtered.filter((r) => r.category_id === categoryId);
    }
    return filtered;
  }

  return filterBySchool(INITIAL_LINCOLN_RESOURCES, schoolId);
}

export async function fetchAllAdminResources(schoolId: string): Promise<ResourceRow[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("resources")
      .select("*")
      .eq("school_id", schoolId)
      .order("display_order", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      writeCache("resources", data);
      return data as ResourceRow[];
    }
  } catch (err) {
    void err;
  }

  const cached = readCache<ResourceRow>("resources") ?? [];
  if (cached.length > 0) {
    return filterBySchool(cached, schoolId);
  }
  return INITIAL_LINCOLN_RESOURCES;
}

export function localizedResource(resource: ResourceRow, lang: LanguageCode) {
  const translations = resource.translations;
  const titleLoc = getLocalizedField(translations, "title", lang, resource.title);
  const descLoc = getLocalizedField(translations, "summary", lang, resource.description || "");

  return {
    title: titleLoc.value || resource.title,
    description: descLoc.value || resource.description,
    isFallback: titleLoc.isFallback,
  };
}
