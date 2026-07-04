'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Car, MapPin,
  BarChart2, Bell, X, Menu, Compass, LogOut, DollarSign, ClipboardCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/drivers', label: 'Drivers', icon: Car },
  { href: '/admin/destinations', label: 'Destinations', icon: MapPin },
  { href: '/admin/pricing', label: 'Pricing', icon: DollarSign },
  { href: '/admin/trips', label: 'Trips', icon: ClipboardCheck },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex flex-col bg-blue-950 text-white min-h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'} shrink-0`}>
        <div className="flex items-center gap-2 px-4 py-5 border-b border-blue-800">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-sm">Admin Panel</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-blue-300 hover:text-white">
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${pathname === href || pathname.startsWith(href + '/')
                ? 'bg-blue-600 text-white'
                : 'text-blue-200 hover:bg-blue-900 hover:text-white'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-blue-800 p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 text-blue-300 hover:text-red-400 text-sm w-full transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-2 bg-blue-950 text-white px-4 py-3 sticky top-16 z-40">
        <Compass className="w-5 h-5 text-blue-400" />
        <span className="font-bold text-sm">Admin</span>
        <div className="flex gap-1 ml-auto overflow-x-auto">
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${pathname === href ? 'bg-blue-600 text-white' : 'text-blue-200 hover:text-white'}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
