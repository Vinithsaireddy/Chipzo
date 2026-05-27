import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Toast({ product, onClose, duration = 4000 }) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(100)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (!product) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        triggerClose()
      }
    }, 10)

    return () => clearInterval(interval)
  }, [product, duration])

  const triggerClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
    }, 300) // matches transition duration
  }

  if (!product) return null

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex flex-col max-w-sm w-full bg-[var(--chipzo-surface)] border-3 border-[var(--chipzo-ink)] shadow-[6px_6px_0_var(--chipzo-ink)] transition-all duration-300 transform ${
        isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100 animate-[slideIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]'
      }`}
      style={{
        fontFamily: "'Archivo', sans-serif"
      }}
    >
      {/* Top Accent Line */}
      <div className="h-1 bg-[var(--chipzo-primary)] border-b-2 border-[var(--chipzo-ink)]" />
      
      <div className="p-4 flex gap-3 items-start relative">
        {/* Success Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-[var(--chipzo-ink)] bg-[var(--chipzo-lime)] flex items-center justify-center font-bold text-[var(--chipzo-ink)] shadow-[2px_2px_0_var(--chipzo-ink)]">
          ✓
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0 pr-4">
          <p className="font-bold text-[var(--chipzo-ink)] text-sm tracking-wide uppercase">
            Added to Cart!
          </p>
          <div className="flex items-center gap-2 mt-2 bg-[var(--chipzo-paper)] p-2 border-2 border-[var(--chipzo-ink)] shadow-[2px_2px_0_var(--chipzo-ink)]">
            {product.image && (
              <img
                src={product.image}
                alt={product.title}
                className="w-10 h-10 object-contain bg-white border border-[var(--chipzo-ink)] p-0.5 flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--chipzo-ink)] truncate">
                {product.title}
              </p>
              <p className="text-[10px] text-[var(--chipzo-muted)] font-bold tabular-prices">
                ₹{product.price?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={triggerClose}
          className="absolute top-2 right-2 text-[var(--chipzo-ink)] hover:text-[var(--chipzo-primary)] font-bold text-lg leading-none p-1 focus:outline-none transition-colors"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>

      {/* Action Footer */}
      <div className="px-4 pb-3 pt-1 flex justify-end gap-2">
        <button
          onClick={() => {
            navigate('/cart')
            triggerClose()
          }}
          className="px-3 py-1.5 bg-[var(--chipzo-lime)] border-2 border-[var(--chipzo-ink)] text-xs font-bold text-[var(--chipzo-ink)] shadow-[2px_2px_0_var(--chipzo-ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--chipzo-ink)] transition-all hover:bg-[var(--chipzo-primary)] cursor-pointer"
        >
          View Cart
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-[var(--chipzo-paper)] border-t border-[var(--chipzo-ink)] overflow-hidden">
        <div
          className="h-full bg-[var(--chipzo-primary)] transition-all duration-75 linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
