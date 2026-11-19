import { Car, KeyRound, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CopyButton } from "@/components/property/CopyButton";
import type { PropertyOperational } from "@/lib/types/property";

interface AccessSectionProps {
  operational: PropertyOperational;
}

// Human-readable PT-BR labels for the access mechanism. Falls back to a generic
// label so an unmapped type never leaks a raw enum string to the guest.
const ACCESS_TYPE_LABELS: Record<string, string> = {
  smart_lock: "Fechadura eletrônica",
  keybox: "Cofre de chaves",
  in_person: "Check-in presencial",
  doorman: "Portaria",
  host_greeting: "Recepção pelo anfitrião",
};

function accessTypeLabel(type: string): string {
  return ACCESS_TYPE_LABELS[type] ?? "Acesso ao imóvel";
}

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-rio-foreground/20 pt-4">
      <h2 className="flex items-center gap-2 font-semibold text-white">
        <Icon className="size-4 text-rio-foreground/60" aria-hidden />
        {title}
      </h2>
      <div className="mt-2 text-rio-foreground/80">{children}</div>
    </div>
  );
}

export function AccessSection({ operational }: AccessSectionProps) {
  return (
    <section className="grid gap-6 md:grid-cols-3">
      <Block icon={Wifi} title="Wi-Fi">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt>Rede</dt>
          <dd className="font-medium text-white">{operational.wifi_network}</dd>
          <dt>Senha</dt>
          <dd className="font-mono font-medium text-white">
            {operational.wifi_password}
          </dd>
        </dl>
        <CopyButton
          value={operational.wifi_password}
          label="Copiar senha"
          className="mt-3 border-rio-foreground/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
        />
      </Block>

      <Block
        icon={KeyRound}
        title={accessTypeLabel(operational.property_access_type)}
      >
        <p>{operational.property_access_instructions}</p>
      </Block>

      <Block icon={Car} title="Estacionamento">
        {operational.has_parking_spot ? (
          <>
            {operational.parking_spot_identifier && (
              <p className="font-medium text-white">
                {operational.parking_spot_identifier}
              </p>
            )}
            {operational.parking_spot_instructions && (
              <p>{operational.parking_spot_instructions}</p>
            )}
          </>
        ) : (
          <p>Este imóvel não tem vaga de estacionamento.</p>
        )}
      </Block>
    </section>
  );
}
