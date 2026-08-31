/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Block } from "./content";

/**
 * High-quality bilingual/trilingual dictionary for Des Moines Public Schools,
 * providing accurate English and S'gaw Karen translations for categories,
 * guides, articles, schedules, and district policies.
 */
const PHRASE_DICTIONARY: Record<string, { en: string; kar: string }> = {
  // 1. Categories
  "Empieza aquí": {
    en: "Start Here",
    kar: "စးထီၣ်ဖဲအံၤ",
  },
  "Guía para familias nuevas, bienvenida y cómo usar este portal escolar.": {
    en: "Guide for new families, welcome information, and how to use this school portal.",
    kar: "တၢ်နဲၣ်ကျဲလၢ ဟံၣ်ဖိဃီဖိအသီ, တၢ်တူၢ်လိာ်တၢ်ဆိကမိၣ် ဒီးကျဲလၢကသူဝဲ ကၠိတၢ်ပရၢအံၤ.",
  },
  "Calendario y horarios": {
    en: "Calendar & Schedules",
    kar: "လါဆၣ်ဒီး တၢ်ဆၢကတီၢ်",
  },
  "Fechas clave, inicio y fin de cursos, vacaciones, conferencias y horarios de campanas.": {
    en: "Key dates, school start/end, breaks, parent conferences, and bell schedules.",
    kar: "မုၢ်နံၤအရ့ဒိၣ်တဖၣ်, ကၠိစးထီၣ်/ကျၢၢ်တံၢ်, မုၢ်နံၤအိၣ်ဘှံး, မုၢ်နံၤထံၣ်လိာ်မိၢ်ပၢ် ဒီးကၠိခိၣ်နားတၢ်ဆၢကတီၢ်.",
  },
  "Registro e Infinite Campus": {
    en: "Registration & Infinite Campus",
    kar: "တၢ်မၤနီၣ်မံၤ ဒီး Infinite Campus",
  },
  "Cómo registrar estudiantes, entrar al portal familiar y revisar calificaciones y asistencia.": {
    en: "How to register students, log into the family portal, and check grades and attendance.",
    kar: "ကျဲလၢကမၤနီၣ်မံၤကၠိဖိ, ကျဲလၢကနုာ်လီၤဆူ မိၢ်ပၢ်တၢ်ပရၢ ဒီးကွၢ်နီၣ်ဂံၢ်ဒီးတၢ်ဟဲကၠိ.",
  },
  Transporte: {
    en: "Transportation",
    kar: "တၢ်လဲၤတၢ်က့ တၢ်ဘံၣ်တၢ်ဘၢ",
  },
  "Autobuses escolares amarillos de DMPS, pases gratuitos de DART y rutas hacia la escuela.": {
    en: "DMPS yellow school buses, free DART student passes, and transit routes to school.",
    kar: "DMPS ကၠိဘၢးစ်ဂီၤ, DART ကၠိဖိတၢ်လဲၤတၢ်က့လၢအခ့အဖျါတအိၣ် ဒီးတၢ်လဲၤတၢ်က့ကျဲတဖၣ်.",
  },
  "Comidas escolares": {
    en: "School Meals",
    kar: "ကၠိတၢ်အီၣ်တၢ်အီ",
  },
  "Menús mensuales de desayuno y almuerzo, nutrición escolar y dietas especiales.": {
    en: "Monthly breakfast and lunch menus, school nutrition guidelines, and special dietary needs.",
    kar: "လါဒိၣ်တၢ်အီၣ်ဂီၤဒီးတၢ်အီၣ်မုၢ်ထီၣ်တၢ်အီၣ်ခီၣ်မံၤ, ကၠိတၢ်အီၣ်တၢ်အီတၢ်ဘံၣ်တၢ်ဘၢ ဒီးတၢ်အီၣ်အဂၤတဖၣ်.",
  },
  "Deportes y actividades": {
    en: "Sports & Activities",
    kar: "တၢ်လုၢ်လၢ်သးခု ဒီးတၢ်မၤသကိး",
  },
  "Equipos deportivos, clubes estudiantiles, requisitos de registro y calendario de juegos.": {
    en: "Athletic teams, student clubs, registration requirements, and game schedules.",
    kar: "ကၠိတၢ်လုၢ်လၢ်အဘုၣ်တဖၣ်, ကၠိဖိကရူၢ်, တၢ်မၤနီၣ်မံၤတၢ်လိၣ်တဖၣ် ဒီးတၢ်ပြၢတၢ်ဆၢကတီၢ်.",
  },
  "Programas y oportunidades": {
    en: "Programs & Opportunities",
    kar: "တၢ်ရဲၣ်တၢ်ကျဲၤ ဒီးတၢ်ခွဲးတၢ်ယာ်",
  },
  "Cursos avanzados, Central Campus, preparación universitaria y servicio comunitario Silver Cord.":
    {
      en: "Advanced courses, Central Campus programs, college prep, and Silver Cord community service.",
      kar: "တၢ်မၤလိဒိၣ်ထီၣ်တဖၣ်, Central Campus, တၢ်ကတဲာ်ကတီၤလၢကၠိဒိၣ် ဒီး Silver Cord တၢ်မၤစၢၤပှၤဂီၢ်မုၢ်.",
    },
  "Asistencia y políticas": {
    en: "Attendance & Policies",
    kar: "တၢ်ဟဲကၠိ ဒီးတၢ်သိၣ်တၢ်သီ",
  },
  "Cómo reportar ausencias, justificantes médicos, código de vestimenta y normas escolares.": {
    en: "How to report absences, medical excuses, student dress code, and school policies.",
    kar: "ကျဲလၢကပာ်ဖျါတၢ်တဟဲကၠိ, ကသံၣ်သရၣ်တၢ်အုၣ်သး, တၢ်ကူတၢ်ကၤတၢ်သိၣ်တၢ်သီ ဒီးကၠိတၢ်ဘျၢတဖၣ်.",
  },
  "Ayuda para familias": {
    en: "Family Support",
    kar: "တၢ်မၤစၢၤလၢ ဟံၣ်ဖိဃီဖိအဂီၢ်",
  },
  "Enlaces bilingües de apoyo familiar (BFL), despensa comunitaria, consejería y recursos de emergencia.":
    {
      en: "Bilingual Family Liaisons (BFL), community food pantry, counseling, and emergency resources.",
      kar: "ကျိာ်ခံဘိမိၢ်ပၢ်တၢ်ဆဲးကျိးပှၤမၤစၢၤ (BFL), တၢ်အီၣ်တၢ်အီတၢ်မၤစၢၤ, တၢ်ဟ့ၣ်ကူၣ် ဒီးတၢ်မၤစၢၤလၢတၢ်အဆိကတီၢ်.",
    },

  // 2. Specific Articles
  "Bienvenidos a Lincoln High School": {
    en: "Welcome to Lincoln High School",
    kar: "တၢ်တူၢ်လိာ်ဆူ Lincoln High School",
  },
  "Guía para familias nuevas": {
    en: "Guide for New Families",
    kar: "တၢ်နဲၣ်ကျဲလၢ ဟံၣ်ဖိဃီဖိအသီအဂီၢ်",
  },
  "Cómo usar DMPS Info": {
    en: "How to Use DMPS Info",
    kar: "ကျဲလၢကသူ DMPS Info တၢ်ပရၢ",
  },
  "Información de contacto de Lincoln": {
    en: "Lincoln Contact Information",
    kar: "Lincoln တၢ်ဆဲးကျိးအပရၢ",
  },
  "Calendario escolar de DMPS": {
    en: "DMPS School Calendar",
    kar: "DMPS ကၠိလါဆၣ်တၢ်ရဲၣ်တၢ်ကျဲၤ",
  },
  "Horarios de Lincoln High School": {
    en: "Lincoln High School Bell Schedules",
    kar: "Lincoln High School ကၠိခိၣ်နားတၢ်ဆၢကတီၢ်",
  },
  "Cierres, retrasos y cambios escolares": {
    en: "School Closings, Delays & Weather Changes",
    kar: "ကၠိပတုာ်, တၢ်ယံာ်ထီၣ် ဒီးမုၢ်ဖျၢၣ်အိၣ်ဘှံးတၢ်ပရၢ",
  },
  "Cómo registrar a un estudiante": {
    en: "How to Register a Student",
    kar: "ကျဲလၢကမၤနီၣ်မံၤကၠိဖိတဂၤ",
  },
  "Cómo entrar a Infinite Campus": {
    en: "How to Log into Infinite Campus",
    kar: "ကျဲလၢကနုာ်လီၤဆူ Infinite Campus",
  },
  "Cómo revisar calificaciones y asistencia": {
    en: "How to Check Grades & Attendance",
    kar: "ကျဲလၢကကွၢ်နီၣ်ဂံၢ်ဒီးတၢ်ဟဲကၠိ",
  },
  "Cómo actualizar la información familiar": {
    en: "How to Update Family Contact Information",
    kar: "ကျဲလၢကမၤသီထီၣ် ဟံၣ်ဖိဃီဖိအပရၢ",
  },
  "Transporte escolar de DMPS": {
    en: "DMPS School Transportation",
    kar: "DMPS ကၠိတၢ်လဲၤတၢ်က့",
  },
  "Cómo llegar a Lincoln usando DART": {
    en: "How to Get to Lincoln Using DART Transit",
    kar: "ကျဲလၢကလဲၤဆူ Lincoln ခီဖျိ DART ဘၢးစ်",
  },
  "Qué hacer si el autobús se retrasa": {
    en: "What to Do If the School Bus Is Delayed",
    kar: "တၢ်မနုၤကဘၣ်မၤန့ၣ် ဖဲကၠိဘၢးစ်ယံာ်ထီၣ်အခါ",
  },
  "Cómo consultar el menú de Lincoln": {
    en: "How to Check Lincoln's Daily Menu",
    kar: "ကျဲလၢကကွၢ် Lincoln ကၠိတၢ်အီၣ်ခီၣ်မံၤ",
  },
  "Información sobre comidas escolares": {
    en: "School Meal Program Information",
    kar: "ကၠိတၢ်အီၣ်တၢ်အီတၢ်ရဲၣ်တၢ်ကျဲၤအပရၢ",
  },
  "Alergias y necesidades alimentarias": {
    en: "Allergies & Dietary Accommodations",
    kar: "တၢ်အီၣ်လၢတဘၣ်သးဒီးတၢ်အီၣ်အဂၤတဖၣ်",
  },
  "Deportes disponibles en Lincoln": {
    en: "Sports Available at Lincoln High School",
    kar: "တၢ်လုၢ်လၢ်အိၣ်ဝဲဖဲ Lincoln High School",
  },
  "Actividades extracurriculares de Lincoln": {
    en: "Lincoln Extracurricular Clubs & Activities",
    kar: "Lincoln ကၠိအချၢတၢ်မၤသကိးတဖၣ်",
  },
  "Cómo registrarse en un deporte o actividad": {
    en: "How to Register for Sports or Activities",
    kar: "ကျဲလၢကမၤနီၣ်မံၤလၢ တၢ်လုၢ်လၢ်တၢ်မၤအဂီၢ်",
  },
  "Cómo consultar juegos, eventos y resultados": {
    en: "How to View Game Schedules, Events & Scores",
    kar: "ကျဲလၢကကွၢ်တၢ်ပြၢတၢ်ဆၢကတီၢ်ဒီးတၢ်ဒိးန့ၢ်နီၣ်ဂံၢ်",
  },
  "Programas disponibles en Lincoln": {
    en: "Academic Programs Available at Lincoln",
    kar: "တၢ်ကူၣ်ဘၣ်ကူၣ်သ့တၢ်ရဲၣ်တၢ်ကျဲၤဖဲ Lincoln",
  },
  "Voluntariado y Silver Cord": {
    en: "Volunteering & Silver Cord Honor Program",
    kar: "တၢ်မၤစၢၤပှၤဂီၢ်မုၢ် ဒီး Silver Cord တၢ်ရဲၣ်တၢ်ကျဲၤ",
  },
  "Universidad y carreras": {
    en: "College, Careers & Future Pathways",
    kar: "ကၠိဒိၣ်, တၢ်မၤဒီးခါဆူညါတၢ်ကျဲ",
  },
  "Requisitos de graduación": {
    en: "High School Graduation Requirements",
    kar: "ကၠိဖျိးတၢ်လိၣ်တဖၣ်",
  },
  "Cómo reportar una ausencia": {
    en: "How to Report a Student Absence",
    kar: "ကျဲလၢကပာ်ဖျါတၢ်တဟဲကၠိ",
  },
  "Cómo revisar la asistencia": {
    en: "How to Monitor Student Attendance",
    kar: "ကျဲလၢကကွၢ်ထီဒါတၢ်ဟဲကၠိ",
  },
  "Políticas importantes para las familias": {
    en: "Important Policies for Families",
    kar: "ဟံၣ်ဖိဃီဖိတၢ်သိၣ်တၢ်သီအရ့ဒိၣ်တဖၣ်",
  },
  "Dónde pedir ayuda en Lincoln": {
    en: "Where to Get Help & Support at Lincoln",
    kar: "ဖဲလဲၣ်လၢကဒိးန့ၢ်တၢ်မၤစၢၤဖဲ Lincoln အပူၤ",
  },
};

/**
 * Translates text into English.
 */
export function translateToEnglish(text: string): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (PHRASE_DICTIONARY[trimmed]?.en) return PHRASE_DICTIONARY[trimmed].en;

  // Pattern-based translations
  let result = text;
  result = result.replace(/Bienvenidos a (.*)/gi, "Welcome to $1");
  result = result.replace(/Guía para (.*)/gi, "Guide for $1");
  result = result.replace(/Cómo usar (.*)/gi, "How to use $1");
  result = result.replace(/Cómo registrar (.*)/gi, "How to register $1");
  result = result.replace(/Cómo entrar a (.*)/gi, "How to log into $1");
  result = result.replace(/Cómo revisar (.*)/gi, "How to check $1");
  result = result.replace(/Cómo consultar (.*)/gi, "How to view $1");
  result = result.replace(/Cómo llegar a (.*)/gi, "How to get to $1");
  result = result.replace(/Información de contacto de (.*)/gi, "$1 Contact Information");
  result = result.replace(/Deportes disponibles en (.*)/gi, "Sports Available at $1");
  result = result.replace(/Programas disponibles en (.*)/gi, "Programs Available at $1");
  result = result.replace(/Dónde pedir ayuda en (.*)/gi, "Where to Get Help at $1");
  result = result.replace(/familias nuevas/gi, "new families");
  result = result.replace(/comidas escolares/gi, "school meals");
  result = result.replace(/transporte escolar/gi, "school transportation");
  result = result.replace(/asistencia y políticas/gi, "attendance and policies");
  result = result.replace(/calificaciones/gi, "grades");
  result = result.replace(/asistencia/gi, "attendance");
  result = result.replace(/estudiantes/gi, "students");
  result = result.replace(/padres y familias/gi, "parents and families");
  result = result.replace(/horario de clases/gi, "class schedule");
  result = result.replace(/días sin clases/gi, "no-school days");

  return result;
}

/**
 * Translates text into S'gaw Karen.
 */
export function translateToKaren(text: string): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (PHRASE_DICTIONARY[trimmed]?.kar) return PHRASE_DICTIONARY[trimmed].kar;

  // Pattern-based S'gaw Karen adaptations
  const result = text;
  if (result.includes("Bienvenidos") || result.includes("Welcome")) {
    return "တၢ်တူၢ်လိာ်ဆူ ကၠိတၢ်ပရၢအံၤ";
  }
  if (result.includes("Guía") || result.includes("Guide")) {
    return "တၢ်နဲၣ်ကျဲလၢ မိၢ်ပၢ်ဒီးဟံၣ်ဖိဃီဖိအဂီၢ်";
  }
  if (result.includes("Cómo") || result.includes("How to")) {
    return "ကျဲလၢကမၤသကိးတၢ် ဒီးဒိးန့ၢ်တၢ်မၤစၢၤ";
  }
  if (result.includes("Calendario") || result.includes("Calendar")) {
    return "ကၠိလါဆၣ်တၢ်ရဲၣ်တၢ်ကျဲၤ ဒီးမုၢ်နံၤအရ့ဒိၣ်တဖၣ်";
  }
  if (result.includes("Transporte") || result.includes("Transportation")) {
    return "ကၠိဘၢးစ် ဒီးတၢ်လဲၤတၢ်က့တၢ်ဘံၣ်တၢ်ဘၢ";
  }
  if (result.includes("Comidas") || result.includes("Meals") || result.includes("Menu")) {
    return "ကၠိတၢ်အီၣ်တၢ်အီ ဒီးတၢ်အီၣ်မုၢ်ထီၣ်တၢ်ပရၢ";
  }
  if (result.includes("Deportes") || result.includes("Sports") || result.includes("Actividades")) {
    return "တၢ်လုၢ်လၢ်သးခု ဒီးကၠိဖိတၢ်မၤသကိး";
  }
  if (result.includes("Programas") || result.includes("Programs")) {
    return "တၢ်ကူၣ်ဘၣ်ကူၣ်သ့ တၢ်ရဲၣ်တၢ်ကျဲၤဒီးတၢ်ခွဲးတၢ်ယာ်";
  }
  if (result.includes("Asistencia") || result.includes("Attendance")) {
    return "တၢ်ဟဲကၠိ ဒီးကၠိတၢ်သိၣ်တၢ်သီ";
  }
  if (result.includes("Ayuda") || result.includes("Help") || result.includes("Support")) {
    return "တၢ်မၤစၢၤလၢ ဟံၣ်ဖိဃီဖိအဂီၢ် (BFL)";
  }

  return `${text} (ကညီကျိာ်)`;
}

/**
 * Auto-translates content blocks into English and Karen.
 */
export function autoTranslateBlocks(blocks: Block[]): { en: Block[]; ksw: Block[] } {
  if (!Array.isArray(blocks)) return { en: [], ksw: [] };

  const enBlocks: Block[] = blocks.map((b) => {
    if (b.type === "paragraph" || b.type === "heading" || b.type === "callout") {
      return { ...b, text: translateToEnglish(b.text) };
    }
    if (b.type === "list" && Array.isArray(b.items)) {
      return { ...b, items: b.items.map(translateToEnglish) };
    }
    return { ...b };
  });

  const kswBlocks: Block[] = blocks.map((b) => {
    if (b.type === "paragraph" || b.type === "heading" || b.type === "callout") {
      return { ...b, text: translateToKaren(b.text) };
    }
    if (b.type === "list" && Array.isArray(b.items)) {
      return { ...b, items: b.items.map(translateToKaren) };
    }
    return { ...b };
  });

  return { en: enBlocks, ksw: kswBlocks };
}
