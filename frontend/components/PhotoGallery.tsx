"use client";

import { Grip } from "lucide-react";
import { useState } from "react";
import { photoSrc } from "@/lib/api";
import type { Photo } from "@/lib/types";
import Modal from "./Modal";

/* eslint-disable @next/next/no-img-element */
export default function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="relative">
      {/* Desktop: one large photo and four small ones */}
      <div className="hidden h-[26rem] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:grid">
        {photos.slice(0, 5).map((photo, i) => (
          <button key={photo.id} onClick={() => setShowAll(true)} className={`overflow-hidden bg-neutral-200 ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
            <img src={photoSrc(photo.url)} alt={`${title}, photo ${i + 1}`} className="h-full w-full object-cover transition hover:brightness-90" />
          </button>
        ))}
      </div>
      {/* Mobile: swipe through the photos */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto md:hidden">
        {photos.map((photo, i) => (
          <img key={photo.id} src={photoSrc(photo.url)} alt={`${title}, photo ${i + 1}`} className="aspect-[4/3] w-full shrink-0 snap-center bg-neutral-200 object-cover" />
        ))}
      </div>
      <button onClick={() => setShowAll(true)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-neutral-900 bg-white px-4 py-1.5 text-sm font-semibold hover:bg-neutral-100">
        <Grip size={16} /> Show all photos
      </button>

      {showAll && (
        <Modal title={`${photos.length} photos`} onClose={() => setShowAll(false)} wide>
          <div className="space-y-3">
            {photos.map((photo, i) => (
              <img key={photo.id} src={photoSrc(photo.url)} alt={`${title}, photo ${i + 1}`} className="w-full rounded-xl bg-neutral-200" />
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
