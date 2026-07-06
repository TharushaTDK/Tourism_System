'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import { Users, Car, MapPin, DollarSign, BookOpen, TrendingUp } from 'lucide-react';
import { formatCurrency, buildMonthlySeries } from '@/lib/utils';
import { Line } from 'react-chartjs-2';
import Link from 'next/link';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => { const { data } = await api.get('/analytics/dashboard'); return data.data as DashboardStats; },
  });

  const { data: recentBookings } = useQuery({
    queryKey: ['admin-recent-bookings'],
    queryFn: async () => { const { data } = await api.get('/bookings?limit=5'); return data.data; },
  });

  const STAT_CARDS = [
    { label: 'Active Tours', value: stats?.active_tours ?? 0, icon: MapPin, color: 'emerald', href: '/tracking' },
    { label: 'Total Revenue', value: formatCurrency(stats?.total_revenue ?? 0), icon: DollarSign, color: 'yellow', href: '/admin/analytics' },
    { label: 'Tourist Count', value: (stats?.tourist_count ?? 0).toLocaleString(), icon: Users, color: 'blue', href: '/admin/users' },
    { label: 'Drivers Online', value: stats?.drivers_online ?? 0, icon: Car, color: 'orange', href: '/admin/drivers' },
    { label: "Today's Bookings", value: stats?.bookings_today ?? 0, icon: BookOpen, color: 'purple', href: '/admin/trips' },
  ];

  const { labels: monthLabels, data: monthlyRevenue } = buildMonthlySeries(stats?.monthly_revenue);
  const topDestinations = stats?.top_destinations ?? [];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500">LankaJourney.lk — Platform Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <p className="text-xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" /> Monthly Revenue</h2>
            <span className="text-xs text-gray-400">{new Date().getFullYear()}</span>
          </div>
          <Line
            data={{
              labels: monthLabels,
              datasets: [{
                label: 'Revenue ($)',
                data: monthlyRevenue,
                borderColor: 'rgb(5, 150, 105)',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
              }]
            }}
            options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
          />
        </div>

        {/* Top Destinations */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4">Top Destinations</h2>
          {topDestinations.length ? (
            <div className="space-y-3">
              {topDestinations.slice(0, 5).map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="w-6 text-xs font-bold text-gray-400">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{d.name}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (d.booking_count / (topDestinations[0]?.booking_count || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{d.booking_count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-8">No destination activity yet.</p>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Recent Bookings</h2>
          <Link href="/admin/trips" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        {recentBookings?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-gray-50">
                <tr>
                  {['ID', 'Tourist', 'Type', 'Amount', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentBookings.map((b: { id: number; user_name?: string; booking_type?: string; total_amount?: number; status: string }) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">#{b.id}</td>
                    <td className="px-4 py-3 font-medium">{b.user_name || '—'}</td>
                    <td className="px-4 py-3 capitalize text-gray-500">{b.booking_type || '—'}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(b.total_amount || 0)}</td>
                    <td className="px-4 py-3"><span className="capitalize text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">No bookings yet.</p>
        )}
      </div>
    </div>
  );
}
