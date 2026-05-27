import { useEffect } from 'react'
import Lenis from 'lenis'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function SmoothScroll({ children }) {
  useEffect(() => {
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    const lenis = new Lenis({
      duration: isTouch ? 0.8 : 1.2,
      smoothWheel: true,
      syncTouch: false,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })

    // Expose globally so other components (e.g. ProfilePanel) can stop/start scroll
    window.__lenis = lenis

    // Integrate with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    let rafId = 0
    const raf = (time) => {
      lenis.raf(time)
      rafId = window.requestAnimationFrame(raf)
    }
    rafId = window.requestAnimationFrame(raf)

    return () => {
      window.cancelAnimationFrame(rafId)
      lenis.destroy()
      window.__lenis = null
    }
  }, [])

  return <>{children}</>
}
