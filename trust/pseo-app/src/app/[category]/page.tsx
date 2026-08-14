import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  categories, 
  getCategoryBySlug, 
  getProductsForCategory, 
  getRelatedCategoriesForCategory 
} from '@/lib/data';
import ProductGrid from '@/components/ProductGrid';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  // Limit to top 200 to stay under Cloudflare Pages 20,000-file limit
  return categories.slice(0, 200).map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  
  if (!category) return {};

  return {
    title: `Best ${category.title} — Unique Designs & Apparel`,
    description: `Shop the best ${category.title.toLowerCase()} created by independent artists. Browse ${category.productIds.length}+ unique designs — find the perfect gift or addition to your wardrobe today.`,
    alternates: {
      canonical: `https://blackpantherstore.co.za/${category.slug}`,
    },
    openGraph: {
      title: `Best ${category.title} | Black Panther Store`,
      description: `Browse ${category.productIds.length}+ unique ${category.title.toLowerCase()} designs from independent artists.`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Best ${category.title} | Black Panther Store`,
      description: `Browse ${category.productIds.length}+ unique ${category.title.toLowerCase()} designs.`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const products = getProductsForCategory(category.slug);
  const relatedCategories = getRelatedCategoriesForCategory(category.slug);

  // Generate dynamic FAQ
  const faqs = [
    {
      question: `What types of ${category.title.toLowerCase()} do you offer?`,
      answer: `We offer a wide variety of ${category.title.toLowerCase()} ranging from t-shirts to hoodies and more. All designs are printed on high-quality, comfortable materials and created by independent artists.`
    },
    {
      question: `How do I find the right size for ${category.title.toLowerCase()}?`,
      answer: `Each product page on TeePublic has a detailed sizing chart. We recommend comparing those measurements to a shirt you currently own that fits well.`
    },
    {
      question: `Are these designs exclusive?`,
      answer: `Yes! Many of the designs in our ${category.title} collection are unique artworks submitted by independent creators that you won't find in big-box retail stores.`
    }
  ];

  // Collection, FAQ & Breadcrumb Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blackpantherstore.co.za' },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://blackpantherstore.co.za/categories' },
          { '@type': 'ListItem', position: 3, name: category.title, item: `https://blackpantherstore.co.za/${category.slug}` },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `Best ${category.title}`,
        description: `Shop the best ${category.title.toLowerCase()} created by independent artists.`,
        url: `https://blackpantherstore.co.za/${category.slug}`,
        numberOfItems: category.productIds.length,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer
          }
        }))
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 py-3 px-4">
        <div className="container mx-auto text-sm text-slate-500 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-indigo-600 transition-colors">Categories</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium capitalize">{category.title}</span>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <p className="text-indigo-400 font-semibold tracking-widest uppercase mb-4 text-sm">Curated Collection</p>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 capitalize">
            {category.title}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover {products.length}+ hand-picked designs in our {category.title.toLowerCase()} collection. 
            Printed on premium apparel by independent artists.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-16">
        {/* Main Grid */}
        <ProductGrid products={products} />

        {/* Buying Guide / SEO Content block */}
        <section className="my-20 bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Why shop our {category.title}?</h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              When you browse our curated selection of <strong>{category.title.toLowerCase()}</strong>, you are supporting 
              independent artists from around the world. Every design is printed on demand on high-quality, ethically sourced 
              garments. Whether you are looking for a funny gift or a unique addition to your wardrobe, we have you covered.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-12">
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Unique Designs</h3>
                <p className="text-sm text-slate-600">Exclusive art you won&apos;t find anywhere else.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">High Quality</h3>
                <p className="text-sm text-slate-600">Printed on premium, durable materials.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Support Artists</h3>
                <p className="text-sm text-slate-600">Every purchase directly supports the creator.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="my-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-3">{faq.question}</h3>
                <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Categories */}
        {relatedCategories.length > 0 && (
          <section className="my-20 border-t border-slate-200 pt-16 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">More Collections You&apos;ll Love</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {relatedCategories.map(cat => (
                <Link 
                  key={cat.slug} 
                  href={`/${cat.slug}`}
                  className="px-6 py-3 bg-white border-2 border-slate-100 hover:border-indigo-600 text-slate-700 hover:text-indigo-700 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
