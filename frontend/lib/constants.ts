import {
  Bath, Beef, Building2, Car, Check, Coffee, Dumbbell, Flame, FlameKindling, House, Laptop,
  LayoutGrid, Mountain, PawPrint, Sailboat, Shirt, Snowflake, TreePine, Tv, Umbrella, Utensils,
  Waves, Wheat, Wifi, type LucideIcon,
} from "lucide-react";

export const CATEGORIES: { slug: string; label: string; icon: LucideIcon }[] = [
  { slug: "", label: "All homes", icon: LayoutGrid },
  { slug: "beach", label: "Beachfront", icon: Umbrella },
  { slug: "cabins", label: "Cabins", icon: TreePine },
  { slug: "city", label: "Iconic cities", icon: Building2 },
  { slug: "countryside", label: "Countryside", icon: Wheat },
  { slug: "pools", label: "Amazing pools", icon: Waves },
  { slug: "lake", label: "Lakefront", icon: Sailboat },
  { slug: "mountains", label: "Mountains", icon: Mountain },
  { slug: "tiny", label: "Tiny homes", icon: House },
];

export const PROPERTY_TYPES = ["House", "Apartment", "Cabin", "Villa", "Cottage", "Chalet", "Tiny home"];

// The API stores an icon name per amenity; this resolves it to a component.
const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi, utensils: Utensils, car: Car, waves: Waves, bath: Bath, snowflake: Snowflake,
  flame: Flame, shirt: Shirt, tv: Tv, laptop: Laptop, "flame-kindling": FlameKindling,
  umbrella: Umbrella, "paw-print": PawPrint, coffee: Coffee, dumbbell: Dumbbell, beef: Beef,
};
export const amenityIcon = (name: string) => AMENITY_ICONS[name] ?? Check;

export const DESTINATIONS = ["Lisbon, Portugal", "Tokyo, Japan", "Santorini, Greece", "Lake Como, Italy", "United States"];
