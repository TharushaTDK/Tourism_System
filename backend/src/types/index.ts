export type UserRole = 'tourist' | 'driver' | 'admin' | 'partner';
export type BookingType = 'hotel' | 'activity' | 'transport' | 'package';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ItineraryStatus = 'draft' | 'planned' | 'active' | 'completed';
export type ReviewableType = 'destination' | 'activity' | 'hotel' | 'driver' | 'package';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  phone?: string;
  nationality?: string;
  profile_image?: string;
  role: UserRole;
  is_verified: boolean;
  google_id?: string;
  reset_token?: string;
  reset_token_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Destination {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: 'cultural' | 'beach' | 'wildlife' | 'hill_country' | 'adventure';
  country: string;
  province: string;
  latitude: number;
  longitude: number;
  image_urls: string[];
  video_url?: string;
  best_time_to_visit?: string;
  entry_fee?: number;
  opening_hours?: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Attraction {
  id: number;
  destination_id: number;
  name: string;
  description?: string;
  image_url?: string;
  distance_km?: number;
  travel_time_minutes?: number;
  is_free: boolean;
  entry_fee?: number;
  created_at: Date;
  updated_at: Date;
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
  is_featured: boolean;
  is_active: boolean;
  provider_id?: number;
  created_at: Date;
  updated_at: Date;
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
  latitude?: number;
  longitude?: number;
  price_per_night: number;
  amenities: string[];
  image_urls: string[];
  rating: number;
  review_count: number;
  star_rating?: number;
  is_featured: boolean;
  is_active: boolean;
  partner_id?: number;
  created_at: Date;
  updated_at: Date;
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
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
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
  itinerary_overview: Record<string, unknown>;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_active: boolean;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Itinerary {
  id: number;
  user_id: number;
  title: string;
  start_date: Date;
  end_date: Date;
  total_days: number;
  total_budget?: number;
  estimated_cost?: number;
  status: ItineraryStatus;
  notes?: string;
  ai_generated: boolean;
  share_token?: string;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface Booking {
  id: number;
  user_id: number;
  booking_type: BookingType;
  reference_id: number;
  itinerary_id?: number;
  check_in?: Date;
  check_out?: Date;
  guests: number;
  amount: number;
  discount: number;
  total_amount: number;
  status: BookingStatus;
  special_requests?: string;
  payment_status: PaymentStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: number;
  booking_id: number;
  user_id: number;
  amount: number;
  currency: string;
  payment_method: 'card' | 'paypal' | 'bank';
  transaction_id: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  payment_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Trip {
  id: number;
  booking_id?: number;
  driver_id: number;
  tourist_id: number;
  vehicle_id: number;
  origin: string;
  destination: string;
  pickup_date: Date;
  pickup_time: string;
  status: TripStatus;
  total_km?: number;
  fare?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TripTracking {
  id: number;
  trip_id: number;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  recorded_at: Date;
}

export interface Review {
  id: number;
  user_id: number;
  reviewable_type: ReviewableType;
  reviewable_id: number;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  is_verified: boolean;
  helpful_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  description?: string;
  location: string;
  destination_id?: number;
  start_date: Date;
  end_date: Date;
  category: 'festival' | 'cultural' | 'sports' | 'nature';
  image_url?: string;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: 'visa' | 'culture' | 'tips' | 'currency' | 'safety' | 'food';
  author_id: number;
  image_url?: string;
  tags: string[];
  published: boolean;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: number;
  user_id?: number;
  type: 'booking' | 'weather' | 'event' | 'recommendation' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  sent_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface EmergencyContact {
  id: number;
  type: 'police' | 'hospital' | 'embassy' | 'driver' | 'operator';
  name: string;
  phone: string;
  address?: string;
  city?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AIRecommendation {
  id: number;
  user_id?: number;
  session_id?: string;
  destination_id?: number;
  recommendation_type: 'attraction' | 'route' | 'activity' | 'package';
  data: Record<string, unknown>;
  score?: number;
  created_at: Date;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
