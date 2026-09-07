import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Save,
  Search,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  School,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchFaqs, type FaqRow } from "@/lib/content";
import { useSchool } from "@/lib/school";
import { readCache, writeCache, notifyContentUpdated } from "@/lib/sync";
import { saveToUnifiedStorage } from "@/lib/storage-engine";

export const Route = createFileRoute("/admin/faq")({
  head: () => ({
    meta: [
      { title: "Gestión de Preguntas Frecuentes — Administración DMPS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminFaqPage,
});

export const INITIAL_SEED_FAQS: FaqRow[] = [
  {
    id: "faq-hours",
    display_order: 1,
    category_id: null,
    faq_translations: [
      {
        language_code: "es",
        question: "¿A qué hora inician y terminan las clases?",
        answer:
          "El horario habitual de clases en Lincoln High School y East High School es de 8:25 AM a 3:25 PM de lunes a viernes. Los días miércoles hay salida temprana a las 2:10 PM para capacitación del personal.",
      },
      {
        language_code: "en",
        question: "What time does school start and dismiss?",
        answer:
          "Regular school hours at Lincoln High and East High are from 8:25 AM to 3:25 PM Monday through Friday. Every Wednesday features an early dismissal at 2:10 PM for staff development.",
      },
    ],
  },
  {
    id: "faq-bus-fare",
    display_order: 2,
    category_id: null,
    faq_translations: [
      {
        language_code: "es",
        question: "¿Los estudiantes pagan por viajar en los autobuses de DART?",
        answer:
          "No. Todos los estudiantes matriculados en las escuelas secundarias de DMPS viajan GRATIS en los autobuses públicos de DART durante todo el año presentando su credencial de estudiante o pase digital.",
      },
      {
        language_code: "en",
        question: "Do students pay to ride DART transit buses?",
        answer:
          "No. All DMPS high school students ride DART transit buses completely FREE all year round by showing their valid student ID or school pass.",
      },
    ],
  },
  {
    id: "faq-attendance",
    display_order: 3,
    category_id: null,
    faq_translations: [
      {
        language_code: "es",
        question: "¿Cómo reporto una ausencia o inasistencia de mi estudiante?",
        answer:
          "Debe llamar a la línea de asistencia de la escuela antes de las 9:00 AM (Lincoln: 515-242-7500 / East: 515-242-7788) o enviar un mensaje a través del Portal para Padres Infinite Campus.",
      },
      {
        language_code: "en",
        question: "How do I report a student absence?",
        answer:
          "Call the school attendance office before 9:00 AM (Lincoln: 515-242-7500 / East: 515-242-7788) or report via the Infinite Campus Parent Portal.",
      },
    ],
  },
  {
    id: "faq-bfl",
    display_order: 4,
    category_id: null,
    faq_translations: [
      {
        language_code: "es",
        question: "¿Cómo puedo contactar a un Enlace Familiar Bilingüe (BFL)?",
        answer:
          "Cada escuela cuenta con enlaces familiares bilingües dedicados a ayudarle en español. Puede encontrarlos en la sección de Directorio y Contacto del portal o comunicarse directamente a la oficina de consejería.",
      },
      {
        language_code: "en",
        question: "How can I contact a Bilingual Family Liaison (BFL)?",
        answer:
          "Each school has dedicated bilingual liaisons available to assist families. You can find their phone numbers and emails in the Contact directory on this portal.",
      },
    ],
  },
  {
    id: "faq-grades",
    display_order: 5,
    category_id: null,
    faq_translations: [
      {
        language_code: "es",
        question: "¿Dónde consulto las calificaciones y progreso académico?",
        answer:
          "Las calificaciones, asistencia en tiempo real y asignaciones se consultan en Infinite Campus. Si necesita ayuda para activar su cuenta de padre, consulte la guía en este portal o llame a la escuela.",
      },
      {
        language_code: "en",
        question: "Where can I check grades and academic progress?",
        answer:
          "Real-time grades, attendance, and assignments are monitored through Infinite Campus. For login support, consult the guide on this site or call the front office.",
      },
    ],
  },
  {
    id: "faq-sports",
    display_order: 6,
    category_id: null,
    faq_translations: [
      {
        language_code: "es",
        question: "¿Qué se necesita para participar en deportes o atletismo?",
        answer:
          "Se requiere un examen físico deportivo vigente firmado por un médico, registro en la plataforma Bound (Lincoln / East) y mantener elegibilidad académica con promedio aprobatorio.",
      },
      {
        language_code: "en",
        question: "What is required to participate in sports and athletics?",
        answer:
          "Students need an up-to-date physical exam from a physician, online registration in Bound, and must meet academic eligibility requirements.",
      },
    ],
  },
];

export default function AdminFaqPage() {
  const queryClient = useQueryClient();
  const { adminSchoolFilter } = useSchool();
  const [schoolFilter, setSchoolFilter] = useState<string>(adminSchoolFilter || "all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState("");
  const [order, setOrder] = useState(1);
  const [questionEs, setQuestionEs] = useState("");
  const [answerEs, setAnswerEs] = useState("");
  const [questionEn, setQuestionEn] = useState("");
  const [answerEn, setAnswerEn] = useState("");
  const [faqSchoolId, setFaqSchoolId] = useState("all");

  const [faqs, setFaqs] = useState<FaqRow[]>([]);

  const saveFaqsState = useCallback(
    (list: FaqRow[]) => {
      const rawFaqs = list.map((item) => ({
        id: item.id,
        display_order: item.display_order,
        category_id: item.category_id,
        school_id: item.school_id || "all",
        status: "published",
      }));

      const rawTranslations: Record<string, unknown>[] = [];
      list.forEach((item) => {
        item.faq_translations.forEach((tr) => {
          rawTranslations.push({
            id: `${item.id}-${tr.language_code}`,
            faq_id: item.id,
            language_code: tr.language_code,
            question: tr.question,
            answer: tr.answer,
          });
        });
      });

      writeCache("faqs", rawFaqs);
      writeCache("faq_translations", rawTranslations);
      void saveToUnifiedStorage("faqs", rawFaqs);
      void saveToUnifiedStorage("faq_translations", rawTranslations);
      notifyContentUpdated("faqs");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    [queryClient],
  );

  const loadCurrentFaqs = useCallback(() => {
    const cached = readCache<Record<string, unknown>>("faqs");
    const trs = readCache<Record<string, unknown>>("faq_translations") ?? [];

    if (cached && cached.length > 0) {
      const merged = cached.map((f) => ({
        id: String(f.id),
        display_order: Number(f.display_order || 1),
        category_id: (f.category_id as string) || null,
        school_id: (f.school_id as string) || "all",
        status: (f.status as string) || "published",
        faq_translations:
          (Array.isArray(f.faq_translations)
            ? (f.faq_translations as FaqRow["faq_translations"])
            : null) ||
          trs
            .filter((t) => t.faq_id === f.id)
            .map((t) => ({
              language_code: String(t.language_code || "es"),
              question: String(t.question || ""),
              answer: String(t.answer || ""),
            })),
      })) as FaqRow[];
      setFaqs(merged);
    } else {
      setFaqs(INITIAL_SEED_FAQS);
      saveFaqsState(INITIAL_SEED_FAQS);
    }
  }, [saveFaqsState]);

  useEffect(() => {
    loadCurrentFaqs();
  }, [loadCurrentFaqs]);

  const filteredFaqs = faqs.filter((f) => {
    const school = f.school_id || "all";
    if (schoolFilter !== "all" && school !== "all" && school !== schoolFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const qEs = f.faq_translations.find((t) => t.language_code === "es")?.question || "";
      const aEs = f.faq_translations.find((t) => t.language_code === "es")?.answer || "";
      const qEn = f.faq_translations.find((t) => t.language_code === "en")?.question || "";
      const aEn = f.faq_translations.find((t) => t.language_code === "en")?.answer || "";
      if (
        !qEs.toLowerCase().includes(q) &&
        !aEs.toLowerCase().includes(q) &&
        !qEn.toLowerCase().includes(q) &&
        !aEn.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleOpenNew = () => {
    setEditingId(`faq-${Date.now()}`);
    setOrder(faqs.length + 1);
    setQuestionEs("");
    setAnswerEs("");
    setQuestionEn("");
    setAnswerEn("");
    setFaqSchoolId(schoolFilter !== "all" ? schoolFilter : "all");
    setIsNew(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (f: FaqRow) => {
    setEditingId(f.id);
    setOrder(f.display_order);
    const es = f.faq_translations.find((t) => t.language_code === "es");
    const en = f.faq_translations.find((t) => t.language_code === "en");
    setQuestionEs(es?.question || "");
    setAnswerEs(es?.answer || "");
    setQuestionEn(en?.question || "");
    setAnswerEn(en?.answer || "");
    setFaqSchoolId(f.school_id || "all");
    setIsNew(false);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, question: string) => {
    if (!window.confirm(`¿Deseas eliminar la pregunta frecuente: "${question}"?`)) return;
    const updated = faqs.filter((f) => f.id !== id);
    setFaqs(updated);
    saveFaqsState(updated);
    toast.success("Pregunta eliminada correctamente.");
  };

  const handleResetDefaults = () => {
    if (!window.confirm("¿Restaurar preguntas frecuentes predeterminadas oficiales?")) return;
    setFaqs(INITIAL_SEED_FAQS);
    saveFaqsState(INITIAL_SEED_FAQS);
    toast.success("Preguntas frecuentes restauradas con éxito.");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionEs.trim() || !answerEs.trim()) {
      toast.error("Por favor ingresa la pregunta y respuesta en español.");
      return;
    }

    const updatedRow: FaqRow = {
      id: editingId,
      display_order: order,
      category_id: null,
      school_id: faqSchoolId,
      faq_translations: [
        {
          language_code: "es",
          question: questionEs.trim(),
          answer: answerEs.trim(),
        },
        {
          language_code: "en",
          question: questionEn.trim() || questionEs.trim(),
          answer: answerEn.trim() || answerEs.trim(),
        },
      ],
    };

    let updated: FaqRow[];
    if (isNew) {
      updated = [...faqs, updatedRow];
    } else {
      updated = faqs.map((f) => (f.id === editingId ? updatedRow : f));
    }

    // Sort by display_order
    updated.sort((a, b) => a.display_order - b.display_order);

    setFaqs(updated);
    saveFaqsState(updated);
    setIsDialogOpen(false);
    toast.success(
      isNew ? "¡Pregunta frecuente creada con éxito!" : "¡Pregunta actualizada con éxito!",
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HelpCircle className="size-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Preguntas Frecuentes (FAQ)
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona las respuestas oficiales a dudas habituales sobre horarios, transporte,
            asistencia y servicios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
            <Link to="/faq" target="_blank" rel="noopener noreferrer">
              <span>Ver Página Pública</span>
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>

          <Button
            onClick={handleResetDefaults}
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-xl text-muted-foreground hover:text-foreground"
            title="Restaurar preguntas oficiales"
          >
            <RotateCcw className="size-3.5" />
            <span className="text-xs">Restaurar</span>
          </Button>

          <Button onClick={handleOpenNew} size="sm" className="gap-2 rounded-xl font-bold">
            <Plus className="size-4" />
            <span>Nueva Pregunta</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en preguntas y respuestas..."
              className="pl-9 rounded-xl text-sm"
            />
          </div>

          <Select value={schoolFilter} onValueChange={setSchoolFilter}>
            <SelectTrigger className="w-full sm:w-[200px] rounded-xl text-xs font-semibold">
              <SelectValue placeholder="Escuela" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todas las escuelas</SelectItem>
              <SelectItem value="lincoln">Lincoln High</SelectItem>
              <SelectItem value="east">East High</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* FAQs List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, index) => {
          const es = faq.faq_translations.find((t) => t.language_code === "es");
          const en = faq.faq_translations.find((t) => t.language_code === "en");
          const school = faq.school_id || "all";

          return (
            <Card
              key={faq.id}
              className="rounded-2xl border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                      #{faq.display_order || index + 1}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase rounded-md">
                      {school === "all"
                        ? "Distrito / Todas"
                        : school === "east"
                          ? "East High"
                          : "Lincoln High"}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {es?.question || "Sin pregunta"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {es?.answer || "Sin respuesta"}
                  </p>

                  {en?.question && (
                    <div className="mt-2 rounded-xl bg-muted/30 p-2.5 text-xs text-muted-foreground border border-border/50">
                      <span className="font-bold text-foreground">EN: </span>
                      <span className="font-semibold text-foreground/90">{en.question}</span> —{" "}
                      {en.answer}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(faq)}
                    className="rounded-xl h-8 text-xs font-semibold gap-1.5 w-full sm:w-auto"
                  >
                    <Edit2 className="size-3.5" />
                    <span>Editar</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(faq.id, es?.question || "")}
                    className="rounded-xl h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold w-full sm:w-auto"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isNew ? "Nueva Pregunta Frecuente" : "Editar Pregunta Frecuente"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define la pregunta y respuesta clara para las familias.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Orden de Aparición</Label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                  min={1}
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Escuela Dirigida</Label>
                <Select value={faqSchoolId} onValueChange={setFaqSchoolId}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todas las escuelas (Distrito)</SelectItem>
                    <SelectItem value="lincoln">Lincoln High School</SelectItem>
                    <SelectItem value="east">East High School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Spanish */}
            <div className="space-y-3 rounded-2xl bg-muted/40 p-3.5 border border-border">
              <span className="text-xs font-black uppercase tracking-wider text-primary">
                Contenido en Español (Principal)
              </span>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Pregunta *</Label>
                <Input
                  value={questionEs}
                  onChange={(e) => setQuestionEs(e.target.value)}
                  placeholder="Ej. ¿A qué hora inician las clases?"
                  required
                  className="rounded-xl text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Respuesta Completa *</Label>
                <Textarea
                  value={answerEs}
                  onChange={(e) => setAnswerEs(e.target.value)}
                  rows={4}
                  placeholder="Redacta la respuesta clara con detalles, teléfonos y enlaces..."
                  required
                  className="rounded-xl text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* English */}
            <div className="space-y-3 rounded-2xl bg-muted/40 p-3.5 border border-border">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Contenido en Inglés (English)
              </span>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Question</Label>
                <Input
                  value={questionEn}
                  onChange={(e) => setQuestionEn(e.target.value)}
                  placeholder="E.g. What time does school start?"
                  className="rounded-xl text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Answer</Label>
                <Textarea
                  value={answerEn}
                  onChange={(e) => setAnswerEn(e.target.value)}
                  rows={3}
                  placeholder="English answer explanation..."
                  className="rounded-xl text-sm leading-relaxed"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl font-bold gap-2">
                <Save className="size-4" />
                <span>Guardar y Publicar</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
