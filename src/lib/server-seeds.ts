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
    {
      id: "roosevelt",
      slug: "roosevelt-high-school",
      name: "Theodore Roosevelt High School",
      level: "high",
      address: "4419 Center St",
      city: "Des Moines",
      state: "IA",
      postal_code: "50312",
      phone: "(515) 242-7272",
      website_url: "https://roosevelt.dmschools.org/",
      hours: "8:10 AM - 3:15 PM",
      description: "Escuela secundaria con bachillerato internacional y amplia oferta deportiva.",
      is_visible: true,
      image_url: null,
      updated_at: new Date().toISOString(),
    },
    {
      id: "north",
      slug: "north-high-school",
      name: "North High School",
      level: "high",
      address: "501 Holcomb Ave",
      city: "Des Moines",
      state: "IA",
      postal_code: "50313",
      phone: "(515) 242-7204",
      website_url: "https://north.dmschools.org/",
      hours: "8:10 AM - 3:15 PM",
      description: "Comunidad diversa y dinámica con programas de ciencias y tecnología.",
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
