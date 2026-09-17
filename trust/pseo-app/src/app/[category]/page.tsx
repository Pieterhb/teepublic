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
  return categories.map((category) => ({
    category: category.slug,
  }));
}

// Helper: generate a unique editorial description per category
function getCategoryDescription(slug: string, title: string, count: number): string {
  const descriptions: Record<string, string> = {
    'everyday-shirts': `Browse ${count} everyday shirt designs crafted for comfort and style. From casual tees to relaxed fits, find the perfect shirt for any occasion.`,
    'minimalist-shirts': `Discover ${count} minimalist shirt designs that speak through simplicity. Clean lines, subtle art, and understated style for those who appreciate less is more.`,
    'retro-vintage-shirts': `Explore ${count} retro and vintage-inspired shirt designs. Nostalgic artwork and classic aesthetics reimagined for modern wear.`,
    'boyfriend-gifts': `Find the perfect gift from ${count} unique designs ideal for boyfriends. From funny to heartfelt, there is something for every personality.`,
  };
  return descriptions[slug] ?? `Shop ${count} unique ${title.toLowerCase()} designs from independent artists. Premium quality T-shirts, hoodies, and apparel — made to order and shipped worldwide via TeePublic.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  
  if (!category) return {};

  const categoryProducts = getProductsForCategory(category.slug);
  const featuredImage = categoryProducts[0]?.image_url;

  return {
    title: `Best ${category.title} — Unique Designs & Apparel`,
    description: `Shop the best ${category.title.toLowerCase()} created by independent artists. Browse ${category.productIds.length}+ unique designs — find the perfect gift or addition to your wardrobe today.`,
    alternates: {
      canonical: `https://blackpantherstore.co.za/${category.slug}`,
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
      title: `Best ${category.title} | Black Panther Store`,
      description: `Browse ${category.productIds.length}+ unique ${category.title.toLowerCase()} designs from independent artists.`,
      url: `https://blackpantherstore.co.za/${category.slug}`,
      images: featuredImage ? [{ url: featuredImage, alt: `${category.title} designs` }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Best ${category.title} | Black Panther Store`,
      description: `Browse ${category.productIds.length}+ unique ${category.title.toLowerCase()} designs.`,
      images: featuredImage ? [featuredImage] : [],
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

  // Guard: if category has no products, return a hard 404 rather than an
  // empty page that Google treats as a soft 404.
  if (products.length === 0) {
    notFound();
  }

  const relatedCategories = getRelatedCategoriesForCategory(category.slug);
  const editorialDesc = getCategoryDescription(category.slug, category.title, products.length);

  // Dynamic FAQ tailored to category
  const faqs = [
    {
      question: `What types of ${category.title.toLowerCase()} apparel are available?`,
      answer: `Our ${category.title.toLowerCase()} collection includes classic heavyweight tees, soft tri-blend shirts, v-necks, tank tops, pullover hoodies, and crewneck sweatshirts in sizes from S to 5XL.`
    },
    {
      question: `How do I choose the best size for ${category.title.toLowerCase()}?`,
      answer: `All products feature an exact sizing chart on their TeePublic product page with chest and length measurements. For a relaxed fit, many customers choose to size up one size.`
    },
    {
      question: `How is the print quality and durability of these designs?`,
      answer: `Designs are produced using state-of-the-art Direct-to-Garment (DTG) printing with eco-friendly inks that sink directly into the fabric fibers for rich color and long-lasting wash durability.`
    },
    {
      question: `Where does my order ship from?`,
      answer: `Orders are fulfilled and shipped globally through TeePublic's network of regional fulfillment centers across the US, UK, Europe, and Australia to ensure fast international delivery.`
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
        description: editorialDesc,
        url: `https://blackpantherstore.co.za/${category.slug}`,
        numberOfItems: category.productIds.length,
        itemListElement: products.slice(0, 12).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `https://blackpantherstore.co.za/design/${p.slug}`,
          name: p.title,
        })),
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 font-semibold tracking-wider uppercase mb-4 text-xs">
            <span>&#10024;</span> Curated Collection &mdash; {products.length} Designs
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 capitalize">
            {category.title}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {editorialDesc}
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-16">
        {/* Main Grid */}
        <ProductGrid products={products} />

        {/* Buying Guide / SEO Content block */}
        <section className="my-20 bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Why Shop Our {category.title}?</h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              When you purchase from our <strong>{category.title}</strong> collection, you directly support independent digital artists and designers. Every garment is made to order using premium combed cotton blends and environmentally friendly inks.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-12">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-2xl mb-2">&#127912;</div>
                <h3 className="font-bold text-slate-900 mb-2">Original Art</h3>
                <p className="text-sm text-slate-600">Exclusive graphics and concepts not found in retail big-box stores.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-2xl mb-2">&#128083;</div>
                <h3 className="font-bold text-slate-900 mb-2">Premium Fabrics</h3>
                <p className="text-sm text-slate-600">Ultra-soft, pre-shrunk cotton for all-day comfort and durability.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-2xl mb-2">&#127758;</div>
                <h3 className="font-bold text-slate-900 mb-2">Worldwide Delivery</h3>
                <p className="text-sm text-slate-600">Reliable global shipping via TeePublic&apos;s fulfillment centers.</p>
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
