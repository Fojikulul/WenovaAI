import type { ReactNode } from "react";
import { AccountPage, Card } from "./AccountPage";

export const CONTACT_EMAIL = "";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <AccountPage title={title} intro={`Last updated ${updated}`} width="narrow">
      <Card>
        <div className="flex max-w-[68ch] flex-col gap-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </div>
      </Card>
    </AccountPage>
  );
}

export function ContactLine({ before }: { before: string }) {
  if (!CONTACT_EMAIL) return null;
  return (
    <p>
      {before}{" "}
      <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-secondary underline underline-offset-[3px]">
        {CONTACT_EMAIL}
      </a>
      .
    </p>
  );
}
