import Link from 'next/link';
import { categories } from '@/lib/data';

export default function Header() {
  const navCategories = categories.slice(0, 4);

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-extrabold tracking-tight hover:text-indigo-300 transition-colors">
          🐾 Black Panther Store
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          {navCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="hover:text-white transition-colors capitalize"
            >
              {cat.title}
            </Link>
          ))}
          <Link href="/designs" className="hover:text-white transition-colors">All Designs</Link>
          <Link href="/categories" className="hover:text-white transition-colors">Categories</Link>
        </nav>
        {/* Mobile hamburger placeholder */}
        <div className="sm:hidden flex items-center">
          <Link href="/categories" className="text-slate-300 hover:text-white text-sm font-medium">
            Browse ↓
          </Link>
        </div>
      </div>
    </header>
  );
}
