"use client";

import { MapPin, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { DESTINATIONS } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { useDismiss } from "@/lib/hooks";
import Calendar from "./Calendar";
import GuestCounter from "./GuestCounter";

type Panel = "where" | "when" | "who" | null;

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [panel, setPanel] = useState<Panel>(null);
  const [location, setLocation] = useState(params.get("location") ?? "");
  const [checkIn, setCheckIn] = useState(params.get("check_in"));
  const [checkOut, setCheckOut] = useState(params.get("check_out"));
  const [guests, setGuests] = useState(Number(params.get("guests")) || 0);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, () => setPanel(null), panel !== null);

  function search(place = location) {
    // The URL is the single source of truth for the search; the home page reads it.
    const next = new URLSearchParams();
    if (place.trim()) next.set("location", place.trim());
    if (checkIn && checkOut) {
      next.set("check_in", checkIn);
      next.set("check_out", checkOut);
    }
    if (guests) next.set("guests", String(guests));
    setPanel(null);
    router.push(`/?${next}`);
  }

  const segment = (name: Panel, label: string, value: string) => (
    <button
      onClick={() => setPanel(panel === name ? null : name)}
      className={`min-w-0 flex-1 rounded-full px-4 py-2 text-left sm:px-6 ${panel === name ? "bg-white shadow-md" : "hover:bg-neutral-100"}`}
    >
      <span className="hidden text-xs font-semibold sm:block">{label}</span>
      <span className="block truncate text-sm text-neutral-500">{value}</span>
    </button>
  );

  return (
    <div ref={ref} className="relative w-full max-w-2xl">
      <div className={`flex items-center rounded-full border border-neutral-300 shadow-sm transition hover:shadow-md ${panel ? "bg-neutral-100" : "bg-white"}`}>
        {segment("where", "Where", location || "Search destinations")}
        <span className="h-6 w-px bg-neutral-300" />
        {segment("when", "When", checkIn && checkOut ? `${formatDate(checkIn)} – ${formatDate(checkOut)}` : "Add dates")}
        <span className="h-6 w-px bg-neutral-300" />
        {segment("who", "Who", guests ? `${guests} ${guests === 1 ? "guest" : "guests"}` : "Add guests")}
        <button onClick={() => search()} aria-label="Search" className="m-1.5 shrink-0 rounded-full bg-brand p-3 text-white hover:bg-brand-dark">
          <Search size={16} strokeWidth={3} />
        </button>
      </div>

      {panel && (
        <div className="absolute left-1/2 top-full z-50 mt-3 w-max max-w-[94vw] -translate-x-1/2 rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl">
          {panel === "where" && (
            <div className="w-72">
              <input
                autoFocus
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="City or country"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
              />
              <p className="mb-1 mt-4 text-xs font-semibold text-neutral-500">Suggested destinations</p>
              {DESTINATIONS.map((place) => (
                <button key={place} onClick={() => { setLocation(place); setPanel("when"); }} className="flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm hover:bg-neutral-100">
                  <span className="rounded-lg bg-neutral-100 p-2.5"><MapPin size={18} /></span>
                  {place}
                </button>
              ))}
            </div>
          )}
          {panel === "when" && (
            <div>
              <Calendar checkIn={checkIn} checkOut={checkOut} onChange={(start, end) => { setCheckIn(start); setCheckOut(end); }} />
              <button onClick={() => { setCheckIn(null); setCheckOut(null); }} className="mt-3 text-sm font-semibold underline">Clear dates</button>
            </div>
          )}
          {panel === "who" && (
            <div className="w-72">
              <GuestCounter label="Guests" hint="Ages 2 or above" value={guests} onChange={setGuests} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
