'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Review } from '@/types';
import { Star, Trash2, Edit3, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import StarRating from '@/components/StarRating';

export default function ReviewsPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(5);

  useEffect(() => { if (hasHydrated && !isAuthenticated) router.push('/login'); }, [hasHydrated, isAuthenticated, router]);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: async () => { const { data } = await api.get('/reviews/my'); return data.data as Review[]; },
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/reviews/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-reviews'] }); toast.success('Review deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, rating, comment }: { id: number; rating: number; comment: string }) =>
      api.put(`/reviews/${id}`, { rating, comment }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-reviews'] }); toast.success('Review updated'); setEditingId(null); },
    onError: () => toast.error('Failed to update'),
  });

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditComment(review.comment || '');
    setEditRating(review.rating);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">My Reviews</h1>
      <p className="text-gray-500 mb-8">Reviews you&apos;ve submitted</p>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : !reviews?.length ? (
        <div className="text-center py-20 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No reviews yet. Book activities and share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
              {editingId === r.id ? (
                <div className="space-y-3">
                  <StarRating rating={editRating} size="lg" interactive onChange={setEditRating} />
                  <textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: r.id, rating: editRating, comment: editComment })}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
                    <button onClick={() => setEditingId(null)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <StarRating rating={r.rating} size="sm" />
                      {r.title && <span className="font-medium text-gray-800 text-sm">{r.title}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Delete this review?')) deleteMutation.mutate(r.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {r.comment && <p className="text-gray-700 text-sm mb-2">{r.comment}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {r.reviewable_type && <span className="capitalize bg-gray-100 px-2 py-0.5 rounded-full">{r.reviewable_type}</span>}
                    <span>{formatDate(r.created_at)}</span>
                    {r.helpful_count && r.helpful_count > 0 && <span>👍 {r.helpful_count} found helpful</span>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
