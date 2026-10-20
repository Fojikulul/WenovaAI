import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Lexend } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import "./globals.css";

// Fonts from design-system/wenova/MASTER.md. next/font serves them from our
// own site, so the browser never sends a request to Google.
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin", "latin-ext"],
});

// next/font has no size data for this font, so it can't make a size-matched
// fallback. Text may shift slightly while the font loads on the first visit.
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
    <html
      lang="en"
      className={`${lexend.variable} ${atkinson.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Full-width header: logo on the left, the two pages on the right.
            It stays at the top while a long page scrolls. */}
        <header className="sticky top-0 z-20 border-b border-divider bg-background/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-4 py-2 md:px-6">
            <Link
              href="/"
              className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg font-heading text-2xl font-bold text-heading"
            >
              {/* The logo is above the fold, so it loads right away. Its text
                  is the word next to it, so screen readers skip the image. */}
              <Image
                src="/logo.png"
                alt=""
                width={48}
                height={48}
                loading="eager"
                className="size-10 rounded-xl sm:size-12"
              />
              {/* On phones there is only room for the logo; the name stays
                  for screen readers. */}
              {/* Two-tone name like the reference design: "AI" in the logo's
                  dark green (5.4:1 on white). */}
              <span className="sr-only sm:not-sr-only">
                Wenova <span className="text-secondary">AI</span>
              </span>
            </Link>
            <HeaderNav />
          </div>
        </header>
        {/* overflow-x-clip: the hero's full-width backdrop can never make
            the page scroll sideways. */}
        <main className="flex-1 overflow-x-clip">{children}</main>
      </body>
    </html>
  );
}
