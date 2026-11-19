import { ArrowUpRight } from "lucide-react";

import type { Attraction } from "@/lib/ai/schemas";
import { buildMapsUrl, travelModeForDistance } from "@/lib/maps";

interface AttractionListProps {
  attractions: Attraction[];
  originAddress: string;
  city: string;
}

// PT-BR labels for the attraction categories defined in the schema.
const CATEGORY_LABELS: Record<Attraction["category"], string> = {
  praia: "Praia",
  parque: "Parque",
  cultural: "Cultural",
  natureza: "Natureza",
  mirante: "Mirante",
  compras: "Compras",
  outro: "Passeio",
};

export function AttractionList({
  attractions,
  originAddress,
  city,
}: AttractionListProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold">O que fazer</h3>
      <ul className="mt-2 divide-y divide-border border-y border-border">
        {attractions.map((a) => (
          <li key={a.name}>
            <a
              href={buildMapsUrl({
                originAddress,
                destinationName: a.name,
                destinationCity: city,
                travelMode: travelModeForDistance(a.distance),
              })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${a.name}: abrir rota no Google Maps`}
              className="group grid grid-cols-[1fr_auto] gap-x-4 py-4 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="col-span-2 font-medium">
                <span className="group-hover:underline group-hover:underline-offset-4">
                  {a.name}
                </span>
                <ArrowUpRight
                  className="ml-1 inline size-4 align-[-2px] text-muted-foreground group-hover:text-primary"
                  aria-hidden
                />
              </span>
              <span className="col-span-2 text-sm text-muted-foreground">
                {CATEGORY_LABELS[a.category]}, {a.distance.toLowerCase()}
              </span>
              <span className="col-span-2 mt-1 max-w-prose text-sm leading-relaxed">
                {a.description}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
