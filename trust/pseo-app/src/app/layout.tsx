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
    url: "https://blackpantherstore.co.za",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Black Panther Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@BlackPantherSA",
    images: ["/logo.png"],
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

const rootJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://blackpantherstore.co.za/#website",
      "url": "https://blackpantherstore.co.za",
      "name": "Black Panther Store",
      "description": "Discover 4,000+ unique designs on T-shirts, hoodies, and apparel by independent artists.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://blackpantherstore.co.za/designs?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://blackpantherstore.co.za/#organization",
      "name": "Black Panther Store",
      "url": "https://blackpantherstore.co.za",
      "logo": "https://blackpantherstore.co.za/logo.png",
      "sameAs": [
        "https://www.teepublic.com/user/theblackpanther",
        "https://www.redbubble.com/people/Pieterhb/shop",
        "https://www.redbubble.com/people/Pieterhk/shop",
        "https://toppopclothing-shop.fourthwall.com/"
      ]
    }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        {/* Root Structured Data (WebSite & Organization) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
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
