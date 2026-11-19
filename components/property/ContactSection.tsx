import { MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PropertyAddress, PropertyHost } from "@/lib/types/property";
import { formatPhone } from "@/lib/utils";

interface ContactSectionProps {
  host: PropertyHost;
  address: PropertyAddress;
}

export function ContactSection({ host, address }: ContactSectionProps) {
  const region = `${address.neighborhood}, ${address.city} - ${address.state}`;

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight font-stretch-expanded">
        Contato
      </h2>
      <p className="mt-4">
        Quem recebe você é <span className="font-medium">{host.name}</span>,
        pelo telefone{" "}
        <span className="whitespace-nowrap tabular-nums">
          {formatPhone(host.phone)}
        </span>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild>
          <a href={`tel:${host.phone}`}>
            <Phone aria-hidden />
            Ligar para {host.name}
          </a>
        </Button>
        <Button asChild variant="outline">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(region)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin aria-hidden />
            Ver a região no Maps
          </a>
        </Button>
      </div>
    </section>
  );
}
