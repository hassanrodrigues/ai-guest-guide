import { Sun } from "lucide-react";

interface SeasonalTipProps {
  tip: string;
}

export function SeasonalTip({ tip }: SeasonalTipProps) {
  return (
    <section className="flex gap-4 rounded-lg bg-secondary p-5">
      <Sun className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
      <div>
        <h3 className="text-lg font-semibold">Dica da estação</h3>
        <p className="mt-1 max-w-prose leading-relaxed">{tip}</p>
      </div>
    </section>
  );
}
