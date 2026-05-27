import { useState, useEffect, useCallback } from 'react';
import SmoothScroll from '../components/SmoothScroll.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import CancelOrderModal from '../components/CancelOrderModal.jsx';
import {
  Package, Clock, Truck, MapPin, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, ShieldAlert, Loader,
  ArrowLeft, Phone, User, Bell, X
} from 'lucide-react';
import { deliveryAPI } from '../services/api.js';

const STATUS_ORDER = [
  'order_confirmed',
  'bike_booked',
  'pickup_started',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

const STATUS_LABELS = {
  not_assigned: 'Not Assigned',
  order_confirmed: 'Order Confirmed',
  bike_booked: 'Bike Booked',
  pickup_started: 'Pickup Started',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed_delivery: 'Failed Delivery',
};

const POLL_INTERVAL = 10000;

function StatusIcon({ status, isCompleted }) {
  if (status === 'cancelled' || status === 'failed_delivery') {
    return <XCircle size={24} strokeWidth={2.5} className="text-red-500" />;
  }
  if (isCompleted) {
    return <CheckCircle2 size={24} strokeWidth={2.5} className="text-emerald-600" />;
  }
  return <Truck size={24} strokeWidth={2.5} />;
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-[color:var(--chipzo-primary)]';
  return (
    <div className={`fixed top-24 right-4 z-50 ${bg} text-white brutal-border border-[color:var(--chipzo-ink)] px-5 py-3 shadow-[4px_4px_0_var(--chipzo-ink)] flex items-center gap-3 animate-[slideIn_0.2s_ease-out] max-w-sm`}>
      <Bell size={16} strokeWidth={3} />
      <span className="text-xs font-black uppercase flex-1">{message}</span>
      <button onClick={onClose} className="cursor-pointer"><X size={14} strokeWidth={3} /></button>
    </div>
  );
}

export default function Tracking({ onNavigate, activeCategory, completedOrder }) {
  const [orderId, setOrderId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('orderId') || '';
  });
  const [tracking, setTracking] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => setToast({ message, type });
  const dismissToast = () => setToast(null);

  const fetchTracking = useCallback(async (id, showLoader = true) => {
    if (!id) return;
    if (showLoader) setIsLoading(true);
    setApiError('');
    try {
      const data = await deliveryAPI.track(id);
      setTracking(data?.data || null);
    } catch (err) {
      if (showLoader) setApiError(err.message || 'Failed to fetch tracking info');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (completedOrder?.orderId) setOrderId(completedOrder.orderId);
  }, [completedOrder]);

  useEffect(() => {
    if (orderId) {
      fetchTracking(orderId);
      const interval = setInterval(() => fetchTracking(orderId, false), POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [orderId, fetchTracking]);

  const handleCancelConfirm = async (reason) => {
    setIsCancelling(true);
    try {
      await deliveryAPI.cancel(orderId, reason);
      await fetchTracking(orderId);
      setShowCancelModal(false);
      showToast('Order cancelled successfully. Refund will be processed.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const deliveryStatus = tracking?.deliveryStatus || 'not_assigned';
  const currentStepIndex = STATUS_ORDER.indexOf(deliveryStatus);
  const isCancelled = deliveryStatus === 'cancelled';
  const isFailed = deliveryStatus === 'failed_delivery';
  const isDelivered = deliveryStatus === 'delivered';
  const canCancel = tracking?.canCancel && !isCancelling;

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)] noise-bg">
        <Navbar onNavigate={onNavigate} currentPage="tracking" activeCategory={activeCategory} cartCount={0} />

        {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 flex flex-col gap-8">
          {/* Header */}
          <div className="border-b-[3px] border-[color:var(--chipzo-ink)] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Truck size={32} strokeWidth={2.5} />
                Live Tracking
              </h1>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-muted)] mt-1">
                {orderId ? `ORDER: ${orderId.slice(-8).toUpperCase()}` : 'Enter order ID to track'}
              </p>
            </div>
            {orderId && (
              <button
                onClick={() => fetchTracking(orderId)}
                disabled={isLoading}
                className="flex items-center gap-2 brutal-border bg-[color:var(--chipzo-surface)] px-4 py-2 text-xs font-black uppercase cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} strokeWidth={3} className={isLoading ? 'animate-spin' : ''} />
                REFRESH
              </button>
            )}
          </div>

          {/* Order ID Input */}
          {!orderId && (
            <section className="brutal-border bg-[color:var(--chipzo-surface)] brutal-shadow p-6">
              <label className="text-xs font-black uppercase tracking-wider mb-3 block">Enter Your Order ID</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Paste your order ID..."
                  className="flex-1 border-[3px] border-[color:var(--chipzo-ink)] px-4 py-3 text-sm font-bold uppercase bg-[color:var(--chipzo-paper)] outline-none"
                />
                <button
                  onClick={() => fetchTracking(orderId)}
                  disabled={!orderId || isLoading}
                  className="brutal-border bg-[color:var(--chipzo-primary)] px-6 py-3 text-sm font-black uppercase cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? <Loader size={16} className="animate-spin" /> : <Truck size={16} />}
                  TRACK
                </button>
              </div>
            </section>
          )}

          {/* Error State */}
          {apiError && (
            <div className="brutal-border bg-red-50 border-red-500 p-5 flex items-start gap-4">
              <AlertTriangle size={24} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-black uppercase text-sm">Tracking Unavailable</h3>
                <p className="text-xs font-bold text-[color:var(--chipzo-muted)] mt-1">{apiError}</p>
              </div>
              <button onClick={() => fetchTracking(orderId)} className="shrink-0 brutal-border bg-white px-3 py-1.5 text-xs font-black uppercase cursor-pointer">
                RETRY
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && !tracking && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="brutal-border bg-[color:var(--chipzo-surface)] h-28 animate-pulse" />
              ))}
            </div>
          )}

          {/* Tracking Content */}
          {tracking && !isLoading && (
            <>
              {/* Status Hero Banner */}
              <section className={`brutal-border brutal-shadow relative overflow-hidden p-6 sm:p-8 ${
                isDelivered ? 'bg-emerald-50 border-emerald-500' :
                isCancelled ? 'bg-red-50 border-red-500' :
                isFailed ? 'bg-orange-50 border-orange-500' :
                'bg-[color:var(--chipzo-surface)]'
              }`}>
                <div className={`absolute top-0 right-0 text-[10px] font-black uppercase px-3 py-1 border-l-3 border-b-3 border-[color:var(--chipzo-ink)] ${
                  isDelivered ? 'bg-emerald-400' :
                  isCancelled ? 'bg-red-400 text-white' :
                  isFailed ? 'bg-orange-400' :
                  'bg-[color:var(--chipzo-primary)]'
                }`}>
                  {isDelivered ? 'DELIVERED' : isCancelled ? 'CANCELLED' : isFailed ? 'FAILED' : 'LIVE'}
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 shrink-0 brutal-border brutal-shadow-sm flex items-center justify-center ${
                    isDelivered ? 'bg-emerald-400' :
                    isCancelled ? 'bg-red-400' :
                    isFailed ? 'bg-orange-400' :
                    'bg-[color:var(--chipzo-primary)]'
                  }`}>
                    <StatusIcon status={deliveryStatus} isCompleted={isDelivered} />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
                      {tracking.statusLabel || 'Status Unknown'}
                    </h2>
                    <p className="text-xs font-bold text-[color:var(--chipzo-muted)] uppercase tracking-wider flex items-center gap-2 flex-wrap">
                      <span>ORDER: {tracking.orderId?.slice(-8).toUpperCase()}</span>
                      {tracking.trackingId && <><span className="hidden sm:inline">//</span><span>AWB: {tracking.trackingId}</span></>}
                    </p>
                    {tracking.estimatedDelivery && !isDelivered && !isCancelled && (
                      <p className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1.5 mt-1">
                        <Clock size={12} />
                        ETA: {new Date(tracking.estimatedDelivery).toLocaleString('en-IN')}
                      </p>
                    )}
                    {!tracking.isMocked && !isDelivered && !isCancelled && !isFailed && (
                      <p className="text-[9px] font-bold text-[color:var(--chipzo-muted)]/60 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Auto-refreshing every {POLL_INTERVAL/1000}s
                      </p>
                    )}
                  </div>
                </div>

                {/* Cancel Button */}
                {canCancel && (
                  <div className="mt-4 pt-4 border-t-2 border-[color:var(--chipzo-ink)]/10 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)] uppercase">
                      Eligible for cancellation
                    </p>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="bg-red-500 text-white brutal-border border-red-700 px-5 py-2 text-xs font-black uppercase cursor-pointer flex items-center gap-2 hover:bg-red-600 transition-all"
                    >
                      <XCircle size={14} /> CANCEL ORDER
                    </button>
                  </div>
                )}
              </section>

              {/* Delivery Timeline */}
              <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow">
                <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] flex items-center gap-2">
                  <Clock size={16} strokeWidth={3} />
                  <h2 className="text-sm font-black uppercase tracking-widest">Delivery Timeline</h2>
                </div>
                <div className="p-6 sm:p-8">
                  {isCancelled || isFailed ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <XCircle size={48} className={isCancelled ? 'text-red-500' : 'text-orange-500'} />
                      <h3 className="font-black uppercase text-lg">{tracking.statusLabel}</h3>
                      <p className="text-sm font-bold text-[color:var(--chipzo-muted)]">{tracking.cancelReason || 'Order was cancelled'}</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-8 top-0 bottom-0 w-1 bg-[color:var(--chipzo-rule)] hidden sm:block">
                        <div
                          className="w-full bg-[color:var(--chipzo-primary)] transition-all duration-1000"
                          style={{ height: `${Math.max(0, ((currentStepIndex + 1) / STATUS_ORDER.length) * 100)}%` }}
                        />
                      </div>

                      <div className="space-y-0">
                        {STATUS_ORDER.map((status, idx) => {
                          const isCompleted = idx <= currentStepIndex;
                          const isCurrent = idx === currentStepIndex;
                          const historyEntry = tracking.history?.find(h => h.status === status);

                          return (
                            <div key={status} className="flex items-stretch gap-4 sm:gap-6 relative pb-6 last:pb-0">
                              <div className="hidden sm:flex flex-col items-center shrink-0 w-16">
                                <div className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center z-10 transition-all duration-500 ${
                                  isCompleted ? 'bg-[color:var(--chipzo-lime)] border-[color:var(--chipzo-ink)]' :
                                  isCurrent ? 'bg-[color:var(--chipzo-primary)] border-[color:var(--chipzo-ink)] animate-pulse' :
                                  'bg-[color:var(--chipzo-surface)] border-[color:var(--chipzo-rule)]'
                                }`}>
                                  {isCompleted ? <CheckCircle2 size={16} strokeWidth={3} /> : <span className="text-xs font-black">{idx + 1}</span>}
                                </div>
                              </div>

                              <div className={`flex-1 pb-4 sm:pb-0 ${
                                idx < STATUS_ORDER.length - 1 ? 'border-l-[3px] sm:border-l-0' : ''
                              } ${
                                isCompleted ? 'border-emerald-400' : isCurrent ? 'border-[color:var(--chipzo-primary)]' : 'border-[color:var(--chipzo-rule)]'
                              } pl-6 sm:pl-0`}>
                                <div className="flex items-start gap-3 sm:hidden mb-1">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                    isCompleted ? 'bg-emerald-400 border-[color:var(--chipzo-ink)]' :
                                    isCurrent ? 'bg-[color:var(--chipzo-primary)] border-[color:var(--chipzo-ink)]' :
                                    'bg-[color:var(--chipzo-surface)] border-[color:var(--chipzo-rule)]'
                                  }`}>
                                    {isCompleted && <CheckCircle2 size={12} strokeWidth={3} />}
                                  </div>
                                  <div>
                                    <h4 className={`font-black uppercase text-sm ${isCompleted ? 'text-emerald-700' : isCurrent ? 'text-[color:var(--chipzo-primary)]' : 'text-[color:var(--chipzo-muted)]'}`}>
                                      {STATUS_LABELS[status]}
                                    </h4>
                                    {historyEntry && (
                                      <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)] mt-0.5">
                                        {historyEntry.description}{historyEntry.location ? ` - ${historyEntry.location}` : ''}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="hidden sm:block">
                                  <h4 className={`font-black uppercase text-sm ${
                                    isCompleted ? 'text-emerald-700' :
                                    isCurrent ? 'text-[color:var(--chipzo-primary)]' :
                                    'text-[color:var(--chipzo-muted)]'
                                  }`}>{STATUS_LABELS[status]}</h4>
                                  {historyEntry && (
                                    <p className="text-xs font-bold text-[color:var(--chipzo-muted)] mt-0.5">
                                      {historyEntry.description}
                                      {historyEntry.location && <span className="block text-[10px]">{historyEntry.location}</span>}
                                    </p>
                                  )}
                                  {historyEntry?.updatedAt && (
                                    <p className="text-[9px] font-bold text-[color:var(--chipzo-muted)]/60 mt-1">
                                      {new Date(historyEntry.updatedAt).toLocaleString('en-IN')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Courier & Shipment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(tracking.courierDetails?.name || tracking.courierDetails?.phone) && (
                  <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow p-6">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                      <User size={14} strokeWidth={3} /> Courier Details
                    </h3>
                    <div className="space-y-3">
                      {tracking.courierDetails.name && (
                        <div className="flex items-center gap-3">
                          <Truck size={16} className="text-[color:var(--chipzo-muted)]" />
                          <div>
                            <p className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)]">Courier Partner</p>
                            <p className="font-black uppercase text-sm">{tracking.courierDetails.name}</p>
                          </div>
                        </div>
                      )}
                      {tracking.courierDetails.phone && (
                        <div className="flex items-center gap-3">
                          <Phone size={16} className="text-[color:var(--chipzo-muted)]" />
                          <div>
                            <p className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)]">Contact</p>
                            <p className="font-black text-sm">{tracking.courierDetails.phone}</p>
                          </div>
                        </div>
                      )}
                      {tracking.trackingId && (
                        <div className="flex items-center gap-3">
                          <MapPin size={16} className="text-[color:var(--chipzo-muted)]" />
                          <div>
                            <p className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)]">Tracking ID (AWB)</p>
                            <p className="font-mono font-black text-sm">{tracking.trackingId}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Package size={14} strokeWidth={3} /> Shipment Summary
                  </h3>
                  <div className="space-y-3 text-xs font-bold">
                    <div className="flex justify-between">
                      <span className="text-[color:var(--chipzo-muted)] uppercase">Status</span>
                      <span className={`font-black uppercase ${isDelivered ? 'text-emerald-600' : isCancelled ? 'text-red-500' : ''}`}>{tracking.statusLabel}</span>
                    </div>
                    {tracking.shipmentId && (
                      <div className="flex justify-between">
                        <span className="text-[color:var(--chipzo-muted)] uppercase">Shipment ID</span>
                        <span className="font-mono font-black">{tracking.shipmentId}</span>
                      </div>
                    )}
                    {tracking.estimatedDelivery && (
                      <div className="flex justify-between">
                        <span className="text-[color:var(--chipzo-muted)] uppercase">Est. Delivery</span>
                        <span className="font-black">{new Date(tracking.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[color:var(--chipzo-muted)] uppercase">Updates</span>
                      <span className="font-black">{tracking.history?.length || 0} events</span>
                    </div>
                    {tracking.isMocked && (
                      <div className="mt-3 p-3 bg-amber-50 border-2 border-amber-400 text-amber-800 text-[10px] font-bold uppercase">
                        <ShieldAlert size={12} className="inline mr-1" />
                        Mock mode — connect Shiprocket for live tracking
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Activity Log */}
              {tracking.history && tracking.history.length > 0 && (
                <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow">
                  <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)]">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Bell size={16} strokeWidth={3} /> Activity Log
                    </h3>
                  </div>
                  <div className="p-6 max-h-72 overflow-y-auto">
                    <div className="space-y-3">
                      {[...tracking.history].reverse().map((entry, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs p-3 bg-[color:var(--chipzo-paper)] brutal-border">
                          <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                            entry.status === 'delivered' ? 'bg-emerald-500' :
                            entry.status === 'cancelled' || entry.status === 'failed_delivery' ? 'bg-red-500' :
                            'bg-[color:var(--chipzo-primary)]'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black uppercase truncate">{entry.statusLabel || entry.status}</span>
                              <span className="text-[9px] font-bold text-[color:var(--chipzo-muted)] shrink-0">
                                {new Date(entry.updatedAt).toLocaleString('en-IN')}
                              </span>
                            </div>
                            {entry.description && <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)] mt-0.5">{entry.description}</p>}
                            {entry.location && <p className="text-[9px] font-bold text-[color:var(--chipzo-muted)]/60 mt-0.5">{entry.location}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {/* Empty State */}
          {!orderId && !isLoading && !tracking && (
            <div className="flex flex-col items-center justify-center py-20 brutal-border bg-[color:var(--chipzo-surface)] brutal-shadow text-center">
              <Truck size={48} className="text-[color:var(--chipzo-muted)] mb-4" />
              <h2 className="text-2xl font-black uppercase">Track Your Order</h2>
              <p className="text-sm font-bold text-[color:var(--chipzo-muted)] mt-2 max-w-md">
                Enter your order ID above to see real-time delivery status.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => onNavigate('orders')} className="flex-1 bg-[color:var(--chipzo-primary)] text-[color:var(--chipzo-ink)] font-black uppercase py-4 px-8 brutal-border brutal-shadow cursor-pointer flex items-center justify-center gap-3 text-sm hover:-translate-y-[1px] transition-all">
              <Package size={18} strokeWidth={3} /> All Orders
            </button>
            <button onClick={() => onNavigate('shop')} className="flex-1 bg-[color:var(--chipzo-surface)] text-[color:var(--chipzo-ink)] font-black uppercase py-4 px-8 brutal-border brutal-shadow cursor-pointer flex items-center justify-center gap-3 text-sm hover:-translate-y-[1px] transition-all">
              <ArrowLeft size={18} strokeWidth={3} /> Continue Shopping
            </button>
          </div>
        </main>

        {/* Cancel Order Modal */}
        <CancelOrderModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
          isCancelling={isCancelling}
        />

        <Footer />
      </div>
    </SmoothScroll>
  );
}
