/**
 * Central helpers for scoping content by school.
 *
 * Canonical school ids: "lincoln" | "east".
 * A record whose school is empty/null/"all" is district-wide.
 * When "all" is active, all records from all schools and district are combined together.
 */

export type CanonicalSchoolId = "lincoln" | "east";

/** Normalizes any legacy or human value into a canonical school id, or null for district-wide. */
export function normalizeSchoolId(value: unknown): CanonicalSchoolId | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim().toLowerCase();
  if (
    !raw ||
    raw === "all" ||
    raw === "district" ||
    raw === "sch-all" ||
    raw === "todas" ||
    raw === "distrito" ||
    raw === "general"
  ) {
    return null;
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
  return null;
}

/** Reads the school a record belongs to, falling back to hints in its other fields. */
export function rowSchoolId(
  row: Record<string, unknown> | null | undefined,
): CanonicalSchoolId | null {
  if (!row) return null;
  const explicit = normalizeSchoolId(row["school_id"] ?? row["school"] ?? row["school_key"]);
  if (explicit) return explicit;
  // Fallback: infer from descriptive fields.
  for (const key of ["school_level", "slug", "id", "name", "title", "department", "location"]) {
    const inferred = normalizeSchoolId(row[key]);
    if (inferred) return inferred;
  }
  return null;
}

/**
 * Checks if a record belongs to a specific school view.
 * When schoolId is null or "all", returns true (shows everything together).
 * When schoolId is a specific school, strictly returns true ONLY if the record belongs to that school.
 */
export function belongsToSchool(
  row: Record<string, unknown> | null | undefined,
  schoolId: string | null | undefined,
): boolean {
  const target = normalizeSchoolId(schoolId);
  if (!target) return true; // "Todas (Distrito)" -> shows everything combined!
  const owner = rowSchoolId(row);
  return owner === target; // Separate strictly by school!
}

/** Filters a list of records down to those visible for the given school. */
export function filterBySchool<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  schoolId: string | null | undefined,
): T[] {
  const list = rows ?? [];
  const target = normalizeSchoolId(schoolId);
  if (!target) return list; // "Todas (Distrito)" -> all records combined
  return list.filter((row) => belongsToSchool(row, target));
}

/** Value to persist on a record for a given admin scope ("all" -> null). */
export function schoolIdForStorage(scope: string | null | undefined): CanonicalSchoolId | null {
  return normalizeSchoolId(scope);
}

/**
 * Strict scoping for content types that are fully duplicated per school.
 */
export function filterBySchoolStrict<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  schoolId: string | null | undefined,
): T[] {
  const list = rows ?? [];
  const target = normalizeSchoolId(schoolId);
  if (!target) return list;
  return list.filter((row) => rowSchoolId(row) === target);
}
