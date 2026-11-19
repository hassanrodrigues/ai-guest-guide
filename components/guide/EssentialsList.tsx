import {
  Banknote,
  Croissant,
  Cross,
  Mail,
  Pill,
  ShoppingCart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Essential } from "@/lib/ai/schemas";
import { buildMapsUrl } from "@/lib/maps";

interface EssentialsListProps {
  essentials: Essential[];
  originAddress: string;
  city: string;
}

const TYPE_ICONS: Record<Essential["type"], LucideIcon> = {
  pharmacy: Pill,
  supermarket: ShoppingCart,
  hospital: Cross,
  bakery: Croissant,
  atm: Banknote,
  post_office: Mail,
};

export function EssentialsList({
  essentials,
  originAddress,
  city,
}: EssentialsListProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold">Serviços essenciais</h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {essentials.map((e) => {
          const Icon = TYPE_ICONS[e.type];
          return (
            <li key={e.name}>
              <a
                href={buildMapsUrl({
                  originAddress,
                  destinationName: e.name,
                  destinationCity: city,
                  // Essentials are nearby by definition, and many lack a usable
                  // distance, so always route on foot.
                  travelMode: "walking",
                })}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${e.name}: abrir rota no Google Maps`}
                className="group flex h-full gap-3 rounded-lg bg-card p-4 ring-1 ring-border transition-colors hover:ring-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0">
                  <span className="block font-medium group-hover:underline group-hover:underline-offset-4">
                    {e.name}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {e.distance}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed">
                    {e.description}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
