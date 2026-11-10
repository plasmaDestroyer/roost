"use client";

import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string };
const ToastContext = createContext<(message: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2 sm:left-6 sm:translate-x-0">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
