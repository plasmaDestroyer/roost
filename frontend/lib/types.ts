// Mirrors backend/app/schemas.py.

export type User = {
  id: number;
  name: string;
  avatar_url: string;
  bio: string;
  is_host: boolean;
  is_superhost: boolean;
  created_at: string;
};

export type Amenity = { id: number; name: string; icon: string };
export type Photo = { id: number; url: string };
export type Review = { id: number; rating: number; comment: string; created_at: string; author: User };

export type ListingCard = {
  id: number;
  title: string;
  property_type: string;
  category: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  rating: number | null;
  review_count: number;
  photos: Photo[];
  host: User;
};

export type ListingDetail = ListingCard & {
  description: string;
  cleaning_fee: number;
  amenities: Amenity[];
  reviews: Review[];
};

export type ListingInput = {
  title: string;
  description: string;
  property_type: string;
  category: string;
  city: string;
  country: string;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  photo_urls: string[];
  amenity_ids: number[];
};

export type Page = { items: ListingCard[]; total: number; page: number; page_size: number };
export type DateRange = { check_in: string; check_out: string };

export type Quote = {
  nights: number;
  nightly_price: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
};

export type Booking = DateRange & {
  id: number;
  guests: number;
  nightly_price: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  status: "confirmed" | "cancelled";
  created_at: string;
  listing: ListingCard;
  guest: User;
  review: Review | null;
};
