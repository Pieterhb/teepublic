import type { Metadata } from 'next';
import Link from 'next/link';
import { categories } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Browse All 501 Categories — T-Shirts & Apparel by Theme',
  description:
    'Browse all 501 categories of unique T-shirt, hoodie, and apparel designs. From funny to professional, animals to holidays — find your perfect niche collection.',
  alternates: {
    canonical: 'https://blackpantherstore.co.za/categories',
  },
  openGraph: {
    title: 'Browse All 501 Categories | Black Panther Store',
    description: 'From funny to professional, animals to holidays — 501 categories to explore.',
    url: 'https://blackpantherstore.co.za/categories',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse All 501 Categories | Black Panther Store',
    description: 'From funny to professional, animals to holidays — 501 categories to explore.',
  },
};

export default function CategoriesPage() {
  const totalDesigns = categories.reduce((sum, c) => sum + c.productIds.length, 0);

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blackpantherstore.co.za' },
      { '@type': 'ListItem', position: 2, name: 'All Categories', item: 'https://blackpantherstore.co.za/categories' },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Page Hero */}
      <div className="bg-slate-900 text-white py-16 px-4">
        <div className="container mx-auto text-center">
          <p className="text-indigo-400 font-semibold tracking-widest uppercase text-sm mb-3">
            Explore Every Niche
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            All Categories
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            <strong className="text-white">{categories.length}</strong> curated collections · <strong className="text-white">{totalDesigns.toLocaleString()}</strong> unique designs
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 py-3 px-4">
        <div className="container mx-auto text-sm text-slate-500 flex items-center gap-2">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">All Categories</span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <p className="text-slate-500 text-sm mb-8">
          Showing all <strong>{categories.length}</strong> categories, sorted by number of designs.
        </p>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {categories
            .slice()
            .sort((a, b) => b.productIds.length - a.productIds.length)
            .map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="group bg-white border border-slate-100 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-300 text-center"
              >
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-indigo-100 transition-colors">
                  <span className="text-base">🐾</span>
                </div>
                <span className="block font-semibold text-slate-800 text-xs leading-tight capitalize line-clamp-2">
                  {cat.title}
                </span>
                <p className="text-xs text-slate-400 mt-1">{cat.productIds.length} designs</p>
              </Link>
            ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-indigo-50 border border-indigo-100 rounded-2xl p-8 text-center">
          <p className="text-slate-700 text-lg font-semibold mb-2">Can&apos;t find what you&apos;re looking for?</p>
          <p className="text-slate-500 text-sm mb-6">
            Visit our full TeePublic store for even more designs, colors, and styles.
          </p>
          <a
            href="https://www.teepublic.com/user/theblackpanther"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            Visit Full TeePublic Store →
          </a>
        </div>
      </main>
    </div>
  );
}
