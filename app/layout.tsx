import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from "next/font/google";
import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
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
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <MotionProvider>
        <header className="border-b border-divider">
          <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-4 py-3 md:px-6">
            <Link
              href="/"
              className="flex min-h-11 shrink-0 items-center rounded-lg font-heading text-2xl font-bold text-heading"
            >
              Wenova
            </Link>
            <div className="flex items-center gap-2">
              <HeaderNav />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        </MotionProvider>
      </body>
    </html>
  );
}
