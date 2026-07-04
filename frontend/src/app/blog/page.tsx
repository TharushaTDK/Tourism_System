'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { BlogPost } from '@/types';
import { Calendar, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const CATEGORIES = ['All', 'visa', 'culture', 'tips', 'currency', 'safety', 'food'];

const CATEGORY_COLORS: Record<string, string> = {
  visa: 'bg-blue-100 text-blue-700',
  culture: 'bg-purple-100 text-purple-700',
  tips: 'bg-emerald-100 text-emerald-700',
  currency: 'bg-yellow-100 text-yellow-700',
  safety: 'bg-red-100 text-red-700',
  food: 'bg-orange-100 text-orange-700',
};

export default function BlogPage() {
  const [category, setCategory] = useState('');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts', category],
    queryFn: async () => {
      const params = new URLSearchParams({ published: 'true', limit: '12' });
      if (category) params.set('category', category);
      const { data } = await api.get(`/blog?${params}`);
      return (data.data?.items ?? []) as BlogPost[];
    },
  });

  const featured = posts?.[0];
  const rest = posts?.slice(1) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Travel Blog & Guides</h1>
      <p className="text-gray-500 mb-8">Expert tips, visa guides, and travel inspiration for Sri Lanka</p>

      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c === 'All' ? '' : c)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${(c === 'All' && !category) || category === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4"><div className="h-72 bg-gray-100 rounded-xl animate-pulse" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({length:3}).map((_,i)=><div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse"/>)}</div></div>
      ) : (
        <>
          {/* Featured post */}
          {featured && (
            <Link href={`/blog/${featured.slug}`} className="block mb-8 group">
              <div className="relative h-72 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl overflow-hidden">
                {featured.image_url && <img src={featured.image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize mb-3 inline-block ${CATEGORY_COLORS[featured.category] ?? 'bg-white/20 text-white'}`}>{featured.category}</span>
                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{featured.title}</h2>
                  <p className="text-gray-300 text-sm line-clamp-2">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 text-gray-400 text-xs mt-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(featured.created_at)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {featured.view_count} views</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rest.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                  {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                </div>
                <div className="p-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600'}`}>{post.category}</span>
                  <h3 className="font-bold text-gray-800 mt-2 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                  <p className="text-gray-500 text-xs line-clamp-2 mb-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(post.created_at)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.view_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
