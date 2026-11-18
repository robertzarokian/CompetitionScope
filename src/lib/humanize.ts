// Keeps generated and canned text free of the punctuation that makes writing
// read as machine-made. Em dashes become commas, and number ranges written with
// an en dash become "to".
export function humanizeText(s: string): string {
  return s
    .replace(/(\d)\s*[–−]\s*(\$?\d)/g, "$1 to $2")
    .replace(/\s*[—―]\s*/g, ", ")
    .replace(/\s+–\s+/g, ", ")
    .replace(/,\s*,/g, ",");
}

export function humanizeDeep<T>(value: T): T {
  if (typeof value === "string") return humanizeText(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => humanizeDeep(v)) as unknown as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, humanizeDeep(v)])) as T;
  }
  return value;
}
