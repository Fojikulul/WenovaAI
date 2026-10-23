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

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin", "latin-ext"],
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Wenova",
  description: "A friendly writing coach for students learning English.",
  verification: { google: "OOxVxNw_k-211RKB1gFALeVcObIDJi_J7LHxDnLVMXA" },
};

const THEME_SCRIPT = `try{var t=localStorage.getItem("wenova-theme");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // THEME_SCRIPT sets data-theme before hydration.
      suppressHydrationWarning
      className={`${bricolage.variable} ${atkinson.variable} h-full antialiased`}
    >
      <head>
        {/* Antivirus tools (e.g. Kaspersky) inject scripts into <head>. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      {/* Extensions like Grammarly add attributes to <body>. */}
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
                unoptimized
                className="h-11 w-auto sm:-my-1 sm:h-14"
              />
              <span className="sr-only sm:not-sr-only">
                Wenova <span className="-ml-[0.12em] text-secondary">AI</span>
              </span>
            </Link>
            <HeaderNav />
            <div className="flex items-center gap-2 justify-self-end">
              <MobileMenu />
              <Suspense fallback={null}>
                <AccountButton />
              </Suspense>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-clip">{children}</main>
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
