"use client";

import { useParams } from "next/navigation";
import ListingForm from "@/components/ListingForm";
import { useFetch } from "@/lib/hooks";
import type { ListingDetail } from "@/lib/types";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, error } = useFetch<ListingDetail>(`/listings/${id}`);
  if (error) return <p className="py-24 text-center text-neutral-500">{error}</p>;
  if (!listing) return <p className="py-24 text-center text-neutral-500">Loading…</p>;
  return <ListingForm listing={listing} />;
}
