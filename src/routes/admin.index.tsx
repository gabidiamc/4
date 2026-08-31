/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  CalendarClock,
  FileCheck2,
  Link2,
  Languages,
  Inbox,
  Sparkles,
  Plus,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
  Search,
  Activity,
  History,
  ShieldCheck,
  Building,
  School as SchoolIcon,
  Layers,
  HelpCircle,
  FileText,
  User,
  ShieldAlert,
  Server,
  Zap,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { listRows, logAudit, useAdminSession } from "@/lib/admin";
import { useSchool, getSchoolById } from "@/lib/school";
import { formatDesMoinesDate } from "@/lib/content-lifecycle";
import { applyChangesNow } from "@/lib/sync";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
  validateSearch: (search: Record<string, unknown>): { view?: string } => {
    return {
      view: typeof search["view"] === "string" ? search["view"] : undefined,
    };
  },
});

function AdminDashboard() {
  const searchParams = useSearch({ from: "/admin/" });
  const { session } = useAdminSession();
  const { adminSchoolFilter } = useSchool();
  const activeSchool = adminSchoolFilter !== "all" ? getSchoolById(adminSchoolFilter) : null;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>(searchParams.view || "overview");
  const [auditFilterUser, setAuditFilterUser] = useState("");
  const [auditFilterAction, setAuditFilterAction] = useState("all");
  const [auditFilterEntity, setAuditFilterEntity] = useState("all");
  const [systemLatency, setSystemLatency] = useState<number | null>(null);

  // Sync tab with URL search parameter if changed
  useEffect(() => {
    if (searchParams.view) {
      setActiveTab(searchParams.view);
    }
  }, [searchParams.view]);

  // Greeting based on Des Moines time
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    const prefix = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
    const name = session?.user?.email?.split("@")[0] || "Administrador";
    return `${prefix}, ${name}. Esto necesita tu atención.`;
  }, [session]);

  // Check Supabase System Health and Latency
  useEffect(() => {
    const checkHealth = async () => {
      const start = performance.now();
      try {
        await supabase.from("schools").select("id").limit(1);
        const end = performance.now();
        setSystemLatency(Math.round(end - start));
      } catch {
        setSystemLatency(null);
      }
    };
    void checkHealth();
  }, []);

  // Fetch Dashboard Metrics & Attention Cards
  const metricsQuery = useQuery({
    queryKey: ["admin_dashboard_metrics", adminSchoolFilter],
    queryFn: async () => {
      const todayIso = new Date().toISOString().slice(0, 10);
      const nextWeekDate = new Date();
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      const nextWeekIso = nextWeekDate.toISOString().slice(0, 10);

      // 1. Articles query
      const { data: articles = [] } = await supabase
        .from("articles")
        .select(
          "id, title, status, source_name, official_url, starts_at, ends_at, school_id, article_translations(language_code, title)",
        );

      // 2. Announcements query
      const { data: announcements = [] } = await supabase
        .from("announcements")
        .select(
          "id, status, level, starts_at, expires_at, link_url, announcement_translations(language_code, title)",
        );

      // 3. Events query
      const { data: events = [] } = await supabase
        .from("events")
        .select("id, title, status, start_date, end_date, official_url");

      // 4. Update requests query
      const { data: updateRequests = [] } = await supabase
        .from("update_requests")
        .select("id, status, kind, message, created_at");

      // Calculate critical attention metrics
      const draftsCount =
        (articles?.filter((a) => a.status === "draft" || a.status === "in_review").length || 0) +
        (announcements?.filter((a) => a.status === "draft" || a.status === "in_review").length ||
          0);

      const unverifiedCount =
        articles?.filter(
          (a) => a.status === "published" && (!a.source_name || a.source_name.trim().length === 0),
        ).length || 0;

      const endingTodayCount =
        (articles?.filter(
          (a) => a.status === "published" && a.ends_at && a.ends_at.slice(0, 10) === todayIso,
        ).length || 0) +
        (announcements?.filter(
          (a) => a.status === "published" && a.expires_at && a.expires_at.slice(0, 10) === todayIso,
        ).length || 0) +
        (events?.filter(
          (e) => e.status === "published" && (e.end_date === todayIso || e.start_date === todayIso),
        ).length || 0);

      const endingThisWeekCount =
        (articles?.filter(
          (a) =>
            a.status === "published" &&
            a.ends_at &&
            a.ends_at.slice(0, 10) >= todayIso &&
            a.ends_at.slice(0, 10) <= nextWeekIso,
        ).length || 0) +
        (announcements?.filter(
          (a) =>
            a.status === "published" &&
            a.expires_at &&
            a.expires_at.slice(0, 10) >= todayIso &&
            a.expires_at.slice(0, 10) <= nextWeekIso,
        ).length || 0);

      const noEndDateCount =
        articles?.filter((a) => a.status === "published" && !a.ends_at).length || 0;

      const brokenLinksCount =
        articles?.filter(
          (a) =>
            a.official_url &&
            !a.official_url.startsWith("http") &&
            !a.official_url.startsWith("mailto") &&
            !a.official_url.startsWith("tel"),
        ).length || 0;

      const missingTranslationsCount =
        (articles?.filter((a) => {
          const trans = a.article_translations as any[];
          const hasEs = trans?.some((t) => t.language_code === "es" && t.title?.trim());
          const hasEn = trans?.some((t) => t.language_code === "en" && t.title?.trim());
          return a.status === "published" && (!hasEs || !hasEn);
        }).length || 0) +
        (announcements?.filter((an) => {
          const trans = an.announcement_translations as any[];
          const hasEs = trans?.some((t) => t.language_code === "es" && t.title?.trim());
          const hasEn = trans?.some((t) => t.language_code === "en" && t.title?.trim());
          return an.status === "published" && (!hasEs || !hasEn);
        }).length || 0);

      const openRequestsCount = updateRequests?.filter((r) => r.status === "open").length || 0;

      return {
        draftsCount,
        unverifiedCount,
        endingTodayCount,
        endingThisWeekCount,
        noEndDateCount,
        brokenLinksCount,
        missingTranslationsCount,
        openRequestsCount,
        totalArticles: articles?.length || 0,
        totalAnnouncements: announcements?.length || 0,
        totalEvents: events?.length || 0,
      };
    },
    staleTime: 1000 * 20,
  });

  // Fetch Audit Logs
  const auditLogsQuery = useQuery({
    queryKey: ["admin", "audit_logs", adminSchoolFilter],
    queryFn: () => listRows("audit_logs", "created_at", false),
  });

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return (auditLogsQuery.data ?? []).filter((log: any) => {
      if (auditFilterAction !== "all" && log.action !== auditFilterAction) return false;
      if (auditFilterEntity !== "all" && log.entity_type !== auditFilterEntity) return false;
      if (auditFilterUser.trim()) {
        const user = String(log.user_id || log.details || "").toLowerCase();
        if (!user.includes(auditFilterUser.toLowerCase())) return false;
      }
      return true;
    });
  }, [auditLogsQuery.data, auditFilterAction, auditFilterEntity, auditFilterUser]);

  const metrics = metricsQuery.data;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Personalized Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles className="size-4" />
            <span>Centro de Control Administrativo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {greetingText}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Gestiona la información familiar de DMPS con control de calidad, vigencia automática y
            publicación segura.
          </p>
        </div>

        {/* School Context Badge */}
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-2xs ${
            activeSchool
              ? "border-primary/40 bg-primary-soft/40 text-foreground"
              : "border-border bg-card text-foreground"
          }`}
        >
          {activeSchool ? (
            <>
              <SchoolIcon className="size-5 text-primary shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase leading-none">
                  Escuela Activa:
                </p>
                <p className="text-sm font-extrabold text-foreground mt-0.5">{activeSchool.name}</p>
              </div>
            </>
          ) : (
            <>
              <Layers className="size-5 text-primary shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase leading-none">
                  Ámbito del Distrito:
                </p>
                <p className="text-sm font-extrabold text-foreground mt-0.5">
                  Todas las escuelas (Distrito completo)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main View Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3 overflow-x-auto text-xs sm:text-sm font-bold">
        {[
          { id: "overview", label: "Resumen y Atención", icon: Sparkles },
          { id: "pending", label: "Tareas Pendientes", icon: Clock },
          { id: "activity", label: "Actividad y Auditoría", icon: History },
          { id: "status", label: "Estado del Sistema", icon: Activity },
        ].map((tab) => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <IconComp className="size-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ATTENTION CARDS */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Quick Actions Bar */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Acciones Rápidas
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Atajos directos para crear y revisar
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <Link
                to="/admin/articulos"
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-background hover:bg-primary hover:text-white font-bold text-xs transition-all shadow-2xs group"
              >
                <Plus className="size-4 text-primary group-hover:text-white" />
                <span>Nuevo Artículo</span>
              </Link>

              <Link
                to="/admin/anuncios"
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-background hover:bg-primary hover:text-white font-bold text-xs transition-all shadow-2xs group"
              >
                <Plus className="size-4 text-primary group-hover:text-white" />
                <span>Nuevo Aviso</span>
              </Link>

              <Link
                to="/admin/calendario"
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-background hover:bg-primary hover:text-white font-bold text-xs transition-all shadow-2xs group"
              >
                <Calendar className="size-4 text-primary group-hover:text-white" />
                <span>Calendario</span>
              </Link>

              <Link
                to="/admin/vigencia"
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-background hover:bg-primary hover:text-white font-bold text-xs transition-all shadow-2xs group"
              >
                <CalendarClock className="size-4 text-primary group-hover:text-white" />
                <span>Vigencia</span>
              </Link>

              <Link
                to="/admin/calidad"
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-background hover:bg-primary hover:text-white font-bold text-xs transition-all shadow-2xs group"
              >
                <FileCheck2 className="size-4 text-primary group-hover:text-white" />
                <span>Calidad</span>
              </Link>

              <Link
                to="/"
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-background hover:bg-muted font-bold text-xs text-muted-foreground hover:text-foreground transition-all shadow-2xs"
              >
                <span>Ver Sitio</span>
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* 8 Important Attention Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                <span>Tarjetas de Atención Inmediata</span>
              </h2>
              <span className="text-xs text-muted-foreground">
                Haz clic en cualquier tarjeta para gestionar los elementos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Drafts */}
              <Link
                to="/admin/articulos"
                className="rounded-2xl border border-border/80 bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Pendientes de publicación
                  </span>
                  <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Clock className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    {metrics?.draftsCount ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-0.5">
                    Ver borradores <ArrowUpRight className="size-3" />
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Artículos y avisos guardados como borrador
                </p>
              </Link>

              {/* Card 2: Unverified */}
              <Link
                to="/admin/calidad"
                className="rounded-2xl border border-border/80 bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Pendientes de verificación
                  </span>
                  <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <FileCheck2 className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                    {metrics?.unverifiedCount ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-0.5">
                    Verificar <ArrowUpRight className="size-3" />
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Contenido sin fuente oficial documentada
                </p>
              </Link>

              {/* Card 3: Ends today */}
              <Link
                to="/admin/vigencia"
                className="rounded-2xl border border-border/80 bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Finalizan hoy</span>
                  <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <CalendarClock className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                    {metrics?.endingTodayCount ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-0.5">
                    Revisar <ArrowUpRight className="size-3" />
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Caducan hoy en hora de Des Moines
                </p>
              </Link>

              {/* Card 4: Ends this week */}
              <Link
                to="/admin/vigencia"
                className="rounded-2xl border border-border/80 bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Finalizan esta semana
                  </span>
                  <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Calendar className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    {metrics?.endingThisWeekCount ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-0.5">
                    Extender o archivar <ArrowUpRight className="size-3" />
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Vencimiento próximo en los próximos 7 días
                </p>
              </Link>

              {/* Card 5: Permanent / No end date */}
              <Link
                to="/admin/vigencia"
                className="rounded-2xl border border-border/80 bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Sin fecha de finalización
                  </span>
                  <div className="size-8 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center">
                    <Info className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-slate-700 dark:text-slate-300">
                    {metrics?.noEndDateCount ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-0.5">
                    Ver permanentes <ArrowUpRight className="size-3" />
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Recursos informativos continuos
                </p>
              </Link>

              {/* Card 6: Broken links */}
              <Link
                to="/admin/calidad"
                className="rounded-2xl border border-border/80 bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Enlaces con problemas
                  </span>
                  <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <Link2 className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                    {metrics?.brokenLinksCount ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-0.5">
                    Corregir enlaces <ArrowUpRight className="size-3" />
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  URLs sin protocolo https:// o con errores
                </p>
              </Link>

              {/* Card 7: Missing Translations */}
              <Link
                to="/admin/calidad"
                className="rounded-2xl border border-border/80 bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Traducciones pendientes
                  </span>
                  <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <Languages className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    {metrics?.missingTranslationsCount ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-0.5">
                    Traducir <ArrowUpRight className="size-3" />
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Falta versión en Español o Inglés
                </p>
              </Link>

              {/* Card 8: Family Reports */}
              <Link
                to="/admin/solicitudes"
                className="rounded-2xl border border-border/80 bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Reportes de familias
                  </span>
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Inbox className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {metrics?.openRequestsCount ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-0.5">
                    Atender reportes <ArrowUpRight className="size-3" />
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Observaciones enviadas desde el sitio público
                </p>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING TASKS */}
      {activeTab === "pending" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <span>Tareas Pendientes de Resolución</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Lista consolidada de elementos que requieren acción antes de publicarse o renovarse.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Borradores
                    </span>
                    <span className="font-bold text-sm text-foreground">
                      {metrics?.draftsCount || 0} contenidos en borrador
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Artículos y avisos que están preparados pero aún no son visibles para las
                    familias.
                  </p>
                </div>
                <Link
                  to="/admin/articulos"
                  className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-deep shadow-2xs"
                >
                  Abrir editor
                </Link>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      Vencimientos
                    </span>
                    <span className="font-bold text-sm text-foreground">
                      {metrics?.endingThisWeekCount || 0} contenidos que finalizan esta semana
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avisos o artículos que dejarán de mostrarse pronto. Extiende su fecha o
                    archívalos.
                  </p>
                </div>
                <Link
                  to="/admin/vigencia"
                  className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-deep shadow-2xs"
                >
                  Gestionar fechas
                </Link>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Familias
                    </span>
                    <span className="font-bold text-sm text-foreground">
                      {metrics?.openRequestsCount || 0} reportes pendientes
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Comentarios sobre información o enlaces desactualizados enviados por la
                    comunidad.
                  </p>
                </div>
                <Link
                  to="/admin/solicitudes"
                  className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-deep shadow-2xs"
                >
                  Atender solicitudes
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECENT ACTIVITY & AUDIT LOG */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                  <History className="size-5 text-primary" />
                  <span>Historial de Actividad y Auditoría</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Registro inmutable de todas las acciones de creación, modificación y eliminación.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => auditLogsQuery.refetch()}
                disabled={auditLogsQuery.isPending}
                className="min-h-9 rounded-xl text-xs gap-1.5"
              >
                <RefreshCw
                  className={`size-3.5 ${auditLogsQuery.isPending ? "animate-spin" : ""}`}
                />
                Actualizar historial
              </Button>
            </div>

            {/* Audit Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={auditFilterUser}
                  onChange={(e) => setAuditFilterUser(e.target.value)}
                  placeholder="Buscar por usuario o ID…"
                  className="pl-9 min-h-10 rounded-xl text-xs"
                />
              </div>

              <select
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value)}
                className="min-h-10 rounded-xl border border-input bg-background px-3 py-1 font-semibold text-foreground text-xs"
              >
                <option value="all">Todas las acciones</option>
                <option value="create">Creaciones</option>
                <option value="update">Actualizaciones</option>
                <option value="delete">Eliminaciones</option>
              </select>

              <select
                value={auditFilterEntity}
                onChange={(e) => setAuditFilterEntity(e.target.value)}
                className="min-h-10 rounded-xl border border-input bg-background px-3 py-1 font-semibold text-foreground text-xs"
              >
                <option value="all">Todos los módulos</option>
                <option value="articles">Artículos</option>
                <option value="announcements">Avisos</option>
                <option value="events">Eventos</option>
                <option value="appearance_settings">Apariencia</option>
                <option value="categories">Categorías</option>
                <option value="schools">Escuelas</option>
              </select>
            </div>

            {/* Audit Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-bold">
                    <th className="px-3 py-2.5 text-start">Acción</th>
                    <th className="px-3 py-2.5 text-start">Módulo</th>
                    <th className="px-3 py-2.5 text-start">Registro ID</th>
                    <th className="px-3 py-2.5 text-start">Fecha y Hora (Des Moines)</th>
                    <th className="px-3 py-2.5 text-start">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No se encontraron registros de auditoría para los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.slice(0, 50).map((log: any) => (
                      <tr
                        key={String(log.id)}
                        className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-3 py-2.5 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              log.action === "create"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : log.action === "delete"
                                  ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                  : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            }`}
                          >
                            {log.action === "create"
                              ? "Crear"
                              : log.action === "delete"
                                ? "Eliminar"
                                : "Actualizar"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-foreground">
                          {log.entity_type || "Sistema"}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground font-mono text-[11px]">
                          {log.entity_id ? String(log.entity_id).slice(0, 16) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-foreground font-medium">
                          {formatDesMoinesDate(log.created_at)}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[140px]">
                          {log.user_id ? String(log.user_id).slice(0, 18) : "Admin staff"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM STATUS & DIAGNOSTICS */}
      {activeTab === "status" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supabase Connection */}
            <Card className="rounded-2xl border-border/80 shadow-2xs">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Server className="size-5 text-primary" />
                  <span>Conexión de Base de Datos (Supabase)</span>
                </CardTitle>
                <CardDescription>
                  Estado del enlace de datos en tiempo real y tiempo de respuesta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/80">
                  <span className="text-xs font-semibold text-foreground">Estado del servicio</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Funcionando
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/80">
                  <span className="text-xs font-semibold text-foreground">Latencia de lectura</span>
                  <span className="text-xs font-bold text-foreground font-mono">
                    {systemLatency !== null ? `${systemLatency} ms` : "Comprobando…"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/80">
                  <span className="text-xs font-semibold text-foreground">
                    Zona horaria oficial
                  </span>
                  <span className="text-xs font-bold text-primary font-mono">America/Chicago</span>
                </div>
              </CardContent>
            </Card>

            {/* Sync & Panel Version */}
            <Card className="rounded-2xl border-border/80 shadow-2xs">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Zap className="size-5 text-primary" />
                  <span>Sincronización y Versión</span>
                </CardTitle>
                <CardDescription>
                  Parámetros de despliegue y control de integridad del portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/80">
                  <span className="text-xs font-semibold text-foreground">Versión del panel</span>
                  <span className="text-xs font-bold text-foreground font-mono">
                    2026.8.30-control-center
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/80">
                  <span className="text-xs font-semibold text-foreground">
                    Modo de persistencia
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    Supabase PostgreSQL + RLS
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/80">
                  <span className="text-xs font-semibold text-foreground">
                    Protección de seguridad
                  </span>
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <ShieldCheck className="size-4 text-primary" />
                    Roles y auditoría activa
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
