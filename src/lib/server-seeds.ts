import { SEED_CATEGORIES, SEED_ARTICLES } from "./school-content-data";
import { INITIAL_LINCOLN_RESOURCES } from "./resources";
import { SEED_CONTACTS } from "./directory";

export function getInitialDatabase(): Record<string, unknown[]> {
  const category_translations = SEED_CATEGORIES.flatMap((c) =>
    (c.category_translations || []).map((t) => ({
      id: `tr_${c.id}_${t.language_code}`,
      category_id: c.id,
      language_code: t.language_code,
      name: t.name,
      description: t.description || null,
      updated_at: new Date().toISOString(),
    })),
  );

  const categories = SEED_CATEGORIES.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description || null,
    icon: c.icon || "BookOpen",
    display_order: c.display_order ?? 0,
    is_featured: c.is_featured ?? false,
    is_visible: c.is_visible ?? true,
    school_id: c.school_id || "lincoln",
    card_banner_url: c.card_banner_url || null,
    card_bg: c.card_bg || null,
    updated_at: new Date().toISOString(),
  }));

  const article_translations = SEED_ARTICLES.flatMap((a) =>
    (a.article_translations || []).map((t) => ({
      id: `tr_${a.id}_${t.language_code}`,
      article_id: a.id,
      language_code: t.language_code,
      title: t.title,
      summary: t.summary || null,
      content_blocks: t.content_blocks || [],
      updated_at: new Date().toISOString(),
    })),
  );

  const articles = SEED_ARTICLES.map((a) => {
    const trs = a.article_translations;
    const esTr = trs?.find((t) => t.language_code === "es") || trs?.[0];
    return {
      id: a.id,
      slug: a.slug,
      status: a.status || "published",
      category_id: a.category_id || null,
      school_id: a.school_id || "lincoln",
      is_featured: a.is_featured ?? false,
      published_at: a.published_at || new Date().toISOString(),
      updated_at: a.updated_at || new Date().toISOString(),
      featured_image_url: a.featured_image_url || null,
      card_banner_url: a.card_banner_url || null,
      card_bg: a.card_bg || null,
      title: esTr?.title || a.slug,
      summary: esTr?.summary || null,
    };
  });

  const schools = [
    {
      id: "lincoln",
      slug: "lincoln-high-school",
      name: "Abraham Lincoln High School",
      level: "high",
      address: "2600 SW 9th St",
      city: "Des Moines",
      state: "IA",
      postal_code: "50315",
      phone: "(515) 242-7500",
      website_url: "https://lincoln.dmschools.org/",
      hours: "8:10 AM - 3:15 PM",
      description: "Escuela secundaria comunitaria enfocada en excelencia académica y artes.",
      is_visible: true,
      image_url: null,
      updated_at: new Date().toISOString(),
    },
    {
      id: "east",
      slug: "east-high-school",
      name: "East High School",
      level: "high",
      address: "815 E 13th St",
      city: "Des Moines",
      state: "IA",
      postal_code: "50316",
      phone: "(515) 242-7788",
      website_url: "https://east.dmschools.org/",
      hours: "8:10 AM - 3:15 PM",
      description:
        "Hogar de los Scarlets, con una rica tradición comunitaria y programas avanzados.",
      is_visible: true,
      image_url: null,
      updated_at: new Date().toISOString(),
    },
  ];

  const school_translations = [
    {
      id: "tr_school_lincoln_es",
      school_id: "lincoln",
      language_code: "es",
      name: "Abraham Lincoln High School",
      description: "Escuela secundaria comunitaria de Des Moines con programas integrales.",
    },
    {
      id: "tr_school_lincoln_en",
      school_id: "lincoln",
      language_code: "en",
      name: "Abraham Lincoln High School",
      description: "Comprehensive public high school serving the south side of Des Moines.",
    },
    {
      id: "tr_school_east_es",
      school_id: "east",
      language_code: "es",
      name: "East High School",
      description: "Escuela secundaria histórica de Des Moines con sólidas tradiciones académicas.",
    },
    {
      id: "tr_school_east_en",
      school_id: "east",
      language_code: "en",
      name: "East High School",
      description:
        "Historic high school in Des Moines with proud academic and athletic traditions.",
    },
  ];

  const appearance_settings = [
    {
      id: "default",
      logo_url: null,
      logo_light_url: null,
      logo_dark_url: null,
      favicon_url: null,
      logo_height: 64,
      logo_alt: "DMPS Connect — Des Moines Public Schools",
      show_wordmark: true,
      updated_at: new Date().toISOString(),
    },
  ];

  const site_settings = [
    {
      id: "default",
      site_name: "DMPS Family Info",
      district_name: "Des Moines Public Schools",
      updated_at: new Date().toISOString(),
    },
  ];

  const social_media_channels = [
    {
      id: "channel_instagram",
      platform: "instagram",
      name: "Instagram",
      handle: "@dmpschools",
      url: "https://www.instagram.com/dmpschools/",
      is_active: true,
      brand_color: "#E4405F",
      display_order: 1,
      updated_at: new Date().toISOString(),
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
      updated_at: new Date().toISOString(),
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
      updated_at: new Date().toISOString(),
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
      updated_at: new Date().toISOString(),
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
      updated_at: new Date().toISOString(),
    },
  ];

  const social_media_posts = [
    {
      id: "post_yt_1",
      platform: "youtube",
      title: "Bienvenida oficial para familias y estudiantes — Des Moines Public Schools",
      description:
        "Conoce los recursos, horarios, transporte y programas académicos disponibles para todas las familias en este año escolar en Des Moines Public Schools.",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      embed_url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      media_type: "video",
      author_name: "DMPS TV Oficial",
      author_handle: "@DMPS_TV",
      school_id: "all",
      is_pinned: true,
      is_visible: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "post_ig_1",
      platform: "instagram",
      title: "¡Orgullo escolar y actividades en Lincoln High School!",
      description:
        "Nuestros estudiantes de Lincoln High participando en actividades extracurriculares y deportes. ¡Vamos Railsplitters! 🦁💙",
      url: "https://www.instagram.com/dmpschools/",
      embed_url: "",
      media_type: "post",
      author_name: "Lincoln High DMPS",
      author_handle: "@lincolnhigh_dmps",
      thumbnail_url: "/public/images/dmps-info-social.png",
      school_id: "lincoln",
      is_pinned: true,
      is_visible: true,
      likes_count: 245,
      comments_count: 18,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "post_tt_1",
      platform: "tiktok",
      title: "Un día en la vida en East High School 🌹",
      description:
        "Un recorrido rápido por las instalaciones, eventos y clubes estudiantiles de Des Moines East High School.",
      url: "https://www.tiktok.com/@dmpschools",
      embed_url: "",
      media_type: "video",
      author_name: "DMPS Oficial",
      author_handle: "@dmpschools",
      thumbnail_url: "/public/images/dmps-info-social.png",
      school_id: "east",
      is_pinned: false,
      is_visible: true,
      likes_count: 1420,
      comments_count: 53,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return {
    categories,
    category_translations,
    articles,
    article_translations,
    schools,
    school_translations,
    resources: INITIAL_LINCOLN_RESOURCES,
    contacts: SEED_CONTACTS,
    appearance_settings,
    site_settings,
    social_media_channels,
    social_media_posts,
    announcements: [],
    announcement_translations: [],
    events: [],
    event_translations: [],
    activities: [],
    activity_translations: [],
    programs: [],
    program_translations: [],
    faqs: [],
    faq_translations: [],
    user_roles: [
      {
        id: "role_default_admin",
        user_id: "default_staff",
        role: "super_admin",
        school_id: "all",
        created_at: new Date().toISOString(),
      },
    ],
  };
}
