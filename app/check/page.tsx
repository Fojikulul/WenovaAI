import type { Metadata } from "next";
import CheckerScreen from "./CheckerScreen";

export const metadata: Metadata = {
  title: "Check my essay - Wenova",
};

export default function CheckPage() {
  return <CheckerScreen />;
}
