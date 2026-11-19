import { Check, X } from "lucide-react";

import type { PropertyRules } from "@/lib/types/property";

interface RulesSectionProps {
  rules: PropertyRules;
}

export function RulesSection({ rules }: RulesSectionProps) {
  const items = [
    { label: "Crianças", allowed: rules.suitable_for_children, yes: "bem-vindas", no: "não recomendado" },
    { label: "Bebês", allowed: rules.suitable_for_babies, yes: "bem-vindos", no: "não recomendado" },
    { label: "Pets", allowed: rules.allow_pet, yes: "permitidos", no: "não permitidos" },
    { label: "Fumar", allowed: rules.smoking_permitted, yes: "permitido", no: "não permitido" },
    { label: "Festas", allowed: rules.events_permitted, yes: "permitidas", no: "não permitidas" },
  ];

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight font-stretch-expanded">
        Regras do imóvel
      </h2>
      <ul className="mt-4 divide-y divide-border">
        {items.map(({ label, allowed, yes, no }) => (
          <li key={label} className="flex items-center gap-3 py-2.5">
            {allowed ? (
              <Check className="size-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <X className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span>
              <span className="font-medium">{label}: </span>
              <span className={allowed ? "text-primary" : "text-muted-foreground"}>
                {allowed ? yes : no}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
