import type { CategoryRow, ArticleRow } from "./content";
import type { ResourceRow } from "./resources";

/**
 * 9 Standard Des Moines Public Schools Family Categories
 * populated with verified articles, banners, and multilingual translations.
 */
export const SEED_CATEGORIES: CategoryRow[] = [
  {
    id: "cat_empieza_aqui",
    slug: "empieza-aqui",
    name: "Empieza aquí",
    description: "Guía para familias nuevas, bienvenida y cómo usar este portal escolar.",
    icon: "Sparkles",
    display_order: 1,
    is_featured: true,
    is_visible: true,
    school_id: "lincoln",
    category_translations: [
      {
        language_code: "es",
        name: "Empieza aquí",
        description: "Guía para familias nuevas, bienvenida y cómo usar este portal escolar.",
      },
      {
        language_code: "en",
        name: "Start Here",
        description:
          "Guide for new families, welcome information, and how to use this school portal.",
      },
      {
        language_code: "ksw",
        name: "စးထီၣ်ဖဲအံၤ",
        description:
          "တၢ်နဲၣ်ကျဲလၢ ဟံၣ်ဖိဃီဖိအသီ, တၢ်တူၢ်လိာ်တၢ်ဆိကမိၣ် ဒီးကျဲလၢကသူဝဲ ကၠိတၢ်ပရၢအံၤ.",
      },
    ],
  },
  {
    id: "cat_calendario_horarios",
    slug: "calendario-y-horarios",
    name: "Calendario y horarios",
    description:
      "Fechas clave, inicio y fin de cursos, vacaciones, conferencias y horarios de campanas.",
    icon: "CalendarDays",
    display_order: 2,
    is_featured: true,
    is_visible: true,
    school_id: "lincoln",
    category_translations: [
      {
        language_code: "es",
        name: "Calendario y horarios",
        description:
          "Fechas clave, inicio y fin de cursos, vacaciones, conferencias y horarios de campanas.",
      },
      {
        language_code: "en",
        name: "Calendar & Schedules",
        description: "Key dates, school start/end, breaks, conferences, and bell schedules.",
      },
      {
        language_code: "ksw",
        name: "လါဆၣ်ဒီး တၢ်ဆၢကတီၢ်",
        description:
          "မုၢ်နံၤအရ့ဒိၣ်တဖၣ်, ကၠိစးထီၣ်/ကျၢၢ်တံၢ်, မုၢ်နံၤအိၣ်ဘှံး, မုၢ်နံၤထံၣ်လိာ်မိၢ်ပၢ် ဒီးကၠိခိၣ်နားတၢ်ဆၢကတီၢ်.",
      },
    ],
  },
  {
    id: "cat_registro_infinite_campus",
    slug: "registro-e-infinite-campus",
    name: "Registro e Infinite Campus",
    description:
      "Cómo registrar estudiantes, entrar al portal familiar y revisar calificaciones y asistencia.",
    icon: "Laptop",
    display_order: 3,
    is_featured: true,
    is_visible: true,
    school_id: "lincoln",
    category_translations: [
      {
        language_code: "es",
        name: "Registro e Infinite Campus",
        description:
          "Cómo registrar estudiantes, entrar al portal familiar y revisar calificaciones y asistencia.",
      },
      {
        language_code: "en",
        name: "Registration & Infinite Campus",
        description:
          "How to register students, log into the family portal, and check grades and attendance.",
      },
      {
        language_code: "ksw",
        name: "တၢ်မၤနီၣ်မံၤ ဒီး Infinite Campus",
        description:
          "ကျဲလၢကမၤနီၣ်မံၤကၠိဖိ, ကျဲလၢကနုာ်လီၤဆူ မိၢ်ပၢ်တၢ်ပရၢ ဒီးကွၢ်နီၣ်ဂံၢ်ဒီးတၢ်ဟဲကၠိ.",
      },
    ],
  },
  {
    id: "cat_transporte",
    slug: "transporte",
    name: "Transporte",
    description:
      "Autobuses escolares amarillos de DMPS, pases gratuitos de DART y rutas hacia la escuela.",
    icon: "Bus",
    display_order: 4,
    is_featured: true,
    is_visible: true,
    school_id: "lincoln",
    category_translations: [
      {
        language_code: "es",
        name: "Transporte",
        description:
          "Autobuses escolares amarillos de DMPS, pases gratuitos de DART y rutas hacia la escuela.",
      },
      {
        language_code: "en",
        name: "Transportation",
        description: "DMPS yellow school buses, free DART student passes, and transit routes.",
      },
      {
        language_code: "ksw",
        name: "တၢ်လဲၤတၢ်က့ တၢ်ဘံၣ်တၢ်ဘၢ",
        description: "DMPS ကၠိဘၢးစ်ဂီၤ, DART ကၠိဖိတၢ်လဲၤတၢ်က့လၢအခ့အဖျါတအိၣ် ဒီးတၢ်လဲၤတၢ်က့ကျဲတဖၣ်.",
      },
    ],
  },
  {
    id: "cat_comidas_escolares",
    slug: "comidas-escolares",
    name: "Comidas escolares",
    description: "Menús mensuales de desayuno y almuerzo, nutrición escolar y dietas especiales.",
    icon: "Utensils",
    display_order: 5,
    is_featured: true,
    is_visible: true,
    school_id: "lincoln",
    category_translations: [
      {
        language_code: "es",
        name: "Comidas escolares",
        description:
          "Menús mensuales de desayuno y almuerzo, nutrición escolar y dietas especiales.",
      },
      {
        language_code: "en",
        name: "School Meals",
        description: "Monthly breakfast and lunch menus, school nutrition, and special diets.",
      },
      {
        language_code: "ksw",
        name: "ကၠိတၢ်အီၣ်တၢ်အီ",
        description:
          "လါဒိၣ်တၢ်အီၣ်ဂီၤဒီးတၢ်အီၣ်မုၢ်ထီၣ်တၢ်အီၣ်ခီၣ်မံၤ, ကၠိတၢ်အီၣ်တၢ်အီတၢ်ဘံၣ်တၢ်ဘၢ ဒီးတၢ်အီၣ်အဂၤတဖၣ်.",
      },
    ],
  },
  {
    id: "cat_deportes_actividades",
    slug: "deportes-y-actividades",
    name: "Deportes y actividades",
    description:
      "Equipos deportivos, clubes estudiantiles, requisitos de registro y calendario de juegos.",
    icon: "Trophy",
    display_order: 6,
    is_featured: true,
    is_visible: true,
    school_id: "lincoln",
    category_translations: [
      {
        language_code: "es",
        name: "Deportes y actividades",
        description:
          "Equipos deportivos, clubes estudiantiles, requisitos de registro y calendario de juegos.",
      },
      {
        language_code: "en",
        name: "Sports & Activities",
        description:
          "Athletic teams, student clubs, registration requirements, and game schedules.",
      },
      {
        language_code: "ksw",
        name: "တၢ်လုၢ်လၢ်သးခု ဒီးတၢ်မၤသကိး",
        description:
          "ကၠိတၢ်လုၢ်လၢ်အဘုၣ်တဖၣ်, ကၠိဖိကရူၢ်, တၢ်မၤနီၣ်မံၤတၢ်လိၣ်တဖၣ် ဒီးတၢ်ပြၢတၢ်ဆၢကတီၢ်.",
      },
    ],
  },
  {
    id: "cat_programas_oportunidades",
    slug: "programas-y-oportunidades",
    name: "Programas y oportunidades",
    description:
      "Cursos avanzados, Central Campus, preparación universitaria y servicio comunitario Silver Cord.",
    icon: "GraduationCap",
    display_order: 7,
    is_featured: true,
    is_visible: true,
    school_id: "lincoln",
    category_translations: [
      {
        language_code: "es",
        name: "Programas y oportunidades",
        description:
          "Cursos avanzados, Central Campus, preparación universitaria y servicio comunitario Silver Cord.",
      },
      {
        language_code: "en",
        name: "Programs & Opportunities",
        description:
          "Advanced courses, Central Campus programs, college prep, and Silver Cord volunteer honors.",
      },
      {
        language_code: "ksw",
        name: "တၢ်ရဲၣ်တၢ်ကျဲၤ ဒီးတၢ်ခွဲးတၢ်ယာ်",
        description:
          "တၢ်မၤလိဒိၣ်ထီၣ်တဖၣ်, Central Campus, တၢ်ကတဲာ်ကတီၤလၢကၠိဒိၣ် ဒီး Silver Cord တၢ်မၤစၢၤပှၤဂီၢ်မုၢ်.",
      },
    ],
  },
  {
    id: "cat_asistencia_politicas",
    slug: "asistencia-y-politicas",
    name: "Asistencia y políticas",
    description:
      "Cómo reportar ausencias, justificantes médicos, código de vestimenta y normas escolares.",
    icon: "ShieldCheck",
    display_order: 8,
    is_featured: true,
    is_visible: true,
    school_id: "lincoln",
    category_translations: [
      {
        language_code: "es",
        name: "Asistencia y políticas",
        description:
          "Cómo reportar ausencias, justificantes médicos, código de vestimenta y normas escolares.",
      },
      {
        language_code: "en",
        name: "Attendance & Policies",
        description:
          "How to report absences, doctor excuses, student dress code, and school policies.",
      },
      {
        language_code: "ksw",
        name: "တၢ်ဟဲကၠိ ဒီးတၢ်သိၣ်တၢ်သီ",
        description:
          "ကျဲလၢကပာ်ဖျါတၢ်တဟဲကၠိ, ကသံၣ်သရၣ်တၢ်အုၣ်သး, တၢ်ကူတၢ်ကၤတၢ်သိၣ်တၢ်သီ ဒီးကၠိတၢ်ဘျၢတဖၣ်.",
      },
    ],
  },
  {
    id: "cat_ayuda_familias",
    slug: "ayuda-para-familias",
    name: "Ayuda para familias",
    description:
      "Enlaces bilingües de apoyo familiar (BFL), despensa comunitaria, consejería y recursos de emergencia.",
    icon: "HeartHandshake",
    display_order: 9,
    is_featured: true,
    is_visible: true,
    school_id: "lincoln",
    category_translations: [
      {
        language_code: "es",
        name: "Ayuda para familias",
        description:
          "Enlaces bilingües de apoyo familiar (BFL), despensa comunitaria, consejería y recursos de emergencia.",
      },
      {
        language_code: "en",
        name: "Family Support",
        description:
          "Bilingual Family Liaisons (BFL), community pantry, counseling, and emergency assistance.",
      },
      {
        language_code: "ksw",
        name: "တၢ်မၤစၢၤလၢ ဟံၣ်ဖိဃီဖိအဂီၢ်",
        description:
          "ကျိာ်ခံဘိမိၢ်ပၢ်တၢ်ဆဲးကျိးပှၤမၤစၢၤ (BFL), တၢ်အီၣ်တၢ်အီတၢ်မၤစၢၤ, တၢ်ဟ့ၣ်ကူၣ် ဒီးတၢ်မၤစၢၤလၢတၢ်အဆိကတီၢ်.",
      },
    ],
  },
];

/**
 * Rich Articles for All 9 Categories with Top Banners, Blocks & Multilingual translations.
 */
export const SEED_ARTICLES: ArticleRow[] = [
  // 1. EMPcolumn: Empieza aquí
  {
    id: "art_bienvenidos_lincoln",
    slug: "bienvenidos-a-lincoln-high-school",
    status: "published",
    category_id: "cat_empieza_aqui",
    school_id: "lincoln",
    is_featured: true,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Bienvenidos a Lincoln High School",
        summary:
          "Todo lo que tu familia necesita saber para iniciar con éxito el año escolar en Lincoln High School.",
        content_blocks: [
          {
            type: "callout",
            title: "¡Orgullo Railsplitter!",
            text: "Lincoln High School es el hogar de más de 2,300 estudiantes con una rica tradición académica, artística y deportiva en el sur de Des Moines.",
            variant: "verified",
          },
          {
            type: "heading",
            text: "Nuestra Misión y Comunidad",
          },
          {
            type: "paragraph",
            text: "En Lincoln nos aseguramos de que cada estudiante tenga acceso a oportunidades académicas de excelencia, apoyo emocional y orientación hacia la universidad y carreras profesionales.",
          },
          {
            type: "list",
            items: [
              "Horario escolar general: 8:25 AM a 3:25 PM (Miércoles salida temprana a las 1:55 PM).",
              "Dirección del campus principal: 2600 SW 9th St, Des Moines, IA 50315.",
              "Teléfono principal de atención: 515-242-7500.",
              "Enlace bilingüe en español para familias: 515-242-7508.",
            ],
          },
        ],
      },
      {
        language_code: "en",
        title: "Welcome to Lincoln High School",
        summary:
          "Everything your family needs to know to start the school year successfully at Lincoln High School.",
        content_blocks: [
          {
            type: "callout",
            title: "Railsplitter Pride!",
            text: "Lincoln High School is home to over 2,300 students with a rich tradition of academics, arts, and athletics in South Des Moines.",
            variant: "verified",
          },
          {
            type: "heading",
            text: "Our Mission & Community",
          },
          {
            type: "paragraph",
            text: "At Lincoln, we ensure every student has access to academic excellence, social-emotional support, and future college and career pathways.",
          },
          {
            type: "list",
            items: [
              "Regular school hours: 8:25 AM to 3:25 PM (Wednesday early dismissal at 1:55 PM).",
              "Main campus address: 2600 SW 9th St, Des Moines, IA 50315.",
              "Main office phone: 515-242-7500.",
              "Bilingual Family Liaison (Spanish): 515-242-7508.",
            ],
          },
        ],
      },
      {
        language_code: "ksw",
        title: "တၢ်တူၢ်လိာ်ဆူ Lincoln High School",
        summary: "တၢ်ပရၢခဲလၢာ်လၢ ဟံၣ်ဖိဃီဖိလိၣ်ဘၣ်ဝဲ လၢကစးထီၣ်ကၠိတၢ်မၤလိဖဲ Lincoln အဂီၢ်.",
        content_blocks: [
          {
            type: "callout",
            title: "တၢ်ပာ်ဒိၣ်ပာ်ကဲ ကၠိတၢ်စံးပတြၢၤ",
            text: "Lincoln High School မ့ၢ်ကၠိလၢ ကၠိဖိအိၣ် ၂,၃၀၀ ဘျဲၣ် လၢအမၤလိဝဲလၢ Des Moines ကလံၤထံးတကပၤ.",
            variant: "verified",
          },
          {
            type: "heading",
            text: "ပတၢ်တိာ်ပာ် ဒီးကရူၢ်တၢ်မၤသကိး",
          },
          {
            type: "paragraph",
            text: "ပမၤစၢၤကၠိဖိကိးဂၤဒ်သိး ကဒိးန့ၢ်တၢ်ကူၣ်ဘၣ်ကူၣ်သ့အဂ့ၤကတၢၢ် ဒီးတၢ်ကတဲာ်ကတီၤလၢ ကၠိဒိၣ်တၢ်မၤအဂီၢ်.",
          },
        ],
      },
    ],
  },
  {
    id: "art_guia_familias_nuevas",
    slug: "guia-para-familias-nuevas",
    status: "published",
    category_id: "cat_empieza_aqui",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Guía para familias nuevas",
        summary:
          "Pasos esenciales para estudiantes que ingresan por primera vez o se trasladan a Lincoln.",
        content_blocks: [
          {
            type: "heading",
            text: "Primeros Pasos al Llegar",
          },
          {
            type: "paragraph",
            text: "Si tu familia es nueva en el distrito o se mudó recientemente, te recomendamos completar estos cuatro pasos:",
          },
          {
            type: "list",
            items: [
              "1. Verifica tu registro en el sistema Infinite Campus.",
              "2. Solicita tu tarjeta de autobús DART en la oficina principal si no tienes transporte escolar asignado.",
              "3. Conoce al consejero académico y al Enlace Bilingüe (BFL) de tu estudiante.",
              "4. Descarga la aplicación escolar DMPS Mobile para recibir notificaciones directas.",
            ],
          },
        ],
      },
      {
        language_code: "en",
        title: "Guide for New Families",
        summary:
          "Essential steps for students enrolling for the first time or transferring to Lincoln.",
        content_blocks: [
          {
            type: "heading",
            text: "First Steps Upon Arrival",
          },
          {
            type: "paragraph",
            text: "If your family is new to the district or recently moved, we recommend following these four steps:",
          },
          {
            type: "list",
            items: [
              "1. Verify enrollment in the Infinite Campus portal.",
              "2. Request your student DART bus pass at the main office if yellow bus is not assigned.",
              "3. Meet your student's assigned counselor and Bilingual Family Liaison (BFL).",
              "4. Download the DMPS Mobile app for instant district notifications.",
            ],
          },
        ],
      },
      {
        language_code: "ksw",
        title: "တၢ်နဲၣ်ကျဲလၢ ဟံၣ်ဖိဃီဖိအသီအဂီၢ်",
        summary: "တၢ်လိၣ်အရ့ဒိၣ်တဖၣ်လၢ ကၠိဖိလၢအဟဲနုာ်အသီဆူ Lincoln အဂီၢ်.",
        content_blocks: [
          {
            type: "heading",
            text: "တၢ်မၤစးထီၣ်တၢ်အလုၢ်အလၢ်",
          },
          {
            type: "list",
            items: [
              "၁. မၤနီၣ်မံၤဖဲ Infinite Campus တၢ်ပရၢအပူၤ.",
              "၂. ဟံးန့ၢ် DART ကၠိဖိဘၢးစ်ကဒ်ဖဲ ကၠိရုံးခိၣ်.",
              "၃. ထံၣ်လိာ်သးဒီး သရၣ်ဟ့ၣ်ကူၣ်တၢ် ဒီး BFL ပှၤမၤစၢၤ.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "art_como_usar_dmps_info",
    slug: "como-usar-dmps-info",
    status: "published",
    category_id: "cat_empieza_aqui",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cómo usar DMPS Info",
        summary:
          "Aprende a navegar las secciones, cambiar de idioma y encontrar recursos rápidamente.",
        content_blocks: [
          {
            type: "paragraph",
            text: "DMPS Info fue diseñado para que todas las familias de Des Moines encuentren respuestas claras sobre la escuela sin barreras de idioma.",
          },
          {
            type: "heading",
            text: "Herramientas Destacadas",
          },
          {
            type: "list",
            items: [
              "Selector de Idioma: Cambia al instante entre Español, Inglés y S'gaw Karen.",
              "Buscador Inteligente: Escribe palabras clave como 'autobús', 'calificaciones', 'menú' o 'ausencia'.",
              "Filtro por Escuela: Selecciona Lincoln High o East High para ver información específica.",
            ],
          },
        ],
      },
      {
        language_code: "en",
        title: "How to Use DMPS Info",
        summary:
          "Learn how to navigate sections, switch languages, and locate school resources quickly.",
        content_blocks: [
          {
            type: "paragraph",
            text: "DMPS Info was built so every Des Moines family can find clear answers about school without language barriers.",
          },
          {
            type: "heading",
            text: "Highlighted Features",
          },
          {
            type: "list",
            items: [
              "Language Switcher: Instantly toggle between Spanish, English, and S'gaw Karen.",
              "Smart Search: Search keywords like 'bus', 'grades', 'lunch menu', or 'attendance'.",
              "School Switcher: Select Lincoln or East High to view school-specific details.",
            ],
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကျဲလၢကသူ DMPS Info တၢ်ပရၢ",
        summary: "မၤလိကျဲလၢကဃုထံၣ်တၢ်ပရၢ ဒီးလဲၤဆူကျိာ်အဂၤတဖၣ်.",
        content_blocks: [
          {
            type: "paragraph",
            text: "DMPS Info အံၤ ဘၣ်တၢ်ဒုးအိၣ်ထီၣ်အီၤလၢ ဟံၣ်ဖိဃီဖိကိးဂၤ ကဒိးန့ၢ်တၢ်ပရၢလၢအညီ ဒီးတအိၣ်ဒီးတၢ်ကီတၢ်ခဲလၢကျိာ်အဂီၢ်.",
          },
        ],
      },
    ],
  },
  {
    id: "art_contacto_lincoln",
    slug: "informacion-de-contacto-de-lincoln",
    status: "published",
    category_id: "cat_empieza_aqui",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Información de contacto de Lincoln",
        summary:
          "Directorios telefónicos, correos de administración y líneas de atención en español.",
        content_blocks: [
          {
            type: "callout",
            title: "Atención en Español",
            text: "Llama directamente al 515-242-7508 para comunicarte con nuestro equipo bilingüe de apoyo familiar.",
            variant: "info",
          },
          {
            type: "heading",
            text: "Líneas Principales",
          },
          {
            type: "list",
            items: [
              "Oficina Principal: 515-242-7500",
              "Oficina de Asistencia (reportar faltas): 515-242-7504",
              "Consejería y Registro: 515-242-7510",
              "Enfermería Escolar: 515-242-7515",
              "Departamento Atlético: 515-242-7520",
            ],
          },
        ],
      },
      {
        language_code: "en",
        title: "Lincoln Contact Information",
        summary: "Phone directory, administrative contacts, and bilingual family liaisons.",
        content_blocks: [
          {
            type: "callout",
            title: "Spanish & Karen Assistance",
            text: "Call 515-242-7508 to reach our Bilingual Family Liaisons directly.",
            variant: "info",
          },
          {
            type: "heading",
            text: "Main Phone Numbers",
          },
          {
            type: "list",
            items: [
              "Main Office: 515-242-7500",
              "Attendance Office (Report Absences): 515-242-7504",
              "Counseling & Registrar: 515-242-7510",
              "School Nurse: 515-242-7515",
              "Athletic Department: 515-242-7520",
            ],
          },
        ],
      },
      {
        language_code: "ksw",
        title: "Lincoln တၢ်ဆဲးကျိးအပရၢ",
        summary: "ကၠိလီတဲစိနီၣ်ဂံၢ်တဖၣ် ဒီးပှၤမၤစၢၤတၢ်ဆဲးကျိးတဖၣ်.",
        content_blocks: [
          {
            type: "list",
            items: [
              "ကၠိရုံးခိၣ်: 515-242-7500",
              "တၢ်ဟဲကၠိရုံး: 515-242-7504",
              "BFL မိၢ်ပၢ်တၢ်မၤစၢၤ: 515-242-7508",
            ],
          },
        ],
      },
    ],
  },

  // 2. CALENDARIO Y HORARIOS
  {
    id: "art_calendario_escolar_dmps",
    slug: "calendario-escolar-de-dmps",
    status: "published",
    category_id: "cat_calendario_horarios",
    school_id: "lincoln",
    is_featured: true,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Calendario escolar de DMPS",
        summary:
          "Fechas clave oficiales 2026-2027: inicio de clases, vacaciones de invierno, receso de primavera y fin de curso.",
        content_blocks: [
          {
            type: "callout",
            title: "Calendario Oficial",
            text: "El calendario del distrito establece los días festivos y conferencias comunes para todas las escuelas públicas de Des Moines.",
            variant: "verified",
          },
          {
            type: "heading",
            text: "Fechas Clave del Ciclo 2026-2027",
          },
          {
            type: "list",
            items: [
              "Primer día de clases: 24 de agosto de 2026.",
              "Día del Trabajo (Sin clases): 7 de septiembre de 2026.",
              "Receso de Acción de Gracias: 25 al 27 de noviembre de 2026.",
              "Vacaciones de Invierno: 21 de diciembre de 2026 al 1 de enero de 2027.",
              "Receso de Primavera (Spring Break): 15 al 19 de marzo de 2027.",
              "Último día de clases: 28 de mayo de 2027.",
            ],
          },
        ],
      },
      {
        language_code: "en",
        title: "DMPS School Calendar",
        summary:
          "Official 2026-2027 key dates: first day of school, winter break, spring break, and last day.",
        content_blocks: [
          {
            type: "callout",
            title: "District Calendar",
            text: "The DMPS district calendar sets standard breaks and conferences across all Des Moines schools.",
            variant: "verified",
          },
          {
            type: "heading",
            text: "Key Dates for 2026-2027 School Year",
          },
          {
            type: "list",
            items: [
              "First Day of School: August 24, 2026.",
              "Labor Day (No School): September 7, 2026.",
              "Thanksgiving Break: November 25-27, 2026.",
              "Winter Break: December 21, 2026 - January 1, 2027.",
              "Spring Break: March 15-19, 2027.",
              "Last Day of School: May 28, 2027.",
            ],
          },
        ],
      },
      {
        language_code: "ksw",
        title: "DMPS ကၠိလါဆၣ်တၢ်ရဲၣ်တၢ်ကျဲၤ",
        summary: "ကၠိစးထီၣ်/ကျၢၢ်တံၢ် ဒီးမုၢ်နံၤအိၣ်ဘှံးအရ့ဒိၣ်တဖၣ် ၂၀၂၆-၂၀၂၇.",
        content_blocks: [
          {
            type: "list",
            items: [
              "ကၠိစးထီၣ်မုၢ်နံၤ: အီကူး ၂၄, ၂၀၂၆",
              "Winter Break အိၣ်ဘှံး: ဒီစဲဘၢ ၂၁ - ယူနူအါရံ ၁",
              "Spring Break အိၣ်ဘှံး: မၢ်ၡး ၁၅-၁၉, ၂၀၂၇",
              "ကၠိကျၢၢ်တံၢ်မုၢ်နံၤ: မ့ၤ ၂၈, ၂၀၂၇",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "art_horarios_lincoln",
    slug: "horarios-de-lincoln-high-school",
    status: "published",
    category_id: "cat_calendario_horarios",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Horarios de Lincoln High School",
        summary:
          "Horario de campanas regular, días de salida temprana los miércoles y horario de retraso de 2 horas.",
        content_blocks: [
          {
            type: "heading",
            text: "Horario Regular (Lunes, Martes, Jueves, Viernes)",
          },
          {
            type: "list",
            items: [
              "Periodo 1: 8:25 AM - 9:15 AM",
              "Periodo 2: 9:20 AM - 10:10 AM",
              "Periodo 3: 10:15 AM - 11:05 AM",
              "Periodo 4 y Almuerzos: 11:10 AM - 12:45 PM",
              "Periodo 5: 12:50 PM - 1:40 PM",
              "Periodo 6: 1:45 PM - 2:35 PM",
              "Periodo 7: 2:40 PM - 3:25 PM",
            ],
          },
          {
            type: "heading",
            text: "Salida Temprana de los Miércoles",
          },
          {
            type: "paragraph",
            text: "Todos los miércoles las clases terminan a la 1:55 PM para el desarrollo profesional de los maestros.",
          },
        ],
      },
      {
        language_code: "en",
        title: "Lincoln High School Bell Schedules",
        summary:
          "Standard bell schedule, Wednesday early dismissal, and 2-hour weather delay times.",
        content_blocks: [
          {
            type: "heading",
            text: "Standard Schedule (Mon, Tue, Thu, Fri)",
          },
          {
            type: "list",
            items: [
              "Period 1: 8:25 AM - 9:15 AM",
              "Period 2: 9:20 AM - 10:10 AM",
              "Period 3: 10:15 AM - 11:05 AM",
              "Period 4 & Lunch: 11:10 AM - 12:45 PM",
              "Period 5: 12:50 PM - 1:40 PM",
              "Period 6: 1:45 PM - 2:35 PM",
              "Period 7: 2:40 PM - 3:25 PM",
            ],
          },
          {
            type: "heading",
            text: "Wednesday Early Dismissal",
          },
          {
            type: "paragraph",
            text: "Every Wednesday school ends at 1:55 PM for teacher professional development.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "Lincoln High School ကၠိခိၣ်နားတၢ်ဆၢကတီၢ်",
        summary: "ကၠိခိၣ်နားတၢ်ဆၢကတီၢ်ဒီး မုၢ်ပၠဲးမုၢ်နံၤကၠိဟးထီၣ်အဆိတၢ်ပရၢ.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ကၠိစးထီၣ်ဖဲ ၈:၂၅ ဂီၤ ဒီးကျၢၢ်တံၢ်ဖဲ ၃:၂၅ ဟါ (မုၢ်ပၠဲးမုၢ်နံၤ ကျၢၢ်တံၢ်ဖဲ ၁:၅၅ ဟါ).",
          },
        ],
      },
    ],
  },
  {
    id: "art_cierres_retrasos",
    slug: "cierres-retrasos-y-cambios-escolares",
    status: "published",
    category_id: "cat_calendario_horarios",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1517299321909-be09a9705939?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cierres, retrasos y cambios escolares",
        summary: "Qué hacer cuando hay nieve, frío extremo o emergencias climáticas en Des Moines.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Durante el invierno, el superintendente evalúa las condiciones de las calles a las 5:00 AM para decidir si las clases se retrasan 2 horas o se cancelan.",
          },
          {
            type: "list",
            items: [
              "Retraso de 2 horas: Las clases comienzan a las 10:25 AM y los autobuses pasan 2 horas después de su horario habitual.",
              "Cierre total: No hay clases ni actividades extracurriculares.",
              "Medios de aviso: Mensaje de texto Infinite Campus, canales de TV locales (KCCI, WHO13) y DMPS Info.",
            ],
          },
        ],
      },
      {
        language_code: "en",
        title: "School Closings, Delays & Weather Changes",
        summary: "Protocol for snow, severe cold, and emergency weather delays in Des Moines.",
        content_blocks: [
          {
            type: "paragraph",
            text: "During winter, DMPS assesses road safety by 5:00 AM to determine if a 2-hour delay or school closing is needed.",
          },
          {
            type: "list",
            items: [
              "2-Hour Delay: Classes begin at 10:25 AM; buses run exactly 2 hours later.",
              "School Closure: All classes, building activities, and evening sports are canceled.",
              "Where to check: Infinite Campus SMS alerts, local news (KCCI, WHO13), and DMPS Info.",
            ],
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကၠိပတုာ်, တၢ်ယံာ်ထီၣ် ဒီးမုၢ်ဖျၢၣ်အိၣ်ဘှံးတၢ်ပရၢ",
        summary: "မုၢ်ဖျၢၣ်အဆိကတီၢ် ဒီးကျဲလၢကဒိးန့ၢ်တၢ်ပရၢဖဲကၠိပတုာ်အခါ.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ဖဲမူခိၣ်တၢ်အိၣ်သးအၢအခါ ကၠိတၢ်ပရၢကဟဲခီဖျိ လီတဲစိတၢ်ဆှၢပရၢ ဒီးတီဝံၣ်တၢ်ပရၢ.",
          },
        ],
      },
    ],
  },

  // 3. REGISTRO E INFINITE CAMPUS
  {
    id: "art_como_registrar_estudiante",
    slug: "como-registrar-a-un-estudiante",
    status: "published",
    category_id: "cat_registro_infinite_campus",
    school_id: "lincoln",
    is_featured: true,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cómo registrar a un estudiante",
        summary:
          "Requisitos de inscripción, documentos necesarios (comprobante de domicilio, cartilla de vacunación) y registro en línea.",
        content_blocks: [
          {
            type: "heading",
            text: "Documentos Requeridos",
          },
          {
            type: "list",
            items: [
              "1. Comprobante de edad del estudiante (acta de nacimiento o pasaporte).",
              "2. Comprobante de domicilio en Des Moines (factura de servicios públicos o contrato de arrendamiento).",
              "3. Registro oficial de vacunas de Iowa.",
              "4. Boletas o expediente escolar de la escuela anterior.",
            ],
          },
          {
            type: "paragraph",
            text: "El proceso se completa a través del portal de Registro en Línea de DMPS o en el Centro de Bienvenida del Distrito (Welcome Center).",
          },
        ],
      },
      {
        language_code: "en",
        title: "How to Register a Student",
        summary:
          "Enrollment requirements, required documents (proof of residency, immunization records), and online registration.",
        content_blocks: [
          {
            type: "heading",
            text: "Required Documents",
          },
          {
            type: "list",
            items: [
              "1. Proof of student age (birth certificate or passport).",
              "2. Proof of Des Moines residency (utility bill or lease agreement).",
              "3. Iowa Certificate of Immunization.",
              "4. Academic transcripts or records from prior school.",
            ],
          },
          {
            type: "paragraph",
            text: "Complete online enrollment via DMPS Online Registration or visit the DMPS Welcome Center.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကျဲလၢကမၤနီၣ်မံၤကၠိဖိတဂၤ",
        summary: "တၢ်မၤနီၣ်မံၤလၢကၠိဖိအဂီၢ် ဒီးလံာ်အရ့ဒိၣ်လၢကဘၣ်ပာ်ဖျါတဖၣ်.",
        content_blocks: [
          {
            type: "list",
            items: [
              "၁. ကၠိဖိအသးလံာ်အုၣ်သး (မံၤလံာ် သို့မဟုတ် Passport)",
              "၂. ဟံၣ်အိၣ်တၢ်လီၢ်လံာ်အုၣ်သး (Electric bill သို့မဟုတ် ဟံၣ်လံာ်ခီၣ်မံၤ)",
              "၃. ကသံၣ်ဆဲးလံာ်အုၣ်သး (Immunization records)",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "art_como_entrar_infinite_campus",
    slug: "como-entrar-a-infinite-campus",
    status: "published",
    category_id: "cat_registro_infinite_campus",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cómo entrar a Infinite Campus",
        summary:
          "Crea tu cuenta del Portal para Padres, recupera tu contraseña y descarga la app en tu teléfono.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Infinite Campus es la plataforma oficial donde las familias consultan calificaciones, tareas pendientes, asistencia diaria y avisos escolares.",
          },
          {
            type: "list",
            items: [
              "1. Ingresa a la página oficial de Infinite Campus Parent Portal de Des Moines.",
              "2. Si es tu primera vez, solicita tu Clave de Activación (Activation Key) a la oficina de Lincoln.",
              "3. Descarga la aplicación 'Campus Parent' en App Store o Google Play Store.",
            ],
          },
        ],
      },
      {
        language_code: "en",
        title: "How to Log into Infinite Campus",
        summary: "Create your Parent Portal account, reset passwords, and download the mobile app.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Infinite Campus is the official system for tracking student grades, assignments, attendance, and school announcements.",
          },
          {
            type: "list",
            items: [
              "1. Visit the official Des Moines Infinite Campus Parent Portal.",
              "2. If registering for the first time, request an Activation Key from Lincoln's office.",
              "3. Download the 'Campus Parent' mobile app on iOS or Android.",
            ],
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကျဲလၢကနုာ်လီၤဆူ Infinite Campus",
        summary: "ကျဲလၢကသူဝဲ Campus Parent app ဖဲလီတဲစိအပူၤ.",
        content_blocks: [
          {
            type: "paragraph",
            text: "သူ Infinite Campus ဒ်သိးနကကွၢ်နီၣ်ဂံၢ် ဒီးတၢ်ဟဲကၠိကိးနံၤဒဲး.",
          },
        ],
      },
    ],
  },
  {
    id: "art_revisar_calificaciones",
    slug: "como-revisar-calificaciones-y-asistencia",
    status: "published",
    category_id: "cat_registro_infinite_campus",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cómo revisar calificaciones y asistencia",
        summary:
          "Entiende la escala de calificaciones, cómo ver notas por periodo y monitorear faltas en vivo.",
        content_blocks: [
          {
            type: "paragraph",
            text: "En Infinite Campus puedes ver el reporte de calificaciones de cada materia y revisar si tu hijo asistió a cada periodo de clase.",
          },
        ],
      },
      {
        language_code: "en",
        title: "How to Check Grades & Attendance",
        summary:
          "Understand grading scales, period-by-period grades, and live attendance monitoring.",
        content_blocks: [
          {
            type: "paragraph",
            text: "In Infinite Campus you can view current grades for each class and check real-time attendance for every period.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကျဲလၢကကွၢ်နီၣ်ဂံၢ်ဒီးတၢ်ဟဲကၠိ",
        summary: "ကွၢ်ကၠိဖိအနီၣ်ဂံၢ်ဒီး ကၠိတၢ်မၤလိတဖၣ်ဖဲ Infinite Campus.",
        content_blocks: [
          {
            type: "paragraph",
            text: "နကွၢ်နီၣ်ဂံၢ်ဒီးတၢ်ဟဲကၠိသ့ဖဲ Infinite Campus တၢ်ပရၢအပူၤ.",
          },
        ],
      },
    ],
  },
  {
    id: "art_actualizar_info_familiar",
    slug: "como-actualizar-la-informacion-familiar",
    status: "published",
    category_id: "cat_registro_infinite_campus",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cómo actualizar la información familiar",
        summary: "Cambio de número de teléfono, dirección o contactos de emergencia en el sistema.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Es vital que la escuela cuente con tu teléfono y dirección actualizados para emergencias y avisos de transporte.",
          },
        ],
      },
      {
        language_code: "en",
        title: "How to Update Family Contact Information",
        summary:
          "Change phone numbers, home address, or emergency contacts in the district system.",
        content_blocks: [
          {
            type: "paragraph",
            text: "It is critical that the school has updated phone numbers and addresses for emergency alerts and bus routing.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကျဲလၢကမၤသီထီၣ် ဟံၣ်ဖိဃီဖိအပရၢ",
        summary: "ဆီတလဲ လီတဲစိနီၣ်ဂံၢ်, ဟံၣ်အိၣ်တၢ်လီၢ် ဒီးပှၤဆဲးကျိးအဆိကတီၢ်.",
        content_blocks: [
          {
            type: "paragraph",
            text: "မၤသီထီၣ်နလီတဲစိနီၣ်ဂံၢ်ဖဲ Infinite Campus အပူၤဒ်သိးကၠိကဆဲးကျိးနၤသ့အခါ.",
          },
        ],
      },
    ],
  },

  // 4. TRANSPORTE
  {
    id: "art_transporte_escolar_dmps",
    slug: "transporte-escolar-de-dmps",
    status: "published",
    category_id: "cat_transporte",
    school_id: "lincoln",
    is_featured: true,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Transporte escolar de DMPS",
        summary: "Reglas de elegibilidad para el autobús escolar amarillo y asignación de paradas.",
        content_blocks: [
          {
            type: "callout",
            title: "Criterio de Distancia",
            text: "Para estudiantes de preparatoria (grados 9-12), DMPS proporciona transporte si viven a más de 3 millas de su escuela asignada.",
            variant: "info",
          },
          {
            type: "paragraph",
            text: "La información sobre la ruta, número de autobús y hora de recogida se publica en la cuenta de Infinite Campus de cada familia.",
          },
        ],
      },
      {
        language_code: "en",
        title: "DMPS School Transportation",
        summary: "Eligibility rules for yellow school buses and bus stop assignments.",
        content_blocks: [
          {
            type: "callout",
            title: "Distance Eligibility",
            text: "For high school students (grades 9-12), DMPS provides bus transportation if living more than 3 miles from assigned school.",
            variant: "info",
          },
          {
            type: "paragraph",
            text: "Bus route numbers, stop locations, and pickup times are published in each family's Infinite Campus account.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "DMPS ကၠိတၢ်လဲၤတၢ်က့",
        summary: "ကၠိဘၢးစ်ဂီၤတၢ်သိၣ်တၢ်သီ ဒီးပှၤလၢအကြၢးဒိးန့ၢ်တၢ်မၤစၢၤတဖၣ်.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ကၠိဖိလၢအအိၣ်ယံၤဒီးကၠိ ၃ မံးလးအဖီခိၣ် ကဒိးန့ၢ်ကၠိဘၢးစ်တၢ်မၤစၢၤလၢအခ့အဖျါတအိၣ်.",
          },
        ],
      },
    ],
  },
  {
    id: "art_llegar_lincoln_dart",
    slug: "como-llegar-a-lincoln-usando-dart",
    status: "published",
    category_id: "cat_transporte",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cómo llegar a Lincoln usando DART",
        summary:
          "Rutas de autobús público DART (Ruta 7 y 8) y cómo los estudiantes viajan gratis con su credencial.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Todos los estudiantes de Lincoln High School pueden viajar GRATIS en cualquier autobús de DART presentando su identificación escolar de estudiante (Student ID).",
          },
          {
            type: "list",
            items: [
              "Ruta 7 (SW 9th): Conecta directo con el campus principal de Lincoln y el centro de Des Moines (DART Central Station).",
              "Ruta 8 (Fleur Dr): Conecta con el área oeste y el campus RAILS de 9º grado.",
            ],
          },
        ],
      },
      {
        language_code: "en",
        title: "How to Get to Lincoln Using DART Transit",
        summary:
          "DART public transit routes (Route 7 and Route 8) and free student rides with Student ID.",
        content_blocks: [
          {
            type: "paragraph",
            text: "All Lincoln High School students ride DART public buses for FREE by showing their current school Student ID.",
          },
          {
            type: "list",
            items: [
              "Route 7 (SW 9th): Direct access to Lincoln Main Campus and DART Central Station downtown.",
              "Route 8 (Fleur Dr): Serves the west corridor and the RAILS 9th Grade Academy.",
            ],
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကျဲလၢကလဲၤဆူ Lincoln ခီဖျိ DART ဘၢးစ်",
        summary: "DART ဘၢးစ်ကျဲတဖၣ် (Route 7 ဒီး Route 8) ဒီးကၠိဖိကဒ်လၢတၢ်လဲၤအခ့အဖျါတအိၣ်.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ကၠိဖိကိးဂၤသူဝဲ DART ဘၢးစ်လၢအခ့အဖျါတအိၣ်သ့ ခီဖျိပာ်ဖျါကၠိဖိကဒ်.",
          },
        ],
      },
    ],
  },
  {
    id: "art_autobus_retrasado",
    slug: "que-hacer-si-el-autobus-se-retrasa",
    status: "published",
    category_id: "cat_transporte",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Qué hacer si el autobús se retrasa",
        summary: "Contactos del departamento de transporte de DMPS y cómo rastrear el autobús.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Si el autobús escolar no ha pasado después de 15 minutos de la hora programada, llama a Despacho de Transporte al 515-242-7887.",
          },
        ],
      },
      {
        language_code: "en",
        title: "What to Do If the School Bus Is Delayed",
        summary: "DMPS Transportation Dispatch contact and how to check bus delays.",
        content_blocks: [
          {
            type: "paragraph",
            text: "If your school bus is more than 15 minutes late, contact DMPS Transportation Dispatch at 515-242-7887.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "တၢ်မနုၤကဘၣ်မၤန့ၣ် ဖဲကၠိဘၢးစ်ယံာ်ထီၣ်အခါ",
        summary: "DMPS တၢ်လဲၤတၢ်က့ရုံးနီၣ်ဂံၢ်: 515-242-7887.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ဖဲကၠိဘၢးစ်ယံာ်ထီၣ် ၁၅ မံနံးအခါ ကိးဘၣ် တၢ်လဲၤတၢ်က့ရုံးဖဲ 515-242-7887.",
          },
        ],
      },
    ],
  },

  // 5. COMIDAS ESCOLARES
  {
    id: "art_consultar_menu_lincoln",
    slug: "como-consultar-el-menu-de-lincoln",
    status: "published",
    category_id: "cat_comidas_escolares",
    school_id: "lincoln",
    is_featured: true,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cómo consultar el menú de Lincoln",
        summary: "Consulta el menú diario de desayunos y almuerzos en la plataforma Nutrislice.",
        content_blocks: [
          {
            type: "paragraph",
            text: "El menú escolar se publica mensualmente con información sobre ingredientes, calorías y alérgenos en dmschools.nutrislice.com.",
          },
        ],
      },
      {
        language_code: "en",
        title: "How to Check Lincoln's Daily Menu",
        summary: "View daily breakfast and lunch menus on the Nutrislice dining platform.",
        content_blocks: [
          {
            type: "paragraph",
            text: "School menus are published monthly with full nutrition and allergen details at dmschools.nutrislice.com.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကျဲလၢကကွၢ် Lincoln ကၠိတၢ်အီၣ်ခီၣ်မံၤ",
        summary: "ကွၢ်ကၠိတၢ်အီၣ်တၢ်အီခီၣ်မံၤဖဲ Nutrislice တၢ်ပရၢအပူၤ.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ကၠိတၢ်အီၣ်ခီၣ်မံၤအိၣ်ဖဲ dmschools.nutrislice.com အပူၤ.",
          },
        ],
      },
    ],
  },
  {
    id: "art_informacion_comidas",
    slug: "informacion-sobre-comidas-escolares",
    status: "published",
    category_id: "cat_comidas_escolares",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Información sobre comidas escolares",
        summary: "Desayuno gratis para todos los estudiantes y programa de almuerzo escolar.",
        content_blocks: [
          {
            type: "paragraph",
            text: "En Des Moines Public Schools, el desayuno es 100% gratuito para todos los estudiantes cada mañana antes de iniciar clases.",
          },
        ],
      },
      {
        language_code: "en",
        title: "School Meal Program Information",
        summary: "Universal free breakfast for all students and school lunch program guidelines.",
        content_blocks: [
          {
            type: "paragraph",
            text: "In Des Moines Public Schools, breakfast is 100% free for all students every morning before the first bell.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကၠိတၢ်အီၣ်တၢ်အီတၢ်ရဲၣ်တၢ်ကျဲၤအပရၢ",
        summary: "ကၠိတၢ်အီၣ်ဂီၤအိၣ်လၢ အခ့အဖျါတအိၣ်လၢ ကၠိဖိကိးဂၤအဂီၢ်.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ကၠိတၢ်အီၣ်ဂီၤမ့ၢ်တၢ်လၢအခ့အဖျါတအိၣ်လၢ ကၠိဖိကိးဂၤဒဲးဖဲ DMPS အပူၤ.",
          },
        ],
      },
    ],
  },
  {
    id: "art_alergias_alimentarias",
    slug: "alergias-y-necesidades-alimentarias",
    status: "published",
    category_id: "cat_comidas_escolares",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Alergias y necesidades alimentarias",
        summary:
          "Cómo solicitar adaptaciones de menú por alergias a nueces, leche, gluten o dietas religiosas.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Si tu estudiante tiene una alergia severa o requiere menú especial, entrega el formulario médico en la enfermería escolar.",
          },
        ],
      },
      {
        language_code: "en",
        title: "Allergies & Dietary Accommodations",
        summary:
          "How to request meal accommodations for nut allergies, dairy, gluten, or religious dietary needs.",
        content_blocks: [
          {
            type: "paragraph",
            text: "If your student has food allergies or medical dietary needs, submit the Diet Modification Form to the school nurse.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "တၢ်အီၣ်လၢတဘၣ်သးဒီးတၢ်အီၣ်အဂၤတဖၣ်",
        summary: "ကျဲလၢကဟ့ၣ်လံာ်ကသံၣ်သရၣ်တၢ်အုၣ်သးလၢ တၢ်အီၣ်အဂီၢ်ဆူ ကၠိနၢ်စ်.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ဟ့ၣ်လံာ်ကသံၣ်သရၣ်တၢ်အုၣ်သးဆူ ကၠိနၢ်စ်ဖဲ ကၠိဖိတၢ်အီၣ်တဘၣ်သးအိၣ်အခါ.",
          },
        ],
      },
    ],
  },

  // 6. DEPORTES Y ACTIVIDADES
  {
    id: "art_deportes_lincoln",
    slug: "deportes-disponibles-en-lincoln",
    status: "published",
    category_id: "cat_deportes_actividades",
    school_id: "lincoln",
    is_featured: true,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Deportes disponibles en Lincoln",
        summary:
          "Deportes de otoño, invierno y primavera: fútbol, básquetbol, fútbol americano, voleibol, atletismo y más.",
        content_blocks: [
          {
            type: "heading",
            text: "Deportes por Temporada",
          },
          {
            type: "list",
            items: [
              "Otoño: Fútbol americano, voleibol, campo traviesa, natación femenil, golf varonil.",
              "Invierno: Básquetbol varonil y femenil, lucha olímpica (wrestling), natación varonil, boliche.",
              "Primavera: Fútbol (soccer) varonil y femenil, atletismo (track & field), tenis, golf femenil.",
              "Verano: Béisbol y sóftbol.",
            ],
          },
        ],
      },
      {
        language_code: "en",
        title: "Sports Available at Lincoln High School",
        summary:
          "Fall, winter, and spring sports: soccer, basketball, football, volleyball, track & field, and more.",
        content_blocks: [
          {
            type: "heading",
            text: "Sports by Season",
          },
          {
            type: "list",
            items: [
              "Fall: Football, Volleyball, Cross Country, Girls Swimming, Boys Golf.",
              "Winter: Boys & Girls Basketball, Wrestling, Boys Swimming, Bowling.",
              "Spring: Boys & Girls Soccer, Track & Field, Tennis, Girls Golf.",
              "Summer: Baseball and Softball.",
            ],
          },
        ],
      },
      {
        language_code: "ksw",
        title: "တၢ်လုၢ်လၢ်အိၣ်ဝဲဖဲ Lincoln High School",
        summary: "ဘီရၣ်တၢ်ပြၢ, ဘဲးစကဲးဘီး, ဘိလၢၤ, တၢ်ဃ့ၢ်ပြၢ ဒီးတၢ်လုၢ်လၢ်အဂၤတဖၣ်.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Lincoln အိၣ်ဒီးတၢ်လုၢ်လၢ်အဘုၣ်တဖၣ်လၢ ကၠိဖိခဲလၢာ် ကမၤနီၣ်မံၤဒီးပြၢတၢ်.",
          },
        ],
      },
    ],
  },
  {
    id: "art_actividades_extracurriculares",
    slug: "actividades-extracurriculares-de-lincoln",
    status: "published",
    category_id: "cat_deportes_actividades",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Actividades extracurriculares de Lincoln",
        summary:
          "Clubes de robótica, banda de música, coro, teatro, consejo estudiantil y organizaciones culturales.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Participar en clubes escolares ayuda a los estudiantes a hacer amigos, desarrollar liderazgo y enriquecer su expediente universitario.",
          },
        ],
      },
      {
        language_code: "en",
        title: "Lincoln Extracurricular Clubs & Activities",
        summary:
          "Robotics club, marching band, choir, theater, student council, and cultural affinity groups.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Extracurricular clubs help students build leadership skills, make lasting friendships, and strengthen college applications.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "Lincoln ကၠိအချၢတၢ်မၤသကိးတဖၣ်",
        summary: "တၢ်သးဝါ, သီခါရူ, ကၠိဖိကရူၢ် ဒီးတၢ်မၤသကိးတဖၣ်.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ကၠိဖိမၤနုာ်လီၤသးလၢ ကၠိဖိကရူၢ်တဖၣ်အပူၤသ့.",
          },
        ],
      },
    ],
  },
  {
    id: "art_registro_deporte",
    slug: "como-registrarse-en-un-deporte-o-actividad",
    status: "published",
    category_id: "cat_deportes_actividades",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cómo registrarse en un deporte o actividad",
        summary:
          "Examen físico deportivo obligatorio, registro en Bound y consentimiento de padres.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Todos los atletas deben tener un examen físico vigente firmado por un médico y estar registrados en la plataforma Bound.",
          },
        ],
      },
      {
        language_code: "en",
        title: "How to Register for Sports or Activities",
        summary: "Mandatory sports physical exam, Bound registration, and parent consent forms.",
        content_blocks: [
          {
            type: "paragraph",
            text: "All athletes must have an up-to-date sports physical on file and be registered on Bound before the first practice.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကျဲလၢကမၤနီၣ်မံၤလၢ တၢ်လုၢ်လၢ်တၢ်မၤအဂီၢ်",
        summary: "ကသံၣ်သရၣ်တၢ်အုၣ်သးလၢ တၢ်လုၢ်လၢ်အဂီၢ် ဒီး Bound တၢ်မၤနီၣ်မံၤ.",
        content_blocks: [
          {
            type: "paragraph",
            text: "မၤနီၣ်မံၤဖဲ Bound တၢ်ပရၢအပူၤဒီး ဟ့ၣ်လံာ်ကသံၣ်သရၣ်တၢ်အုၣ်သး.",
          },
        ],
      },
    ],
  },
  {
    id: "art_consultar_juegos_resultados",
    slug: "como-consultar-juegos-eventos-y-resultados",
    status: "published",
    category_id: "cat_deportes_actividades",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cómo consultar juegos, eventos y resultados",
        summary:
          "Boletos digitales, sedes de partidos y tabla de posiciones de Lincoln Railsplitters.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Sigue los horarios de partidos, resultados en vivo y compra boletos digitales en gobound.com/ia/ighsau/lincoln.",
          },
        ],
      },
      {
        language_code: "en",
        title: "How to View Game Schedules, Events & Scores",
        summary: "Digital tickets, game locations, and standings for Lincoln Railsplitters.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Track game schedules, live scores, and purchase digital admission tickets at gobound.com/ia/ighsau/lincoln.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကျဲလၢကကွၢ်တၢ်ပြၢတၢ်ဆၢကတီၢ်ဒီးတၢ်ဒိးန့ၢ်နီၣ်ဂံၢ်",
        summary: "ကွၢ်တၢ်ပြၢတၢ်ဆၢကတီၢ်ဖဲ Bound တၢ်ပရၢအပူၤ.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ကွၢ်တၢ်ပြၢတၢ်ဆၢကတီၢ်ဖဲ gobound.com တၢ်ပရၢအပူၤသ့.",
          },
        ],
      },
    ],
  },

  // 7. PROGRAMAS Y OPORTUNIDADES
  {
    id: "art_programas_lincoln",
    slug: "programas-disponibles-en-lincoln",
    status: "published",
    category_id: "cat_programas_oportunidades",
    school_id: "lincoln",
    is_featured: true,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Programas disponibles en Lincoln",
        summary:
          "Programas de Colocación Avanzada (AP), Central Campus técnico y Academy de 9.º grado.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Lincoln ofrece más de 20 cursos AP con créditos universitarios, programas bilingües y acceso a carreras técnicas en Central Campus.",
          },
        ],
      },
      {
        language_code: "en",
        title: "Academic Programs Available at Lincoln",
        summary:
          "Advanced Placement (AP) courses, Central Campus career tech, and 9th Grade Academy.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Lincoln offers 20+ AP college credit courses, ELL dual-language programs, and vocational training at Central Campus.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "တၢ်ကူၣ်ဘၣ်ကူၣ်သ့တၢ်ရဲၣ်တၢ်ကျဲၤဖဲ Lincoln",
        summary: "AP တၢ်မၤလိ, Central Campus ဒီးတၢ်ကတဲာ်ကတီၤလၢကၠိဒိၣ်အဂီၢ်.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Lincoln အိၣ်ဒီးတၢ်ကူၣ်ဘၣ်ကူၣ်သ့တၢ်ရဲၣ်တၢ်ကျဲၤအါမံၤလၢ ကၠိဖိအဂီၢ်.",
          },
        ],
      },
    ],
  },
  {
    id: "art_silver_cord",
    slug: "voluntariado-y-silver-cord",
    status: "published",
    category_id: "cat_programas_oportunidades",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Voluntariado y Silver Cord",
        summary:
          "Cómo acumular 160 horas de servicio comunitario para graduarse con el prestigioso Cordón de Plata.",
        content_blocks: [
          {
            type: "paragraph",
            text: "El programa Silver Cord reconoce a los estudiantes que completan al menos 40 horas de voluntariado por año de preparatoria.",
          },
        ],
      },
      {
        language_code: "en",
        title: "Volunteering & Silver Cord Honor Program",
        summary:
          "How to complete 160 hours of community service to earn the Silver Cord at graduation.",
        content_blocks: [
          {
            type: "paragraph",
            text: "The Silver Cord program honors high school students who perform 40+ hours of community service each school year.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "တၢ်မၤစၢၤပှၤဂီၢ်မုၢ် ဒီး Silver Cord တၢ်ရဲၣ်တၢ်ကျဲၤ",
        summary: "တၢ်မၤစၢၤပှၤဂီၢ်မုၢ် အနၣ်ရံၣ် ၁၆၀ ဒီးဒိးန့ၢ် Silver Cord လၢကၠိဖျိးတၢ်မၤအပူၤ.",
        content_blocks: [
          {
            type: "paragraph",
            text: "မၤစၢၤပှၤဂီၢ်မုၢ်ဒီး ကၠိဖျိးဒီး Silver Cord တၢ်လၤကပီၤ.",
          },
        ],
      },
    ],
  },
  {
    id: "art_universidad_carreras",
    slug: "universidad-y-carreras",
    status: "published",
    category_id: "cat_programas_oportunidades",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Universidad y carreras",
        summary:
          "Orientación universitaria, ayuda financiera FAFSA, becas escolares y visitas a universidades.",
        content_blocks: [
          {
            type: "paragraph",
            text: "El Centro de Consejería guía a las familias en la solicitud de becas, beca Iowa Last Dollar y talleres de llenado de FAFSA.",
          },
        ],
      },
      {
        language_code: "en",
        title: "College, Careers & Future Pathways",
        summary:
          "College advising, FAFSA financial aid workshops, scholarships, and campus visits.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Counselors guide students and families through college applications, Iowa Last Dollar scholarships, and FAFSA completion.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကၠိဒိၣ်, တၢ်မၤဒီးခါဆူညါတၢ်ကျဲ",
        summary: "FAFSA စ့တၢ်မၤစၢၤ ဒီးတၢ်ကတဲာ်ကတီၤလၢကၠိဒိၣ်အဂီၢ်.",
        content_blocks: [
          {
            type: "paragraph",
            text: "သရၣ်ဟ့ၣ်ကူၣ်တၢ် ကမၤစၢၤကၠိဖိလၢ FAFSA ဒီးကၠိဒိၣ်တၢ်မၤစၢၤစ့အဂီၢ်.",
          },
        ],
      },
    ],
  },
  {
    id: "art_requisitos_graduacion",
    slug: "requisitos-de-graduacion",
    status: "published",
    category_id: "cat_programas_oportunidades",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Requisitos de graduación",
        summary:
          "Créditos necesarios en inglés, matemáticas, ciencias, estudios sociales y educación física para graduarse.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Se requieren 23 créditos académicos totales para obtener el diploma de preparatoria de Des Moines Public Schools.",
          },
        ],
      },
      {
        language_code: "en",
        title: "High School Graduation Requirements",
        summary:
          "Required credits in English, Math, Science, Social Studies, and Physical Education.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Students must complete 23 total academic credits to earn an official Des Moines Public Schools high school diploma.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကၠိဖျိးတၢ်လိၣ်တဖၣ်",
        summary: "နီၣ်ဂံၢ်ခရဲဒံၣ် ၂၃ လၢကဒိးန့ၢ်ကၠိဖျိးလံာ်အုၣ်သးအဂီၢ်.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ကၠိဖိလိၣ်ဘၣ် ခရဲဒံၣ် ၂၃ လၢကဒိးန့ၢ် DMPS ကၠိဖျိးလံာ်အုၣ်သးအဂီၢ်.",
          },
        ],
      },
    ],
  },

  // 8. ASISTENCIA Y POLÍTICAS
  {
    id: "art_reportar_ausencia",
    slug: "como-reportar-una-ausencia",
    status: "published",
    category_id: "cat_asistencia_politicas",
    school_id: "lincoln",
    is_featured: true,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cómo reportar una ausencia",
        summary:
          "Llama a la línea de asistencia al 515-242-7504 antes de las 9:00 AM si tu estudiante no asistirá.",
        content_blocks: [
          {
            type: "callout",
            title: "Línea de Asistencia",
            text: "Llama al 515-242-7504 o envía un mensaje en Infinite Campus indicando el nombre completo del estudiante, grado y motivo de la falta.",
            variant: "warning",
          },
          {
            type: "paragraph",
            text: "Las faltas justificadas incluyen enfermedad, citas médicas o dentales con comprobante y emergencias familiares.",
          },
        ],
      },
      {
        language_code: "en",
        title: "How to Report a Student Absence",
        summary:
          "Call the attendance line at 515-242-7504 before 9:00 AM if your student is missing school.",
        content_blocks: [
          {
            type: "callout",
            title: "Attendance Hotline",
            text: "Call 515-242-7504 or send an absence note in Infinite Campus stating student name, grade, and reason.",
            variant: "warning",
          },
          {
            type: "paragraph",
            text: "Excused absences include illness, doctor/dental appointments with note, and family emergencies.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကျဲလၢကပာ်ဖျါတၢ်တဟဲကၠိ",
        summary: "ကိးလီတဲစိဆူ 515-242-7504 ဖဲကၠိဖိတဟဲကၠိအခါ.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ကိးဘၣ်တၢ်ဟဲကၠိရုံးဖဲ 515-242-7504 တချုး ၉:၀၀ ဂီၤဒံးဘၣ်.",
          },
        ],
      },
    ],
  },
  {
    id: "art_revisar_asistencia",
    slug: "como-revisar-la-asistencia",
    status: "published",
    category_id: "cat_asistencia_politicas",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Cómo revisar la asistencia",
        summary:
          "Monitorea la puntualidad y faltas por periodo en tiempo real desde la aplicación Campus Parent.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Revisar la asistencia regularmente asegura que tu hijo esté en clase y previene problemas de ausentismo crónico.",
          },
        ],
      },
      {
        language_code: "en",
        title: "How to Monitor Student Attendance",
        summary:
          "Track period-by-period attendance and tardiness in real time using the Campus Parent app.",
        content_blocks: [
          {
            type: "paragraph",
            text: "Regularly checking attendance ensures your student is in class and prevents chronic absenteeism.",
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ကျဲလၢကကွၢ်ထီဒါတၢ်ဟဲကၠိ",
        summary: "ကွၢ်တၢ်ဟဲကၠိဖဲ Campus Parent app အပူၤ.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ကွၢ်တၢ်ဟဲကၠိခီဖျိ Campus Parent app ဒ်သိးကၠိဖိကအိၣ်ဖဲကၠိပူၤလၢာ်လၢာ်.",
          },
        ],
      },
    ],
  },
  {
    id: "art_politicas_importantes",
    slug: "politicas-importantes-para-las-familias",
    status: "published",
    category_id: "cat_asistencia_politicas",
    school_id: "lincoln",
    is_featured: false,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Políticas importantes para las familias",
        summary:
          "Uso de teléfonos celulares en clase, código de vestimenta y normas de convivencia escolar.",
        content_blocks: [
          {
            type: "list",
            items: [
              "Teléfonos celulares: Deben permanecer guardados y en silencio durante las horas de clase.",
              "Identificación escolar: Los estudiantes deben portar su credencial visible durante el día.",
              "Seguridad: Todas las puertas exteriores permanecen cerradas; los visitantes deben ingresar por la puerta principal con identificación.",
            ],
          },
        ],
      },
      {
        language_code: "en",
        title: "Important Policies for Families",
        summary: "Classroom cell phone policy, student dress code, and campus safety rules.",
        content_blocks: [
          {
            type: "list",
            items: [
              "Cell Phones: Must be stored and silenced during classroom instruction time.",
              "Student IDs: Students must wear their school badges visibly on campus.",
              "Building Security: All exterior doors are locked; visitors must enter through main entrance with photo ID.",
            ],
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ဟံၣ်ဖိဃီဖိတၢ်သိၣ်တၢ်သီအရ့ဒိၣ်တဖၣ်",
        summary: "လီတဲစိတၢ်သိၣ်တၢ်သီ, ကၠိကဒ်တၢ်သိၣ်တၢ်သီ ဒီးကၠိတၢ်ဘံၣ်တၢ်ဘၢ.",
        content_blocks: [
          {
            type: "paragraph",
            text: "ကၠိဖိတဖၣ်တဘၣ်သူ လီတဲစိဖဲတၢ်မၤလိဆၢကတီၢ်ဘၣ် ဒီးကဘၣ်ဒိးကၠိဖိကဒ်ထီဘိ.",
          },
        ],
      },
    ],
  },

  // 9. AYUDA PARA FAMILIAS
  {
    id: "art_donde_pedir_ayuda",
    slug: "donde-pedir-ayuda-en-lincoln",
    status: "published",
    category_id: "cat_ayuda_familias",
    school_id: "lincoln",
    is_featured: true,
    published_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    featured_image_url:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80",
    article_translations: [
      {
        language_code: "es",
        title: "Dónde pedir ayuda en Lincoln",
        summary:
          "Enlaces bilingües (BFL), despensa comunitaria, consejeros de salud mental y recursos de comida y vivienda.",
        content_blocks: [
          {
            type: "callout",
            title: "Equipo Bilingüe para Familias (BFL)",
            text: "Nuestros enlaces familiares hablan tu idioma y te ayudan con trámites, citas escolares y recursos comunitarios.",
            variant: "verified",
          },
          {
            type: "heading",
            text: "Recursos Disponibles en la Escuela",
          },
          {
            type: "list",
            items: [
              "Despensa Escolar de Alimentos: Comida y ropa gratuita para estudiantes y familias.",
              "Consejeros Académicos y de Salud Mental: Apoyo confidencial para el bienestar de tu hijo.",
              "Asistencia de Vivienda y Servicios: Conexión con programas de Polk County y United Way 211.",
            ],
          },
        ],
      },
      {
        language_code: "en",
        title: "Where to Get Help & Support at Lincoln",
        summary:
          "Bilingual Family Liaisons (BFL), school food pantry, mental health counselors, and housing resources.",
        content_blocks: [
          {
            type: "callout",
            title: "Bilingual Family Liaisons (BFL)",
            text: "Our family liaisons speak your language and assist with school forms, conferences, and community aid.",
            variant: "verified",
          },
          {
            type: "heading",
            text: "Available Support at School",
          },
          {
            type: "list",
            items: [
              "School Food Pantry: Free food, winter coats, and essentials for students and families.",
              "Academic & Mental Health Counselors: Confidential guidance for student well-being.",
              "Housing & Utility Aid: Direct connections to Polk County and United Way 211 resources.",
            ],
          },
        ],
      },
      {
        language_code: "ksw",
        title: "ဖဲလဲၣ်လၢကဒိးန့ၢ်တၢ်မၤစၢၤဖဲ Lincoln အပူၤ",
        summary: "BFL မိၢ်ပၢ်တၢ်မၤစၢၤ, တၢ်အီၣ်တၢ်အီတၢ်မၤစၢၤ ဒီးတၢ်ဟ့ၣ်ကူၣ်တၢ်မၤစၢၤ.",
        content_blocks: [
          {
            type: "paragraph",
            text: "BFL ပှၤမၤစၢၤတဖၣ် ကတိၤနကျိာ်သ့ ဒီးကမၤစၢၤနၤလၢ ကၠိတၢ်ပရၢဒီးတၢ်မၤစၢၤအဂၤတဖၣ်အပူၤ.",
          },
        ],
      },
    ],
  },
];
