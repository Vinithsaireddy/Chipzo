
export default function HeroOverlay({ progress }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden flex-col gap-4 sm:flex">
        <div className="brutal-border bg-[color:var(--chipzo-paper)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] shadow-sm">
          Sequence 01
        </div>
        <div className="brutal-border bg-[color:var(--chipzo-ink)] px-3 py-2 text-sm font-black tracking-tighter text-[color:var(--chipzo-paper)] shadow-md">
          {String(Math.round(progress * 100)).padStart(2, '0')}%
        </div>
      </div>
    </div>
  )
}
