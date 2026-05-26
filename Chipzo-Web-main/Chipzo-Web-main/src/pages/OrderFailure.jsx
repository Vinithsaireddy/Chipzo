import { useEffect, useState } from 'react';
import SmoothScroll from '../components/SmoothScroll.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { XCircle, RefreshCw, ShoppingBag, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function OrderFailure({ onNavigate, activeCategory, error }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const errorMessage = error?.message || error?.reason || 'Your payment could not be processed.';
  const isCancelled = error?.type === 'cancelled';
  const isTimeout = error?.type === 'timeout';
  const rzpOrderId = error?.razorpayOrderId || null;

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)]">
        <Navbar onNavigate={onNavigate} currentPage="checkout" activeCategory={activeCategory} cartCount={0} />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 flex flex-col gap-8">
          {/* Failure Icon */}
          <div className={`flex flex-col items-center gap-4 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-24 h-24 rounded-full bg-red-100 border-[3px] border-red-500 flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <XCircle size={52} className="text-red-600" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-center">
              {isCancelled ? 'Payment Cancelled' : 'Payment Failed'}
            </h1>
            <p className="text-sm font-bold text-[color:var(--chipzo-muted)] text-center max-w-md">
              {isCancelled
                ? 'You closed the payment window without completing the transaction.'
                : isTimeout
                  ? 'The payment window timed out. Please try again.'
                  : 'We were unable to process your payment. Your card has not been charged.'}
            </p>
          </div>

          {/* Error Details */}
          <div className={`bg-red-50 border-[3px] border-red-500 p-5 shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5 text-red-600" size={20} />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-red-700">Error Details</p>
                <p className="text-sm font-bold mt-1 text-red-800">{errorMessage}</p>
                {rzpOrderId && (
                  <p className="text-[10px] font-mono mt-2 text-red-600/70">
                    Reference: {rzpOrderId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <section className={`bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] flex items-center gap-2">
              <AlertTriangle size={18} strokeWidth={2.5} />
              <h2 className="text-lg font-black uppercase tracking-tight">What Happens Next?</h2>
            </div>
            <div className="p-6 space-y-3 text-sm font-bold">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[color:var(--chipzo-surface)] border-2 border-[color:var(--chipzo-ink)] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-black">1</span>
                </div>
                <p>No charges have been made to your account.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[color:var(--chipzo-surface)] border-2 border-[color:var(--chipzo-ink)] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-black">2</span>
                </div>
                <p>Your cart items are still saved. You can retry the payment.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[color:var(--chipzo-surface)] border-2 border-[color:var(--chipzo-ink)] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-black">3</span>
                </div>
                <p>If you still face issues, try a different payment method like UPI or Cash on Delivery.</p>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button
              onClick={() => onNavigate('checkout')}
              className="flex-1 bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] font-black uppercase py-4 px-8 brutal-border brutal-shadow cursor-pointer flex items-center justify-center gap-3 text-sm hover:-translate-y-[1px] transition-all"
            >
              <RefreshCw size={18} strokeWidth={3} /> Retry Payment
            </button>
            <button
              onClick={() => onNavigate('cart')}
              className="flex-1 bg-[color:var(--chipzo-surface)] text-[color:var(--chipzo-ink)] font-black uppercase py-4 px-8 brutal-border brutal-shadow cursor-pointer flex items-center justify-center gap-3 text-sm hover:-translate-y-[1px] transition-all"
            >
              <ShoppingBag size={18} strokeWidth={3} /> Back to Cart
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => onNavigate('shop')}
              className="text-xs font-black uppercase text-[color:var(--chipzo-muted)] hover:text-[color:var(--chipzo-ink)] underline cursor-pointer transition-colors"
            >
              <ArrowLeft size={12} className="inline mr-1" /> Continue Shopping
            </button>
          </div>
        </main>

        <Footer />
      </div>
    </SmoothScroll>
  );
}
