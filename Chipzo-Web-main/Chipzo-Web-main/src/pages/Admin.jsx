import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Boxes, PlusCircle, ShoppingCart, Users, 
  Settings as SettingsIcon, LogOut, Search, Edit, Trash2, Plus, X, 
  Upload, AlertTriangle, CheckCircle2, Loader2, TrendingUp, 
  Coins, AlertCircle, ArrowUpRight, Globe, FileText, Sparkles,
  Download, Eye, ShoppingBag, Truck, CreditCard, ChevronRight, ChevronLeft
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { productsAPI, ordersAPI } from '../services/api.js'

const BACKEND_CATEGORIES = [
  'Battery', 'Battery Holder', 'Wire', 'Microcontroller',
  'Communication', 'Sensor', 'Display', 'Motor',
  'Robotics', 'Drone', 'Switch', 'Output',
  'Tool', 'Kit', 'Passive', 'IC',
]

export default function Admin() {
  const { user, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  // --- Route Guard ---
  if (!isLoggedIn || user?.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  // --- Primary State ---
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard', 'manage', 'add', 'orders', 'users', 'settings'
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  
  // --- Form / Edit State ---
  const [editingProduct, setEditingProduct] = useState(null) // null for adding, product object for editing
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Microcontroller',
    description: '',
    specifications: [], // array of { key: '', value: '' }
    imageMode: 'url',   // 'url' or 'upload'
    imageUrl: '',
    imageFile: null,
    imagePreview: '',
    isFeatured: false,
  })

  // --- UI feedback states ---
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null) // ID of product to delete
  const [toasts, setToasts] = useState([]) // array of { id, type, message }

  // --- Order Management States ---
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [orderTotalCount, setOrderTotalCount] = useState(0)
  const [orderCurrentPage, setOrderCurrentPage] = useState(1)
  const [orderTotalPages, setOrderTotalPages] = useState(1)
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null) // for details modal
  const [orderDeleteId, setOrderDeleteId] = useState(null) // for cancel/delete modal
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    revenue: 0
  })

  // --- Toast helper ---
  const showToast = (type, message) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4500)
  }

  // --- Fetch Products from API ---
  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const params = {
        page: currentPage,
        limit: 12,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
      }
      const data = await productsAPI.getAll(params)
      const raw = data?.data || data?.products || []
      setProducts(raw)
      setTotalPages(data?.pagination?.totalPages || 1)
      setTotalCount(data?.pagination?.totalCount || raw.length)
    } catch (err) {
      showToast('danger', err.message || 'Failed to sync database records.')
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchProducts()
    }
  }, [currentPage, categoryFilter, activeTab])

  // Triggers search fetch
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchProducts()
  }

  // --- Fetch Orders from API ---
  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      const params = {
        page: orderCurrentPage,
        limit: 10,
        ...(orderSearchQuery.trim() ? { search: orderSearchQuery.trim() } : {}),
        ...(orderStatusFilter ? { status: orderStatusFilter } : {}),
      }
      const data = await ordersAPI.adminGetAll(params)
      const raw = data?.data || data?.orders || []
      setOrders(raw)
      setOrderTotalPages(data?.pagination?.totalPages || 1)
      setOrderTotalCount(data?.pagination?.totalCount || raw.length)
    } catch (err) {
      showToast('danger', err.message || 'Failed to query client orders database.')
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [orderCurrentPage, orderStatusFilter, activeTab])

  const handleOrderSearchSubmit = (e) => {
    e.preventDefault()
    setOrderCurrentPage(1)
    fetchOrders()
  }

  // --- Fetch Global Stats & Telemetry ---
  const [stats, setStats] = useState({
    totalProductsCount: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    activeOrdersCount: 0
  })

  const loadDashboardStats = async () => {
    try {
      // 1. Fetch products stats
      const prodRes = await fetch('/api/products?limit=1000')
      const prodData = await prodRes.json()
      const allProds = prodData?.data || prodData?.products || []
      
      const totalProductsCount = allProds.length
      const totalStockValue = allProds.reduce((sum, item) => sum + ((item.price || 0) * (item.stock || 0)), 0)
      const lowStockCount = allProds.filter(item => (item.stock || 0) < 20).length

      // 2. Fetch orders stats
      const ordRes = await ordersAPI.adminGetAll({ limit: 1000 })
      const allOrds = ordRes?.data || ordRes?.orders || []
      
      const activeOrdersCount = allOrds.filter(o => o.deliveryStatus !== 'delivered' && o.paymentStatus !== 'failed').length
      const pendingOrders = allOrds.filter(o => o.paymentStatus === 'pending' || o.deliveryStatus !== 'delivered').length
      const deliveredOrders = allOrds.filter(o => o.deliveryStatus === 'delivered').length
      const revenue = allOrds.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0)

      setStats({
        totalProductsCount,
        totalStockValue,
        lowStockCount,
        activeOrdersCount
      })

      setOrderStats({
        totalOrders: allOrds.length,
        pendingOrders,
        deliveredOrders,
        revenue
      })
    } catch {
      // fallback
    }
  }

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardStats()
    }
  }, [activeTab])

  // --- Form Initialization & Specs Helpers ---
  const initForm = (prod = null) => {
    if (prod) {
      const specsArray = Object.entries(prod.specifications || {}).map(([k, v]) => ({ key: k, value: String(v) }))
      setFormData({
        name: prod.name || '',
        price: prod.price !== null ? String(prod.price) : '',
        stock: String(prod.stock || 0),
        category: prod.category || 'Microcontroller',
        description: prod.description || '',
        specifications: specsArray,
        imageMode: 'url',
        imageUrl: prod.images && prod.images.length > 0 ? prod.images[0] : '',
        imageFile: null,
        imagePreview: prod.images && prod.images.length > 0 ? prod.images[0] : '',
        isFeatured: prod.isFeatured || false,
      })
      setEditingProduct(prod)
      setActiveTab('add')
    } else {
      setFormData({
        name: '',
        price: '',
        stock: '',
        category: 'Microcontroller',
        description: '',
        specifications: [],
        imageMode: 'url',
        imageUrl: '',
        imageFile: null,
        imagePreview: '',
        isFeatured: false,
      })
      setEditingProduct(null)
    }
  }

  const handleAddSpecRow = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }))
  }

  const handleUpdateSpecRow = (index, field, val) => {
    setFormData(prev => {
      const updatedSpecs = [...prev.specifications]
      updatedSpecs[index][field] = val
      return { ...prev, specifications: updatedSpecs }
    })
  }

  const handleRemoveSpecRow = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }))
  }

  // --- Image Upload Handling ---
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      showToast('danger', 'Only JPG, PNG and WebP files are supported.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('danger', 'File size exceeds the maximum limit of 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result
      }))
    }
    reader.readAsDataURL(file)
  }

  // --- CRUD Submission handlers ---
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) return showToast('warning', 'Product Name is required.')
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      return showToast('warning', 'Valid Price is required.')
    }
    if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      return showToast('warning', 'Valid Stock Quantity is required.')
    }

    setSaving(true)
    try {
      const specsObj = {}
      formData.specifications.forEach(row => {
        if (row.key.trim() && row.value.trim()) {
          specsObj[row.key.trim()] = row.value.trim()
        }
      })

      const usesUpload = formData.imageMode === 'upload' && formData.imageFile
      
      let payload
      let headers = {}

      if (usesUpload) {
        const bodyFormData = new FormData()
        bodyFormData.append('name', formData.name.trim())
        bodyFormData.append('price', parseFloat(formData.price))
        bodyFormData.append('stock', parseInt(formData.stock, 10))
        bodyFormData.append('category', formData.category)
        bodyFormData.append('description', formData.description.trim())
        bodyFormData.append('specifications', JSON.stringify(specsObj))
        bodyFormData.append('isFeatured', formData.isFeatured)
        bodyFormData.append('images', formData.imageFile)
        
        const slug = formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
        bodyFormData.append('id', slug)

        payload = bodyFormData
      } else {
        const slug = formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
        const bodyJSON = {
          id: slug,
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
          category: formData.category,
          description: formData.description.trim(),
          specifications: specsObj,
          isFeatured: formData.isFeatured,
          images: formData.imageUrl.trim() ? [formData.imageUrl.trim()] : []
        }
        
        payload = JSON.stringify(bodyJSON)
        headers = { 'Content-Type': 'application/json' }
      }

      const token = localStorage.getItem('chipzo_token')
      headers['Authorization'] = `Bearer ${token}`

      let res
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct._id}`, {
          method: 'PUT',
          headers,
          body: payload
        })
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers,
          body: payload
        })
      }

      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData?.message || 'Server returned an error status.')
      }

      showToast('success', editingProduct ? 'Product details updated successfully!' : 'New product initialized and registered!')
      initForm()
      setActiveTab('manage')
      setCurrentPage(1)
      fetchProducts()
    } catch (err) {
      showToast('danger', err.message || 'Transmission failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return
    try {
      const token = localStorage.getItem('chipzo_token')
      const res = await fetch(`/api/products/${deletingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData?.message || 'Could not verify deletion access.')
      }

      showToast('success', 'Product permanently purged from catalog.')
      setDeletingId(null)
      fetchProducts()
    } catch (err) {
      showToast('danger', err.message || 'Deletion operation aborted.')
      setDeletingId(null)
    }
  }

  // --- Order CRUD Actions ---
  const handleUpdateOrderStatus = async (orderId, updates) => {
    setUpdatingStatusId(orderId)
    try {
      const data = await ordersAPI.adminUpdate(orderId, updates)
      showToast('success', 'Order state updated successfully.')
      
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, ...data.data.order }))
      }
      
      fetchOrders()
    } catch (err) {
      showToast('danger', err.message || 'Failed to modify order parameters.')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const handleDeleteOrderConfirm = async () => {
    if (!orderDeleteId) return
    try {
      await ordersAPI.adminDelete(orderDeleteId)
      showToast('success', 'Order has been permanently deleted/cancelled.')
      setOrderDeleteId(null)
      setSelectedOrder(null)
      fetchOrders()
    } catch (err) {
      showToast('danger', err.message || 'Order cancellation aborted.')
      setOrderDeleteId(null)
    }
  }

  // --- Invoice Export/Download & CSV Helpers ---
  const handleExportOrdersCSV = () => {
    if (orders.length === 0) return showToast('warning', 'No active order logs loaded to export.')
    
    const headers = ['Order Reference ID', 'Customer Name', 'Phone Contact', 'Creation Date', 'Products Sum', 'Cumulative Amount (INR)', 'Payment Mode', 'Payment Clearance', 'Logistics Delivery']
    const rows = orders.map(o => [
      o._id,
      o.address.fullName,
      o.address.phone,
      new Date(o.createdAt).toLocaleString(),
      o.items.length,
      o.totalAmount,
      o.paymentMethod.toUpperCase(),
      o.paymentStatus.toUpperCase(),
      o.deliveryStatus.toUpperCase()
    ])
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `chipzo_orders_telemetry_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('success', 'Full orders telemetry exported to CSV!')
  }

  const handleDownloadInvoiceTxt = (order) => {
    const dateStr = new Date(order.createdAt).toLocaleString()
    const itemsText = order.items.map((item, idx) => 
      `${String(idx + 1).padStart(2, '0')}. ${item.name.toUpperCase()}\n    QTY: ${item.quantity} units | PRICE: ₹${item.price.toFixed(2)} | SUB: ₹${(item.price * item.quantity).toFixed(2)}`
    ).join('\n\n')
    
    const invoiceText = `
========================================================================
                         CHIPZO SYSTEMS INDIA                           
                    OFFICIAL ORDER INVOICE SLIP                         
========================================================================
Order Reference ID:  ${order._id}
Date & Time Issued:  ${dateStr}
Payment Protocol:    ${order.paymentMethod.toUpperCase()}
Payment Clearance:  ${order.paymentStatus.toUpperCase()}
Logistics Status:   ${order.deliveryStatus.toUpperCase()}
Tracking Code:       ${order.deliveryTrackingId || 'VOLTEX-NOT-ASSIGNED'}
------------------------------------------------------------------------
SHIPPING AND CONTACT DIRECTORY:
------------------------------------------------------------------------
Name:     ${order.address.fullName}
Phone:    ${order.address.phone}
Address:  ${order.address.street},
          ${order.address.city}, ${order.address.state} - ${order.address.pincode}
------------------------------------------------------------------------
BILL OF MATERIALS:
------------------------------------------------------------------------
${itemsText}
------------------------------------------------------------------------
FINANCIAL AUDIT:
------------------------------------------------------------------------
COMPONENTS VALUE:     ₹${order.totalAmount.toFixed(2)}
SHIPPING CHARGE:     ₹0.00 [FREE MAKER PROMO]
------------------------------------------------------------------------
TOTAL OUTFLOW:        ₹${order.totalAmount.toFixed(2)} INR
========================================================================
               CHIPZO RETAILS — ENGINEERED FOR MAKERS                   
                 SUPPORT DECENTRALIZED ENGINEERING                      
========================================================================
`

    const blob = new Blob([invoiceText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `chipzo_invoice_${order._id.slice(-6).toUpperCase()}.txt`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('success', 'Plaintext print invoice slip downloaded!')
  }

  return (
    <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)] flex flex-col lg:flex-row relative">
      
      {/* ===== SIDEBAR NAVIGATION ===== */}
      <aside className="w-full lg:w-72 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b-[3px] border-[color:var(--chipzo-paper)] flex items-center justify-between">
            <div className="inline-flex border-[2px] border-[color:var(--chipzo-lime)] bg-[color:var(--chipzo-paper)] px-3 py-1 text-lg font-black tracking-[-0.08em] text-[color:var(--chipzo-ink)] shadow-[3px_3px_0_var(--chipzo-lime)]">
              CHIPZO_SYS
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--chipzo-lime)] border border-[color:var(--chipzo-lime)] px-1.5 py-0.5 animate-pulse">
              ADMIN v1.0
            </span>
          </div>

          {/* Current User Session Status Card */}
          <div className="m-4 p-4 border-[2px] border-[color:var(--chipzo-rule)]/30 bg-[color:var(--chipzo-paper)]/10 text-xs font-bold uppercase tracking-wider">
            <p className="text-[9px] text-[color:var(--chipzo-muted)]">Active Terminal</p>
            <p className="text-[color:var(--chipzo-lime)] font-black text-sm mt-0.5">{user?.name || 'System Administrator'}</p>
            <p className="text-[10px] mt-1 text-[color:var(--chipzo-paper)]/60 select-all">{user?.email}</p>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-[0.15em] border-[2px] transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-[color:var(--chipzo-lime)] bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] shadow-[3px_3px_0_var(--chipzo-paper)] translate-x-[-2px] translate-y-[-2px]'
                  : 'border-transparent hover:border-[color:var(--chipzo-rule)] hover:bg-[color:var(--chipzo-paper)]/5 text-[color:var(--chipzo-paper)]'
              }`}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>

            <button
              onClick={() => { setActiveTab('manage'); setCurrentPage(1); fetchProducts() }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-[0.15em] border-[2px] transition-all cursor-pointer ${
                activeTab === 'manage'
                  ? 'border-[color:var(--chipzo-lime)] bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] shadow-[3px_3px_0_var(--chipzo-paper)] translate-x-[-2px] translate-y-[-2px]'
                  : 'border-transparent hover:border-[color:var(--chipzo-rule)] hover:bg-[color:var(--chipzo-paper)]/5 text-[color:var(--chipzo-paper)]'
              }`}
            >
              <Boxes size={16} /> Manage Products
            </button>

            <button
              onClick={() => { initForm(); setActiveTab('add') }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-[0.15em] border-[2px] transition-all cursor-pointer ${
                activeTab === 'add'
                  ? 'border-[color:var(--chipzo-lime)] bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] shadow-[3px_3px_0_var(--chipzo-paper)] translate-x-[-2px] translate-y-[-2px]'
                  : 'border-transparent hover:border-[color:var(--chipzo-rule)] hover:bg-[color:var(--chipzo-paper)]/5 text-[color:var(--chipzo-paper)]'
              }`}
            >
              <PlusCircle size={16} /> {editingProduct ? 'Edit Product' : 'Add New Product'}
            </button>

            <button
              onClick={() => { setActiveTab('orders'); setOrderCurrentPage(1); fetchOrders() }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-[0.15em] border-[2px] transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-[color:var(--chipzo-lime)] bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] shadow-[3px_3px_0_var(--chipzo-paper)] translate-x-[-2px] translate-y-[-2px]'
                  : 'border-transparent hover:border-[color:var(--chipzo-rule)] hover:bg-[color:var(--chipzo-paper)]/5 text-[color:var(--chipzo-paper)]'
              }`}
            >
              <ShoppingCart size={16} /> Order Logistics
            </button>

            <div className="pt-4 border-t border-[color:var(--chipzo-rule)]/10 space-y-1">
              <p className="px-4 text-[9px] font-black tracking-widest text-[color:var(--chipzo-muted)] uppercase mb-2">FUTURE EXPANSIONS</p>
              
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] border-[2px] transition-all ${
                  activeTab === 'users'
                    ? 'border-[color:var(--chipzo-primary)] bg-[color:var(--chipzo-primary)] text-[color:var(--chipzo-paper)]'
                    : 'border-transparent opacity-50 hover:opacity-90 hover:bg-[color:var(--chipzo-paper)]/5 text-[color:var(--chipzo-paper)]'
                }`}
              >
                <span className="flex items-center gap-3"><Users size={14} /> Users</span>
                <span className="text-[8px] border border-dashed border-white/40 px-1 py-0.5">DEV</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] border-[2px] transition-all ${
                  activeTab === 'settings'
                    ? 'border-[color:var(--chipzo-primary)] bg-[color:var(--chipzo-primary)] text-[color:var(--chipzo-paper)]'
                    : 'border-transparent opacity-50 hover:opacity-90 hover:bg-[color:var(--chipzo-paper)]/5 text-[color:var(--chipzo-paper)]'
                }`}
              >
                <span className="flex items-center gap-3"><SettingsIcon size={14} /> Settings</span>
                <span className="text-[8px] border border-dashed border-white/40 px-1 py-0.5">DEV</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer Operations */}
        <div className="p-4 border-t-[3px] border-[color:var(--chipzo-paper)]/20">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 border-[2px] border-[color:var(--chipzo-paper)] bg-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-paper)] hover:text-[color:var(--chipzo-ink)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition-colors mb-2 cursor-pointer"
          >
            <Globe size={14} /> Live Storefront
          </button>
          
          <button
            onClick={() => { logout(); navigate('/') }}
            className="w-full flex items-center justify-center gap-2 border-[2px] border-[color:var(--chipzo-primary)] hover:bg-[color:var(--chipzo-primary)] hover:text-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[color:var(--chipzo-primary)] transition-colors cursor-pointer"
          >
            <LogOut size={14} /> Terminate Auth
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT WORKSPACE ===== */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl overflow-x-hidden">
        
        {/* Header Ribbon bar */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b-[3px] border-[color:var(--chipzo-ink)] pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-[color:var(--chipzo-ink)]">
              {activeTab === 'dashboard' && 'SYSTEM_OVERVIEW'}
              {activeTab === 'manage' && 'PRODUCT_CATALOG_MANAGEMENT'}
              {activeTab === 'add' && (editingProduct ? 'EDIT_PRODUCT_RECORDS' : 'ADD_NEW_COMPONENT')}
              {activeTab === 'orders' && 'ORDER_LOGISTICS_STATION'}
              {activeTab === 'users' && 'USER_DIRECTORY_STATION'}
              {activeTab === 'settings' && 'SYSTEM_CONFIG_DASHBOARD'}
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mt-1.5">
              {activeTab === 'dashboard' && 'Live diagnostic metrics and active inventory indicators.'}
              {activeTab === 'manage' && 'Register, edit, or purge components from global index.'}
              {activeTab === 'add' && 'Provide parameters, images, and technical specs.'}
              {activeTab === 'orders' && 'Supervise dynamic payment clearing and logistics tracking.'}
              {activeTab === 'users' && 'Inspect credential directories and client access list.'}
              {activeTab === 'settings' && 'Adjust API base routing and delivery mode toggles.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)] px-3 py-1.5">
              LOCAL_DB &gt; ONLINE
            </span>
          </div>
        </header>

        {/* ===== VIEW: 1. DASHBOARD OVERVIEW ===== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* diagnostic overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-6 shadow-[4px_4px_0_var(--chipzo-ink)] flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">ACTIVE CATALOG</p>
                  <h3 className="text-4xl font-black mt-2">{stats.totalProductsCount}</h3>
                  <p className="text-[10px] font-semibold text-[color:var(--chipzo-ink)] mt-2 inline-flex items-center gap-1">
                    <Boxes size={12} /> Live Components
                  </p>
                </div>
                <div className="bg-[color:var(--chipzo-lime)] border-[2px] border-[color:var(--chipzo-ink)] p-2">
                  <Boxes size={20} />
                </div>
              </div>

              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-6 shadow-[4px_4px_0_var(--chipzo-ink)] flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">STOCK CASH VAL</p>
                  <h3 className="text-4xl font-black mt-2">₹{stats.totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                  <p className="text-[10px] font-semibold text-[color:var(--chipzo-ink)] mt-2 inline-flex items-center gap-1">
                    <Coins size={12} /> Dynamic asset sum
                  </p>
                </div>
                <div className="bg-[color:var(--chipzo-primary)] border-[2px] border-[color:var(--chipzo-ink)] p-2 text-white">
                  <Coins size={20} />
                </div>
              </div>

              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-6 shadow-[4px_4px_0_var(--chipzo-ink)] flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">LOW_STOCK ITEMS</p>
                  <h3 className="text-4xl font-black mt-2 text-[color:var(--chipzo-primary)]">{stats.lowStockCount}</h3>
                  <p className="text-[10px] font-semibold text-[color:var(--chipzo-muted)] mt-2 inline-flex items-center gap-1">
                    <AlertTriangle size={12} /> Less than 20 units
                  </p>
                </div>
                <div className="bg-[color:var(--chipzo-paper)] border-[2px] border-[color:var(--chipzo-ink)] p-2">
                  <AlertTriangle size={20} className="text-[color:var(--chipzo-primary)]" />
                </div>
              </div>

              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-6 shadow-[4px_4px_0_var(--chipzo-ink)] flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">ACTIVE SHIPMENTS</p>
                  <h3 className="text-4xl font-black mt-2">{stats.activeOrdersCount}</h3>
                  <p className="text-[10px] font-semibold text-[color:var(--chipzo-ink)] mt-2 inline-flex items-center gap-1">
                    <Truck size={12} /> Pending deliveries
                  </p>
                </div>
                <div className="bg-[color:var(--chipzo-lime)] border-[2px] border-[color:var(--chipzo-ink)] p-2">
                  <Truck size={20} />
                </div>
              </div>

            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
              
              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-6 shadow-[6px_6px_0_var(--chipzo-ink)]">
                <h3 className="text-lg font-black uppercase tracking-wide border-b-[2px] border-[color:var(--chipzo-ink)] pb-3 mb-4">
                  OPERATIONAL QUICK LAUNCH
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <button
                    onClick={() => { initForm(); setActiveTab('add') }}
                    className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--chipzo-ink)] transition-all p-5 text-left active:translate-y-0 shadow-[1px_1px_0_var(--chipzo-ink)] group cursor-pointer animate-fadeIn"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)] text-[8px] font-black uppercase px-2 py-0.5">LAUNCH PROCESS</span>
                      <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                    <h4 className="font-black text-sm uppercase tracking-wider">Initialize New Product</h4>
                    <p className="text-[10px] font-medium text-[color:var(--chipzo-muted)] mt-1">Register a fresh component card with specs and stocks.</p>
                  </button>

                  <button
                    onClick={() => { setActiveTab('orders'); setOrderCurrentPage(1); fetchOrders() }}
                    className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--chipzo-ink)] transition-all p-5 text-left active:translate-y-0 shadow-[1px_1px_0_var(--chipzo-ink)] group cursor-pointer animate-fadeIn"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)] text-[8px] font-black uppercase px-2 py-0.5">LOGISTICS MANAGER</span>
                      <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                    <h4 className="font-black text-sm uppercase tracking-wider">Inspect Client Orders</h4>
                    <p className="text-[10px] font-medium text-[color:var(--chipzo-muted)] mt-1">Review active transactions, payments, invoices, and trigger tracking statuses.</p>
                  </button>

                </div>
              </div>

              {/* System Diagnostic Status Board */}
              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-paper)] p-6 shadow-[6px_6px_0_var(--chipzo-ink)]">
                <h3 className="text-lg font-black uppercase tracking-wide border-b-[2px] border-[color:var(--chipzo-paper)] pb-3 mb-4 text-[color:var(--chipzo-lime)]">
                  TERMINAL DIAGNOSTICS
                </h3>
                <div className="space-y-3 font-mono text-[10px] tracking-wider uppercase">
                  <div className="flex justify-between">
                    <span>DATABASE:</span>
                    <span className="text-[color:var(--chipzo-lime)]">CONNECTED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DB ENGINE:</span>
                    <span>MONGODB DRIVER v8.4.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SEEDED ITEMS:</span>
                    <span>217 COMPLETED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SECURITY PARADIGM:</span>
                    <span className="text-[color:var(--chipzo-lime)]">MOCK_JWT_BYPASS_ON</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MOCK PAYMENT:</span>
                    <span className="text-[color:var(--chipzo-lime)]">ROUTED_ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MOCK SHIPPERS:</span>
                    <span className="text-[color:var(--chipzo-lime)]">SIMULATION_READY</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===== VIEW: 2. MANAGE PRODUCTS (CRUD INDEX) ===== */}
        {activeTab === 'manage' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Search, Filter & Catalog Control Strip */}
            <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-4 shadow-[4px_4px_0_var(--chipzo-ink)] flex flex-col md:flex-row gap-4 justify-between items-stretch">
              
              <form onSubmit={handleSearchSubmit} className="flex flex-1 items-stretch max-w-lg brutal-border">
                <input
                  type="text"
                  placeholder="SEARCH CATALOG BY NAME..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent px-3 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none placeholder:text-[color:var(--chipzo-muted)]"
                />
                <button
                  type="submit"
                  className="bg-[color:var(--chipzo-ink)] text-white px-4 flex items-center justify-center cursor-pointer transition-colors hover:bg-[color:var(--chipzo-primary)]"
                >
                  <Search size={14} />
                </button>
              </form>

              <div className="flex items-center gap-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
                  className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-black uppercase tracking-wider focus:outline-none"
                >
                  <option value="">ALL CATEGORIES</option>
                  {BACKEND_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </select>

                <button
                  onClick={() => { initForm(); setActiveTab('add') }}
                  className="flex items-center gap-2 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] hover:-translate-y-0.5 active:translate-y-0 px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_var(--chipzo-ink)] cursor-pointer"
                >
                  <Plus size={14} /> CREATE RECORD
                </button>
              </div>

            </div>

            {/* Table Catalog Grid */}
            <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[6px_6px_0_var(--chipzo-ink)] overflow-x-auto">
              {loadingProducts ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-[color:var(--chipzo-primary)] mb-3" size={32} />
                  <p className="text-xs font-black uppercase tracking-[0.16em]">Querying Database Indexes...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="py-20 text-center">
                  <AlertCircle className="mx-auto text-[color:var(--chipzo-primary)] mb-3" size={32} />
                  <h4 className="font-black text-lg uppercase tracking-wide">No Records Identified</h4>
                  <p className="text-xs text-[color:var(--chipzo-muted)] mt-1">Refine your query parameters or initialize a fresh record.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[color:var(--chipzo-ink)] text-white text-[10px] font-black uppercase tracking-[0.15em] border-b-[3px] border-[color:var(--chipzo-ink)]">
                      <th className="p-3 w-16 text-center">Preview</th>
                      <th className="p-3">Product Identifier</th>
                      <th className="p-3 w-40">Category</th>
                      <th className="p-3 w-28">Price (Unit)</th>
                      <th className="p-3 w-24">Stock</th>
                      <th className="p-3 w-28">Featured</th>
                      <th className="p-3 w-24 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-[2px] divide-[color:var(--chipzo-rule)] bg-[color:var(--chipzo-paper)] text-xs">
                    {products.map(prod => (
                      <tr key={prod._id} className="hover:bg-[color:var(--chipzo-surface)] transition-colors">
                        
                        <td className="p-3 flex items-center justify-center">
                          <div className="h-10 w-10 border-2 border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] overflow-hidden shrink-0 flex items-center justify-center">
                            {prod.images && prod.images.length > 0 ? (
                              <img src={prod.images[0]} alt="" className="object-cover h-full w-full" />
                            ) : (
                              <div className="text-[8px] font-black uppercase tracking-wider text-[color:var(--chipzo-muted)]">N/A</div>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <p className="font-black text-sm uppercase text-[color:var(--chipzo-ink)]">{prod.name}</p>
                          <p className="font-mono text-[9px] text-[color:var(--chipzo-muted)] mt-0.5 select-all">{prod.id || prod._id}</p>
                        </td>

                        <td className="p-3 font-bold uppercase tracking-wider text-[color:var(--chipzo-muted)]">
                          {prod.category}
                        </td>

                        <td className="p-3 font-black text-sm tabular-prices text-[color:var(--chipzo-primary)]">
                          ₹{(prod.price || 0).toFixed(2)}
                        </td>

                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 border ${
                            prod.stock <= 10
                              ? 'border-[color:var(--chipzo-primary)] text-[color:var(--chipzo-primary)] bg-[color:var(--chipzo-primary)]/5 font-black'
                              : 'border-[color:var(--chipzo-rule)] text-[color:var(--chipzo-ink)]'
                          }`}>
                            {prod.stock || 0} U
                          </span>
                        </td>

                        <td className="p-3 font-bold">
                          {prod.isFeatured ? (
                            <span className="text-[9px] font-black uppercase bg-[color:var(--chipzo-lime)] border border-[color:var(--chipzo-ink)] text-[color:var(--chipzo-ink)] px-2 py-0.5">
                              YES
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium uppercase tracking-widest text-[color:var(--chipzo-muted)]">
                              NO
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => initForm(prod)}
                              className="p-1.5 border-2 border-[color:var(--chipzo-ink)] bg-white hover:bg-[color:var(--chipzo-lime)] transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => setDeletingId(prod._id)}
                              className="p-1.5 border-2 border-[color:var(--chipzo-ink)] bg-white hover:bg-[color:var(--chipzo-primary)] hover:text-white transition-colors cursor-pointer"
                              title="Purge Record"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Control board */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] hover:bg-[color:var(--chipzo-ink)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-black uppercase"
                >
                  PREV
                </button>
                <span className="text-xs font-mono font-black px-4 uppercase">
                  PAGE {currentPage} OF {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] hover:bg-[color:var(--chipzo-ink)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-black uppercase"
                >
                  NEXT
                </button>
              </div>
            )}

          </div>
        )}

        {/* ===== VIEW: 3. ADD / EDIT PRODUCT FORM ===== */}
        {activeTab === 'add' && (
          <form onSubmit={handleFormSubmit} className="space-y-8 animate-fadeIn">
            
            <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[6px_6px_0_var(--chipzo-ink)] p-6 space-y-6">
              
              <div className="border-b-[2px] border-[color:var(--chipzo-ink)] pb-4 flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-wider text-[color:var(--chipzo-ink)]">
                  {editingProduct ? 'MODIFYING_EXISTING_RECORD' : 'NEW_COMPONENT_REGISTRATION'}
                </h3>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => { initForm(); setActiveTab('manage') }}
                    className="text-xs font-black uppercase tracking-wider text-[color:var(--chipzo-primary)] hover:underline"
                  >
                    CANCEL_EDIT
                  </button>
                )}
              </div>

              {/* Component Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] mb-1">
                    Component / Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Arduino Nano 33 IoT"
                    className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] focus:shadow-[3px_3px_0_var(--chipzo-ink)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] mb-1">
                    Inventory Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] focus:shadow-[3px_3px_0_var(--chipzo-ink)] transition-all"
                  >
                    {BACKEND_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] mb-1">
                    Price (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. 450.00"
                    className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2.5 text-xs font-bold tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] focus:shadow-[3px_3px_0_var(--chipzo-ink)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] mb-1">
                    Initial Stock Count *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="e.g. 50"
                    className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2.5 text-xs font-bold tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] focus:shadow-[3px_3px_0_var(--chipzo-ink)] transition-all"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 cursor-pointer group py-2">
                    <div className="relative flex items-center justify-center w-6 h-6 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] group-hover:bg-[color:var(--chipzo-lime)] transition-colors">
                      <input 
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="peer absolute opacity-0 w-full h-full cursor-pointer"
                      />
                      <div className={formData.isFeatured ? "w-3.5 h-3.5 bg-[color:var(--chipzo-ink)] animate-scaleIn" : "hidden"} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)]">
                      Featured component card
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] mb-1">
                  Product / Component Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe technical utility, pins, layout boundaries, and prototyping guidelines..."
                  rows={4}
                  className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2.5 text-xs font-medium tracking-wide text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] focus:shadow-[3px_3px_0_var(--chipzo-ink)] transition-all"
                />
              </div>

              {/* Graphic Media Setup */}
              <div className="border-[2px] border-dashed border-[color:var(--chipzo-rule)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)]">Graphic / Media Asset Option</p>
                  
                  <div className="flex border-[2px] border-[color:var(--chipzo-ink)] overflow-hidden text-[9px] font-black uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageMode: 'url' }))}
                      className={`px-3 py-1 cursor-pointer transition-colors ${formData.imageMode === 'url' ? 'bg-[color:var(--chipzo-ink)] text-white' : 'bg-white text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-surface)]'}`}
                    >
                      Paste Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageMode: 'upload' }))}
                      className={`px-3 py-1 cursor-pointer transition-colors ${formData.imageMode === 'upload' ? 'bg-[color:var(--chipzo-ink)] text-white' : 'bg-white text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-surface)]'}`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-center">
                  <div>
                    {formData.imageMode === 'url' ? (
                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">
                          IMAGE URL PATH
                        </label>
                        <input
                          type="url"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value, imagePreview: e.target.value }))}
                          placeholder="https://images.unsplash.com/photo-... or other CDN link"
                          className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2 text-xs font-bold text-[color:var(--chipzo-ink)] outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">
                          UPLOAD IMAGE FILE
                        </label>
                        <div className="relative border-[3px] border-dashed border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] hover:bg-[color:var(--chipzo-surface)] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <Upload size={24} className="text-[color:var(--chipzo-muted)] mb-2" />
                          <p className="text-[10px] font-black uppercase">
                            {formData.imageFile ? formData.imageFile.name : 'Select or Drag Image file here'}
                          </p>
                          <p className="text-[8px] font-medium text-[color:var(--chipzo-muted)] mt-1">JPEG, PNG or WebP — Max size: 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1.5">Asset Preview</p>
                    <div className="h-28 w-28 border-[3px] border-[color:var(--chipzo-ink)] shadow-[3px_3px_0_var(--chipzo-ink)] bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {formData.imagePreview ? (
                        <img src={formData.imagePreview} alt="Preview" className="object-cover h-full w-full" />
                      ) : (
                        <div className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)] text-center p-3">NO GRAPHIC PREVIEW</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Flexible Specifications Manager */}
              <div className="border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-wider text-[color:var(--chipzo-ink)]">Technical Specifications</h4>
                    <p className="text-[9px] text-[color:var(--chipzo-muted)] font-bold mt-0.5">Flexible parameters (e.g. Voltage, Chemistry, Frequency, Flash size)</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="flex items-center gap-1.5 border-[2px] border-[color:var(--chipzo-ink)] bg-white px-3 py-1 text-[9px] font-black uppercase hover:bg-[color:var(--chipzo-lime)] shadow-[1px_1px_0_var(--chipzo-ink)] active:translate-y-[1px] cursor-pointer"
                  >
                    <Plus size={12} /> ADD ROW
                  </button>
                </div>

                {formData.specifications.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-[color:var(--chipzo-rule)] text-[10px] font-bold text-[color:var(--chipzo-muted)] uppercase">
                    No custom specifications loaded. Add specs to enable advanced filtering.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-2">
                    {formData.specifications.map((row, index) => (
                      <div key={index} className="flex gap-3 items-center animate-fadeIn">
                        
                        <input
                          type="text"
                          required
                          value={row.key}
                          onChange={(e) => handleUpdateSpecRow(index, 'key', e.target.value)}
                          placeholder="KEY (e.g. Voltage)"
                          className="flex-1 border-[2px] border-[color:var(--chipzo-ink)] bg-white px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider"
                        />

                        <input
                          type="text"
                          required
                          value={row.value}
                          onChange={(e) => handleUpdateSpecRow(index, 'value', e.target.value)}
                          placeholder="VALUE (e.g. 3.7V / ESP32)"
                          className="flex-1 border-[2px] border-[color:var(--chipzo-ink)] bg-white px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveSpecRow(index)}
                          className="p-2 border-[2px] border-[color:var(--chipzo-ink)] bg-white text-[color:var(--chipzo-primary)] hover:bg-[color:var(--chipzo-primary)] hover:text-white transition-colors cursor-pointer"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Submission Actions Row */}
              <div className="border-t-[2px] border-[color:var(--chipzo-ink)] pt-6 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => { initForm(); setActiveTab('manage') }}
                  className="border-[3px] border-[color:var(--chipzo-ink)] bg-white px-6 py-3 text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  CANCEL &amp; LIST
                </button>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] px-8 py-3 text-xs font-black uppercase tracking-widest shadow-[3px_3px_0_var(--chipzo-ink)] transition-all hover:-translate-y-[2px] hover:shadow-[5px_5px_0_var(--chipzo-ink)] active:translate-y-0 active:shadow-none flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> TRANSMITTING...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> {editingProduct ? 'COMMIT CHANGES →' : 'REGISTER PRODUCT →'}
                    </>
                  )}
                </button>
              </div>

            </div>

          </form>
        )}

        {/* ===== VIEW: 4. ORDER LOGISTICS STATION (LIVE CRUD) ===== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Order Analytics Summary telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-5 shadow-[4px_4px_0_var(--chipzo-ink)] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">SYSTEM ORDERS</p>
                  <h3 className="text-3xl font-black mt-1.5">{orderStats.totalOrders}</h3>
                  <p className="text-[9px] font-bold text-[color:var(--chipzo-ink)] mt-1">Full life-cycle count</p>
                </div>
                <div className="bg-[color:var(--chipzo-lime)] border-[2px] border-[color:var(--chipzo-ink)] p-2">
                  <ShoppingBag size={18} />
                </div>
              </div>

              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-5 shadow-[4px_4px_0_var(--chipzo-ink)] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">ACTIVE DISPATCHES</p>
                  <h3 className="text-3xl font-black mt-1.5 text-[color:var(--chipzo-primary)]">{orderStats.pendingOrders}</h3>
                  <p className="text-[9px] font-bold text-[color:var(--chipzo-muted)] mt-1">Pending or In-Transit</p>
                </div>
                <div className="bg-[color:var(--chipzo-paper)] border-[2px] border-[color:var(--chipzo-ink)] p-2">
                  <Truck size={18} className="text-[color:var(--chipzo-primary)]" />
                </div>
              </div>

              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-5 shadow-[4px_4px_0_var(--chipzo-ink)] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">FULFILLED ORDERS</p>
                  <h3 className="text-3xl font-black mt-1.5">{orderStats.deliveredOrders}</h3>
                  <p className="text-[9px] font-bold text-[color:var(--chipzo-lime)] mt-1">Delivered successfully</p>
                </div>
                <div className="bg-[color:var(--chipzo-lime)] border-[2px] border-[color:var(--chipzo-ink)] p-2">
                  <CheckCircle2 size={18} />
                </div>
              </div>

              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-5 shadow-[4px_4px_0_var(--chipzo-ink)] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">AUDITED REVENUE</p>
                  <h3 className="text-3xl font-black mt-1.5 text-[color:var(--chipzo-ink)]">₹{orderStats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                  <p className="text-[9px] font-bold text-[color:var(--chipzo-lime)] mt-1">Paid standard orders only</p>
                </div>
                <div className="bg-[color:var(--chipzo-primary)] border-[2px] border-[color:var(--chipzo-ink)] p-2 text-white">
                  <Coins size={18} />
                </div>
              </div>

            </div>

            {/* Filter controls and Search Bar */}
            <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-4 shadow-[4px_4px_0_var(--chipzo-ink)] flex flex-col md:flex-row gap-4 justify-between items-stretch">
              
              <form onSubmit={handleOrderSearchSubmit} className="flex flex-1 items-stretch max-w-lg brutal-border">
                <input
                  type="text"
                  placeholder="SEARCH BY NAME, ID, OR CONTACT..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent px-3 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none placeholder:text-[color:var(--chipzo-muted)]"
                />
                <button
                  type="submit"
                  className="bg-[color:var(--chipzo-ink)] text-white px-4 flex items-center justify-center cursor-pointer transition-colors hover:bg-[color:var(--chipzo-primary)]"
                >
                  <Search size={14} />
                </button>
              </form>

              <div className="flex items-center gap-3">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => { setOrderStatusFilter(e.target.value); setOrderCurrentPage(1) }}
                  className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-black uppercase tracking-wider focus:outline-none"
                >
                  <option value="">ALL STATUSES</option>
                  <option value="pending">PAYMENT: PENDING</option>
                  <option value="paid">PAYMENT: PAID</option>
                  <option value="failed">PAYMENT: FAILED</option>
                  <option value="not_assigned">SHIPPING: UNASSIGNED</option>
                  <option value="assigned">SHIPPING: ASSIGNED</option>
                  <option value="in_transit">SHIPPING: IN TRANSIT</option>
                  <option value="delivered">SHIPPING: DELIVERED</option>
                </select>

                <button
                  onClick={handleExportOrdersCSV}
                  className="flex items-center gap-2 border-[3px] border-[color:var(--chipzo-ink)] bg-white hover:bg-[color:var(--chipzo-lime)] px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_var(--chipzo-ink)] cursor-pointer active:translate-y-0"
                >
                  <Download size={14} /> EXPORT CSV
                </button>
              </div>

            </div>

            {/* Orders Listing Grid Table */}
            <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[6px_6px_0_var(--chipzo-ink)] overflow-x-auto">
              {loadingOrders ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-[color:var(--chipzo-primary)] mb-3" size={32} />
                  <p className="text-xs font-black uppercase tracking-[0.16em]">Syncing Logistics database...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-20 text-center bg-[color:var(--chipzo-paper)]">
                  <AlertCircle className="mx-auto text-[color:var(--chipzo-primary)] mb-3" size={32} />
                  <h4 className="font-black text-lg uppercase tracking-wide">No Active Orders Registered</h4>
                  <p className="text-xs text-[color:var(--chipzo-muted)] mt-1">No orders match your search coordinates.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-[color:var(--chipzo-ink)] text-white text-[10px] font-black uppercase tracking-[0.15em] border-b-[3px] border-[color:var(--chipzo-ink)]">
                      <th className="p-4">Reference ID</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Date / Time</th>
                      <th className="p-4">Components</th>
                      <th className="p-4">Total Price</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Logistics</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-[2px] divide-[color:var(--chipzo-rule)] bg-[color:var(--chipzo-paper)] text-xs">
                    {orders.map(order => (
                      <tr key={order._id} className="hover:bg-[color:var(--chipzo-surface)] transition-colors">
                        
                        <td className="p-4 font-mono font-black text-[11px] text-[color:var(--chipzo-ink)] select-all">
                          {order._id}
                        </td>

                        <td className="p-4">
                          <p className="font-black text-sm uppercase">{order.address?.fullName}</p>
                          <p className="text-[10px] text-[color:var(--chipzo-muted)] font-bold mt-0.5">{order.address?.phone}</p>
                        </td>

                        <td className="p-4 text-[10px] font-bold text-[color:var(--chipzo-muted)] uppercase">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 border border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] font-black">
                            {order.items?.length || 0} items
                          </span>
                        </td>

                        <td className="p-4 font-black text-sm tabular-prices text-[color:var(--chipzo-primary)]">
                          ₹{order.totalAmount?.toFixed(2)}
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 border uppercase ${
                              order.paymentStatus === 'paid' ? 'bg-[color:var(--chipzo-lime)] border-[color:var(--chipzo-ink)] text-[color:var(--chipzo-ink)]' :
                              order.paymentStatus === 'pending' ? 'bg-[color:var(--chipzo-primary)] border-[color:var(--chipzo-ink)] text-white' :
                              'bg-red-600 border-[color:var(--chipzo-ink)] text-white'
                            }`}>
                              {order.paymentStatus}
                            </span>
                            <span className="text-[8px] font-bold text-[color:var(--chipzo-muted)] uppercase leading-none">
                              {order.paymentMethod?.toUpperCase()}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 border uppercase ${
                            order.deliveryStatus === 'delivered' ? 'bg-[color:var(--chipzo-lime)] border-[color:var(--chipzo-ink)] text-[color:var(--chipzo-ink)]' :
                            order.deliveryStatus === 'in_transit' ? 'bg-orange-500 border-[color:var(--chipzo-ink)] text-white animate-pulse' :
                            order.deliveryStatus === 'assigned' ? 'bg-blue-500 border-[color:var(--chipzo-ink)] text-white' :
                            'bg-gray-400 border-[color:var(--chipzo-ink)] text-white'
                          }`}>
                            {order.deliveryStatus?.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 border-2 border-[color:var(--chipzo-ink)] bg-white hover:bg-[color:var(--chipzo-lime)] cursor-pointer"
                              title="Inspect Details"
                            >
                              <Eye size={12} />
                            </button>
                            
                            <button
                              onClick={() => handleDownloadInvoiceTxt(order)}
                              className="p-1.5 border-2 border-[color:var(--chipzo-ink)] bg-white hover:bg-[color:var(--chipzo-lime)] cursor-pointer"
                              title="Download Printed slip"
                            >
                              <Download size={12} />
                            </button>

                            <button
                              onClick={() => setOrderDeleteId(order._id)}
                              className="p-1.5 border-2 border-[color:var(--chipzo-ink)] bg-white hover:bg-[color:var(--chipzo-primary)] hover:text-white cursor-pointer"
                              title="Delete Order Record"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination for orders */}
            {orderTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4">
                <button
                  disabled={orderCurrentPage <= 1}
                  onClick={() => setOrderCurrentPage(p => Math.max(1, p - 1))}
                  className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] hover:bg-[color:var(--chipzo-ink)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-black uppercase"
                >
                  PREV
                </button>
                <span className="text-xs font-mono font-black px-4 uppercase">
                  PAGE {orderCurrentPage} OF {orderTotalPages}
                </span>
                <button
                  disabled={orderCurrentPage >= orderTotalPages}
                  onClick={() => setOrderCurrentPage(p => Math.min(orderTotalPages, p + 1))}
                  className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] hover:bg-[color:var(--chipzo-ink)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-black uppercase"
                >
                  NEXT
                </button>
              </div>
            )}

          </div>
        )}

        {/* ===== VIEW: 5. MOCK USERS VIEW ===== */}
        {activeTab === 'users' && (
          <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[6px_6px_0_var(--chipzo-ink)] p-8 text-center animate-fadeIn">
            <Users className="mx-auto text-[color:var(--chipzo-primary)] mb-4" size={48} />
            <h3 className="font-black text-xl uppercase tracking-wide">USER_DIRECTORY_STATION</h3>
            <p className="text-xs text-[color:var(--chipzo-muted)] max-w-md mx-auto mt-2">
              User identity matrix panel. Under expansion. Administrators will be able to audit accounts, manage billing tiers, issue API client tokens, and adjust engineer access configurations.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="mt-6 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] px-5 py-2 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_var(--chipzo-ink)] cursor-pointer"
            >
              RETURN TO OVERVIEW
            </button>
          </div>
        )}

        {/* ===== VIEW: 6. MOCK SETTINGS VIEW ===== */}
        {activeTab === 'settings' && (
          <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[6px_6px_0_var(--chipzo-ink)] p-8 text-center animate-fadeIn">
            <SettingsIcon className="mx-auto text-[color:var(--chipzo-primary)] mb-4" size={48} />
            <h3 className="font-black text-xl uppercase tracking-wide">SYSTEM_CONFIG_DASHBOARD</h3>
            <p className="text-xs text-[color:var(--chipzo-muted)] max-w-md mx-auto mt-2">
              System parameter adjustments dashboard. Admins can toggle global flags (like mock deliveries or live Rapido API hooks), adjust JWT session duration bounds, and clean cached indexes.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="mt-6 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] px-5 py-2 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_var(--chipzo-ink)] cursor-pointer"
            >
              RETURN TO OVERVIEW
            </button>
          </div>
        )}

      </main>

      {/* ===== ORDER DETAILS MODAL ===== */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-3xl border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] shadow-[8px_8px_0_var(--chipzo-ink)] p-6 my-8 animate-scaleIn relative flex flex-col justify-between">
            
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 border-[2px] border-[color:var(--chipzo-ink)] bg-white p-1 hover:bg-[color:var(--chipzo-primary)] hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} strokeWidth={3} />
            </button>

            <div>
              {/* Header */}
              <div className="border-b-[3px] border-[color:var(--chipzo-ink)] pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight text-[color:var(--chipzo-ink)]">
                    ORDER TELEMETRY DETAILS
                  </h3>
                  <p className="font-mono text-[9px] text-[color:var(--chipzo-muted)] select-all mt-0.5">UUID: {selectedOrder._id}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadInvoiceTxt(selectedOrder)}
                    className="flex items-center gap-1 border-[2px] border-[color:var(--chipzo-ink)] bg-white px-2 py-1 text-[9px] font-black uppercase hover:bg-[color:var(--chipzo-lime)] cursor-pointer"
                  >
                    <Download size={10} /> INVOICE
                  </button>

                  <button
                    onClick={() => { setSelectedOrder(null); setOrderDeleteId(selectedOrder._id) }}
                    className="flex items-center gap-1 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] text-white px-2 py-1 text-[9px] font-black uppercase hover:bg-[color:var(--chipzo-ink)] cursor-pointer"
                  >
                    <Trash2 size={10} /> PURGE
                  </button>
                </div>
              </div>

              {/* Order Layout Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side: Items & Financial Summary */}
                <div className="space-y-4">
                  <div className="border-[2px] border-[color:var(--chipzo-ink)] bg-white p-3.5 shadow-[2px_2px_0_var(--chipzo-ink)]">
                    <h4 className="font-black text-[10px] uppercase tracking-widest text-[color:var(--chipzo-muted)] border-b border-[color:var(--chipzo-rule)] pb-1 mb-2">
                      BILL OF MATERIALS
                    </h4>
                    
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center gap-2 text-[11px] border-b border-[color:var(--chipzo-rule)]/50 pb-1.5 last:border-0 last:pb-0">
                          <div>
                            <p className="font-black uppercase truncate max-w-[200px]">{item.name}</p>
                            <p className="text-[9px] font-bold text-[color:var(--chipzo-muted)] mt-0.5">
                              ₹{item.price.toFixed(2)} x {item.quantity} units
                            </p>
                          </div>
                          <span className="font-black tabular-prices shrink-0">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t-[2px] border-dashed border-[color:var(--chipzo-ink)] pt-3 mt-3 flex justify-between items-center text-xs font-black">
                      <span className="uppercase">GRAND TOTAL SUB:</span>
                      <span className="text-sm text-[color:var(--chipzo-primary)] tabular-prices">
                        ₹{selectedOrder.totalAmount?.toFixed(2)} INR
                      </span>
                    </div>
                  </div>

                  <div className="border-[2px] border-[color:var(--chipzo-ink)] bg-white p-3.5 shadow-[2px_2px_0_var(--chipzo-ink)] space-y-2">
                    <h4 className="font-black text-[10px] uppercase tracking-widest text-[color:var(--chipzo-muted)] border-b border-[color:var(--chipzo-rule)] pb-1 mb-2">
                      PAYMENT TRANSACTION
                    </h4>
                    <div className="space-y-1.5 text-[11px] font-bold">
                      <div className="flex justify-between">
                        <span>GATEWAY METHOD:</span>
                        <span className="font-black uppercase">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CLEARANCE STATUS:</span>
                        <span className={`font-black uppercase ${selectedOrder.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                          {selectedOrder.paymentStatus}
                        </span>
                      </div>
                      {selectedOrder.paymentId && (
                        <div className="flex flex-col">
                          <span>TRANSACTION PAY ID:</span>
                          <span className="font-mono text-[9px] text-[color:var(--chipzo-muted)] select-all mt-0.5 leading-none break-all">{selectedOrder.paymentId}</span>
                        </div>
                      )}
                      {selectedOrder.razorpayOrderId && (
                        <div className="flex flex-col">
                          <span>RP REFERENCE ID:</span>
                          <span className="font-mono text-[9px] text-[color:var(--chipzo-muted)] select-all mt-0.5 leading-none break-all">{selectedOrder.razorpayOrderId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Shipments & Logistics Control */}
                <div className="space-y-4">
                  
                  <div className="border-[2px] border-[color:var(--chipzo-ink)] bg-white p-3.5 shadow-[2px_2px_0_var(--chipzo-ink)] space-y-2">
                    <h4 className="font-black text-[10px] uppercase tracking-widest text-[color:var(--chipzo-muted)] border-b border-[color:var(--chipzo-rule)] pb-1 mb-2">
                      SHIPPING DELIVERY DIRECTORY
                    </h4>
                    <div className="space-y-1 text-[11px] font-semibold text-[color:var(--chipzo-ink)]">
                      <p className="font-black text-xs uppercase">{selectedOrder.address?.fullName}</p>
                      <p className="font-mono text-[10px] text-[color:var(--chipzo-primary)]">{selectedOrder.address?.phone}</p>
                      <p className="text-[10px] text-[color:var(--chipzo-muted)] uppercase mt-1 leading-relaxed">
                        {selectedOrder.address?.street},<br />
                        {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}
                      </p>
                    </div>
                  </div>

                  {/* ACTIVE STATUS CONTROL PANEL */}
                  <div className="border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] text-white p-3.5 shadow-[2px_2px_0_var(--chipzo-ink)] space-y-3.5">
                    <h4 className="font-black text-[10px] uppercase tracking-widest text-[color:var(--chipzo-lime)] border-b border-white/20 pb-1.5">
                      LOGISTICS STATUS WORKFLOW
                    </h4>
                    
                    {/* Payment Status Dropdown Selector */}
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-wider text-white/60 mb-1">
                        PAYMENT CLEARANCE
                      </label>
                      <div className="flex gap-2">
                        {['pending', 'paid', 'failed'].map(status => (
                          <button
                            key={status}
                            type="button"
                            disabled={updatingStatusId !== null}
                            onClick={() => handleUpdateOrderStatus(selectedOrder._id, { paymentStatus: status })}
                            className={`flex-1 text-[9px] font-black uppercase py-1 border-[1.5px] cursor-pointer transition-colors ${
                              selectedOrder.paymentStatus === status 
                                ? 'bg-[color:var(--chipzo-lime)] border-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)]' 
                                : 'bg-transparent border-white/20 text-white hover:bg-white/5'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Status Dropdown Selector */}
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-wider text-white/60 mb-1">
                        DELIVERY PROTOCOL
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-black uppercase">
                        {['not_assigned', 'assigned', 'in_transit', 'delivered'].map(status => (
                          <button
                            key={status}
                            type="button"
                            disabled={updatingStatusId !== null}
                            onClick={() => handleUpdateOrderStatus(selectedOrder._id, { deliveryStatus: status })}
                            className={`py-1 border-[1.5px] cursor-pointer transition-colors ${
                              selectedOrder.deliveryStatus === status 
                                ? 'bg-[color:var(--chipzo-lime)] border-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)]' 
                                : 'bg-transparent border-white/20 text-white hover:bg-white/5'
                            }`}
                          >
                            {status.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tracking ID Custom Editor */}
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-wider text-white/60 mb-1">
                        DELIVERY TRACKING CODE
                      </label>
                      <div className="flex brutal-border">
                        <input
                          type="text"
                          defaultValue={selectedOrder.deliveryTrackingId || ''}
                          onBlur={(e) => handleUpdateOrderStatus(selectedOrder._id, { deliveryTrackingId: e.target.value.trim() || null })}
                          placeholder="e.g. VOLTEX-9283921"
                          className="flex-1 bg-white text-[color:var(--chipzo-ink)] px-2.5 py-1 text-[10px] font-mono tracking-wider outline-none"
                        />
                        <span className="bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] text-[8px] font-black px-2 flex items-center justify-center uppercase select-none">
                          SAVE
                        </span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] py-2.5 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0_var(--chipzo-ink)] transition-all active:translate-y-0 active:shadow-none cursor-pointer"
            >
              CLOSE AUDIT INTERFACE
            </button>

          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION BRUTALIST MODAL ===== */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] shadow-[8px_8px_0_var(--chipzo-ink)] p-6 animate-scaleIn text-center">
            
            <AlertTriangle className="mx-auto text-[color:var(--chipzo-primary)] mb-4" size={40} />
            
            <h3 className="font-black text-lg uppercase tracking-tight text-[color:var(--chipzo-ink)]">
              PURGE OPERATION CONFIRMATION
            </h3>
            
            <p className="text-xs text-[color:var(--chipzo-muted)] leading-relaxed mt-2.5">
              Warning: You are preparing to permanently purge this component from the database catalog. This action cannot be undone and will immediately affect client catalog indexes.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => setDeletingId(null)}
                className="border-[3px] border-[color:var(--chipzo-ink)] bg-white py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                CANCEL PURGE
              </button>
              
              <button
                onClick={handleDeleteConfirm}
                className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] hover:bg-[color:var(--chipzo-ink)] text-white py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                PURGE RECORD
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===== ORDER CANCEL/PURGE CONFIRMATION MODAL ===== */}
      {orderDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] shadow-[8px_8px_0_var(--chipzo-ink)] p-6 animate-scaleIn text-center">
            
            <AlertTriangle className="mx-auto text-[color:var(--chipzo-primary)] mb-4" size={40} />
            
            <h3 className="font-black text-lg uppercase tracking-tight text-[color:var(--chipzo-ink)]">
              CANCEL &amp; PURGE ORDER TRANSACTION
            </h3>
            
            <p className="text-xs text-[color:var(--chipzo-muted)] leading-relaxed mt-2.5">
              Warning: You are preparing to permanently purge this order log record from the systems. This action immediately deletes client checkout history, clears courier assignments, and is irreversible.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => setOrderDeleteId(null)}
                className="border-[3px] border-[color:var(--chipzo-ink)] bg-white py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                ABORT DELETION
              </button>
              
              <button
                onClick={handleDeleteOrderConfirm}
                className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] hover:bg-[color:var(--chipzo-ink)] text-white py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                DELETE ORDER
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===== TOAST NOTIFICATION STREAM ===== */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 border-[3px] border-[color:var(--chipzo-ink)] shadow-[4px_4px_0_var(--chipzo-ink)] w-80 animate-scaleIn text-white pointer-events-auto ${
              toast.type === 'success' ? 'bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)]' :
              toast.type === 'warning' ? 'bg-[color:var(--chipzo-primary)]' : 'bg-[color:var(--chipzo-danger)]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider leading-none">
                {toast.type === 'success' ? 'TRANSMISSION COMPLETE' : 'CORE SYSTEM ALERT'}
              </p>
              <p className="text-[10px] font-bold mt-1 opacity-90">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
