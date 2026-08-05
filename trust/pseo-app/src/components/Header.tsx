import Link from 'next/link';
import { categories } from '@/lib/data';

export default function Header() {
  const navCategories = categories.slice(0, 4);

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        
        {/* Left Side: Logo + Internal Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-extrabold tracking-tight hover:text-indigo-300 transition-colors shrink-0">
            🐾 Black Panther Store
          </Link>
          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-300">
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
        </div>

        {/* Right Side: External POD Links */}
        <div className="hidden xl:flex items-center gap-6 text-sm font-semibold text-slate-300">
          <a 
            href="https://www.redbubble.com/people/Pieterhb/shop" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            Redbubble 1
            <ExternalIcon />
          </a>
          <a 
            href="https://toppopclothing-shop.fourthwall.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            Fourthwall
            <ExternalIcon />
          </a>
          <a 
            href="https://www.redbubble.com/people/Pieterhk/shop" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            Redbubble 2
            <ExternalIcon />
          </a>
        </div>

        {/* Mobile Hamburger Menu */}
        <details className="xl:hidden group relative">
          <summary className="list-none cursor-pointer p-2 -mr-2 text-slate-300 hover:text-white transition-colors">
            {/* Hamburger Icon */}
            <svg className="w-6 h-6 group-open:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {/* Close Icon */}
            <svg className="w-6 h-6 hidden group-open:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </summary>

          {/* Dropdown Content */}
          <div className="absolute top-full right-0 mt-4 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 flex flex-col gap-4 z-50">
            {/* Internal Links */}
            <div className="flex flex-col gap-3 pb-4 border-b border-slate-700 text-sm font-medium text-slate-200">
              <Link href="/" className="hover:text-white">Home</Link>
              {navCategories.map((cat) => (
                <Link key={cat.slug} href={`/${cat.slug}`} className="hover:text-white capitalize">
                  {cat.title}
                </Link>
              ))}
              <Link href="/designs" className="hover:text-white">All Designs</Link>
              <Link href="/categories" className="hover:text-white">Categories</Link>
            </div>
            
            {/* External Links */}
            <div className="flex flex-col gap-3 text-sm font-medium text-slate-300">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Our Other Stores</div>
              <a href="https://www.redbubble.com/people/Pieterhb/shop" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center justify-between">
                Redbubble 1 <ExternalIcon />
              </a>
              <a href="https://toppopclothing-shop.fourthwall.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center justify-between">
                Fourthwall <ExternalIcon />
              </a>
              <a href="https://www.redbubble.com/people/Pieterhk/shop" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center justify-between">
                Redbubble 2 <ExternalIcon />
              </a>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

function ExternalIcon() {
  return (
    <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
