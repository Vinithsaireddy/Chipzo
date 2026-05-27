import { useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Copy, Check, Terminal } from 'lucide-react'

export default function StudentOfferBanner() {
  const [copied, setCopied] = useState(false)
  const couponCode = 'CHIPZO_STUDENT_25'

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="section-frame pb-16 sm:pb-24 relative overflow-hidden">
      {/* Neo-brutalist Outer Frame with offset shadow */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="relative border-[4px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] overflow-hidden"
      >
        {/* Technical decorative grid lines on the outer frame */}
        <div className="absolute top-0 right-0 h-4 w-4 border-b-4 border-l-4 border-[color:var(--chipzo-ink)]" />
        <div className="absolute bottom-0 left-0 h-4 w-4 border-t-4 border-r-4 border-[color:var(--chipzo-ink)]" />

        {/* Left Side: Content & Copy Trigger */}
        <div className="p-6 sm:p-10 lg:p-14 flex flex-col justify-center relative z-10 border-b-[4px] lg:border-b-0 lg:border-r-[4px] border-[color:var(--chipzo-ink)]">
          {/* Tech Grid Background pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none bg-[linear-gradient(rgba(0,0,0,0.08)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(0,0,0,0.08)_1.5px,transparent_1.5px)] bg-[size:16px_16px]" />

          {/* Academic Portal Verified Tag */}
          <div className="flex items-center gap-2 self-start bg-[color:var(--chipzo-ink)] px-3 py-1.5 border-[2px] border-[color:var(--chipzo-lime)] shadow-[2px_2px_0px_rgba(0,194,255,1)] mb-6 select-none animate-[pulse_3s_infinite]">
            <Award size={14} className="text-[color:var(--chipzo-lime)]" />
            <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-lime)]">
              // ACADEMIC_DISCOUNT_VERIFIED
            </span>
          </div>

          <h3 className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[color:var(--chipzo-muted)] flex items-center gap-1.5 leading-none">
            <Terminal size={12} className="text-[color:var(--chipzo-primary)]" /> SECURE EDUCATION INCENTIVE PORTAL
          </h3>
          
          <h2 className="mt-3 text-[clamp(2rem,5vw,3.6rem)] font-black uppercase leading-[0.85] tracking-[-0.07em] text-[color:var(--chipzo-ink)]">
            GEAR UP FOR <span className="text-[color:var(--chipzo-primary)]">YOUR NEXT BIG BUILD.</span>
          </h2>
          
          <p className="mt-4 max-w-xl text-xs sm:text-sm font-semibold leading-relaxed text-[color:var(--chipzo-muted)]">
            Are you an engineering student, tech maker, or lab hacker? Unlock a flat <span className="text-[color:var(--chipzo-ink)] font-black">25% Student Discount</span> across all microcontrollers, sensors, kits, and prototyping gear. Empowering the builders of tomorrow, today.
          </p>

          {/* Interactive Coupon Box */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch gap-3 sm:gap-0 max-w-md w-full brutal-border bg-[color:var(--chipzo-paper)] overflow-hidden">
            <div className="flex-1 flex flex-col justify-center px-4 py-3 sm:py-0">
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[color:var(--chipzo-muted)]">
                COPY ACCESS DECAL
              </span>
              <span className="font-mono text-sm font-black uppercase tracking-[0.05em] text-[color:var(--chipzo-ink)] mt-0.5">
                {couponCode}
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-[0.1em] border-t-2 sm:border-t-0 sm:border-l-[3px] border-[color:var(--chipzo-ink)] cursor-pointer transition-all ${
                copied 
                  ? 'bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)]' 
                  : 'bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)] hover:bg-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-paper)]'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy size={14} strokeWidth={2.5} />
                  <span>COPY CODE</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.1em] text-[color:var(--chipzo-muted)] select-none">
            <span>* VALID WITH EDUCATION ID CARD</span>
            <span>•</span>
            <span>FLAT 25% OFF</span>
            <span>•</span>
            <span>LAB ESSENTIALS</span>
          </div>
        </div>

        {/* Right Side: Futuristic Custom Generated Illustration */}
        <div className="relative min-h-[300px] lg:min-h-full overflow-hidden bg-[color:var(--chipzo-ink)] flex items-center justify-center">
          {/* Cyberpunk grid background scanlines overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none opacity-25 bg-[linear-gradient(rgba(0,194,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,194,255,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
          
          <img
            src="/student_offer_banner.png"
            alt="Student robotics and hardware lab illustration"
            className="h-full w-full object-cover opacity-90 saturate-[0.95] contrast-[1.05]"
            loading="lazy"
          />

          {/* Hologram decorative line overlay */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[linear-gradient(90deg,transparent_0%,rgba(0,194,255,0.4)_50%,transparent_100%)] opacity-35 animate-[pulse_1.5s_infinite]" />
        </div>
      </motion.div>
    </section>
  )
}
