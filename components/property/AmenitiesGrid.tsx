import {
  ArrowUp,
  ChefHat,
  Fence,
  Flame,
  Snowflake,
  Sparkles,
  Tv,
  WashingMachine,
  Waves,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { PropertyAmenities } from "@/lib/types/property";

interface AmenitiesGridProps {
  amenities: PropertyAmenities;
}

// Ordered map from amenity flag to its icon + PT-BR label. Order here is the
// display order; only flags set to true are rendered.
const AMENITY_META: { key: keyof PropertyAmenities; icon: LucideIcon; label: string }[] = [
  { key: "wifi", icon: Wifi, label: "Wi-Fi" },
  { key: "air_conditioning", icon: Snowflake, label: "Ar-condicionado" },
  { key: "kitchen", icon: ChefHat, label: "Cozinha" },
  { key: "pool", icon: Waves, label: "Piscina" },
  { key: "balcony", icon: Fence, label: "Varanda" },
  { key: "bbq_grill", icon: Flame, label: "Churrasqueira" },
  { key: "tv", icon: Tv, label: "TV" },
  { key: "washing_machine", icon: WashingMachine, label: "Lavadora" },
  { key: "dishwasher", icon: Sparkles, label: "Lava-louças" },
  { key: "elevator", icon: ArrowUp, label: "Elevador" },
];

export function AmenitiesGrid({ amenities }: AmenitiesGridProps) {
  const available = AMENITY_META.filter(({ key }) => amenities[key]);

  if (available.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight font-stretch-expanded">
        Comodidades
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {available.map(({ key, icon: Icon, label }) => (
          <li key={key} className="flex items-center gap-2.5">
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
