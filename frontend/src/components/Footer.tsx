import Link from 'next/link';
import { Compass, Phone, Mail, MapPin } from 'lucide-react';

const SOCIAL = [
  { label: 'FB', title: 'Facebook', href: '#' },
  { label: 'IG', title: 'Instagram', href: '#' },
  { label: 'TW', title: 'Twitter / X', href: '#' },
  { label: 'YT', title: 'YouTube', href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-blue-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">LankaJourney<span className="text-blue-400">.lk</span></span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Sri Lanka&apos;s smartest travel platform. Smart trip planning for unforgettable journeys.
            </p>
            <div className="flex gap-3">
              {SOCIAL.map((s) => (
                <a key={s.label} href={s.href} title={s.title} className="w-8 h-8 bg-blue-900 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors text-xs font-bold text-gray-300 hover:text-white">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms & Conditions' },
                { href: '/sitemap', label: 'Sitemap' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-blue-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Explore</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/destinations', label: 'Destinations' },
                { href: '/activities', label: 'Activities' },
                { href: '/packages', label: 'Tour Packages' },
                { href: '/hotels', label: 'Hotels' },
                { href: '/blog', label: 'Travel Blog' },
                { href: '/emergency', label: '🆘 Emergency Center' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-blue-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm mb-5">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-blue-400 shrink-0" /> +94 11 234 5678</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-400 shrink-0" /> info@lankajourney.lk</li>
              <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> 42 Galle Road, Colombo 03, Sri Lanka</li>
            </ul>
            <p className="text-xs text-gray-500 mb-2">Subscribe for travel tips & deals</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-blue-900 text-sm text-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 border border-blue-800"
              />
              <button className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} LankaJourney.lk. All rights reserved.</p>
          <p>Crafted with ❤️ for Sri Lanka&apos;s tourism</p>
        </div>
      </div>
    </footer>
  );
}
