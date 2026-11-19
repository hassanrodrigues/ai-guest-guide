import Image from "next/image";
import Link from "next/link";

import type { PropertyAddress } from "@/lib/types/property";

interface PropertyHeroProps {
  name: string;
  propertyType: string;
  address: PropertyAddress;
  imageUrl?: string;
}

export function PropertyHero({
  name,
  propertyType,
  address,
  imageUrl,
}: PropertyHeroProps) {
  return (
    <section className="relative flex aspect-[4/5] max-h-[78vh] min-h-[26rem] w-full flex-col justify-between overflow-hidden bg-rio sm:aspect-[16/10] md:aspect-[21/9]">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={`Foto de ${name}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}
      {/* The photo sinks into the dark band below, so the name stays legible
          and the arrival details read as a continuation of the hero. */}
      <div className="absolute inset-0 bg-gradient-to-b from-rio/50 via-transparent via-35% to-rio" />

      <div className="relative mx-auto w-full max-w-6xl px-5 pt-5">
        <Link
          href="/"
          className="rounded-sm text-lg font-semibold text-white font-stretch-expanded focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none"
        >
          Igapó
        </Link>
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-2 text-white">
        <h1 className="max-w-4xl text-4xl leading-[1.05] font-semibold tracking-tight font-stretch-expanded text-balance sm:text-5xl lg:text-6xl">
          {name}
        </h1>
        <p className="mt-3 text-white/80 md:text-lg">
          {propertyType} em {address.neighborhood}, {address.city} (
          {address.state})
        </p>
      </div>
    </section>
  );
}
