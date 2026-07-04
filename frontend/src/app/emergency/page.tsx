'use client';

import { useState } from 'react';
import { Shield, Heart, Globe, Car, HelpCircle, Phone, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const CONTACTS = [
  { type: 'police', label: 'Police', icon: Shield, color: 'blue', phone: '119', altPhone: '011-2326262', address: 'Police Headquarters, Colombo 01', emoji: '🚔' },
  { type: 'hospital', label: 'Hospital', icon: Heart, color: 'red', phone: '1990', altPhone: '011-2691111', address: 'National Hospital, Regent St, Colombo', emoji: '🏥' },
  { type: 'embassy', label: 'Embassy', icon: Globe, color: 'purple', phone: '+94 11 2380000', altPhone: '+94 11 2380001', address: 'Sri Lanka Tourism, 80 Galle Rd, Colombo 03', emoji: '🏛️' },
  { type: 'driver', label: 'Emergency Driver', icon: Car, color: 'green', phone: '+94 77 123 4567', altPhone: '+94 77 765 4321', address: '24/7 available island-wide', emoji: '🚗' },
  { type: 'operator', label: 'Tour Operator', icon: HelpCircle, color: 'orange', phone: '+94 11 234 5678', altPhone: '+94 11 234 5679', address: '42 Galle Road, Colombo 03', emoji: '🎫' },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
  red: 'bg-red-50 border-red-200 hover:border-red-400',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
  green: 'bg-green-50 border-green-200 hover:border-green-400',
  orange: 'bg-orange-50 border-orange-200 hover:border-orange-400',
};

const ICON_COLOR: Record<string, string> = {
  blue: 'text-blue-600 bg-blue-100',
  red: 'text-red-600 bg-red-100',
  purple: 'text-purple-600 bg-purple-100',
  green: 'text-green-600 bg-green-100',
  orange: 'text-orange-600 bg-orange-100',
};

const SAFETY_TIPS = [
  { title: 'Carry Identification', content: 'Always keep a copy of your passport and visa. Keep originals secure in your hotel safe.' },
  { title: 'Share Your Itinerary', content: 'Let someone know your travel plans — which cities, hotels, and dates. Use LankaJourney\'s share feature.' },
  { title: 'Stay Hydrated', content: 'Sri Lanka is tropical. Drink bottled water, avoid ice in street food stalls, and use sunscreen.' },
  { title: 'Currency Safety', content: 'Use ATMs in well-lit areas or banks. Keep emergency cash in a separate secure pocket.' },
  { title: 'Wildlife Encounters', content: 'Do not feed wild animals. Keep safe distances in national parks. Follow your guide\'s instructions.' },
  { title: 'Road Safety', content: 'Traffic drives on the left. Always use reputable transport. Avoid travel at night on mountain roads.' },
];

export default function EmergencyPage() {
  const [locationShared, setLocationShared] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [openTip, setOpenTip] = useState<number | null>(null);

  const shareLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationShared(true); },
      () => alert('Could not get your location. Please enable location permissions.')
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white mb-10 text-center">
        <div className="text-5xl mb-3">🆘</div>
        <h1 className="text-3xl font-extrabold mb-2">Emergency Center</h1>
        <p className="text-red-100">24/7 emergency support for all tourists in Sri Lanka</p>
        <button onClick={shareLocation}
          className={`mt-5 px-6 py-3 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 mx-auto ${locationShared ? 'bg-green-500 text-white' : 'bg-white text-red-600 hover:bg-red-50'}`}>
          <MapPin className="w-4 h-4" />
          {locationShared && location ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Share My Location'}
        </button>
      </div>

      {/* Emergency Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {CONTACTS.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.type} className={`border-2 rounded-xl p-5 transition-all ${COLOR_MAP[c.color]}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${ICON_COLOR[c.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">{c.emoji} {c.label}</h3>
                  <a href={`tel:${c.phone}`} className="block text-2xl font-extrabold text-gray-900 hover:underline mb-1 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-600" /> {c.phone}
                  </a>
                  {c.altPhone && (
                    <a href={`tel:${c.altPhone}`} className="text-sm text-gray-500 hover:underline block mb-1">{c.altPhone}</a>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {c.address}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Tips */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">🛡️ Safety Tips</h2>
        <div className="space-y-2">
          {SAFETY_TIPS.map((tip, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => setOpenTip(openTip === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-gray-800 text-sm">{tip.title}</span>
                {openTip === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {openTip === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100">{tip.content}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
