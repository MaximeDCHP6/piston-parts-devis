"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Input, Select } from "@/components/ui/Field";

interface SelectFilterOption {
  value: string;
  label: string;
}

interface SelectFilter {
  key: string;
  label: string;
  options: SelectFilterOption[];
}

interface DateRangeFilter {
  fromKey: string;
  toKey: string;
}

export function QuickFilters({
  searchPlaceholder = "Rechercher…",
  searchParamKey = "q",
  selectFilters = [],
  showSearch = true,
  dateRange,
}: {
  searchPlaceholder?: string;
  searchParamKey?: string;
  selectFilters?: SelectFilter[];
  showSearch?: boolean;
  dateRange?: DateRangeFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get(searchParamKey) ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // Un changement de filtre invalide la pagination en cours (la page 5
    // d'une recherche précédente n'a aucun sens pour la nouvelle requête).
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function onQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam(searchParamKey, value), 250);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {showSearch && (
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="sm:max-w-xs"
        />
      )}
      {selectFilters.map((filter) => (
        <Select
          key={filter.key}
          defaultValue={searchParams.get(filter.key) ?? ""}
          onChange={(e) => updateParam(filter.key, e.target.value)}
          className="sm:max-w-[200px]"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      ))}
      {dateRange && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="Du"
            defaultValue={searchParams.get(dateRange.fromKey) ?? ""}
            onChange={(e) => updateParam(dateRange.fromKey, e.target.value)}
            className="sm:max-w-[160px]"
          />
          <span className="text-sm text-muted">→</span>
          <Input
            type="date"
            aria-label="Au"
            defaultValue={searchParams.get(dateRange.toKey) ?? ""}
            onChange={(e) => updateParam(dateRange.toKey, e.target.value)}
            className="sm:max-w-[160px]"
          />
        </div>
      )}
    </div>
  );
}
