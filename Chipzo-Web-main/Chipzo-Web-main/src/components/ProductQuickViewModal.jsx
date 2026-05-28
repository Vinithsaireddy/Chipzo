import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Minus, Plus, Zap, Cpu } from 'lucide-react'
import { getProductImageUrl } from '../utils/imageUtils.js'
import { LoadingButton } from './LoadingButton.jsx'
import { useAsyncStatus } from '../hooks/useAsyncAction.js'

const RELATED_ITEMS = {
  Microcontroller: [
    { title: 'Jumper Wires', price: '₹45', image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=200&q=60' },
    { title: 'Breadboard', price: '₹89', image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=200&q=60' },
    { title: 'USB Cable', price: '₹69', image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=200&q=60' },
  ],
  Sensor: [
    { title: 'Resistor Kit', price: '₹99', image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=200&q=60' },
    { title: 'PCB Board', price: '₹35', image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=200&q=60' },
    { title: 'Connector Wires', price: '₹55', image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=200&q=60' },
  ],
  default: [
    { title: 'Jumper Wires', price: '₹45', image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=200&q=60' },
    { title: 'Breadboard', price: '₹89', image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=200&q=60' },
    { title: 'Heat Shrink', price: '₹29', image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=200&q=60' },
  ],
}

function ProductGallery({ images, title }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const imageRef = useRef(null)

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-[color:var(--chipzo-surface)] border-[3px] border-[color:var(--chipzo-ink)]">
        <Cpu size={48} strokeWidth={1.5} className="text-[color:var(--chipzo-muted)]" />
      </div>
    )
  }

  const resolvedImages = images.map(getProductImageUrl)
  const currentImage = resolvedImages[currentIndex] || resolvedImages[0]

  const handleMouseMove = (e) => {
    if (!zoomed || !imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  const toggleZoom = () => {
    setZoomed(z => !z)
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={imageRef}
        role="button"
        tabIndex={0}
        onClick={toggleZoom}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleZoom() }}
        className="relative aspect-square overflow-hidden border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] group cursor-crosshair"
        onMouseMove={handleMouseMove}
      >
        <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(0,194,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,194,255,0.06)_1px,transparent_1px)] bg-[size:12px_12px]" />
        <div className="absolute -left-10 -top-10 z-10 h-32 w-32 rounded-full bg-[color:var(--chipzo-primary)]/5 blur-2xl" />
        <div className="absolute -right-10 -bottom-10 z-10 h-32 w-32 rounded-full bg-[color:var(--chipzo-lime)]/5 blur-2xl" />
        <img
          src={currentImage}
          alt={title}
          className="h-full w-full object-contain p-4 transition-transform duration-300"
          style={zoomed ? { transform: 'scale(1.8)', transformOrigin: `${mousePos.x}% ${mousePos.y}%` } : {}}
        />
        <div className="absolute top-2 left-2 z-20 border-[2px] border-[color:var(--chipzo-primary)] bg-[color:var(--chipzo-ink)] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-[color:var(--chipzo-paper)]">
          PREVIEW
        </div>
      </div>
      {resolvedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {resolvedImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`shrink-0 w-14 h-14 border-[2px] overflow-hidden transition-all ${
                idx === currentIndex
                  ? 'border-[color:var(--chipzo-primary)] shadow-[2px_2px_0_var(--chipzo-primary)]'
                  : 'border-[color:var(--chipzo-ink)] opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductSpecsPanel({ specs }) {
  if (!specs || specs.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 border-b-[2px] border-[color:var(--chipzo-ink)] pb-1.5 mb-2">
        <Zap size={12} strokeWidth={2.5} className="text-[color:var(--chipzo-primary)]" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-muted)]">
          TECHNICAL SPECIFICATIONS
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {specs.map((spec, idx) => {
          const [key, ...valParts] = spec.split(': ')
          const value = valParts.join(': ')
          return (
            <div
              key={idx}
              className="flex items-baseline gap-1.5 border border-[color:var(--chipzo-rule)] bg-[color:var(--chipzo-surface)] px-2 py-1.5"
            >
              <span className="text-[8px] font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-muted)] shrink-0">
                {key}:
              </span>
              <span className="text-[10px] font-bold text-[color:var(--chipzo-ink)] truncate">
                {value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function QuantitySelector({ quantity, onDecrement, onIncrement }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[color:var(--chipzo-muted)] mr-1">
        QTY
      </span>
      <button
        type="button"
        onClick={onDecrement}
        disabled={quantity <= 1}
        className="flex h-8 w-8 items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[2px_2px_0_var(--chipzo-ink)] transition-all hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--chipzo-ink)] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[2px_2px_0_var(--chipzo-ink)]"
      >
        <Minus size={12} strokeWidth={3} />
      </button>
      <div className="flex h-8 min-w-[2.5rem] items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-2 text-xs font-black tabular-prices text-[color:var(--chipzo-ink)]">
        {String(quantity).padStart(2, '0')}
      </div>
      <button
        type="button"
        onClick={onIncrement}
        className="flex h-8 w-8 items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[2px_2px_0_var(--chipzo-ink)] transition-all hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--chipzo-ink)]"
      >
        <Plus size={12} strokeWidth={3} />
      </button>
    </div>
  )
}

function RelatedProducts({ category, onAddToCart }) {
  const items = RELATED_ITEMS[category] || RELATED_ITEMS.default

  return (
    <div>
      <div className="flex items-center gap-2 border-b-[2px] border-[color:var(--chipzo-ink)] pb-1.5 mb-2">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-muted)]">
          PAIR WITH:
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="shrink-0 flex items-center gap-2 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-2 min-w-0"
          >
            <img src={item.image} alt={item.title} className="h-10 w-10 object-contain border border-[color:var(--chipzo-rule)] bg-[color:var(--chipzo-paper)] p-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase text-[color:var(--chipzo-ink)] truncate max-w-[80px]">
                {item.title}
              </p>
              <p className="text-[9px] font-bold tabular-prices text-[color:var(--chipzo-primary)]">{item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProductQuickViewModal({ product, isOpen, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)
  const modalRef = useRef(null)
  const { status: addStatus, execute: executeAdd } = useAsyncStatus({ minDuration: 900, successDuration: 800 })
  const previousActiveElement = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      setQuantity(1)
      return
    }

    previousActiveElement.current = document.activeElement

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    setTimeout(() => {
      const closeBtn = modalRef.current?.querySelector('[aria-label="Close quick view"]')
      closeBtn?.focus()
    }, 100)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousActiveElement.current?.focus()
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    const prevPosition = document.body.style.position
    const prevWidth = document.body.style.width
    const prevTop = document.body.style.top
    const scrollY = window.scrollY

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.position = prevPosition
      document.body.style.width = prevWidth
      document.body.style.top = prevTop
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  if (!product) return null

  const images = product.image ? [product.image] : []

  const handleAdd = () => {
    executeAdd(async () => {
      // Simulate premium pre-load latency (800ms to 1s, e.g., 900ms)
      await new Promise(resolve => setTimeout(resolve, 900))

      // When loading state is done, we actually add the product to the cart
      for (let i = 0; i < quantity; i++) {
        await onAddToCart?.({
          id: product.id,
          _backendProductId: product._id,
          code: product.code,
          title: product.title,
          category: product.category,
          specs: product.specs,
          price: product.priceNum,
          image: product.image || '',
          status: 'Operational',
        })
      }
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            onTouchMove={(e) => e.preventDefault()}
          />

          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${product.title}`}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-[1200px] max-h-[85vh] overflow-y-auto border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="absolute inset-0 pointer-events-none select-none">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,194,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,194,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
              <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[color:var(--chipzo-primary)]" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[color:var(--chipzo-primary)]" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[color:var(--chipzo-primary)]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[color:var(--chipzo-primary)]" />
            </div>

            <div className="sticky top-0 z-20 flex items-center justify-between bg-[color:var(--chipzo-ink)] px-4 py-2 border-b-[3px] border-[color:var(--chipzo-ink)]">
              <div className="flex items-center gap-2">
                <Cpu size={14} strokeWidth={2} className="text-[color:var(--chipzo-lime)]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-paper)]">
                  QUICK VIEW // PRODUCT DETAILS
                </span>
              </div>
              <button
                type="button"
                aria-label="Close quick view"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center border-[2px] border-[color:var(--chipzo-paper)] bg-transparent text-[color:var(--chipzo-paper)] transition-all hover:bg-[color:var(--chipzo-paper)] hover:text-[color:var(--chipzo-ink)] active:scale-90"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            {/* ─── Two-column content ─── */}
            <div className="relative z-10 flex flex-col lg:flex-row">
              {/* LEFT - Image */}
              <div className="w-full lg:w-[45%] p-4 sm:p-6 lg:border-r-[3px] lg:border-[color:var(--chipzo-rule)]">
                <ProductGallery images={images} title={product.title} />
              </div>

              {/* RIGHT - Details */}
              <div className="flex flex-col w-full lg:w-[55%] p-4 sm:p-6 gap-4">
                {/* Category badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 border-[2px] border-[color:var(--chipzo-primary)] bg-[color:var(--chipzo-primary)]/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] text-[color:var(--chipzo-primary)]">
                    <Zap size={10} strokeWidth={2.5} />
                    {product.category || 'COMPONENT'}
                  </span>
                  <span className="text-[8px] font-mono text-[color:var(--chipzo-muted)] ml-auto">
                    [{product.code}]
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-[color:var(--chipzo-ink)]">
                  {product.title}
                </h2>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tabular-prices text-[color:var(--chipzo-lime)] drop-shadow-[0_0_8px_rgba(132,255,66,0.3)]">
                    {product.price}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-muted)]">
                    {product.note}
                  </span>
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-xs font-semibold leading-relaxed text-[color:var(--chipzo-muted)] border-l-[3px] border-[color:var(--chipzo-primary)] pl-3">
                    {product.description}
                  </p>
                )}

                {/* Divider */}
                <div className="border-t-[2px] border-dashed border-[color:var(--chipzo-rule)]" />

                {/* Specs */}
                <ProductSpecsPanel specs={product.specs} />

                {/* Divider */}
                <div className="border-t-[2px] border-dashed border-[color:var(--chipzo-rule)]" />

                {/* Quantity + Add to Cart */}
                <div className="flex items-center gap-3 flex-wrap">
                  <QuantitySelector
                    quantity={quantity}
                    onDecrement={() => setQuantity(q => Math.max(1, q - 1))}
                    onIncrement={() => setQuantity(q => Math.min(99, q + 1))}
                  />
                  <LoadingButton
                    type="button"
                    onClick={handleAdd}
                    status={addStatus}
                    variant="lime"
                    className="flex-1 min-w-[180px]"
                  >
                    ADD TO CART — {(product.priceNum * quantity).toFixed(2)}
                  </LoadingButton>
                </div>

                {/* Delivery note */}
                <div className="flex items-center gap-2 border-[2px] border-[color:var(--chipzo-rule)] bg-[color:var(--chipzo-surface)] px-3 py-2">
                  <span className="text-[10px]">⚡</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-muted)]">
                    DELIVERY IN 90 MIN — LOCAL STOCK
                  </span>
                </div>

                {/* Related */}
                <RelatedProducts category={product.category} onAddToCart={onAddToCart} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
