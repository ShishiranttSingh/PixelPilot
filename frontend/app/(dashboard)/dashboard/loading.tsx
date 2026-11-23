export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#090a0d] p-8 space-y-6">
      <div className="flex gap-8">
        <div className="flex-1 space-y-4">
          <div className="h-6 w-36 rounded-full bg-[#ffffff0e] animate-pulse" />
          <div className="h-8 w-96 rounded bg-[#ffffff0e] animate-pulse" />
          <div className="h-4 w-64 rounded bg-[#ffffff0e] animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 w-40 rounded-lg bg-[#ffffff0e] animate-pulse" />
            <div className="h-10 w-40 rounded-lg bg-[#ffffff0e] animate-pulse" />
          </div>
        </div>
        <div className="h-36 w-[340px] rounded-xl bg-[#111318] animate-pulse" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-[#111318] animate-pulse" />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="h-[500px] rounded-xl bg-[#111318] animate-pulse" />
        <div className="h-[400px] rounded-xl bg-[#111318] animate-pulse" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-[#111318] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
