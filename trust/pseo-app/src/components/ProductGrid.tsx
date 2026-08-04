import { Product } from '@/lib/data';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, title }: { products: Product[], title?: string }) {
  if (!products || products.length === 0) return null;
  
  return (
    <section className="py-12">
      {title && (
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map(p => (
          <ProductCard key={p.design_id} product={p} />
        ))}
      </div>
    </section>
  );
}
