export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#0e0e12]/80 to-[#060608]/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2 min-w-0 w-full">
            <div className="flex gap-2">
              <div className="h-5 w-20 rounded bg-white/5" />
              <div className="h-5 w-16 rounded bg-white/5" />
              <div className="h-5 w-24 rounded bg-white/5" />
            </div>
            <div className="h-9 w-2/3 rounded bg-white/10 mt-1" />
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
              <div className="h-3 w-32 rounded bg-white/5" />
              <div className="h-3 w-40 rounded bg-white/5" />
              <div className="h-3 w-36 rounded bg-white/5" />
              <div className="h-3 w-28 rounded bg-white/5" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="h-8 w-20 rounded bg-white/5" />
            <div className="h-8 w-20 rounded bg-white/5" />
            <div className="h-8 w-36 rounded bg-white/5" />
            <div className="h-8 w-32 rounded bg-white/5" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr_320px]">
        <div className="rounded-2xl border border-white/5 bg-[#08080a]/60 p-5 flex flex-col gap-3">
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="h-3 w-56 rounded bg-white/5" />
          <div className="mt-2 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-2.5 w-20 rounded bg-white/5" />
                <div className="h-3.5 w-40 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-white/5 bg-[#08080a]/60 p-5 flex flex-col gap-4">
            <div className="h-4 w-44 rounded bg-white/10" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="size-2.5 mt-1.5 rounded-full bg-purple-500/40" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-1/3 rounded bg-white/10" />
                    <div className="h-3 w-2/3 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#08080a]/60 p-1.5 flex gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-lg bg-white/5" />
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-white/5 rounded-xl bg-[#08080a]/40 p-4 flex flex-col gap-2">
                <div className="h-2.5 w-24 rounded bg-white/5" />
                <div className="h-7 w-12 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-white/5 bg-[#08080a]/60 p-5 flex flex-col gap-3">
            <div className="h-4 w-40 rounded bg-white/10" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-white/5" />
            ))}
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#08080a]/60 p-5 flex flex-col gap-3">
            <div className="h-4 w-44 rounded bg-white/10" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-2.5 w-20 rounded bg-white/5" />
                <div className="h-3.5 w-36 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
