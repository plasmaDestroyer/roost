"use client";

import { Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, photoSrc, uploadPhoto } from "@/lib/api";
import { CATEGORIES, PROPERTY_TYPES } from "@/lib/constants";
import { useFetch } from "@/lib/hooks";
import { useToast } from "@/lib/toast";
import type { Amenity, ListingDetail, ListingInput } from "@/lib/types";

const EMPTY: ListingInput = {
  title: "", description: "", property_type: "House", category: "beach", city: "", country: "",
  price_per_night: 100, cleaning_fee: 30, max_guests: 2, bedrooms: 1, beds: 1, baths: 1,
  photo_urls: [], amenity_ids: [],
};

const NUMBER_FIELDS = [
  ["price_per_night", "Price per night ($)"], ["cleaning_fee", "Cleaning fee ($)"], ["max_guests", "Max guests"],
  ["bedrooms", "Bedrooms"], ["beds", "Beds"], ["baths", "Baths"],
] as const;

/** Create form when `listing` is missing, edit form when it is given. */
export default function ListingForm({ listing }: { listing?: ListingDetail }) {
  const router = useRouter();
  const toast = useToast();
  const { data: amenities = [] } = useFetch<Amenity[]>("/amenities");
  const [form, setForm] = useState<ListingInput>(
    listing ? { ...listing, photo_urls: listing.photos.map((p) => p.url), amenity_ids: listing.amenities.map((a) => a.id) } : EMPTY,
  );
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  function addPhotoUrl() {
    if (!photoUrl.trim()) return;
    set("photo_urls", [...form.photo_urls, photoUrl.trim()]);
    setPhotoUrl("");
  }

  async function upload(files: FileList | null) {
    try {
      const urls = await Promise.all(Array.from(files ?? []).map(uploadPhoto));
      setForm((f) => ({ ...f, photo_urls: [...f.photo_urls, ...urls] }));
    } catch (e) {
      toast((e as Error).message);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.photo_urls.length) return toast("Add at least one photo");
    setSaving(true);
    try {
      const saved = await api<ListingDetail>(listing ? `/listings/${listing.id}` : "/listings", listing ? "PUT" : "POST", form);
      toast(listing ? "Listing updated" : "Listing published");
      router.push(listing ? "/host" : `/listings/${saved.id}`);
    } catch (e) {
      toast((e as Error).message);
      setSaving(false);
    }
  }

  const input = "mt-1 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900";
  const label = "block text-sm font-semibold";

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-semibold">{listing ? "Edit listing" : "Create a new listing"}</h1>

      <label className={label}>Title
        <input required minLength={3} maxLength={120} value={form.title} onChange={(e) => set("title", e.target.value)} className={input} />
      </label>
      <label className={label}>Description
        <textarea required minLength={10} rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} className={input} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>City
          <input required value={form.city} onChange={(e) => set("city", e.target.value)} className={input} />
        </label>
        <label className={label}>Country
          <input required value={form.country} onChange={(e) => set("country", e.target.value)} className={input} />
        </label>
        <label className={label}>Property type
          <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)} className={input}>
            {PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className={label}>Category
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={input}>
            {CATEGORIES.filter((c) => c.slug).map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {NUMBER_FIELDS.map(([key, text]) => (
          <label key={key} className={label}>{text}
            <input type="number" required min={key === "cleaning_fee" || key === "bedrooms" || key === "baths" ? 0 : 1} value={form[key]} onChange={(e) => set(key, Number(e.target.value))} className={input} />
          </label>
        ))}
      </div>

      <fieldset>
        <legend className={label}>Photos (the first one is the cover)</legend>
        <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {form.photo_urls.map((url, i) => (
            <div key={url + i} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoSrc(url)} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => set("photo_urls", form.photo_urls.filter((_, n) => n !== i))} className="absolute right-1.5 top-1.5 rounded-full bg-white p-1.5 shadow">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input type="url" aria-label="Photo URL" placeholder="https://… photo URL" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPhotoUrl(); } }} className={`${input} mt-0 min-w-0 flex-1`} />
          <button type="button" onClick={addPhotoUrl} className="rounded-lg border border-neutral-900 px-4 font-semibold hover:bg-neutral-100">Add URL</button>
          {/* sr-only (not hidden): the input stays reachable with the keyboard */}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-900 px-4 py-3 font-semibold hover:bg-neutral-100 focus-within:ring-2 focus-within:ring-neutral-900">
            <Upload size={16} /> Upload
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className={label}>Amenities</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {amenities.map((amenity) => (
            <label key={amenity.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-neutral-900"
                checked={form.amenity_ids.includes(amenity.id)}
                onChange={(e) => set("amenity_ids", e.target.checked ? [...form.amenity_ids, amenity.id] : form.amenity_ids.filter((id) => id !== amenity.id))}
              />
              {amenity.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3 border-t border-neutral-200 pt-6">
        <button disabled={saving} className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
          {saving ? "Saving…" : listing ? "Save changes" : "Publish listing"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg px-6 py-3 font-semibold hover:bg-neutral-100">Cancel</button>
      </div>
    </form>
  );
}
