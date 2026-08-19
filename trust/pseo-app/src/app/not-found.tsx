import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-20 px-4">
      <div className="max-w-xl w-full text-center bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
          🐾
        </div>
        <p className="text-indigo-600 font-bold text-sm tracking-widest uppercase mb-2">404 Error</p>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Page Not Found
        </h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          The page or design you are looking for might have been moved, renamed, or is temporarily unavailable.
        </p>

        {/* Search bar */}
        <form action="/designs" method="GET" className="mb-8 flex gap-2">
          <input
            type="text"
            name="q"
            placeholder="Search 4,000+ designs..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-colors"
          >
            Search
          </button>
        </form>

        {/* Navigation links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/designs"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
          >
            Browse All Designs
          </Link>
          <Link
            href="/categories"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
          >
            All Categories
          </Link>
        </div>
      </div>
    </div>
  );
}
