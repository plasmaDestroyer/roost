import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import Header from "@/components/Header";
import { SessionProvider } from "@/lib/session";
import { ToastProvider } from "@/lib/toast";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Roost — holiday homes, cabins and stays",
  description: "Find a place to stay, or host your own.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} antialiased`}>
      <body className="flex min-h-screen flex-col font-sans">
        {/* Suspense: Header and pages read the URL query (useSearchParams), which is only known
            in the browser. The providers sit inside it, so the session state starts after this
            part is hydrated and the first client render matches the server HTML. */}
        <Suspense>
          <ToastProvider>
            <SessionProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <footer className="mt-16 border-t border-neutral-200 bg-neutral-50 px-6 py-6 text-sm text-neutral-600">
                © 2026 Roost · A demo project · Privacy · Terms
              </footer>
            </SessionProvider>
          </ToastProvider>
        </Suspense>
      </body>
    </html>
  );
}
