import { useState, useEffect, useCallback } from 'react'
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, Check, Ban, Clock, CheckCircle, AlertTriangle, Lock, Unlock, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from 'boneyard-js/react'
import SmoothScroll from '../components/SmoothScroll.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { LoadingButton } from '../components/LoadingButton.jsx'
import { useAsyncStatus } from '../hooks/useAsyncAction.js'
import { getOrderStatus } from '../utils/orderValidation.js'
import { productsAPI } from '../services/api.js'
import { getProductImageUrl } from '../utils/imageUtils.js'

/* ================= FUTURISTIC DELIVERY AND VALIDATION COMPONENTS ================= */

const calculateDeliveryFee = (cartTotal) => {
  if (cartTotal >= 1000) return 50;
  if (cartTotal >= 250) return 100;
  return 0;
};

const DYNAMIC_UPSELLS = [
  {
    id: 'upsell-breadboard',
    code: 'CPZ-BB400',
    title: 'Premium 400-Point Breadboard',
    category: 'PROTOTYPING',
    specs: ['POINTS: 400 TIE', 'RAILS: 2 POWER'],
    price: 120.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjhCICAPv5kAJz30kS1Ozm7_yMOygg52OHMi_4WY0QkDnOmYgpsIwOvteThjjNwiSskIcB3JL5_x_L5lk_LUC9ti8c6zznwFZybj0KJoeQBSgJnEhlsSA3py8z6Y8VDnsgy3npQQ2s9p1tjXMXkx9KNueckQ6C3Ope60wFqhZP5J1fy_JCbGDKiLtofw_u4jeg4XBaghVJzHbVBHrGabMnNCgLyHQzZOX7zgTMQ49EbTCtQmQyHVq4EzATxr4xlcZ3YKVEMpMsDZA',
    status: 'Operational'
  },
  {
    id: 'upsell-sensorkit',
    code: 'CPZ-SNS-3IN1',
    title: 'Analog Sensor Kit 3-in-1',
    category: 'SENSORS',
    specs: ['TEMP, LIGHT, SOUND'],
    price: 180.00,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60',
    status: 'Operational'
  },
  {
    id: 'upsell-jumpers',
    code: 'CPZ-JMP60',
    title: 'Flex Jumper Wires (60pcs)',
    category: 'ACCESSORY',
    specs: ['COUNT: 60 PCS', 'TYPE: M-M'],
    price: 60.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjqfa-ivk8AHmH0Q7CTsvNLUlAQgSyI8m1BtuHMCeW-P1UsP3DaF3UycPeSNmUaraCkMVwtu5B69ATeL3_lHH1nz2fPFL9FzvB95aRTz8XIDypilhL-O__lKI5hofhl5H7Nu2vVcus0LinrP_r2LgrjqgCuTh4plV5Mv6W00KhHsDKyBj0Q2OVpD3uUTSTwv_zh-WTibJv4iVENYZO6BxWg4ORD-vGDWJPyg_H-HoF32u81B8UPfqyGukgjNJWtTpUlIh5dgs9Xqs',
    status: 'Operational'
  }
]

function MinimumOrderWarning({ total, remaining }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="border-2 border-[color:var(--chipzo-ink)] bg-amber-50 shadow-[3px_3px_0px_0px_rgba(245,158,11,1)] p-4 flex flex-col gap-2 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/25 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="flex items-center gap-2 text-amber-800 z-10">
        <AlertTriangle size={16} strokeWidth={2.5} className="animate-pulse shrink-0" />
        <span className="font-mono text-xs font-black tracking-widest uppercase">⚠ CHECKOUT PROTOCOL LOCKED</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-1 border-t border-dashed border-amber-300 pt-2 font-mono text-[10px] text-amber-900 z-10 uppercase font-black">
        <div>
          <span className="text-[9px] text-amber-600 block">MINIMUM VALUE</span>
          <span>₹250.00</span>
        </div>
        <div>
          <span className="text-[9px] text-amber-600 block">CURRENT TOTAL</span>
          <span className="text-amber-800">₹{total.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="mt-2 text-xs font-mono font-black text-amber-950 uppercase tracking-tight z-10 bg-amber-200/50 p-2 border border-amber-300">
        ADD <span className="text-amber-600">₹{remaining.toFixed(2)}</span> MORE TO PROCEED
      </div>
    </motion.div>
  )
}

function CheckoutProgressBar({ progress, total }) {
  return (
    <div className="flex flex-col gap-1.5 font-mono">
      <div className="flex justify-between text-[10px] font-black uppercase text-[color:var(--chipzo-ink)]">
        <span>STATION LOAD: {Math.round(progress)}%</span>
        <span>₹{total.toFixed(2)} / ₹250.00 REQUIRED</span>
      </div>
      <div className="h-4 w-full bg-[color:var(--chipzo-surface)] border-2 border-[color:var(--chipzo-ink)] p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <motion.div 
          className="h-full bg-[color:var(--chipzo-lime)] border-r-2 border-[color:var(--chipzo-ink)] relative shadow-[0_0_10px_rgba(132,204,22,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-1/2 h-full animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
        </motion.div>
      </div>
    </div>
  )
}

function DeliveryFeePanel({ subtotal, deliveryFee, isEligible }) {
  return (
    <div className="flex justify-between font-black text-xs uppercase tracking-wider items-center">
      <span>DELIVERY FEE</span>
      {isEligible ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border-2 border-emerald-500 px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(16,185,129,1)] font-mono text-[9px] relative overflow-hidden"
          style={{ boxShadow: '0 0 10px rgba(16,185,129,0.3), 2px 2px 0px 0px rgba(16,185,129,1)' }}
        >
          <span className="animate-pulse">●</span>
          <span className="line-through text-emerald-600/70 mr-1">₹100.00</span>
          <span>₹{deliveryFee.toFixed(2)}</span>
        </motion.div>
      ) : (
        <span className="tabular-prices font-mono text-xs">
          ₹{deliveryFee.toFixed(2)}
        </span>
      )}
    </div>
  )
}

function DeliveryProgressBar({ progress, total }) {
  return (
    <div className="flex flex-col gap-1.5 font-mono">
      <div className="flex justify-between text-[9px] font-black uppercase text-[color:var(--chipzo-muted)]">
        <span>DELIVERY OPTIMIZER: {Math.round(progress)}%</span>
        <span>₹{total.toFixed(2)} / ₹1000.00 TARGET</span>
      </div>
      <div className="h-3 w-full bg-[color:var(--chipzo-surface)] border-2 border-[color:var(--chipzo-ink)] p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <motion.div 
          className="h-full bg-cyan-400 border-r-2 border-[color:var(--chipzo-ink)] relative shadow-[0_0_8px_rgba(34,211,238,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-1/2 h-full animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
        </motion.div>
      </div>
    </div>
  )
}

function DeliveryRewardMessage({ remaining, onAddToCart, cartItems }) {
  const [statuses, setStatuses] = useState({})
  const recommended = DYNAMIC_UPSELLS.filter(item => {
    return !cartItems.some(cartItem => cartItem.id === item.id);
  });

  const handleAdd = async (item) => {
    if (statuses[item.id]) return
    setStatuses(prev => ({ ...prev, [item.id]: 'loading' }))
    try {
      // Simulate premium pre-load latency (800ms to 1s, e.g., 900ms)
      await new Promise(resolve => setTimeout(resolve, 900))

      // When loading state is done, we actually add the product to the cart
      await onAddToCart?.(item)

      setStatuses(prev => ({ ...prev, [item.id]: 'success' }))
      setTimeout(() => {
        setStatuses(prev => { const n = { ...prev }; delete n[item.id]; return n })
      }, 800)
    } catch (err) {
      setStatuses(prev => ({ ...prev, [item.id]: 'error' }))
      setTimeout(() => {
        setStatuses(prev => { const n = { ...prev }; delete n[item.id]; return n })
      }, 1000)
    }
  }

  return (
    <div className="flex flex-col gap-3 mt-1 border-t-2 border-dashed border-[color:var(--chipzo-rule)] pt-3 font-mono">
      <div className="border-2 border-[color:var(--chipzo-ink)] bg-cyan-50/50 shadow-[3px_3px_0px_0px_rgba(34,211,238,1)] p-3 text-[10px] text-cyan-950 font-black uppercase flex flex-col gap-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-200/25 via-transparent to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-1.5 text-cyan-800 z-10 font-bold">
          <Clock size={11} strokeWidth={3} className="animate-spin duration-1000 shrink-0" />
          <span>DELIVERY OPTIMIZATION PROTOCOL</span>
        </div>
        <p className="mt-1 leading-snug z-10">
          ADD <span className="text-cyan-600 font-bold">₹{remaining.toFixed(2)}</span> MORE TO UNLOCK ₹50 DELIVERY
        </p>
      </div>

      {recommended.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[8px] font-black uppercase tracking-wider text-[color:var(--chipzo-muted)] flex items-center gap-1">
            <span>RECOMMENDED TO REDUCE DELIVERY:</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {recommended.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-1.5 bg-white border border-[color:var(--chipzo-ink)] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-8 h-8 border border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] overflow-hidden p-0.5 flex items-center justify-center shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                  </div>
                  <div className="font-mono text-left truncate">
                    <h4 className="text-[9px] font-black uppercase text-[color:var(--chipzo-ink)] leading-none truncate max-w-[110px]">{item.title}</h4>
                    <p className="text-[8px] text-[color:var(--chipzo-primary)] font-black mt-0.5">₹{item.price.toFixed(2)}</p>
                  </div>
                </div>
                <LoadingButton
                  type="button"
                  onClick={() => handleAdd(item)}
                  status={statuses[item.id] || 'idle'}
                  variant="lime"
                  size="sm"
                  className="shrink-0"
                >
                  + ADD
                </LoadingButton>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReducedDeliverySuccess() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border-2 border-emerald-600 bg-emerald-50 text-emerald-800 p-3 font-mono text-[10px] font-black uppercase flex flex-col gap-1 shadow-[3px_3px_0px_0px_rgba(16,185,129,1)] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-200/25 via-transparent to-transparent pointer-events-none"></div>
      <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
        <CheckCircle size={13} strokeWidth={3} className="animate-bounce shrink-0" />
        <span>✓ REDUCED DELIVERY UNLOCKED</span>
      </div>
      <div className="mt-1.5 text-[9px] text-emerald-600/80 border-t border-dashed border-emerald-200 pt-1.5 flex justify-between">
        <span>DELIVERY CHARGE:</span>
        <span className="text-emerald-900 font-black">₹50.00</span>
      </div>
    </motion.div>
  )
}

function SkeletonCardGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white brutal-border p-4 flex flex-col justify-between">
          <div className="flex gap-4 items-center mb-3">
            <div className="w-16 h-16 shrink-0 brutal-border bg-[color:var(--chipzo-surface)] overflow-hidden animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-2 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function Cart({ onNavigate, activeCategory, cart = [], isCartLoading, onUpdateQuantity, onRemoveFromCart, onAddToCart }) {
  const items = cart.filter(item => item && item.price > 0 && item.id)
  const cartCount = items.reduce((total, item) => total + item.quantity, 0)
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0)
  const [orderStatus, setOrderStatus] = useState(getOrderStatus())
  const [complementaryItems, setComplementaryItems] = useState([])
  const [complementaryLoading, setComplementaryLoading] = useState(true)
  const [buildStatuses, setBuildStatuses] = useState({})
  const { status: checkoutStatus, execute: executeCheckout } = useAsyncStatus({ minDuration: 2000, successDuration: 800 })

  const handleCheckout = useCallback(() => {
    executeCheckout(async () => {
      onNavigate?.('checkout')
    })
  }, [executeCheckout, onNavigate])

  const handleAddBuild = useCallback(async (compItem) => {
    if (buildStatuses[compItem.id]) return
    setBuildStatuses(prev => ({ ...prev, [compItem.id]: 'loading' }))
    try {
      // Simulate premium pre-load latency (800ms to 1s, e.g., 900ms)
      await new Promise(resolve => setTimeout(resolve, 900))

      // When loading state is done, we actually add the product to the cart
      await onAddToCart?.(compItem)

      setBuildStatuses(prev => ({ ...prev, [compItem.id]: 'success' }))
      setTimeout(() => {
        setBuildStatuses(prev => { const n = { ...prev }; delete n[compItem.id]; return n })
      }, 800)
    } catch (err) {
      setBuildStatuses(prev => ({ ...prev, [compItem.id]: 'error' }))
      setTimeout(() => {
        setBuildStatuses(prev => { const n = { ...prev }; delete n[compItem.id]; return n })
      }, 1000)
    }
  }, [onAddToCart, buildStatuses])

  const displayRecommendations = complementaryItems.filter(
    comp => !items.some(cartItem => {
      const cartProdId = cartItem._backendProductId || cartItem.id?.replace(/^prod-/, '') || cartItem.id
      return cartProdId === comp.id
    })
  )

  const MIN_CART_VALUE = 250;
  const canCheckout = subtotal >= MIN_CART_VALUE;
  const remainingAmount = Math.max(MIN_CART_VALUE - subtotal, 0);
  const progress = Math.min((subtotal / MIN_CART_VALUE) * 100, 100);

  const deliveryFee = calculateDeliveryFee(subtotal);
  const isEligibleForReducedDelivery = subtotal >= 1000;
  const amountNeededForReducedDelivery = Math.max(1000 - subtotal, 0);
  const deliveryProgress = Math.min((subtotal / 1000) * 100, 100);
  const orderTotal = subtotal + deliveryFee;

  useEffect(() => {
    const interval = setInterval(() => setOrderStatus(getOrderStatus()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false
    setComplementaryLoading(true)
    productsAPI.getAll({ limit: 50 })
      .then(res => {
        if (cancelled) return
        const products = Array.isArray(res?.data) ? res.data : []
        const accessoryCategories = ['Wire', 'Battery', 'Battery Holder', 'Tool', 'Passive', 'Switch', 'Kit']
        const filtered = products
          .filter(p => p && accessoryCategories.includes(p.category))
          .slice(0, 8)
          .map(p => ({
            id: p._id,
            code: p.code || '',
            title: p.name,
            category: p.category,
            specs: Array.isArray(p.specifications) ? p.specifications : [],
            price: p.price ?? 0,
            image: Array.isArray(p.images) && p.images.length > 0 ? getProductImageUrl(p.images[0]) : '',
            status: 'Operational'
          }))
        setComplementaryItems(filtered)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setComplementaryLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)]">
        <Navbar onNavigate={onNavigate} currentPage="cart" activeCategory={activeCategory} cartCount={cartCount} />
        
        <main className="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-32 lg:pb-24 flex flex-col gap-10">
          
          {isCartLoading && items.length === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full items-start mt-6">
              <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
                <div className="h-12 w-64 bg-gray-200 rounded animate-pulse mb-4" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white brutal-border brutal-shadow p-3.5 flex gap-4">
                    <div className="w-20 h-20 shrink-0 brutal-border bg-[color:var(--chipzo-surface)] overflow-hidden animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                      <div className="h-2 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 w-28 bg-gray-200 rounded animate-pulse mt-2" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-4 xl:col-span-3 self-stretch hidden lg:block">
                <div className="sticky top-32 bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow p-5 space-y-4">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse mt-4" />
                </div>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* ================= EMPTY STATE ================= */
            <div className="flex flex-col items-center justify-center py-20 px-6 brutal-border bg-[color:var(--chipzo-surface)] brutal-shadow text-center max-w-4xl mx-auto w-full my-12">
              <div className="w-20 h-20 brutal-border bg-[color:var(--chipzo-lime)] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
                <ShoppingBag size={40} strokeWidth={2.5} />
              </div>
              <h1 className="text-4xl sm:text-5xl font-black uppercase text-[color:var(--chipzo-ink)] leading-none tracking-tight">
                NO HARDWARE DETECTED
              </h1>
              <p className="font-mono text-xs sm:text-sm tracking-wider text-[color:var(--chipzo-muted)] mt-4 uppercase max-w-lg border-2 border-dashed border-[color:var(--chipzo-rule)] p-4 bg-[color:var(--chipzo-paper)]">
                [SYSTEM LOG ERROR // CODE 404]: INTERNAL ACQUISITION DRIVE IS EMPTY. PLEASE LOAD HARDWARE MODULES TO INTIALIZE THE DEVELOPMENT CART STACK.
              </p>
              
              <button
                type="button"
                onClick={() => onNavigate?.('shop')}
                className="mt-8 bg-[color:var(--chipzo-primary)] text-[color:var(--chipzo-paper)] font-black text-sm py-4 px-8 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 group cursor-pointer uppercase tracking-widest"
              >
                <span>INITIALIZE MODULE ACQUISITION</span>
                <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            /* ================= LIVE CART CONTENT ================= */
            <div className="flex flex-col gap-8">
              {/* Header Section */}
              <div className="mb-2">
                <h1 className="font-black text-4xl sm:text-6xl md:text-7xl uppercase text-[color:var(--chipzo-ink)] leading-none tracking-tighter">Your Build Cart</h1>
                <p className="text-xs sm:text-sm font-black text-[color:var(--chipzo-ink)] mt-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-[color:var(--chipzo-primary)] border-2 border-[color:var(--chipzo-ink)] block"></span> 
                  {cartCount} HARDWARE {cartCount === 1 ? 'MODULE' : 'MODULES'} DETECTED // PROTOCOL ACTIVE
                </p>
              </div>

              {/* Two Column Layout Stack */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full items-start">
                
                {/* Left Column: Cart Items */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-10">
                  {/* Cart Items List */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white brutal-border brutal-shadow p-3.5 flex flex-col justify-between hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group relative"
                      >
                        <div>
                          {/* Remove Item Button */}
                          <button 
                            type="button"
                            aria-label="Remove item" 
                            onClick={() => onRemoveFromCart?.(item.id)}
                            className="absolute top-2 right-2 z-10 w-7 h-7 brutal-border flex items-center justify-center bg-white text-[color:var(--chipzo-ink)] hover:bg-red-500 hover:text-white transition-colors duration-150 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                          >
                            <Trash2 size={12} strokeWidth={2.5} />
                          </button>

                          {/* Image Frame */}
                          <div className="h-32 w-full brutal-border bg-[color:var(--chipzo-surface)] mb-3 overflow-hidden flex items-center justify-center p-2 relative">
                            <img 
                              alt={item.title} 
                              className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300" 
                              src={item.image || ''}
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          </div>

                          {/* Category Tag */}
                          <span className="inline-block px-1.5 py-0.5 bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)] text-[8px] font-black tracking-wider mb-1.5 uppercase">
                            {item.category || 'UNIT_MODULE'}
                          </span>

                          {/* Title */}
                          <h3 className="text-xs sm:text-sm font-black uppercase text-[color:var(--chipzo-ink)] tracking-tight leading-tight line-clamp-2 min-h-[2rem]">
                            {item.title}
                          </h3>
                          
                          {/* Specs */}
                          <div className="flex flex-wrap gap-x-1 gap-y-0.5 mt-2 font-mono text-[8px] tracking-wider text-[color:var(--chipzo-muted)]">
                            {item.specs?.map((spec, sIdx) => (
                              <span key={sIdx} className="bg-[color:var(--chipzo-surface)] brutal-border px-1 py-0.5 text-[color:var(--chipzo-ink)] font-bold">
                                {spec}
                              </span>
                            ))}
                          </div>

                          {/* Status Indicator */}
                          <div className="mt-2 text-[9px] font-black text-[color:var(--chipzo-primary)] flex items-center gap-1 uppercase tracking-wide">
                            <span className="inline-block w-2 h-2 bg-[color:var(--chipzo-lime)] border-[1.5px] border-[color:var(--chipzo-ink)]"></span>
                            STATUS: Operational
                          </div>
                        </div>

                        {/* Footer Controls: quantity & price */}
                        <div className="mt-4 pt-3 border-t border-dashed border-[color:var(--chipzo-rule)] flex justify-between items-center">
                          {/* Quantity buttons */}
                          <div className="flex brutal-border h-8 bg-white overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <button 
                              type="button"
                              onClick={() => onUpdateQuantity?.(item.id, -1)}
                              className="w-8 h-full flex items-center justify-center hover:bg-[color:var(--chipzo-surface)] border-r-2 border-[color:var(--chipzo-ink)] active:bg-[color:var(--chipzo-paper)] cursor-pointer"
                            >
                              <Minus size={10} strokeWidth={3} />
                            </button>
                            <span className="w-8 h-full flex items-center justify-center tabular-prices text-xs font-black text-[color:var(--chipzo-ink)]">
                              {item.quantity}
                            </span>
                            <button 
                              type="button"
                              onClick={() => onUpdateQuantity?.(item.id, 1)}
                              className="w-8 h-full flex items-center justify-center hover:bg-[color:var(--chipzo-surface)] border-l-2 border-[color:var(--chipzo-ink)] active:bg-[color:var(--chipzo-paper)] cursor-pointer"
                            >
                              <Plus size={10} strokeWidth={3} />
                            </button>
                          </div>

                          {/* Dynamic Price */}
                          <div className="tabular-prices text-lg font-black text-[color:var(--chipzo-primary)] leading-none tracking-tight">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="my-2">
                    <button 
                      type="button"
                      onClick={() => onNavigate?.('shop')}
                      className="w-full sm:w-auto bg-white text-[color:var(--chipzo-ink)] font-black text-base sm:text-lg py-4 px-8 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <span>GO BACK TO SHOP</span>
                    </button>
                  </div>

                  {/* Recommended Add-ons Section */}
                  <div className="mt-8 border-t-4 border-[color:var(--chipzo-ink)] pt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-[color:var(--chipzo-ink)]"></span> RECOMMENDED ADD-ONS
                      </h2>
                    </div>

                    <Skeleton
                      name="recommended-addons"
                      loading={complementaryLoading}
                      fallback={<SkeletonCardGrid />}
                    >
                      {displayRecommendations.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                          {displayRecommendations.map((compItem) => {
                            const isInCart = items.some(cartItem => cartItem.id === compItem.id)
                            return (
                              <div 
                                key={compItem.id} 
                                className="bg-white brutal-border p-4 flex flex-col justify-between hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group"
                              >
                                <div className="flex gap-4 items-center mb-3">
                                  <div className="w-16 h-16 shrink-0 brutal-border bg-[color:var(--chipzo-surface)] overflow-hidden flex items-center justify-center p-1.5">
                                    <img 
                                      alt={compItem.title} 
                                      className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300" 
                                      src={compItem.image}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)] tracking-wider block mb-1">
                                      {compItem.category}
                                    </span>
                                    <h4 className="text-xs font-black uppercase tracking-tight text-[color:var(--chipzo-ink)] line-clamp-2 leading-tight mb-1">
                                      {compItem.title}
                                    </h4>
                                    <p className="tabular-prices text-sm font-black text-[color:var(--chipzo-primary)]">
                                      ₹{compItem.price.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                
                                <div>
                                  {isInCart ? (
                                    <button 
                                      type="button"
                                      disabled
                                      className="w-full bg-[color:var(--chipzo-surface)] border-2 border-[color:var(--chipzo-ink)] py-2 font-mono text-[9px] uppercase font-bold text-[color:var(--chipzo-muted)] flex items-center justify-center gap-1 cursor-not-allowed"
                                    >
                                      <Check size={10} strokeWidth={3} />
                                      <span>IN BUILD</span>
                                    </button>
                                  ) : (
                        <LoadingButton
                          type="button"
                          onClick={() => handleAddBuild(compItem)}
                          status={buildStatuses[compItem.id] || 'idle'}
                          variant="lime"
                          size="sm"
                          fullWidth
                        >
                          ADD TO BUILD
                        </LoadingButton>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </Skeleton>
                  </div>
                </div>

                {/* Right Column: Sticky Summary Panel — Desktop only */}
                <div className="lg:col-span-4 xl:col-span-3 self-stretch hidden lg:block">
                  {/* System Control Panel */}
                  <div className="sticky top-32 bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow overflow-hidden flex flex-col">
                    <div className="px-5 py-3 border-b-4 border-[color:var(--chipzo-ink)] bg-white flex justify-between items-center">
                      <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                        <span className="w-2 h-2 bg-[color:var(--chipzo-ink)]"></span> SYSTEM CONTROL
                      </h2>
                    </div>
                    <div className="p-5 flex flex-col gap-4">
                      <div className="flex justify-between font-black text-xs uppercase text-[color:var(--chipzo-ink)]">
                        <span>SUBTOTAL</span>
                        <span className="tabular-prices">₹{subtotal.toFixed(2)}</span>
                      </div>
                      
                      <DeliveryFeePanel subtotal={subtotal} deliveryFee={deliveryFee} isEligible={isEligibleForReducedDelivery} />

                      {/* DELIVERY STATUS PROGRESS BAR */}
                      <div className="border-t border-dashed border-[color:var(--chipzo-ink)] pt-2.5 mt-0.5">
                        <DeliveryProgressBar progress={deliveryProgress} total={subtotal} />
                      </div>

                      <div className="flex justify-between font-black text-xs uppercase text-[color:var(--chipzo-primary)]">
                        <span>DYNAMIC DISCOUNT</span>
                        <span className="tabular-prices">-₹0.00</span>
                      </div>
                      
                      {/* Coupon Code Input */}
                      <div className="flex mt-1">
                        <input 
                          type="text" 
                          placeholder="COUPON CODE" 
                          className="w-full bg-white brutal-border border-r-0 px-2 py-1.5 text-xs font-black uppercase text-[color:var(--chipzo-ink)] placeholder-[color:var(--chipzo-muted)] focus:outline-none"
                        />
                        <button className="bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)] brutal-border px-3 py-1.5 text-xs font-black uppercase hover:bg-black active:translate-x-[1px] active:translate-y-[1px] cursor-pointer">
                          APPLY
                        </button>
                      </div>

                      <div className="border-t-2 border-dashed border-[color:var(--chipzo-ink)] my-0.5"></div>
                      
                      <div className="flex justify-between font-black text-xl uppercase text-[color:var(--chipzo-ink)]">
                        <span>TOTAL</span>
                        <span className="tabular-prices font-mono">₹{orderTotal.toFixed(2)}</span>
                      </div>

                      {/* MINIMUM CART SYSTEM PROTOCOLS */}
                      <div className="flex flex-col gap-4 border-t-2 border-dashed border-[color:var(--chipzo-ink)] pt-4 mt-1">
                        <CheckoutProgressBar progress={progress} total={subtotal} />
                      </div>
                      
                      {canCheckout ? (
                        <LoadingButton
                          type="button"
                          onClick={handleCheckout}
                          status={checkoutStatus}
                          variant="lime"
                          size="lg"
                          className="mt-2 w-full"
                        >
                          CHECKOUT →
                        </LoadingButton>
                      ) : (
                        <motion.button 
                          type="button"
                          disabled
                          whileHover={{ 
                            x: [0, -3, 3, -3, 3, 0],
                            transition: { duration: 0.4 }
                          }}
                          className="mt-2 w-full bg-neutral-800 text-neutral-400 font-black text-sm py-3.5 px-4 brutal-border opacity-70 cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(245,158,11,0.5)] border-red-500"
                        >
                          <Lock size={14} className="text-red-500 shrink-0" />
                          <span>MIN ₹250 REQUIRED</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </main>

        {/* Mobile Sticky Checkout Bar */}
        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-3 shadow-[0_-4px_0_rgba(0,0,0,1)] lg:hidden">
            <div className="flex flex-col gap-2">
              <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-1 ${
                orderStatus.type === 'success'
                  ? 'text-emerald-600'
                  : orderStatus.type === 'warning'
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}>
                {orderStatus.type === 'success' ? <CheckCircle size={10} /> : orderStatus.type === 'warning' ? <Clock size={10} /> : <Ban size={10} />}
                {orderStatus.label}
              </div>
              
              {/* Dynamic Delivery progress / upsell on Mobile Sticky Checkout Bar */}
              <div className="mb-2 flex flex-col gap-2 border-t border-[color:var(--chipzo-rule)] pt-2">
                <CheckoutProgressBar progress={progress} total={subtotal} />
                <DeliveryProgressBar progress={deliveryProgress} total={subtotal} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[color:var(--chipzo-muted)]">Order Total</p>
                  <p className="tabular-prices text-xl font-black text-[color:var(--chipzo-ink)] leading-none">₹{orderTotal.toFixed(2)}</p>
                </div>
                
                {canCheckout ? (
                  <LoadingButton
                    type="button"
                    onClick={handleCheckout}
                    status={checkoutStatus}
                    variant="lime"
                    size="lg"
                    icon={ArrowRight}
                    fullWidth
                    className="flex-1"
                  >
                    Proceed to Checkout
                  </LoadingButton>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex flex-1 items-center justify-center gap-2 border-[3px] border-red-500 bg-neutral-800 py-3 text-sm font-black uppercase tracking-[0.1em] text-neutral-400 opacity-80 shadow-[2px_2px_0_rgba(0,0,0,1)] cursor-not-allowed active:translate-x-[1px] active:translate-y-[1px] flex justify-center items-center gap-1.5"
                  >
                    <Lock size={12} className="text-red-500 shrink-0" />
                    <span>MIN ₹250 REQUIRED</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        <Footer />
      </div>
    </SmoothScroll>
  )
}
