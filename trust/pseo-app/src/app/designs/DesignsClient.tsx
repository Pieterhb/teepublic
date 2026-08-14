'use client';

import Link from 'next/link';
import { products } from '@/lib/data';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

const PAGE_SIZE = 60;

export default function DesignsClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(q);
  const [page, setPage] = useState(1);
  const observerTarget = useRef(null);

  useEffect(() => {
    setQuery(q);
    setPage(1); // Reset page on search
  }, [q]);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        (p.tags ?? '').toLowerCase().includes(lower) ||
        (p.primary_keyword ?? '').toLowerCase().includes(lower) ||
        (p.description ?? '').toLowerCase().includes(lower)
    );
  }, [query]);

  const displayProducts = filtered.slice(0, PAGE_SIZE * page);
  const totalProducts = products.length;
  const hasMore = displayProducts.length < filtered.length;

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(element);
    
    return () => observer.unobserve(element);
  }, [handleObserver]);

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
              ? <><strong className="text-white">{filtered.length.toLocaleString()}</strong> designs match your search.</>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {displayProducts.map((product) => (
            <ProductCard key={product.design_id} product={product} />
          ))}
        </div>

        {/* Infinite Scroll Observer Target */}
        {hasMore && (
          <div ref={observerTarget} className="flex justify-center mt-12 py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Note about full catalog */}
        {!hasMore && (
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
        )}
      </main>
    </div>
  );
}
