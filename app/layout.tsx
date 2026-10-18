import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Lexend } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
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
        <header className="border-b border-divider">
          <div className="mx-auto flex w-full max-w-[720px] items-center px-4 py-3 md:px-6">
            <Link
              href="/"
              className="flex min-h-11 items-center gap-3 rounded-md font-heading text-xl font-bold text-heading"
            >
              {/* The logo is above the fold, so it loads right away. */}
              <Image
                src="/logo.png"
                alt="Wenova logo"
                width={40}
                height={40}
                loading="eager"
                className="rounded-lg"
              />
              Wenova
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
