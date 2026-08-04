import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Black Panther Store — Unique Designs on T-Shirts & Apparel",
  description:
    "Discover unique Black Panther inspired designs on T-shirts, hoodies, and more. Shop our exclusive apparel collection.",
  metadataBase: new URL("https://blackpantherstore.co.za"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
