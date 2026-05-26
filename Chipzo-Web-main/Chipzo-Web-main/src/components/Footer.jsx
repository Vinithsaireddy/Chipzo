const links = ['Documentation', 'Shipping', 'Delivery Coverage', 'API Support', 'Privacy Policy']

export default function Footer() {
  return (
    <footer className="border-t-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] py-12">
      <div className="section-frame grid gap-8 py-0 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="brutal-border mb-4 inline-block bg-[color:var(--chipzo-paper)] px-3 py-1 text-2xl font-black tracking-[-0.08em] text-[color:var(--chipzo-primary)]">Chipzo</div>
          <p className="max-w-md text-sm font-semibold leading-relaxed text-[color:var(--chipzo-muted)]">Chipzo removes friction between engineering ideas and execution with a fast local electronics supply chain.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((item) => (
            <a key={item} href="#" className="border-b-2 border-dashed border-[color:var(--chipzo-rule)] py-2 text-sm font-black uppercase tracking-[0.08em] transition-colors hover:text-[color:var(--chipzo-primary)]">
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
