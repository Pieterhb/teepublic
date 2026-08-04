import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Black Panther Store — Unique Designs on T-Shirts & Apparel",
    template: "%s | Black Panther Store",
  },
  description:
    "Discover 4,000+ unique designs on T-shirts, hoodies, and more. Shop the Black Panther Store — exclusive apparel by independent artists, shipped worldwide via TeePublic.",
  metadataBase: new URL("https://blackpantherstore.co.za"),
  openGraph: {
    type: "website",
    siteName: "Black Panther Store",
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    site: "@BlackPantherSA",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-50">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
