"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

type Props = { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean };

/** Native <dialog>: the browser keeps keyboard focus inside it and closes it on Escape. */
export default function Modal({ title, onClose, children, footer, wide }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
    document.body.style.overflow = "hidden"; // stop the page behind from scrolling
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()} // a click on the backdrop lands on the dialog itself
      className={`mx-auto mb-0 mt-auto max-h-[90vh] w-full max-w-none rounded-t-2xl bg-white p-0 shadow-2xl backdrop:bg-black/50 sm:my-auto sm:rounded-2xl ${wide ? "sm:max-w-4xl" : "sm:max-w-xl"}`}
    >
      <div className="flex max-h-[90vh] flex-col">
        <header className="relative flex h-16 shrink-0 items-center justify-center border-b border-neutral-200">
          <button onClick={onClose} aria-label="Close" className="absolute left-4 rounded-full p-2 hover:bg-neutral-100">
            <X size={18} />
          </button>
          <h2 className="font-semibold">{title}</h2>
        </header>
        <div className="overflow-y-auto p-6">{children}</div>
        {footer && <footer className="flex shrink-0 items-center justify-between border-t border-neutral-200 px-6 py-4">{footer}</footer>}
      </div>
    </dialog>
  );
}
