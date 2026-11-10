"use client";

import { Bird, Menu } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { useDismiss } from "@/lib/hooks";
import { useSession } from "@/lib/session";
import { useToast } from "@/lib/toast";
import SearchBar from "./SearchBar";

export default function Header() {
  const { user, users, switchUser } = useSession();
  const toast = useToast();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismiss(menuRef, () => setOpen(false), open);

  const item = "block w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-20 max-w-[1760px] items-center justify-between gap-4 px-4 md:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 text-brand" aria-label="Roost home">
          <Bird size={30} strokeWidth={2.2} />
          <span className="hidden text-2xl font-bold tracking-tight lg:block">roost</span>
        </Link>

        {/* key: when the URL changes (for example a click on the logo), reset the bar's fields */}
        <SearchBar key={params.toString()} />

        <div className="flex shrink-0 items-center gap-1">
          <Link href="/host" className="hidden rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-neutral-100 md:block">
            {user?.is_host ? "Switch to hosting" : "Become a host"}
          </Link>
          <div ref={menuRef} className="relative">
            <button onClick={() => setOpen(!open)} aria-label="Account menu" aria-expanded={open} className="flex items-center gap-3 rounded-full border border-neutral-300 py-1.5 pl-3.5 pr-1.5 hover:shadow-md">
              <Menu size={16} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user?.avatar_url || undefined} alt="" className="h-8 w-8 rounded-full bg-neutral-300 object-cover" />
            </button>
            {open && (
              <nav onClick={() => setOpen(false)} className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white py-2 shadow-xl">
                <p className="px-4 py-2 text-sm">
                  <span className="font-semibold">{user?.name}</span>
                  <span className="block text-xs text-neutral-500">{user?.is_host ? "Host account" : "Guest account"}</span>
                </p>
                <hr className="my-1 border-neutral-200" />
                <Link href="/trips" className={`${item} font-semibold`}>Trips</Link>
                <Link href="/wishlists" className={`${item} font-semibold`}>Wishlists</Link>
                <button className={item} onClick={() => toast("Messages are coming soon")}>Messages</button>
                <Link href="/host" className={item}>{user?.is_host ? "Host dashboard" : "Become a host"}</Link>
                <hr className="my-1 border-neutral-200" />
                <p className="px-4 pb-1 pt-2 text-xs font-semibold text-neutral-500">Switch account (demo login)</p>
                <div className="max-h-56 overflow-y-auto">
                  {users.map((u) => (
                    <button key={u.id} className={`${item} flex justify-between ${u.id === user?.id ? "bg-neutral-100" : ""}`} onClick={() => u.id !== user?.id && switchUser(u.id)}>
                      {u.name}
                      <span className="text-xs text-neutral-500">{u.is_host ? "Host" : "Guest"}</span>
                    </button>
                  ))}
                </div>
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
