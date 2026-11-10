"use client";

import { ChevronLeft, CircleCheck, CreditCard, Star } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import PriceBreakdown from "@/components/PriceBreakdown";
import { api, photoSrc } from "@/lib/api";
import { formatRange } from "@/lib/dates";
import { useFetch } from "@/lib/hooks";
import { useToast } from "@/lib/toast";
import type { Booking, ListingDetail, Quote } from "@/lib/types";

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const checkIn = params.get("check_in");
  const checkOut = params.get("check_out");
  const guests = Number(params.get("guests")) || 1;

  const listingFetch = useFetch<ListingDetail>(`/listings/${id}`);
  const quoteFetch = useFetch<Quote>(checkIn && checkOut ? `/listings/${id}/quote?check_in=${checkIn}&check_out=${checkOut}` : null);
  const { data: listing } = listingFetch;
  const { data: quote } = quoteFetch;
  const loadError = listingFetch.error ?? quoteFetch.error;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);

  if (!checkIn || !checkOut) return <p className="py-24 text-center text-neutral-500">Choose your dates on the listing page first.</p>;
  if (loadError) return <p className="py-24 text-center text-neutral-500">{loadError}</p>;
  if (!listing || !quote) return <p className="py-24 text-center text-neutral-500">Loading…</p>;

  async function confirm() {
    setSubmitting(true);
    setError("");
    try {
      // The API checks the dates again: someone else can book while this page is open.
      // expected_total: if the host changed the price after this page loaded, the API refuses.
      setBooking(await api<Booking>("/bookings", "POST", { listing_id: Number(id), check_in: checkIn, check_out: checkOut, guests, expected_total: quote?.total }));
      toast("Reservation confirmed");
    } catch (e) {
      setError((e as Error).message);
      quoteFetch.reload(); // show the current price
    } finally {
      setSubmitting(false);
    }
  }

  if (booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CircleCheck size={56} className="mx-auto text-green-600" />
        <h1 className="mt-4 text-3xl font-semibold">Your reservation is confirmed</h1>
        <p className="mt-2 text-neutral-600">You&apos;re going to {listing.city}! Confirmation code RST-{String(booking.id).padStart(5, "0")}</p>
        <div className="mt-8 rounded-2xl border border-neutral-200 p-6 text-left">
          <p className="font-semibold">{listing.title}</p>
          <p className="text-neutral-600">{formatRange(booking.check_in, booking.check_out)} · {booking.guests} {booking.guests === 1 ? "guest" : "guests"}</p>
          <p className="mt-2 font-semibold">Total paid: ${booking.total.toLocaleString("en-US")}</p>
        </div>
        <Link href="/trips" className="mt-8 inline-block rounded-lg bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-black">View my trips</Link>
      </div>
    );
  }

  const input = "w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-500";

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-10 md:px-10">
      <h1 className="flex items-center gap-4 text-3xl font-semibold">
        <button onClick={() => router.back()} aria-label="Back" className="rounded-full p-2 hover:bg-neutral-100"><ChevronLeft size={20} /></button>
        Confirm and pay
      </h1>

      <div className="mt-10 grid gap-16 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Your trip</h2>
          <dl className="mt-4 space-y-4">
            <div><dt className="font-semibold">Dates</dt><dd className="text-neutral-600">{formatRange(checkIn, checkOut)}</dd></div>
            <div><dt className="font-semibold">Guests</dt><dd className="text-neutral-600">{guests} {guests === 1 ? "guest" : "guests"}</dd></div>
          </dl>

          <h2 className="mt-8 flex items-center gap-2 border-t border-neutral-200 pt-8 text-xl font-semibold"><CreditCard size={20} /> Pay with</h2>
          <p className="mt-1 text-sm text-neutral-500">Demo checkout. No real payment is made and no card is needed.</p>
          <div className="mt-4 space-y-3">
            <input disabled aria-label="Card number" value="4242 4242 4242 4242" className={input} readOnly />
            <div className="flex gap-3">
              <input disabled aria-label="Expiry" value="12 / 30" className={input} readOnly />
              <input disabled aria-label="CVV" value="•••" className={input} readOnly />
            </div>
          </div>

          <h2 className="mt-8 border-t border-neutral-200 pt-8 text-xl font-semibold">Cancellation policy</h2>
          <p className="mt-2 text-neutral-600">Free cancellation before check-in. Cancel from your Trips page.</p>

          {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}
          <button onClick={confirm} disabled={submitting} className="mt-8 rounded-lg bg-brand px-8 py-3.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
            {submitting ? "Confirming…" : "Confirm and pay"}
          </button>
        </div>

        <aside className="h-fit rounded-2xl border border-neutral-300 p-6 lg:sticky lg:top-28">
          <div className="flex gap-4 border-b border-neutral-200 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrc(listing.photos[0]?.url ?? "")} alt="" className="h-28 w-28 rounded-xl bg-neutral-200 object-cover" />
            <div>
              <p className="font-semibold">{listing.title}</p>
              <p className="text-sm text-neutral-500">{listing.property_type} in {listing.city}</p>
              <p className="mt-2 flex items-center gap-1 text-sm">
                <Star size={12} className="fill-current" /> {listing.rating?.toFixed(2) ?? "New"} ({listing.review_count})
              </p>
            </div>
          </div>
          <h2 className="py-6 text-xl font-semibold">Price details</h2>
          <PriceBreakdown quote={quote} />
        </aside>
      </div>
    </div>
  );
}
