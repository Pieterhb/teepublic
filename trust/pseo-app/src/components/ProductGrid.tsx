'use client';

import { Product } from '@/lib/data';
import ProductCard from './ProductCard';
import { useState, useRef, useCallback, useEffect } from 'react';

const PAGE_SIZE = 60;

export default function ProductGrid({ products, title }: { products: Product[], title?: string }) {
  const [page, setPage] = useState(1);
  const observerTarget = useRef(null);

  if (!products || products.length === 0) return null;

  const displayProducts = products.slice(0, PAGE_SIZE * page);
  const hasMore = displayProducts.length < products.length;

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

  return (
    <section className="py-12">
      {title && (
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {displayProducts.map(p => (
          <ProductCard key={p.design_id} product={p} />
        ))}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="flex justify-center mt-12 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </section>
  );
}
