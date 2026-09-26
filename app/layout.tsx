import type { Metadata } from "next";
import { Domine, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const domine = Domine({
  variable: "--font-domine",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "InsafDost AI — Pakistani Legal Analysis & Reasoning",
  description:
    "Enterprise-grade scenario analysis, statutory reasoning, and judicial precedent synthesis for Pakistani law.",
  keywords: [
    "Pakistan law",
    "Pakistani case law",
    "legal analysis",
    "statutory reasoning",
    "litigation strategy",
    "InsafDost",
  ],
  authors: [{ name: "InsafDost AI" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${domine.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-stone-200">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
