export function LoadingScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-zinc-500">
      <div className="h-8 w-8 animate-pulse rounded-full bg-emerald-200 dark:bg-emerald-900" />
      <p className="text-sm">Cargando…</p>
    </div>
  );
}
