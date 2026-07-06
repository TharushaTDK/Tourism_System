'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Map, Star, User, LogOut,
  ArrowLeft, Menu, X, Compass,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/trips', label: 'My Trips', icon: Map },
  { href: '/dashboard/reviews', label: 'My Reviews', icon: Star },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); router.push('/'); };

  const isActive = (href: string) => href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 shrink-0 min-h-screen bg-white border-r border-gray-100">
        <Link href="/" className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">
            LankaJourney<span className="text-blue-600">.lk</span>
          </span>
        </Link>

        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-blue-700" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 mx-4 mt-4 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href) ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 text-gray-500 hover:text-red-600 text-sm w-full transition-colors">
            <LogOut className="w-4 h-4 shrink-0" /> Logout
          </button>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Website
          </Link>
          <span className="ml-auto font-bold text-gray-800 text-sm truncate">My Dashboard</span>
          <button className="p-2 -mr-2 text-gray-600 shrink-0" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-gray-100 px-2 py-2 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href) ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" /> {label}
              </Link>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4 shrink-0" /> Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
