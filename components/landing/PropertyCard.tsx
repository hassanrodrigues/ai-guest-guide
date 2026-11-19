import Image from "next/image";
import Link from "next/link";

import type { PropertyAddress } from "@/lib/types/property";

interface PropertyCardProps {
  code: string;
  name: string;
  propertyType: string;
  guestCapacity: number;
  address: PropertyAddress;
  imageUrl?: string;
}

export function PropertyCard({
  code,
  name,
  propertyType,
  guestCapacity,
  address,
  imageUrl,
}: PropertyCardProps) {
  return (
    <Link
      href={`/${code}`}
      className="group block rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-muted">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 560px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="text-xl font-semibold tracking-tight font-stretch-expanded group-hover:underline group-hover:underline-offset-4">
          {name}
        </h3>
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
          {code}
        </span>
      </div>
      <p className="mt-1 text-muted-foreground">
        {propertyType} para até {guestCapacity} hóspedes em{" "}
        {address.neighborhood}, {address.city} ({address.state})
      </p>
    </Link>
  );
}
