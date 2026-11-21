import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { products } from '@/lib/data';
import ProductGrid from '@/components/ProductGrid';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 60;
const TOTAL_PAGES = Math.ceil(products.length / PAGE_SIZE);

interface Props {
  params: Promise<{ page: string }>;
}

export async function generateStaticParams() {
  // Generate pages 2 through TOTAL_PAGES (page 1 is /designs)
  const paths = [];
  for (let i = 2; i <= TOTAL_PAGES; i++) {
    paths.push({ page: String(i) });
  }
  return paths;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const pageNum = parseInt(page, 10);

  if (isNaN(pageNum) || pageNum < 1 || pageNum > TOTAL_PAGES) {
    return {};
  }

  return {
    title: `All Designs — Page ${pageNum} of ${TOTAL_PAGES}`,
    description: `Explore page ${pageNum} of our catalog of 4,000+ unique T-shirt and apparel designs from independent artists. Shipped worldwide via TeePublic.`,
    alternates: {
      canonical: `https://blackpantherstore.co.za/designs/page/${pageNum}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: `All Designs — Page ${pageNum} | Black Panther Store`,
      description: `Browse page ${pageNum} of 4,000+ unique T-shirt and apparel designs.`,
      url: `https://blackpantherstore.co.za/designs/page/${pageNum}`,
      type: 'website',
      images: [
        {
          url: 'https://blackpantherstore.co.za/logo.png',
          width: 512,
          height: 512,
          alt: 'Black Panther Store',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `All Designs — Page ${pageNum} | Black Panther Store`,
      description: `Browse page ${pageNum} of 4,000+ unique designs.`,
      images: ['https://blackpantherstore.co.za/logo.png'],
    },
  };
}

export default async function PaginatedDesignsPage({ params }: Props) {
  const { page } = await params;
  const pageNum = parseInt(page, 10);

  if (isNaN(pageNum) || pageNum < 1 || pageNum > TOTAL_PAGES) {
    notFound();
  }

  const startIndex = (pageNum - 1) * PAGE_SIZE;
  const displayProducts = products.slice(startIndex, startIndex + PAGE_SIZE);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blackpantherstore.co.za' },
      { '@type': 'ListItem', position: 2, name: 'All Designs', item: 'https://blackpantherstore.co.za/designs' },
      { '@type': 'ListItem', position: 3, name: `Page ${pageNum}`, item: `https://blackpantherstore.co.za/designs/page/${pageNum}` },
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
            Full Collection
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            All Designs &mdash; Page {pageNum}
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            Browse designs {startIndex + 1} &ndash; {startIndex + displayProducts.length} of <strong className="text-white">{products.length.toLocaleString()}</strong> from independent artists.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 py-3 px-4">
        <div className="container mx-auto text-sm text-slate-500 flex items-center gap-2">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/designs" className="hover:text-indigo-600 transition-colors">All Designs</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">Page {pageNum}</span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        {/* Stats & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <p className="text-slate-600 text-sm">
            Showing designs <strong>{startIndex + 1}</strong> &ndash; <strong>{startIndex + displayProducts.length}</strong> of <strong>{products.length.toLocaleString()}</strong>
          </p>
          <Link href="/categories" className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors">
            Browse by Category →
          </Link>
        </div>

        {/* Product Grid */}
        <ProductGrid products={displayProducts} />

        {/* Pagination Navigation */}
        <Pagination currentPage={pageNum} totalPages={TOTAL_PAGES} basePath="/designs" />

        {/* Bottom CTA */}
        <div className="mt-16 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 sm:p-8 text-center">
          <p className="text-slate-700 text-lg font-semibold mb-2">Looking for something specific?</p>
          <p className="text-slate-500 text-sm mb-6">
            Browse our 501 curated categories to find the exact theme, recipient, or niche you love.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/categories"
              className="px-4 sm:px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 max-w-full text-center break-words"
            >
              Browse All 501 Categories
            </Link>
            <a
              href="https://www.teepublic.com/user/theblackpanther"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-6 py-3 bg-white border-2 border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 max-w-full text-center break-words"
            >
              View Full Store on TeePublic →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
