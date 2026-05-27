import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown, ShoppingCart, RefreshCw, AlertOctagon, Clock, Ban } from 'lucide-react'
import SmoothScroll from '../components/SmoothScroll.jsx'
import Navbar from '../components/Navbar.jsx'
import { productsAPI } from '../services/api.js'

const SHOP_CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Sensors', value: 'Sensor' },
  { label: 'Motors', value: 'Motor & Driver' },
  { label: 'Microcontrollers', value: 'Microcontroller' },
  { label: 'Power Supply', value: 'Power Supply' },
  { label: 'Batteries', value: 'Battery' },
  { label: 'Modules', value: 'Communication Module' },
  { label: 'Drivers', value: 'Motor & Driver' },
  { label: 'IoT Components', value: 'Communication Module' },
  { label: 'Tools', value: 'Tool' },
  { label: 'Accessories', value: 'Other' },
]

const announcements = [
  { text: 'Accepting orders only from 10:00 AM to 7:30 PM', icon: Clock },
  { text: 'Not accepting orders on Sundays and special occasions', icon: Ban },
]

// ─── Helper: map a backend product to the UI shape ───────────────────────────
function mapProduct(p) {
  const specsObj = p.specifications || {}
  const specs = Object.entries(specsObj).map(([k, v]) => `${k}: ${v}`)
  
  const voltageEntry = Object.entries(specsObj).find(([k]) =>
    k.toLowerCase().includes('voltage') || k.toLowerCase().includes('vcc')
  )
  const voltageMin = voltageEntry ? parseFloat(voltageEntry[1]) || 0 : 0
  const voltageMax = voltageMin

  let interfaces = p.interfaces && p.interfaces.length > 0 ? p.interfaces : []
  if (interfaces.length === 0) {
    const interfaceEntry = Object.entries(specsObj).find(([k]) =>
      k.toLowerCase().includes('interface') || k.toLowerCase().includes('protocol')
    )
    interfaces = interfaceEntry
      ? [interfaceEntry[1]]
      : (p.category?.toLowerCase().includes('wireless') ? ['UART'] : ['I2C'])
  }

  const stockLabel = p.stock > 10 ? 'In Stock' : p.stock > 0 ? 'Low Stock' : 'Out of Stock'
  const statusLabel = p.stock > 10 ? 'IN_STOCK' : p.stock > 0 ? 'HOT_ITEM' : 'PREORDER'
  const tones = ['primary', 'lime', 'ink']
  const idStr = p._id ? p._id.toString() : (p.id || '')
  const tone = tones[Math.abs(idStr.charCodeAt(0) || 0) % 3]

  return {
    id: `prod-${p._id || p.id}`,
    _id: p._id || p.id,
    code: p.id || p._id?.toString().slice(-8).toUpperCase() || 'CPZ-ITEM',
    title: p.name || 'Component',
    status: statusLabel,
    category: p.category || 'Other',
    description: p.description || '',
    specs: specs.length ? specs : ['See product page'],
    interfaces,
    price: `₹${Number(p.price || 0).toFixed(2)}`,
    priceNum: Number(p.price || 0),
    note: p.minOrderQuantity > 1 ? `Min ${p.minOrderQuantity} Units` : 'Active Stock',
    tone,
    voltageMin,
    voltageMax,
    stock: stockLabel,
    image: p.images?.length ? p.images[0] : '',
  }
}

const ITEMS_PER_PAGE = 20

function SchematicPreview({ code }) {
  return (
    <div className="flex h-20 w-24 items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[2px_2px_0_var(--chipzo-ink)]">
      <div className="relative h-12 w-16 border-2 border-[color:var(--chipzo-ink)]">
        <div className="absolute left-[-10px] top-1/2 h-[2px] w-3 -translate-y-1/2 bg-[color:var(--chipzo-ink)]" />
        <div className="absolute right-[-10px] top-1/2 h-[2px] w-3 -translate-y-1/2 bg-[color:var(--chipzo-ink)]" />
        <div className="absolute left-1 top-1 h-2 w-2 bg-[color:var(--chipzo-primary)]" />
        <div className="absolute right-1 bottom-1 h-2 w-2 bg-[color:var(--chipzo-lime)]" />
        <div className="absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 bg-[color:var(--chipzo-ink)]" />
      </div>
      <span className="sr-only">{code} schematic preview</span>
    </div>
  )
}

function ProductVisual({ image, code, title, className = '' }) {
  if (image) {
    return (
      <img
        src={image}
        alt={title}
        className={`h-full w-full object-contain ${className}`.trim()}
      />
    )
  }

  return <SchematicPreview code={code} />
}

function statusTone(tone) {
  if (tone === 'primary') {
    return 'border-[color:var(--chipzo-primary)] text-[color:var(--chipzo-primary)]'
  }
  if (tone === 'lime') {
    return 'border-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)]'
  }
  return 'border-[color:var(--chipzo-ink)] text-[color:var(--chipzo-ink)]'
}

export default function Shop({ onNavigate, activeCategory, setActiveCategory, cartCount, onAddToCart }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [totalCount, setTotalCount]   = useState(0)
  const [prevActiveCategory, setPrevActiveCategory] = useState(activeCategory)
  const [activeProtocols, setActiveProtocols] = useState([])
  const [minVoltage, setMinVoltage]   = useState('0')
  const [maxVoltage, setMaxVoltage]   = useState('12')
  const [search, setSearch]           = useState(() => new URLSearchParams(location.search).get('search') || '')
  const [categoryOpen, setCategoryOpen] = useState(false)

  // Live products state
  const [products, setProducts]   = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError]   = useState('')
  const [retryKey, setRetryKey]   = useState(0)

  // Sync search state from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('search') || ''
    setSearch(q)
  }, [location.search])

  // Fetch products from backend
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      setApiError('')
      try {
        const params = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          ...(activeCategory ? { category: activeCategory } : {}),
          ...(search ? { search } : {}),
        }
        const data = await productsAPI.getAll(params)
        if (cancelled) return
        const raw  = data?.data || data?.products || []
        setProducts(raw.map(mapProduct))
        setTotalPages(data?.pagination?.totalPages || 1)
        setTotalCount(data?.pagination?.totalCount || raw.length)
      } catch (err) {
        if (!cancelled) {
          setApiError(err.message || 'Failed to load products.')
          setProducts([])
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [currentPage, activeCategory, retryKey, search])

  // Sync filter state when global activeCategory changes during render
  if (activeCategory !== prevActiveCategory) {
    setPrevActiveCategory(activeCategory)
    setMinVoltage('0')
    setMaxVoltage('12')
    setCurrentPage(1)
    if (activeCategory === 'Sensor') {
      setActiveProtocols(['I2C', 'SPI'])
    } else {
      setActiveProtocols([])
    }
  }

  // Client-side voltage/protocol filter on top of server-fetched results
  const filteredProducts = products.filter((product) => {
    if (activeProtocols.length > 0) {
      const matchesProtocol = activeProtocols.some((protocol) =>
        product.interfaces.includes(protocol)
      )
      if (!matchesProtocol) return false
    }
    if (minVoltage !== '') {
      const minV = parseFloat(minVoltage)
      if (!isNaN(minV) && product.voltageMax < minV) return false
    }
    if (maxVoltage !== '') {
      const maxV = parseFloat(maxVoltage)
      if (!isNaN(maxV) && product.voltageMin > maxV) return false
    }
    return true
  })

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)]">
        <Navbar onNavigate={onNavigate} currentPage="shop" activeCategory={activeCategory} cartCount={cartCount} />

        <main className="pt-28 sm:pt-32">
          <section className="border-y-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--chipzo-paper)] sm:text-xs group">
            <div className="marquee-container">
              <div className="marquee-content animate-marquee gap-6 group-hover:[animation-play-state:paused]">
                {[...Array(4)].map((_, i) => (
                  <span key={i} className="inline-flex items-center gap-6 whitespace-nowrap">
                    {announcements.map((item, j) => {
                      const Icon = item.icon
                      return (
                        <span key={j} className="inline-flex items-center gap-2">
                          <Icon size={14} strokeWidth={2.5} className="shrink-0 text-[color:var(--chipzo-primary)]" />
                          {item.text}
                          <span className="text-[color:var(--chipzo-lime)] ml-2">//</span>
                        </span>
                      )
                    })}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="section-frame py-4 sm:py-6 relative z-30">
            <div className="relative z-40 brutal-border brutal-shadow bg-[color:var(--chipzo-surface)]">
              {/* FILTER CONTROLS ROW — Category Dropdown | Voltage + Protocols */}
              <div className="flex flex-col border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] lg:flex-row">

                {/* Large Category Dropdown (left) */}
                <div className="relative flex-1 border-b-[3px] border-[color:var(--chipzo-ink)] lg:border-b-0 lg:border-r-[3px]">
                  <button
                    type="button"
                    onClick={() => setCategoryOpen(!categoryOpen)}
                    className="flex w-full items-center justify-between px-5 py-3 lg:py-3.5 border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[color:var(--chipzo-lime)] cursor-pointer"
                  >
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-[color:var(--chipzo-lime)]">
                      CATEGORY &gt;
                    </span>
                    <span className="flex items-center gap-2">
                      {activeCategory ? (
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-[color:var(--chipzo-paper)]">
                          {SHOP_CATEGORIES.find(c => c.value === activeCategory)?.label || activeCategory}
                        </span>
                      ) : (
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-[color:var(--chipzo-muted)]">
                          ALL
                        </span>
                      )}
                      <ChevronDown
                        size={16}
                        strokeWidth={3}
                        className={`shrink-0 text-[color:var(--chipzo-lime)] transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`}
                      />
                    </span>
                  </button>

                  {/* Dropdown Panel */}
                  <div
                    className={`absolute left-0 right-0 z-50 border-x-[3px] border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[6px_8px_0_0_rgba(0,0,0,1)] transition-all duration-200 origin-top ${
                      categoryOpen
                        ? 'visible scale-y-100 opacity-100'
                        : 'invisible scale-y-95 opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {SHOP_CATEGORIES.map((cat) => {
                        const isActive = activeCategory === cat.value
                        return (
                          <button
                            key={cat.label}
                            type="button"
                            onClick={() => {
                              setActiveCategory(cat.value)
                              setCurrentPage(1)
                              setCategoryOpen(false)
                            }}
                            className={[
                              'border-[2px] border-transparent px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.14em] transition-all cursor-pointer',
                              'hover:border-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)]',
                              isActive
                                ? 'border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-lime)] shadow-[2px_2px_0_0_rgba(0,0,0,1)]'
                                : 'text-[color:var(--chipzo-ink)] bg-transparent',
                            ].join(' ')}
                          >
                            {cat.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Voltage + Protocols (right) */}
                <div className="flex flex-wrap items-stretch divide-x-[3px] divide-[color:var(--chipzo-ink)]">
                  {/* Voltage Range Limits */}
                  <div className="flex flex-col justify-center px-3 py-2.5 lg:px-4">
                    <p className="mb-1 text-[8px] font-black uppercase tracking-[0.16em] text-[color:var(--chipzo-muted)]">Voltage Limits (V)</p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] h-[28px] focus-within:border-[color:var(--chipzo-primary)] transition-all">
                        <span className="flex h-full items-center justify-center bg-[color:var(--chipzo-ink)] px-2 text-[7px] font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-paper)] border-r-[2px] border-[color:var(--chipzo-ink)] select-none">
                          MIN
                        </span>
                        <input
                          type="number" min="0" max="24" step="0.1" placeholder="0.0"
                          value={minVoltage}
                          onChange={(e) => { setMinVoltage(e.target.value); setCurrentPage(1) }}
                          className="h-full w-14 bg-transparent text-center text-[10px] font-black uppercase text-[color:var(--chipzo-ink)] focus:outline-none focus:bg-[color:var(--chipzo-surface)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <span className="text-[10px] font-black text-[color:var(--chipzo-ink)]">⇄</span>
                      <div className="flex items-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] h-[28px] focus-within:border-[color:var(--chipzo-primary)] transition-all">
                        <span className="flex h-full items-center justify-center bg-[color:var(--chipzo-ink)] px-2 text-[7px] font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-paper)] border-r-[2px] border-[color:var(--chipzo-ink)] select-none">
                          MAX
                        </span>
                        <input
                          type="number" min="0" max="24" step="0.1" placeholder="12.0"
                          value={maxVoltage}
                          onChange={(e) => { setMaxVoltage(e.target.value); setCurrentPage(1) }}
                          className="h-full w-14 bg-transparent text-center text-[10px] font-black uppercase text-[color:var(--chipzo-ink)] focus:outline-none focus:bg-[color:var(--chipzo-surface)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interface Protocols */}
                  <div className="flex flex-col justify-center px-3 py-2.5 lg:px-4 lg:pr-6">
                    <p className="mb-1 text-[8px] font-black uppercase tracking-[0.16em] text-[color:var(--chipzo-muted)]">Interface Protocols</p>
                    <div className="flex gap-1">
                      {['I2C', 'SPI', 'UART', 'CAN'].map((protocol) => {
                        const isActive = activeProtocols.includes(protocol)
                        return (
                          <button
                            key={protocol}
                            type="button"
                            onClick={() => {
                              setCurrentPage(1)
                              if (isActive) {
                                setActiveProtocols(activeProtocols.filter((p) => p !== protocol))
                              } else {
                                setActiveProtocols([...activeProtocols, protocol])
                              }
                            }}
                            className={[
                              'border-[2px] px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] transition-all shadow-[1px_1px_0_var(--chipzo-ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer',
                              isActive
                                ? 'border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)]'
                                : 'border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-lime)]',
                            ].join(' ')}
                          >
                            {protocol}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* Click-outside to close category dropdown */}
              {categoryOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCategoryOpen(false)}
                />
              )}

              {/* FILTER CHAIN STATE STRIP */}
              <div className="flex flex-col border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] px-5 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[color:var(--chipzo-muted)]">
                    FILTER_CHAIN:
                  </span>
                  
                  {(!search && !activeCategory && activeProtocols.length === 0 && minVoltage === '0' && maxVoltage === '12') ? (
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-lime)] border border-dashed border-[color:var(--chipzo-lime)] px-2 py-0.5">
                      PASS_THRU (NO ACTIVE FILTERS)
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {search && (
                        <button
                          onClick={() => {
                            setSearch('')
                            const p = new URLSearchParams(location.search)
                            p.delete('search')
                            navigate(`${location.pathname}?${p.toString()}${p.toString() ? '' : ''}`, { replace: true })
                          }}
                          className="flex items-center gap-1 border border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.05em] hover:bg-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-paper)]"
                        >
                          SEARCH: {search} <span className="text-[9px]">✖</span>
                        </button>
                      )}
                      {activeCategory && (
                        <button
                          onClick={() => setActiveCategory('')}
                          className="flex items-center gap-1 border border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.05em] hover:bg-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-paper)]"
                        >
                          CAT: {activeCategory} <span className="text-[9px]">✖</span>
                        </button>
                      )}
                      {(minVoltage !== '0' || maxVoltage !== '12') && (
                        <button
                          onClick={() => {
                            setMinVoltage('0')
                            setMaxVoltage('12')
                          }}
                          className="flex items-center gap-1 border border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.05em] hover:bg-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-paper)]"
                        >
                          VOLTS: {minVoltage}V - {maxVoltage}V <span className="text-[9px]">✖</span>
                        </button>
                      )}
                      {activeProtocols.map(proto => (
                        <button
                          key={proto}
                          onClick={() => setActiveProtocols(activeProtocols.filter(p => p !== proto))}
                          className="flex items-center gap-1 border border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.05em] hover:bg-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-paper)]"
                        >
                          PROTO: {proto} <span className="text-[9px]">✖</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(!search && !activeCategory && activeProtocols.length === 0 && minVoltage === '0' && maxVoltage === '12') ? null : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('')
                      setActiveProtocols([])
                      setMinVoltage('0')
                      setMaxVoltage('12')
                      setSearch('')
                      setCurrentPage(1)
                      const p = new URLSearchParams(location.search)
                      p.delete('search')
                      navigate(`${location.pathname}?${p.toString()}${p.toString() ? '' : ''}`, { replace: true })
                    }}
                    className="mt-2 inline-flex items-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] lg:mt-0 cursor-pointer shadow-[1px_1px_0_var(--chipzo-ink)]"
                  >
                    RESET_ALL_DEFAULTS
                  </button>
                )}
              </div>

            </div>
          </section>

          <section className="section-frame pb-10 sm:pb-14 relative z-10">

            {/* ===== API ERROR STATE ===== */}
            {apiError && (
              <div className="mb-6 flex flex-col items-center justify-center brutal-border brutal-shadow bg-[color:var(--chipzo-paper)] py-12 px-5 text-center">
                <AlertOctagon size={40} className="text-[color:var(--chipzo-danger)] mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-danger)]">Connection Error</p>
                <h3 className="mt-2 text-xl font-black uppercase text-[color:var(--chipzo-ink)]">Could Not Load Products</h3>
                <p className="mt-2 text-xs font-medium text-[color:var(--chipzo-muted)] max-w-sm">{apiError}</p>
                <button
                  type="button"
                  onClick={() => setRetryKey(k => k + 1)}
                  className="mt-5 flex items-center gap-2 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] shadow-[2px_2px_0_var(--chipzo-ink)]"
                >
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            )}

            {/* ===== LOADING SKELETON ===== */}
            {isLoading && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="brutal-border bg-[color:var(--chipzo-surface)] h-48 animate-pulse" />
                ))}
              </div>
            )}

            {/* ===== MOBILE CARD VIEW (< lg) ===== */}
            {!isLoading && !apiError && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
              {filteredProducts.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center brutal-border brutal-shadow bg-[color:var(--chipzo-paper)] py-14 px-5 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-primary)]">Zero Results</p>
                  <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-[color:var(--chipzo-ink)]">No Components Match</h3>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-[color:var(--chipzo-muted)]">Adjust filters or choose a different category.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('')
                      setActiveProtocols([])
                      setMinVoltage('0')
                      setMaxVoltage('12')
                      setSearch('')
                      setCurrentPage(1)
                      const p = new URLSearchParams(location.search)
                      p.delete('search')
                      navigate(`${location.pathname}?${p.toString()}${p.toString() ? '' : ''}`, { replace: true })
                    }}
                    className="mt-5 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] shadow-[2px_2px_0_var(--chipzo-ink)]"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="brutal-border brutal-shadow bg-[color:var(--chipzo-paper)] overflow-hidden flex flex-col justify-between"
                  >
                    {/* Visual schematic preview with absolute status badge at top */}
                    <div className="bg-[color:var(--chipzo-surface)] border-b-[2px] border-[color:var(--chipzo-ink)] flex items-center justify-center p-3 relative h-24 sm:h-28 shrink-0">
                      <div className="flex h-full w-full items-center justify-center scale-75 sm:scale-90">
                        <ProductVisual image={product.image} code={product.code} title={product.title} />
                      </div>
                      <span className={`absolute top-2 left-2 inline-flex border-[1.5px] border-[color:var(--chipzo-ink)] px-1 py-0.5 text-[7px] font-extrabold uppercase tracking-[0.05em] leading-none ${statusTone(product.tone)}`}>
                        {product.status}
                      </span>
                    </div>

                    {/* Card Content & Footer Stack */}
                    <div className="p-2 sm:p-3 flex flex-col justify-between flex-grow min-w-0">
                      {/* Product Header */}
                      <div className="min-w-0">
                        <h2 className="text-[10px] sm:text-xs font-black leading-tight tracking-[-0.02em] text-[color:var(--chipzo-ink)] line-clamp-2 uppercase">
                          {product.title}
                        </h2>
                      </div>

                      {/* Product Price & Add Button Row */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[color:var(--chipzo-rule)] gap-1 sm:gap-2">
                        <div className="min-w-0">
                          <p className="tabular-prices text-xs sm:text-sm font-black tracking-[-0.03em] text-[color:var(--chipzo-primary)] leading-none">
                            {product.price}
                          </p>
                          <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.05em] text-[color:var(--chipzo-muted)] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                            {product.note}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart?.({
                              id: product.id,
                              _backendProductId: product._id,
                              code: product.code,
                              title: product.title,
                              category: product.category,
                              specs: product.specs,
                              price: product.priceNum,
                              image: product.image || 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=400&q=80',
                              status: 'Operational'
                            });
                          }}
                          className="flex items-center gap-1 border-[1.5px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] px-1.5 sm:px-2 py-1 text-[9px] sm:text-xs font-black uppercase tracking-[0.05em] text-[color:var(--chipzo-paper)] shadow-[1px_1px_0_var(--chipzo-ink)] transition-all hover:bg-[color:var(--chipzo-primary)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none focus:outline-none shrink-0"
                        >
                          <ShoppingCart size={9} strokeWidth={2.6} />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            )}

            {/* ===== DESKTOP TABLE VIEW (lg+) ===== */}
            {!isLoading && !apiError && (
            <div className="hidden lg:block overflow-x-auto brutal-border brutal-shadow bg-[color:var(--chipzo-surface)]">
              <div className="min-w-[1120px]">
                <div className="grid grid-cols-[120px_2fr_1.2fr_0.9fr_0.8fr_140px] border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] text-xs font-black uppercase tracking-[0.16em] text-[color:var(--chipzo-paper)]">
                  <div className="border-r-[2px] border-[color:var(--chipzo-paper)]/20 px-3 py-3">Schematic</div>
                  <div className="border-r-[2px] border-[color:var(--chipzo-paper)]/20 px-4 py-3">Part Number / Description</div>
                  <div className="border-r-[2px] border-[color:var(--chipzo-paper)]/20 px-4 py-3">Specs (V/A/O)</div>
                  <div className="border-r-[2px] border-[color:var(--chipzo-paper)]/20 px-4 py-3">Interface</div>
                  <div className="border-r-[2px] border-[color:var(--chipzo-paper)]/20 px-4 py-3">Price (Unit)</div>
                  <div className="px-3 py-3">Action</div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center bg-[color:var(--chipzo-paper)] py-16 px-4 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-primary)]">Zero Results</p>
                    <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-[color:var(--chipzo-ink)]">No Components Match Your Schema</h3>
                    <p className="mt-2 max-w-[45ch] text-xs font-medium leading-relaxed text-[color:var(--chipzo-muted)]">
                      Adjust your category, protocol, or voltage filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory('')
                        setActiveProtocols([])
                        setMinVoltage('0')
                        setMaxVoltage('12')
                        setSearch('')
                        setCurrentPage(1)
                        const p = new URLSearchParams(location.search)
                        p.delete('search')
                        navigate(`${location.pathname}?${p.toString()}${p.toString() ? '' : ''}`, { replace: true })
                      }}
                      className="mt-6 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] shadow-[2px_2px_0_var(--chipzo-ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--chipzo-ink)] active:translate-y-0"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className={[
                        'grid grid-cols-[120px_2fr_1.2fr_0.9fr_0.8fr_140px] items-stretch bg-[color:var(--chipzo-paper)] transition-colors hover:bg-[color:var(--chipzo-surface)]',
                        index < filteredProducts.length - 1 ? 'border-b-[2px] border-[color:var(--chipzo-rule)]' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-center border-r-[2px] border-[color:var(--chipzo-rule)] p-3">
                        <ProductVisual image={product.image} code={product.code} title={product.title} className="max-h-20" />
                      </div>

                      <div className="border-r-[2px] border-[color:var(--chipzo-rule)] px-4 py-4">
                        <h2 className="text-base font-black leading-[0.95] tracking-[-0.02em] uppercase">{product.title}</h2>
                        <span className={`mt-2 inline-flex border-[2px] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${statusTone(product.tone)}`}>
                          {product.status}
                        </span>
                        <p className="mt-2 max-w-[38ch] text-xs font-medium leading-relaxed text-[color:var(--chipzo-muted)]">
                          {product.description}
                        </p>
                      </div>

                      <div className="border-r-[2px] border-[color:var(--chipzo-rule)] px-4 py-4 text-xs font-bold uppercase tracking-[0.08em]">
                        <div className="grid gap-1.5">
                          {product.specs.map((spec) => (
                            <div key={spec} className="text-[color:var(--chipzo-ink)]">
                              {spec}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-r-[2px] border-[color:var(--chipzo-rule)] px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {product.interfaces.map((item) => (
                            <span key={item} className="border border-[color:var(--chipzo-rule)] bg-[color:var(--chipzo-paper)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[color:var(--chipzo-muted)]">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-r-[2px] border-[color:var(--chipzo-rule)] px-4 py-4">
                        <p className="tabular-prices text-xl font-black tracking-[-0.03em] text-[color:var(--chipzo-primary)]">{product.price}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--chipzo-muted)]">{product.note}</p>
                      </div>

                      <div className="flex items-center justify-center px-3 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart?.({
                              id: product.id,
                              _backendProductId: product._id,
                              code: product.code,
                              title: product.title,
                              category: product.category,
                              specs: product.specs,
                              price: product.priceNum,
                              image: product.image || 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=400&q=80',
                              status: 'Operational'
                            });
                          }}
                          className="flex min-h-10 cursor-pointer items-center gap-2 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] shadow-[2px_2px_0_var(--chipzo-ink)] transition-all hover:-translate-y-0.5 hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] hover:shadow-[3px_3px_0_var(--chipzo-ink)] active:translate-y-0 active:shadow-[1px_1px_0_var(--chipzo-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--chipzo-primary)] focus:ring-offset-1"
                        >
                          <ShoppingCart size={14} strokeWidth={2.4} />
                          Add
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            <div className="mt-6 grid gap-4 brutal-border brutal-shadow bg-[color:var(--chipzo-surface)] px-4 py-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--chipzo-muted)]">
                {isLoading ? 'Loading...' : `${totalCount} RESULTS`}
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition-colors hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="inline-flex items-center gap-1"><ChevronLeft size={14} /> Prev</span>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={[
                      'h-10 min-w-10 border-[3px] px-3 text-xs font-black transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--chipzo-primary)] focus:ring-offset-1',
                      currentPage === page
                        ? 'border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)]'
                        : 'border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-surface)]',
                    ].join(' ')}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 5 && <span className="px-1 text-xs font-black uppercase tracking-[0.16em] text-[color:var(--chipzo-muted)]">...</span>}
                {totalPages > 5 && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className="h-10 min-w-10 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 text-xs font-black hover:bg-[color:var(--chipzo-surface)] focus:outline-none"
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition-colors hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="inline-flex items-center gap-1">Next <ChevronRight size={14} /></span>
                </button>
              </div>

              <div className="text-left text-xs font-black uppercase tracking-[0.18em] text-[color:var(--chipzo-muted)] lg:text-right">
                Page {String(currentPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)]">
          <div className="section-frame grid gap-8 py-10 lg:grid-cols-[1.5fr_0.8fr_0.8fr]">
            <div>
              <div className="mb-4 inline-flex border-[3px] border-[color:var(--chipzo-paper)] bg-[color:var(--chipzo-paper)] px-3 py-1 text-2xl font-black tracking-[-0.08em] text-[color:var(--chipzo-ink)]">
                CHIPZO_IND
              </div>
              <p className="max-w-xl text-sm font-semibold leading-relaxed text-[color:var(--chipzo-paper)] opacity-80">
                Engineered for makers, hackers, and industrial innovators. We provide the hardware you need to build the future.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-[color:var(--chipzo-lime)]">Resources</h3>
              <div className="grid gap-3 text-sm font-black uppercase tracking-[0.08em]">
                <a href="#" className="transition-colors hover:text-[color:var(--chipzo-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--chipzo-primary)] focus:ring-offset-1">Datasheets</a>
                <a href="#" className="transition-colors hover:text-[color:var(--chipzo-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--chipzo-primary)] focus:ring-offset-1">API Documentation</a>
                <a href="#" className="transition-colors hover:text-[color:var(--chipzo-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--chipzo-primary)] focus:ring-offset-1">Compliance</a>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-[color:var(--chipzo-lime)]">Legal</h3>
              <div className="grid gap-3 text-sm font-black uppercase tracking-[0.08em]">
                <a href="#" className="transition-colors hover:text-[color:var(--chipzo-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--chipzo-primary)] focus:ring-offset-1">Terms</a>
                <a href="#" className="transition-colors hover:text-[color:var(--chipzo-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--chipzo-primary)] focus:ring-offset-1">Privacy</a>
                <a href="#" className="transition-colors hover:text-[color:var(--chipzo-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--chipzo-primary)] focus:ring-offset-1">Contact</a>
              </div>
            </div>
          </div>
          <div className="border-t-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] py-3">
            <div className="section-frame flex flex-col gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--chipzo-paper)] sm:flex-row sm:items-center sm:justify-between">
              <span>© 2024 Chipzo Industrial Marketplace. Engineered for Makers.</span>
              <span>V_09_RELEASE // BUILD_882</span>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  )
}
