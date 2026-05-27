import { useEffect } from 'react'
import { AlertTriangle, X, Ban, Clock, MapPin } from 'lucide-react'

const ICONS = {
  sunday: Ban,
  time: Clock,
  location: MapPin,
  default: AlertTriangle,
}

const THEMES = {
  sunday: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    iconBg: 'bg-red-500',
    iconColor: 'text-white',
    title: 'text-red-700',
    subtitle: 'text-red-600',
    bar: 'bg-red-500',
  },
  time: {
    border: 'border-amber-500',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-500',
    iconColor: 'text-white',
    title: 'text-amber-700',
    subtitle: 'text-amber-600',
    bar: 'bg-amber-500',
  },
  location: {
    border: 'border-orange-500',
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-500',
    iconColor: 'text-white',
    title: 'text-orange-700',
    subtitle: 'text-orange-600',
    bar: 'bg-orange-500',
  },
  default: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    iconBg: 'bg-red-500',
    iconColor: 'text-white',
    title: 'text-red-700',
    subtitle: 'text-red-600',
    bar: 'bg-red-500',
  },
}

export default function AlertModal({ isOpen, onClose, title, message, type = 'default', autoClose = 5000 }) {
  const theme = THEMES[type] || THEMES.default
  const Icon = ICONS[type] || ICONS.default

  useEffect(() => {
    if (!isOpen || !autoClose) return
    const timer = setTimeout(onClose, autoClose)
    return () => clearTimeout(timer)
  }, [isOpen, onClose, autoClose])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-md border-[3px] ${theme.border} ${theme.bg} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-[slideUp_0.3s_cubic-bezier(0.25,1,0.5,1)]`}
      >
        <div className={`h-1.5 w-full ${theme.bar}`} />

        <div className="p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] transition-all active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
          >
            <X size={16} strokeWidth={3} />
          </button>

          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] ${theme.iconBg} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}>
              <Icon size={24} className={theme.iconColor} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <h3 className={`text-base font-black uppercase tracking-tight ${theme.title}`}>
                {title || 'Order Blocked'}
              </h3>
              <p className={`mt-2 text-sm font-bold ${theme.subtitle}`}>
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`border-[3px] border-[color:var(--chipzo-ink)] ${theme.bg} px-6 py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${theme.title}`}
            >
              GOT IT
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
