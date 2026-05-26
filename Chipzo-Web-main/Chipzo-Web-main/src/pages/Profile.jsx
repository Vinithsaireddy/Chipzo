import { useState, useEffect } from 'react';
import SmoothScroll from '../components/SmoothScroll.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { authAPI, addressAPI, ordersAPI } from '../services/api.js';
import {
  User, MapPin, Package, ChevronRight, LogOut, Save, X, AlertTriangle,
  Loader, Plus, Trash2, Star, CheckCircle, Clock, CreditCard, Truck,
} from 'lucide-react';

export default function Profile({ onNavigate, activeCategory }) {
  const { isLoggedIn, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editCurrentPassword, setEditCurrentPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);

  // Fetch profile data on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    authAPI.getMe()
      .then(data => {
        if (cancelled) return;
        const u = data?.data?.user || data?.user || data;
        setProfile(u);
        setEditName(u.name || '');
        setEditPhone(u.phone || '');
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    ordersAPI.getAll()
      .then(data => {
        if (cancelled) return;
        const raw = data?.data || data?.orders || [];
        setOrders(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setOrdersLoading(false); });
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    addressAPI.getAll()
      .then(data => {
        if (cancelled) return;
        const addrs = data?.data?.addresses || data?.addresses || [];
        setAddresses(Array.isArray(addrs) ? addrs : []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAddressesLoading(false); });
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const body = {};
      if (editName !== (profile?.name || '')) body.name = editName;
      if (editPhone !== (profile?.phone || '')) body.phone = editPhone;
      if (editPassword) {
        if (!editCurrentPassword) {
          setEditError('Current password is required to set a new password.');
          setEditLoading(false);
          return;
        }
        body.currentPassword = editCurrentPassword;
        body.newPassword = editPassword;
      }
      if (Object.keys(body).length === 0) {
        setEditError('No changes to save.');
        setEditLoading(false);
        return;
      }
      const data = await authAPI.updateProfile(body);
      const updated = data?.data?.user || data?.user;
      if (updated) {
        setProfile(updated);
        localStorage.setItem('chipzo_user', JSON.stringify(updated));
        setEditSuccess('Profile updated successfully.');
        setEditPassword('');
        setEditCurrentPassword('');
        setTimeout(() => setEditSuccess(''), 3000);
      }
      setEditing(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  const handleDeleteAddress = async (id) => {
    try {
      await addressAPI.delete(id);
      setAddresses(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressAPI.setDefault(id);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a._id === id })));
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  const statusColor = (status) => {
    const map = {
      'pending': 'border-[color:var(--chipzo-muted)] text-[color:var(--chipzo-muted)]',
      'paid': 'border-emerald-500 text-emerald-700 bg-emerald-50',
      'failed': 'border-red-500 text-red-700 bg-red-50',
      'not_assigned': 'border-[color:var(--chipzo-muted)] text-[color:var(--chipzo-muted)]',
      'assigned': 'border-[color:var(--chipzo-primary)] text-[color:var(--chipzo-primary)] bg-[color:var(--chipzo-primary)]/10',
      'in_transit': 'border-amber-500 text-amber-700 bg-amber-50',
      'delivered': 'border-emerald-500 text-emerald-700 bg-emerald-50',
    };
    return map[status] || 'border-[color:var(--chipzo-muted)] text-[color:var(--chipzo-muted)]';
  };

  const tabCls = (tab) => {
    const base = 'flex-1 border-[3px] py-3 text-xs font-black uppercase tracking-widest cursor-pointer transition-all text-center';
    return activeTab === tab
      ? `${base} border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] text-[color:var(--chipzo-lime)] shadow-[4px_4px_0_rgba(0,0,0,1)] -translate-x-[2px] -translate-y-[2px]`
      : `${base} border-transparent text-[color:var(--chipzo-muted)] hover:text-[color:var(--chipzo-ink)]`;
  };

  if (!isLoggedIn) return null;

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)]">
        <Navbar onNavigate={onNavigate} currentPage="profile" activeCategory={activeCategory} cartCount={0} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 flex flex-col gap-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <User size={24} className="text-[color:var(--chipzo-paper)]" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">Profile</h1>
                <p className="text-xs font-bold text-[color:var(--chipzo-muted)] uppercase tracking-wider">Manage your account</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 border-[3px] border-red-500 bg-red-50 px-4 py-2 text-xs font-black uppercase cursor-pointer hover:bg-red-500 hover:text-white transition-colors shadow-[3px_3px_0_rgba(0,0,0,1)]">
              <LogOut size={14} /> Sign Out
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('info')} className={tabCls('info')}><User size={14} className="inline mr-1" /> Info</button>
            <button onClick={() => setActiveTab('addresses')} className={tabCls('addresses')}><MapPin size={14} className="inline mr-1" /> Addresses</button>
            <button onClick={() => setActiveTab('orders')} className={tabCls('orders')}><Package size={14} className="inline mr-1" /> Orders</button>
          </div>

          {/* ============ INFO TAB ============ */}
          {activeTab === 'info' && (
            <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow overflow-hidden">
              <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><User size={16} /> Account Info</h2>
                {!editing && (
                  <button onClick={() => setEditing(true)} className="text-[10px] font-black uppercase border-2 border-[color:var(--chipzo-ink)] px-3 py-1 cursor-pointer hover:bg-[color:var(--chipzo-primary)] transition-colors shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    EDIT
                  </button>
                )}
              </div>
              <div className="p-6">
                {profileLoading ? (
                  <div className="flex items-center gap-3 py-8 justify-center"><Loader size={20} className="animate-spin" /> Loading...</div>
                ) : editing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                    {editError && (
                      <div className="border-[3px] border-red-500 bg-red-50 p-3 flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-600" />
                        <p className="text-xs font-bold text-red-700">{editError}</p>
                      </div>
                    )}
                    {editSuccess && (
                      <div className="border-[3px] border-emerald-500 bg-emerald-50 p-3 flex items-start gap-2">
                        <CheckCircle size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                        <p className="text-xs font-bold text-emerald-700">{editSuccess}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)] block mb-1">Name</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2.5 text-sm font-bold outline-none focus:border-[color:var(--chipzo-primary)]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)] block mb-1">Email</label>
                      <input value={profile?.email || ''} disabled className="w-full border-[3px] border-[color:var(--chipzo-muted)] bg-[color:var(--chipzo-surface)] px-4 py-2.5 text-sm font-bold opacity-60 cursor-not-allowed" />
                      <p className="text-[9px] font-bold text-[color:var(--chipzo-muted)] mt-1">Email cannot be changed.</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)] block mb-1">Phone</label>
                      <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+91 99999 88888" className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2.5 text-sm font-bold outline-none focus:border-[color:var(--chipzo-primary)]" />
                    </div>
                    <div className="border-t-2 border-dashed border-[color:var(--chipzo-rule)] pt-4">
                      <p className="text-xs font-black uppercase tracking-wider text-[color:var(--chipzo-muted)] mb-3">Change Password (Optional)</p>
                      <div className="space-y-3">
                        <input type="password" value={editCurrentPassword} onChange={e => setEditCurrentPassword(e.target.value)} placeholder="Current password" className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2.5 text-sm font-bold outline-none focus:border-[color:var(--chipzo-primary)]" />
                        <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="New password (min 8 chars)" className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-2.5 text-sm font-bold outline-none focus:border-[color:var(--chipzo-primary)]" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" disabled={editLoading} className="flex-1 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] py-3 text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-[1px] transition-all disabled:opacity-50 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                        {editLoading ? <><Loader size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
                      </button>
                      <button type="button" onClick={() => { setEditing(false); setEditError(''); setEditSuccess(''); setEditPassword(''); setEditCurrentPassword(''); }} className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] py-3 px-6 text-xs font-black uppercase cursor-pointer hover:bg-[color:var(--chipzo-surface)] shadow-[3px_3px_0_rgba(0,0,0,1)]">
                        <X size={14} className="inline mr-1" /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 max-w-lg">
                    <div className="border-b-2 border-dashed border-[color:var(--chipzo-rule)] pb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">Name</p>
                      <p className="text-lg font-black uppercase">{profile?.name || '—'}</p>
                    </div>
                    <div className="border-b-2 border-dashed border-[color:var(--chipzo-rule)] pb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">Email</p>
                      <p className="text-sm font-bold">{profile?.email || '—'}</p>
                    </div>
                    <div className="border-b-2 border-dashed border-[color:var(--chipzo-rule)] pb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">Phone</p>
                      <p className="text-sm font-bold">{profile?.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">Member Since</p>
                      <p className="text-sm font-bold">
                        {profile?.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ============ ADDRESSES TAB ============ */}
          {activeTab === 'addresses' && (
            <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow overflow-hidden">
              <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><MapPin size={16} /> Saved Addresses</h2>
                <button onClick={() => onNavigate('checkout')} className="text-[10px] font-black uppercase border-2 border-[color:var(--chipzo-ink)] px-3 py-1 cursor-pointer hover:bg-[color:var(--chipzo-lime)] transition-colors shadow-[2px_2px_0_rgba(0,0,0,1)] flex items-center gap-1">
                  <Plus size={12} /> ADD
                </button>
              </div>
              <div className="p-6">
                {addressesLoading ? (
                  <div className="flex items-center gap-3 py-8 justify-center"><Loader size={20} className="animate-spin" /> Loading...</div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-10 border-[3px] border-dashed border-[color:var(--chipzo-rule)]">
                    <MapPin size={32} className="mx-auto text-[color:var(--chipzo-muted)] mb-3" />
                    <p className="text-sm font-black uppercase">No saved addresses</p>
                    <p className="text-xs font-bold text-[color:var(--chipzo-muted)] mt-1">Add an address during checkout.</p>
                    <button onClick={() => onNavigate('checkout')} className="mt-4 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] px-5 py-2 text-xs font-black uppercase cursor-pointer shadow-[3px_3px_0_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all">
                      GO TO CHECKOUT
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map(addr => (
                      <div key={addr._id} className={`border-[3px] p-4 ${addr.isDefault ? 'border-[color:var(--chipzo-primary)] bg-[color:var(--chipzo-surface)] shadow-[4px_4px_0_var(--chipzo-primary)]' : 'border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)]'}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-black uppercase text-sm">{addr.fullName}</p>
                          {addr.isDefault && (
                            <span className="text-[8px] font-black bg-[color:var(--chipzo-lime)] border-2 border-[color:var(--chipzo-ink)] px-1.5 py-0.5 flex items-center gap-0.5 shrink-0">
                              <Star size={8} fill="currentColor" /> DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)]">{addr.phone}</p>
                        <p className="text-xs font-bold mt-1">{addr.house ? `${addr.house}, ` : ''}{addr.street}</p>
                        <p className="text-xs font-bold">{addr.city}, {addr.state} - {addr.pincode}</p>
                        {addr.landmark && <p className="text-[10px] text-[color:var(--chipzo-muted)] mt-0.5">Near: {addr.landmark}</p>}
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          {!addr.isDefault && (
                            <button onClick={() => handleSetDefault(addr._id)} className="text-[9px] font-black uppercase border-2 border-[color:var(--chipzo-ink)] px-2 py-1 cursor-pointer hover:bg-[color:var(--chipzo-lime)] transition-colors flex items-center gap-1">
                              <Star size={9} /> SET DEFAULT
                            </button>
                          )}
                          <button onClick={() => handleDeleteAddress(addr._id)} className="text-[9px] font-black uppercase border-2 border-red-500 bg-red-50 px-2 py-1 cursor-pointer hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1">
                            <Trash2 size={9} /> DELETE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ============ ORDERS TAB ============ */}
          {activeTab === 'orders' && (
            <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow overflow-hidden">
              <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Package size={16} /> Order History</h2>
                <button onClick={() => onNavigate('orders')} className="text-[10px] font-black uppercase border-2 border-[color:var(--chipzo-ink)] px-3 py-1 cursor-pointer hover:bg-[color:var(--chipzo-primary)] transition-colors shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  VIEW ALL
                </button>
              </div>
              <div className="p-6">
                {ordersLoading ? (
                  <div className="flex items-center gap-3 py-8 justify-center"><Loader size={20} className="animate-spin" /> Loading...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10 border-[3px] border-dashed border-[color:var(--chipzo-rule)]">
                    <Package size={32} className="mx-auto text-[color:var(--chipzo-muted)] mb-3" />
                    <p className="text-sm font-black uppercase">No orders yet</p>
                    <p className="text-xs font-bold text-[color:var(--chipzo-muted)] mt-1">Start building your rig!</p>
                    <button onClick={() => onNavigate('shop')} className="mt-4 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] px-5 py-2 text-xs font-black uppercase cursor-pointer shadow-[3px_3px_0_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all">
                      BROWSE COMPONENTS
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {orders.slice(0, 10).map(order => (
                      <div key={order._id} className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)] uppercase tracking-wider">Order ID</p>
                            <p className="font-black font-mono text-sm">{order._id?.slice(-8).toUpperCase() || '—'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)] uppercase tracking-wider">Total</p>
                            <p className="font-black text-sm">₹{(order.totalAmount || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className={`text-[9px] font-black uppercase border-2 px-1.5 py-0.5 ${statusColor(order.paymentStatus)}`}>
                            {order.paymentStatus === 'paid' && <CreditCard size={9} className="inline mr-0.5" />}
                            {order.paymentStatus || 'pending'}
                          </span>
                          <span className={`text-[9px] font-black uppercase border-2 px-1.5 py-0.5 ${statusColor(order.deliveryStatus)}`}>
                            {order.deliveryStatus === 'in_transit' && <Truck size={9} className="inline mr-0.5" />}
                            {order.deliveryStatus?.replace('_', ' ') || 'not assigned'}
                          </span>
                          <span className="text-[9px] font-bold text-[color:var(--chipzo-muted)] flex items-center gap-1">
                            <Clock size={9} /> {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {order.items?.length > 0 && (
                          <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)] mt-2">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                        )}
                        <button onClick={() => onNavigate('orders')} className="mt-3 text-[10px] font-black uppercase tracking-wider text-[color:var(--chipzo-primary)] hover:underline cursor-pointer flex items-center gap-1">
                          View Details <ChevronRight size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </SmoothScroll>
  );
}
