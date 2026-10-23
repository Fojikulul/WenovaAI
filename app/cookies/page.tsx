import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Cookies - Wenova" };

const cell = "border-b border-divider py-2 pr-3 align-top";

// Must match every cookie and storage key the app uses.
export default function CookiesPage() {
  return (
    <LegalPage title="Cookies" updated="October 21, 2026">
      <p>
        Wenova only uses what it needs to work. There are no ads, no analytics and no tracking
        cookies, so there&apos;s nothing to accept or turn off.
      </p>

      <h2>Cookies (only when you sign in)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className={`${cell} font-bold`}>Name</th>
              <th className={`${cell} font-bold`}>Why</th>
              <th className={`${cell} font-bold`}>How long</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${cell} font-mono text-sm break-all`}>sb-…-auth-token (may be split into .0, .1)</td>
              <td className={cell}>Keeps you signed in to your account (set by Supabase).</td>
              <td className={cell}>Until you sign out (at most 400 days)</td>
            </tr>
            <tr>
              <td className={`${cell} font-mono text-sm break-all`}>sb-…-auth-token-code-verifier</td>
              <td className={cell}>A one-time code that finishes signing in safely (email link or Google).</td>
              <td className={cell}>Only while signing in; removed once it finishes</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Without an account, Wenova sets no cookies.</p>

      <h2>Saved in your browser (not cookies)</h2>
      <ul>
        <li>
          <strong>Your theme</strong> (light or dark), so it stays the same next time. Kept on this
          device.
        </li>
        <li>
          <strong>Quiz questions you&apos;ve already had</strong> in each lesson, so taking a quiz
          again gives you new questions first. Only the questions are kept, on this device.
        </li>
        <li>
          <strong>This notice</strong>: that you pressed &ldquo;OK, got it&rdquo;. Kept on this device.
        </li>
        <li>
          <strong>Your essay draft</strong> in the Essay Checker, so a reload doesn&apos;t lose it.
          Kept in this tab only and deleted when you close it. It&apos;s never sent anywhere until
          you press &ldquo;Check my writing&rdquo;.
        </li>
      </ul>

      <h2>Removing them</h2>
      <p>
        Signing out removes the sign-in cookies. You can also clear cookies and site data for
        Wenova in your browser&apos;s settings at any time. See the{" "}
        <Link href="/privacy" className="font-bold text-secondary underline underline-offset-[3px]">
          Privacy Policy
        </Link>{" "}
        for what we save with an account.
      </p>
      <ContactLine before="Questions? Email the Wenova team at" />
    </LegalPage>
  );
}
