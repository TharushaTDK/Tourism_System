'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login');
  }, [hasHydrated, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8">
        <div className="flex items-center gap-4 sm:gap-5 mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <User className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{user.name}</h1>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Shield, label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
            { icon: Calendar, label: 'Member Since', value: new Date(user.created_at).toLocaleDateString() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Icon className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-medium text-gray-700 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 w-full py-2.5 border-2 border-red-300 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
