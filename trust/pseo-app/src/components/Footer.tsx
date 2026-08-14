import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-4 mt-auto">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image src="/logo.png" alt="Black Panther Store" width={32} height={32} className="w-8 h-auto" />
              <p className="font-bold text-white text-lg">Black Panther Store</p>
            </div>
            <p className="text-sm leading-relaxed">
              Unique designs on premium apparel — supporting independent artists worldwide via TeePublic.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white mb-3">Quick Links</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/designs" className="hover:text-white transition-colors">All Designs</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">All Categories</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-3">Legal</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-3">Shop on TeePublic</p>
            <p className="text-sm leading-relaxed mb-3">
              All designs are sold via TeePublic — secure checkout, worldwide shipping.
            </p>
            <a
              href="https://www.teepublic.com/user/theblackpanther"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Visit Our TeePublic Store →
            </a>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 text-center text-xs">
          <p>© {currentYear} Black Panther Store. All rights reserved. Designs created by independent artists.</p>
        </div>
      </div>
    </footer>
  );
}
