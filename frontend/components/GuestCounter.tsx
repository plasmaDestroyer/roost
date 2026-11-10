import { Minus, Plus } from "lucide-react";

type Props = { label: string; hint?: string; value: number; min?: number; max?: number; onChange: (value: number) => void };

export default function GuestCounter({ label, hint, value, min = 0, max = 16, onChange }: Props) {
  const button = "flex h-8 w-8 items-center justify-center rounded-full border border-neutral-400 hover:border-neutral-900 disabled:opacity-25";
  return (
    <div className="flex items-center justify-between gap-8">
      <div>
        <p className="font-medium">{label}</p>
        {hint && <p className="text-sm text-neutral-500">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className={button} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer ${label}`}>
          <Minus size={14} />
        </button>
        <span className="w-5 text-center tabular-nums">{value}</span>
        <button className={button} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`More ${label}`}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
