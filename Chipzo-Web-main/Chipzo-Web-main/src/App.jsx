import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Tracking from './pages/Tracking.jsx'
import MyOrders from './pages/MyOrders.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'
import OrderFailure from './pages/OrderFailure.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Admin from './pages/Admin.jsx'
import VerifyOTP from './pages/VerifyOTP.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import { cartAPI } from './services/api.js'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, user } = useAuth()
  const [completedOrder, setCompletedOrder] = useState(null)
  const [paymentError, setPaymentError] = useState(null)
  const [cart, setCart] = useState([])

  const PROTECTED_PATHS = ['/checkout', '/profile', '/orders']
  const activeCategory = new URLSearchParams(location.search).get('category') || ''

  // ── Scroll to top on every route change ───────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  // ── Sync cart from backend whenever user logs in ─────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await cartAPI.get()
        if (cancelled) return
        const items = data?.data?.cart?.items || data?.cart?.items || []
        const mapped = items.map(item => {
          const product = item.product || {}
          const specsObj = product.specifications || {}
          const specs = Object.entries(specsObj).map(([k, v]) => `${k}: ${v}`)
          return {
            id: product._id || item.productId,
            _backendProductId: product._id || item.productId,
            code: product.id || product._id?.toString().slice(-8).toUpperCase() || 'CPZ-ITEM',
            title: product.name || 'Component',
            category: product.category || 'Other',
            specs,
            price: item.priceAtTime || product.price || 0,
            quantity: item.quantity,
            image: product.images?.length ? product.images[0] : '',
            status: 'Operational',
          }
        })
        setCart(mapped)
      } catch (err) {
        console.warn('[Cart] Could not fetch backend cart:', err.message)
      }
    })()
    return () => { cancelled = true }
  }, [isLoggedIn])

  // ── Navigate helper (compatible with existing onNavigate prop calls) ──────────
  const handleNavigate = (newPage, category = '') => {
    const path = newPage === 'home' ? '/' : `/${newPage}`

    if (PROTECTED_PATHS.includes(path) && !isLoggedIn) {
      navigate('/login', { state: { from: path } })
      return
    }

    if (category) {
      navigate(`${path}?category=${encodeURIComponent(category)}`)
    } else {
      navigate(path)
    }
  }

  // ── Category filter updater (for Shop) ───────────────────────────────────────
  const handleSetCategory = useCallback((cat) => {
    const p = new URLSearchParams(location.search)
    if (cat) p.set('category', cat)
    else p.delete('category')
    navigate(`${location.pathname}?${p.toString()}`, { replace: true })
  }, [location.pathname, location.search, navigate])

  // ── Add to cart ──────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(async (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    if (isLoggedIn && product._backendProductId) {
      try {
        await cartAPI.addItem(product._backendProductId, 1)
      } catch (err) {
        console.warn('[Cart] Backend add failed:', err.message)
      }
    }
  }, [isLoggedIn])

  // ── Update quantity ──────────────────────────────────────────────────────────
  const handleUpdateQuantity = useCallback(async (id, change) => {
    let targetItem = null
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextQty = Math.max(1, item.quantity + change)
          targetItem = { ...item, quantity: nextQty }
          return targetItem
        }
        return item
      })
    )
    if (isLoggedIn && targetItem?._backendProductId) {
      try {
        const newQty = Math.max(1, (targetItem.quantity))
        await cartAPI.updateItem(targetItem._backendProductId, newQty)
      } catch (err) {
        console.warn('[Cart] Backend update failed:', err.message)
      }
    }
  }, [isLoggedIn])

  // ── Remove from cart ─────────────────────────────────────────────────────────
  const handleRemoveFromCart = useCallback(async (id) => {
    const item = cart.find(i => i.id === id)
    setCart(prev => prev.filter(i => i.id !== id))
    if (isLoggedIn && item?._backendProductId) {
      try {
        await cartAPI.removeItem(item._backendProductId)
      } catch (err) {
        console.warn('[Cart] Backend remove failed:', err.message)
      }
    }
  }, [cart, isLoggedIn])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)

  // ── Checkout complete ────────────────────────────────────────────────────────
  const handleCheckoutComplete = (orderData) => {
    setCompletedOrder(orderData)
    setCart([])
    setPaymentError(null)
    if (isLoggedIn) {
      cartAPI.clear().catch(() => {})
    }
    handleNavigate('order-success')
  }

  // ── Payment failed ────────────────────────────────────────────────────────────
  const handlePaymentFailed = (err) => {
    setPaymentError(err)
    handleNavigate('order-failure')
  }

  // ── Page routes ──────────────────────────────────────────────────────────────
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Home
            onNavigate={handleNavigate}
            activeCategory={activeCategory}
            cartCount={cartCount}
            onAddToCart={handleAddToCart}
          />
        }
      />
      <Route
        path="/shop"
        element={
          <Shop
            onNavigate={handleNavigate}
            activeCategory={activeCategory}
            setActiveCategory={handleSetCategory}
            cartCount={cartCount}
            onAddToCart={handleAddToCart}
          />
        }
      />
      <Route
        path="/cart"
        element={
          <Cart
            onNavigate={handleNavigate}
            activeCategory={activeCategory}
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onAddToCart={handleAddToCart}
          />
        }
      />
      <Route
        path="/checkout"
        element={
          isLoggedIn
            ? <Checkout onNavigate={handleNavigate} activeCategory={activeCategory} cart={cart} onCheckoutComplete={handleCheckoutComplete} onPaymentFailed={handlePaymentFailed} />
            : <Navigate to="/login" state={{ from: '/checkout' }} replace />
        }
      />
      <Route
        path="/order-success"
        element={
          completedOrder
            ? <OrderSuccess onNavigate={handleNavigate} activeCategory={activeCategory} orderData={completedOrder} />
            : <Navigate to="/" replace />
        }
      />
      <Route
        path="/order-failure"
        element={
          paymentError
            ? <OrderFailure onNavigate={handleNavigate} activeCategory={activeCategory} error={paymentError} />
            : <Navigate to="/" replace />
        }
      />
      <Route
        path="/tracking"
        element={
          <Tracking
            onNavigate={handleNavigate}
            activeCategory={activeCategory}
            completedOrder={completedOrder}
            onResetOrder={() => setCompletedOrder(null)}
          />
        }
      />
      <Route
        path="/orders"
        element={
          isLoggedIn
            ? <MyOrders onNavigate={handleNavigate} activeCategory={activeCategory} cartCount={cartCount} />
            : <Navigate to="/login" state={{ from: '/orders' }} replace />
        }
      />
      <Route
        path="/profile"
        element={
          isLoggedIn
            ? <Profile onNavigate={handleNavigate} activeCategory={activeCategory} />
            : <Navigate to="/login" state={{ from: '/profile' }} replace />
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
