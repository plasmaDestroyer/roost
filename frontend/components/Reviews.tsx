import { Star } from "lucide-react";
import type { Review } from "@/lib/types";

export default function Reviews({ reviews, rating }: { reviews: Review[]; rating: number | null }) {
  if (!reviews.length) return <p className="text-neutral-500">No reviews yet.</p>;
  return (
    <>
      <h2 className="flex items-center gap-2 text-2xl font-semibold">
        <Star size={20} className="fill-current" />
        {rating?.toFixed(2)} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
      </h2>
      <div className="mt-8 grid gap-x-16 gap-y-10 md:grid-cols-2">
        {reviews.map((review) => (
          <article key={review.id}>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={review.author.avatar_url || undefined} alt="" className="h-11 w-11 rounded-full bg-neutral-200 object-cover" />
              <div>
                <p className="font-semibold">{review.author.name}</p>
                <p className="text-sm text-neutral-500">
                  {new Date(review.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <p className="mt-3 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={11} className={n <= review.rating ? "fill-current" : "text-neutral-300"} />)}
            </p>
            <p className="mt-2 text-neutral-700">{review.comment}</p>
          </article>
        ))}
      </div>
    </>
  );
}
