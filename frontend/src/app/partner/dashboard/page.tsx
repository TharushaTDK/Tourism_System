'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Building2, Activity, DollarSign, Star, Edit, BarChart2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MOCK_REVENUE = [2400, 3200, 2800, 4100, 3600, 4800, 5200, 4900, 4300, 3800, 4600, 5800];

const TABS = ['My Listings', 'Bookings', 'Revenue', 'Reviews'];

export default function PartnerDashboardPage() {
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('My Listings');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/partner'); return; }
    if (user?.role !== 'partner') { router.push('/'); }
  }, [hasHydrated, isAuthenticated, user, router]);

  const { data: listings } = useQuery({
    queryKey: ['partner-listings'],
    queryFn: async () => { const { data } = await api.get('/partners/my/listings'); return data.data; },
    enabled: isAuthenticated,
  });

  const { data: bookings } = useQuery({
    queryKey: ['partner-bookings'],
    queryFn: async () => { const { data } = await api.get('/partners/my/bookings'); return data.data; },
    enabled: isAuthenticated,
  });

  const totalRevenue = MOCK_REVENUE.reduce((a, b) => a + b, 0);

  if (!isAuthenticated || user?.role !== 'partner') return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Partner Dashboard</h1>
        <p className="text-gray-500">Welcome, {user?.name}! Manage your listings and revenue.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: 'My Listings', value: listings?.length || 0, icon: Building2, color: 'blue' },
          { label: 'Active Bookings', value: bookings?.filter((b: { status: string }) => b.status === 'confirmed')?.length || 0, icon: Activity, color: 'emerald' },
          { label: 'Annual Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'yellow' },
          { label: 'Avg Rating', value: '4.7 ⭐', icon: Star, color: 'orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-5 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 bg-${color}-100 rounded-xl flex items-center justify-center mb-2 sm:mb-3`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${color}-600`} />
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-800 truncate">{value}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-100 pb-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap shrink-0 ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* My Listings */}
      {activeTab === 'My Listings' && (
        <div>
          {!listings?.length ? (
            <div className="text-center py-16 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p>No listings yet. Contact admin to add your hotel or activity.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((listing: { id: number; name: string; type?: string; category?: string; rating: number; image_urls?: string[] }) => (
                <div key={listing.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {listing.image_urls?.[0] && <img src={listing.image_urls[0]} alt={listing.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{listing.name}</h3>
                    <p className="text-xs text-gray-400 capitalize">{listing.type || listing.category} · ⭐ {Number(listing.rating).toFixed(1)}</p>
                    <button className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <Edit className="w-3.5 h-3.5" /> Edit Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Revenue Chart */}
      {activeTab === 'Revenue' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="font-bold text-gray-800">Monthly Revenue ({new Date().getFullYear()})</h2>
          </div>
          <Bar data={{
            labels: MONTHS,
            datasets: [{ label: 'Revenue ($)', data: MOCK_REVENUE, backgroundColor: 'rgba(5, 150, 105, 0.7)', borderRadius: 6 }]
          }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          <p className="text-center text-sm text-gray-500 mt-4">Total Revenue: <span className="font-bold text-blue-600">{formatCurrency(totalRevenue)}</span></p>
        </div>
      )}

      {/* Bookings */}
      {activeTab === 'Bookings' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!bookings?.length ? (
            <p className="text-center py-16 text-gray-400">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Booking ID', 'Listing', 'Guest', 'Date', 'Amount', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((b: { id: number; reference_name?: string; user_name?: string; check_in?: string; total_amount?: number; status: string }) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">#{b.id}</td>
                      <td className="px-4 py-3">{b.reference_name || '—'}</td>
                      <td className="px-4 py-3">{b.user_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{b.check_in || '—'}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{formatCurrency(b.total_amount || 0)}</td>
                      <td className="px-4 py-3"><span className="capitalize text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Reviews' && (
        <div className="text-center py-16 text-gray-400">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>Reviews for your listings will appear here.</p>
        </div>
      )}
    </div>
  );
}
