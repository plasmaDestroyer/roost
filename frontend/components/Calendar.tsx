"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { fromISO, toISO, today as todayISO } from "@/lib/dates";
import type { DateRange } from "@/lib/types";

type Props = {
  checkIn: string | null;
  checkOut: string | null;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  blocked?: DateRange[]; // existing bookings; check_out is exclusive
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Two-month date-range picker (one month on small screens). */
export default function Calendar({ checkIn, checkOut, onChange, blocked = [] }: Props) {
  const today = todayISO();
  const [cursor, setCursor] = useState(() => {
    const d = fromISO(checkIn ?? today);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const isBooked = (day: string) => blocked.some((b) => b.check_in <= day && day < b.check_out);
  const canStart = (day: string) => day >= today && !isBooked(day);

  const pickingEnd = !!checkIn && !checkOut;
  // A stay cannot jump over another booking, so the last possible
  // check-out is the day the next booking checks in.
  const lastCheckOut = pickingEnd
    ? blocked.map((b) => b.check_in).filter((d) => d > checkIn).sort()[0]
    : undefined;
  const canEnd = (day: string) => pickingEnd && day > checkIn && (!lastCheckOut || day <= lastCheckOut);

  function pick(day: string) {
    if (canEnd(day)) onChange(checkIn, day);
    else if (canStart(day)) onChange(day, null); // start a new range
  }

  const move = (by: number) => {
    const d = new Date(cursor.year, cursor.month + by, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };
  const atFirstMonth = toISO(new Date(cursor.year, cursor.month, 1)) <= today;

  return (
    <div className="relative select-none">
      <button onClick={() => move(-1)} disabled={atFirstMonth} aria-label="Previous month" className="absolute left-0 top-0 rounded-full p-2 hover:bg-neutral-100 disabled:opacity-25">
        <ChevronLeft size={18} />
      </button>
      <button onClick={() => move(1)} aria-label="Next month" className="absolute right-0 top-0 rounded-full p-2 hover:bg-neutral-100">
        <ChevronRight size={18} />
      </button>
      <div className="flex justify-center gap-10">
        {[0, 1].map((offset) => {
          const first = new Date(cursor.year, cursor.month + offset, 1);
          const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
          const days = Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(first.getFullYear(), first.getMonth(), i + 1)));
          return (
            <div key={offset} className={offset === 1 ? "hidden md:block" : ""}>
              <p className="mb-4 py-1.5 text-center font-semibold">
                {first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <div className="grid grid-cols-7 text-center text-sm">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="pb-2 text-xs font-medium text-neutral-500">{w}</span>
                ))}
                {/* empty cells so day 1 lands under the right weekday */}
                {Array.from({ length: first.getDay() }, (_, i) => <span key={i} />)}
                {days.map((day) => {
                  const selected = day === checkIn || day === checkOut;
                  const inRange = !!checkIn && !!checkOut && day > checkIn && day < checkOut;
                  const enabled = canEnd(day) || canStart(day);
                  return (
                    <button
                      key={day}
                      disabled={!enabled}
                      onClick={() => pick(day)}
                      aria-label={day}
                      aria-pressed={selected}
                      className={`h-10 w-10 sm:h-11 sm:w-11 ${inRange ? "bg-neutral-100" : ""} ${
                        selected
                          ? "rounded-full bg-neutral-900 font-semibold text-white"
                          : enabled
                            ? "rounded-full font-medium hover:border hover:border-neutral-900"
                            : "text-neutral-300 line-through"
                      }`}
                    >
                      {Number(day.slice(8))}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
