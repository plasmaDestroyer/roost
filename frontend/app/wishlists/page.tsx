"use client";

import ListingCard from "@/components/ListingCard";
import { useFetch } from "@/lib/hooks";
import { useSession } from "@/lib/session";
import type { ListingCard as Listing } from "@/lib/types";

export default function WishlistsPage() {
  const { user, isSaved } = useSession();
  const { data: listings, error } = useFetch<Listing[]>(user ? "/wishlist" : null);
  // Hide a card as soon as its heart is un-clicked, without a refetch.
  const visible = listings?.filter((l) => isSaved(l.id));

  return (
    <div className="mx-auto max-w-[1760px] px-4 py-10 md:px-10">
      <h1 className="text-3xl font-semibold">Wishlists</h1>
      {error && <p className="mt-6 text-neutral-600">Could not load your wishlist: {error}</p>}
      {visible && !visible.length && <p className="mt-6 text-neutral-600">Nothing saved yet. Click the heart on any home to save it here.</p>}
      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible?.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
    </div>
  );
}
