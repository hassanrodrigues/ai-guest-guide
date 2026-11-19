import { ArrowUpRight } from "lucide-react";

import type { Restaurant } from "@/lib/ai/schemas";
import { buildMapsUrl, travelModeForDistance } from "@/lib/maps";

interface RestaurantListProps {
  restaurants: Restaurant[];
  originAddress: string;
  city: string;
}

export function RestaurantList({
  restaurants,
  originAddress,
  city,
}: RestaurantListProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold">Onde comer</h3>
      <ul className="mt-2 divide-y divide-border border-y border-border">
        {restaurants.map((r) => (
          <li key={r.name}>
            <a
              href={buildMapsUrl({
                originAddress,
                destinationName: r.name,
                destinationCity: city,
                travelMode: travelModeForDistance(r.distance),
              })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${r.name}: abrir rota no Google Maps`}
              className="group grid grid-cols-[1fr_auto] gap-x-4 py-4 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="font-medium">
                <span className="group-hover:underline group-hover:underline-offset-4">
                  {r.name}
                </span>
                <ArrowUpRight
                  className="ml-1 inline size-4 align-[-2px] text-muted-foreground group-hover:text-primary"
                  aria-hidden
                />
              </span>
              <span className="text-muted-foreground">
                <span className="sr-only">Faixa de preço </span>
                {r.priceRange}
              </span>
              <span className="col-span-2 text-sm text-muted-foreground">
                {r.cuisine}, {r.distance.toLowerCase()}
              </span>
              <span className="col-span-2 mt-1 max-w-prose text-sm leading-relaxed">
                {r.description}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
