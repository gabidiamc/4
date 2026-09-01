/**
 * Central helpers for scoping content by school.
 * Enforces school isolation while allowing district-wide content and full admin visibility.
 */

export type CanonicalSchoolId = string;

/** Normalizes any string or object value into a school id string. */
export function normalizeSchoolId(value: unknown): string {
  if (value === null || value === undefined) return "all";
  const raw = String(value).trim().toLowerCase();
  if (
    !raw ||
    raw === "all" ||
    raw === "district" ||
    raw === "todas" ||
    raw === "global" ||
    raw === "*"
  ) {
    return "all";
  }
  if (
    raw.includes("lincoln") ||
    raw.includes("railsplitter") ||
    raw === "sch-lincoln" ||
    raw === "dmlincoln"
  ) {
    return "lincoln";
  }
  if (raw.includes("east") || raw.includes("scarlet") || raw === "sch-east" || raw === "dmeast") {
    return "east";
  }
  if (
    raw.includes("roosevelt") ||
    raw.includes("roughrider") ||
    raw === "sch-roosevelt" ||
    raw === "dmroosevelt"
  ) {
    return "roosevelt";
  }
  if (raw.includes("north") || raw.includes("polar") || raw === "sch-north" || raw === "dmnorth") {
    return "north";
  }
  if (
    raw.includes("hoover") ||
    raw.includes("husky") ||
    raw === "sch-hoover" ||
    raw === "dmhoover"
  ) {
    return "hoover";
  }
  if (raw.includes("central") || raw === "sch-central" || raw === "dmcentral") {
    return "central";
  }
  return raw;
}

/** Reads the school a record belongs to, falling back to "all" if not specified. */
export function rowSchoolId(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "all";
  const explicit = row["school_id"] ?? row["school"] ?? row["school_key"];
  if (explicit !== undefined && explicit !== null && String(explicit).trim().length > 0) {
    return normalizeSchoolId(explicit);
  }
  // Infer from descriptive fields
  for (const key of ["slug", "id", "name", "title"]) {
    const val = row[key];
    if (typeof val === "string") {
      const lower = val.toLowerCase();
      if (lower.includes("lincoln") || lower.includes("railsplitter")) return "lincoln";
      if (lower.includes("east") || lower.includes("scarlet")) return "east";
      if (lower.includes("roosevelt") || lower.includes("roughrider")) return "roosevelt";
      if (lower.includes("north") || lower.includes("polar")) return "north";
      if (lower.includes("hoover") || lower.includes("husky")) return "hoover";
      if (lower.includes("central")) return "central";
    }
  }
  return "all";
}

/**
 * Checks if a record belongs to a specific school view.
 * When viewing "all", returns true for all records.
 * When viewing a specific school, returns true if the record belongs to that school OR is district-wide ("all").
 */
export function belongsToSchool(
  row: Record<string, unknown> | null | undefined,
  schoolId: string | null | undefined,
): boolean {
  if (!row) return false;
  const target = normalizeSchoolId(schoolId);
  if (target === "all") return true;
  const owner = rowSchoolId(row);
  return owner === target || owner === "all" || owner === "district" || owner === "global";
}

/** Filters a list of records down strictly to those visible for the given school. */
export function filterBySchool<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  schoolId: string | null | undefined,
): T[] {
  const list = rows ?? [];
  const target = normalizeSchoolId(schoolId);
  if (target === "all") return list;
  return list.filter((row) => belongsToSchool(row, target));
}

/** Value to persist on a record for a given admin scope. */
export function schoolIdForStorage(scope: string | null | undefined): string {
  const normalized = normalizeSchoolId(scope);
  return normalized === "all" ? "all" : normalized;
}

/** Strict scoping for content types. */
export function filterBySchoolStrict<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  schoolId: string | null | undefined,
): T[] {
  return filterBySchool(rows, schoolId);
}
