import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from "next/font/google";
import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
});

// adjustFontFallback is off: next/font has no size data for this font.
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin", "latin-ext"],
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Wenova",
  description: "A friendly writing coach for students learning English.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${atkinson.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-divider">
          <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-4 py-3 md:px-6">
            <Link
              href="/"
              className="flex min-h-11 shrink-0 items-center rounded-lg font-heading text-2xl font-bold text-heading"
            >
              Wenova
            </Link>
            <HeaderNav />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
