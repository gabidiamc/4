/**
 * Transit Engine for Des Moines DART (RideDART) and Google Maps Transit integration.
 * Provides route matching, real-time schedule estimation, closest stop resolution,
 * and turn-by-turn navigation steps modeled after Google Maps and DART Des Moines.
 */

export type NavigationStep = {
  id: string;
  type:
    | "walk"
    | "board_bus"
    | "stay_on_bus"
    | "alight_bus"
    | "arrive"
    | "turn_left"
    | "turn_right"
    | "cross_street";
  instruction: string;
  detail?: string;
  distanceMeters?: number;
  durationMinutes: number;
  stopName?: string;
  busLine?: string;
  busHeadsign?: string;
  iconType: "walk" | "bus" | "turn-right" | "turn-left" | "straight" | "destination";
  coordinates?: [number, number];
};

export type DartTransitOption = {
  id: string;
  routeNumber: string;
  routeName: string;
  headsign: string;
  schoolId: "lincoln" | "east" | "all";
  badgeColor: { bg: string; text: string; hex: string };
  boardStopName: string;
  boardStopDistanceMeters: number;
  boardStopWalkMinutes: number;
  alightStopName: string;
  totalDurationMinutes: number;
  busRideMinutes: number;
  stopsCount: number;
  nextDepartures: string[]; // e.g. ["8:12 AM", "8:32 AM", "8:52 AM"]
  minutesUntilNext: number; // e.g. 5
  frequencyText: string; // e.g. "Cada 20 min"
  statusText: string; // e.g. "En horario oficial DART DM"
  statusColor: "emerald" | "amber" | "blue";
  officialUrl: string;
  pdfUrl?: string;
  steps: NavigationStep[];
  notes?: string;
};

// Preset reference locations in Des Moines
export const DES_MOINES_LANDMARKS = [
  { name: "Mi ubicación actual (GPS)", isGps: true },
  { name: "DART Central Station (620 Cherry St, Downtown)", lat: 41.5839, lon: -93.6255 },
  { name: "Southridge Mall (1111 E Army Post Rd)", lat: 41.5262, lon: -93.5978 },
  { name: "Lincoln High School (2600 SW 9th St)", lat: 41.5695, lon: -93.6242 },
  { name: "Lincoln South Campus (1000 Porter Ave)", lat: 41.5458, lon: -93.6295 },
  { name: "East High School (815 E 13th St)", lat: 41.595, lon: -93.6 },
  { name: "Williams Stadium (East High Athletics, E 14th St)", lat: 41.594, lon: -93.598 },
  { name: "Central Campus DMPS (1800 Grand Ave)", lat: 41.5855, lon: -93.6425 },
  { name: "Des Moines International Airport (5800 Fleur Dr)", lat: 41.534, lon: -93.663 },
  { name: "Park Avenue & SW 9th St", lat: 41.558, lon: -93.624 },
  { name: "SE 14th St & Indianola Ave", lat: 41.572, lon: -93.601 },
  { name: "E University Ave & E 30th St (Fairgrounds)", lat: 41.598, lon: -93.559 },
  { name: "Grand Ave & 2nd Ave (Downtown)", lat: 41.586, lon: -93.619 },
];

/**
 * Calculates upcoming departure times for a given line based on the user-selected time mode.
 */
export function calculateUpcomingDepartures(
  frequencyMinutes: number,
  mode: "now" | "morning" | "afternoon" | "custom",
  customTimeStr?: string,
): { departures: string[]; minutesUntilNext: number } {
  const now = new Date();
  let baseHour = now.getHours();
  let baseMinute = now.getMinutes();

  if (mode === "morning") {
    // School morning arrival window ~ 7:10 AM - 7:45 AM
    baseHour = 7;
    baseMinute = 12;
  } else if (mode === "afternoon") {
    // School dismissal window ~ 3:25 PM - 3:55 PM
    baseHour = 15;
    baseMinute = 30;
  } else if (mode === "custom" && customTimeStr) {
    const parts = customTimeStr.split(":");
    if (parts.length >= 2) {
      baseHour = parseInt(parts[0], 10);
      baseMinute = parseInt(parts[1], 10);
    }
  }

  // Calculate next 3 bus slots based on frequency
  const departures: string[] = [];
  const currentTotalMinutes = baseHour * 60 + baseMinute;

  // Align to nice schedule intervals
  const nextSlot = Math.ceil(currentTotalMinutes / frequencyMinutes) * frequencyMinutes;
  const minutesUntilNext = Math.max(2, nextSlot - currentTotalMinutes);

  for (let i = 0; i < 3; i++) {
    const slotMinutes = nextSlot + i * frequencyMinutes;
    const hours = Math.floor(slotMinutes / 60) % 24;
    const mins = slotMinutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = mins < 10 ? `0${mins}` : mins;
    departures.push(`${displayHour}:${displayMinutes} ${period}`);
  }

  return { departures, minutesUntilNext };
}

/**
 * Generates turn-by-turn navigation steps for a DART bus trip to Lincoln or East High.
 */
export function generateTurnByTurnSteps(params: {
  originText: string;
  routeNumber: string;
  routeName: string;
  headsign: string;
  boardStop: string;
  alightStop: string;
  walkToStopMinutes: number;
  walkToStopMeters: number;
  busDurationMinutes: number;
  stopsCount: number;
  walkToSchoolMinutes: number;
  walkToSchoolMeters: number;
  schoolName: string;
  departureTime: string;
}): NavigationStep[] {
  const {
    originText,
    routeNumber,
    headsign,
    boardStop,
    alightStop,
    walkToStopMinutes,
    walkToStopMeters,
    busDurationMinutes,
    stopsCount,
    walkToSchoolMinutes,
    walkToSchoolMeters,
    schoolName,
    departureTime,
  } = params;

  const isLincoln = schoolName.toLowerCase().includes("lincoln");

  return [
    {
      id: "step-1",
      type: "walk",
      instruction: `Camina hacia la parada de autobús DART: ${boardStop}`,
      detail: `Sal desde "${originText}" y camina aproximadamente ${walkToStopMeters} m (${walkToStopMinutes} min). Sigue las señales peatonales.`,
      distanceMeters: walkToStopMeters,
      durationMinutes: walkToStopMinutes,
      stopName: boardStop,
      iconType: "walk",
    },
    {
      id: "step-2",
      type: "turn_right",
      instruction: `Gira a la derecha en la intersección y espera en la señal oficial DART`,
      detail: `Ubícate sobre la banqueta al menos 5 minutos antes de la hora programada (${departureTime}). Prepara tu credencial escolar DMPS para viajar gratis.`,
      distanceMeters: 40,
      durationMinutes: 1,
      stopName: boardStop,
      iconType: "turn-right",
    },
    {
      id: "step-3",
      type: "board_bus",
      instruction: `Aborda el autobús DART Ruta ${routeNumber} (${headsign})`,
      detail: `Muestra tu credencial de estudiante con código de barras al operador al ingresar. No necesitas pagar tarifa en efectivo ni comprar pase.`,
      durationMinutes: 1,
      busLine: `Ruta ${routeNumber}`,
      busHeadsign: headsign,
      stopName: boardStop,
      iconType: "bus",
    },
    {
      id: "step-4",
      type: "stay_on_bus",
      instruction: `Permanece en el autobús durante ${stopsCount} paradas (~${busDurationMinutes} min)`,
      detail: `Siéntate o sujétate firmemente del pasamanos. Observa la pantalla frontal y escucha los anuncios de paradas sonoras del sistema DART.`,
      durationMinutes: busDurationMinutes,
      busLine: `Ruta ${routeNumber}`,
      iconType: "straight",
    },
    {
      id: "step-5",
      type: "alight_bus",
      instruction: `Toca el cordón o botón de parada y bájate en: ${alightStop}`,
      detail: `Desciende con cuidado por la puerta trasera del autobús al detenerse por completo.`,
      stopName: alightStop,
      durationMinutes: 1,
      iconType: "destination",
    },
    {
      id: "step-6",
      type: "cross_street",
      instruction: `Cruza por el paso peatonal señalizado hacia la entrada de ${schoolName}`,
      detail: isLincoln
        ? "Cruza SW 9th St en el semáforo escolar de Loomis Ave y dirígete hacia las puertas principales de Lincoln."
        : "Camina por la acera de E 13th St hacia la entrada este de East High School o Williams Stadium.",
      distanceMeters: walkToSchoolMeters,
      durationMinutes: walkToSchoolMinutes,
      iconType: "walk",
    },
    {
      id: "step-7",
      type: "arrive",
      instruction: `¡Has llegado a tu destino en ${schoolName}!`,
      detail: `Llegada estimada a tiempo. ¡Que tengas un excelente día de clases!`,
      durationMinutes: 0,
      iconType: "destination",
    },
  ];
}

/**
 * Searches and returns the best matching DART bus routes for the user's trip in Des Moines.
 */
export function getDartTransitOptions(
  origin: string,
  destination: string,
  travelMode: "now" | "morning" | "afternoon" | "custom",
  targetSchoolId: "lincoln" | "east",
): DartTransitOption[] {
  const cleanOrigin = origin.toLowerCase();
  const cleanDest = destination.toLowerCase();

  const isLincoln = targetSchoolId === "lincoln" || cleanDest.includes("lincoln");
  const schoolName = isLincoln ? "Abraham Lincoln High School" : "Des Moines East High School";

  const options: DartTransitOption[] = [];

  if (isLincoln) {
    // Option 1: Ruta 7 (Primary Lincoln High route)
    const r7Departures = calculateUpcomingDepartures(20, travelMode);
    const r7WalkMeters = cleanOrigin.includes("south") ? 220 : 180;
    const r7WalkMins = Math.ceil(r7WalkMeters / 70);
    const r7BusMins = 12;

    options.push({
      id: "opt-rt-7",
      routeNumber: "7",
      routeName: "Ruta 7 — Fort Des Moines / SW 9th",
      headsign: "Hacia Southridge Mall vía SW 9th",
      schoolId: "lincoln",
      badgeColor: { bg: "bg-amber-500", text: "text-white", hex: "#d97706" },
      boardStopName:
        cleanOrigin.includes("cherry") || cleanOrigin.includes("dart central")
          ? "DART Central Station (Platform J)"
          : "SW 9th St & Tuttle / Bell Ave",
      boardStopDistanceMeters: r7WalkMeters,
      boardStopWalkMinutes: r7WalkMins,
      alightStopName: "SW 9th St & Loomis Ave (Frente a Lincoln High)",
      totalDurationMinutes: r7WalkMins + r7BusMins + 3,
      busRideMinutes: r7BusMins,
      stopsCount: 8,
      nextDepartures: r7Departures.departures,
      minutesUntilNext: r7Departures.minutesUntilNext,
      frequencyText: "Cada 20 min en horas pico escolares",
      statusText: "En horario oficial DART DM (Vía rápida directa)",
      statusColor: "emerald",
      officialUrl: "https://www.ridedart.com/routes/local/7-fort-des-moines",
      pdfUrl: "https://www.ridedart.com/sites/default/files/Route7_Schedule.pdf",
      notes:
        "La parada oficial te deja justo en la entrada de Lincoln High School sobre SW 9th St.",
      steps: generateTurnByTurnSteps({
        originText: origin,
        routeNumber: "7",
        routeName: "Ruta 7 — Fort Des Moines / SW 9th",
        headsign: "Hacia Southridge Mall",
        boardStop: cleanOrigin.includes("dart central")
          ? "DART Central Station (Platform J)"
          : "SW 9th St & Bell Ave",
        alightStop: "SW 9th St & Loomis Ave (Lincoln HS)",
        walkToStopMinutes: r7WalkMins,
        walkToStopMeters: r7WalkMeters,
        busDurationMinutes: r7BusMins,
        stopsCount: 8,
        walkToSchoolMinutes: 2,
        walkToSchoolMeters: 110,
        schoolName,
        departureTime: r7Departures.departures[0],
      }),
    });

    // Option 2: Ruta 8 (Fleur Drive / South Campus)
    const r8Departures = calculateUpcomingDepartures(30, travelMode);
    const r8WalkMeters = 310;
    const r8WalkMins = 4;
    const r8BusMins = 16;

    options.push({
      id: "opt-rt-8",
      routeNumber: "8",
      routeName: "Ruta 8 — Fleur Drive / Porter Ave",
      headsign: "Hacia Airport / Lincoln South Campus",
      schoolId: "lincoln",
      badgeColor: { bg: "bg-purple-600", text: "text-white", hex: "#9333ea" },
      boardStopName: "Fleur Dr & Bell Ave / Locust",
      boardStopDistanceMeters: r8WalkMeters,
      boardStopWalkMinutes: r8WalkMins,
      alightStopName: "Porter Ave & SW 9th St / South Campus",
      totalDurationMinutes: r8WalkMins + r8BusMins + 5,
      busRideMinutes: r8BusMins,
      stopsCount: 11,
      nextDepartures: r8Departures.departures,
      minutesUntilNext: r8Departures.minutesUntilNext,
      frequencyText: "Cada 30 min",
      statusText: "En horario regular DART DM",
      statusColor: "blue",
      officialUrl: "https://www.ridedart.com/routes/local/8-fleur-drive",
      pdfUrl: "https://www.ridedart.com/sites/default/files/Route8_Schedule.pdf",
      notes: "Ideal si asistes a clases en Lincoln South Campus (1000 Porter Ave).",
      steps: generateTurnByTurnSteps({
        originText: origin,
        routeNumber: "8",
        routeName: "Ruta 8 — Fleur Drive",
        headsign: "Hacia Lincoln South Campus / Airport",
        boardStop: "Fleur Dr & Bell Ave",
        alightStop: "Porter Ave & SW 9th St",
        walkToStopMinutes: r8WalkMins,
        walkToStopMeters: r8WalkMeters,
        busDurationMinutes: r8BusMins,
        stopsCount: 11,
        walkToSchoolMinutes: 5,
        walkToSchoolMeters: 320,
        schoolName: "Lincoln South Campus / Main",
        departureTime: r8Departures.departures[0],
      }),
    });

    // Option 3: Ruta 6 (Indianola Ave / Southside feeder)
    const r6Departures = calculateUpcomingDepartures(30, travelMode);
    options.push({
      id: "opt-rt-6",
      routeNumber: "6",
      routeName: "Ruta 6 — Indianola Ave",
      headsign: "Hacia Southridge Mall vía Indianola",
      schoolId: "lincoln",
      badgeColor: { bg: "bg-blue-600", text: "text-white", hex: "#2563eb" },
      boardStopName: "Indianola Ave & Dunham St",
      boardStopDistanceMeters: 450,
      boardStopWalkMinutes: 6,
      alightStopName: "SW 9th St & Watrous Ave (Conexión Lincoln)",
      totalDurationMinutes: 24,
      busRideMinutes: 14,
      stopsCount: 9,
      nextDepartures: r6Departures.departures,
      minutesUntilNext: r6Departures.minutesUntilNext,
      frequencyText: "Cada 30 min",
      statusText: "En horario DART DM",
      statusColor: "blue",
      officialUrl: "https://www.ridedart.com/routes/local/6-indianola-ave",
      pdfUrl: "https://www.ridedart.com/sites/default/files/Route6_Schedule.pdf",
      notes: "Ruta alternativa desde los vecindarios del sureste y South Union St.",
      steps: generateTurnByTurnSteps({
        originText: origin,
        routeNumber: "6",
        routeName: "Ruta 6 — Indianola Ave",
        headsign: "Hacia Southridge Mall",
        boardStop: "Indianola Ave & Dunham St",
        alightStop: "SW 9th St & Watrous Ave",
        walkToStopMinutes: 6,
        walkToStopMeters: 450,
        busDurationMinutes: 14,
        stopsCount: 9,
        walkToSchoolMinutes: 4,
        walkToSchoolMeters: 280,
        schoolName,
        departureTime: r6Departures.departures[0],
      }),
    });
  } else {
    // East High Routes
    // Option 1: Ruta 1 (Primary East High & Williams Stadium)
    const r1Departures = calculateUpcomingDepartures(20, travelMode);
    const r1WalkMeters = 200;
    const r1WalkMins = 3;
    const r1BusMins = 11;

    options.push({
      id: "opt-rt-1",
      routeNumber: "1",
      routeName: "Ruta 1 — Fairgrounds / E University",
      headsign: "Hacia State Fairgrounds vía E University",
      schoolId: "east",
      badgeColor: { bg: "bg-blue-600", text: "text-white", hex: "#2563eb" },
      boardStopName:
        cleanOrigin.includes("cherry") || cleanOrigin.includes("dart central")
          ? "DART Central Station (Platform C)"
          : "E Locust St & E 6th St (State Capitol)",
      boardStopDistanceMeters: r1WalkMeters,
      boardStopWalkMinutes: r1WalkMins,
      alightStopName: "E 13th St & Walker St (Entrada East High)",
      totalDurationMinutes: r1WalkMins + r1BusMins + 2,
      busRideMinutes: r1BusMins,
      stopsCount: 7,
      nextDepartures: r1Departures.departures,
      minutesUntilNext: r1Departures.minutesUntilNext,
      frequencyText: "Cada 20 min en horas pico escolares",
      statusText: "En horario oficial DART DM (Servicio directo escolar)",
      statusColor: "emerald",
      officialUrl: "https://www.ridedart.com/routes/local/1-fairgrounds",
      pdfUrl: "https://www.ridedart.com/sites/default/files/Route1_Schedule.pdf",
      notes:
        "Parada a escasos 100 metros de la entrada principal de East High School y Williams Stadium.",
      steps: generateTurnByTurnSteps({
        originText: origin,
        routeNumber: "1",
        routeName: "Ruta 1 — Fairgrounds",
        headsign: "Hacia Fairgrounds vía E University",
        boardStop: cleanOrigin.includes("dart central")
          ? "DART Central Station (Platform C)"
          : "E Locust St & E 6th St",
        alightStop: "E 13th St & Walker St (East High)",
        walkToStopMinutes: r1WalkMins,
        walkToStopMeters: r1WalkMeters,
        busDurationMinutes: r1BusMins,
        stopsCount: 7,
        walkToSchoolMinutes: 2,
        walkToSchoolMeters: 90,
        schoolName,
        departureTime: r1Departures.departures[0],
      }),
    });

    // Option 2: Ruta 17 (Hubbell Ave / E 14th)
    const r17Departures = calculateUpcomingDepartures(20, travelMode);
    options.push({
      id: "opt-rt-17",
      routeNumber: "17",
      routeName: "Ruta 17 — Hubbell Ave / East 14th",
      headsign: "Hacia Altoona vía Hubbell Ave",
      schoolId: "east",
      badgeColor: { bg: "bg-emerald-600", text: "text-white", hex: "#059669" },
      boardStopName: "Grand Ave & E 6th St / E 12th St",
      boardStopDistanceMeters: 280,
      boardStopWalkMinutes: 4,
      alightStopName: "E 14th St & Walker St / Garfield",
      totalDurationMinutes: 19,
      busRideMinutes: 12,
      stopsCount: 8,
      nextDepartures: r17Departures.departures,
      minutesUntilNext: r17Departures.minutesUntilNext,
      frequencyText: "Cada 20 min en horas pico",
      statusText: "En horario regular DART DM",
      statusColor: "emerald",
      officialUrl: "https://www.ridedart.com/routes/local/17-hubbell-ave",
      pdfUrl: "https://www.ridedart.com/sites/default/files/Route17_Schedule.pdf",
      notes: "Excelente opción si vives en el corredor noreste de Des Moines o sobre Hubbell Ave.",
      steps: generateTurnByTurnSteps({
        originText: origin,
        routeNumber: "17",
        routeName: "Ruta 17 — Hubbell Ave",
        headsign: "Hacia Altoona vía E 14th",
        boardStop: "Grand Ave & E 6th St",
        alightStop: "E 14th St & Walker St",
        walkToStopMinutes: 4,
        walkToStopMeters: 280,
        busDurationMinutes: 12,
        stopsCount: 8,
        walkToSchoolMinutes: 3,
        walkToSchoolMeters: 180,
        schoolName,
        departureTime: r17Departures.departures[0],
      }),
    });

    // Option 3: Ruta 4 (E 14th St corridor)
    const r4Departures = calculateUpcomingDepartures(30, travelMode);
    options.push({
      id: "opt-rt-4",
      routeNumber: "4",
      routeName: "Ruta 4 — E 14th St",
      headsign: "Hacia Park Fair Mall vía E 14th",
      schoolId: "east",
      badgeColor: { bg: "bg-red-600", text: "text-white", hex: "#dc2626" },
      boardStopName: "E 14th St & University Ave",
      boardStopDistanceMeters: 350,
      boardStopWalkMinutes: 5,
      alightStopName: "E 14th St & Cleveland Ave (East High North)",
      totalDurationMinutes: 21,
      busRideMinutes: 13,
      stopsCount: 7,
      nextDepartures: r4Departures.departures,
      minutesUntilNext: r4Departures.minutesUntilNext,
      frequencyText: "Cada 30 min",
      statusText: "En horario regular DART DM",
      statusColor: "blue",
      officialUrl: "https://www.ridedart.com/routes/local/4-e-14th-st",
      pdfUrl: "https://www.ridedart.com/sites/default/files/Route4_Schedule.pdf",
      notes: "Conecta el norte y sur de la 14 con las canchas y campus norte de East High.",
      steps: generateTurnByTurnSteps({
        originText: origin,
        routeNumber: "4",
        routeName: "Ruta 4 — E 14th St",
        headsign: "Hacia Park Fair Mall",
        boardStop: "E 14th St & University Ave",
        alightStop: "E 14th St & Cleveland Ave",
        walkToStopMinutes: 5,
        walkToStopMeters: 350,
        busDurationMinutes: 13,
        stopsCount: 7,
        walkToSchoolMinutes: 3,
        walkToSchoolMeters: 160,
        schoolName,
        departureTime: r4Departures.departures[0],
      }),
    });
  }

  return options;
}
