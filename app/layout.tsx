import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import MotionProvider from "@/components/MotionProvider";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

// Fonts from design-system/wenova/MASTER.md. next/font serves them from our
// own site, so the browser never sends a request to Google.
// Headings: Bricolage Grotesque, the heading font of the reference design.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
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

// Runs before the page is drawn: uses the saved theme, or the device's
// setting on a first visit, so a dark-theme student never sees a white flash.
const THEME_SCRIPT = `try{var t=localStorage.getItem("wenova-theme");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script sets data-theme on <html>
    // before React loads, so the server's <html> and the browser's differ
    // on purpose.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${atkinson.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <MotionProvider>
        {/* Full-width header like the reference design: logo on the left,
            the page links in the center, the theme button on the right. The
            three equal side columns keep the links truly centered. It stays at the top while a
            long page scrolls. */}
        <header className="sticky top-0 z-20 border-b border-divider bg-background/90 backdrop-blur">
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2 md:px-6">
            <Link
              href="/"
              className="flex min-h-11 shrink-0 items-center gap-3 justify-self-start rounded-lg font-heading text-2xl font-bold text-heading sm:text-[1.75rem] lg:text-[2rem]"
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
            <div className="justify-self-end">
              <ThemeToggle />
            </div>
          </div>
        </header>
        {/* overflow-x-clip: the hero's full-width backdrop can never make
            the page scroll sideways. */}
        <main className="flex-1 overflow-x-clip">{children}</main>
        </MotionProvider>
      </body>
    </html>
  );
}
