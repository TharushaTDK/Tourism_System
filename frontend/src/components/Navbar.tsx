'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import PlanTripLink from '@/components/PlanTripLink';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Compass, Bell, MessageCircle, Menu, X, User, LogOut,
  ChevronDown, MapPin, Waves, TreePine, Mountain, LayoutDashboard,
} from 'lucide-react';

const DEST_CATEGORIES = [
  { label: 'Cultural', icon: '🏛️', href: '/destinations?category=cultural', desc: 'Temples, ruins & heritage' },
  { label: 'Beach', icon: '🏖️', href: '/destinations?category=beach', desc: 'Pristine coastal beauty' },
  { label: 'Wildlife', icon: '🦁', href: '/destinations?category=wildlife', desc: 'Safaris & national parks' },
  { label: 'Hill Country', icon: '🏔️', href: '/destinations?category=hill_country', desc: 'Tea estates & waterfalls' },
  { label: 'Adventure', icon: '🧗', href: '/destinations?category=adventure', desc: 'Hiking, surfing & more' },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const handleLogout = () => { logout(); setUserOpen(false); router.push('/'); };

  const isActive = (href: string) => pathname === href;

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors px-1 py-0.5 border-b-2 ${
        isActive(href) ? 'text-blue-600 border-blue-500' : 'text-gray-700 border-transparent hover:text-blue-600 hover:border-blue-300'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">
              LankaJourney<span className="text-blue-600">.lk</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-5">
            {/* Destinations mega */}
            <div className="relative" onMouseEnter={() => setDestOpen(true)} onMouseLeave={() => setDestOpen(false)}>
              <button className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Destinations <ChevronDown className="w-4 h-4" />
              </button>
              {destOpen && (
                <div className="absolute top-full left-0 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 mt-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Browse by Category</p>
                  {DEST_CATEGORIES.map((c) => (
                    <Link key={c.label} href={c.href} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition-colors group">
                      <span className="text-xl">{c.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{c.label}</p>
                        <p className="text-xs text-gray-400">{c.desc}</p>
                      </div>
                    </Link>
                  ))}
                  <Link href="/destinations" className="block mt-3 text-center text-xs text-blue-600 font-medium hover:underline">
                    View All Destinations →
                  </Link>
                </div>
              )}
            </div>

            {navLink('/activities', 'Activities')}
            {navLink('/packages', 'Packages')}
            {navLink('/hotels', 'Hotels')}

            <PlanTripLink className="text-sm font-semibold bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-1.5">
              Plan My Trip
            </PlanTripLink>

            {navLink('/blog', 'Blog')}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/chat" title="Chat Assistant" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <MessageCircle className="w-5 h-5" />
            </Link>

            <Link href="/dashboard" title="Notifications" className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserOpen(false)}>
                      <LayoutDashboard className="w-4 h-4" /> My Dashboard
                    </Link>
                    <Link href="/dashboard/profile" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserOpen(false)}>
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    {user?.role === 'admin' && (
                      <Link href="/admin/dashboard" className="flex items-center gap-2 px-4 py-3 text-sm text-purple-700 hover:bg-purple-50" onClick={() => setUserOpen(false)}>
                        <MapPin className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-gray-100">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5">Login</Link>
                <Link href="/register" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          {[
            { href: '/destinations', label: 'Destinations' },
            { href: '/activities', label: 'Activities' },
            { href: '/packages', label: 'Packages' },
            { href: '/hotels', label: 'Hotels' },
            { href: '/blog', label: 'Blog' },
            { href: '/emergency', label: '🆘 Emergency' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="block py-2 text-gray-700 font-medium border-b border-gray-50" onClick={() => setMobileOpen(false)}>
              {l.label}
            </Link>
          ))}
          <PlanTripLink className="block text-center bg-blue-600 text-white py-2.5 rounded-lg font-semibold" onNavigate={() => setMobileOpen(false)}>
            Plan My Trip
          </PlanTripLink>
          {isAuthenticated ? (
            <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="w-full text-red-600 py-2 text-sm">
              Logout
            </button>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="flex-1 text-center py-2 border border-gray-200 rounded-lg text-sm" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link href="/register" className="flex-1 text-center py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
