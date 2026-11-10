// Dates are "YYYY-MM-DD" strings everywhere: they compare correctly as text
// and never shift a day because of time zones.

const pad = (n: number) => String(n).padStart(2, "0");

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromISO(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export const today = () => toISO(new Date());

export const nightsBetween = (checkIn: string, checkOut: string) =>
  Math.round((fromISO(checkOut).getTime() - fromISO(checkIn).getTime()) / 86_400_000);

export const formatDate = (
  iso: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) => fromISO(iso).toLocaleDateString("en-US", options);

export const formatRange = (checkIn: string, checkOut: string) =>
  `${formatDate(checkIn)} – ${formatDate(checkOut, { month: "short", day: "numeric", year: "numeric" })}`;
