import { useEffect, useState } from 'react';
import SmoothScroll from '../components/SmoothScroll.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { CheckCircle, ShoppingBag, Eye, ArrowLeft, MapPin, Package } from 'lucide-react';

export default function OrderSuccess({ onNavigate, activeCategory, orderData }) {
  const [visible, setVisible] = useState(false);
  const order = orderData || {};

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const items = order.items || [];
  const subtotal = order.subtotal || 0;
  const shipping = order.shipping ?? 9.99;
  const total = order.total || subtotal + shipping;
  const address = order.address || {};

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)]">
        <Navbar onNavigate={onNavigate} currentPage="checkout" activeCategory={activeCategory} cartCount={0} />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 flex flex-col gap-8">
          {/* Success Animation */}
          <div className={`flex flex-col items-center gap-4 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-emerald-100 border-[3px] border-emerald-500 flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <CheckCircle size={52} className="text-emerald-600" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-[color:var(--chipzo-lime)] border-2 border-[color:var(--chipzo-ink)] flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]">
                <span className="text-[10px] font-black">✓</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-center">Payment Successful!</h1>
            <p className="text-sm font-bold text-[color:var(--chipzo-muted)] text-center max-w-md">
              Your order has been placed and is being processed. You will receive a confirmation shortly.
            </p>
          </div>

          {/* Order ID Banner */}
          {order.orderId && (
            <div className={`bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)] brutal-border p-5 flex items-center justify-between gap-4 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Order ID</p>
                <p className="text-lg font-black font-mono tracking-tight">{order.orderId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Amount Paid</p>
                <p className="text-lg font-black font-mono">₹{total.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Items Summary */}
          <section className={`bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] flex items-center gap-2">
              <Package size={18} strokeWidth={2.5} />
              <h2 className="text-lg font-black uppercase tracking-tight">Items Ordered</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-[color:var(--chipzo-ink)] pb-4 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 brutal-border bg-[color:var(--chipzo-paper)] flex items-center justify-center overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.title || item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag size={20} className="text-[color:var(--chipzo-muted)]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black uppercase text-sm leading-tight">{item.title || item.name}</p>
                        <p className="text-xs font-bold text-[color:var(--chipzo-muted)]">Qty: {item.quantity} × ₹{(item.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="font-black tabular-prices shrink-0">₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t-2 border-[color:var(--chipzo-ink)] space-y-2">
                <div className="flex justify-between text-sm"><span className="font-bold uppercase">Subtotal</span><span className="font-black tabular-prices">₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="font-bold uppercase">Delivery</span><span className="font-black tabular-prices">{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span></div>
                {order.paymentMethod === 'cod' && (
                  <div className="flex justify-between text-sm"><span className="font-bold uppercase">Payment</span><span className="font-black tabular-prices text-amber-600">Cash on Delivery</span></div>
                )}
                <div className="flex justify-between pt-2 border-t border-[color:var(--chipzo-ink)]"><span className="font-black uppercase">Total Paid</span><span className="font-black text-xl tabular-prices text-emerald-600">₹{total.toFixed(2)}</span></div>
              </div>
            </div>
          </section>

          {/* Delivery Address */}
          {address.fullName && (
            <section className={`bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow transition-all duration-700 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] flex items-center gap-2">
                <MapPin size={18} strokeWidth={2.5} />
                <h2 className="text-lg font-black uppercase tracking-tight">Delivery Address</h2>
              </div>
              <div className="p-6 space-y-1">
                <p className="font-black uppercase">{address.fullName}</p>
                <p className="text-sm font-bold text-[color:var(--chipzo-muted)]">{address.phone}</p>
                <p className="text-sm font-bold">{address.street}</p>
                <p className="text-sm font-bold">{address.city}, {address.state} - {address.pincode}</p>
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button
              onClick={() => onNavigate('orders')}
              className="flex-1 bg-[color:var(--chipzo-primary)] text-[color:var(--chipzo-ink)] font-black uppercase py-4 px-8 brutal-border brutal-shadow cursor-pointer flex items-center justify-center gap-3 text-sm hover:-translate-y-[1px] transition-all"
            >
              <Eye size={18} strokeWidth={3} /> View Orders
            </button>
            <button
              onClick={() => onNavigate('shop')}
              className="flex-1 bg-[color:var(--chipzo-surface)] text-[color:var(--chipzo-ink)] font-black uppercase py-4 px-8 brutal-border brutal-shadow cursor-pointer flex items-center justify-center gap-3 text-sm hover:-translate-y-[1px] transition-all"
            >
              <ArrowLeft size={18} strokeWidth={3} /> Continue Shopping
            </button>
          </div>
        </main>

        <Footer />
      </div>
    </SmoothScroll>
  );
}
