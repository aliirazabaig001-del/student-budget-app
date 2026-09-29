import type { AuditLogDto } from '@skoolledger/shared';

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Before → after table for an audit entry, plus request metadata. */
export function AuditDetails({ entry }: { entry: AuditLogDto }) {
  const fields = Array.from(
    new Set([...Object.keys(entry.previousValues ?? {}), ...Object.keys(entry.newValues ?? {})]),
  );
  const metadata = Object.entries(entry.metadata ?? {});

  return (
    <div className="grid gap-4 py-2 text-sm lg:grid-cols-[2fr_1fr]">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Changes
        </h4>
        {fields.length === 0 ? (
          <p className="text-muted-foreground">No field changes recorded for this event.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-4 font-medium">Field</th>
                <th className="py-1 pr-4 font-medium">Before</th>
                <th className="py-1 font-medium">After</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field} className="border-t border-border align-top">
                  <td className="py-1.5 pr-4 font-medium">{field}</td>
                  <td className="py-1.5 pr-4 text-muted-foreground line-through decoration-destructive/40">
                    {display(entry.previousValues?.[field])}
                  </td>
                  <td className="py-1.5">{display(entry.newValues?.[field])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Request
        </h4>
        <dl className="space-y-1 text-xs">
          {metadata.map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <dt className="min-w-24 text-muted-foreground">{key}</dt>
              <dd className="break-all font-mono">{display(value)}</dd>
            </div>
          ))}
          <div className="flex gap-2">
            <dt className="min-w-24 text-muted-foreground">userAgent</dt>
            <dd className="break-all">{entry.userAgent ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
