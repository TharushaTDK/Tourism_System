'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardStats, TouristAnalytics, RevenueAnalytics, RouteAnalytics } from '@/types';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import { formatCurrency, buildMonthlySeries } from '@/lib/utils';
import { TrendingUp, Globe, Clock, DollarSign } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const COLORS = ['rgba(5,150,105,0.8)', 'rgba(20,184,166,0.8)', 'rgba(59,130,246,0.8)', 'rgba(168,85,247,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'];

export default function AdminAnalyticsPage() {
  const { data: dashboard } = useQuery({
    queryKey: ['admin-analytics-dashboard'],
    queryFn: async () => { const { data } = await api.get('/analytics/dashboard'); return data.data as DashboardStats; },
  });
  const { data: tourists } = useQuery({
    queryKey: ['admin-analytics-tourists'],
    queryFn: async () => { const { data } = await api.get('/analytics/tourists'); return data.data as TouristAnalytics; },
  });
  const { data: revenue } = useQuery({
    queryKey: ['admin-analytics-revenue'],
    queryFn: async () => { const { data } = await api.get('/analytics/revenue'); return data.data as RevenueAnalytics; },
  });
  const { data: routes } = useQuery({
    queryKey: ['admin-analytics-routes'],
    queryFn: async () => { const { data } = await api.get('/analytics/routes'); return data.data as RouteAnalytics; },
  });

  const nationalityData = tourists?.by_nationality ?? [];
  const { labels: monthLabels, data: monthlyRevenue } = buildMonthlySeries(dashboard?.monthly_revenue);
  const destData = dashboard?.top_destinations ?? [];
  const bookingTypes = revenue?.by_booking_type ?? [];

  const keyMetrics = [
    { label: 'Avg Trip Duration', value: routes?.avg_trip_duration ? `${Number(routes.avg_trip_duration).toFixed(1)} days` : '—', icon: Clock, color: 'emerald' },
    { label: 'Avg Tourist Spend', value: formatCurrency(revenue?.avg_trip_spend ?? 0), icon: DollarSign, color: 'yellow' },
    { label: 'Nationalities', value: nationalityData.length ? `${nationalityData.length}+` : '0', icon: Globe, color: 'blue' },
    { label: 'Repeat Tourists', value: `${tourists?.repeat_tourist_rate ?? 0}%`, icon: TrendingUp, color: 'purple' },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
        <p className="text-gray-500">Platform performance overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {keyMetrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 min-w-0">
            <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 min-w-0">
          <h2 className="font-bold text-gray-800 mb-4">Monthly Revenue ({new Date().getFullYear()})</h2>
          <div className="w-full">
            <Line data={{
              labels: monthLabels,
              datasets: [{ label: 'Revenue ($)', data: monthlyRevenue, borderColor: 'rgb(5,150,105)', backgroundColor: 'rgba(5,150,105,0.1)', tension: 0.4, fill: true }]
            }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>

        {/* Nationality Pie */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 min-w-0">
          <h2 className="font-bold text-gray-800 mb-4">Tourists by Nationality</h2>
          {nationalityData.length ? (
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <Pie data={{
                  labels: nationalityData.map((n) => n.nationality),
                  datasets: [{ data: nationalityData.map((n) => n.count), backgroundColor: COLORS }]
                }} options={{ responsive: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }} />
              </div>
            </div>
          ) : <p className="text-center text-gray-400 text-sm py-8">No tourist data yet.</p>}
        </div>

        {/* Popular Destinations Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 min-w-0">
          <h2 className="font-bold text-gray-800 mb-4">Most Visited Destinations</h2>
          {destData.length ? (
            <div className="w-full">
              <Bar data={{
                labels: destData.map((d) => d.name),
                datasets: [{ label: 'Bookings', data: destData.map((d) => d.booking_count), backgroundColor: 'rgba(5,150,105,0.7)', borderRadius: 6 }]
              }} options={{ responsive: true, plugins: { legend: { display: false } }, indexAxis: 'y' as const }} />
            </div>
          ) : <p className="text-center text-gray-400 text-sm py-8">No booking data yet.</p>}
        </div>

        {/* Booking Types Doughnut */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 min-w-0">
          <h2 className="font-bold text-gray-800 mb-4">Booking Types</h2>
          {bookingTypes.length ? (
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <Doughnut data={{
                  labels: bookingTypes.map((b) => b.booking_type),
                  datasets: [{ data: bookingTypes.map((b) => b.count), backgroundColor: COLORS.slice(0, 4) }]
                }} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </div>
          ) : <p className="text-center text-gray-400 text-sm py-8">No paid bookings yet.</p>}
        </div>
      </div>
    </div>
  );
}
