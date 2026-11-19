"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AttractionList } from "@/components/guide/AttractionList";
import { EssentialsList } from "@/components/guide/EssentialsList";
import { GuideSkeleton } from "@/components/guide/GuideSkeleton";
import { RestaurantList } from "@/components/guide/RestaurantList";
import { SeasonalTip } from "@/components/guide/SeasonalTip";
import { WelcomeMessage } from "@/components/guide/WelcomeMessage";
import type { ExperienceGuide as ExperienceGuideData } from "@/lib/ai/schemas";

interface ExperienceGuideProps {
  propertyCode: string;
  /** Property region, used as the origin for Maps directions deep links. */
  originAddress: string;
  /** Property city, appended to venue names so Maps resolves the right place. */
  city: string;
}

type Status = "loading" | "error" | "success";

export function ExperienceGuide({
  propertyCode,
  originAddress,
  city,
}: ExperienceGuideProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [guide, setGuide] = useState<ExperienceGuideData | null>(null);
  // Set when the server refused for a demo limit: retrying won't help.
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  // Fetch the guide. No synchronous setState here — the first state update
  // happens only after the await resolves, so kicking this off from the mount
  // effect doesn't trigger a cascading render (initial status is already
  // "loading", which renders the skeleton).
  const fetchGuide = useCallback(async () => {
    try {
      const res = await fetch("/api/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: propertyCode }),
      });
      if (res.status === 429) {
        const data: { error?: string } = await res.json();
        setLimitMessage(data.error ?? "A demo chegou a um limite de uso.");
        setStatus("error");
        return;
      }
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data: { guide: ExperienceGuideData } = await res.json();
      setGuide(data.guide);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [propertyCode]);

  // Retry from the error state: show the skeleton again, then refetch.
  const retry = useCallback(() => {
    setStatus("loading");
    void fetchGuide();
  }, [fetchGuide]);

  useEffect(() => {
    // Data-load on mount. The rule flags any setState-bearing call inside an
    // effect, but fetchGuide only updates state AFTER an awaited fetch (a
    // microtask, not a synchronous cascading render), so the warning doesn't
    // apply to this client-side fetch-on-mount pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchGuide();
  }, [fetchGuide]);

  return (
    <section>
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-2xl font-semibold tracking-tight font-stretch-expanded md:text-3xl">
          Guia da região
        </h2>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-sm text-secondary-foreground">
          Gerado por IA
        </span>
      </header>

      <div className="mt-8">
        {status === "loading" && (
          <>
            <p role="status" className="mb-6 text-muted-foreground">
              Preparando o guia. Na primeira visita isso leva até 30 segundos.
            </p>
            <GuideSkeleton />
          </>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-dashed border-input p-6">
            {limitMessage ? (
              <p>{limitMessage}</p>
            ) : (
              <>
                <p>O guia da região não carregou.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
                  <RefreshCw aria-hidden />
                  Tentar de novo
                </Button>
              </>
            )}
          </div>
        )}

        {status === "success" && guide && (
          <div className="space-y-10">
            <WelcomeMessage message={guide.welcomeMessage} />
            <RestaurantList
              restaurants={guide.restaurants}
              originAddress={originAddress}
              city={city}
            />
            <AttractionList
              attractions={guide.attractions}
              originAddress={originAddress}
              city={city}
            />
            <EssentialsList
              essentials={guide.essentials}
              originAddress={originAddress}
              city={city}
            />
            <SeasonalTip tip={guide.seasonalTip} />
          </div>
        )}
      </div>
    </section>
  );
}
