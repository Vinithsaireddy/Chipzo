import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import { productsAPI } from '../services/api'
import { getProductImageUrl } from '../utils/imageUtils'
import { LoadingButton } from './LoadingButton'

export default function KitsSection({ onNavigate, onAddToCart }) {
  const [kits, setKits] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [btnStatuses, setBtnStatuses] = useState({})
  const scrollRef = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const data = await productsAPI.getAll({ category: 'Project Kits', limit: 20 })
        if (cancelled) return
        const raw = data?.data || data?.products || []
        setKits(raw.map(p => ({
          id: p._id,
          title: p.name || 'Kit',
          price: Number(p.price || 0),
          image: p.images?.length ? getProductImageUrl(p.images[0]) : '',
          specs: p.specifications ? Object.entries(p.specifications).map(([k, v]) => `${k}: ${v}`) : [],
        })))
      } catch (_) {
        if (!cancelled) setKits([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const scroll = (dir) => {
    const el = document.getElementById('kits-scroll')
    if (!el) return
    el.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  const handleAdd = async (kit, e) => {
    e.stopPropagation()
    if (btnStatuses[kit.id]) return
    setBtnStatuses(prev => ({ ...prev, [kit.id]: 'loading' }))
    try {
      await new Promise(r => setTimeout(r, 900))
      await onAddToCart?.({
        id: kit.id,
        title: kit.title,
        price: kit.price,
        image: kit.image,
        status: 'Operational',
      })
      setBtnStatuses(prev => ({ ...prev, [kit.id]: 'success' }))
      setTimeout(() => {
        setBtnStatuses(prev => { const n = { ...prev }; delete n[kit.id]; return n })
      }, 800)
    } catch (_) {
      setBtnStatuses(prev => ({ ...prev, [kit.id]: 'error' }))
      setTimeout(() => {
        setBtnStatuses(prev => { const n = { ...prev }; delete n[kit.id]; return n })
      }, 1000)
    }
  }

  return (
    <section className="section-frame pb-16 sm:pb-24 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="brutal-border inline-block bg-[color:var(--chipzo-ink)] px-4 py-2 text-[color:var(--chipzo-lime)] text-xs font-black uppercase tracking-[0.16em]"
        >
          PROJECT KITS //
        </motion.div>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="brutal-border bg-[color:var(--chipzo-paper)] p-2 hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] transition-colors cursor-pointer">
            <ChevronLeft size={18} strokeWidth={3} />
          </button>
          <button onClick={() => scroll(1)} className="brutal-border bg-[color:var(--chipzo-paper)] p-2 hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] transition-colors cursor-pointer">
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div
        id="kits-scroll"
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[260px] brutal-border bg-[color:var(--chipzo-surface)] p-4 animate-pulse">
              <div className="h-36 bg-gray-200 mb-3" />
              <div className="h-4 w-3/4 bg-gray-200 mb-2" />
              <div className="h-3 w-1/2 bg-gray-200" />
            </div>
          ))
        ) : kits.length === 0 ? (
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-muted)] py-8">No kits available</p>
        ) : (
          kits.map((kit) => (
            <motion.div
              key={kit.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="min-w-[260px] max-w-[260px] brutal-border brutal-shadow bg-[color:var(--chipzo-paper)] overflow-hidden flex flex-col group hover:-translate-y-[2px] hover:shadow-[6px_6px_0_var(--chipzo-ink)] transition-all shrink-0"
            >
              <div className="h-36 bg-[color:var(--chipzo-surface)] border-b-[3px] border-[color:var(--chipzo-ink)] flex items-center justify-center p-3 overflow-hidden">
                {kit.image ? (
                  <img src={kit.image} alt={kit.title} className="h-full w-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-[color:var(--chipzo-ink)]/5 flex items-center justify-center text-[8px] font-black uppercase text-[color:var(--chipzo-muted)]">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-xs font-black uppercase leading-tight text-[color:var(--chipzo-ink)] line-clamp-2">
                  {kit.title}
                </h3>
                {kit.specs?.length > 0 && (
                  <p className="mt-1 text-[8px] font-semibold text-[color:var(--chipzo-muted)] line-clamp-1 uppercase tracking-tight">
                    {kit.specs.join(' • ')}
                  </p>
                )}
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-[color:var(--chipzo-rule)]">
                  <span className="text-sm font-black text-[color:var(--chipzo-primary)]">₹{kit.price.toFixed(2)}</span>
                  <LoadingButton
                    type="button"
                    onClick={(e) => handleAdd(kit, e)}
                    status={btnStatuses[kit.id] || 'idle'}
                    variant="ink"
                    size="sm"
                    icon={ShoppingCart}
                  >
                    Add
                  </LoadingButton>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => onNavigate?.('shop', 'Project Kits')}
          className="brutal-border bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] font-black text-xs py-3 px-6 shadow-[4px_4px_0_var(--chipzo-ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_var(--chipzo-ink)] transition-all uppercase tracking-[0.12em] cursor-pointer"
        >
          View All Kits →
        </button>
      </div>
    </section>
  )
}
