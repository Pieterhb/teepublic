import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/data';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/design/${product.slug}`} className="group block h-full">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full hover:-translate-y-1">
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.image_alt || product.title}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-slate-100 text-slate-400">
              No Image
            </div>
          )}
          {/* Subtle overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="p-5 flex flex-col flex-grow">
          <p className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wider">{product.primary_keyword || 'Design'}</p>
          <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {product.title}
          </h3>
          <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-grow">
            By {product.artist}
          </p>
          
          <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
            <span className="font-semibold text-slate-900">View Design</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
