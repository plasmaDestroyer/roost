"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import BookingRow from "@/components/BookingRow";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import { today } from "@/lib/dates";
import { useFetch } from "@/lib/hooks";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";
import type { Booking } from "@/lib/types";

const outline = "rounded-lg border border-neutral-900 px-4 py-2 text-sm font-semibold hover:bg-neutral-100";

export default function TripsPage() {
  const { user } = useSession();
  const toast = useToast();
  const { data: bookings, error, reload } = useFetch<Booking[]>(user ? "/bookings/mine" : null);
  const [reviewing, setReviewing] = useState<Booking | null>(null);

  if (error) return <p className="py-24 text-center text-neutral-500">Could not load your trips: {error}</p>;
  if (!bookings) return <p className="py-24 text-center text-neutral-500">Loading…</p>;

  const now = today();
  const active = bookings.filter((b) => b.status === "confirmed");
  const groups = [
    { title: "Upcoming", items: active.filter((b) => b.check_out > now).reverse() },
    { title: "Where you've been", items: active.filter((b) => b.check_out <= now) },
    { title: "Cancelled", items: bookings.filter((b) => b.status === "cancelled") },
  ];

  async function cancel(booking: Booking) {
    if (!window.confirm(`Cancel your stay at "${booking.listing.title}"?`)) return;
    try {
      await api(`/bookings/${booking.id}/cancel`, "POST");
      toast("Reservation cancelled");
      reload();
    } catch (e) {
      toast((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Trips</h1>
      {!bookings.length && (
        <div className="mt-8 rounded-2xl border border-neutral-200 p-8">
          <p className="text-xl font-semibold">No trips booked… yet!</p>
          <p className="mt-1 text-neutral-600">Time to dust off your bags and start planning your next adventure.</p>
          <Link href="/" className="mt-4 inline-block rounded-lg bg-brand px-5 py-3 font-semibold text-white">Start searching</Link>
        </div>
      )}
      {groups.filter((g) => g.items.length).map((group) => (
        <section key={group.title} className="mt-10">
          <h2 className="text-xl font-semibold">{group.title}</h2>
          <ul className="mt-4 space-y-3">
            {group.items.map((booking) => (
              <BookingRow key={booking.id} booking={booking}>
                {booking.status === "confirmed" && booking.check_in > now && <button className={outline} onClick={() => cancel(booking)}>Cancel</button>}
                {booking.status === "confirmed" && booking.check_out <= now && (
                  booking.review
                    ? <span className="flex items-center gap-1 text-sm text-neutral-600"><Star size={14} className="fill-current" /> You rated {booking.review.rating}</span>
                    : <button className={outline} onClick={() => setReviewing(booking)}>Leave a review</button>
                )}
              </BookingRow>
            ))}
          </ul>
        </section>
      ))}
      {reviewing && <ReviewModal booking={reviewing} onClose={() => setReviewing(null)} onSaved={reload} />}
    </div>
  );
}

function ReviewModal({ booking, onClose, onSaved }: { booking: Booking; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  async function submit() {
    try {
      await api(`/bookings/${booking.id}/review`, "POST", { rating, comment });
      toast("Thanks for your review");
      onSaved();
      onClose();
    } catch (e) {
      toast((e as Error).message);
    }
  }

  return (
    <Modal
      title="Rate your stay"
      onClose={onClose}
      footer={<><span /><button onClick={submit} disabled={comment.trim().length < 3} className="rounded-lg bg-neutral-900 px-6 py-3 font-semibold text-white disabled:opacity-40">Submit review</button></>}
    >
      <p className="font-semibold">{booking.listing.title}</p>
      <div className="my-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} aria-pressed={n === rating}>
            <Star size={32} className={n <= rating ? "fill-neutral-900" : "text-neutral-300"} />
          </button>
        ))}
      </div>
      <textarea autoFocus value={comment} onChange={(e) => setComment(e.target.value)} rows={5} placeholder="How was your stay?" className="w-full rounded-xl border border-neutral-300 p-4 outline-none focus:border-neutral-900" />
    </Modal>
  );
}
