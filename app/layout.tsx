import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "לשים על לב",
  description: "חוויה משפחתית משותפת לגילוי הדרכים שבהן אהבה מגיעה אל הלב",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="he" dir="rtl"><body>{children}</body></html>;
}
