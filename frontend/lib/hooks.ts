"use client";

import { type RefObject, useEffect, useState } from "react";
import { api } from "./api";

/** GET a path. Pass null to wait (for example until the user is known). */
export function useFetch<T>(path: string | null) {
  const [state, setState] = useState<{ path: string | null; data?: T; error?: string }>({ path: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) return;
    let stale = false; // ignore a response that arrives after the path changed
    api<T>(path).then(
      (data) => !stale && setState({ path, data }),
      (error: Error) => !stale && setState({ path, error: error.message }),
    );
    return () => {
      stale = true;
    };
  }, [path, version]);

  const current = state.path === path ? state : { path };
  return {
    data: current.data,
    error: current.error,
    loading: !current.data && !current.error,
    reload: () => setVersion((v) => v + 1),
  };
}

/** Close a dropdown when the user clicks outside it or presses Escape. */
export function useDismiss(ref: RefObject<HTMLElement | null>, onDismiss: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onDismiss();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDismiss();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  });
}
