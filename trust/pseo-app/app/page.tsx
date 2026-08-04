import Link from "next/link";
import Image from "next/image";
import { products, categories } from "@/lib/data";

export const metadata = {
  title: "Black Panther Store — Unique Designs on T-Shirts & Apparel",
  description:
    "Discover unique Black Panther inspired designs on T-shirts, hoodies, and more. Shop our full collection of exclusive apparel artwork.",
};

export default function HomePage() {
  const featuredProducts = products.slice(0, 12);
  const featuredCategories = categories.slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            🐾 Black Panther Store
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            {featuredCategories.slice(0, 3).map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="hover:text-white transition-colors capitalize"
              >
                {cat.title}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white py-24 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <span className="inline-block px-4 py-1.5 bg-indigo-600/40 border border-indigo-500/50 rounded-full text-sm font-semibold tracking-wider uppercase mb-6">
            Exclusive Apparel
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            Wear the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Panther
            </span>
          </h1>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed">
            Unique designs on premium T-shirts, hoodies, and more. Every piece
            tells a story — find yours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/design/${products[0]?.slug}`}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              Shop Now
            </Link>
            <a
              href="https://www.teepublic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-lg transition-all duration-300"
            >
              View on TeePublic
            </a>
          </div>
        </div>
      </section>

      {/* Categories */}
      {featuredCategories.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">
              Browse Collections
            </h2>
            <p className="text-slate-500 text-center mb-10">
              Find designs by theme
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {featuredCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${cat.slug}`}
                  className="group bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 text-center"
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-100 transition-colors">
                    <span className="text-xl">🐾</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm leading-tight capitalize">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {cat.productIds.length} designs
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="container mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">
            Featured Designs
          </h2>
          <p className="text-slate-500 text-center mb-10">
            Hand-picked favourites
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Link
                key={product.design_id}
                href={`/design/${product.slug}`}
                className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  {product.image_url && (
                    <Image
                      src={product.image_url}
                      alt={product.image_alt || product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                    {product.title}
                  </h3>
                  {product.primary_keyword && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-indigo-50 text-indigo-600 rounded-full font-medium">
                      {product.primary_keyword}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href={`/design/${products[12]?.slug}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-700 transition-all duration-300 hover:-translate-y-1"
            >
              View All Designs
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 text-center">
        <p className="font-bold text-white text-lg mb-2">🐾 Black Panther Store</p>
        <p className="text-sm mb-4">Unique designs on premium apparel — powered by TeePublic.</p>
        <p className="text-xs">
          © {new Date().getFullYear()} Black Panther Store. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
