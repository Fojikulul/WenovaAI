import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy - Wenova" };

// Must match what the app actually stores.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 21, 2026">
      <p>
        Wenova AI is a free writing coach made by a two-person student team for the Congressional
        App Challenge. This page explains, in plain words, what Wenova saves and why.
      </p>

      <h2>Without an account</h2>
      <ul>
        <li>
          When you check an essay, your text is sent to our server and to Anthropic&apos;s Claude AI
          to create the feedback. We don&apos;t save it or write it to any log.
        </li>
        <li>
          Your current draft is kept only in your browser tab (sessionStorage) and is deleted when you
          close the tab. Your light or dark theme choice, and which quiz questions you&apos;ve
          already had (so a retake gives new ones), are kept on your device.
        </li>
        <li>We don&apos;t use ads, analytics or tracking cookies.</li>
      </ul>

      <h2>With an account (optional, ages 13 and up)</h2>
      <p>If you create an account, we save:</p>
      <ul>
        <li>Your email address and password. The password is stored encrypted by Supabase; we never see it.</li>
        <li>
          If you use &ldquo;Continue with Google&rdquo; instead, there&apos;s no password: Google tells
          Supabase your email, name and profile picture, which are kept with your login. Wenova only
          uses the email.
        </li>
        <li>Your optional display name, English level, preferred difficulty and weekly goal.</li>
        <li>
          For each essay you check while signed in: how many mistakes it had for each grammar rule
          (for example &ldquo;Past Simple: 2&rdquo;) and the practice estimate.{" "}
          <strong>Never your essay text.</strong>
        </li>
        <li>For each quiz you finish: the lesson, your score and how long it took.</li>
        <li>Your learning path (which lessons are recommended to you, and why).</li>
      </ul>
      <p>
        We use this only to show your progress and recommend lessons. We never sell it, and we
        never share it with anyone except the services that run Wenova.
      </p>

      <h2>Services that run Wenova</h2>
      <ul>
        <li>Supabase: stores accounts and progress. Each student can only reach their own data.</li>
        <li>Vercel: hosts the website.</li>
        <li>Anthropic: creates essay feedback from the text you send (under its own privacy policy).</li>
        <li>Google: only if you choose &ldquo;Continue with Google&rdquo; to sign in.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        When you sign in, we use cookies only to keep you signed in. Without an account, Wenova sets
        no cookies. The full list is on the{" "}
        <Link href="/cookies" className="font-bold text-secondary underline underline-offset-[3px]">
          Cookies
        </Link>{" "}
        page.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You can use the Essay Checker and Lessons without an account.</li>
        <li>
          In <Link href="/settings" className="font-bold text-secondary underline underline-offset-[3px]">Settings</Link>,
          you can change your profile, delete your progress, or delete your account. Deleting your
          account removes everything saved with it.
        </li>
      </ul>

      <h2>Children</h2>
      <p>
        Accounts are for students 13 and older. If you are under 13, please use Wenova without an
        account. If we learn that an account belongs to someone under 13, we will delete it.
      </p>

      <h2>Changes</h2>
      <p>If this policy changes, we will update it here and change the date at the top.</p>
      <ContactLine before="Questions about your privacy? Email the Wenova team at" />
    </LegalPage>
  );
}
