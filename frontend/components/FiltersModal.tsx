"use client";

import { useState } from "react";
import { amenityIcon, PROPERTY_TYPES } from "@/lib/constants";
import { useFetch } from "@/lib/hooks";
import type { Amenity } from "@/lib/types";
import Modal from "./Modal";

export const FILTER_KEYS = ["min_price", "max_price", "bedrooms", "property_type", "amenities"];

type Props = { params: URLSearchParams; onApply: (next: URLSearchParams) => void; onClose: () => void };

/** Edits a draft copy of the filters; the URL changes only on "Show places". */
export default function FiltersModal({ params, onApply, onClose }: Props) {
  const { data: amenities = [] } = useFetch<Amenity[]>("/amenities");
  const [minPrice, setMinPrice] = useState(params.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") ?? "");
  const [bedrooms, setBedrooms] = useState(params.get("bedrooms") ?? "");
  const [types, setTypes] = useState(params.getAll("property_type"));
  const [amenityIds, setAmenityIds] = useState(params.getAll("amenities"));

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  function apply() {
    const next = new URLSearchParams(params);
    FILTER_KEYS.forEach((key) => next.delete(key));
    if (minPrice) next.set("min_price", minPrice);
    if (maxPrice) next.set("max_price", maxPrice);
    if (bedrooms) next.set("bedrooms", bedrooms);
    types.forEach((t) => next.append("property_type", t));
    amenityIds.forEach((id) => next.append("amenities", id));
    onApply(next);
  }

  function clear() {
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setTypes([]);
    setAmenityIds([]);
  }

  const chip = (selected: boolean) => `rounded-full border px-4 py-2 text-sm ${selected ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900"}`;
  const priceInput = "w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900";

  return (
    <Modal
      title="Filters"
      onClose={onClose}
      footer={
        <>
          <button onClick={clear} className="font-semibold underline">Clear all</button>
          <button onClick={apply} className="rounded-lg bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-black">Show places</button>
        </>
      }
    >
      <section>
        <h3 className="text-lg font-semibold">Price range</h3>
        <p className="text-sm text-neutral-500">Nightly price before fees</p>
        <div className="mt-4 flex items-center gap-4">
          <label className="flex-1 text-xs text-neutral-500">Minimum
            <input type="number" min={0} placeholder="$0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={priceInput} />
          </label>
          <span className="mt-4 text-neutral-400">–</span>
          <label className="flex-1 text-xs text-neutral-500">Maximum
            <input type="number" min={0} placeholder="$600+" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={priceInput} />
          </label>
        </div>
      </section>

      <section className="mt-8 border-t border-neutral-200 pt-8">
        <h3 className="text-lg font-semibold">Bedrooms</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {["", "1", "2", "3", "4"].map((n) => (
            <button key={n} onClick={() => setBedrooms(n)} className={chip(bedrooms === n)}>{n ? `${n}+` : "Any"}</button>
          ))}
        </div>
      </section>

      <section className="mt-8 border-t border-neutral-200 pt-8">
        <h3 className="text-lg font-semibold">Property type</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => (
            <button key={type} onClick={() => setTypes(toggle(types, type))} aria-pressed={types.includes(type)} className={chip(types.includes(type))}>{type}</button>
          ))}
        </div>
      </section>

      <section className="mt-8 border-t border-neutral-200 pt-8">
        <h3 className="text-lg font-semibold">Amenities</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {amenities.map((amenity) => {
            const Icon = amenityIcon(amenity.icon);
            const id = String(amenity.id);
            return (
              <button key={id} onClick={() => setAmenityIds(toggle(amenityIds, id))} aria-pressed={amenityIds.includes(id)} className={`${chip(amenityIds.includes(id))} flex items-center gap-2`}>
                <Icon size={16} />
                {amenity.name}
              </button>
            );
          })}
        </div>
      </section>
    </Modal>
  );
}
