export default function RoboticsSection() {
  return (
    <section id="robotics" className="section-frame grid gap-6 py-14 sm:py-20 lg:grid-cols-[1.35fr_0.65fr]">
      <article className="brutal-border brutal-shadow relative overflow-hidden bg-[color:var(--chipzo-primary)] p-6 sm:p-8">
        <p className="brutal-border inline-block bg-[color:var(--chipzo-lime)] px-3 py-1 text-xs font-black uppercase tracking-[0.16em]">Robotics</p>
        <h2 className="mt-4 max-w-xl text-[clamp(2.5rem,6vw,5.8rem)] font-black uppercase leading-[0.8] tracking-[-0.08em] text-[color:var(--chipzo-paper)]">Build autonomous systems fast.</h2>
        <p className="mt-4 max-w-lg text-base font-semibold leading-relaxed text-[#003B36]">Motors, drivers, compute modules, wireless stacks, and power systems for prototypes that need to move now.</p>
        <a href="#shop" className="brutal-border brutal-shadow-sm mt-8 inline-flex min-h-12 items-center bg-[color:var(--chipzo-surface)] px-6 text-sm font-black uppercase tracking-[0.08em]">
          Explore robotics
        </a>
      </article>

      <article className="brutal-border brutal-shadow bg-[color:var(--chipzo-ink)] p-7 text-[color:var(--chipzo-paper)]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--chipzo-primary)]">Coverage</p>
        <h3 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em]">Delivering across Bangalore.</h3>
        <p className="mt-4 text-sm font-semibold leading-relaxed text-[#D7D7CF]">90-minute radius live now. Expansion to additional maker corridors next.</p>
        <a href="#" className="mt-7 inline-flex text-sm font-black uppercase tracking-[0.12em] text-[color:var(--chipzo-primary)] underline underline-offset-4">
          Delivery zones
        </a>
      </article>
    </section>
  )
}
