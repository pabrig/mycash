export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Esqueleto del dashboard: misma silueta que el home. */
export function DashboardSkeleton() {
  return (
    <div className="animate-fade-in space-y-4 pb-4" aria-busy="true" aria-label="Cargando">
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-8 w-40 rounded-full" />
        </div>
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>

      <Skeleton className="h-9 w-full rounded-full" />

      <Skeleton className="h-44 w-full rounded-3xl" />

      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>

      <div className="space-y-3 pt-2">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-16 w-full rounded-3xl" />
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return <DashboardSkeleton />;
}
