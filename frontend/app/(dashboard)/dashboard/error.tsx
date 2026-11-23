'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 py-24">
        <h2 className="text-2xl font-bold">Dashboard Error</h2>
        <p className="text-muted-foreground">Something went wrong loading the dashboard.</p>
        <button
          onClick={() => reset()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
