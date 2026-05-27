import { motion } from 'framer-motion'
import { ArrowRight, Cpu } from 'lucide-react'

const CATEGORY_DATA = [
  {
    name: 'Microcontrollers',
    description: 'Arduino, ESP32, STM32 & Raspberry Pi development boards',
    itemCount: 7,
    badge: 'BEST SELLER',
    slug: 'Microcontroller',
    image: 'https://images.unsplash.com/photo-1608564697071-ddf911d81370?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Sensors',
    description: 'Motion, gas, temperature, humidity & light sensing modules',
    itemCount: 14,
    badge: 'POPULAR',
    slug: 'Sensor',
    image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Motors & Actuators',
    description: 'DC motors, stepper motors, servo drives & speed controllers',
    itemCount: 6,
    badge: 'ROBOTICS',
    slug: 'Motor',
    image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Displays',
    description: 'TFT touchscreen displays, character LCDs, OLEDs & e-paper',
    itemCount: 37,
    badge: 'VISUAL',
    slug: 'Display',
    image: 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Batteries & Power',
    description: 'Rechargeable Li-Po, Li-ion, coin cells & custom BMS modules',
    itemCount: 10,
    badge: 'MOST USED',
    slug: 'Battery',
    image: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?w=600&auto=format&fit=crop&q=80'
  }
]

function CategoryCard({ categoryName, description, itemCount, image, badge, slug, onExplore }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ 
        y: -4,
        x: -1.5,
        boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)'
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={() => onExplore?.(slug)}
      className="group relative flex flex-col overflow-hidden border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] select-none cursor-pointer"
    >
      {/* Top Section - Status Tag & Cyberpunk Details */}
      <div className="flex items-center justify-between border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] px-3 py-1.5 text-[10px] select-none">
        <span className="font-black tracking-[0.15em] text-[color:var(--chipzo-lime)]">
          // STATUS: {badge}
        </span>
        <span className="font-mono text-[9px] text-[color:var(--chipzo-paper)]/50 tracking-[0.05em] uppercase hidden xl:inline">
          SYS_SEC_REV_{itemCount}
        </span>
      </div>

      {/* Center Section - Image Panel with PCB Details */}
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] shrink-0">
        {/* PCB design / circuit accent lines overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,194,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,194,255,0.15)_1px,transparent_1px)] bg-[size:8px_8px]" />
        
        {/* Neon blue and green glow blooms */}
        <div className="absolute -left-10 -top-10 z-10 h-24 w-24 rounded-full bg-[color:var(--chipzo-primary)]/10 blur-xl group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute -right-10 -bottom-10 z-10 h-24 w-24 rounded-full bg-[color:var(--chipzo-lime)]/10 blur-xl group-hover:scale-125 transition-transform duration-700" />

        <img
          src={image}
          alt={categoryName}
          className="h-full w-full object-cover opacity-85 saturate-[0.85] contrast-[1.05] transition-all duration-700 ease-out group-hover:scale-105 group-hover:saturate-100 group-hover:opacity-95"
          loading="lazy"
        />

        {/* Tech decorative corner cuts */}
        <div className="absolute bottom-0 right-0 z-20 border-b-[10px] border-l-[10px] border-b-[color:var(--chipzo-ink)] border-l-transparent" />
      </div>

      {/* Bottom Section - Typography & Actions */}
      <div className="flex flex-grow flex-col p-4">
        <div className="mb-2.5">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-muted)]">
            CATEGORY // COMPONENT SYSTEM
          </p>
          <h3 className="mt-0.5 text-lg font-black uppercase leading-tight tracking-[-0.03em] text-[color:var(--chipzo-ink)] group-hover:text-[color:var(--chipzo-primary)] transition-colors line-clamp-1">
            {categoryName}
          </h3>
        </div>

        <p className="mb-4 text-[11px] font-semibold leading-snug text-[color:var(--chipzo-muted)] flex-grow line-clamp-2">
          {description}
        </p>

        {/* Technical Data & Button Strip */}
        <div className="mt-auto flex items-stretch justify-between border-t-2 border-dashed border-[color:var(--chipzo-rule)] pt-3 gap-2 shrink-0">
          <div className="flex flex-col justify-center">
            <span className="font-mono text-[7px] font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-muted)]">
              COORDINATES
            </span>
            <span className="tabular-prices text-base font-black leading-none text-[color:var(--chipzo-ink)] mt-0.5">
              {String(itemCount).padStart(2, '0')} <span className="text-[8px] font-black uppercase text-[color:var(--chipzo-muted)]">ITEMS</span>
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onExplore?.(slug) }}
            className="group/btn relative inline-flex items-center gap-1.5 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-lime)] shadow-[2px_2px_0px_0px_rgba(0,194,255,0.8)] cursor-pointer transition-all hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-lime)] hover:-translate-x-[1.5px] hover:-translate-y-[1.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,194,255,1)] active:translate-x-0 active:translate-y-0 active:shadow-none focus:outline-none"
          >
            <span>EXPLORE</span>
            <ArrowRight size={11} strokeWidth={3} className="transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export default function CategoryShowcase({ onNavigate }) {
  const handleCategoryExplore = (slug) => {
    onNavigate?.('shop', slug)
  }

  return (
    <section id="categories" className="section-frame py-14 sm:py-20 overflow-hidden relative">
      {/* Decorative vertical background grids */}
      <div className="absolute inset-0 pointer-events-none opacity-5 select-none bg-[linear-gradient(rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Showcase Header Section */}
      <div className="mb-10 sm:mb-14 border-b-[3px] border-[color:var(--chipzo-ink)] pb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 relative z-10">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[color:var(--chipzo-primary)] flex items-center gap-1.5 leading-none">
            <Cpu size={14} className="animate-[pulse_1.5s_infinite]" /> ECOSYSTEM EXPLORATION
          </p>
          <h2 className="mt-3 max-w-4xl text-[clamp(2.4rem,5.5vw,4.8rem)] font-black uppercase leading-[0.85] tracking-[-0.07em] text-[color:var(--chipzo-ink)]">
            BUILD YOUR NEXT PROJECT.
          </h2>
        </div>
        
        <button
          type="button"
          onClick={() => onNavigate?.('shop')}
          className="group relative flex items-center justify-center gap-2 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] hover:bg-[color:var(--chipzo-lime)] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[color:var(--chipzo-paper)] hover:text-[color:var(--chipzo-ink)] transition-all shrink-0 cursor-pointer shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:ring-[3px] hover:ring-[color:var(--chipzo-lime)]/20 font-black self-start lg:self-end"
        >
          <span>FULL CATALOG</span>
          <ArrowRight size={14} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Categories Grid - Responsive 1 to 5 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 relative z-10">
        {CATEGORY_DATA.map((cat, idx) => (
          <CategoryCard
            key={idx}
            categoryName={cat.name}
            description={cat.description}
            itemCount={cat.itemCount}
            image={cat.image}
            badge={cat.badge}
            slug={cat.slug}
            onExplore={handleCategoryExplore}
          />
        ))}
      </div>
    </section>
  )
}

