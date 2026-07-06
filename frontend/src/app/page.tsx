'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Search, Map, BookOpen, Compass, Star, Calendar, Phone, Shield, Globe, Award } from 'lucide-react';
import api from '@/lib/api';
import DestinationCard from '@/components/DestinationCard';
import ActivityCard from '@/components/ActivityCard';
import PackageCard from '@/components/PackageCard';
import StarRating from '@/components/StarRating';
import PlanTripLink from '@/components/PlanTripLink';
import { Destination, Activity, TourPackage, Event } from '@/types';

const TESTIMONIALS = [
  { name: 'Sarah Johnson', country: '🇺🇸 USA', rating: 5, text: 'LankaJourney.lk planned my entire Sri Lanka trip in minutes. The itinerary was spot on — every destination perfectly timed!', avatar: 'SJ' },
  { name: 'Marcus Weber', country: '🇩🇪 Germany', rating: 5, text: 'From airport pickup to the last safari, everything was seamlessly organized. The live tracking gave my family real peace of mind.', avatar: 'MW' },
  { name: 'Yuki Tanaka', country: '🇯🇵 Japan', rating: 5, text: 'The chat assistant answered all my questions about visas and local culture. An absolutely brilliant platform!', avatar: 'YT' },
];

const HOW_IT_WORKS = [
  { step: 1, icon: Search, title: 'Search', desc: 'Browse hundreds of destinations, activities, and packages.' },
  { step: 2, icon: Sparkles, title: 'Plan Your Trip', desc: 'Let us generate a personalized itinerary in seconds.' },
  { step: 3, icon: BookOpen, title: 'Book Instantly', desc: 'Book hotels, activities, and transport in one place.' },
  { step: 4, icon: Compass, title: 'Explore', desc: 'Follow your itinerary with live tracking and support.' },
];

export default function HomePage() {
  const { data: destinations } = useQuery({
    queryKey: ['featured-destinations'],
    queryFn: async () => {
      const { data } = await api.get('/destinations/featured');
      return (data.data ?? []) as Destination[];
    },
  });

  const { data: activities } = useQuery({
    queryKey: ['featured-activities'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { items: Activity[] } }>('/activities?featured=true&limit=4');
      return data.data?.items || [];
    },
  });

  const { data: packages } = useQuery({
    queryKey: ['featured-packages'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { items: TourPackage[] } }>('/packages?featured=true&limit=4');
      return data.data?.items || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Event[] }>('/events?limit=3');
      return data.data || [];
    },
  });

  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const startHeroVideo = () => {
    const video = heroVideoRef.current;
    if (video) video.currentTime = 0.07;
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-blue-900">
        <video
          ref={heroVideoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={startHeroVideo}
          onEnded={(e) => { e.currentTarget.currentTime = 0.07; e.currentTarget.play(); }}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/Sri lanka.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white text-sm px-4 py-2 rounded-full mb-6 border border-white/20">
            Sri Lanka&apos;s #1 Travel Platform
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Discover<br />
            <span className="text-blue-300">Sri Lanka&apos;s</span> Magic
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Smart trip planning for your perfect island adventure. From ancient temples to pristine beaches.
          </p>
          <div className="flex justify-center">
            <PlanTripLink className="bg-white text-blue-700 font-bold px-8 py-3.5 rounded-full hover:bg-blue-50 transition-colors flex items-center gap-2 text-lg">
              Plan My Trip
            </PlanTripLink>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Top Destinations</h2>
              <p className="text-gray-500 mt-1">Handpicked gems across Sri Lanka</p>
            </div>
            <Link href="/destinations" className="text-blue-600 font-medium hover:underline">View all →</Link>
          </div>
          {destinations && destinations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(destinations) ? destinations : (destinations as { items?: Destination[] })?.items || []).slice(0, 6).map((d: Destination) => (
                <DestinationCard key={d.id} destination={d} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Activities */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Popular Activities</h2>
              <p className="text-gray-500 mt-1">Thrilling experiences across the island</p>
            </div>
            <Link href="/activities" className="text-blue-600 font-medium hover:underline">View all →</Link>
          </div>
          {activities && activities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {activities.map((a) => <ActivityCard key={a.id} activity={a} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />)}
            </div>
          )}
        </div>
      </section>

      {/* Tour Packages */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Popular Tour Packages</h2>
              <p className="text-gray-500 mt-1">All-inclusive packages for every traveler</p>
            </div>
            <Link href="/packages" className="text-blue-600 font-medium hover:underline">View all →</Link>
          </div>
          {packages && packages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {packages.map((p) => <PackageCard key={p.id} pkg={p} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />)}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-950 to-blue-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">How LankaJourney.lk Works</h2>
          <p className="text-blue-300 mb-14">Plan your perfect Sri Lanka trip in 4 simple steps</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, i) => (
              <div key={step} className="relative">
                {i < 3 && <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-blue-500/50 to-transparent" />}
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Step {step}</div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-blue-300/70 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trip Planner CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <div className="text-5xl mb-4">🧭</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Let Us Plan Your Perfect Trip</h2>
          <p className="text-blue-100 text-lg mb-8">
            Answer a few questions and we&apos;ll generate a complete, personalized itinerary with cost estimates in under 30 seconds.
          </p>
          <PlanTripLink className="bg-white text-blue-700 font-bold px-10 py-4 rounded-full hover:bg-blue-50 transition-colors text-lg inline-flex items-center gap-2">
            Start Planning for Free
          </PlanTripLink>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">What Tourists Say</h2>
            <p className="text-gray-500 mt-2">Real experiences from our traveler community</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <StarRating rating={t.rating} size="sm" />
                <p className="text-gray-700 mt-4 mb-5 leading-relaxed text-sm italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {events && events.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Upcoming Events & Festivals</h2>
                <p className="text-gray-500 mt-1">Experience Sri Lanka&apos;s vibrant culture</p>
              </div>
              <Link href="/events" className="text-blue-600 font-medium hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {events.map((e: Event) => (
                <div key={e.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <div className="h-40 bg-gradient-to-br from-blue-400 to-blue-600 relative overflow-hidden">
                    {e.image_url && <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" />}
                    <span className="absolute top-3 left-3 bg-white/90 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full capitalize">{e.category}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 mb-1">{e.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <Calendar className="w-3.5 h-3.5" /> {e.start_date} – {e.end_date}
                    </div>
                    <p className="text-xs text-gray-500">{e.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Emergency Panel */}
      <section className="py-12 px-4 bg-red-50 border-t border-red-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-3xl mb-3">🆘</div>
          <h3 className="text-xl font-bold text-red-800 mb-2">Emergency Center</h3>
          <p className="text-red-600 text-sm mb-5">24/7 emergency support for all tourists in Sri Lanka</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Police', phone: '119', icon: Shield },
              { label: 'Hospital', phone: '1990', icon: Phone },
              { label: 'Embassy', phone: '+94 11 2380000', icon: Globe },
            ].map((c) => (
              <a key={c.label} href={`tel:${c.phone}`} className="flex items-center gap-2 bg-white border border-red-200 text-red-700 px-5 py-2.5 rounded-full hover:bg-red-100 transition-colors font-medium text-sm">
                <c.icon className="w-4 h-4" /> {c.label}: {c.phone}
              </a>
            ))}
            <Link href="/emergency" className="bg-red-600 text-white px-5 py-2.5 rounded-full hover:bg-red-700 transition-colors font-medium text-sm">
              Full Emergency Center →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
