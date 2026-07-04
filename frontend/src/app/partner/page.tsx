'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Building2, LogIn } from 'lucide-react';

export default function PartnerLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.success && data.data.user.role === 'partner') {
        setAuth(data.data.user, data.data.token);
        toast.success('Welcome to the Partner Portal!');
        router.push('/partner/dashboard');
      } else if (data.success) {
        toast.error('This portal is for registered partners only.');
      }
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Partner Portal</h1>
          <p className="text-blue-300 mt-2">Hotels · Guides · Activity Providers</p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1.5">Email Address</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-white/40 text-sm"
                placeholder="partner@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1.5">Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-white/40 text-sm"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" /> {loading ? 'Signing In...' : 'Access Partner Dashboard'}
            </button>
          </form>
        </div>
        <p className="text-center text-white/40 text-xs mt-4">
          Want to become a partner? <a href="mailto:partners@lankajourney.ai" className="text-blue-300 hover:underline">Contact us</a>
        </p>
      </div>
    </div>
  );
}
