import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/shell";
import { I18nProvider } from "@/lib/i18n/provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
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
    <html lang="id" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <I18nProvider>
          <div className="aurora-bg" />
          <div className="grid-overlay" />
          <Shell>{children}</Shell>
        </I18nProvider>
      </body>
    </html>
  );
}
