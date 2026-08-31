import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit, upsertRow } from "./admin";

export type ExternalServiceId = "voluntarios" | "bfl-status";

export type ExternalServiceConfig = {
  id: ExternalServiceId;
  nameKey: string;
  nameFallback: string;
  descKey: string;
  descFallback: string;
  buttonKey: string;
  buttonFallback: string;
  url: string;
  defaultUrl: string;
  settingField: "volunteer_portal_url" | "bfl_status_url";
  badgeText: string;
  features: string[];
};

export const DEFAULT_SERVICE_URLS: Record<ExternalServiceId, string> = {
  voluntarios: "https://hub.familiasdmps.app",
  "bfl-status": "https://status.familiasdmps.app/",
};

const STORAGE_KEY = "dmps_external_services_config";
const EVENT_NAME = "dmps_external_services_updated";

export const EXTERNAL_SERVICES: Record<ExternalServiceId, Omit<ExternalServiceConfig, "url">> = {
  voluntarios: {
    id: "voluntarios",
    nameKey: "services.voluntarios.title",
    nameFallback: "Voluntarios",
    descKey: "services.voluntarios.desc",
    descFallback:
      "Encuentra oportunidades de voluntariado, consulta tus solicitudes, registra tus horas y revisa tu perfil.",
    buttonKey: "services.voluntarios.button",
    buttonFallback: "Abrir Portal de Voluntarios",
    defaultUrl: DEFAULT_SERVICE_URLS["voluntarios"],
    settingField: "volunteer_portal_url",
    badgeText: "DMPS Hub",
    features: [
      "Oportunidades de voluntariado en escuelas y programas",
      "Consulta y seguimiento de solicitudes",
      "Registro de horas comunitarias",
      "Gestión de perfil y disponibilidad",
    ],
  },
  "bfl-status": {
    id: "bfl-status",
    nameKey: "services.bfl.title",
    nameFallback: "BFL Status",
    descKey: "services.bfl.desc",
    descFallback:
      "Sistema para consultar la disponibilidad del personal, administrar filas, asignar familias y acceder al kiosco durante eventos.",
    buttonKey: "services.bfl.button",
    buttonFallback: "Abrir BFL Status",
    defaultUrl: DEFAULT_SERVICE_URLS["bfl-status"],
    settingField: "bfl_status_url",
    badgeText: "BFL Status",
    features: [
      "Disponibilidad en tiempo real del personal de apoyo bilingüe",
      "Administración y turnos de filas para familias",
      "Asignación directa en eventos y ferias comunitarias",
      "Acceso directo a modo kiosco de atención",
    ],
  },
};

export function getStoredServiceUrls(): Record<ExternalServiceId, string> {
  if (typeof window === "undefined") {
    return { ...DEFAULT_SERVICE_URLS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const volUrl =
        parsed.voluntarios && !parsed.voluntarios.includes("connect.dmschools.org")
          ? parsed.voluntarios
          : DEFAULT_SERVICE_URLS.voluntarios;
      const bflUrl =
        parsed["bfl-status"] && !parsed["bfl-status"].includes("bfl.dmschools.org")
          ? parsed["bfl-status"]
          : DEFAULT_SERVICE_URLS["bfl-status"];

      return {
        voluntarios: volUrl,
        "bfl-status": bflUrl,
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SERVICE_URLS };
}

export function isServiceUrlValid(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "#" || trimmed.toLowerCase() === "disabled") return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function useExternalServices() {
  const [urls, setUrls] = useState<Record<ExternalServiceId, string>>(getStoredServiceUrls);

  const reloadUrls = useCallback(() => {
    setUrls(getStoredServiceUrls());
  }, []);

  useEffect(() => {
    // Initial fetch from supabase site_settings if available
    let mounted = true;
    async function fetchRemote() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "external_services")
          .maybeSingle();

        if (!error && data?.value && mounted) {
          const val = data.value as Record<string, string>;
          const updated = {
            voluntarios:
              val.voluntarios !== undefined ? val.voluntarios : DEFAULT_SERVICE_URLS.voluntarios,
            "bfl-status":
              val["bfl-status"] !== undefined
                ? val["bfl-status"]
                : DEFAULT_SERVICE_URLS["bfl-status"],
          };
          setUrls(updated);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
        }
      } catch {
        // use local cache
      }
    }

    void fetchRemote();

    const handleUpdate = () => reloadUrls();
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [reloadUrls]);

  const updateServiceUrls = async (newUrls: Record<ExternalServiceId, string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUrls));
      window.dispatchEvent(new Event(EVENT_NAME));
      setUrls(newUrls);

      // Persist to supabase site_settings as well
      await upsertRow("site_settings", {
        key: "external_services",
        value: newUrls,
      });

      await logAudit(
        "update",
        "site_settings",
        "external_services",
        "Actualización de enlaces externos a portales (Voluntarios y BFL Status)",
      );
    } catch (err) {
      console.warn("Could not persist to database:", err);
    }
  };

  const getServiceConfig = (id: ExternalServiceId): ExternalServiceConfig => {
    const base = EXTERNAL_SERVICES[id];
    const url = urls[id] ?? base.defaultUrl;
    return {
      ...base,
      url,
    };
  };

  return {
    urls,
    getServiceConfig,
    isAvailable: (id: ExternalServiceId) => isServiceUrlValid(urls[id]),
    updateServiceUrls,
  };
}
