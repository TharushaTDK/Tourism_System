'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { BlogPost } from '@/types';
import { Calendar, Eye, Tag, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data } = await api.get<{ data: BlogPost }>(`/blog/${slug}`);
      return data.data;
    },
  });

  const { data: related } = useQuery({
    queryKey: ['related-posts', post?.category],
    queryFn: async () => {
      const { data } = await api.get<{ data: BlogPost[] }>(`/blog?category=${post?.category}&limit=4&published=true`);
      return (data.data || []).filter((p: BlogPost) => p.slug !== slug).slice(0, 3);
    },
    enabled: !!post,
  });

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-10 space-y-4"><div className="h-72 bg-gray-200 rounded-xl animate-pulse" /><div className="h-96 bg-gray-100 rounded-xl animate-pulse" /></div>;
  if (!post) return <div className="text-center py-20 text-gray-500">Article not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link href="/blog" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <article className="lg:col-span-2">
          {post.image_url && (
            <img src={post.image_url} alt={post.title} className="w-full h-72 object-cover rounded-2xl mb-6" />
          )}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full capitalize">{post.category}</span>
            <span className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="w-3.5 h-3.5" /> {formatDate(post.created_at)}</span>
            <span className="flex items-center gap-1 text-xs text-gray-400"><Eye className="w-3.5 h-3.5" /> {post.view_count} views</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>
          {post.excerpt && <p className="text-gray-500 text-lg leading-relaxed mb-6 border-l-4 border-blue-400 pl-4 italic">{post.excerpt}</p>}
          <div className="prose prose-gray max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</div>
          </div>
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-gray-100">
              <Tag className="w-4 h-4 text-gray-400" />
              {post.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside>
          <div className="bg-gray-50 rounded-xl p-5 sticky top-20">
            <h3 className="font-bold text-gray-800 mb-4">Related Articles</h3>
            {related && related.length > 0 ? (
              <div className="space-y-4">
                {related.map((p) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="flex gap-3 group">
                    <div className="w-16 h-14 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                      {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">{p.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(p.created_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No related articles.</p>}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3">Quick Links</h3>
              {[['Visa Guide', '/blog?category=visa'], ['Safety Tips', '/blog?category=safety'], ['Local Culture', '/blog?category=culture'], ['Currency Info', '/blog?category=currency']].map(([label, href]) => (
                <Link key={label} href={href} className="block text-sm text-gray-600 hover:text-blue-600 py-1.5 transition-colors">{label} →</Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
