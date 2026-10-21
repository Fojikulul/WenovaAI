import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Use - Wenova" };

// Plain-language terms of use for a free student project.
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="October 21, 2026">
      <p>
        Wenova AI is a free writing coach made by a two-person student team for the Congressional
        App Challenge. By using it, you agree to these terms.
      </p>

      <h2>Using Wenova</h2>
      <ul>
        <li>Wenova is for practicing English. Use it for your own learning.</li>
        <li>
          Don&apos;t paste other people&apos;s private information (like phone numbers or addresses)
          into the Essay Checker.
        </li>
        <li>Don&apos;t try to break, overload, or get around the limits of the website.</li>
      </ul>

      <h2>Feedback from AI</h2>
      <ul>
        <li>
          Essay feedback is made by an AI coach. It can be wrong, so think about each suggestion
          before you use it.
        </li>
        <li>Grades are practice estimates, not official English grades or test scores.</li>
        <li>Your writing stays yours. We don&apos;t save it (see the Privacy Policy).</li>
      </ul>

      <h2>Accounts</h2>
      <ul>
        <li>Accounts are optional and for students 13 and older.</li>
        <li>Keep your password private. You are responsible for what happens in your account.</li>
        <li>You can delete your account at any time in Settings.</li>
        <li>We may close accounts that misuse Wenova.</li>
      </ul>

      <h2>No guarantees</h2>
      <p>
        Wenova is a free student project, offered &ldquo;as is&rdquo;. We work hard to keep it
        working and correct, but we can&apos;t promise it will always be available or error-free, and
        we may change or stop it at any time.
      </p>

      <h2>Privacy</h2>
      <p>
        Read how we handle your data in the{" "}
        <Link href="/privacy" className="font-bold text-secondary underline underline-offset-[3px]">
          Privacy Policy
        </Link>
        .
      </p>

      <h2>Changes</h2>
      <p>If these terms change, we will update them here and change the date at the top.</p>
      <ContactLine before="Questions? Email the Wenova team at" />
    </LegalPage>
  );
}
