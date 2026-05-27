import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const placeholders = [
  {
    id: 'corex-esp32',
    code: 'CPZ-CX32',
    title: 'CoreX ESP32 Dev Board',
    name: 'CoreX ESP32 Dev Board',
    price: 14.99,
    image: '/stitch-assets/corex-esp32.png',
    badge: 'Best seller',
    category: 'Microcontrollers',
    specs: ['MCU: LX6 DUAL-CORE', 'FREQ: 240MHZ'],
    status: 'Operational'
  },
  {
    id: 'sensor-kit',
    code: 'CPZ-SK37',
    title: 'Ultimate Sensor Kit 37-in-1',
    name: 'Ultimate Sensor Kit 37-in-1',
    price: 34.50,
    image: '/stitch-assets/sensor-kit.png',
    badge: 'Restocked',
    category: 'Sensors',
    specs: ['SENSORS: 37 MODULES'],
    status: 'Operational'
  },
  {
    id: 'solder-station',
    code: 'CPZ-SS100',
    title: 'Pro Solder Station T-100',
    name: 'Pro Solder Station T-100',
    price: 89.00,
    image: '/stitch-assets/solder-station.png',
    badge: 'Limited',
    category: 'Tools',
    specs: ['TEMP: 100-480C', 'PWR: 75W'],
    status: 'Operational'
  }
]

export default function ProductGrid({ dark = false, onNavigate, onAddToCart }) {
  const containerRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [dimensions, setDimensions] = useState({ cardWidth: 280, gap: 24 })

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!isMobile) return
    const updateDimensions = () => {
      if (containerRef.current) {
        const cardEl = containerRef.current.querySelector('.product-card')
        if (cardEl) {
          const rect = cardEl.getBoundingClientRect()
          const computedStyle = window.getComputedStyle(cardEl.parentNode)
          const gapVal = parseFloat(computedStyle.gap) || 24
          setDimensions({
            cardWidth: rect.width,
            gap: gapVal
          })
        }
      }
    }
    const timer = setTimeout(updateDimensions, 100)
    window.addEventListener('resize', updateDimensions)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateDimensions)
    }
  }, [isMobile])

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft
    const cardWidth = e.target.scrollWidth / placeholders.length
    const index = Math.min(
      placeholders.length - 1,
      Math.max(0, Math.round(scrollLeft / cardWidth))
    )
    setActiveIndex(index)
  }

  const onDragEnd = (event, info) => {
    const { offset, velocity } = info
    
    const cardWidthWithGap = dimensions.cardWidth + dimensions.gap
    const currentX = -activeIndex * cardWidthWithGap + offset.x
    
    // Smooth velocity projections for highly tactile snaps
    const velocityFactor = velocity.x * 0.15
    const projectedIndex = Math.round(-(currentX + velocityFactor) / cardWidthWithGap)
    const newIndex = Math.min(placeholders.length - 1, Math.max(0, projectedIndex))
    
    setActiveIndex(newIndex)
  }

  return (
    <section id="shop" className="section-frame py-14 sm:py-20 overflow-hidden">
      <div className={`mb-8 border-b-[3px] pb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 ${dark ? 'border-[color:var(--chipzo-paper)]' : 'border-[color:var(--chipzo-ink)]'}`}>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-primary)]">Marketplace</p>
          <h2 className={`mt-2 max-w-2xl text-[clamp(2.4rem,6vw,5.8rem)] font-black uppercase leading-[0.8] tracking-[-0.08em] ${dark ? 'text-[color:var(--chipzo-paper)]' : 'text-[color:var(--chipzo-ink)]'}`}>Everything builders need.</h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.('shop')}
          className="group brutal-border brutal-shadow-sm flex items-center justify-center gap-2 bg-[color:var(--chipzo-primary)] hover:bg-[color:var(--chipzo-lime)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-[color:var(--chipzo-paper)] hover:text-[color:var(--chipzo-ink)] transition-all shrink-0 cursor-pointer self-start sm:self-end hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none mb-1"
        >
          <span>Full Catalog</span>
          <ArrowRight size={14} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {isMobile ? (
        <div 
          ref={containerRef}
          className="w-full overflow-hidden cursor-grab active:cursor-grabbing pb-6 px-1"
        >
          <motion.div
            drag="x"
            dragConstraints={{
              left: -((placeholders.length - 1) * (dimensions.cardWidth + dimensions.gap)),
              right: 0
            }}
            dragElastic={0.2}
            animate={{ x: -activeIndex * (dimensions.cardWidth + dimensions.gap) }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 26,
            }}
            onDragEnd={onDragEnd}
            className="flex carousel-track"
            style={{ gap: `${dimensions.gap}px` }}
          >
            {placeholders.map((item, index) => (
              <motion.article
                key={index}
                className="product-card brutal-border brutal-shadow group flex h-full flex-col overflow-hidden bg-[color:var(--chipzo-surface)] shrink-0 w-[82vw] md:w-[45vw] select-none"
                animate={{
                  scale: index === activeIndex ? 1 : 0.96,
                  opacity: index === activeIndex ? 1 : 0.65,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <div className="relative border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] p-6">
                  <span className="badge-shine brutal-border absolute left-4 top-4 bg-[color:var(--chipzo-lime)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] select-none">{item.badge}</span>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="product-image mx-auto h-52 w-full object-contain pointer-events-none"
                    draggable="false"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5 select-none">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--chipzo-muted)]">{item.category}</p>
                    <h3 className="mt-1 text-2xl font-black leading-[0.9] tracking-[-0.05em]">{item.name}</h3>
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3 border-t-2 border-dashed border-[color:var(--chipzo-rule)] pt-3">
                    <div>
                      <p className="tabular-prices text-3xl font-black tracking-[-0.05em] text-[color:var(--chipzo-primary)]">₹{item.price.toFixed(2)}</p>
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-primary)]">Arrives in 90 min</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const categoryMap = { 'Microcontrollers': 'UNIT_MICRO_CTRL', 'Sensors': 'UNIT_SENSOR', 'Tools': 'UNIT_TOOL' };
                        onAddToCart?.({
                          id: item.id,
                          code: item.code,
                          title: item.title,
                          category: categoryMap[item.category] || 'UNIT_MODULE',
                          specs: item.specs.map(s => s.toUpperCase()),
                          price: item.price,
                          image: item.image,
                          status: 'Operational'
                        });
                      }}
                      className="add-btn brutal-border brutal-shadow-sm h-11 bg-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-lime)] hover:text-[color:var(--chipzo-ink)] px-4 text-sm font-black uppercase tracking-[0.09em] text-[color:var(--chipzo-paper)] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      ) : (
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex lg:grid overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory lg:snap-none gap-6 pb-6 lg:pb-0 lg:grid-cols-3 scrollbar-none scroll-smooth px-1 lg:px-0"
        >
          {placeholders.map((item, index) => (
            <article
              key={index}
              className="product-card brutal-border brutal-shadow group flex h-full flex-col overflow-hidden bg-[color:var(--chipzo-surface)] snap-start shrink-0 w-[82vw] md:w-[45vw] lg:w-auto"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] p-6">
                <span className="badge-shine brutal-border absolute left-4 top-4 bg-[color:var(--chipzo-lime)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">{item.badge}</span>
                <img
                  src={item.image}
                  alt={item.name}
                  className="product-image mx-auto h-52 w-full object-contain"
                />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--chipzo-muted)]">{item.category}</p>
                  <h3 className="mt-1 text-2xl font-black leading-[0.9] tracking-[-0.05em]">{item.name}</h3>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 border-t-2 border-dashed border-[color:var(--chipzo-rule)] pt-3">
                  <div>
                    <p className="tabular-prices text-3xl font-black tracking-[-0.05em] text-[color:var(--chipzo-primary)]">₹{item.price.toFixed(2)}</p>
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-primary)]">Arrives in 90 min</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const categoryMap = { 'Microcontrollers': 'UNIT_MICRO_CTRL', 'Sensors': 'UNIT_SENSOR', 'Tools': 'UNIT_TOOL' };
                      onAddToCart?.({
                        id: item.id,
                        code: item.code,
                        title: item.title,
                        category: categoryMap[item.category] || 'UNIT_MODULE',
                        specs: item.specs.map(s => s.toUpperCase()),
                        price: item.price,
                        image: item.image,
                        status: 'Operational'
                      });
                    }}
                    className="add-btn brutal-border brutal-shadow-sm h-11 bg-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-lime)] hover:text-[color:var(--chipzo-ink)] px-4 text-sm font-black uppercase tracking-[0.09em] text-[color:var(--chipzo-paper)] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Slide dots for mobile viewports */}
      <div className="flex justify-center items-center gap-2.5 mt-4 lg:hidden">
        {placeholders.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 transition-all duration-300 brutal-border cursor-pointer ${
              activeIndex === index 
                ? 'w-7 bg-[color:var(--chipzo-primary)]' 
                : 'w-2.5 bg-[#252521]/15 hover:bg-[#383832]/30'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
