import type { ReactNode } from 'react';

/** Lightweight static table in the SkoolLedger style (no sorting/paging). */
export function SimpleTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: ReactNode[][];
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border/70 bg-[#fafbfc]">
            {headers.map((header, index) => (
              <th
                key={header || index}
                scope="col"
                className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a97a8]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[#eef1f4] last:border-0 hover:bg-[#fbfcfd]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-5 py-3.5 text-[12px] text-[#536178] tabular">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
