/**
 * Central helpers for scoping content by school.
 * Enforces strict isolation per school_id.
 */

export type CanonicalSchoolId = string;

/** Normalizes any string or object value into a school id string. */
export function normalizeSchoolId(value: unknown): string {
  if (value === null || value === undefined) return "lincoln";
  const raw = String(value).trim().toLowerCase();
  if (!raw || raw === "all" || raw === "district" || raw === "todas" || raw === "global") {
    return "lincoln";
  }
  if (
    raw.includes("lincoln") ||
    raw.includes("railsplitter") ||
    raw === "sch-lincoln" ||
    raw === "dmlincoln"
  ) {
    return "lincoln";
  }
  return raw;
}

/** Reads the school a record belongs to, falling back to default school if not specified. */
export function rowSchoolId(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "lincoln";
  const explicit = row["school_id"] ?? row["school"] ?? row["school_key"];
  if (explicit !== undefined && explicit !== null && String(explicit).trim().length > 0) {
    return normalizeSchoolId(explicit);
  }
  // Fallback: infer from descriptive fields
  for (const key of ["slug", "id", "name", "title"]) {
    const val = row[key];
    if (typeof val === "string" && (val.includes("lincoln") || val.includes("railsplitter"))) {
      return "lincoln";
    }
  }
  return "lincoln";
}

/**
 * Checks if a record belongs to a specific school view.
 * Strictly returns true ONLY if the record belongs to that school.
 */
export function belongsToSchool(
  row: Record<string, unknown> | null | undefined,
  schoolId: string | null | undefined,
): boolean {
  if (!row) return false;
  const target = normalizeSchoolId(schoolId);
  const owner = rowSchoolId(row);
  return owner === target;
}

/** Filters a list of records down strictly to those visible for the given school. */
export function filterBySchool<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  schoolId: string | null | undefined,
): T[] {
  const list = rows ?? [];
  const target = normalizeSchoolId(schoolId);
  return list.filter((row) => belongsToSchool(row, target));
}

/** Value to persist on a record for a given admin scope. */
export function schoolIdForStorage(scope: string | null | undefined): string {
  return normalizeSchoolId(scope);
}

/**
 * Strict scoping for content types.
 */
export function filterBySchoolStrict<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  schoolId: string | null | undefined,
): T[] {
  return filterBySchool(rows, schoolId);
}
