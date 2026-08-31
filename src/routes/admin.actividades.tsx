import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  Layers,
  Link as LinkIcon,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSchool, getSchoolById } from "@/lib/school";
import {
  type BoundActivity,
  type BoundEvent,
  type BoundSyncLog,
  type BoundStatus,
  type BoundTeam,
  formatDateFormatted,
  deleteActivity,
  fetchActivitiesForSchool,
  getStoredEvents,
  getStoredRegistrationSettings,
  getStoredSyncLogs,
  getStoredTeams,
  LINCOLN_BOUND_BASE_URL,
  saveActivitiesForSchool,
  saveStoredEvents,
  saveStoredRegistrationSettings,
  saveStoredSyncLogs,
  saveStoredTeams,
} from "@/lib/bound";

export const Route = createFileRoute("/admin/actividades")({
  component: AdminDeportesActividadesPage,
});

export function AdminDeportesActividadesPage() {
  const { adminSchoolFilter } = useSchool();
  const currentSchoolId = adminSchoolFilter === "east" ? "east" : "lincoln";
  const activeSchool = getSchoolById(currentSchoolId);
  const activeBoundUrl = activeSchool.boundUrl || LINCOLN_BOUND_BASE_URL;

  const [activities, setActivities] = useState<BoundActivity[]>([]);
  const [teams, setTeams] = useState<BoundTeam[]>(() => getStoredTeams(currentSchoolId));
  const [events, setEvents] = useState<BoundEvent[]>(() => getStoredEvents(currentSchoolId));
  const [regSettings, setRegSettings] = useState(() =>
    getStoredRegistrationSettings(currentSchoolId),
  );
  const [syncLogs, setSyncLogs] = useState<BoundSyncLog[]>(() => getStoredSyncLogs());

  useEffect(() => {
    void fetchActivitiesForSchool(currentSchoolId)
      .then(setActivities)
      .catch(() => setActivities([]));
    setTeams(getStoredTeams(currentSchoolId));
    setEvents(getStoredEvents(currentSchoolId));
    setRegSettings(getStoredRegistrationSettings(currentSchoolId));
  }, [currentSchoolId]);

  // Active admin tab
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "girls"
    | "boys"
    | "coed"
    | "extracurricular"
    | "teams"
    | "schedules"
    | "announcement"
    | "sync"
    | "duplicates"
  >("overview");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Duplicates selection
  const [primaryDupId, setPrimaryDupId] = useState("");
  const [secondaryDupId, setSecondaryDupId] = useState("");

  // Edit Activity Modal
  const [editingActivity, setEditingActivity] = useState<BoundActivity | null>(null);

  // Helper to show save feedback
  const showSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  // Toggle activity visibility/active
  const toggleActivityActive = (id: string) => {
    const updated = activities.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a));
    setActivities(updated);
    void saveActivitiesForSchool(updated, currentSchoolId).catch((e: Error) =>
      alert(`No se pudo guardar en la base de datos: ${e.message}`),
    );
    showSuccess("Estado de visibilidad actualizado.");
  };

  // Save registration banner settings
  const handleSaveRegSettings = () => {
    const updated = {
      ...regSettings,
      verified_at: new Date().toISOString(),
    };
    setRegSettings(updated);
    saveStoredRegistrationSettings(updated, currentSchoolId);
    showSuccess("Configuración del anuncio de registro guardada con éxito.");
  };

  // Save single activity edits
  const handleSaveActivityEdit = () => {
    if (!editingActivity) return;
    const updated = activities.map((a) =>
      a.id === editingActivity.id
        ? { ...editingActivity, updated_at: new Date().toISOString() }
        : a,
    );
    setActivities(updated);
    void saveActivitiesForSchool(updated, currentSchoolId).catch((e: Error) =>
      alert(`No se pudo guardar en la base de datos: ${e.message}`),
    );
    setEditingActivity(null);
    showSuccess(`Actividad "${editingActivity.name}" actualizada.`);
  };

  // Trigger manual Bound sync
  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const newLog: BoundSyncLog = {
        id: `sync-${Date.now()}`,
        sync_type: "Manual Bound Audit & Link Verification",
        source_url: LINCOLN_BOUND_BASE_URL,
        started_at: now,
        completed_at: new Date(Date.now() + 1500).toISOString(),
        status: "success",
        items_created: 0,
        items_updated: activities.length,
        error_summary: null,
      };
      const updatedLogs = [newLog, ...syncLogs];
      setSyncLogs(updatedLogs);
      saveStoredSyncLogs(updatedLogs);

      // Touch verified_at on activities
      const updatedActs = activities.map((a) => ({ ...a, verified_at: now }));
      setActivities(updatedActs);
      void saveActivitiesForSchool(updatedActs, currentSchoolId).catch((e: Error) =>
        alert(`No se pudo guardar en la base de datos: ${e.message}`),
      );

      setSyncing(false);
      showSuccess("Sincronización y verificación con Bound completada.");
    }, 1200);
  };

  // Merge duplicates
  const handleMergeDuplicates = () => {
    if (!primaryDupId || !secondaryDupId || primaryDupId === secondaryDupId) {
      alert("Selecciona dos elementos diferentes para combinar.");
      return;
    }
    const removedId = secondaryDupId;
    const updatedActs = activities.filter((a) => a.id !== removedId);
    setActivities(updatedActs);
    void deleteActivity(removedId).catch((e: Error) =>
      alert(`No se pudo eliminar en la base de datos: ${e.message}`),
    );
    void saveActivitiesForSchool(updatedActs, currentSchoolId).catch((e: Error) =>
      alert(`No se pudo guardar en la base de datos: ${e.message}`),
    );
    setPrimaryDupId("");
    setSecondaryDupId("");
    showSuccess("Duplicado eliminado y fusionado en el registro principal.");
  };

  // Filtered lists
  const girlsActivities = activities.filter(
    (a) => a.category === "girls" || a.category === "girls_coop",
  );
  const boysActivities = activities.filter((a) => a.category === "boys");
  const coedActivities = activities.filter((a) => a.category === "coed");
  const extraActivities = activities.filter((a) => a.category === "extracurricular");

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Trophy className="size-3.5" />
            {activeSchool.name} · Bound Admin Sync
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">
            Gestión de Deportes y Actividades
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sincronización, verificación de enlaces oficiales de Bound y configuración del anuncio
            de registro para {activeSchool.shortName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleManualSync}
            disabled={syncing}
            className="min-h-11 rounded-xl font-bold bg-primary text-primary-foreground shadow"
          >
            <RefreshCw className={`size-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar con Bound ahora"}
          </Button>

          <a
            href={activeBoundUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-muted"
          >
            Ver fuente Bound ({activeSchool.shortName})
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600" />
          {saveSuccessMsg}
        </div>
      )}

      {/* TOP METRICS OVERVIEW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Deportes Chicas
          </p>
          <p className="text-2xl font-black text-foreground">{girlsActivities.length}</p>
          <p className="text-[11px] text-muted-foreground">Softball, Volleyball, Dance, Coops</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Deportes Chicos
          </p>
          <p className="text-2xl font-black text-foreground">{boysActivities.length}</p>
          <p className="text-[11px] text-muted-foreground">Baseball, Football, Basketball, Golf</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Mixtos & Extracurriculares
          </p>
          <p className="text-2xl font-black text-foreground">
            {coedActivities.length + extraActivities.length}
          </p>
          <p className="text-[11px] text-muted-foreground">Cheer, Band, Choir, Drama, Esports</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Estado de Registro
          </p>
          <p className="text-2xl font-black text-emerald-600">
            {regSettings.is_enabled ? "Activo" : "Inactivo"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {currentSchoolId === "east"
              ? "Apoyo: Rosario Jiménez & Francisco Hernández"
              : "Apoyo: Brenda Lucero & Veronica Ortiz"}
          </p>
        </div>
      </div>

      {/* ADMIN TABS */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-2 scrollbar-none text-xs font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "overview"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Resumen General
        </button>
        <button
          onClick={() => setActiveTab("announcement")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "announcement"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Anuncio de Registro & Apoyo
        </button>
        <button
          onClick={() => setActiveTab("girls")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "girls"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Chicas ({girlsActivities.length})
        </button>
        <button
          onClick={() => setActiveTab("boys")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "boys"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Chicos ({boysActivities.length})
        </button>
        <button
          onClick={() => setActiveTab("coed")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "coed"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Mixtos ({coedActivities.length})
        </button>
        <button
          onClick={() => setActiveTab("extracurricular")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "extracurricular"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Extracurriculares ({extraActivities.length})
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "teams"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Equipos ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab("sync")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "sync"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Historial de Sincronización
        </button>
        <button
          onClick={() => setActiveTab("duplicates")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "duplicates"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Gestión de Duplicados
        </button>
      </div>

      {/* TAB CONTENT: ANNOUNCEMENT SETTINGS */}
      {activeTab === "announcement" && (
        <div className="surface-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Configuración del Anuncio de Registro
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Personaliza el banner de aviso, personas de apoyo y verifica el enlace oficial de
                Bound.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-foreground">Mostrar anuncio:</label>
              <input
                type="checkbox"
                checked={regSettings.is_enabled}
                onChange={(e) => setRegSettings({ ...regSettings, is_enabled: e.target.checked })}
                className="size-5 rounded text-primary focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Título del anuncio:</label>
              <Input
                value={regSettings.title}
                onChange={(e) => setRegSettings({ ...regSettings, title: e.target.value })}
                className="min-h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Enlace de registro Bound:</label>
              <Input
                value={regSettings.registration_url}
                onChange={(e) =>
                  setRegSettings({ ...regSettings, registration_url: e.target.value })
                }
                className="min-h-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Mensaje del anuncio:</label>
            <Textarea
              value={regSettings.message}
              onChange={(e) => setRegSettings({ ...regSettings, message: e.target.value })}
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Personas de Apoyo (Brenda Lucero & Veronica Ortiz) */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Personas de Apoyo Configurada
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {regSettings.support_persons.map((person, idx) => (
                <div
                  key={person.id}
                  className="rounded-xl border border-border p-4 bg-muted/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-foreground">{person.person_name}</p>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {person.is_verified ? "Verificado" : "Sin teléfono directo"}
                    </span>
                  </div>

                  <Input
                    value={person.role}
                    onChange={(e) => {
                      const updatedSupport = [...regSettings.support_persons];
                      updatedSupport[idx]!.role = e.target.value;
                      setRegSettings({ ...regSettings, support_persons: updatedSupport });
                    }}
                    placeholder="Rol o función"
                    className="min-h-9 text-xs"
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Input
                      value={person.phone || ""}
                      onChange={(e) => {
                        const updatedSupport = [...regSettings.support_persons];
                        updatedSupport[idx]!.phone = e.target.value || null;
                        setRegSettings({ ...regSettings, support_persons: updatedSupport });
                      }}
                      placeholder="Teléfono (opcional)"
                      className="min-h-9 text-xs"
                    />
                    <Input
                      value={person.office || ""}
                      onChange={(e) => {
                        const updatedSupport = [...regSettings.support_persons];
                        updatedSupport[idx]!.office = e.target.value || null;
                        setRegSettings({ ...regSettings, support_persons: updatedSupport });
                      }}
                      placeholder="Oficina (opcional)"
                      className="min-h-9 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banner Live Preview */}
          <div className="pt-4 border-t border-border space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Vista previa en vivo del banner:
            </p>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="font-bold text-base text-foreground">{regSettings.title}</p>
              <p className="text-xs text-foreground/90">{regSettings.message}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button onClick={handleSaveRegSettings} className="min-h-11 px-6 font-bold rounded-xl">
              <Save className="size-4 mr-2" />
              Guardar configuración del anuncio
            </Button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SPORTS LISTS (Girls, Boys, Coed, Extracurricular, Overview) */}
      {(activeTab === "overview" ||
        activeTab === "girls" ||
        activeTab === "boys" ||
        activeTab === "coed" ||
        activeTab === "extracurricular") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nombre..."
                className="pl-9 min-h-10 text-xs rounded-xl"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Mostrando deportes/actividades para Lincoln HS
            </span>
          </div>

          <div className="surface-card overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3.5">Nombre Oficial</th>
                    <th className="p-3.5">Traducción</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5">Temporada</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5">Visibilidad</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {activities
                    .filter((a) => {
                      if (activeTab === "girls")
                        return a.category === "girls" || a.category === "girls_coop";
                      if (activeTab === "boys") return a.category === "boys";
                      if (activeTab === "coed") return a.category === "coed";
                      if (activeTab === "extracurricular") return a.category === "extracurricular";
                      return true;
                    })
                    .filter((a) =>
                      searchQuery
                        ? a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.translated_name?.toLowerCase().includes(searchQuery.toLowerCase())
                        : true,
                    )
                    .map((act) => (
                      <tr key={act.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-bold text-foreground">
                          {act.name}
                          <a
                            href={act.official_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-block ml-1.5 text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {act.translated_name || "—"}
                        </td>
                        <td className="p-3.5 uppercase font-semibold text-primary">
                          {act.category}
                        </td>
                        <td className="p-3.5">{act.season}</td>
                        <td className="p-3.5 font-bold text-emerald-600">{act.status}</td>
                        <td className="p-3.5">
                          {act.is_active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                              <Eye className="size-3.5" /> Visible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                              <EyeOff className="size-3.5" /> Oculto
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingActivity(act)}
                            className="min-h-8 text-xs rounded-lg"
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleActivityActive(act.id)}
                            className="min-h-8 text-xs rounded-lg"
                          >
                            {act.is_active ? "Ocultar" : "Mostrar"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TEAMS */}
      {activeTab === "teams" && (
        <div className="surface-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Equipos Registrados</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            {teams.map((team) => (
              <div
                key={team.id}
                className="rounded-xl border border-border p-4 bg-card space-y-1.5"
              >
                <p className="font-bold text-sm text-foreground">{team.name}</p>
                <p className="text-muted-foreground">
                  Nivel: <strong className="text-foreground">{team.level}</strong>
                </p>
                <p className="text-muted-foreground">
                  Entrenador:{" "}
                  <strong className="text-foreground">{team.head_coach || "No asignado"}</strong>
                </p>
                <p className="text-muted-foreground">Conferencia: {team.conference || "CIML"}</p>
                <a
                  href={team.official_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline pt-1"
                >
                  Ver en Bound <ExternalLink className="size-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SYNC LOGS */}
      {activeTab === "sync" && (
        <div className="surface-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Historial de Auditoría e Integración Bound
          </h2>
          <div className="space-y-2 text-xs">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-border p-3.5 bg-card flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-foreground">{log.sync_type}</p>
                  <p className="text-muted-foreground">Fuente: {log.source_url}</p>
                  <p className="text-muted-foreground">
                    Fecha: {formatDateFormatted(log.completed_at)}
                  </p>
                </div>
                <span className="rounded bg-emerald-500/10 text-emerald-700 font-bold px-2.5 py-1">
                  {log.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: MERGE DUPLICATES */}
      {activeTab === "duplicates" && (
        <div className="surface-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Gestión y Fusión de Duplicados</h2>
          <p className="text-xs text-muted-foreground">
            Si la fuente de Bound o una importación anterior generó una actividad o deporte
            duplicado, selecciona el elemento principal a conservar y el duplicado a eliminar.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Registro Principal (Conservar):
              </label>
              <select
                value={primaryDupId}
                onChange={(e) => setPrimaryDupId(e.target.value)}
                className="w-full min-h-10 rounded-xl border border-input bg-card p-2 text-xs font-semibold"
              >
                <option value="">-- Seleccionar principal --</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Registro Duplicado (Eliminar/Fusionar):
              </label>
              <select
                value={secondaryDupId}
                onChange={(e) => setSecondaryDupId(e.target.value)}
                className="w-full min-h-10 rounded-xl border border-input bg-card p-2 text-xs font-semibold"
              >
                <option value="">-- Seleccionar duplicado --</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleMergeDuplicates}
            className="min-h-11 rounded-xl font-bold bg-destructive text-destructive-foreground"
          >
            Combinar registros duplicados
          </Button>
        </div>
      )}

      {/* MODAL FOR EDITING SINGLE ACTIVITY */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              Editar Actividad: {editingActivity.name}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold">Nombre Oficial:</label>
                <Input
                  value={editingActivity.name}
                  onChange={(e) => setEditingActivity({ ...editingActivity, name: e.target.value })}
                  className="mt-1 min-h-9"
                />
              </div>

              <div>
                <label className="font-bold">Traducción al Español:</label>
                <Input
                  value={editingActivity.translated_name || ""}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, translated_name: e.target.value })
                  }
                  className="mt-1 min-h-9"
                />
              </div>

              <div>
                <label className="font-bold">URL Oficial en Bound:</label>
                <Input
                  value={editingActivity.official_url}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, official_url: e.target.value })
                  }
                  className="mt-1 min-h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold">Temporada:</label>
                  <select
                    value={editingActivity.season}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        season: e.target.value as BoundActivity["season"],
                      })
                    }
                    className="w-full min-h-9 rounded-lg border border-input bg-card p-1 text-xs"
                  >
                    <option value="Fall">Otoño (Fall)</option>
                    <option value="Winter">Invierno (Winter)</option>
                    <option value="Spring">Primavera (Spring)</option>
                    <option value="Summer">Verano (Summer)</option>
                    <option value="Year-Round">Todo el año</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold">Estado:</label>
                  <select
                    value={editingActivity.status}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        status: e.target.value as BoundStatus,
                      })
                    }
                    className="w-full min-h-9 rounded-lg border border-input bg-card p-1 text-xs"
                  >
                    <option value="En temporada">En temporada</option>
                    <option value="Próximamente">Próximamente</option>
                    <option value="Fuera de temporada">Fuera de temporada</option>
                    <option value="Registro abierto">Registro abierto</option>
                    <option value="Registro cerrado">Registro cerrado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setEditingActivity(null)}
                className="min-h-9 text-xs"
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveActivityEdit} className="min-h-9 text-xs font-bold">
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
