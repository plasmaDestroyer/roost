"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { money } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { useDismiss, useFetch } from "@/lib/hooks";
import type { DateRange, ListingDetail, Quote } from "@/lib/types";
import Calendar from "./Calendar";
import GuestCounter from "./GuestCounter";
import PriceBreakdown from "./PriceBreakdown";

type Props = {
  listing: ListingDetail;
  blocked: DateRange[];
  checkIn: string | null;
  checkOut: string | null;
  onDatesChange: (checkIn: string | null, checkOut: string | null) => void;
  guests: number;
  onGuestsChange: (guests: number) => void;
};

export default function BookingCard({ listing, blocked, checkIn, checkOut, onDatesChange, guests, onGuestsChange }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<"dates" | "guests" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, () => setOpen(null), open !== null);

  const ready = !!checkIn && !!checkOut;
  const { data: quote } = useFetch<Quote>(ready ? `/listings/${listing.id}/quote?check_in=${checkIn}&check_out=${checkOut}` : null);

  function reserve() {
    if (!ready) return setOpen("dates");
    router.push(`/book/${listing.id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`);
  }

  const cell = "flex-1 p-3 text-left";
  const label = "block text-[10px] font-bold uppercase";

  return (
    <div ref={ref} className="relative rounded-2xl border border-neutral-300 p-6 shadow-xl">
      <p><span className="text-2xl font-semibold">{money(listing.price_per_night)}</span> night</p>

      <div className="mt-5 rounded-xl border border-neutral-400">
        <div className="flex divide-x divide-neutral-400 border-b border-neutral-400">
          <button className={cell} onClick={() => setOpen("dates")}>
            <span className={label}>Check-in</span>
            <span className="text-sm">{checkIn ? formatDate(checkIn) : "Add date"}</span>
          </button>
          <button className={cell} onClick={() => setOpen("dates")}>
            <span className={label}>Checkout</span>
            <span className="text-sm">{checkOut ? formatDate(checkOut) : "Add date"}</span>
          </button>
        </div>
        <button className={`${cell} flex w-full items-center justify-between`} onClick={() => setOpen(open === "guests" ? null : "guests")}>
          <span>
            <span className={label}>Guests</span>
            <span className="text-sm">{guests} {guests === 1 ? "guest" : "guests"}</span>
          </span>
          <ChevronDown size={18} />
        </button>
      </div>

      {open === "guests" && (
        <div className="absolute inset-x-6 z-20 mt-1 rounded-xl border border-neutral-200 bg-white p-4 shadow-xl">
          <GuestCounter label="Guests" hint={`This place has a maximum of ${listing.max_guests} guests`} value={guests} min={1} max={listing.max_guests} onChange={onGuestsChange} />
        </div>
      )}
      {open === "dates" && (
        <div className="absolute right-0 top-16 z-20 w-max max-w-[92vw] rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
          <Calendar checkIn={checkIn} checkOut={checkOut} blocked={blocked} onChange={onDatesChange} />
          <div className="mt-3 flex justify-end gap-4">
            <button onClick={() => onDatesChange(null, null)} className="text-sm font-semibold underline">Clear dates</button>
            <button onClick={() => setOpen(null)} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">Close</button>
          </div>
        </div>
      )}

      <button onClick={reserve} className="mt-4 w-full rounded-lg bg-brand py-3.5 font-semibold text-white hover:bg-brand-dark">
        {ready ? "Reserve" : "Check availability"}
      </button>

      {ready && quote && (
        <>
          <p className="my-4 text-center text-sm text-neutral-500">You won&apos;t be charged yet</p>
          <PriceBreakdown quote={quote} />
        </>
      )}
    </div>
  );
}
