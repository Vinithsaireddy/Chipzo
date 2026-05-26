const steps = [
  ['01', 'Order', 'Choose stocked parts while your build is active.'],
  ['02', 'Pack', 'Local runners verify and pack from nearby hubs.'],
  ['03', 'Deliver', 'Track to your desk, lab, garage, or hackathon table.'],
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] py-16 text-[color:var(--chipzo-paper)] sm:py-20">
      <div className="section-frame py-0">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-primary)]">How it works</p>
            <h2 className="mt-3 text-[clamp(2.3rem,5vw,5.2rem)] font-black uppercase leading-[0.82] tracking-[-0.07em] text-[color:var(--chipzo-paper)]">From click to bench in 90 minutes.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map(([num, title, copy]) => (
              <article key={num} className="brutal-border relative bg-[#131311] p-6 pt-9">
                <span className="brutal-border absolute -top-4 left-5 bg-[color:var(--chipzo-primary)] px-3 py-1 text-xl font-black text-[color:var(--chipzo-ink)]">{num}</span>
                <h3 className="text-2xl font-black uppercase tracking-[-0.04em] text-[color:var(--chipzo-primary)]">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-[#D8D8D1]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
