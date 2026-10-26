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
  // Google Search Console verification. Public by design, not a secret.
  verification: { google: "OOxVxNw_k-211RKB1gFALeVcObIDJi_J7LHxDnLVMXA" },
};

// Runs before the page is drawn, so dark mode never flashes white.
const THEME_SCRIPT = `try{var t=localStorage.getItem("wenova-theme");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script changes <html> before React loads.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${atkinson.variable} h-full antialiased`}
    >
      <head>
        {/* suppressHydrationWarning: some antivirus programs add their own <script> here. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      {/* suppressHydrationWarning: extensions like Grammarly add attributes to <body>. */}
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <MotionProvider>
        <header className="sticky top-0 z-20 border-b border-divider bg-background/90 backdrop-blur">
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2 md:px-6">
            <Link
              href="/"
              className="flex min-h-11 shrink-0 items-center gap-3 justify-self-start rounded-lg font-heading text-2xl font-bold text-heading sm:text-[1.75rem] lg:text-[2rem]"
            >
              <Image
                src="/logo.png"
                alt=""
                width={176}
                height={168}
                loading="eager"
                // unoptimized: the optimizer's lossy re-save made the see-through edge look rough.
                unoptimized
                className="h-11 w-auto sm:-my-1 sm:h-14"
              />
              <span className="sr-only sm:not-sr-only">
                Wenova <span className="-ml-[0.12em] text-secondary">AI</span>
              </span>
            </Link>
            <HeaderNav />
            {/* AccountButton reads the login cookie, so it waits in <Suspense>. */}
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
        {/* Exactly --footer-height tall from 1024px up (see globals.css). */}
        <footer className="border-t border-divider text-muted">
          <div className="mx-auto flex min-h-11 w-full max-w-[1240px] flex-wrap items-center justify-between gap-x-6 px-4 md:px-6 lg:h-11">
            <p>Wenova AI</p>
            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-5">
                <li>
                  <Link
                    href="/about"
                    className="inline-flex min-h-11 items-center underline underline-offset-[3px] transition-colors hover:text-heading"
                  >
                    About us
                  </Link>
                </li>
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
