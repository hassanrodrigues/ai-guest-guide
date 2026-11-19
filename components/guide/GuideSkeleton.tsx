import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder mirroring the guide layout: welcome, two place lists
 *  and the essentials. */
export function GuideSkeleton() {
  return (
    <div className="space-y-10" aria-hidden>
      <Skeleton className="h-16 w-full max-w-prose" />
      {[4, 3].map((rows, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: rows }).map((_, j) => (
            <Skeleton key={j} className="h-16 w-full" />
          ))}
        </div>
      ))}
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}
