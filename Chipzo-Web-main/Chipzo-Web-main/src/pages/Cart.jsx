import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, Check } from 'lucide-react'
import SmoothScroll from '../components/SmoothScroll.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

const COMPLEMENTARY_ITEMS = [
  {
    id: 'comp-jumpers',
    code: 'CPZ-JMP120',
    title: 'Jumper Wires (120pcs)',
    category: 'UNIT_ACCESSORY',
    specs: ['COUNT: 120 PCS', 'TYPE: M-M, M-F, F-F', 'LEN: 200MM'],
    price: 8.50,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjqfa-ivk8AHmH0Q7CTsvNLUlAQgSyI8m1BtuHMCeW-P1UsP3DaF3UycPeSNmUaraCkMVwtu5B69ATeL3_lHH1nz2fPFL9FzvB95aRTz8XIDypilhL-O__lKI5hofhl5H7Nu2vVcus0LinrP_r2LgrjqgCuTh4plV5Mv6W00KhHsDKyBj0Q2OVpD3uUTSTwv_zh-WTibJv4iVENYZO6BxWg4ORD-vGDWJPyg_H-HoF32u81B8UPfqyGukgjNJWtTpUlIh5dgs9Xqs',
    status: 'Operational'
  },
  {
    id: 'comp-breadboard',
    code: 'CPZ-BB830',
    title: '830 Tie-Point Breadboard',
    category: 'UNIT_ACCESSORY',
    specs: ['POINTS: 830 TIE', 'RAILS: 2 POWER', 'SIZE: 165x55MM'],
    price: 5.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjhCICAPv5kAJz30kS1Ozm7_yMOygg52OHMi_4WY0QkDnOmYgpsIwOvteThjjNwiSskIcB3JL5_x_L5lk_LUC9ti8c6zznwFZybj0KJoeQBSgJnEhlsSA3py8z6Y8VDnsgy3npQQ2s9p1tjXMXkx9KNueckQ6C3Ope60wFqhZP5J1fy_JCbGDKiLtofw_u4jeg4XBaghVJzHbVBHrGabMnNCgLyHQzZOX7zgTMQ49EbTCtQmQyHVq4EzATxr4xlcZ3YKVEMpMsDZA',
    status: 'Operational'
  },
  {
    id: 'comp-usbc',
    code: 'CPZ-USBC-1M',
    title: 'USB-C Programming Cable',
    category: 'UNIT_ACCESSORY',
    specs: ['CONN: USB-A TO C', 'LEN: 1.0 METER', 'RATE: 480MBPS'],
    price: 4.00,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60',
    status: 'Operational'
  },
  {
    id: 'comp-battery',
    code: 'CPZ-9V-CONN',
    title: '9V Battery Connector Cable',
    category: 'UNIT_ACCESSORY',
    specs: ['CONN: 9V SNAP', 'PLUG: 2.1MM DC', 'LEN: 150MM'],
    price: 2.50,
    image: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=500&auto=format&fit=crop&q=60',
    status: 'Operational'
  }
]

export default function Cart({ onNavigate, activeCategory, cart = [], onUpdateQuantity, onRemoveFromCart, onAddToCart }) {
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)]">
        <Navbar onNavigate={onNavigate} currentPage="cart" activeCategory={activeCategory} cartCount={cartCount} />
        
        <main className="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-32 lg:pb-24 flex flex-col gap-10">
          
          {cart.length === 0 ? (
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
                    {cart.map((item) => (
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
                              src={item.image}
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
                            ${(item.price * item.quantity).toFixed(2)}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                      {COMPLEMENTARY_ITEMS.map((compItem) => {
                        const isInCart = cart.some(cartItem => cartItem.id === compItem.id)
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
                                  ${compItem.price.toFixed(2)}
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
                                <button 
                                  type="button"
                                  onClick={() => onAddToCart?.(compItem)}
                                  className="w-full brutal-border py-2 font-black uppercase text-[10px] hover:bg-[color:var(--chipzo-ink)] hover:text-white transition-colors duration-150 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)]"
                                >
                                  ADD TO BUILD
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
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
                        <span className="tabular-prices">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-black text-xs uppercase text-[color:var(--chipzo-ink)]">
                        <span>DELIVERY FEE</span>
                        <span className="tabular-prices">CALCULATED NEXT</span>
                      </div>
                      <div className="flex justify-between font-black text-xs uppercase text-[color:var(--chipzo-primary)]">
                        <span>DYNAMIC DISCOUNT</span>
                        <span className="tabular-prices">-$0.00</span>
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
                        <span className="tabular-prices">${subtotal.toFixed(2)}</span>
                      </div>

                      <div className="mt-1 p-2 border-2 border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-cyan)] text-[color:var(--chipzo-ink)] flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="w-1.5 h-1.5 bg-[color:var(--chipzo-ink)] animate-pulse"></span> FAST DELIVERY ACTIVE
                      </div>
                      
                      <button 
                        type="button"
                        onClick={() => onNavigate?.('checkout')}
                        className="mt-2 w-full bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] font-black text-sm py-3 px-4 brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 group cursor-pointer uppercase tracking-wider"
                      >
                        <span>CHECKOUT</span>
                        <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </main>

        {/* Mobile Sticky Checkout Bar */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-3 shadow-[0_-4px_0_rgba(0,0,0,1)] lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[color:var(--chipzo-muted)]">Order Total</p>
                <p className="tabular-prices text-xl font-black text-[color:var(--chipzo-ink)] leading-none">${subtotal.toFixed(2)}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('checkout')}
                className="flex flex-1 items-center justify-center gap-2 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] py-3 text-sm font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-ink)] shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-lime)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
        
        <Footer />
      </div>
    </SmoothScroll>
  )
}
