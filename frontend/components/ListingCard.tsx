"use client";

import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { money, photoSrc } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { ListingCard as Listing } from "@/lib/types";

/** `query` carries the searched dates/guests on to the detail page. */
export default function ListingCard({ listing, query = "" }: { listing: Listing; query?: string }) {
  const { isSaved, toggleSaved } = useSession();
  const [index, setIndex] = useState(0);
  const saved = isSaved(listing.id);
  const count = listing.photos.length;

  // The arrows and heart sit inside the link, so they must not trigger navigation.
  const act = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
  };
  const arrow = "absolute top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow hover:scale-105 hover:bg-white group-hover:block";

  return (
    <Link href={`/listings/${listing.id}${query ? `?${query}` : ""}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-200">
        {/* ponytail: plain <img>; photos come from any URL a host types, next/image needs an allow-list */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoSrc(listing.photos[index]?.url ?? "")} alt={listing.title} loading="lazy" className="h-full w-full object-cover" />
        {listing.host.is_superhost && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold shadow">Superhost</span>
        )}
        <button onClick={act(() => toggleSaved(listing.id))} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} aria-pressed={saved} className="absolute right-3 top-3 transition hover:scale-110">
          <Heart size={24} className={saved ? "fill-brand stroke-white" : "fill-black/40 stroke-white"} />
        </button>
        {index > 0 && (
          <button onClick={act(() => setIndex(index - 1))} aria-label="Previous photo" className={`${arrow} left-2`}>
            <ChevronLeft size={16} />
          </button>
        )}
        {index < count - 1 && (
          <button onClick={act(() => setIndex(index + 1))} aria-label="Next photo" className={`${arrow} right-2`}>
            <ChevronRight size={16} />
          </button>
        )}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {listing.photos.map((p, i) => (
            <span key={p.id} className={`h-1.5 w-1.5 rounded-full bg-white ${i === index ? "" : "opacity-50"}`} />
          ))}
        </div>
      </div>
      <div className="mt-3 text-[15px] leading-snug">
        <div className="flex justify-between gap-2">
          <h3 className="truncate font-semibold">{listing.city}, {listing.country}</h3>
          <span className="flex shrink-0 items-center gap-1">
            <Star size={13} className="fill-current" />
            {listing.rating ? listing.rating.toFixed(2) : "New"}
          </span>
        </div>
        <p className="truncate text-neutral-500">{listing.title}</p>
        <p className="text-neutral-500">{listing.beds} {listing.beds === 1 ? "bed" : "beds"} · {listing.property_type}</p>
        <p className="mt-1"><span className="font-semibold">{money(listing.price_per_night)}</span> night</p>
      </div>
    </Link>
  );
}
