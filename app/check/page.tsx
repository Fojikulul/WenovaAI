import type { Metadata } from "next";
import CheckerScreen from "./CheckerScreen";

export const metadata: Metadata = {
  title: "Check my essay - Wenova",
};

// The same screen as the home page, so old links to /check keep working.
export default function CheckPage() {
  return <CheckerScreen />;
}
