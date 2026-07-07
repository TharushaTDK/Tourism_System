'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { usePlannerStore } from '@/store/plannerStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
import { estimatedRoadKm } from '@/lib/geo';
import { Destination, TransportRate, CostSetting, CostRange, TripDetails } from '@/types';
import { Check, ChevronRight, MapPin, DollarSign, Calendar, Users, Clock, Mail, Phone, MessageCircle } from 'lucide-react';

const DestinationMap = dynamic(() => import('@/components/DestinationMap'), {
  ssr: false,
  loading: () => <div className="h-[300px] sm:h-[420px] bg-gray-100 rounded-2xl animate-pulse" />,
});

const INTERESTS = ['Beach', 'Wildlife', 'Culture', 'Adventure', 'Food', 'Wellness', 'Photography', 'Nature'];

const BUDGET_OPTIONS = [
  { value: 'budget', label: 'Budget', emoji: '💰', desc: 'Under $50/night', price_multiplier: 1 },
  { value: 'mid_range', label: 'Mid-Range', emoji: '⭐', desc: '$50–$150/night', price_multiplier: 2 },
  { value: 'luxury', label: 'Luxury', emoji: '✨', desc: '$150+/night', price_multiplier: 4 },
];

// Maps a traveler interest to the destination categories it should highlight on the map (✨).
const CATEGORY_INTERESTS: Record<string, string[]> = {
  cultural: ['Culture', 'Food'],
  beach: ['Beach'],
  wildlife: ['Wildlife'],
  hill_country: ['Nature', 'Wellness', 'Photography'],
  adventure: ['Adventure', 'Photography'],
};

const STEP_LABELS = ['Travel Details', 'Pick Destinations', 'Cost Estimate', 'Submitted'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${done ? 'bg-blue-600 text-white' : active ? 'bg-blue-50 text-blue-700 border-2 border-blue-500' : 'bg-gray-100 text-gray-400'}`}>
              {done ? <Check className="w-4 h-4" /> : <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">{step}</span>}
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 hidden sm:block" />}
          </div>
        );
      })}
    </div>
  );
}

export default function PlannerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const {
    step, arrival_date, departure_date, adults, children_6_12, children_under_5, travelers, budget, interests, selected_destinations,
    cost_estimate, contact_email, contact_phone, contact_whatsapp, pendingSubmit, isLoading,
    setStep, setPlannerField, setTravelerGroup, toggleDestination, toggleInterest, setCostEstimate, setLoading, resetPlanner
  } = usePlannerStore();

  const [submitting, setSubmitting] = useState(false);

  // Prefill contact details from the traveler's saved profile; they can still override per trip.
  useEffect(() => {
    if (!user) return;
    if (!contact_email) setPlannerField('contact_email', user.contact_email || user.email || '');
    if (!contact_phone) setPlannerField('contact_phone', user.phone || '');
    if (!contact_whatsapp) setPlannerField('contact_whatsapp', user.whatsapp || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const { data: destinations = [] } = useQuery({
    queryKey: ['planner-destinations'],
    queryFn: async () => {
      const { data } = await api.get('/destinations?limit=100');
      return (data.data?.items ?? []) as Destination[];
    },
  });

  const { data: transportRates = [] } = useQuery({
    queryKey: ['planner-transport-rates'],
    queryFn: async () => { const { data } = await api.get('/pricing/transport-rates'); return data.data as TransportRate[]; },
  });

  const { data: costSettings = [] } = useQuery({
    queryKey: ['planner-cost-settings'],
    queryFn: async () => { const { data } = await api.get('/pricing/settings'); return data.data as CostSetting[]; },
  });

  const suggestedIds = destinations
    .filter((d) => interests.some((i) => CATEGORY_INTERESTS[d.category]?.includes(i)))
    .map((d) => d.id);

  const nights = arrival_date && departure_date
    ? Math.max(1, Math.ceil((new Date(departure_date).getTime() - new Date(arrival_date).getTime()) / 86400000))
    : 0;

  const budgetMultiplier = BUDGET_OPTIONS.find(b => b.value === budget)?.price_multiplier || 1;

  // Approximate, not exact — customers see a range, never a single precise figure.
  const toRange = (value: number): CostRange => {
    const low = Math.max(0, Math.round((value * 0.9) / 5) * 5);
    const high = Math.max(low, Math.round((value * 1.15) / 5) * 5);
    return { low, high };
  };

  const destinationPrice = (d: Destination): number => {
    const raw = budget === 'budget' ? d.budget_price : budget === 'mid_range' ? d.mid_range_price : d.luxury_price;
    return Number(raw) || 0;
  };

  const calcCost = () => {
    const selectedDests = selected_destinations
      .map((id) => destinations.find((d) => d.id === id))
      .filter((d): d is Destination => !!d && d.latitude != null && d.longitude != null);

    let distanceKm = 0;
    for (let i = 1; i < selectedDests.length; i++) {
      const a = selectedDests[i - 1];
      const b = selectedDests[i];
      distanceKm += estimatedRoadKm(Number(a.latitude), Number(a.longitude), Number(b.latitude), Number(b.longitude));
    }

    const tiers = transportRates.filter((r) => r.category === budget).sort((a, b) => a.min_passengers - b.min_passengers);
    const tier = tiers.find((r) => travelers >= r.min_passengers && travelers <= r.max_passengers) || tiers[tiers.length - 1];
    const pricePerKm = tier ? Number(tier.price_per_km) : 0;
    const transportCost = distanceKm * pricePerKm;

    const destinationsCost = selected_destinations.reduce((sum, id) => {
      const d = destinations.find((x) => x.id === id);
      return sum + (d ? destinationPrice(d) * travelers : 0);
    }, 0);

    const setting = costSettings.find((s) => s.category === budget);
    const accommodationCost = (Number(setting?.accommodation_per_night) || 0) * nights * travelers;
    const foodCost = (Number(setting?.food_per_day) || 0) * nights * travelers;

    const total = transportCost + destinationsCost + accommodationCost + foodCost;

    return {
      distance_km: Math.round(distanceKm),
      transport: toRange(transportCost),
      destinations: toRange(destinationsCost),
      accommodation: toRange(accommodationCost),
      food: toRange(foodCost),
      total: toRange(total),
    };
  };

  const rangeMid = (r: CostRange) => Math.round((r.low + r.high) / 2);

  const handleStep3 = async () => {
    const estimate = calcCost();
    setCostEstimate(estimate);
    setStep(3);
  };

  const generateItineraryText = async (): Promise<string> => {
    try {
      const { data } = await api.post('/ai/itinerary', {
        arrival_date, departure_date, travelers, budget, interests, destination_ids: selected_destinations,
      });
      if (data.success) return data.data.itinerary as string;
    } catch {
      // fall through to the local fallback below
    }
    return `**Day-by-Day Itinerary (${nights} Days in Sri Lanka)**\n\n${selected_destinations.slice(0, nights).map((id, i) => {
      const dest = destinations.find(d => d.id === id);
      return `**Day ${i + 1}: ${dest?.name || 'Explore'}**\n- Morning: Sightseeing and exploration\n- Afternoon: Local cuisine and cultural experiences\n- Evening: Rest at hotel\n- Estimated Cost: ${formatCurrency(80 * budgetMultiplier, 'USD')}`;
    }).join('\n\n')}`;
  };

  const handleSubmitForApproval = async () => {
    if (!contact_email.trim() || !contact_phone.trim()) {
      toast.error('Please enter your email and phone number');
      return;
    }
    setSubmitting(true);
    setLoading(true);
    try {
      const estimate = cost_estimate || calcCost();
      const selectedNames = selected_destinations.map(id => destinations.find(d => d.id === id)?.name).filter((n): n is string => !!n);
      const itineraryText = await generateItineraryText();

      const tripDetails: TripDetails = {
        destination_ids: selected_destinations,
        destination_names: selectedNames,
        budget, adults, children_6_12, children_under_5,
        cost_estimate: estimate,
      };

      await api.post('/itineraries', {
        title: `Sri Lanka Trip – ${selectedNames.join(', ')}`,
        start_date: arrival_date,
        end_date: departure_date,
        total_budget: rangeMid(estimate.total),
        estimated_cost: rangeMid(estimate.total),
        notes: itineraryText,
        ai_generated: true,
        contact_email,
        contact_phone,
        contact_whatsapp,
        trip_details: tripDetails,
      });

      queryClient.invalidateQueries({ queryKey: ['my-itineraries'] });
      setStep(4);
    } catch {
      toast.error('Failed to submit your trip request. Please try again.');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleSubmitClick = () => {
    if (!contact_email.trim() || !contact_phone.trim()) {
      toast.error('Please enter your email and phone number');
      return;
    }
    if (!isAuthenticated) {
      setPlannerField('pendingSubmit', true);
      toast('Please log in to submit your trip for approval', { icon: '🔒' });
      router.push('/login?next=/planner');
      return;
    }
    handleSubmitForApproval();
  };

  // After login redirects back here with pendingSubmit still set, finish the submission automatically.
  // Guarded with a ref (not just the store flag) so React Strict Mode's double-invoke in dev
  // can't fire this twice and create duplicate trip requests.
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && pendingSubmit && step === 3 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      setPlannerField('pendingSubmit', false);
      handleSubmitForApproval();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, pendingSubmit]);

  const handlePlanAnother = () => {
    resetPlanner();
    if (user) {
      setPlannerField('contact_email', user.contact_email || user.email || '');
      setPlannerField('contact_phone', user.phone || '');
      setPlannerField('contact_whatsapp', user.whatsapp || '');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            Smart Trip Planner
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">Plan Your Perfect Sri Lanka Trip</h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">We create a personalized itinerary in seconds</p>
        </div>

        <StepIndicator current={step} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600" /> Travel Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Arrival Date</label>
                  <input type="date" value={arrival_date} min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPlannerField('arrival_date', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Departure Date</label>
                  <input type="date" value={departure_date} min={arrival_date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPlannerField('departure_date', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              {nights > 0 && <p className="text-sm text-blue-600 font-medium">📅 {nights} nights in Sri Lanka</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Number of Travelers</label>
                <div className="space-y-4">
                  {[
                    { group: 'adults' as const, label: 'Adults', desc: '13 years and up', value: adults, min: 1 },
                    { group: 'children_6_12' as const, label: 'Children', desc: '6 – 12 years', value: children_6_12, min: 0 },
                    { group: 'children_under_5' as const, label: 'Children', desc: 'Below 5 years', value: children_under_5, min: 0 },
                  ].map(({ group, label, desc, value, min }) => (
                    <div key={group} className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400">{desc}</p>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        <button onClick={() => setTravelerGroup(group, Math.max(min, value - 1))} className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-500 hover:text-blue-600 text-lg font-bold shrink-0">−</button>
                        <span className="text-xl font-bold text-gray-800 w-6 text-center shrink-0">{value}</span>
                        <button onClick={() => setTravelerGroup(group, Math.min(10, value + 1))} className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-500 hover:text-blue-600 text-lg font-bold shrink-0">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-blue-600 font-medium mt-4">{travelers} traveler{travelers > 1 ? 's' : ''} total</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Budget Level</label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {BUDGET_OPTIONS.map((b) => (
                    <button key={b.value} onClick={() => setPlannerField('budget', b.value as 'budget' | 'mid_range' | 'luxury')}
                      className={`p-2.5 sm:p-4 rounded-xl border-2 text-center transition-all ${budget === b.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                      <div className="text-xl sm:text-2xl mb-1">{b.emoji}</div>
                      <div className="font-semibold text-xs sm:text-sm text-gray-800">{b.label}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{b.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Interests (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button key={interest} onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${interests.includes(interest) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => { if (!arrival_date || !departure_date) { toast.error('Please select your travel dates'); return; } setStep(2); }}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                Next Step <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> Select Destinations</h2>
              <p className="text-gray-500 text-sm">Tap a pin on the map (or a chip below) to add it to your trip. {interests.length > 0 && `Destinations matching your interests are marked ✨.`}</p>

              <DestinationMap
                destinations={destinations}
                selectedIds={selected_destinations}
                suggestedIds={suggestedIds}
                onToggle={toggleDestination}
              />

              <div className="flex flex-wrap gap-2">
                {destinations.map((dest) => {
                  const selected = selected_destinations.includes(dest.id);
                  const suggested = suggestedIds.includes(dest.id);
                  return (
                    <button key={dest.id} onClick={() => toggleDestination(dest.id)}
                      className={`relative flex items-center gap-1.5 pl-3 pr-3 py-2 rounded-full border-2 text-sm font-medium transition-all ${selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 bg-white text-gray-700'}`}>
                      <span>{dest.emoji}</span>
                      <span>{dest.name}</span>
                      {suggested && !selected && <span className="text-xs">✨</span>}
                      {selected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-blue-600 font-medium">{selected_destinations.length} destination{selected_destinations.length !== 1 ? 's' : ''} selected</p>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-medium hover:border-gray-400">← Back</button>
                <button onClick={() => { if (selected_destinations.length === 0) { toast.error('Please select at least one destination'); return; } handleStep3(); }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><DollarSign className="w-5 h-5 text-blue-600" /> Cost Estimate</h2>
              {(() => {
                const est = cost_estimate || calcCost();
                const fmtRange = (r: CostRange) => r.low === r.high ? formatCurrency(r.low) : `${formatCurrency(r.low)} – ${formatCurrency(r.high)}`;
                return (
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <div className="space-y-3 mb-4">
                      {[
                        { label: 'Transportation', amount: est.transport, icon: '🚗', note: `≈ ${est.distance_km} km total` },
                        { label: 'Accommodation', amount: est.accommodation, icon: '🏨', note: `${nights} night${nights !== 1 ? 's' : ''}` },
                        { label: 'Destinations', amount: est.destinations, icon: '🎯', note: `${selected_destinations.length} stop${selected_destinations.length !== 1 ? 's' : ''}` },
                        { label: 'Food & Dining', amount: est.food, icon: '🍛', note: `${nights} day${nights !== 1 ? 's' : ''}` },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-2 py-2 border-b border-gray-200 last:border-0">
                          <span className="flex items-center gap-2 text-gray-600 min-w-0 truncate">{item.icon} {item.label}<span className="text-xs text-gray-400 hidden sm:inline">({item.note})</span></span>
                          <span className="font-semibold text-gray-800 shrink-0">{fmtRange(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-3 border-t-2 border-blue-500">
                      <span className="text-base sm:text-lg font-bold text-gray-800">Approximate Total</span>
                      <span className="text-xl sm:text-2xl font-extrabold text-blue-600 shrink-0">{fmtRange(est.total)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">* For {travelers} traveler{travelers > 1 ? 's' : ''} over {nights} night{nights !== 1 ? 's' : ''}.</p>
                    <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-blue-700">This is an approximate range, not a final price. <span className="font-semibold">Your final estimation will be sent to you within a few hours.</span></p>
                    </div>
                  </div>
                );
              })()}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-bold text-gray-800 mb-1">Your Contact Details</h3>
                <p className="text-xs text-gray-400 mb-3">So our team can reach you about this trip. We&apos;ll remember these for next time — feel free to change them per trip.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</label>
                    <input type="email" required value={contact_email} onChange={(e) => setPlannerField('contact_email', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</label>
                    <input type="tel" required value={contact_phone} onChange={(e) => setPlannerField('contact_phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+94 71 234 5678" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="tel" value={contact_whatsapp} onChange={(e) => setPlannerField('contact_whatsapp', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+94 71 234 5678" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-medium hover:border-gray-400">← Back</button>
                <button onClick={handleSubmitClick} disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-6 text-center py-6">
              <div className="text-6xl">🕐</div>
              <h2 className="text-2xl font-bold text-gray-800">Wait for Approval!</h2>
              <p className="text-gray-600 max-w-md mx-auto">Our team will contact you within a few hours to confirm your trip and share the exact price.</p>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 max-w-md mx-auto text-sm text-blue-700 text-left space-y-3">
                <p>✅ Your trip request has been submitted and saved to <Link href="/dashboard" className="underline font-semibold">My Trips</Link>.</p>
                <p>💳 Once our team confirms your exact price, you&apos;ll see it in <Link href="/dashboard/trips" className="underline font-semibold">My Trips</Link> along with a button to make your 20% advance payment and lock in your trip.</p>
                <p>💬 Got a question in the meantime? <Link href="/chat" className="underline font-semibold">Ask our chatbot</Link> — our team will give you full support and exact pricing details within a few minutes.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
                  View My Trips <ChevronRight className="w-4 h-4" />
                </Link>
                <button onClick={handlePlanAnother} className="border-2 border-gray-300 text-gray-600 px-6 py-3 rounded-xl font-medium hover:border-gray-400">
                  Plan Another Trip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
