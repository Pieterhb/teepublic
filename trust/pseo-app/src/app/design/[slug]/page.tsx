import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  products, 
  getProductBySlug, 
  getRelatedProducts, 
  getRelatedCategoriesForProduct 
} from '@/lib/data';
import ProductGrid from '@/components/ProductGrid';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // All 3,756 products (~7,991 total files) — well under Cloudflare's 20,000-file limit
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  
  if (!product) return {};

  return {
    title: product.seo_title || product.title,
    description: product.meta_description || product.description,
    alternates: {
      canonical: `https://blackpantherstore.co.za/design/${product.slug}`,
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
      title: product.seo_title || product.title,
      description: product.meta_description || product.description,
      images: [product.image_url],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.seo_title || product.title,
      description: product.meta_description || product.description,
      images: [product.image_url],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product.design_id);
  const relatedCategories = getRelatedCategoriesForProduct(product.design_id);

  // JSON-LD: Product + BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blackpantherstore.co.za' },
          { '@type': 'ListItem', position: 2, name: 'All Designs', item: 'https://blackpantherstore.co.za/designs' },
          { '@type': 'ListItem', position: 3, name: product.title, item: `https://blackpantherstore.co.za/design/${product.slug}` },
        ],
      },
      {
        '@type': 'Product',
        name: product.title,
        image: product.image_url,
        description: product.description,
        sku: String(product.design_id),
        brand: {
          '@type': 'Brand',
          name: 'TeePublic - The Black Panther'
        },
        offers: {
          '@type': 'Offer',
          url: product.teepublic_url,
          price: '22.00',
          priceCurrency: 'USD',
          priceValidUntil: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0],
          itemCondition: 'https://schema.org/NewCondition',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: 'TeePublic'
          },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingRate: {
              '@type': 'MonetaryAmount',
              value: '0',
              currency: 'USD'
            },
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'US'
            },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 1,
                maxValue: 3,
                unitCode: 'DAY'
              },
              transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 3,
                maxValue: 7,
                unitCode: 'DAY'
              }
            }
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'US',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 30,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn'
          }
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 py-3 px-4">
        <div className="container mx-auto text-sm text-slate-500 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/designs" className="hover:text-indigo-600 transition-colors">All Designs</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium truncate max-w-xs">{product.title}</span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        {/* Product Hero */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Column */}
            <div className="bg-slate-100 relative aspect-square lg:aspect-auto flex items-center justify-center p-8 lg:p-16">
              <div className="relative w-full h-full max-w-lg aspect-square">
                {product.image_url && (
                  <Image
                    src={product.image_url}
                    alt={product.image_alt || product.title}
                    fill
                    className="object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
              </div>
            </div>
            
            {/* Details Column */}
            <div className="p-8 lg:p-16 flex flex-col justify-center">
              <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-full uppercase tracking-widest mb-6 w-fit">
                {product.primary_keyword || 'Apparel'}
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
                {product.title}
              </h1>
              
              <div className="text-lg text-slate-600 mb-8 leading-relaxed space-y-4">
                <p>{product.description}</p>
                <p>Designed with passion by <span className="font-semibold text-slate-900">{product.artist}</span>.</p>
              </div>

              {/* Tags */}
              {product.tags && (
                <div className="mb-10">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.split(',').map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm border border-slate-200">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="mt-auto">
                <a 
                  href={product.teepublic_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full lg:w-auto px-8 py-4 text-lg font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  Buy on TeePublic
                  <svg className="w-5 h-5 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
                <p className="text-xs text-slate-400 mt-4 text-center lg:text-left">
                  Secure checkout via TeePublic. Available in multiple colors and styles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Categories Pills */}
        {relatedCategories.length > 0 && (
          <div className="mb-16 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Explore Related Collections</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {relatedCategories.map(cat => (
                <Link 
                  key={cat.slug} 
                  href={`/${cat.slug}`}
                  className="px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Products Grid */}
        <div className="border-t border-slate-200 pt-8">
          <ProductGrid products={relatedProducts} title="You Might Also Like" />
        </div>
      </main>
    </div>
  );
}
