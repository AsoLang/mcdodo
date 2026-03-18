'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  keyword: string;
  published_at: string;
  reading_time_mins: number;
  featured_image: string | null;
}

export default function BlogClient({ posts }: { posts: Post[] }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const keywords = useMemo(() => {
    const kw = Array.from(new Set(posts.map((p) => p.keyword).filter(Boolean)));
    return ['All', ...kw];
  }, [posts]);

  const filtered = useMemo(() => {
    let result = posts;
    if (activeFilter !== 'All') result = result.filter((p) => p.keyword === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.keyword?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, activeFilter, search]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <>
      {/* Search + Filters */}
      <div className="sticky top-16 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative w-full sm:w-72 shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 w-full sm:w-auto hide-scrollbar">
            {keywords.map((kw) => (
              <button
                key={kw}
                onClick={() => setActiveFilter(kw)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  activeFilter === kw
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">No articles found. Try a different search.</p>
            <button onClick={() => { setSearch(''); setActiveFilter('All'); }} className="mt-4 text-orange-600 text-sm font-semibold hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Featured article — full width */}
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group block rounded-3xl overflow-hidden mb-10 relative bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                {featured.featured_image ? (
                  <div className="relative w-full h-64 sm:h-80 md:h-96">
                    <Image
                      src={featured.featured_image}
                      alt={featured.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="100vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent" />
                  </div>
                ) : (
                  <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-orange-600 to-orange-400" />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  {featured.keyword && (
                    <span className="inline-block text-xs font-bold text-orange-300 bg-orange-950/80 border border-orange-800 px-3 py-1 rounded-full mb-3">
                      {featured.keyword}
                    </span>
                  )}
                  <h2 className="text-xl md:text-3xl font-bold text-white mb-2 leading-tight group-hover:text-orange-300 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-gray-300 text-sm md:text-base line-clamp-2 mb-3 max-w-2xl">{featured.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-medium text-gray-300">Mcdodo (UK)</span>
                    <span>·</span>
                    <span>{new Date(featured.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    {featured.reading_time_mins && <><span>·</span><span>{featured.reading_time_mins} min read</span></>}
                    <span className="ml-auto inline-flex items-center gap-1 text-orange-400 font-semibold text-xs group-hover:gap-2 transition-all">
                      Read article
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* 3-column grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
                      {post.featured_image ? (
                        <Image
                          src={post.featured_image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                          <svg className="w-10 h-10 text-orange-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                          </svg>
                        </div>
                      )}
                      {post.keyword && (
                        <span className="absolute top-3 left-3 text-xs font-bold text-orange-600 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
                          {post.keyword}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-5">
                      <h2 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-snug mb-2 line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-4">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                        <span>{new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1 text-orange-500 font-semibold group-hover:gap-2 transition-all">
                          {post.reading_time_mins ? `${post.reading_time_mins} min` : 'Read'}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
