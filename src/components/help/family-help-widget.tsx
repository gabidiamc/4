/**
 * "Ayuda para familias" — a free, keyword-based help assistant.
 *
 * It only shows staff-approved answers, indexed public site content and
 * verified BFL contacts. There is no AI, no external API, no tokens and no
 * generated text anywhere in this component.
 */
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Compass,
  Copy,
  ExternalLink,
  Mail,
  MessageCircleQuestion,
  Minus,
  Phone,
  School,
  Search,
  Share2,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { CategoryIcon } from "@/components/category-icon";
import { PublicReviewInvite } from "@/components/help/public-review-invite";
import { openAppTutorial } from "@/components/onboarding-tutorial";
const OPEN_HELP_RATING_EVENT = "help:open-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { readPublicReviewState } from "@/lib/help/public-review";

import {
  fetchHelpAnswers,
  fetchHelpBflContacts,
  fetchHelpCategories,
  fetchHelpSchools,
  fetchHelpSettings,
  fetchHelpSynonyms,
  recordUnansweredSearch,
  saveHelpFeedback,
  type HelpBflRow,
  type HelpCategoryRow,
  type HelpSchoolChoice,
} from "@/lib/help/data";
import {
  answerToDoc,
  buildSynonymIndex,
  searchHelpDocs,
  type HelpDoc,
  type HelpMatch,
} from "@/lib/help/search";
import { normalizeText } from "@/lib/help/text";
import { fetchFaqs, fetchPublishedArticles, localizedArticle, localizedFaq } from "@/lib/content";
import { useI18n } from "@/lib/i18n";

type Step = "school" | "categories" | "questions" | "answer" | "results" | "contact" | "closing";

const SESSION_KEY = "dmps_help_session";

const SCHOOL_LABEL_KEYS: Record<HelpSchoolChoice, string> = {
  lincoln: "Abraham Lincoln High School",
  east: "Des Moines East High School",
  district: "help.school.district",
  unsure: "help.school.unsure",
};

function schoolLabel(t: (key: string) => string, id: HelpSchoolChoice): string {
  if (id === "lincoln" || id === "east") return SCHOOL_LABEL_KEYS[id];
  return t(SCHOOL_LABEL_KEYS[id]);
}

function speak(text: string, t: (key: string) => string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) {
      toast.error(t("help.widget.noSpeech"));
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    synth.speak(utterance);
  } catch {
    toast.error(t("help.widget.speechFailed"));
  }
}

async function copyText(text: string, t: (key: string) => string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(t("help.widget.infoCopied"));
  } catch {
    toast.error(t("help.widget.copyFailed"));
  }
}

export function FamilyHelpWidget() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [choice, setChoice] = useState<HelpSchoolChoice | null>(null);
  const [confirmSchoolChange, setConfirmSchoolChange] = useState(false);
  const [step, setStep] = useState<Step>("school");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<HelpDoc | null>(null);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<HelpMatch[] | null>(null);
  const [resultStrength, setResultStrength] = useState<"strong" | "multiple" | "weak" | "none">(
    "none",
  );
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [foundInfo, setFoundInfo] = useState<"yes" | "partial" | "no" | null>(null);
  const [closingSaved, setClosingSaved] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  /* ---------- session-only progress ---------- */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { choice?: HelpSchoolChoice; categoryId?: string | null };
      if (parsed.choice) {
        setChoice(parsed.choice);
        setStep("categories");
        setCategoryId(parsed.categoryId ?? null);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (choice) sessionStorage.setItem(SESSION_KEY, JSON.stringify({ choice, categoryId }));
    } catch {
      // ignore
    }
  }, [choice, categoryId]);

  const scopeChoice: HelpSchoolChoice = choice === "unsure" ? "district" : (choice ?? "district");
  const contentSchoolId =
    scopeChoice === "lincoln" ? "lincoln" : scopeChoice === "east" ? "east" : undefined;

  const schools = useQuery({ queryKey: ["help_schools"], queryFn: fetchHelpSchools });
  const categories = useQuery({
    queryKey: ["help_categories", scopeChoice],
    queryFn: () => fetchHelpCategories(scopeChoice),
    enabled: open && choice !== null,
  });
  const answers = useQuery({
    queryKey: ["help_answers", scopeChoice],
    queryFn: () => fetchHelpAnswers(scopeChoice),
    enabled: open && choice !== null,
  });
  const synonyms = useQuery({
    queryKey: ["help_synonyms"],
    queryFn: fetchHelpSynonyms,
    enabled: open,
  });
  const bfl = useQuery({
    queryKey: ["help_bfl", scopeChoice],
    queryFn: () => fetchHelpBflContacts(scopeChoice),
    enabled: open && choice !== null,
  });
  const settings = useQuery({
    queryKey: ["help_settings"],
    queryFn: fetchHelpSettings,
    enabled: open,
  });
  const siteFaqs = useQuery({
    queryKey: ["help_site_faqs", contentSchoolId ?? "district"],
    queryFn: () => fetchFaqs(contentSchoolId),
    enabled: open && choice !== null,
  });
  const siteArticles = useQuery({
    queryKey: ["help_site_articles", contentSchoolId ?? "district"],
    queryFn: () => fetchPublishedArticles(undefined, contentSchoolId),
    enabled: open && choice !== null,
  });

  const synonymIndex = useMemo(() => buildSynonymIndex(synonyms.data ?? []), [synonyms.data]);

  /** Approved answers plus indexed public site content (FAQ and articles). */
  const docs = useMemo<HelpDoc[]>(() => {
    const list: HelpDoc[] = (answers.data ?? []).map(answerToDoc);
    for (const faq of siteFaqs.data ?? []) {
      const loc = localizedFaq(faq, lang, contentSchoolId);
      list.push({
        id: `faq-${faq.id}`,
        kind: "faq",
        question: loc.question,
        answer: loc.answer ?? "",
        steps: [],
        keywords: [],
        categoryId: faq.category_id ?? null,
        schoolId: contentSchoolId ?? null,
        internalUrl: "/faq",
        officialUrl: null,
        verifiedAt: null,
      });
    }
    for (const article of siteArticles.data ?? []) {
      const loc = localizedArticle(article, lang, contentSchoolId);
      list.push({
        id: `article-${article.id}`,
        kind: "article",
        question: loc.title,
        answer: loc.summary ?? "",
        steps: [],
        keywords: [],
        categoryId: article.category_id ?? null,
        schoolId: contentSchoolId ?? null,
        internalUrl: `/articles/${article.slug}`,
        officialUrl: null,
        verifiedAt: null,
      });
    }
    return list;
  }, [answers.data, siteFaqs.data, siteArticles.data, lang, contentSchoolId]);

  const activeCategory = (categories.data ?? []).find((c) => c.id === categoryId) ?? null;

  /** Questions listed inside a category: approved answers first, then site content. */
  const categoryQuestions = useMemo<HelpDoc[]>(() => {
    if (!activeCategory) return [];
    const approved = docs.filter((d) => d.kind === "answer" && d.categoryId === activeCategory.id);
    if (approved.length > 0) return approved;
    const terms = (activeCategory.search_terms ?? []).map((t) => normalizeText(t));
    if (terms.length === 0) return [];
    const scored = docs
      .filter((d) => d.kind !== "answer")
      .map((doc) => {
        const haystack = normalizeText(`${doc.question} ${doc.answer}`);
        const hits = terms.filter((term) => haystack.includes(term)).length;
        return { doc, hits };
      })
      .filter((entry) => entry.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 8);
    return scored.map((entry) => entry.doc);
  }, [activeCategory, docs]);

  /* ---------- focus + escape handling ---------- */
  useEffect(() => {
    if (open && !minimized) headingRef.current?.focus();
  }, [open, minimized, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const closePanel = useCallback(() => {
    setOpen(false);
    setMinimized(false);
    triggerRef.current?.focus();
    if (choice && !closingSaved) setStep("closing");
  }, [choice, closingSaved]);

  function restart() {
    setStep(choice ? "categories" : "school");
    setCategoryId(null);
    setActiveDoc(null);
    setQuery("");
    setSubmittedQuery("");
    setResults(null);
    setResultStrength("none");
    setFeedbackDone(false);
  }

  function selectSchool(next: HelpSchoolChoice) {
    setChoice(next);
    setConfirmSchoolChange(false);
    setCategoryId(null);
    setActiveDoc(null);
    setResults(null);
    setStep("categories");
  }

  function openCategory(category: HelpCategoryRow) {
    setCategoryId(category.id);
    setActiveDoc(null);
    setResults(null);
    setStep(category.id === "cat-contacto" ? "contact" : "questions");
  }

  function openAnswer(doc: HelpDoc) {
    setActiveDoc(doc);
    setFeedbackDone(false);
    setStep("answer");
  }

  function runSearch() {
    const text = query.trim();
    if (text.length < 2) return;
    setSubmittedQuery(text);
    const outcome = searchHelpDocs(text, docs, synonymIndex);
    setResultStrength(outcome.strength);
    setResults(outcome.matches);
    if (outcome.strength === "strong" && outcome.matches[0]) {
      openAnswer(outcome.matches[0].doc);
      return;
    }
    if (outcome.strength === "none") {
      void recordUnansweredSearch({
        schoolId: choice === "unsure" ? null : (choice ?? null),
        categoryId,
        language: lang,
        query: text,
      });
      setStep("contact");
      return;
    }
    setStep("results");
  }

  function sendAnswerFeedback(rating: "yes" | "partial" | "no") {
    setFeedbackDone(true);
    void saveHelpFeedback({
      schoolId: choice === "unsure" ? null : (choice ?? null),
      categoryId,
      answerId: activeDoc?.kind === "answer" ? activeDoc.id : null,
      helpfulRating: rating,
    });
    if (rating === "no") setStep("contact");
  }

  function saveClosingRating() {
    setClosingSaved(true);
    void saveHelpFeedback({
      schoolId: choice === "unsure" ? null : (choice ?? null),
      categoryId,
      answerId: null,
      starRating: stars > 0 ? stars : undefined,
      helpfulRating: foundInfo ?? undefined,
      comment,
    });
  }

  /* Footer "Comparte tu experiencia" opens the internal rating step. */
  useEffect(() => {
    function openRating() {
      setOpen(true);
      setMinimized(false);
      setClosingSaved(false);
      setStep("closing");
    }
    window.addEventListener(OPEN_HELP_RATING_EVENT, openRating);
    return () => window.removeEventListener(OPEN_HELP_RATING_EVENT, openRating);
  }, []);

  const review = readPublicReviewState(settings.data);

  const privacyNote =
    settings.data?.["PRIVACY_NOTE"] ??
    "No escribas contraseñas, identificaciones estudiantiles, información médica ni otros datos privados.";

  const officialContactUrl =
    (schools.data ?? []).find((s) => s.id === scopeChoice)?.official_contact_url ?? null;

  /* ---------- render ---------- */
  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("help.widget.openLabel")}
        onClick={() => {
          setOpen(true);
          setMinimized(false);
          if (!choice) setStep("school");
          else if (step === "closing") setStep("categories");
        }}
        className="fixed bottom-4 end-4 z-50 inline-flex min-h-14 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-xl transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <MessageCircleQuestion className="size-6" aria-hidden="true" />
        <span className="hidden sm:inline">{t("help.widget.title")}</span>
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={t("help.widget.title")}
      className="fixed bottom-4 end-2 z-50 flex w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:end-4"
    >
      <div className="flex items-start justify-between gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
        <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className="text-base font-extrabold outline-none">
            {t("help.widget.title")}
          </h2>
          {choice ? (
            <p className="mt-0.5 truncate text-xs opacity-90">
              {t("help.widget.schoolSelected")}: {schoolLabel(t, choice)}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={minimized ? t("help.widget.expand") : t("help.widget.minimize")}
            onClick={() => setMinimized((m) => !m)}
            className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={t("help.widget.close")}
            onClick={closePanel}
            className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {minimized ? null : (
        <div className="max-h-[70dvh] overflow-y-auto px-4 py-4 text-sm">
          {choice ? (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-10 rounded-xl text-xs font-semibold"
                onClick={() => setConfirmSchoolChange(true)}
              >
                <School className="size-4" aria-hidden="true" />
                {t("help.widget.changeSchool")}
              </Button>
              {step !== "categories" ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-10 rounded-xl text-xs font-semibold"
                  onClick={restart}
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  {t("help.widget.startOver")}
                </Button>
              ) : null}
            </div>
          ) : null}

          {confirmSchoolChange ? (
            <div className="mb-3 rounded-xl border border-border bg-secondary/60 p-3">
              <p className="font-semibold">{t("help.widget.confirmSchoolChange")}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  className="min-h-10 rounded-xl text-xs font-bold"
                  onClick={() => {
                    setConfirmSchoolChange(false);
                    setStep("school");
                  }}
                >
                  {t("help.widget.yesChange")}
                </Button>
                <Button
                  variant="outline"
                  className="min-h-10 rounded-xl text-xs"
                  onClick={() => setConfirmSchoolChange(false)}
                >
                  {t("help.widget.noKeep")}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "school" ? (
            <div>
              <p>{t("help.widget.greeting")}</p>
              <p className="mt-3 font-bold">{t("help.widget.whichSchool")}</p>
              <ul className="mt-2 space-y-2">
                {(["lincoln", "east", "district", "unsure"] as HelpSchoolChoice[]).map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => selectSchool(id)}
                      className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-start font-semibold transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <School className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      {schoolLabel(t, id)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {step === "categories" ? (
            <div>
              <p className="font-bold">{t("help.widget.howCanWeHelp")}</p>
              <ul className="mt-2 space-y-2">
                {(categories.data ?? []).map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => openCategory(category)}
                      className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-start font-semibold transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <CategoryIcon name={category.icon} className="size-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        {lang === "en" ? (category.name_en ?? category.name) : category.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    closePanel();
                    openAppTutorial();
                  }}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-start text-xs font-bold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Compass className="size-4 shrink-0 text-primary" />
                  <span>{t("onboarding.reopen")}</span>
                </button>
              </div>
              <SearchBox
                query={query}
                setQuery={setQuery}
                onSubmit={runSearch}
                privacyNote={privacyNote}
              />
            </div>
          ) : null}

          {step === "questions" ? (
            <div>
              <p className="font-bold">
                {activeCategory
                  ? lang === "en"
                    ? (activeCategory.name_en ?? activeCategory.name)
                    : activeCategory.name
                  : t("help.widget.faqDefault")}
              </p>
              {categoryQuestions.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {categoryQuestions.map((doc) => (
                    <li key={doc.id}>
                      <button
                        type="button"
                        onClick={() => openAnswer(doc)}
                        className="min-h-12 w-full rounded-xl border border-border px-3 py-2 text-start font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {doc.question}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 rounded-xl border border-border bg-secondary/50 p-3">
                  <p>{t("help.widget.noApprovedAnswers")}</p>
                  {activeCategory?.internal_url ? (
                    <a
                      href={activeCategory.internal_url}
                      className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-3 font-semibold text-primary-foreground"
                    >
                      {t("help.widget.openSitePage")}
                    </a>
                  ) : null}
                </div>
              )}
              <SearchBox
                query={query}
                setQuery={setQuery}
                onSubmit={runSearch}
                privacyNote={privacyNote}
              />
            </div>
          ) : null}

          {step === "results" && results ? (
            <div>
              <p className="font-bold">
                {resultStrength === "multiple"
                  ? t("help.widget.multipleOptions")
                  : t("help.widget.noExactMatch")}
              </p>
              <ul className="mt-2 space-y-2">
                {results.map((match) => (
                  <li key={match.doc.id}>
                    <button
                      type="button"
                      onClick={() => openAnswer(match.doc)}
                      className="min-h-12 w-full rounded-xl border border-border px-3 py-2 text-start font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {match.doc.question}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-semibold">{t("help.widget.anyMatch")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  className="min-h-11 rounded-xl text-xs font-bold"
                  onClick={() => {
                    void saveHelpFeedback({
                      schoolId: choice === "unsure" ? null : (choice ?? null),
                      categoryId,
                      answerId: null,
                      helpfulRating: "yes",
                    });
                    toast.success(t("help.widget.thanksForReply"));
                  }}
                >
                  {t("article.yes")}
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 rounded-xl text-xs font-semibold"
                  onClick={() => {
                    if (submittedQuery) {
                      void recordUnansweredSearch({
                        schoolId: choice === "unsure" ? null : (choice ?? null),
                        categoryId,
                        language: lang,
                        query: submittedQuery,
                      });
                    }
                    setStep("contact");
                  }}
                >
                  {t("help.widget.needContact")}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "answer" && activeDoc ? (
            <AnswerView
              doc={activeDoc}
              feedbackDone={feedbackDone}
              reviewSlot={
                <PublicReviewInvite
                  review={review}
                  schoolId={choice === "unsure" ? null : (choice ?? null)}
                  surface="help-answer"
                  compact
                />
              }
              onFeedback={sendAnswerFeedback}
              onClose={() => setOpen(false)}
              onBack={() => setStep(results ? "results" : "questions")}
            />
          ) : null}

          {step === "contact" ? (
            <ContactView
              choice={choice}
              contacts={bfl.data ?? []}
              loading={bfl.isLoading}
              officialContactUrl={officialContactUrl}
              showNoAnswerNotice={resultStrength === "none" || results !== null}
              onSearchAgain={restart}
              onChangeSchool={() => setStep("school")}
            />
          ) : null}

          {step === "closing" ? (
            <div>
              <p className="font-bold">{t("help.widget.howWasExperience")}</p>
              <div
                className="mt-2 flex gap-1"
                role="group"
                aria-label={t("help.widget.starRatingLabel")}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} ${t("help.widget.of5Stars")}`}
                    aria-pressed={stars === value}
                    onClick={() => setStars(value)}
                    className="inline-flex size-11 items-center justify-center rounded-xl border border-border hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Star
                      className={`size-5 ${value <= stars ? "fill-primary text-primary" : "text-muted-foreground"}`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
              <p className="mt-3 font-semibold">{t("help.widget.foundInfoQuestion")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["yes", "partial", "no"] as const).map((value) => (
                  <Button
                    key={value}
                    variant={foundInfo === value ? "default" : "outline"}
                    className="min-h-11 rounded-xl text-xs font-semibold"
                    aria-pressed={foundInfo === value}
                    onClick={() => setFoundInfo(value)}
                  >
                    {value === "yes"
                      ? t("article.yes")
                      : value === "partial"
                        ? t("help.widget.partially")
                        : t("article.no")}
                  </Button>
                ))}
              </div>
              <Textarea
                className="mt-3"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("help.widget.commentPlaceholder")}
                aria-label={t("help.widget.commentLabel")}
              />
              {closingSaved ? (
                <div className="mt-3 rounded-xl border border-border bg-secondary/60 p-3">
                  <p className="font-semibold">{t("help.widget.thanksForHelping")}</p>
                  <PublicReviewInvite
                    review={review}
                    schoolId={choice === "unsure" ? null : (choice ?? null)}
                    surface="help-widget"
                    onDismiss={() => setStep("categories")}
                    compact
                  />
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    className="min-h-11 rounded-xl text-xs font-bold"
                    onClick={saveClosingRating}
                  >
                    {t("help.widget.submitRating")}
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-11 rounded-xl text-xs"
                    onClick={() => setStep("categories")}
                  >
                    {t("help.review.notNow")}
                  </Button>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {t("help.widget.noPersonalDataNote")}
              </p>
            </div>
          ) : null}

          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            {t("help.widget.onlyApprovedInfo")}
          </p>
        </div>
      )}
    </div>
  );
}

function SearchBox({
  query,
  setQuery,
  onSubmit,
  privacyNote,
}: {
  query: string;
  setQuery: (value: string) => void;
  onSubmit: () => void;
  privacyNote: string;
}) {
  const { t } = useI18n();
  return (
    <form
      className="mt-4 border-t border-border pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="help-query" className="block font-semibold">
        {t("help.widget.searchPrompt")}
      </label>
      <Input
        id="help-query"
        className="mt-2 min-h-11"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("help.widget.searchExample")}
        autoComplete="off"
      />
      <Button type="submit" className="mt-2 min-h-11 w-full rounded-xl font-bold">
        <Search className="size-4" aria-hidden="true" />
        {t("help.widget.searchAnswer")}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">{privacyNote}</p>
    </form>
  );
}

function AnswerView({
  doc,
  feedbackDone,
  reviewSlot,
  onFeedback,
  onClose,
  onBack,
}: {
  doc: HelpDoc;
  feedbackDone: boolean;
  reviewSlot?: React.ReactNode;
  onFeedback: (rating: "yes" | "partial" | "no") => void;
  onClose: () => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const plain = [doc.question, doc.answer, ...doc.steps].filter(Boolean).join(". ");
  return (
    <div>
      <Button
        variant="ghost"
        className="mb-2 min-h-10 rounded-xl px-2 text-xs font-semibold"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("help.widget.back")}
      </Button>
      <h3 className="text-base font-bold">{doc.question}</h3>
      {doc.answer ? <p className="mt-2 whitespace-pre-line">{doc.answer}</p> : null}
      {doc.steps.length > 0 ? (
        <ol className="mt-2 list-decimal space-y-1 ps-5">
          {doc.steps.map((stepText, index) => (
            <li key={index}>{stepText}</li>
          ))}
        </ol>
      ) : null}

      {doc.verifiedAt ? (
        <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          <BadgeCheck className="size-4" aria-hidden="true" />
          {t("help.widget.verifiedOn")} {new Date(doc.verifiedAt).toLocaleDateString("es-MX")}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {doc.internalUrl ? (
          <a
            href={doc.internalUrl}
            onClick={onClose}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground"
          >
            {t("help.widget.openSitePage")}
          </a>
        ) : null}
        {doc.officialUrl ? (
          <a
            href={doc.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            {t("help.widget.viewOfficialSource")}
          </a>
        ) : null}
        <Button
          variant="outline"
          className="min-h-11 rounded-xl text-xs"
          onClick={() => void copyText(plain, t)}
        >
          <Copy className="size-4" aria-hidden="true" />
          {t("help.widget.copy")}
        </Button>
        <Button
          variant="outline"
          className="min-h-11 rounded-xl text-xs"
          onClick={() => {
            const shareData = { title: doc.question, text: plain };
            if (navigator.share) void navigator.share(shareData).catch(() => undefined);
            else void copyText(plain, t);
          }}
        >
          <Share2 className="size-4" aria-hidden="true" />
          {t("help.widget.share")}
        </Button>
        <Button
          variant="outline"
          className="min-h-11 rounded-xl text-xs"
          onClick={() => speak(plain, t)}
        >
          <Volume2 className="size-4" aria-hidden="true" />
          {t("help.widget.listen")}
        </Button>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="font-semibold">{t("help.widget.didThisResolve")}</p>
        {feedbackDone ? (
          <div className="mt-2">
            <p className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <Check className="size-4" aria-hidden="true" />
              {t("help.widget.thanksForHelping")}
            </p>
            {reviewSlot}
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              className="min-h-11 rounded-xl text-xs font-bold"
              onClick={() => onFeedback("yes")}
            >
              {t("article.yes")}
            </Button>
            <Button
              variant="outline"
              className="min-h-11 rounded-xl text-xs font-semibold"
              onClick={() => onFeedback("partial")}
            >
              {t("help.widget.partially")}
            </Button>
            <Button
              variant="outline"
              className="min-h-11 rounded-xl text-xs font-semibold"
              onClick={() => onFeedback("no")}
            >
              {t("article.no")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactView({
  choice,
  contacts,
  loading,
  officialContactUrl,
  showNoAnswerNotice,
  onSearchAgain,
  onChangeSchool,
}: {
  choice: HelpSchoolChoice | null;
  contacts: HelpBflRow[];
  loading: boolean;
  officialContactUrl: string | null;
  showNoAnswerNotice: boolean;
  onSearchAgain: () => void;
  onChangeSchool: () => void;
}) {
  const { t } = useI18n();
  if (choice === "unsure" || choice === null) {
    return (
      <div>
        <p className="font-semibold">{t("help.widget.needSchoolForContacts")}</p>
        <Button className="mt-3 min-h-11 rounded-xl text-xs font-bold" onClick={onChangeSchool}>
          {t("help.widget.selectSchool")}
        </Button>
      </div>
    );
  }

  if (loading) return <p className="text-muted-foreground">{t("help.widget.loadingContacts")}</p>;

  if (contacts.length === 0) {
    return (
      <div>
        <p>{t("help.widget.noBflText")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {officialContactUrl ? (
            <a
              href={officialContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              {t("help.widget.viewOfficialContact")}
            </a>
          ) : null}
          <Button variant="outline" className="min-h-11 rounded-xl text-xs" onClick={onSearchAgain}>
            {t("help.widget.searchAnotherQuestion")}
          </Button>
          <Button
            variant="outline"
            className="min-h-11 rounded-xl text-xs"
            onClick={onChangeSchool}
          >
            {t("help.widget.changeSchool")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showNoAnswerNotice ? <p>{t("help.widget.noAnswerText")}</p> : null}
      <ul className="mt-3 space-y-3">
        {contacts.map((contact) => {
          const summary = [
            contact.person_name,
            contact.public_role ?? "",
            contact.phone ?? "",
            contact.email ?? "",
            contact.office ?? "",
            contact.public_hours ?? "",
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={contact.id} className="rounded-xl border border-border bg-secondary/40 p-3">
              <p className="font-bold">{contact.person_name}</p>
              {contact.public_role ? (
                <p className="text-xs text-muted-foreground">{contact.public_role}</p>
              ) : null}
              {(contact.languages ?? []).length > 0 ? (
                <p className="mt-1 text-xs">
                  {t("help.widget.languages")}: {(contact.languages ?? []).join(", ")}
                </p>
              ) : null}
              {contact.office ? (
                <p className="mt-1 text-xs">
                  {t("help.widget.office")}: {contact.office}
                </p>
              ) : null}
              {contact.public_hours ? (
                <p className="mt-1 text-xs">
                  {t("help.widget.hours")}: {contact.public_hours}
                </p>
              ) : null}
              {contact.verified_at ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  {t("help.widget.verifiedOn")}{" "}
                  {new Date(contact.verified_at).toLocaleDateString("es-MX")}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {t("help.widget.call")}
                  </a>
                ) : null}
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    {t("help.widget.sendEmail")}
                  </a>
                ) : null}
                <Button
                  variant="outline"
                  className="min-h-11 rounded-xl text-xs"
                  onClick={() => void copyText(summary, t)}
                >
                  <Copy className="size-4" aria-hidden="true" />
                  {t("help.widget.copyInfo")}
                </Button>
                {contact.official_source_url ? (
                  <a
                    href={contact.official_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold"
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    {t("help.widget.viewOfficialSource")}
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        {officialContactUrl ? (
          <a
            href={officialContactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            {t("help.widget.viewOfficialContact")}
          </a>
        ) : null}
        <Button variant="outline" className="min-h-11 rounded-xl text-xs" onClick={onSearchAgain}>
          {t("help.widget.searchAnotherQuestion")}
        </Button>
        <Button variant="outline" className="min-h-11 rounded-xl text-xs" onClick={onChangeSchool}>
          {t("help.widget.changeSchool")}
        </Button>
      </div>
    </div>
  );
}
