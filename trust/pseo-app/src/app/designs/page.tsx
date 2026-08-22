import type { Metadata } from 'next';
import { Suspense } from 'react';
import DesignsClient from './DesignsClient';

export const metadata: Metadata = {
  title: 'All Designs — 4,000+ Unique T-Shirts, Hoodies & Apparel',
  description:
    'Explore our complete collection of 4,000+ unique designs on T-shirts, hoodies, and apparel created by independent artists. Shipped worldwide via TeePublic.',
  alternates: {
    canonical: 'https://blackpantherstore.co.za/designs',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'All Designs | Black Panther Store',
    description: 'Browse 4,000+ unique T-shirt and apparel designs from independent artists.',
    url: 'https://blackpantherstore.co.za/designs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Designs | Black Panther Store',
    description: 'Browse 4,000+ unique T-shirt and apparel designs.',
  },
};

export default function DesignsPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blackpantherstore.co.za' },
      { '@type': 'ListItem', position: 2, name: 'All Designs', item: 'https://blackpantherstore.co.za/designs' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading designs…</div>}>
        <DesignsClient />
      </Suspense>
    </>
  );
}
