import { PropertyCard } from "@/components/landing/PropertyCard";
import { listProperties } from "@/lib/services/property.service";

const WORDMARK =
  "font-semibold leading-[1.12] tracking-tight font-stretch-expanded text-[clamp(5rem,22vw,14rem)]";

export default async function Home() {
  const properties = await listProperties();

  return (
    <main>
      <section className="overflow-hidden bg-rio text-rio-foreground">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 pt-14 md:grid-cols-[1fr_20rem] md:items-end md:pt-24">
          <h1 className={WORDMARK}>Igapó</h1>
          <div className="max-w-md space-y-3 md:pb-10">
            <p className="text-xl leading-snug font-medium text-white">
              Guias de estadia para imóveis de temporada na Amazônia.
            </p>
            <p className="leading-relaxed text-rio-foreground/75">
              Cada imóvel tem uma página com Wi-Fi, acesso e regras, um guia da
              região gerado por IA e um assistente que responde só com os dados
              do imóvel.
            </p>
          </div>
        </div>
        {/* Igapó is flooded forest over still black water: the wordmark
            reflects on it. Decorative, so hidden from assistive tech. */}
        <div
          aria-hidden
          className="mx-auto w-full max-w-6xl border-t border-rio-foreground/20 px-5 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
        >
          <p
            className={`${WORDMARK} -scale-y-100 opacity-25 blur-[1.5px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000`}
          >
            Igapó
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight font-stretch-expanded md:text-3xl">
          Escolha o imóvel
        </h2>
        <ul className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2">
          {properties.map((property) => (
            <li key={property.code}>
              <PropertyCard
                code={property.code}
                name={property.name}
                propertyType={property.propertyType}
                guestCapacity={property.guestCapacity}
                address={property.address}
                imageUrl={property.images[0]}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
