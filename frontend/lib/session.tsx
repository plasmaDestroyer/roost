"use client";

import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { api, USER_KEY } from "./api";
import { useToast } from "./toast";
import type { ListingCard, User } from "./types";

type Session = {
  user: User | null; // null while loading
  users: User[];
  switchUser: (id: number) => void;
  becomeHost: () => Promise<void>;
  isSaved: (listingId: number) => boolean;
  toggleSaved: (listingId: number) => void;
};

const SessionContext = createContext<Session | null>(null);

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside SessionProvider");
  return session;
}

/** Mock login (pick one of the seeded accounts) plus the user's wishlist. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const pending = useRef(new Set<number>()); // listings with a wishlist request in flight

  useEffect(() => {
    api<User[]>("/users")
      .then((list) => {
        const stored = Number(localStorage.getItem(USER_KEY));
        // First visit: log in as the first guest account.
        const current = list.find((u) => u.id === stored) ?? list.find((u) => !u.is_host) ?? list[0];
        localStorage.setItem(USER_KEY, String(current.id));
        setUsers(list);
        setUserId(current.id);
        return api<ListingCard[]>("/wishlist");
      })
      .then((wishlist) => setSaved(new Set(wishlist.map((l) => l.id))))
      .catch(() => toast("Cannot reach the server. Is the API running?"));
  }, [toast]);

  const session: Session = {
    user: users.find((u) => u.id === userId) ?? null,
    users,
    switchUser(id) {
      localStorage.setItem(USER_KEY, String(id));
      // ponytail: full reload refetches everything as the new user; no per-page reset logic.
      window.location.reload();
    },
    async becomeHost() {
      const updated = await api<User>("/users/me/become-host", "POST");
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      toast("You are now a host");
    },
    isSaved: (listingId) => saved.has(listingId),
    toggleSaved(listingId) {
      // Ignore a second click until the first request is done, so requests cannot arrive out of order.
      if (pending.current.has(listingId)) return;
      pending.current.add(listingId);
      const wasSaved = saved.has(listingId);
      const flip = (add: boolean) =>
        setSaved((old) => {
          const next = new Set(old);
          if (add) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      flip(!wasSaved); // optimistic: update the heart now, undo if the request fails
      api(`/wishlist/${listingId}`, wasSaved ? "DELETE" : "PUT")
        .then(
          () => toast(wasSaved ? "Removed from wishlist" : "Saved to wishlist"),
          () => {
            flip(wasSaved);
            toast("Could not update your wishlist");
          },
        )
        .finally(() => pending.current.delete(listingId));
    },
  };

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
