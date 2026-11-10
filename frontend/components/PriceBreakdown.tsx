import { money } from "@/lib/api";
import type { Quote } from "@/lib/types";

/** Used by the booking card and the checkout page. The numbers come from the API. */
export default function PriceBreakdown({ quote }: { quote: Quote }) {
  const row = "flex justify-between";
  return (
    <div className="space-y-3">
      <p className={row}>
        <span className="underline">{money(quote.nightly_price)} × {quote.nights} {quote.nights === 1 ? "night" : "nights"}</span>
        <span>{money(quote.subtotal)}</span>
      </p>
      <p className={row}><span className="underline">Cleaning fee</span><span>{money(quote.cleaning_fee)}</span></p>
      <p className={row}><span className="underline">Roost service fee</span><span>{money(quote.service_fee)}</span></p>
      <p className={`${row} border-t border-neutral-200 pt-4 font-semibold`}><span>Total</span><span>{money(quote.total)}</span></p>
    </div>
  );
}
