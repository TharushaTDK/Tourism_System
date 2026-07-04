'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Driver } from '@/types';
import { CheckCircle, XCircle, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from '@/components/StarRating';
import { formatDate } from '@/lib/utils';

export default function AdminDriversPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-drivers', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/drivers?${params}`);
      return data.data as (Driver & { is_verified: boolean; vehicle_type?: string; created_at: string })[];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: number; verified: boolean }) =>
      api.put(`/admin/drivers/${id}/verify`, { is_verified: verified }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-drivers'] }); toast.success('Driver status updated'); },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Driver Management</h1>
          <p className="text-gray-500">{data?.length || 0} registered drivers</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search drivers..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Loading...</div> : !data?.length ? <div className="p-8 text-center text-gray-400">No drivers found.</div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Email', 'Vehicle', 'Rating', 'Status', 'Verified', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700">
                        {d.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{d.email}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">{d.vehicle_type || d.vehicle?.type || '—'}</td>
                  <td className="px-4 py-3"><StarRating rating={d.rating || 0} size="sm" /></td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {d.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => verifyMutation.mutate({ id: d.id, verified: true })} title="Verify"
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => verifyMutation.mutate({ id: d.id, verified: false })} title="Reject"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
