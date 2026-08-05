import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { products } from '@/lib/data';

export const metadata: Metadata = {
  title: 'All Designs — Browse 3,700+ Unique T-Shirt & Apparel Designs',
  description:
    'Browse our complete collection of 3,700+ unique T-shirt, hoodie, and apparel designs created by independent artists. Find your perfect design today.',
  alternates: {
    canonical: 'https://blackpantherstore.co.za/designs',
  },
  openGraph: {
    title: 'Browse All 3,700+ Designs | Black Panther Store',
    description: 'Unique T-shirts, hoodies and apparel from independent artists.',
  },
};

const PAGE_SIZE = 60;

export default async function DesignsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? '';

  const filtered = query
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          (p.tags ?? '').toLowerCase().includes(query) ||
          (p.primary_keyword ?? '').toLowerCase().includes(query) ||
          (p.description ?? '').toLowerCase().includes(query)
      )
    : products;

  const displayProducts = query ? filtered.slice(0, PAGE_SIZE) : products.slice(0, PAGE_SIZE);
  const totalProducts = products.length;

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blackpantherstore.co.za' },
      { '@type': 'ListItem', position: 2, name: 'All Designs', item: 'https://blackpantherstore.co.za/designs' },
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
            {query ? 'Search Results' : 'Full Collection'}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            {query ? `Results for "${q}"` : 'All Designs'}
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            {query
              ? <>Found <strong className="text-white">{filtered.length.toLocaleString()}</strong> designs matching your search.</>
              : <>Browse all <strong className="text-white">{totalProducts.toLocaleString()}</strong> unique designs from independent artists. Find yours.</>}
          </p>
          {query && (
            <Link href="/designs" className="inline-block mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              ← Clear search &amp; show all designs
            </Link>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 py-3 px-4">
        <div className="container mx-auto text-sm text-slate-500 flex items-center gap-2">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">All Designs</span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-slate-600 text-sm">
            {query
              ? <>Showing <strong>{displayProducts.length}</strong> of <strong>{filtered.length.toLocaleString()}</strong> results for &quot;{q}&quot;</>
              : <>Showing <strong>{displayProducts.length}</strong> of <strong>{totalProducts.toLocaleString()}</strong> designs</>}
          </p>
          <Link href="/categories" className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors">
            Browse by Category →
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {displayProducts.map((product) => (
            <Link
              key={product.design_id}
              href={`/design/${product.slug}`}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                {product.image_url && (
                  <Image
                    src={product.image_url}
                    alt={product.image_alt || product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                )}
              </div>
              <div className="p-3">
                <h2 className="font-semibold text-slate-900 text-xs leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                  {product.title}
                </h2>
                {product.primary_keyword && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-xs bg-indigo-50 text-indigo-600 rounded-full font-medium">
                    {product.primary_keyword}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Note about full catalog */}
        <div className="mt-16 bg-indigo-50 border border-indigo-100 rounded-2xl p-8 text-center">
          <p className="text-slate-700 text-lg font-semibold mb-2">
            Looking for something specific?
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Browse by category to find exactly what you&apos;re looking for, or visit our full TeePublic store.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/categories"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              Browse All 501 Categories
            </Link>
            <a
              href="https://www.teepublic.com/user/theblackpanther"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white border-2 border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-bold rounded-xl transition-all duration-300"
            >
              View Full Store on TeePublic →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
