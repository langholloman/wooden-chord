import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Wooden Chord",
  description:
    "Choose a full guitar neck, a focused chord neck, or the B minor blues lesson.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
