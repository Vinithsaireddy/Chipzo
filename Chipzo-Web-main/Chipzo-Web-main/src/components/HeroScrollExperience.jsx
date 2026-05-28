import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CanvasSequence from './CanvasSequence.jsx'
import useImageSequence from '../hooks/useImageSequence.js'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

gsap.registerPlugin(ScrollTrigger)

// Narrative slides used by both desktop (GSAP) and mobile (stacked)
const SCENES = [
  {
    id: 0,
    content: (
      <div className="max-w-4xl text-center">
        <h1 className="text-[clamp(3.5rem,10vw,8.5rem)] font-black uppercase leading-[0.75] tracking-tighter text-[color:var(--chipzo-paper)]">
          BUILD<br /><span className="text-[color:var(--chipzo-lime)]">WITHOUT</span><br />WAITING.
        </h1>
        <p className="mt-6 text-base sm:text-xl font-bold uppercase tracking-widest text-[color:var(--chipzo-primary)]">
          Electronic components delivered in 90–120 minutes.
        </p>
      </div>
    ),
  },
  {
    id: 1,
    content: (
      <div className="max-w-4xl text-center">
        <h2 className="text-[clamp(2.5rem,6.5vw,5.5rem)] font-black uppercase leading-[0.8] tracking-tighter text-[color:var(--chipzo-paper)]">
          RUNNING OUT<br />OF COMPONENTS<br /><span className="text-[color:var(--chipzo-primary)]">SHOULDN'T</span><br />STOP A BUILD.
        </h2>
      </div>
    ),
  },
  {
    id: 2,
    content: (
      <div className="max-w-4xl text-center">
        <h2 className="text-[clamp(2.5rem,6.5vw,5.5rem)] font-black uppercase leading-[0.8] tracking-tighter text-[color:var(--chipzo-paper)]">
          FROM CART<br />TO WORKBENCH<br />IN UNDER<br /><span className="text-[color:var(--chipzo-lime)]">2 HOURS.</span>
        </h2>
      </div>
    ),
  },
  {
    id: 3,
    content: (
      <div className="max-w-4xl text-center">
        <h2 className="text-[clamp(2.3rem,5.5vw,4.8rem)] font-black uppercase leading-[0.85] tracking-tighter text-[color:var(--chipzo-paper)]">
          MICROCONTROLLERS.<br />SENSORS.<br /><span className="text-[color:var(--chipzo-lime)]">POWER MODULES.</span><br />ALL IN ONE PLACE.
        </h2>
      </div>
    ),
  },
  {
    id: 4,
    content: (
      <div className="max-w-4xl text-center">
        <h2 className="text-[clamp(2.5rem,6.5vw,5.5rem)] font-black uppercase leading-[0.8] tracking-tighter text-[color:var(--chipzo-paper)]">
          THE PARTS<br />YOU NEED.<br /><span className="text-[color:var(--chipzo-lime)]">WHEN YOU</span><br />NEED THEM.
        </h2>
      </div>
    ),
  },
  {
    id: 5,
    content: (
      <div className="max-w-4xl text-center">
        <h2 className="text-[clamp(2.5rem,6.5vw,5.5rem)] font-black uppercase leading-[0.8] tracking-tighter text-[color:var(--chipzo-paper)]">
          FOR MAKERS.<br />STUDENTS.<br /><span className="text-[color:var(--chipzo-primary)]">ENGINEERS.</span><br />STARTUPS.
        </h2>
      </div>
    ),
  },
  {
    id: 6,
    content: (
      <div className="max-w-4xl text-center">
        <h2 className="text-[clamp(2.8rem,7vw,6.5rem)] font-black uppercase leading-[0.8] tracking-tighter text-[color:var(--chipzo-paper)]">
          LESS SEARCHING.<br /><span className="text-[color:var(--chipzo-lime)]">MORE BUILDING.</span>
        </h2>
      </div>
    ),
  },
  {
    id: 7,
    content: (
      <div className="max-w-4xl text-center">
        <h2 className="text-[clamp(3rem,8vw,7.5rem)] font-black uppercase leading-[0.75] tracking-tighter text-[color:var(--chipzo-paper)]">
          START YOUR<br /><span className="text-[color:var(--chipzo-lime)]">NEXT PROJECT</span><br />TODAY.
        </h2>
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6">
          <Link to="/shop" className="brutal-border brutal-shadow bg-[color:var(--chipzo-primary)] px-6 sm:px-10 py-4 sm:py-5 text-base sm:text-xl font-black uppercase text-[color:var(--chipzo-paper)] pointer-events-auto transition-transform hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0">
            Explore Marketplace
          </Link>
          <button className="brutal-border brutal-shadow bg-[color:var(--chipzo-surface)] px-6 sm:px-10 py-4 sm:py-5 text-base sm:text-xl font-black uppercase text-[color:var(--chipzo-ink)] pointer-events-auto transition-transform hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0">
            Join Discord
          </button>
        </div>
      </div>
    ),
  },
]

// Desktop GSAP Pinned Experience
function DesktopHero() {
  const sectionRef = useRef(null)
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRefs = useRef([])

  const { render, isLoaded, loadedCount, totalCount } = useImageSequence({ canvasRef, frameCount: 240 })
  const progressPercent = totalCount > 0 ? Math.min(Math.round((loadedCount / totalCount) * 100), 100) : 0

  useEffect(() => {
    if (!isLoaded) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=350%',
          scrub: 1.2,
          pin: containerRef.current,
          anticipatePin: 1,
          onUpdate: (self) => render(self.progress),
        },
      })
      tl.fromTo(sceneRefs.current[0], { opacity: 0.6, y: 0 }, { opacity: 1, y: 0, duration: 0.03 }, 0)
      tl.to(sceneRefs.current[0], { opacity: 0, y: -30, duration: 0.03 }, 0.09)
      tl.fromTo(sceneRefs.current[1], { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.03 }, 0.12)
      tl.to(sceneRefs.current[1], { opacity: 0, scale: 1.05, duration: 0.03 }, 0.21)
      tl.fromTo(sceneRefs.current[2], { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.03 }, 0.24)
      tl.to(sceneRefs.current[2], { opacity: 0, x: 30, duration: 0.03 }, 0.33)
      tl.fromTo(sceneRefs.current[3], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.03 }, 0.36)
      tl.to(sceneRefs.current[3], { opacity: 0, y: -30, duration: 0.03 }, 0.45)
      tl.fromTo(sceneRefs.current[4], { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.03 }, 0.48)
      tl.to(sceneRefs.current[4], { opacity: 0, scale: 1.05, duration: 0.03 }, 0.57)
      tl.fromTo(sceneRefs.current[5], { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.03 }, 0.60)
      tl.to(sceneRefs.current[5], { opacity: 0, x: 30, duration: 0.03 }, 0.69)
      tl.fromTo(sceneRefs.current[6], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.03 }, 0.72)
      tl.to(sceneRefs.current[6], { opacity: 0, y: -30, duration: 0.03 }, 0.81)
      tl.fromTo(sceneRefs.current[7], { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.04 }, 0.84)
    }, containerRef)
    return () => ctx.revert()
  }, [render, isLoaded])

  useEffect(() => {
    if (isLoaded) render(0)
  }, [isLoaded, render])

  return (
    <section ref={sectionRef} className="relative w-full bg-[color:var(--chipzo-paper)]">
      <div ref={containerRef} className="relative w-full h-screen overflow-hidden">
        {/* Dynamic Poster Frame Overlay */}
        <div 
          className={`absolute inset-0 bg-[#F1F1EF] flex items-center justify-center overflow-hidden pointer-events-none transition-opacity duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
            isLoaded ? 'opacity-0 z-0' : 'opacity-100 z-20'
          }`}
        >
          <img 
            src="/sequence/arduino-nano-exploded/ezgif-frame-001.jpg"
            alt="CHIPZO Hero"
            className="w-full h-full object-contain p-4 scale-[1.18]"
          />
          {/* Cinematic Overlay Gradients and Grain */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_40%,color-mix(in_oklch,var(--chipzo-primary)_25%,transparent)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_60%,color-mix(in_oklch,var(--chipzo-lime)_15%,transparent)_0%,transparent_40%)]" />
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          
          {/* Sleek retro-cyberpunk progress indicator */}
          <div className="absolute bottom-[28%] left-0 right-0 flex flex-col items-center justify-center gap-4 pointer-events-auto z-30">
            <div className="flex items-center gap-3 font-mono text-sm sm:text-base font-black uppercase tracking-[0.25em] drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]">
              <span className="animate-pulse text-[color:var(--chipzo-lime)]">
                PRELOADING HARDWARE: <span className="text-[color:var(--chipzo-primary)]">{progressPercent}%</span>
              </span>
            </div>
            <div className="w-[360px] sm:w-[420px] h-3.5 bg-black/90 border-2 border-[color:var(--chipzo-paper)]/30 p-[3px] relative overflow-hidden flex items-center shadow-[4px_4px_0_rgba(0,0,0,0.6)]">
              <div 
                className="h-full bg-[color:var(--chipzo-lime)] transition-all duration-300 ease-out shadow-[0_0_12px_var(--chipzo-lime)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Skip to Shop Button */}
            <Link 
              to="/shop" 
              className="mt-2 w-[240px] sm:w-[280px] justify-center py-3 font-mono text-xs font-black uppercase tracking-[0.25em] bg-black/95 border-2 border-[color:var(--chipzo-primary)] text-[color:var(--chipzo-paper)] shadow-[3px_3px_0_var(--chipzo-primary)] transition-all hover:bg-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-ink)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] cursor-pointer flex items-center gap-2"
            >
              Skip to Shop <span>// ↗</span>
            </Link>
          </div>
        </div>

        {/* Live Canvas Animation */}
        <div className={`absolute inset-0 w-full h-full transition-opacity duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}>
          <CanvasSequence canvasRef={canvasRef} />
        </div>

        <div className="absolute inset-0 z-10 pointer-events-none">
          {SCENES.map((scene, i) => (
            <div
              key={scene.id}
              ref={(el) => (sceneRefs.current[i] = el)}
              className={`absolute inset-0 flex items-center justify-center px-6 pt-24 sm:pt-28 ${i === 0 ? 'opacity-60' : 'opacity-0'}`}
            >
              {scene.content}
              {i === 0 && (
                <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center justify-center gap-2 text-[color:var(--chipzo-primary)] animate-hard-glow">
                  <span className="text-xs font-black uppercase tracking-[0.25em]">Scroll Down</span>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">▼ ▼ ▼</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Mobile Static Stacked Experience with Interactive Looping Exploded View Canvas
function MobileHero() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dimensions, setDimensions] = useState({ cardWidth: 280, gap: 20 })

  const { render, isLoaded, loadedCount, totalCount } = useImageSequence({ canvasRef, frameCount: 240 })
  const progressPercent = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0

  const cards = [
    { label: 'RUNNING OUT OF COMPONENTS', accent: "SHOULDN'T STOP A BUILD.", color: 'text-[color:var(--chipzo-primary)]' },
    { label: 'FROM CART TO WORKBENCH IN UNDER', accent: '2 HOURS.', color: 'text-[color:var(--chipzo-lime)]' },
    { label: 'MICROCONTROLLERS. SENSORS.', accent: 'POWER MODULES.', color: 'text-[color:var(--chipzo-lime)]' },
    { label: 'LESS SEARCHING.', accent: 'MORE BUILDING.', color: 'text-[color:var(--chipzo-lime)]' },
  ]

  // Loop the exploded sequence automatically at 60fps in a smooth ping-pong style
  useEffect(() => {
    if (!isLoaded) return
    let frameId
    let startTime = Date.now()
    const duration = 9000 // 9 seconds per full assembly/disassembly cycle
    
    const loop = () => {
      const elapsed = Date.now() - startTime
      const progress = (elapsed % duration) / duration
      // Ping-pong style: explode out, then assemble back
      const pingPong = Math.abs(Math.sin(progress * Math.PI))
      render(pingPong)
      frameId = requestAnimationFrame(loop)
    }
    
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [isLoaded, render])

  useEffect(() => {
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
  }, [])

  const onDragEnd = (event, info) => {
    const swipeThreshold = 50
    const { offset, velocity } = info
    
    const cardWidthWithGap = dimensions.cardWidth + dimensions.gap
    const currentX = -activeIndex * cardWidthWithGap + offset.x
    
    // Smooth velocity projections for highly tactile snaps
    const velocityFactor = velocity.x * 0.15
    const projectedIndex = Math.round(-(currentX + velocityFactor) / cardWidthWithGap)
    const newIndex = Math.min(cards.length - 1, Math.max(0, projectedIndex))
    
    setActiveIndex(newIndex)
  }

  return (
    <section className="relative w-full bg-[color:var(--chipzo-ink)] pb-4 overflow-hidden flex flex-col min-h-screen justify-between">
      {/* Mobile Poster Frame Overlay */}
      <div 
        className={`absolute inset-0 z-0 h-full pointer-events-none transition-opacity duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isLoaded ? 'opacity-0' : 'opacity-35'
        }`}
      >
        <div className="absolute inset-0 bg-[#F1F1EF] flex items-center justify-center overflow-hidden">
          <img 
            src="/sequence/arduino-nano-exploded/ezgif-frame-001.jpg"
            alt="CHIPZO Hero"
            className="relative -top-10 w-full h-full object-contain p-4 scale-[1.15] rotate-90"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--chipzo-ink)]/10 via-[color:var(--chipzo-ink)]/40 to-[color:var(--chipzo-ink)]" />
      </div>

      {/* Background Canvas Sequence for Exploded View on Mobile */}
      <div 
        className={`absolute inset-0 z-0 h-full pointer-events-none transition-opacity duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isLoaded ? 'opacity-35' : 'opacity-0'
        }`}
      >
        <CanvasSequence canvasRef={canvasRef} />
        {/* Dark overlay blend so neon components pop and text stays perfectly legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--chipzo-ink)]/10 via-[color:var(--chipzo-ink)]/40 to-[color:var(--chipzo-ink)]" />
      </div>

      {/* Hero Banner - Merged and Tightened */}
      <div className="relative z-10 flex flex-col items-center justify-center px-5 pt-24 pb-2 text-center flex-grow">
        <div>
          <h1 className="text-[clamp(3.0rem,12vw,4.5rem)] font-black uppercase leading-[0.8] tracking-tighter text-[color:var(--chipzo-paper)]">
            BUILD<br /><span className="text-[color:var(--chipzo-lime)]">WITHOUT</span><br />WAITING.
          </h1>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-[color:var(--chipzo-primary)]">
            Electronic components delivered in 90–120 minutes.
          </p>
          {/* Mobile Loading Progress Bar */}
          <div className={`mt-5 flex flex-col items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 ease-out ${
            isLoaded ? 'opacity-0 h-0 overflow-hidden mt-0' : 'opacity-100'
          }`}>
            <span className="animate-pulse text-[color:var(--chipzo-lime)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              PRELOADING HARDWARE: <span className="text-[color:var(--chipzo-primary)]">{progressPercent}%</span>
            </span>
            <div className="w-48 h-1.5 bg-black/60 border border-[color:var(--chipzo-paper)]/20 p-[1px] relative overflow-hidden flex items-center shadow-[1px_1px_0_rgba(0,0,0,0.3)]">
              <div 
                className="h-full bg-[color:var(--chipzo-lime)] transition-all duration-300 ease-out shadow-[0_0_6px_var(--chipzo-lime)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-row justify-center gap-3 w-full max-w-xs mx-auto">
            <Link
              to="/shop"
              className="brutal-border brutal-shadow-sm flex-1 bg-[color:var(--chipzo-primary)] py-2.5 text-xs font-black uppercase text-[color:var(--chipzo-paper)] text-center transition-transform hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 animate-pulse-light"
            >
              Explore
            </Link>
            <button className="border-[2px] border-[color:var(--chipzo-paper)] bg-transparent flex-1 py-2.5 text-xs font-black uppercase text-[color:var(--chipzo-paper)] text-center hover:bg-[color:var(--chipzo-surface)] hover:text-[color:var(--chipzo-ink)] transition-colors">
              Discord
            </button>
          </div>
        </div>
      </div>

      {/* Swipeable Narrative Cards - Pulled Up & Compact */}
      <div className="relative z-10 border-t-2 border-b-2 border-[color:var(--chipzo-paper)]/10 py-4 w-full bg-[color:var(--chipzo-ink)]/60 backdrop-blur-xs">
        <div className="flex items-center justify-between px-5 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-primary)]">System Narrative</span>
          <span className="text-[9px] font-mono font-bold text-[color:var(--chipzo-paper)]/60">
            [SWIPE MODULES]
          </span>
        </div>
        <div 
          ref={containerRef}
          className="w-full overflow-hidden cursor-grab active:cursor-grabbing pb-3"
        >
          <motion.div
            drag="x"
            dragConstraints={{
              left: -((cards.length - 1) * (dimensions.cardWidth + dimensions.gap)),
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
            className="flex carousel-track px-5"
            style={{ gap: `${dimensions.gap}px` }}
          >
            {cards.map((item, i) => (
              <motion.div 
                key={i} 
                className="carousel-card shrink-0 w-[85vw] md:w-[45vw] brutal-border brutal-shadow bg-[#131311] p-4 pt-8 text-left relative flex flex-col justify-between min-h-[160px] select-none"
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
                <div className="brutal-border absolute -top-3 left-4 bg-[color:var(--chipzo-primary)] px-2 py-0.5 text-[10px] font-black text-[color:var(--chipzo-ink)] font-mono select-none">
                  MOD-{String(i + 2).padStart(2, '0')}
                </div>
                <h2 className="text-sm font-black uppercase leading-[0.95] tracking-tighter text-[color:var(--chipzo-paper)] mt-1 select-none">
                  {item.label}<br />
                  <span className={item.color}>{item.accent}</span>
                </h2>
                <div className="mt-3 flex items-center justify-between border-t border-dashed border-[color:var(--chipzo-paper)]/10 pt-2 select-none">
                  <span className="text-[8px] font-bold tracking-widest text-[color:var(--chipzo-paper)]/40 font-mono">CHIPZO HARDWARE SYSTEM</span>
                  <span className="text-[10px] font-bold text-[color:var(--chipzo-lime)] font-mono">✓ ACTIVE</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Visual Swipe Indicators */}
        <div className="flex justify-center items-center gap-2 mt-1">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2 transition-all duration-300 brutal-border cursor-pointer ${
                activeIndex === i 
                  ? 'w-6 bg-[color:var(--chipzo-lime)]' 
                  : 'w-2 bg-[#252521] hover:bg-[#383832]'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HeroScrollExperience() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Preload first frame of animation immediately on mount for maximum performance
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = '/sequence/arduino-nano-exploded/ezgif-frame-001.jpg'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  return isMobile ? <MobileHero /> : <DesktopHero />
}
