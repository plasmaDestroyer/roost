"use client";

import { SlidersHorizontal } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

type Props = { active: string; onSelect: (slug: string) => void; filterCount: number; onOpenFilters: () => void };

export default function CategoryBar({ active, onSelect, filterCount, onOpenFilters }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div className="no-scrollbar flex flex-1 gap-8 overflow-x-auto">
        {CATEGORIES.map(({ slug, label, icon: Icon }) => (
          <button
            key={slug}
            onClick={() => onSelect(slug)}
            aria-pressed={active === slug}
            className={`flex shrink-0 flex-col items-center gap-2 border-b-2 pb-3 pt-4 text-xs font-semibold transition ${
              active === slug ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-900"
            }`}
          >
            <Icon size={24} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
      <button onClick={onOpenFilters} className={`relative flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${filterCount ? "border-2 border-neutral-900" : "border-neutral-300"}`}>
        <SlidersHorizontal size={16} />
        Filters
        {filterCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white">{filterCount}</span>
        )}
      </button>
    </div>
  );
}
