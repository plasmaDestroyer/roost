import Link from "next/link";
import type { ReactNode } from "react";
import { money, photoSrc } from "@/lib/api";
import { formatRange } from "@/lib/dates";
import type { Booking } from "@/lib/types";

/** One booking line. Trips shows the host; the host dashboard shows the guest. */
export default function BookingRow({ booking, showGuest, children }: { booking: Booking; showGuest?: boolean; children?: ReactNode }) {
  const { listing } = booking;
  const person = showGuest ? `Guest: ${booking.guest.name}` : `Hosted by ${listing.host.name}`;
  return (
    <li className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 p-4">
      <Link href={`/listings/${listing.id}`} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoSrc(listing.photos[0]?.url ?? "")} alt="" className="h-24 w-24 rounded-xl bg-neutral-200 object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{listing.title}</p>
        <p className="text-sm text-neutral-600">{listing.city}, {listing.country} · {person}</p>
        <p className="text-sm text-neutral-600">
          {formatRange(booking.check_in, booking.check_out)} · {booking.guests} {booking.guests === 1 ? "guest" : "guests"} · {money(booking.total)}
        </p>
        {booking.status === "cancelled" && <span className="mt-1 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold">Cancelled</span>}
      </div>
      <div className="flex gap-2">{children}</div>
    </li>
  );
}
