import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Black Panther Store',
  description: 'Privacy Policy and data protection standards for Black Panther Store.',
  alternates: {
    canonical: 'https://blackpantherstore.co.za/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy | Black Panther Store',
    description: 'Privacy Policy and data protection standards for Black Panther Store.',
    url: 'https://blackpantherstore.co.za/privacy-policy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Black Panther Store',
    description: 'Privacy Policy and data protection standards for Black Panther Store.',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center gap-3 text-slate-900 dark:text-white">
          <span>📄</span> Privacy Policy for Black Panther Store
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium">
          Last Updated: August 2026
        </p>

        <div className="space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed">
          
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              1. Introduction
            </h2>
            <p className="mb-4">
              Welcome to Black Panther Store. We operate the website <a href="https://www.blackpantherstore.co.za" className="text-indigo-600 dark:text-indigo-400 hover:underline">https://www.blackpantherstore.co.za</a>
            </p>
            <p>
              We respect your privacy and are committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) of South Africa and global data protection standards (GDPR). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or interact with our automated services and social media features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              2. Information We Collect
            </h2>
            <p className="mb-4">We may collect and process the following types of information:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-slate-900 dark:text-white">Personal Information:</strong> Information you voluntarily provide to us when contacting us, subscribing to a newsletter, or placing an order (e.g., name, email address, phone number, shipping address).
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Usage &amp; Device Data:</strong> Information automatically collected when you browse our site, such as your IP address, browser type, operating system, referring URLs, and pages viewed.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Product Catalog &amp; Media Data:</strong> Images, metadata, and design URLs from our store catalog used for automated promotional and indexing purposes across our connected platforms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              3. How We Use Your Information
            </h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Operate, maintain, and optimize our website and user experience.</li>
              <li>Process customer requests, orders, and inquiries.</li>
              <li>Publish, share, and promote our product designs across social media platforms through official APIs.</li>
              <li>Ensure site security and prevent fraudulent activity.</li>
              <li>Comply with legal and regulatory requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              4. Third-Party Services &amp; API Integrations
            </h2>
            <p className="mb-4">
              To showcase our artwork and products, we integrate with secure third-party platforms and Developer APIs:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-slate-900 dark:text-white">Pinterest Developer API:</strong> We utilize the official Pinterest API (v5) to automatically index, publish, and display product image pins from our website catalog onto our official Pinterest boards. No private customer data from our website is shared with or sent to Pinterest through this automation. Only publicly available product details, product image links, titles, and board descriptions are processed.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Analytics &amp; Hosting:</strong> We may use third-party analytics (such as Google Analytics) and web hosting services that collect non-personally identifiable site usage traffic.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              5. Cookies and Tracking Technologies
            </h2>
            <p>
              Our website uses cookies and similar tracking technologies to enhance navigation, analyze site performance, and provide relevant content. You can set your web browser to refuse or block cookies, though some parts of the site may not function properly without them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              6. Data Security and Protection
            </h2>
            <p>
              We implement reasonable administrative, technical, and physical security measures to protect your personal data against unauthorized access, loss, misuse, or alteration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              7. Your Data Protection Rights
            </h2>
            <p className="mb-4">
              Depending on your location (including rights under POPIA / GDPR), you have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Access, request a copy of, or update the personal information we hold about you.</li>
              <li>Request the deletion or destruction of your personal data.</li>
              <li>Object to or restrict the processing of your personal information.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us using the information below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              8. Contact Us
            </h2>
            <p className="mb-4">
              If you have any questions or concerns regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-slate-900 dark:text-white">Website:</strong> <a href="https://www.blackpantherstore.co.za/" className="text-indigo-600 dark:text-indigo-400 hover:underline break-all">https://www.blackpantherstore.co.za/</a>
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Email:</strong> <a href="mailto:haasbroek.pieter@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">haasbroek.pieter@gmail.com</a>
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Location:</strong> South Africa
              </li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
