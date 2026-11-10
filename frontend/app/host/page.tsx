"use client";

import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import BookingRow from "@/components/BookingRow";
import { api, money, photoSrc } from "@/lib/api";
import { today } from "@/lib/dates";
import { useFetch } from "@/lib/hooks";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";
import type { Booking, ListingCard } from "@/lib/types";

export default function HostDashboardPage() {
  const { user, becomeHost } = useSession();
  const toast = useToast();
  const isHost = !!user?.is_host;
  const { data: listings, error: listingsError, reload: reloadListings } = useFetch<ListingCard[]>(isHost ? "/host/listings" : null);
  const { data: bookings, error: bookingsError, reload: reloadBookings } = useFetch<Booking[]>(isHost ? "/host/bookings" : null);
  const error = listingsError ?? bookingsError;

  if (!user) return <p className="py-24 text-center text-neutral-500">Loading…</p>;

  if (!isHost) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold">Roost it. Earn from your place.</h1>
        <p className="mt-4 text-neutral-600">{user.name}, you use a guest account. Guests can book stays; hosts can also publish and manage listings.</p>
        <button onClick={() => becomeHost().catch((e: Error) => toast(e.message))} className="mt-8 rounded-lg bg-brand px-8 py-3.5 font-semibold text-white hover:bg-brand-dark">Become a host</button>
      </div>
    );
  }

  const now = today();
  const confirmed = bookings?.filter((b) => b.status === "confirmed") ?? [];
  const stats = [
    ["Listings", listings?.length ?? "–"],
    ["Upcoming reservations", bookings ? confirmed.filter((b) => b.check_out > now).length : "–"],
    ["Total earnings", bookings ? money(confirmed.reduce((sum, b) => sum + b.total - b.service_fee, 0)) : "–"],
  ];

  // window.confirm: native dialog is enough for a destructive-action check.
  async function run(question: string, path: string, method: string, done: string) {
    if (!window.confirm(question)) return;
    try {
      await api(path, method);
      toast(done);
      reloadListings();
      reloadBookings();
    } catch (e) {
      toast((e as Error).message);
    }
  }

  const iconButton = "rounded-lg border border-neutral-300 p-2.5 hover:border-neutral-900";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
        <Link href="/host/listings/new" className="flex items-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark"><Plus size={18} /> Create listing</Link>
      </div>

      {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">Could not load your data: {error}</p>}

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-neutral-200 p-5">
            <dt className="text-sm text-neutral-500">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-12 text-xl font-semibold">Your listings</h2>
      {listings && !listings.length && <p className="mt-4 text-neutral-600">You have no listings yet. Create your first one.</p>}
      <ul className="mt-4 space-y-3">
        {listings?.map((listing) => (
          <li key={listing.id} className="flex items-center gap-4 rounded-2xl border border-neutral-200 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrc(listing.photos[0]?.url ?? "")} alt="" className="h-20 w-20 shrink-0 rounded-xl bg-neutral-200 object-cover" />
            <div className="min-w-0 flex-1">
              <Link href={`/listings/${listing.id}`} className="block truncate font-semibold hover:underline">{listing.title}</Link>
              <p className="text-sm text-neutral-600">{listing.city}, {listing.country} · {money(listing.price_per_night)} night</p>
              <p className="flex items-center gap-1 text-sm text-neutral-600"><Star size={12} className="fill-current" /> {listing.rating?.toFixed(2) ?? "New"} ({listing.review_count})</p>
            </div>
            <Link href={`/host/listings/${listing.id}/edit`} aria-label={`Edit ${listing.title}`} className={iconButton}><Pencil size={16} /></Link>
            <button aria-label={`Delete ${listing.title}`} className={iconButton} onClick={() => run(`Delete "${listing.title}"? This cannot be undone.`, `/listings/${listing.id}`, "DELETE", "Listing deleted")}>
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-xl font-semibold">Reservations</h2>
      {bookings && !bookings.length && <p className="mt-4 text-neutral-600">No reservations yet.</p>}
      <ul className="mt-4 space-y-3">
        {bookings?.map((booking) => (
          <BookingRow key={booking.id} booking={booking} showGuest>
            {booking.status === "confirmed" && booking.check_in > now && (
              <button className="rounded-lg border border-neutral-900 px-4 py-2 text-sm font-semibold hover:bg-neutral-100" onClick={() => run(`Cancel ${booking.guest.name}'s reservation?`, `/bookings/${booking.id}/cancel`, "POST", "Reservation cancelled")}>
                Cancel
              </button>
            )}
          </BookingRow>
        ))}
      </ul>
    </div>
  );
}
