import { useEffect, useRef, useState } from "react";
import {
  Bus,
  Check,
  ChevronRight,
  Compass,
  Crosshair,
  MapPin,
  Play,
  Radio,
  RotateCcw,
  Sparkles,
  StopCircle,
  X,
} from "lucide-react";

import type { PlanItinerary, VehiclePosition } from "@/lib/dart";
import { normalizeHexColor } from "@/lib/dart";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

type Props = {
  itinerary: PlanItinerary | null;
  shapes: { shape_id: string; points: [number, number][] }[];
  vehicles: VehiclePosition[];
  userLocation?: { latitude: number; longitude: number } | null;
  originLocation?: { label: string; latitude: number; longitude: number } | null;
  destinationLocation?: { label: string; latitude: number; longitude: number } | null;
  activeLegIndex?: number;
  isNavigating?: boolean;
  className?: string;
  onSelectRoute?: (routeId: string) => void;
};

export const DART_ROUTES = [
  {
    id: "7",
    shortName: "7",
    name: "SW 9th St / Lincoln High School",
    color: "#d97706",
    bgColor: "bg-amber-600",
    description: "Conecta Lincoln High con DART Central Station",
  },
  {
    id: "6",
    shortName: "6",
    name: "Indianola Ave / Downtown",
    color: "#2563eb",
    bgColor: "bg-blue-600",
    description: "Servicio hacia Centro de Des Moines e Indianola",
  },
  {
    id: "15",
    shortName: "15",
    name: "Park Ave / Valley Junction",
    color: "#9333ea",
    bgColor: "bg-purple-600",
    description: "Línea Park Ave hacia West Des Moines",
  },
  {
    id: "8",
    shortName: "8",
    name: "SE 14th St / Southridge",
    color: "#16a34a",
    bgColor: "bg-emerald-600",
    description: "Eje SE 14th St hacia Southridge Center",
  },
  {
    id: "5",
    shortName: "5",
    name: "Franklin Ave / DART Central",
    color: "#0284c7",
    bgColor: "bg-sky-600",
    description: "Conexión Franklin / Roosevelt / DART Central",
  },
  {
    id: "60",
    shortName: "60",
    name: "University Loop",
    color: "#dc2626",
    bgColor: "bg-red-600",
    description: "Circuito University Ave & Ingersoll",
  },
];

const ROUTE_COLOR_MAP: Record<string, string> = {
  "7": "#d97706",
  "6": "#2563eb",
  "8": "#16a34a",
  "15": "#9333ea",
  "5": "#0284c7",
  "60": "#dc2626",
};

/**
 * Modern Transit-App style MapLibre component.
 * Features an interactive "Iniciar ruta" floating selector,
 * live bus tracking, route line filtering, and CARTO Voyager vector basemap.
 */
export default function DartMap({
  itinerary,
  shapes,
  vehicles,
  userLocation,
  activeLegIndex = 0,
  isNavigating = false,
  className,
  onSelectRoute,
}: Props) {
  const { t } = useI18n();
  const { selectedSchool } = useSchool();
  const schoolCenter: [number, number] =
    selectedSchool.id === "east" ? [-93.6, 41.595] : [-93.6242, 41.5695];
  const schoolLabel = selectedSchool.id === "east" ? "East High" : "Lincoln HS";

  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<{ remove: () => void }[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Transit Route Selection & Live Tracking State
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [followVehicle, setFollowVehicle] = useState(true);

  // Selected route object
  const activeRoute = DART_ROUTES.find((r) => r.id === selectedRouteId) ?? null;
  const activeVehiclesForRoute = selectedRouteId
    ? vehicles.filter((v) => v.route_id === selectedRouteId)
    : vehicles;
  const primaryVehicle = activeVehiclesForRoute[0] ?? null;

  // Initialize Map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !container.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: container.current,
        style: {
          version: 8,
          sources: {
            carto: {
              type: "raster",
              tiles: ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"],
              tileSize: 256,
              attribution: "© CARTO, © OpenStreetMap",
              maxzoom: 19,
            },
          },
          layers: [
            {
              id: "carto-tiles",
              type: "raster",
              source: "carto",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: schoolCenter, // Centered around active school
        zoom: 12.5,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (!cancelled) {
          mapRef.current = map;
          setMapLoaded(true);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Draw routes, shapes, stops, and vehicles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    let cancelled = false;

    const draw = async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !map.isStyleLoaded()) {
        if (!cancelled) setTimeout(draw, 150);
        return;
      }

      // Clear previous layers & sources
      const style = map.getStyle();
      if (style?.layers) {
        for (const layerId of style.layers.map((l) => l.id)) {
          if (layerId.startsWith("dart-")) map.removeLayer(layerId);
        }
      }
      if (style?.sources) {
        for (const sourceId of Object.keys(style.sources)) {
          if (sourceId.startsWith("dart-")) map.removeSource(sourceId);
        }
      }

      // Remove existing HTML markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const bounds = new maplibregl.LngLatBounds();
      let hasBounds = false;

      // Render Itinerary Legs
      if (itinerary?.legs && itinerary.legs.length > 0) {
        itinerary.legs.forEach((leg, i) => {
          const isCurrentLeg = isNavigating && activeLegIndex === i;
          const legId = `dart-leg-${i}`;
          const casingId = `dart-leg-casing-${i}`;

          if (leg.mode === "walk") {
            const walkCoords = [
              [leg.fromLon, leg.fromLat],
              [leg.toLon, leg.toLat],
            ];
            walkCoords.forEach((p) => {
              bounds.extend(p as [number, number]);
              hasBounds = true;
            });

            map.addSource(legId, {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: walkCoords },
              },
            });

            map.addLayer({
              id: legId,
              type: "line",
              source: legId,
              paint: {
                "line-color": "#2563eb",
                "line-width": 4,
                "line-dasharray": [2, 2],
                "line-opacity": 0.8,
              },
            });
          } else if (leg.mode === "bus") {
            const shape = shapes.find((s) => s.shape_id === leg.shapeId);
            const busLine =
              shape?.points && shape.points.length > 1
                ? shape.points
                : ([
                    [leg.boardLon, leg.boardLat],
                    [leg.alightLon, leg.alightLat],
                  ] as [number, number][]);

            busLine.forEach((p) => {
              bounds.extend(p as [number, number]);
              hasBounds = true;
            });

            const hexColor =
              normalizeHexColor(leg.routeColor) ||
              ROUTE_COLOR_MAP[leg.routeShortName ?? ""] ||
              "#d97706";

            map.addSource(legId, {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: busLine },
              },
            });

            // Casing line (white outline under the main line for contrast)
            map.addLayer({
              id: casingId,
              type: "line",
              source: legId,
              paint: {
                "line-color": "#ffffff",
                "line-width": isCurrentLeg ? 10 : 8,
                "line-opacity": 0.9,
              },
            });

            // Active route line
            map.addLayer({
              id: legId,
              type: "line",
              source: legId,
              paint: {
                "line-color": hexColor,
                "line-width": isCurrentLeg ? 7 : 5,
                "line-opacity": 0.95,
              },
            });

            // Boarding & Alighting Stop Markers
            for (const stop of [
              {
                lat: leg.boardLat,
                lon: leg.boardLon,
                name: leg.boardStopName,
                type: "SUBIR" as const,
                route: leg.routeShortName,
                color: hexColor,
              },
              {
                lat: leg.alightLat,
                lon: leg.alightLon,
                name: leg.alightStopName,
                type: "BAJAR" as const,
                route: leg.routeShortName,
                color: hexColor,
              },
            ]) {
              const el = document.createElement("div");
              el.className =
                "group relative flex items-center justify-center transition-transform hover:scale-110 cursor-pointer";
              el.innerHTML = `
                <div class="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-black shadow-md border-2" style="border-color: ${stop.color}">
                  <span class="flex size-2 rounded-full" style="background-color: ${stop.color}"></span>
                  <span class="text-[11px] text-gray-900">${stop.type}: ${stop.name}</span>
                </div>
              `;

              markersRef.current.push(
                new maplibregl.Marker({ element: el })
                  .setLngLat([stop.lon, stop.lat])
                  .setPopup(
                    new maplibregl.Popup({ offset: 12 }).setHTML(
                      `<div class="p-1 font-sans">
                        <strong class="text-xs uppercase font-bold text-gray-500">${stop.type} - Ruta ${stop.route}</strong>
                        <p class="text-sm font-bold text-gray-900">${stop.name}</p>
                      </div>`,
                    ),
                  )
                  .addTo(map),
              );
            }
          }
        });
      }

      // User Location Marker
      if (userLocation && Number.isFinite(userLocation.latitude)) {
        bounds.extend([userLocation.longitude, userLocation.latitude]);
        hasBounds = true;

        const uEl = document.createElement("div");
        uEl.className = "relative flex items-center justify-center";
        uEl.innerHTML = `
          <div class="absolute size-8 animate-ping rounded-full bg-blue-500/40"></div>
          <div class="relative size-4 rounded-full border-2 border-white bg-blue-600 shadow-lg"></div>
        `;
        markersRef.current.push(
          new maplibregl.Marker({ element: uEl })
            .setLngLat([userLocation.longitude, userLocation.latitude])
            .setPopup(new maplibregl.Popup({ offset: 12 }).setText("Tu ubicación"))
            .addTo(map),
        );
      }

      if (hasBounds) {
        map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 600 });
      }
    };

    void draw();
    return () => {
      cancelled = true;
    };
  }, [itinerary, shapes, userLocation, activeLegIndex, isNavigating, mapLoaded]);

  // Dynamic real-time vehicle position layer with smooth marker transitions
  const vehicleMarkersRef = useRef<
    Map<string, { marker: import("maplibre-gl").Marker; element: HTMLDivElement }>
  >(new Map());

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      const currentVehicleIds = new Set<string>();

      for (const v of vehicles) {
        if (v.latitude == null || v.longitude == null) continue;
        const vId = v.vehicle_id || `${v.route_id}-${v.latitude}-${v.longitude}`;
        currentVehicleIds.add(vId);

        const routeShortName = v.route_id ?? "DART";
        const routeColor = ROUTE_COLOR_MAP[routeShortName] || "#d97706";

        if (vehicleMarkersRef.current.has(vId)) {
          // Update position smoothly without recreating marker or resetting map view
          const item = vehicleMarkersRef.current.get(vId)!;
          item.marker.setLngLat([v.longitude, v.latitude]);
          item.marker.setPopup(
            new maplibregl.Popup({ offset: 14 }).setHTML(
              `<div class="p-1.5 font-sans">
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded text-xs font-black text-white" style="background-color: ${routeColor}">Ruta ${routeShortName}</span>
                  <span class="text-xs font-semibold text-emerald-600">● En vivo DART</span>
                </div>
                <p class="mt-1 text-xs text-gray-700 font-bold">Unidad: ${v.vehicle_id}</p>
                ${v.current_status ? `<p class="text-[11px] text-gray-500">${v.current_status}</p>` : ""}
              </div>`,
            ),
          );
        } else {
          // Create new vehicle marker element
          const vEl = document.createElement("div");
          vEl.className =
            "relative flex items-center justify-center cursor-pointer transition-all duration-700 ease-out hover:scale-125 z-20";
          vEl.innerHTML = `
            <div class="relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white shadow-lg border-2 border-white font-extrabold text-xs transition-transform" style="background-color: ${routeColor}">
              <span class="size-2 animate-ping rounded-full bg-white"></span>
              <span>🚌 ${routeShortName}</span>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 14 }).setHTML(
            `<div class="p-1.5 font-sans">
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded text-xs font-black text-white" style="background-color: ${routeColor}">Ruta ${routeShortName}</span>
                <span class="text-xs font-semibold text-emerald-600">● En vivo DART</span>
              </div>
              <p class="mt-1 text-xs text-gray-700 font-bold">Unidad: ${v.vehicle_id}</p>
              ${v.current_status ? `<p class="text-[11px] text-gray-500">${v.current_status}</p>` : ""}
            </div>`,
          );

          const marker = new maplibregl.Marker({ element: vEl })
            .setLngLat([v.longitude, v.latitude])
            .setPopup(popup)
            .addTo(map);

          vehicleMarkersRef.current.set(vId, { marker, element: vEl });
        }
      }

      // Remove stale vehicle markers
      for (const [id, item] of vehicleMarkersRef.current.entries()) {
        if (!currentVehicleIds.has(id)) {
          item.marker.remove();
          vehicleMarkersRef.current.delete(id);
        }
      }
    })();
  }, [vehicles, mapLoaded]);

  // Effect to fly to selected route's vehicle when route changes or vehicle updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedRouteId) return;

    if (primaryVehicle && primaryVehicle.latitude != null && primaryVehicle.longitude != null) {
      map.flyTo({
        center: [primaryVehicle.longitude, primaryVehicle.latitude],
        zoom: 14.5,
        duration: 800,
      });
    }
  }, [selectedRouteId, primaryVehicle?.latitude, primaryVehicle?.longitude, mapLoaded]);

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    setShowRoutePicker(false);
    onSelectRoute?.(routeId);

    const matchVehicles = vehicles.filter((v) => v.route_id === routeId);
    if (
      matchVehicles[0] &&
      matchVehicles[0].latitude != null &&
      matchVehicles[0].longitude != null
    ) {
      mapRef.current?.flyTo({
        center: [matchVehicles[0].longitude, matchVehicles[0].latitude],
        zoom: 14.5,
        duration: 800,
      });
    }
  };

  const recenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: schoolCenter, zoom: 13, duration: 600 });
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border shadow-md ${className ?? "h-96 w-full"}`}
    >
      <div
        ref={container}
        role="application"
        aria-label={t("dart.map.ariaLabel")}
        className="h-full w-full"
      />

      {/* Floating Header Bar (Transit-style Top Overlay) */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto overflow-x-auto max-w-full pb-1 scrollbar-none">
          {/* Main "Iniciar Ruta" Transit Button */}
          <button
            type="button"
            onClick={() => setShowRoutePicker(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-xl hover:bg-emerald-700 active:scale-95 transition-all shrink-0 border border-emerald-400/40"
          >
            <Play className="size-3.5 fill-white" />
            <span>{t("dart.map.startRoute")}</span>
            <span className="flex size-2 rounded-full bg-white animate-ping ml-0.5"></span>
          </button>

          {/* Quick Route Pills */}
          <div className="flex items-center gap-1.5">
            {DART_ROUTES.map((route) => {
              const count = vehicles.filter((v) => v.route_id === route.id).length;
              const isSelected = selectedRouteId === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => handleSelectRoute(route.id)}
                  className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-extrabold shadow-md transition-all shrink-0 backdrop-blur-md border ${
                    isSelected
                      ? "bg-white text-gray-900 border-emerald-500 ring-2 ring-emerald-500 scale-105"
                      : "bg-slate-900/80 text-white border-white/20 hover:bg-slate-900"
                  }`}
                >
                  <span
                    className="flex size-2 rounded-full"
                    style={{ backgroundColor: route.color }}
                  ></span>
                  <span>
                    {t("dart.map.routeWord")} {route.shortName}
                  </span>
                  {count > 0 && (
                    <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 text-[10px] font-black text-white">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recenter button */}
        <button
          type="button"
          onClick={recenter}
          className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border/80 bg-background/90 px-2.5 py-1.5 text-xs font-bold text-foreground shadow-md backdrop-blur-md hover:bg-background transition-colors shrink-0"
          title={`${t("dart.map.centerOn")} ${selectedSchool.name}`}
        >
          <Crosshair className="size-3.5 text-primary" />
          <span className="hidden sm:inline">{schoolLabel}</span>
        </button>
      </div>

      {/* Transit Route Picker Modal Overlay */}
      {showRoutePicker && (
        <div className="absolute inset-x-3 top-3 bottom-3 z-30 flex flex-col rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between border-b border-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Bus className="size-4" />
                </div>
                <h3 className="text-base font-black text-foreground">
                  {t("dart.map.pickerTitle")}
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground font-medium">
                {t("dart.map.pickerSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRoutePicker(false)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
            {DART_ROUTES.map((route) => {
              const routeVehicles = vehicles.filter((v) => v.route_id === route.id);
              const isSelected = selectedRouteId === route.id;
              return (
                <div
                  key={route.id}
                  onClick={() => handleSelectRoute(route.id)}
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                      : "border-border bg-card hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-10 items-center justify-center rounded-xl font-black text-white text-base shadow-md shrink-0"
                      style={{ backgroundColor: route.color }}
                    >
                      {route.shortName}
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{route.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {route.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {routeVehicles.length > 0 ? (
                          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            {routeVehicles.length} {t("dart.map.liveVehicles")}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {t("dart.map.noGps")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow hover:bg-emerald-700 transition-colors shrink-0"
                  >
                    <Play className="size-3 fill-white" />
                    <span>{t("dart.map.track")}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Route Live Tracking Card Overlay (Transit App Style) */}
      {activeRoute && !showRoutePicker && (
        <div className="absolute bottom-3 left-3 right-3 z-20 rounded-2xl border-2 border-emerald-500 bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="flex size-7 items-center justify-center rounded-lg font-black text-xs text-white shrink-0 shadow"
                style={{ backgroundColor: activeRoute.color }}
              >
                {activeRoute.shortName}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">{activeRoute.name}</p>
                <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-400 animate-ping"></span>
                  {t("dart.map.followingLive")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedRouteId(null)}
              className="rounded-lg bg-white/10 p-1 text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
              title={t("dart.map.exitTracking")}
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              {primaryVehicle ? (
                <div className="text-xs font-medium text-slate-200">
                  <p className="font-bold text-emerald-300">
                    🚌 {t("dart.map.busEnRoutePrefix")} #{primaryVehicle.vehicle_id}{" "}
                    {t("dart.map.busEnRouteSuffix")}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {t("dart.map.coordinates")} {primaryVehicle.latitude?.toFixed(4)},{" "}
                    {primaryVehicle.longitude?.toFixed(4)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-300 font-medium">{t("dart.map.waitingGps")}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {primaryVehicle && (
                <button
                  type="button"
                  onClick={() => {
                    if (primaryVehicle.latitude != null && primaryVehicle.longitude != null) {
                      mapRef.current?.flyTo({
                        center: [primaryVehicle.longitude, primaryVehicle.latitude],
                        zoom: 15,
                        duration: 600,
                      });
                    }
                  }}
                  className="flex items-center gap-1 rounded-xl bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                >
                  <Crosshair className="size-3" />
                  <span>{t("dart.map.centerBus")}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowRoutePicker(true)}
                className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1 text-xs font-bold text-white border border-white/20 hover:bg-white/20 transition-colors"
              >
                <RotateCcw className="size-3" />
                <span>{t("dart.map.changeLine")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Status Badge */}
      {!activeRoute && !showRoutePicker && vehicles.length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-emerald-400 backdrop-blur-md shadow-md">
          <span className="size-2 animate-ping rounded-full bg-emerald-500"></span>
          <span>
            {vehicles.length} {t("dart.map.busesOnMap")}
          </span>
        </div>
      )}
    </div>
  );
}
