import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

/** Search box plus filter controls above a table. */
export function FilterBar({
  children,
  search,
  onSearch,
  placeholder = 'Search records',
}: {
  children?: ReactNode;
  search?: string;
  onSearch?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-border/70 p-4 md:flex-row md:items-center">
      <label className="flex h-9 w-full items-center gap-2 rounded-[7px] border border-input bg-card px-3 md:max-w-[300px]">
        <Search className="size-[15px] text-[#8c99aa]" aria-hidden />
        <span className="sr-only">{placeholder}</span>
        <input
          value={search}
          onChange={(event) => onSearch?.(event.target.value)}
          readOnly={!onSearch}
          className="w-full bg-transparent text-[12px] outline-none placeholder:text-[#9aa6b6]"
          placeholder={placeholder}
        />
      </label>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Styled native select used in filter bars. */
export function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <select
      aria-label={label}
      className="h-9 rounded-[7px] border border-input bg-card px-3 text-[11.5px] font-semibold text-[#526178]"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}
