"use client";

import { Award, Heart, Share, Star } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import BookingCard from "@/components/BookingCard";
import Calendar from "@/components/Calendar";
import PhotoGallery from "@/components/PhotoGallery";
import Reviews from "@/components/Reviews";
import { plural } from "@/lib/api";
import { amenityIcon } from "@/lib/constants";
import { formatRange, nightsBetween } from "@/lib/dates";
import { useFetch } from "@/lib/hooks";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";
import type { DateRange, ListingDetail } from "@/lib/types";

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const toast = useToast();
  const { isSaved, toggleSaved } = useSession();
  const { data: listing, error } = useFetch<ListingDetail>(`/listings/${id}`);
  const { data: blocked = [] } = useFetch<DateRange[]>(`/listings/${id}/availability`);

  // One date range shared by the inline calendar and the booking card.
  const [checkIn, setCheckIn] = useState(params.get("check_in"));
  const [checkOut, setCheckOut] = useState(params.get("check_out"));
  const [guests, setGuests] = useState(Number(params.get("guests")) || 1);
  const setDates = (start: string | null, end: string | null) => {
    setCheckIn(start);
    setCheckOut(end);
  };

  if (error) return <p className="py-24 text-center text-neutral-500">{error}</p>;
  if (!listing) return <div className="mx-auto mt-8 h-[26rem] max-w-[1120px] animate-pulse rounded-2xl bg-neutral-200" />;

  const saved = isSaved(listing.id);
  const host = listing.host;
  const action = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold underline hover:bg-neutral-100";
  const section = "border-t border-neutral-200 py-8";

  function share() {
    navigator.clipboard.writeText(window.location.href).then(
      () => toast("Link copied"),
      () => toast("Could not copy the link"),
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-4 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-2 py-6">
        <h1 className="text-2xl font-semibold">{listing.title}</h1>
        <div className="flex">
          <button className={action} onClick={share}><Share size={16} /> Share</button>
          <button className={action} onClick={() => toggleSaved(listing.id)} aria-pressed={saved}>
            <Heart size={16} className={saved ? "fill-brand text-brand" : ""} /> {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <PhotoGallery photos={listing.photos} title={listing.title} />

      <div className="mt-8 grid gap-16 lg:grid-cols-[1fr_23rem]">
        <div className="min-w-0">
          <div className="pb-8">
            <h2 className="text-xl font-semibold">{listing.property_type} in {listing.city}, {listing.country}</h2>
            <p className="text-neutral-600">
              {plural(listing.max_guests, "guest")} · {plural(listing.bedrooms, "bedroom")} · {plural(listing.beds, "bed")} · {plural(listing.baths, "bath")}
            </p>
            <p className="mt-1 flex items-center gap-1 font-semibold">
              <Star size={14} className="fill-current" />
              {listing.rating ? `${listing.rating.toFixed(2)} · ${listing.review_count} reviews` : "New"}
            </p>
          </div>

          <div className={`${section} flex items-center gap-4`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={host.avatar_url || undefined} alt="" className="h-12 w-12 rounded-full bg-neutral-200 object-cover" />
            <div>
              <p className="font-semibold">Hosted by {host.name}</p>
              <p className="flex items-center gap-1 text-sm text-neutral-500">
                {host.is_superhost && <><Award size={14} /> Superhost ·</>} Hosting since {new Date(host.created_at).getFullYear()}
              </p>
            </div>
          </div>

          <p className={`${section} whitespace-pre-line leading-relaxed text-neutral-700`}>{listing.description}</p>

          <div className={section}>
            <h2 className="text-xl font-semibold">What this place offers</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {listing.amenities.map((amenity) => {
                const Icon = amenityIcon(amenity.icon);
                return <li key={amenity.id} className="flex items-center gap-4"><Icon size={22} strokeWidth={1.5} /> {amenity.name}</li>;
              })}
            </ul>
          </div>

          <div className={section}>
            <h2 className="text-xl font-semibold">
              {checkIn && checkOut ? `${plural(nightsBetween(checkIn, checkOut), "night")} in ${listing.city}` : "Select check-in date"}
            </h2>
            <p className="mb-6 text-sm text-neutral-500">
              {checkIn && checkOut ? formatRange(checkIn, checkOut) : "Add your travel dates for exact pricing"}
            </p>
            <Calendar checkIn={checkIn} checkOut={checkOut} blocked={blocked} onChange={setDates} />
            <button onClick={() => setDates(null, null)} className="mt-4 text-sm font-semibold underline">Clear dates</button>
          </div>
        </div>

        <aside>
          <div className="sticky top-28">
            <BookingCard listing={listing} blocked={blocked} checkIn={checkIn} checkOut={checkOut} onDatesChange={setDates} guests={guests} onGuestsChange={setGuests} />
          </div>
        </aside>
      </div>

      <div className={section}><Reviews reviews={listing.reviews} rating={listing.rating} /></div>

      {/* Listings made in the host form have no coordinates yet (0, 0). */}
      {(listing.lat !== 0 || listing.lng !== 0) && (
      <div className={section}>
        <h2 className="text-xl font-semibold">Where you&apos;ll be</h2>
        <p className="mb-6 text-neutral-600">{listing.city}, {listing.country}</p>
        {/* ponytail: static OpenStreetMap embed; a pin map library is the upgrade path */}
        <iframe
          title="Map"
          loading="lazy"
          className="h-96 w-full rounded-2xl border-0"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.lng - 0.06},${listing.lat - 0.035},${listing.lng + 0.06},${listing.lat + 0.035}&layer=mapnik&marker=${listing.lat},${listing.lng}`}
        />
      </div>
      )}

      <div className={section}>
        <h2 className="text-xl font-semibold">Meet your host</h2>
        <div className="mt-6 flex flex-wrap items-center gap-6 rounded-3xl bg-neutral-100 p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={host.avatar_url || undefined} alt="" className="h-24 w-24 rounded-full bg-neutral-200 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold">{host.name}</p>
            <p className="text-sm font-semibold">{host.is_superhost ? "Superhost" : "Host"}</p>
            <p className="mt-2 text-neutral-600">{host.bio}</p>
          </div>
          <button onClick={() => toast("Messaging is coming soon")} className="rounded-lg bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-black">Message host</button>
        </div>
      </div>
    </div>
  );
}
