import { useState, useEffect } from 'react'
import { Package, ChevronRight, AlertTriangle, RefreshCw, Clock, MapPin, CreditCard, Truck, XCircle, Eye, Bell, X } from 'lucide-react'
import SmoothScroll from '../components/SmoothScroll.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import CancelOrderModal from '../components/CancelOrderModal.jsx'
import { ordersAPI, deliveryAPI } from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'

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
}

const CANCELLABLE_STATUSES = ['order_confirmed', 'bike_booked', 'pickup_started']

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-[color:var(--chipzo-primary)]';
  return (
    <div className={`fixed top-24 right-4 z-50 ${bg} text-white brutal-border border-[color:var(--chipzo-ink)] px-5 py-3 shadow-[4px_4px_0_var(--chipzo-ink)] flex items-center gap-3 animate-[slideIn_0.2s_ease-out] max-w-sm`}>
      <Bell size={16} strokeWidth={3} />
      <span className="text-xs font-black uppercase flex-1">{message}</span>
      <button onClick={onClose} className="cursor-pointer"><X size={14} strokeWidth={3} /></button>
    </div>
  )
}

export default function MyOrders({ onNavigate, activeCategory, cartCount }) {
  const { isLoggedIn } = useAuth()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const [cancellingId, setCancellingId] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelTargetId, setCancelTargetId] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info') => setToast({ message, type })
  const dismissToast = () => setToast(null)

  useEffect(() => {
    if (!isLoggedIn) return
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      setApiError('')
      try {
        const data = await ordersAPI.getAll()
        if (cancelled) return
        const raw = data?.data || data?.orders || []
        setOrders(raw)
      } catch (err) {
        if (!cancelled) setApiError(err.message || 'Failed to load orders.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [isLoggedIn, retryKey])

  const statusColor = (status) => {
    const map = {
      'pending': 'border-[color:var(--chipzo-muted)] text-[color:var(--chipzo-muted)]',
      'paid': 'border-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)]',
      'failed': 'border-red-500 text-red-500',
      'refunded': 'border-orange-400 text-orange-600',
    }
    return map[status] || 'border-[color:var(--chipzo-muted)] text-[color:var(--chipzo-muted)]'
  }

  const deliveryStatusColor = (status) => {
    const map = {
      'not_assigned': 'text-[color:var(--chipzo-muted)]',
      'order_confirmed': 'text-[color:var(--chipzo-primary)]',
      'bike_booked': 'text-[color:var(--chipzo-primary)]',
      'pickup_started': 'text-amber-600',
      'in_transit': 'text-indigo-600',
      'out_for_delivery': 'text-[color:var(--chipzo-primary)]',
      'delivered': 'text-emerald-600',
      'cancelled': 'text-red-500',
      'failed_delivery': 'text-orange-500',
    }
    return map[status] || 'text-[color:var(--chipzo-muted)]'
  }

  const handleCancelConfirm = async (reason) => {
    if (!cancelTargetId) return
    setCancellingId(cancelTargetId)
    try {
      await deliveryAPI.cancel(cancelTargetId, reason)
      setOrders(prev => prev.map(o =>
        o._id === cancelTargetId ? { ...o, deliveryStatus: 'cancelled', paymentStatus: o.paymentMethod === 'razorpay' && o.paymentStatus === 'paid' ? 'refunded' : o.paymentStatus } : o
      ))
      setShowCancelModal(false)
      setCancelTargetId(null)
      showToast('Order cancelled successfully.', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)]">
        <Navbar onNavigate={onNavigate} currentPage="orders" activeCategory={activeCategory} cartCount={cartCount} />

        {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-32 lg:pb-24 flex flex-col gap-8">
          <div className="border-b-[3px] border-[color:var(--chipzo-ink)] pb-4 mb-2">
            <h1 className="text-4xl sm:text-5xl font-black uppercase leading-none tracking-tighter flex items-center gap-4">
              <Package size={32} strokeWidth={2.5} />
              My Orders
            </h1>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-muted)] mt-2">
              {isLoggedIn ? `${orders.length} ORDER${orders.length !== 1 ? 'S' : ''} PLACED` : 'SIGN IN TO VIEW ORDERS'}
            </p>
          </div>

          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center py-20 brutal-border bg-[color:var(--chipzo-surface)] brutal-shadow text-center">
              <AlertTriangle size={40} className="text-[color:var(--chipzo-primary)] mb-4" />
              <h2 className="text-2xl font-black uppercase">Authentication Required</h2>
              <p className="text-sm font-bold text-[color:var(--chipzo-muted)] mt-2">Sign in to view your order history.</p>
              <button onClick={() => onNavigate?.('login')} className="mt-6 brutal-border brutal-shadow bg-[color:var(--chipzo-primary)] px-8 py-3 text-sm font-black uppercase tracking-wider cursor-pointer hover:-translate-y-[1px] transition-all">
                SIGN IN
              </button>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="brutal-border bg-[color:var(--chipzo-surface)] h-32 animate-pulse" />
              ))}
            </div>
          ) : apiError ? (
            <div className="flex flex-col items-center justify-center py-16 brutal-border bg-[color:var(--chipzo-surface)] brutal-shadow text-center">
              <AlertTriangle size={40} className="text-red-500 mb-4" />
              <h2 className="text-xl font-black uppercase">Failed to Load Orders</h2>
              <p className="text-sm font-bold text-[color:var(--chipzo-muted)] mt-2">{apiError}</p>
              <button onClick={() => setRetryKey(k => k + 1)} className="mt-6 flex items-center gap-2 brutal-border brutal-shadow bg-[color:var(--chipzo-lime)] px-6 py-3 text-xs font-black uppercase cursor-pointer">
                <RefreshCw size={14} /> RETRY
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 brutal-border bg-[color:var(--chipzo-surface)] brutal-shadow text-center">
              <Package size={48} className="text-[color:var(--chipzo-muted)] mb-4" />
              <h2 className="text-2xl font-black uppercase">No Orders Yet</h2>
              <p className="text-sm font-bold text-[color:var(--chipzo-muted)] mt-2 max-w-md">Your order history will appear here once you place your first order.</p>
              <button onClick={() => onNavigate?.('shop')} className="mt-6 brutal-border brutal-shadow bg-[color:var(--chipzo-primary)] px-8 py-3 text-sm font-black uppercase tracking-wider cursor-pointer hover:-translate-y-[1px] transition-all">
                START SHOPPING
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isCancellable = CANCELLABLE_STATUSES.includes(order.deliveryStatus)
                return (
                  <div key={order._id} className="brutal-border brutal-shadow bg-[color:var(--chipzo-surface)] overflow-hidden">
                    <div className="px-5 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[color:var(--chipzo-muted)]">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`border-[2px] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${deliveryStatusColor(order.deliveryStatus)}`}>
                          <Truck size={12} /> {STATUS_LABELS[order.deliveryStatus] || order.deliveryStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-prices text-lg font-black">₹{order.totalAmount?.toFixed(2)}</span>
                        <button onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)} className="cursor-pointer">
                          <ChevronRight size={18} strokeWidth={3} className={`transition-transform ${expandedOrder === order._id ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {expandedOrder === order._id && (
                      <div className="p-5 space-y-6">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-[color:var(--chipzo-muted)] mb-3 flex items-center gap-2">
                            <Package size={14} /> ORDERED ITEMS ({order.items?.length || 0})
                          </h3>
                          <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-[color:var(--chipzo-paper)] brutal-border p-3">
                                <div>
                                  <p className="text-sm font-black uppercase">{item.name || 'Component'}</p>
                                  <p className="text-xs font-bold text-[color:var(--chipzo-muted)]">Qty: {item.quantity} × ₹{item.price?.toFixed(2)}</p>
                                </div>
                                <p className="tabular-prices font-black">₹{(item.price * item.quantity)?.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-dashed border-[color:var(--chipzo-rule)]">
                            <span className="font-black uppercase text-sm">Total</span>
                            <span className="tabular-prices text-xl font-black">₹{order.totalAmount?.toFixed(2)}</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-[color:var(--chipzo-muted)] mb-2 flex items-center gap-2">
                            <MapPin size={14} /> DELIVERY ADDRESS
                          </h3>
                          <div className="bg-[color:var(--chipzo-paper)] brutal-border p-4 text-sm">
                            <p className="font-black">{order.address?.fullName}</p>
                            <p className="text-[color:var(--chipzo-muted)]">{order.address?.phone}</p>
                            <p className="mt-1">{order.address?.street}{order.address?.house ? `, ${order.address?.house}` : ''}</p>
                            <p>{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
                          </div>
                        </div>

                        {order.deliveryTrackingId && (
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-[color:var(--chipzo-muted)] mb-2 flex items-center gap-2">
                              <Truck size={14} /> DELIVERY INFO
                            </h3>
                            <div className="bg-[color:var(--chipzo-paper)] brutal-border p-4 space-y-2 text-sm">
                              {order.deliveryTrackingId && (
                                <div className="flex justify-between">
                                  <span className="font-bold text-[color:var(--chipzo-muted)]">Tracking ID</span>
                                  <span className="font-mono font-black">{order.deliveryTrackingId}</span>
                                </div>
                              )}
                              {order.courierDetails?.name && (
                                <div className="flex justify-between">
                                  <span className="font-bold text-[color:var(--chipzo-muted)]">Courier</span>
                                  <span className="font-black">{order.courierDetails.name}</span>
                                </div>
                              )}
                              {order.estimatedDelivery && (
                                <div className="flex justify-between">
                                  <span className="font-bold text-[color:var(--chipzo-muted)]">Est. Delivery</span>
                                  <span className="font-black">{new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--chipzo-muted)]">
                          <CreditCard size={14} /> Payment ID: {order.paymentId || 'N/A'}
                          <span className="mx-2">|</span>
                          <Clock size={14} /> Ordered: {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t-2 border-[color:var(--chipzo-rule)]">
                          {order.paymentStatus === 'paid' && order.deliveryStatus !== 'cancelled' && (
                            <button
                              onClick={() => { const url = `/tracking?orderId=${order._id}`; window.location.href = url }}
                              className="flex items-center justify-center gap-2 bg-[color:var(--chipzo-primary)] brutal-border brutal-shadow px-4 py-2.5 text-xs font-black uppercase cursor-pointer flex-1 hover:-translate-y-[1px] transition-all"
                            >
                              <Eye size={14} /> TRACK ORDER
                            </button>
                          )}
                          {isCancellable && (
                            <button
                              onClick={() => { setCancelTargetId(order._id); setShowCancelModal(true) }}
                              disabled={cancellingId === order._id}
                              className="flex items-center justify-center gap-2 bg-red-500 text-white brutal-border border-red-700 px-4 py-2.5 text-xs font-black uppercase cursor-pointer flex-1 disabled:opacity-50 hover:bg-red-600 transition-all"
                            >
                              {cancellingId === order._id ? <><RefreshCw size={14} className="animate-spin" /> CANCELLING...</> : <><XCircle size={14} /> CANCEL</>}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>

        <CancelOrderModal
          isOpen={showCancelModal}
          onClose={() => { setShowCancelModal(false); setCancelTargetId(null) }}
          onConfirm={handleCancelConfirm}
          isCancelling={!!cancellingId}
        />

        <Footer />
      </div>
    </SmoothScroll>
  )
}
