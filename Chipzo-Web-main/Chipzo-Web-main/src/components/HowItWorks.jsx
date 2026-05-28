import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const steps = [
  ['01', 'Order', 'Choose your parts while your build is active.'],
  ['02', 'Pack', 'Local runners verify and pack from nearby hubs.'],
  ['03', 'Deliver', 'Track to your desk, lab, garage, or hackathon table.'],
]

export default function HowItWorks() {
  const containerRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dimensions, setDimensions] = useState({ cardWidth: 280, gap: 20 })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!isMobile) return
    const updateDimensions = () => {
      if (containerRef.current) {
        const cardEl = containerRef.current.querySelector('.carousel-card')
        if (cardEl) {
          const rect = cardEl.getBoundingClientRect()
          const computedStyle = window.getComputedStyle(cardEl.parentNode)
          const gapVal = parseFloat(computedStyle.gap) || 20
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

  const onDragEnd = (event, info) => {
    const { offset, velocity } = info
    const cardWidthWithGap = dimensions.cardWidth + dimensions.gap
    const currentX = -activeIndex * cardWidthWithGap + offset.x
    
    const velocityFactor = velocity.x * 0.15
    const projectedIndex = Math.round(-(currentX + velocityFactor) / cardWidthWithGap)
    const newIndex = Math.min(steps.length - 1, Math.max(0, projectedIndex))
    
    setActiveIndex(newIndex)
  }

  return (
    <section id="how-it-works" className="border-y-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] py-16 text-[color:var(--chipzo-paper)] sm:py-20">
      <div className="section-frame py-0">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-primary)]">How it works</p>
            <h2 className="mt-3 text-[clamp(2.3rem,5vw,5.2rem)] font-black uppercase leading-[0.82] tracking-[-0.07em] text-[color:var(--chipzo-paper)]">From click to bench in 90 minutes.</h2>
          </div>
          
          {isMobile ? (
            <div className="w-full overflow-hidden pb-4">
              <div 
                ref={containerRef}
                className="w-full overflow-hidden cursor-grab active:cursor-grabbing pb-4"
              >
                <motion.div
                  drag="x"
                  dragConstraints={{
                    left: -((steps.length - 1) * (dimensions.cardWidth + dimensions.gap)),
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
                  className="flex px-1"
                  style={{ gap: `${dimensions.gap}px` }}
                >
                  {steps.map(([num, title, copy], i) => (
                    <motion.div
                      key={num}
                      className="carousel-card shrink-0 w-[82vw] brutal-border bg-[#131311] p-6 pt-10 text-left relative flex flex-col justify-between min-h-[180px] select-none"
                      animate={{
                        scale: i === activeIndex ? 1 : 0.96,
                        opacity: i === activeIndex ? 1 : 0.65,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      <div>
                        <span className="brutal-border absolute -top-4 left-5 bg-[color:var(--chipzo-primary)] px-3 py-1 text-xl font-black text-[color:var(--chipzo-ink)] select-none">
                          {num}
                        </span>
                        <h3 className="text-2xl font-black uppercase tracking-[-0.04em] text-[color:var(--chipzo-primary)]">
                          {title}
                        </h3>
                        <p className="mt-3 text-sm font-semibold leading-relaxed text-[#D8D8D1]">
                          {copy}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Visual Swipe Indicators */}
              <div className="flex justify-center items-center gap-3 mt-2">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-2.5 transition-all duration-300 brutal-border cursor-pointer ${
                      activeIndex === i 
                        ? 'w-8 bg-[color:var(--chipzo-lime)]' 
                        : 'w-2.5 bg-[#252521] hover:bg-[#383832]'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {steps.map(([num, title, copy]) => (
                <article key={num} className="brutal-border relative bg-[#131311] p-6 pt-9">
                  <span className="brutal-border absolute -top-4 left-5 bg-[color:var(--chipzo-primary)] px-3 py-1 text-xl font-black text-[color:var(--chipzo-ink)]">{num}</span>
                  <h3 className="text-2xl font-black uppercase tracking-[-0.04em] text-[color:var(--chipzo-primary)]">{title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-[#D8D8D1]">{copy}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

