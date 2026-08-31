import { supabase } from "@/integrations/supabase/client";

export type PopupAnnouncement = {
  enabled: boolean;
  title: string;
  message: string;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  background_color: string;
  text_color: string;
  accent_color: string;
  updated_at: string;
};

export const DEFAULT_POPUP: PopupAnnouncement = {
  enabled: false,
  title: "",
  message: "",
  image_url: null,
  link_url: null,
  link_label: null,
  background_color: "#ffffff",
  text_color: "#111827",
  accent_color: "#1d4ed8",
  updated_at: new Date(0).toISOString(),
};

export const POPUP_SETTINGS_KEY = "popup_announcement";

export async function fetchPopupAnnouncement(): Promise<PopupAnnouncement> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", POPUP_SETTINGS_KEY)
      .maybeSingle();
    if (error || !data?.value) return DEFAULT_POPUP;
    return { ...DEFAULT_POPUP, ...(data.value as Partial<PopupAnnouncement>) };
  } catch {
    return DEFAULT_POPUP;
  }
}

export async function savePopupAnnouncement(value: PopupAnnouncement) {
  const payload = { ...value, updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { key: POPUP_SETTINGS_KEY, value: payload, updated_at: payload.updated_at },
      { onConflict: "key" },
    );
  if (error) throw error;
  return payload;
}
