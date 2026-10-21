import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import AccountButton from "@/components/AccountButton";
import CookieNotice from "@/components/CookieNotice";
import HeaderNav, { MobileMenu } from "@/components/HeaderNav";
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
  // Proves to Google Search Console that we own wenova-ai.vercel.app (needed
  // for the Google sign-in branding). Public by design, not a secret.
  verification: { google: "OOxVxNw_k-211RKB1gFALeVcObIDJi_J7LHxDnLVMXA" },
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
        {/* suppressHydrationWarning: some antivirus programs (e.g. Kaspersky)
            add their own <script> at the top of <head>, which React would
            report as a mismatch here. Our script has already run by then. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
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
                  is the word next to it, so screen readers skip the image.
                  Just the paper, no box (Vasyl, 2026-10-21). From 640px up it's
                  56px tall; the negative margin keeps the header 65px. */}
              <Image
                src="/logo.png"
                alt=""
                width={176}
                height={168}
                loading="eager"
                // Served as the original PNG: the image optimizer's lossy
                // re-save made the see-through bottom edge look rough at this
                // small size. The file is saved at 3x its header size, so it
                // stays sharp and small (about 45 KB).
                unoptimized
                className="h-11 w-auto sm:-my-1 sm:h-14"
              />
              {/* On phones there is only room for the logo; the name stays
                  for screen readers. */}
              {/* Two-tone name like the reference design: "AI" in the logo's
                  dark green (5.4:1 on white). */}
              <span className="sr-only sm:not-sr-only">
                {/* The space stays (screen readers say "Wenova AI"); the
                    negative margin just pulls "AI" a little closer. */}
                Wenova <span className="-ml-[0.12em] text-secondary">AI</span>
              </span>
            </Link>
            <HeaderNav />
            {/* Right: the phone menu, the account button (it reads the login
                cookie, so it waits in <Suspense> and the rest of the header
                draws right away), and the theme switch. */}
            <div className="flex items-center gap-2 justify-self-end">
              <MobileMenu />
              <Suspense fallback={null}>
                <AccountButton />
              </Suspense>
              <ThemeToggle />
            </div>
          </div>
        </header>
        {/* overflow-x-clip: the hero's full-width backdrop can never make
            the page scroll sideways. */}
        <main className="flex-1 overflow-x-clip">{children}</main>
        {/* Slim footer on every page with the legal links. Exactly
            --footer-height tall from 1024px up, which the screen-filling
            pages (checker, lesson) leave room for, so they still don't
            scroll. */}
        <footer className="border-t border-divider text-muted">
          <div className="mx-auto flex min-h-11 w-full max-w-[1240px] flex-wrap items-center justify-between gap-x-6 px-4 md:px-6 lg:h-11">
            <p>Wenova AI</p>
            <nav aria-label="Legal">
              <ul className="flex gap-5">
                <li>
                  <Link
                    href="/privacy"
                    className="inline-flex min-h-11 items-center underline underline-offset-[3px] transition-colors hover:text-heading"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="inline-flex min-h-11 items-center underline underline-offset-[3px] transition-colors hover:text-heading"
                  >
                    Cookies
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="inline-flex min-h-11 items-center underline underline-offset-[3px] transition-colors hover:text-heading"
                  >
                    Terms of Use
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </footer>
        <CookieNotice />
        </MotionProvider>
      </body>
    </html>
  );
}
