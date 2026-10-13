import type { Metadata } from "next";
import { Inter, Noto_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Noto_Serif({ subsets: ["latin"], weight: ["700"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: { default: "Nestora Ops", template: "%s · Nestora Ops" },
  description: "Portail de management Nestora.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
