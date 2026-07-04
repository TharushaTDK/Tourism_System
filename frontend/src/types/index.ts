export interface User {
  id: number;
  name: string;
  email: string;
  role: 'tourist' | 'driver' | 'admin' | 'partner';
  phone?: string;
  whatsapp?: string;
  contact_email?: string;
  nationality?: string;
  profile_image?: string;
  is_verified?: boolean;
  created_at: string;
}

export interface Destination {
  id: number;
  name: string;
  slug?: string;
  description: string;
  short_description?: string;
  location: string;
  country: string;
  province?: string;
  category: string;
  emoji?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  image_urls?: string[];
  video_url?: string;
  best_time_to_visit?: string;
  entry_fee?: number;
  opening_hours?: string;
  rating: number;
  review_count?: number;
  price_per_person?: number;
  is_featured?: boolean;
  budget_price?: number | string;
  mid_range_price?: number | string;
  luxury_price?: number | string;
  created_at: string;
}

export type BudgetCategory = 'budget' | 'mid_range' | 'luxury';

export interface TransportRate {
  id: number;
  category: BudgetCategory;
  vehicle_type: string;
  min_passengers: number;
  max_passengers: number;
  price_per_km: number | string;
}

export interface CostSetting {
  id: number;
  category: BudgetCategory;
  accommodation_per_night: number | string;
  food_per_day: number | string;
}

export interface Booking {
  id: number;
  user_id: number;
  booking_type?: 'hotel' | 'activity' | 'transport' | 'package' | 'destination';
  destination_id?: number;
  destination_name?: string;
  image_url?: string;
  location?: string;
  reference_id?: number;
  check_in?: string;
  check_out?: string;
  guests: number;
  total_price?: number;
  amount?: number;
  total_amount?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status?: 'unpaid' | 'paid' | 'refunded';
  special_requests?: string;
  created_at: string;
}

export interface Review {
  id: number;
  user_id: number;
  user_name?: string;
  reviewable_type?: string;
  reviewable_id?: number;
  destination_id?: number;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  is_verified?: boolean;
  helpful_count?: number;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedDestinations {
  destinations: Destination[];
  total: number;
  page: number;
  limit: number;
}

export interface Activity {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: 'safari' | 'train' | 'hiking' | 'adventure' | 'cultural' | 'wellness';
  location: string;
  destination_id?: number;
  duration_hours?: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  min_group: number;
  max_group: number;
  price_per_person: number;
  image_urls: string[];
  rating: number;
  review_count: number;
  is_featured?: boolean;
  created_at?: string;
}

export interface Hotel {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: 'budget' | 'mid_range' | 'luxury';
  type: 'hotel' | 'villa' | 'resort' | 'homestay';
  destination_id?: number;
  address: string;
  price_per_night: number;
  amenities: string[];
  image_urls: string[];
  rating: number;
  review_count: number;
  star_rating?: number;
  is_featured?: boolean;
  created_at?: string;
}

export interface TourPackage {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: 'budget' | 'family' | 'honeymoon' | 'adventure' | 'luxury' | 'wildlife';
  duration_days: number;
  price_per_person: number;
  max_group: number;
  inclusions: string[];
  exclusions: string[];
  image_urls: string[];
  rating: number;
  review_count: number;
  is_featured?: boolean;
  created_at?: string;
}

export interface TripDetails {
  destination_ids: number[];
  destination_names: string[];
  budget: 'budget' | 'mid_range' | 'luxury';
  adults: number;
  children_6_12: number;
  children_under_5: number;
  cost_estimate: CostEstimate;
}

export interface Trip {
  id: number;
  user_id: number;
  title: string;
  start_date: string;
  end_date: string;
  total_days: number;
  total_budget?: number;
  estimated_cost?: number;
  status: 'draft' | 'planned' | 'active' | 'completed' | 'pending_approval' | 'approved';
  notes?: string;
  ai_generated: boolean;
  share_token?: string;
  items?: ItineraryItem[];
  contact_email?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  trip_details?: TripDetails;
  customer_name?: string;
  account_email?: string;
  approved_at?: string;
  created_at?: string;
}

export interface ItineraryItem {
  id: number;
  itinerary_id: number;
  day_number: number;
  order_number: number;
  type: 'destination' | 'activity' | 'hotel' | 'transport' | 'meal';
  reference_id?: number;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  cost?: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface Vehicle {
  id: number;
  driver_id: number;
  type: 'sedan' | 'suv' | 'van' | 'luxury';
  make: string;
  model: string;
  year: number;
  plate_number: string;
  capacity: number;
  ac: boolean;
  image_url?: string;
  is_available: boolean;
}

export interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  profile_image?: string;
  rating: number;
  languages?: string[];
  vehicle?: Vehicle;
  is_verified?: boolean;
  completed_trips?: number;
  created_at?: string;
}

export interface DriverTrip {
  id: number;
  driver_id: number;
  tourist_id: number;
  vehicle_id: number;
  origin: string;
  destination: string;
  pickup_date: string;
  pickup_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  fare?: number;
  driver?: Driver;
  vehicle?: Vehicle;
  created_at?: string;
}

export interface TripLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  recorded_at: string;
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  description?: string;
  location: string;
  start_date: string;
  end_date: string;
  category: 'festival' | 'cultural' | 'sports' | 'nature';
  image_url?: string;
  is_featured?: boolean;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: 'visa' | 'culture' | 'tips' | 'currency' | 'safety' | 'food';
  author_id: number;
  author_name?: string;
  image_url?: string;
  tags: string[];
  published: boolean;
  view_count: number;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id?: number;
  type: 'booking' | 'weather' | 'event' | 'recommendation' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  sent_at: string;
}

export interface EmergencyContact {
  id: number;
  type: 'police' | 'hospital' | 'embassy' | 'driver' | 'operator';
  name: string;
  phone: string;
  address?: string;
  city?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface CostRange {
  low: number;
  high: number;
}

export interface CostEstimate {
  distance_km: number;
  transport: CostRange;
  accommodation: CostRange;
  destinations: CostRange;
  food: CostRange;
  total: CostRange;
}

export interface PlannerState {
  arrival_date: string;
  departure_date: string;
  travelers: number;
  budget: 'budget' | 'mid_range' | 'luxury';
  interests: string[];
  selected_destinations: number[];
  cost_estimate?: CostEstimate;
}

export interface DashboardStats {
  active_tours: number;
  total_revenue: number;
  tourist_count: number;
  drivers_online: number;
  bookings_today: number;
  top_destinations: { name: string; booking_count: number }[];
  nationality_breakdown: { nationality: string; count: number }[];
  monthly_revenue: { month: string; revenue: number }[];
}

export interface TouristAnalytics {
  total: number;
  by_nationality: { nationality: string; count: number }[];
  monthly_registrations: { month: string; new_tourists: number }[];
  repeat_tourist_rate: number;
}

export interface RevenueAnalytics {
  total_revenue: number;
  total_transactions: number;
  monthly: { month: string; revenue: number; transactions: number }[];
  by_booking_type: { booking_type: string; revenue: number; count: number }[];
  avg_trip_spend: number;
}

export interface RouteAnalytics {
  popular_routes: { origin: string; destination: string; trip_count: number }[];
  avg_trip_duration: number | null;
}
