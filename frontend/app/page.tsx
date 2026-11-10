"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CategoryBar from "@/components/CategoryBar";
import FiltersModal, { FILTER_KEYS } from "@/components/FiltersModal";
import ListingCard from "@/components/ListingCard";
import { api } from "@/lib/api";
import type { ListingCard as Listing, Page } from "@/lib/types";

const PAGE_SIZE = 12;

export default function ExplorePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = params.toString();

  const navigate = (next: URLSearchParams) => router.push(`/?${next}`, { scroll: false });

  function selectCategory(slug: string) {
    const next = new URLSearchParams(params);
    if (slug) next.set("category", slug);
    else next.delete("category");
    navigate(next);
  }

  const filterCount = FILTER_KEYS.filter((key) => params.has(key)).length;
  // Dates and guests go along to the detail page so the booking card is pre-filled.
  const carry = new URLSearchParams();
  for (const key of ["check_in", "check_out", "guests"]) {
    const value = params.get(key);
    if (value) carry.set(key, value);
  }

  return (
    <div className="mx-auto max-w-[1760px] px-4 md:px-10">
      <div className="sticky top-20 z-30 bg-white">
        <CategoryBar active={params.get("category") ?? ""} onSelect={selectCategory} filterCount={filterCount} onOpenFilters={() => setFiltersOpen(true)} />
      </div>
      {/* key: a new search starts again from page 1 with an empty list */}
      <Results key={query} query={query} carry={carry.toString()} onReset={() => router.push("/")} />
      {filtersOpen && (
        <FiltersModal params={params} onClose={() => setFiltersOpen(false)} onApply={(next) => { setFiltersOpen(false); navigate(next); }} />
      )}
    </div>
  );
}

function Results({ query, carry, onReset }: { query: string; carry: string; onReset: () => void }) {
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState<number | null>(null); // null until the first page arrives
  const [page, setPage] = useState(1);
  const [loadedPage, setLoadedPage] = useState(0);
  const [error, setError] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);

  const loading = loadedPage < page && !error;
  const hasMore = total !== null && items.length < total;

  useEffect(() => {
    let stale = false;
    api<Page>(`/listings?${query}&page=${page}&page_size=${PAGE_SIZE}`).then(
      (res) => {
        if (stale) return;
        setItems((old) => (page === 1 ? res.items : [...old, ...res.items]));
        setTotal(res.total);
        setLoadedPage(page);
      },
      (e: Error) => !stale && setError(e.message),
    );
    return () => {
      stale = true;
    };
  }, [query, page]);

  // Infinite scroll: load the next page when the marker below the grid comes into view.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || loading || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setPage((p) => p + 1), { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, hasMore]);

  if (error) return <p className="py-24 text-center text-neutral-500">Could not load listings: {error}</p>;

  if (total === 0) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-semibold">No exact matches</h2>
        <p className="mt-2 text-neutral-500">Try changing or removing some of your filters, or adjusting your dates.</p>
        <button onClick={onReset} className="mt-6 rounded-lg border border-neutral-900 px-5 py-3 font-semibold hover:bg-neutral-100">Remove all filters</button>
      </div>
    );
  }

  return (
    <>
      {total !== null && query && <p className="pt-4 text-sm font-semibold">{total} {total === 1 ? "place" : "places"}</p>}
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 pt-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.map((listing) => <ListingCard key={listing.id} listing={listing} query={carry} />)}
        {loading && Array.from({ length: PAGE_SIZE }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square rounded-2xl bg-neutral-200" />
            <div className="mt-3 h-4 w-2/3 rounded bg-neutral-200" />
            <div className="mt-2 h-4 w-1/2 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
      <div ref={sentinel} className="h-px" />
    </>
  );
}
