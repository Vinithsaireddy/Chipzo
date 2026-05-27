import { useState, useEffect } from 'react'
import { X, Box, Settings, MapPin, LogOut, Cpu, Wifi, Navigation, ArrowLeft, Trash2, Edit2, CheckCircle, Bell, Shield, Sliders, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function ProfilePanel({ isOpen, onClose, onNavigate }) {
  const { logout } = useAuth()
  const [activeSection, setActiveSection] = useState('main')
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({ name: '', fullName: '', phone: '', pincode: '', address: '', landmark: '', city: '' })
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [toast, setToast] = useState(null)

  const [profile, setProfile] = useState({
    name: 'Ada Lovelace',
    email: 'ada@analytical-engine.com',
    phone: '+1 (555) 019-8372',
    role: 'PROTOTYPER'
  })

  useEffect(() => {
    if (isOpen) {
      const savedUser = localStorage.getItem('chipzo_user')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          setProfile({
            name: parsed.name || 'Ada Lovelace',
            email: parsed.email || 'ada@analytical-engine.com',
            phone: parsed.phone || '+1 (555) 019-8372',
            role: parsed.role || 'PROTOTYPER'
          })
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [isOpen])

  const handleProfileChange = (field, val) => {
    setProfile(prev => {
      const updated = { ...prev, [field]: val }
      localStorage.setItem('chipzo_user', JSON.stringify(updated))
      return updated
    })
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const [toggles, setToggles] = useState(() => {
    const saved = localStorage.getItem('chipzo_toggles')
    if (saved) return JSON.parse(saved)
    return {
      delivery: true,
      stock: true,
      promo: false,
      tactical: true
    }
  })

  useEffect(() => {
    localStorage.setItem('chipzo_toggles', JSON.stringify(toggles))
  }, [toggles])

  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem('chipzo_addresses')
    if (saved) return JSON.parse(saved)
    return [
      { id: 'addr-1', name: 'HOME LAB', fullName: 'Ada Lovelace', phone: '+91 98888 77777', pincode: '560008', address: 'Penthouse A, Babbage Tower, 102 Binary Lane, Indiranagar', landmark: 'Near Silicon Gate', city: 'Bengaluru', isDefault: true },
      { id: 'addr-2', name: 'WORKSHOP', fullName: 'Alan Turing', phone: '+91 97777 66666', pincode: '400001', address: 'Flat 404, Decryption Residency, Enigma Road, Fort', landmark: 'Opposite Bombe Lab', city: 'Mumbai', isDefault: false }
    ]
  })

  useEffect(() => {
    localStorage.setItem('chipzo_addresses', JSON.stringify(addresses))
  }, [addresses])



  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAddAddress = () => {
    if (!newAddress.name.trim() || !newAddress.fullName.trim() || !newAddress.address.trim() || !newAddress.phone.trim() || !newAddress.pincode.trim() || !newAddress.city.trim()) {
      showToast('Please fill out all required fields.')
      return
    }
    if (editingAddressId) {
      setAddresses(addresses.map(a => a.id === editingAddressId ? { ...a, 
        name: newAddress.name.toUpperCase(), 
        fullName: newAddress.fullName,
        phone: newAddress.phone,
        pincode: newAddress.pincode,
        address: newAddress.address,
        landmark: newAddress.landmark,
        city: newAddress.city
      } : a))
      setEditingAddressId(null)
    } else {
      const newEntry = {
        id: `addr-${Date.now()}`,
        name: newAddress.name.toUpperCase(),
        fullName: newAddress.fullName,
        phone: newAddress.phone,
        pincode: newAddress.pincode,
        address: newAddress.address,
        landmark: newAddress.landmark,
        city: newAddress.city,
        isDefault: addresses.length === 0
      }
      setAddresses([...addresses, newEntry])
    }
    setNewAddress({ name: '', fullName: '', phone: '', pincode: '', address: '', landmark: '', city: '' })
    setShowAddAddress(false)
  }

  const handleSetDefaultAddress = (id) => {
    setAddresses(addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    })))
  }

  const handleRemoveAddress = (id) => {
    const nextAddrs = addresses.filter(a => a.id !== id)
    if (nextAddrs.length > 0 && !nextAddrs.some(a => a.isDefault)) {
      nextAddrs[0].isDefault = true
    }
    setAddresses(nextAddrs)
  }



  const BrutalistToggle = ({ checked, onChange }) => (
    <div onClick={onChange} className={`h-5 w-10 border-[2px] border-[color:var(--chipzo-ink)] relative cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors ${checked ? 'bg-[color:var(--chipzo-lime)]' : 'bg-[color:var(--chipzo-paper)]'}`}>
      <div className={`absolute top-0 h-4 w-4 transition-all ${checked ? 'right-0 bg-[color:var(--chipzo-ink)] border-l-[2px] border-[color:var(--chipzo-ink)]' : 'left-0 bg-[color:var(--chipzo-muted)] border-r-[2px] border-[color:var(--chipzo-ink)]'}`} />
    </div>
  )
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lock background scroll (Lenis) while panel is open
  useEffect(() => {
    const lenis = window.__lenis
    if (!lenis) {
      // Fallback for pages without Lenis
      document.body.style.overflow = isOpen ? 'hidden' : ''
      return () => { document.body.style.overflow = '' }
    }
    if (isOpen) {
      lenis.stop()
    } else {
      lenis.start()
    }
    return () => {
      lenis.start()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setActiveSection('main')
        setShowAddAddress(false)
      }, 300)
    }
  }, [isOpen])


  const renderSectionContent = () => {
    switch (activeSection) {
      case 'orders':
        return (
          <>
            <h3 className="mb-4 text-lg font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] border-b-[3px] border-[color:var(--chipzo-ink)] pb-2">Active Delivery Modules</h3>
            {/* Active order card */}
            <div className="group relative border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
              <div className="absolute -right-3 -top-3 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] px-2 py-1 text-[10px] font-black text-[color:var(--chipzo-ink)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                IN TRANSIT
              </div>
              <div className="mb-3 flex items-center justify-between border-b-2 border-dashed border-[color:var(--chipzo-rule)] pb-3">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Order ID</span>
                  <span className="text-sm font-black uppercase tracking-wider text-[color:var(--chipzo-ink)]">#CZ-8829-X</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">ETA</span>
                  <span className="text-sm font-black tracking-wider text-[color:var(--chipzo-primary)]">84 MIN</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-[color:var(--chipzo-ink)]">Route Progress</span>
                  <span className="text-[color:var(--chipzo-primary)]">65%</span>
                </div>
                <div className="h-2 w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] overflow-hidden">
                  <div className="h-full w-[65%] bg-[color:var(--chipzo-primary)] border-r-[2px] border-[color:var(--chipzo-ink)] animate-pulse" />
                </div>
              </div>

              <button onClick={() => showToast('Tracking module initializing...')} className="flex w-full items-center justify-center gap-2 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2 text-xs font-black uppercase tracking-wider text-[color:var(--chipzo-ink)] transition-colors hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-lime)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none">
                <Navigation size={14} />
                View Tracking →
              </button>
            </div>

            <h3 className="mb-4 mt-8 text-[11px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">Delivery Archive</h3>
            <div className="border-[2px] border-dashed border-[color:var(--chipzo-rule)] bg-[color:var(--chipzo-surface)] p-4 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">[■] NO PREVIOUS DELIVERY SIGNALS</span>
            </div>
          </>
        )

      case 'addresses':
        return (
          <>
            <h3 className="mb-4 text-lg font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] border-b-[3px] border-[color:var(--chipzo-ink)] pb-2">Delivery Nodes</h3>
            
            <div className="flex flex-col gap-4 mb-6">
              {showAddAddress ? (
                <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] border-b-2 border-dashed border-[color:var(--chipzo-rule)] pb-2">New Delivery Node</h4>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">Node Name</label>
                      <input type="text" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} placeholder="e.g. STUDIO" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">Full Name</label>
                      <input type="text" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} placeholder="Jane Doe" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">Phone</label>
                        <input type="tel" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} placeholder="+91 98765 43210" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">Pincode</label>
                        <input type="text" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} placeholder="560001" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">Address (Bldg / Street)</label>
                      <textarea rows={2} value={newAddress.address} onChange={e => setNewAddress({...newAddress, address: e.target.value})} placeholder="Maker Space 42, Silicon Lane" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">Landmark (Opt)</label>
                        <input type="text" value={newAddress.landmark} onChange={e => setNewAddress({...newAddress, landmark: e.target.value})} placeholder="Near Tech Park" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">City</label>
                        <input type="text" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} placeholder="Bengaluru" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)]" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setShowAddAddress(false); setNewAddress({name: '', fullName: '', phone: '', pincode: '', address: '', landmark: '', city: ''}) }} className="flex-1 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] py-2 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] transition-colors">
                      CANCEL
                    </button>
                    <button onClick={handleAddAddress} className="flex-1 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] py-2 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all">
                      SAVE NODE
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {addresses.length === 0 && (
                    <div className="border-[2px] border-dashed border-[color:var(--chipzo-rule)] bg-[color:var(--chipzo-surface)] p-4 text-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">[■] NO SAVED NODES</span>
                    </div>
                  )}
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`border-[3px] border-[color:var(--chipzo-ink)] ${addr.isDefault ? 'bg-[color:var(--chipzo-surface)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-[color:var(--chipzo-paper)] opacity-70 hover:opacity-100'} p-4 relative transition-all`}>
                      {addr.isDefault && (
                        <div className="absolute right-3 top-3">
                          <div className="flex items-center gap-1 bg-[color:var(--chipzo-ink)] px-2 py-1">
                            <CheckCircle size={10} className="text-[color:var(--chipzo-lime)]" />
                            <span className="text-[9px] font-black uppercase tracking-wider text-[color:var(--chipzo-lime)]">DEFAULT NODE</span>
                          </div>
                        </div>
                      )}
                      <div className={`mb-2 ${addr.isDefault ? 'mt-4 md:mt-0' : ''}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] block mb-1">NODE TYPE</span>
                        <span className="text-sm font-black uppercase tracking-wider text-[color:var(--chipzo-ink)] flex items-center gap-2">
                          <MapPin size={14} /> {addr.name}
                        </span>
                      </div>
                      <div className="mb-4 border-b-2 border-dashed border-[color:var(--chipzo-rule)] pb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] block mb-1">DETAILS</span>
                        <p className="text-xs font-bold text-[color:var(--chipzo-ink)] uppercase leading-relaxed">
                          {addr.fullName} <br/>
                          {addr.address} <br/>
                          {addr.city} - {addr.pincode} {addr.landmark && `| L.M: ${addr.landmark}`} <br/>
                          TEL: {addr.phone}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefaultAddress(addr.id)} className="flex flex-1 items-center justify-center gap-1 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] py-1.5 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] transition-colors">
                            SET DEFAULT
                          </button>
                        )}
                        <button onClick={() => { setEditingAddressId(addr.id); setNewAddress({ name: addr.name || '', fullName: addr.fullName || '', phone: addr.phone || '', pincode: addr.pincode || '', address: addr.address || '', landmark: addr.landmark || '', city: addr.city || '' }); setShowAddAddress(true); }} className={`flex ${addr.isDefault ? 'flex-1' : 'w-10'} items-center justify-center gap-1 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] py-1.5 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] transition-colors`}>
                          <Edit2 size={12} /> {addr.isDefault && "EDIT"}
                        </button>
                        {addr.isDefault && (
                          <button onClick={() => handleRemoveAddress(addr.id)} className="flex flex-1 items-center justify-center gap-1 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] py-1.5 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-danger)] hover:text-white transition-colors">
                            <Trash2 size={12} /> REMOVE
                          </button>
                        )}
                        {!addr.isDefault && (
                          <button onClick={() => handleRemoveAddress(addr.id)} className="flex w-10 items-center justify-center gap-1 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] py-1.5 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-danger)] hover:text-white transition-colors">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {!showAddAddress && (
              <button onClick={() => setShowAddAddress(true)} className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] py-3 text-xs font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-ink)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none mb-4">
                + ADD NEW DELIVERY NODE
              </button>
            )}
          </>
        )
      case 'settings':
        return (
          <>
            <h3 className="mb-4 text-lg font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] border-b-[3px] border-[color:var(--chipzo-ink)] pb-2">System Configuration</h3>
            
            <div className="flex flex-col gap-6">
              {/* User Profile */}
              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[color:var(--chipzo-ink)]"><User size={14} /> USER PROFILE</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">Username</label>
                    <input type="text" defaultValue="Ada Lovelace" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">Email</label>
                    <input type="email" defaultValue="ada@analytical-engine.com" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mb-1">Phone</label>
                    <input type="tel" defaultValue="+1 (555) 019-8372" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] transition-colors" />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[color:var(--chipzo-ink)]"><Bell size={14} /> NOTIFICATION SIGNALS</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-ink)]">Delivery Alerts</span>
                    <BrutalistToggle checked={toggles.delivery} onChange={() => handleToggle('delivery')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-ink)]">Stock Alerts</span>
                    <BrutalistToggle checked={toggles.stock} onChange={() => handleToggle('stock')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-ink)]">Promotional Signals</span>
                    <BrutalistToggle checked={toggles.promo} onChange={() => handleToggle('promo')} />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[color:var(--chipzo-ink)]"><Shield size={14} /> SECURITY PROTOCOLS</h4>
                {showPasswordReset ? (
                  <div className="space-y-3 mb-4">
                    <input type="password" placeholder="CURRENT PASSWORD" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)]" />
                    <input type="password" placeholder="NEW PASSWORD" className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)]" />
                    <div className="flex gap-2">
                      <button onClick={() => setShowPasswordReset(false)} className="flex-1 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] py-1.5 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] transition-colors">CANCEL</button>
                      <button onClick={() => { showToast('Password updated successfully.'); setShowPasswordReset(false); }} className="flex-1 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] py-1.5 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] transition-all">SAVE</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowPasswordReset(true)} className="mb-2 w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] py-2 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none">
                    CHANGE PASSWORD
                  </button>
                )}
                <button onClick={() => { if(window.confirm('Terminate all other active sessions?')) showToast('All other sessions terminated.'); }} className="w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] py-2 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] hover:bg-[color:var(--chipzo-danger)] hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none">
                  TERMINATE ALL SESSIONS
                </button>
              </div>

              {/* Preferences */}
              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[color:var(--chipzo-ink)]"><Sliders size={14} /> INTERFACE PREFERENCES</h4>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-ink)]">Tactical Mode (Dark)</span>
                  <BrutalistToggle checked={toggles.tactical} onChange={() => handleToggle('tactical')} />
                </div>
              </div>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-[100] bg-[color:var(--chipzo-ink)]/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Right Sliding Panel */}
      <div 
        className={`fixed right-0 top-0 z-[110] h-full w-full max-w-sm md:max-w-md transform border-l-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] shadow-[-8px_0_0_0_rgba(0,0,0,1)] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'} overflow-hidden`}
      >
        <div 
          className="flex h-full w-[200%] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: activeSection === 'main' ? 'translateX(0)' : 'translateX(-50%)' }}
        >
          {/* Main View */}
          <div data-lenis-prevent className="w-1/2 flex-shrink-0 flex h-full flex-col overflow-y-auto overflow-x-hidden p-6 pb-32">
          
          {/* Top Bar */}
          <div className="mb-6 flex items-center justify-between border-b-[3px] border-[color:var(--chipzo-ink)] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Cpu size={24} className="text-[color:var(--chipzo-paper)]" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-[color:var(--chipzo-ink)]">Ada Lovelace</h2>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-none bg-[color:var(--chipzo-lime)] border border-[color:var(--chipzo-ink)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Verified Maker</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:bg-[color:var(--chipzo-lime)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <X size={18} className="text-[color:var(--chipzo-ink)]" />
            </button>
          </div>

          {/* Active Delivery Section */}
          <div className="mb-8">
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">Active Deliveries</h3>
            <div className="group relative border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="absolute -right-3 -top-3 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] px-2 py-1 text-[10px] font-black text-[color:var(--chipzo-ink)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                IN TRANSIT
              </div>
              <div className="mb-3 flex items-center justify-between border-b-2 border-dashed border-[color:var(--chipzo-rule)] pb-3">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Order ID</span>
                  <span className="text-sm font-black uppercase tracking-wider text-[color:var(--chipzo-ink)]">#CZ-8829-X</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">ETA</span>
                  <span className="text-sm font-black tracking-wider text-[color:var(--chipzo-primary)]">84 MIN</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-[color:var(--chipzo-ink)]">Route Progress</span>
                  <span className="text-[color:var(--chipzo-primary)]">65%</span>
                </div>
                <div className="h-2 w-full border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] overflow-hidden">
                  <div className="h-full w-[65%] bg-[color:var(--chipzo-primary)] border-r-[2px] border-[color:var(--chipzo-ink)]" />
                </div>
              </div>

              <button onClick={() => showToast('Tracking system offline. Please check back later.')} className="flex w-full items-center justify-center gap-2 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2 text-xs font-black uppercase tracking-wider text-[color:var(--chipzo-ink)] transition-colors hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-lime)]">
                <Navigation size={14} />
                Track Order
              </button>
            </div>
          </div>

          {/* Quick Access Module */}
          <div className="mb-8">
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">Control Panel</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Track Orders', icon: Box, key: 'orders' },
                { label: 'Delivery Addresses', icon: MapPin, key: 'addresses' },
                { label: 'Account Settings', icon: Settings, key: 'settings' },
              ].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveSection(item.key)}
                  className="flex flex-col items-center justify-center gap-2 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-paper)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <item.icon size={20} strokeWidth={2.5} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recently Viewed */}
          <div className="mb-8">
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">Recent Components</h3>
            <div className="flex flex-col gap-2">
              {[
                { name: 'ESP32 DEV BOARD', cat: 'Microcontroller', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCETFwmUzj3YEI7g1b26_A4Q8ntbvHOyL7LS08SPS0ptZIR3471iY19Pkn2Qbek6TqDgo6J2I5WEVSoXj_WWdnyNRjZPrapTk1oTWPXUUWZJRQJG99k9Ae3IjwU_uaptd6_xBoy6-Ss8_RWJKHAjr2xwQF60VmdsKPb11-HsU6znw3_TF3HZpPl77wcWKhdnTF0-6bWs30I8dv0VLR24lfCHA54QWxbCz5r2molimfqRuaSiU-IGFGijfFMqtUSLEAYcLdjsBUDGrY' },
                { name: 'OLED DISPLAY 0.96"', cat: 'Display', img: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=200&auto=format&fit=crop' },
              ].map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] p-2 transition-colors hover:bg-[color:var(--chipzo-surface)]">
                  <div className="flex items-center gap-3">
                    <img src={comp.img} alt={comp.name} className="h-10 w-10 border-[2px] border-[color:var(--chipzo-ink)] object-cover grayscale transition-all hover:grayscale-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-[color:var(--chipzo-ink)]">{comp.name}</h4>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">{comp.cat}</span>
                    </div>
                  </div>
                  <button onClick={() => showToast(`Module ${comp.name} interface locked.`)} className="flex h-6 w-6 items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-lime)] hover:bg-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-paper)]">
                    <Wifi size={12} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* User Status Module */}
          <div className="mb-4 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] p-4">
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] border-b-2 border-dashed border-[color:var(--chipzo-rule)] pb-2">System Status</h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Account Status</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[color:var(--chipzo-ink)]">Verified User</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Build Level</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[color:var(--chipzo-primary)]">Prototyper</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Delivery Access</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[color:var(--chipzo-lime)] bg-[color:var(--chipzo-ink)] px-1.5 py-0.5">Express Enabled</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section View */}
        <div data-lenis-prevent className="w-1/2 flex-shrink-0 h-full overflow-y-auto overflow-x-hidden p-6 pb-32">
          {activeSection !== 'main' && (
            <button 
              onClick={() => setActiveSection('main')}
              className="mb-6 flex w-full items-center gap-2 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] px-4 py-3 text-sm font-black uppercase tracking-wider transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <ArrowLeft size={18} />
              BACK TO CONTROL PANEL
            </button>
          )}
          {renderSectionContent()}
        </div>
      </div>

        {/* Sticky Bottom Actions */}
        <div className="absolute bottom-0 left-0 w-full border-t-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] p-4">
          <button onClick={onClose} className="mb-2 w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] py-3 text-sm font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-ink)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none">
            Continue Building →
          </button>
          <button onClick={() => { localStorage.removeItem('chipzo_cart'); logout(); onClose(); onNavigate && onNavigate('/'); }} className="flex w-full items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)] hover:text-[color:var(--chipzo-ink)] transition-colors">
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] px-4 py-2 text-center text-xs font-black uppercase tracking-widest text-[color:var(--chipzo-lime)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-4 duration-200 z-[120]">
            {toast}
          </div>
        )}
      </div>
    </>
  )
}
