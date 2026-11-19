import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { ExperienceGuide } from "@/components/guide/ExperienceGuide";
import { GuideSkeleton } from "@/components/guide/GuideSkeleton";
import { AccessSection } from "@/components/property/AccessSection";
import { AmenitiesGrid } from "@/components/property/AmenitiesGrid";
import { ContactSection } from "@/components/property/ContactSection";
import { PropertyHero } from "@/components/property/PropertyHero";
import { QuickInfoCards } from "@/components/property/QuickInfoCards";
import { RulesSection } from "@/components/property/RulesSection";
import { InvalidPropertyCodeError } from "@/lib/errors";
import { findByCode } from "@/lib/services/property.service";

interface PropertyPageProps {
  params: Promise<{ code: string }>;
}

// Cached so generateMetadata and the page share a single DB query per request.
// A malformed code is treated like "not found" at the route level — the page
// renders the friendly 404 rather than surfacing a validation error.
const getProperty = cache(async (code: string) => {
  try {
    return await findByCode(code);
  } catch (error) {
    if (error instanceof InvalidPropertyCodeError) return null;
    throw error;
  }
});

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { code } = await params;
  const property = await getProperty(code);

  if (!property) {
    return { title: "Imóvel não encontrado | Igapó" };
  }

  return {
    title: `${property.name} | Igapó`,
    description: `Guia da sua estadia em ${property.address.neighborhood}, ${property.address.city}/${property.address.state}.`,
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { code } = await params;
  const property = await getProperty(code);

  if (!property) {
    notFound();
  }

  const { address } = property;

  return (
    <>
      <main>
        <PropertyHero
          name={property.name}
          propertyType={property.propertyType}
          address={address}
          imageUrl={property.images[0]}
        />
        <div className="bg-rio text-rio-foreground">
          <div className="mx-auto w-full max-w-6xl space-y-10 px-5 pt-6 pb-14">
            <QuickInfoCards
              checkInTime={property.rules.check_in_time}
              checkOutTime={property.rules.check_out_time}
              bedroomQuantity={property.bedroomQuantity}
              bathroomQuantity={property.bathroomQuantity}
              guestCapacity={property.guestCapacity}
            />
            <AccessSection operational={property.operational} />
          </div>
        </div>
        <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 pt-14 lg:grid-cols-[1fr_20rem] lg:gap-20 lg:pt-20 pb-28 lg:pb-28">
          <aside className="space-y-12 lg:sticky lg:top-8 lg:col-start-2 lg:row-start-1 lg:self-start">
            <RulesSection rules={property.rules} />
            <AmenitiesGrid amenities={property.amenities} />
            <ContactSection host={property.host} address={address} />
          </aside>
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <Suspense fallback={<GuideSkeleton />}>
              <ExperienceGuide
                propertyCode={property.code}
                originAddress={`${address.neighborhood}, ${address.city}/${address.state}`}
                city={address.city}
              />
            </Suspense>
          </div>
        </div>
      </main>
      <ChatAssistant propertyCode={property.code} hostName={property.host.name} />
    </>
  );
}
