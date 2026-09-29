const SENSITIVE_KEY = /password|token|secret|hash/i;
export const REDACTED = '[REDACTED]';

type Plain = Record<string, unknown>;

function normalise(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalise);
  if (value && typeof value === 'object') return redact(value as Plain);
  return value;
}

/** Deep-copies a value into JSON-safe form, masking anything credential-like. */
export function redact(values: Plain): Plain {
  const out: Plain = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    out[key] = SENSITIVE_KEY.test(key) ? REDACTED : normalise(value);
  }
  return out;
}

/**
 * Returns only the fields that changed between `before` and `after`,
 * limited to `fields`. Both results are `null` when nothing changed.
 */
export function diffValues<T extends Plain>(
  before: T,
  after: Partial<T>,
  fields: readonly (keyof T & string)[],
): { previousValues: Plain | null; newValues: Plain | null } {
  const previousValues: Plain = {};
  const newValues: Plain = {};

  for (const field of fields) {
    if (!(field in after)) continue;
    const a = normalise(before[field] ?? null);
    const b = normalise(after[field] ?? null);
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      previousValues[field] = a;
      newValues[field] = b;
    }
  }

  const changed = Object.keys(newValues).length > 0;
  return {
    previousValues: changed ? redact(previousValues) : null,
    newValues: changed ? redact(newValues) : null,
  };
}
