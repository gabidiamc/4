import {
  fetchTableFromStorage,
  readFromUnifiedStorage,
  saveToUnifiedStorage,
  notifySaveSuccess,
} from "./storage-engine";
import { notifyContentUpdated } from "./sync";

export type SocialPlatform =
  "instagram" | "youtube" | "tiktok" | "facebook" | "twitter" | "whatsapp" | "other";

export interface SocialMediaChannel {
  id: string;
  platform: SocialPlatform;
  name: string;
  handle: string;
  url: string;
  is_active: boolean;
  brand_color?: string;
  display_order?: number;
  updated_at?: string;
}

export interface SocialMediaPost {
  id: string;
  platform: SocialPlatform;
  title: string;
  description: string;
  url: string;
  embed_url?: string;
  media_type?: "video" | "post" | "reel" | "shorts" | "image";
  thumbnail_url?: string;
  author_name?: string;
  author_handle?: string;
  school_id?: string;
  is_pinned?: boolean;
  is_visible?: boolean;
  likes_count?: number;
  comments_count?: number;
  published_at?: string;
  updated_at?: string;
}

export const DEFAULT_CHANNELS: SocialMediaChannel[] = [
  {
    id: "channel_instagram",
    platform: "instagram",
    name: "Instagram",
    handle: "@dmpschools",
    url: "https://www.instagram.com/dmpschools/",
    is_active: true,
    brand_color: "#E4405F",
    display_order: 1,
  },
  {
    id: "channel_youtube",
    platform: "youtube",
    name: "YouTube",
    handle: "@DMPS_TV",
    url: "https://www.youtube.com/@DMPS_TV",
    is_active: true,
    brand_color: "#FF0000",
    display_order: 2,
  },
  {
    id: "channel_tiktok",
    platform: "tiktok",
    name: "TikTok",
    handle: "@dmpschools",
    url: "https://www.tiktok.com/@dmpschools",
    is_active: true,
    brand_color: "#000000",
    display_order: 3,
  },
  {
    id: "channel_facebook",
    platform: "facebook",
    name: "Facebook",
    handle: "Des Moines Public Schools",
    url: "https://www.facebook.com/DMPSchools",
    is_active: true,
    brand_color: "#1877F2",
    display_order: 4,
  },
  {
    id: "channel_twitter",
    platform: "twitter",
    name: "X (Twitter)",
    handle: "@DMPSchools",
    url: "https://x.com/dmpschools",
    is_active: true,
    brand_color: "#000000",
    display_order: 5,
  },
];

export function getPlatformBadgeStyle(platform: SocialPlatform): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (platform) {
    case "instagram":
      return {
        bg: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]",
        text: "text-white",
        border: "border-pink-400/30",
        label: "Instagram",
      };
    case "youtube":
      return {
        bg: "bg-[#FF0000]",
        text: "text-white",
        border: "border-red-600/30",
        label: "YouTube",
      };
    case "tiktok":
      return {
        bg: "bg-black",
        text: "text-[#25F4EE]",
        border: "border-pink-500/40",
        label: "TikTok",
      };
    case "facebook":
      return {
        bg: "bg-[#1877F2]",
        text: "text-white",
        border: "border-blue-600/30",
        label: "Facebook",
      };
    case "twitter":
      return {
        bg: "bg-neutral-900",
        text: "text-white",
        border: "border-neutral-700",
        label: "X (Twitter)",
      };
    case "whatsapp":
      return {
        bg: "bg-[#25D366]",
        text: "text-white",
        border: "border-green-600/30",
        label: "WhatsApp",
      };
    default:
      return {
        bg: "bg-primary",
        text: "text-primary-foreground",
        border: "border-primary/20",
        label: "Red Social",
      };
  }
}

/**
 * Parses YouTube video IDs from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Returns a standardized embed URL for media embedding.
 */
export function buildEmbedUrl(platform: SocialPlatform, rawUrl: string): string | null {
  if (!rawUrl) return null;

  if (platform === "youtube") {
    const ytId = extractYouTubeId(rawUrl);
    if (ytId) {
      return `https://www.youtube-nocookie.com/embed/${ytId}?rel=0`;
    }
  }

  if (platform === "instagram") {
    const clean = rawUrl.split("?")[0].replace(/\/$/, "");
    if (clean.includes("/p/") || clean.includes("/reel/")) {
      return `${clean}/embed/`;
    }
  }

  return rawUrl;
}

/**
 * Fetches all configured social media channels.
 * Prioritizes Unified Storage and falls back to server storage.
 */
export async function fetchSocialMediaChannels(): Promise<SocialMediaChannel[]> {
  const cached = readFromUnifiedStorage<SocialMediaChannel>("social_media_channels");
  if (cached && cached.length > 0) {
    return [...cached].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  const fetched = await fetchTableFromStorage<SocialMediaChannel>("social_media_channels");
  if (fetched && fetched.length > 0) {
    return [...fetched].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  return DEFAULT_CHANNELS;
}

/**
 * Fetches all published social media posts, filtered optionally by school.
 */
export async function fetchSocialMediaPosts(schoolId?: string): Promise<SocialMediaPost[]> {
  let list = readFromUnifiedStorage<SocialMediaPost>("social_media_posts");
  if (!list || list.length === 0) {
    list = await fetchTableFromStorage<SocialMediaPost>("social_media_posts");
  }

  const posts = list ?? [];
  return posts
    .filter((p) => p.is_visible !== false)
    .filter((p) => {
      if (!schoolId || schoolId === "all") return true;
      return !p.school_id || p.school_id === "all" || p.school_id === schoolId;
    })
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      const tA = new Date(a.published_at || a.updated_at || 0).getTime();
      const tB = new Date(b.published_at || b.updated_at || 0).getTime();
      return tB - tA;
    });
}

/**
 * Saves social media channels permanently across all layers.
 */
export async function saveSocialMediaChannels(channels: SocialMediaChannel[]): Promise<boolean> {
  const ok = await saveToUnifiedStorage("social_media_channels", channels);
  notifyContentUpdated("social_media_channels");
  notifySaveSuccess("✓ Redes sociales guardadas y activadas permanentemente.");
  return ok;
}

/**
 * Upserts a social media post permanently.
 */
export async function saveSocialMediaPost(
  post: Partial<SocialMediaPost>,
): Promise<SocialMediaPost> {
  const current = readFromUnifiedStorage<SocialMediaPost>("social_media_posts") ?? [];
  const id = post.id || `post_${post.platform || "social"}_${Date.now()}`;
  const now = new Date().toISOString();

  const embed_url =
    post.embed_url || (post.url ? buildEmbedUrl(post.platform || "other", post.url) || "" : "");

  const fullPost: SocialMediaPost = {
    id,
    platform: post.platform || "instagram",
    title: post.title || "",
    description: post.description || "",
    url: post.url || "",
    embed_url,
    media_type: post.media_type || "post",
    thumbnail_url: post.thumbnail_url || "",
    author_name: post.author_name || "Des Moines Public Schools",
    author_handle: post.author_handle || "@dmpschools",
    school_id: post.school_id || "all",
    is_pinned: post.is_pinned ?? false,
    is_visible: post.is_visible ?? true,
    likes_count: post.likes_count ?? 0,
    comments_count: post.comments_count ?? 0,
    published_at: post.published_at || now,
    updated_at: now,
  };

  const idx = current.findIndex((p) => String(p.id) === String(id));
  let updated: SocialMediaPost[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = { ...updated[idx], ...fullPost };
  } else {
    updated = [fullPost, ...current];
  }

  await saveToUnifiedStorage("social_media_posts", updated);
  notifyContentUpdated("social_media_posts");
  notifySaveSuccess("✓ Publicación guardada y confirmada sin ningún problema.");
  return fullPost;
}

/**
 * Deletes a social media post.
 */
export async function deleteSocialMediaPost(id: string): Promise<boolean> {
  const current = readFromUnifiedStorage<SocialMediaPost>("social_media_posts") ?? [];
  const filtered = current.filter((p) => String(p.id) !== String(id));
  const ok = await saveToUnifiedStorage("social_media_posts", filtered);
  notifyContentUpdated("social_media_posts");
  notifySaveSuccess("✓ Publicación eliminada permanentemente.");
  return ok;
}
