export function ProductCardSkeleton() {
  return (
    <div className="brutal-border brutal-shadow bg-[color:var(--chipzo-paper)] overflow-hidden flex flex-col select-none pointer-events-none">
      {/* Image area - fills most of card */}
      <div className="bg-[color:var(--chipzo-surface)] overflow-hidden relative flex-1 min-h-[260px] sm:min-h-[300px]">
        <div className="flex h-full w-full items-center justify-center">
          {/* IC schematic skeleton */}
          <div className="relative h-20 w-28 border-2 border-[color:var(--chipzo-ink)]/20 skeleton-base">
            <div className="absolute left-[-14px] top-1/2 h-[2px] w-4 -translate-y-1/2 bg-[color:var(--chipzo-ink)]/20" />
            <div className="absolute right-[-14px] top-1/2 h-[2px] w-4 -translate-y-1/2 bg-[color:var(--chipzo-ink)]/20" />
            <div className="absolute left-2 top-2 h-3 w-3 bg-[color:var(--chipzo-primary)]/20" />
            <div className="absolute right-2 bottom-2 h-3 w-3 bg-[color:var(--chipzo-lime)]/20" />
            <div className="absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 bg-[color:var(--chipzo-ink)]/20" />
          </div>
        </div>
        {/* Status badge placeholder */}
        <div className="absolute top-3 left-3 h-4 w-20 skeleton-base" />
      </div>

      {/* Bottom info strip */}
      <div className="border-t-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] p-3 sm:p-4">
        {/* Title placeholders */}
        <div className="space-y-1.5">
          <div className="h-3 w-full skeleton-base" />
          <div className="h-3 w-3/5 skeleton-base" />
        </div>

        {/* Price & Button row */}
        <div className="flex items-end justify-between mt-3 gap-2">
          <div className="space-y-1">
            <div className="h-5 w-16 sm:w-20 skeleton-base" />
            <div className="h-2.5 w-12 skeleton-base" />
          </div>
          {/* Add button placeholder */}
          <div className="h-9 w-16 border-[2px] border-[color:var(--chipzo-ink)]/30 skeleton-base shrink-0" />
        </div>
      </div>
    </div>
  )
}

export function ProductTableRowSkeleton({ index, total }) {
  return (
    <div
      className={[
        'grid grid-cols-[120px_2fr_1.5fr_1fr_140px] items-stretch bg-[color:var(--chipzo-paper)] select-none pointer-events-none',
        index < total - 1 ? 'border-b-[2px] border-[color:var(--chipzo-rule)]' : '',
      ].join(' ')}
    >
      {/* Schematic cell */}
      <div className="flex items-center justify-center border-r-[2px] border-[color:var(--chipzo-rule)] p-3">
        <div className="flex h-20 w-24 items-center justify-center border-[3px] border-[color:var(--chipzo-ink)]/20 bg-[color:var(--chipzo-surface)] shadow-[2px_2px_0_var(--chipzo-ink)]/10 skeleton-base">
          <div className="relative h-12 w-16 border-2 border-[color:var(--chipzo-ink)]/20">
            <div className="absolute left-[-10px] top-1/2 h-[2px] w-3 -translate-y-1/2 bg-[color:var(--chipzo-ink)]/20" />
            <div className="absolute right-[-10px] top-1/2 h-[2px] w-3 -translate-y-1/2 bg-[color:var(--chipzo-ink)]/20" />
            <div className="absolute left-1 top-1 h-2 w-2 bg-[color:var(--chipzo-primary)]/20" />
            <div className="absolute right-1 bottom-1 h-2 w-2 bg-[color:var(--chipzo-lime)]/20" />
            <div className="absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 bg-[color:var(--chipzo-ink)]/20" />
          </div>
        </div>
      </div>

      {/* Part Number / Description cell */}
      <div className="border-r-[2px] border-[color:var(--chipzo-rule)] px-4 py-4 space-y-2">
        <div className="h-4 w-3/4 skeleton-base" />
        <div className="h-3 w-1/4 skeleton-base" />
        <div className="h-3 w-2/3 skeleton-base" />
      </div>

      {/* Specs cell */}
      <div className="border-r-[2px] border-[color:var(--chipzo-rule)] px-4 py-4 space-y-1.5">
        <div className="h-3 w-4/5 skeleton-base" />
        <div className="h-3 w-3/5 skeleton-base" />
        <div className="h-3 w-1/2 skeleton-base" />
      </div>

      {/* Price cell */}
      <div className="border-r-[2px] border-[color:var(--chipzo-rule)] px-4 py-4 space-y-1">
        <div className="h-5 w-20 skeleton-base" />
        <div className="h-2.5 w-12 skeleton-base" />
      </div>

      {/* Action cell */}
      <div className="flex items-center justify-center px-3 py-4">
        <div className="h-10 w-16 border-[2px] border-[color:var(--chipzo-ink)]/30 skeleton-base" />
      </div>
    </div>
  )
}
