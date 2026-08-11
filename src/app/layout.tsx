import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/shell";
import { I18nProvider } from "@/lib/i18n/provider";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Engineering Performance Dashboard",
  description: "Dashboard Performa Engineering — 10 KPI inti + Setup Time",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`dark h-full antialiased ${playfair.variable} ${cormorant.variable} ${cinzel.variable}`}
    >
      <body style={{ colorScheme: "dark" }}>
        <I18nProvider>
          <div className="aurora-bg" />
          <div className="grid-overlay" />
          <Shell>{children}</Shell>
        </I18nProvider>
      </body>
    </html>
  );
}
