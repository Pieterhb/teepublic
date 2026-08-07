import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
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
  verification: {
    other: {
      "p:domain_verify": "2cfc6fd4e87222e0a4b329d7c2518c04",
    },
  },
  icons: {
    icon: [
      { url: '/icon.png' },
      { url: '/apple-icon.png', rel: 'apple-touch-icon' },
    ],
    apple: [
      { url: '/apple-icon.png' }
    ]
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-10NLJHPKWY"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-10NLJHPKWY');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-50">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
