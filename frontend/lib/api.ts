const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const USER_KEY = "roost_user_id";

function authHeader(): Record<string, string> {
  // Mock auth: the chosen account id goes in a header (see backend/app/deps.py).
  const id = localStorage.getItem(USER_KEY);
  return id ? { "X-User-Id": id } : {};
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = (await res.json().catch(() => null))?.detail;
    // FastAPI sends a string for our own errors and a list for validation errors.
    throw new Error(typeof detail === "string" ? detail : detail?.[0]?.msg ?? "Something went wrong");
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: { ...authHeader(), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parse<T>(res);
}

export async function uploadPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/uploads`, { method: "POST", headers: authHeader(), body: form });
  return (await parse<{ url: string }>(res)).url;
}

/** Uploaded photos are stored as "/uploads/x.jpg" on the API host; seed photos are full URLs. */
export const photoSrc = (url: string) => (url.startsWith("/") ? API_URL + url : url);

export const money = (amount: number) => `$${amount.toLocaleString("en-US")}`;

/** plural(1, "guest") → "1 guest", plural(3, "guest") → "3 guests" */
export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
