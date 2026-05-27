import { useState, useEffect, useRef } from 'react';
import SmoothScroll from '../components/SmoothScroll.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import {
  ArrowRight, ArrowLeft, Check, AlertTriangle, Loader,
  MapPin, Trash2, CreditCard, Banknote, Plus, Edit3, Star,
} from 'lucide-react';
import { ordersAPI, paymentAPI, addressAPI } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import AlertModal from '../components/AlertModal.jsx';
import { checkSunday, checkTime, checkBangalore } from '../utils/orderValidation.js';

const fallbackOrderId = () => `CPZ-ORD-${Date.now()}`;

const EMPTY_FORM = {
  fullName: '', phone: '', house: '', street: '',
  landmark: '', city: '', state: 'Karnataka', pincode: '',
};

export default function Checkout({ onNavigate, activeCategory, cart = [], onCheckoutComplete, onPaymentFailed }) {
  const { isLoggedIn, user } = useAuth();
  const cartCount = cart.reduce((t, i) => t + i.quantity, 0);
  const subtotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const shipping = subtotal >= 100 ? 0 : 9.99;
  const total = subtotal + shipping;

  const [currentStep, setCurrentStep] = useState('address');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '', type: 'default' });
  const isSubmitting = useRef(false);

  const showAlert = (title, message, type) => setAlertModal({ open: true, title, message, type })
  const closeAlert = () => setAlertModal({ open: false, title: '', message: '', type: 'default' })

  const runValidations = (addr) => {
    const sunday = checkSunday()
    if (sunday.blocked) {
      showAlert('Sunday Orders Unavailable', sunday.message, 'sunday')
      return false
    }
    const time = checkTime()
    if (time.blocked) {
      showAlert('Outside Operating Hours', time.message, 'time')
      return false
    }
    if (addr) {
      const bangalore = checkBangalore(addr.city, addr.pincode)
      if (bangalore.blocked) {
        showAlert('Location Not Supported', bangalore.message, 'location')
        return false
      }
    }
    return true
  }

  // Fetch saved addresses on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    addressAPI.getAll()
      .then(data => {
        const addrs = data?.data?.addresses || data?.addresses || [];
        setSavedAddresses(addrs);
        const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
        }
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // Pre-fill name from user for new address form (handled in Add button click)

  const getSelectedAddress = () => {
    if (!selectedAddressId) return null;
    return savedAddresses.find(a => a._id === selectedAddressId) || null;
  };

  const selectedAddr = getSelectedAddress();

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Required';
    if (!formData.phone.trim()) errors.phone = 'Required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) errors.phone = 'Invalid 10-digit number';
    if (!formData.street.trim()) errors.street = 'Required';
    if (!formData.city.trim()) errors.city = 'Required';
    if (!formData.pincode.trim()) errors.pincode = 'Required';
    else if (!/^\d{6}$/.test(formData.pincode.trim())) errors.pincode = 'Invalid 6-digit pincode';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
    setShowAddForm(false);
  };

  const startEdit = (addr) => {
    setEditingId(addr._id);
    setShowAddForm(false);
    setFormData({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      house: addr.house || '',
      street: addr.street || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
    setFormErrors({});
  };

  const cancelEdit = () => {
    resetForm();
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) return;
    setIsSavingAddress(true);
    try {
      if (editingId) {
        const data = await addressAPI.update(editingId, formData);
        const updated = data?.data?.address || data?.address;
        if (updated) {
          setSavedAddresses(prev => prev.map(a => a._id === editingId ? { ...a, ...updated } : a));
        }
      } else {
        const isFirst = savedAddresses.length === 0;
        const data = await addressAPI.create({ ...formData, isDefault: isFirst });
        const newAddr = data?.data?.address || data?.address;
        if (newAddr) {
          setSavedAddresses(prev => [newAddr, ...prev]);
          setSelectedAddressId(newAddr._id);
        }
      }
      resetForm();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await addressAPI.delete(id);
      const deleted = savedAddresses.find(a => a._id === id);
      const remaining = savedAddresses.filter(a => a._id !== id);
      setSavedAddresses(remaining);
      if (selectedAddressId === id) {
        if (remaining.length > 0) {
          const newDefault = remaining.find(a => a.isDefault) || remaining[0];
          setSelectedAddressId(newDefault._id);
        } else {
          setSelectedAddressId(null);
        }
      }
      if (deleted?.isDefault && remaining.length > 0) {
        const newDefault = remaining[0];
        setSavedAddresses(prev => prev.map(a =>
          a._id === newDefault._id ? { ...a, isDefault: true } : a
        ));
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete address.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const data = await addressAPI.setDefault(id);
      const updated = data?.data?.address || data?.address;
      if (updated) {
        setSavedAddresses(prev => prev.map(a => ({
          ...a,
          isDefault: a._id === id,
        })));
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to set default address.');
    }
  };

  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (!selectedAddressId && savedAddresses.length > 0) {
      setErrorMessage('Please select a delivery address.');
      return;
    }
    if (savedAddresses.length === 0 && !showAddForm) {
      setShowAddForm(true);
      return;
    }
    if (showAddForm || editingId) {
      setErrorMessage('Please save or cancel the current address form before proceeding.');
      return;
    }
    if (savedAddresses.length === 0) {
      setErrorMessage('Please add a delivery address to continue.');
      return;
    }
    setErrorMessage('');
    setCurrentStep('review');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    const addr = selectedAddr;
    if (!addr) {
      setErrorMessage('No delivery address selected.');
      return;
    }

    if (!runValidations(addr)) {
      setIsProcessing(false);
      return;
    }

    isSubmitting.current = true;
    setIsProcessing(true);
    setErrorMessage('');

    const chosenAddress = {
      fullName: addr.fullName,
      phone: addr.phone,
      house: addr.house || '',
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    };

    try {
      if (paymentMethod === 'cod' && isLoggedIn) {
        const data = await ordersAPI.createCOD(chosenAddress);
        const order = data?.data?.order || data?.order || {};
        onCheckoutComplete?.({
          orderId: order._id || fallbackOrderId(),
          items: [...cart],
          address: addr,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }),
          subtotal, shipping, total, paymentMethod,
        });
        return;
      }

      if (!isLoggedIn) {
        await new Promise(r => setTimeout(r, 800));
        onCheckoutComplete?.({
          orderId: fallbackOrderId(),
          items: [...cart],
          address: addr,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }),
          subtotal, shipping, total, paymentMethod,
        });
        return;
      }

      console.log('[Checkout] Creating Razorpay order...');
      const orderData = await ordersAPI.create(chosenAddress);
      console.log('[Checkout] Order response:', orderData);
      console.log('[Checkout] Razorpay SDK loaded:', typeof window.Razorpay !== 'undefined');
      const rzpOrderId = orderData?.data?.razorpay_order_id
        || orderData?.data?.razorpayOrderId
        || orderData?.razorpay_order_id
        || orderData?.razorpayOrderId;
      const amount = orderData?.data?.amount || orderData?.amount;
      const currency = orderData?.data?.currency || orderData?.currency || 'INR';

      if (!rzpOrderId) throw new Error('Failed to create payment order.');

      const orderPayload = {
        items: [...cart],
        address: addr,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
        subtotal, shipping, total, paymentMethod: 'razorpay',
      };

      await new Promise((resolve, reject) => {
        let resolved = false;
        const currentUser = JSON.parse(localStorage.getItem('chipzo_user') || '{}');
        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: Math.round(amount * 100),
          currency,
          name: 'Chipzo',
          description: 'Electronic Components',
          order_id: rzpOrderId,
          prefill: {
            name: addr.fullName,
            contact: addr.phone,
            email: currentUser?.email || '',
          },
          theme: { color: '#1A1A1A' },
          handler: async (response) => {
            try {
              const cartSnapshot = cart.map(item => ({
                productId: item._backendProductId || item.id,
                quantity: item.quantity,
                name: item.title,
                price: item.price,
              }));
              const verified = await paymentAPI.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                address: chosenAddress,
                cartSnapshot,
              });
              const dbOrder = verified?.data?.order || verified?.order || {};
              resolved = true;
              onCheckoutComplete?.({
                ...orderPayload,
                orderId: dbOrder._id || rzpOrderId,
              });
              resolve();
            } catch (verifyErr) {
              resolved = true;
              paymentAPI.reportFailure({
                razorpayOrderId: rzpOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                reason: verifyErr.message || 'Payment verification failed.',
                step: 'verify',
              }).catch(() => {});
              onPaymentFailed?.({
                type: 'verify_failed',
                message: verifyErr.message || 'Payment verification failed. Please try again.',
                razorpayOrderId: rzpOrderId,
              });
              reject(verifyErr);
            }
          },
          modal: {
            ondismiss: () => {
              if (resolved) return;
              resolved = true;
              paymentAPI.reportFailure({
                razorpayOrderId: rzpOrderId,
                reason: 'User cancelled the payment.',
                step: 'modal_dismiss',
              }).catch(() => {});
              onPaymentFailed?.({
                type: 'cancelled',
                message: 'You cancelled the payment. Please try again.',
                razorpayOrderId: rzpOrderId,
              });
              reject(new Error('Payment cancelled.'));
            },
          },
          timeout: 300,
        });
        console.log('[Checkout] Opening Razorpay checkout modal');
        rzp.open();
      });
    } catch (err) {
      setErrorMessage(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
      isSubmitting.current = false;
    }
  };

  const isStepActive = (step) => {
    return ['address', 'review', 'payment'].indexOf(step) <= ['address', 'review', 'payment'].indexOf(currentStep);
  };

  const inputCls = (field) => {
    const hasError = formErrors[field];
    return [
      "w-full brutal-border bg-[color:var(--chipzo-paper)] px-4 py-3 font-bold placeholder-[color:var(--chipzo-muted)] focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:border-[color:var(--chipzo-primary)] transition-shadow text-sm",
      hasError ? "border-red-500" : "",
    ].join(" ");
  };

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)]">
        <Navbar onNavigate={onNavigate} currentPage="checkout" activeCategory={activeCategory} cartCount={cartCount} />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-32 lg:pb-24 flex flex-col gap-10">
          <form className="flex flex-col gap-10" onSubmit={(e) => e.preventDefault()}>
            {/* Progress Steps */}
            <div className="flex items-center justify-between gap-2">
              {['ADDRESS', 'REVIEW', 'PAYMENT'].map((label, i) => {
                const stepKey = ['address', 'review', 'payment'][i];
                return (
                  <div key={stepKey} className={`flex-1 flex flex-col items-center ${isStepActive(stepKey) ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-full h-4 brutal-border brutal-shadow mb-2 ${isStepActive(stepKey) ? 'bg-[color:var(--chipzo-primary)]' : 'bg-[color:var(--chipzo-surface)]'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${currentStep === stepKey ? 'text-[color:var(--chipzo-primary)]' : ''}`}>
                      0{i + 1}_{label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="border-[3px] border-red-500 bg-red-50 text-red-700 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
                <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">ERROR</p>
                  <p className="text-[10px] font-bold mt-0.5 opacity-90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* ===== ADDRESS STEP ===== */}
            {currentStep === 'address' && (
              <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow overflow-hidden">
                <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] flex items-center gap-2">
                  <MapPin size={18} strokeWidth={2.5} />
                  <h2 className="text-lg font-black uppercase tracking-tight">Select Delivery Address</h2>
                </div>

                <div className="p-5 space-y-4">
                  {/* Saved Addresses List */}
                  {savedAddresses.length === 0 && !showAddForm ? (
                    <div className="text-center py-10 brutal-border bg-[color:var(--chipzo-paper)]">
                      <MapPin size={32} className="mx-auto text-[color:var(--chipzo-muted)] mb-3" />
                      <p className="text-sm font-black uppercase">No saved addresses</p>
                      <p className="text-xs font-bold text-[color:var(--chipzo-muted)] mt-1">Add a delivery address to continue.</p>
                      <button
                        type="button"
                        onClick={() => { setShowAddForm(true); setEditingId(null); setFormData(!isLoggedIn && user ? { ...EMPTY_FORM, fullName: user.name || '', phone: user.phone || '', city: user.city || '' } : EMPTY_FORM); setFormErrors({}); }}
                        className="mt-4 brutal-border brutal-shadow-sm bg-[color:var(--chipzo-primary)] px-5 py-2 text-xs font-black uppercase cursor-pointer flex items-center gap-2 mx-auto hover:-translate-y-[1px] transition-all"
                      >
                        <Plus size={14} /> ADD ADDRESS
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Address Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map(addr => {
                          const isSelected = selectedAddressId === addr._id;
                          const isEditing = editingId === addr._id;
                          return (
                            <div key={addr._id}>
                              {isEditing ? (
                                /* ---- EDIT FORM ---- */
                                <div className="brutal-border bg-[color:var(--chipzo-paper)] p-4 border-[color:var(--chipzo-primary)] col-span-full">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-[color:var(--chipzo-primary)] mb-3">EDIT ADDRESS</p>
                                  <AddressFormFields
                                    formData={formData}
                                    formErrors={formErrors}
                                    onChange={handleInputChange}
                                    inputCls={inputCls}
                                  />
                                  <div className="flex gap-2 mt-4">
                                    <button type="button" onClick={handleSaveAddress} disabled={isSavingAddress}
                                      className="flex-1 brutal-border bg-[color:var(--chipzo-primary)] py-2.5 text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-[1px] transition-all disabled:opacity-50">
                                      {isSavingAddress ? <><Loader size={12} className="animate-spin" /> SAVING...</> : <><Check size={14} /> SAVE</>}
                                    </button>
                                    <button type="button" onClick={cancelEdit}
                                      className="brutal-border bg-[color:var(--chipzo-paper)] py-2.5 px-4 text-xs font-black uppercase cursor-pointer hover:bg-[color:var(--chipzo-surface)]">
                                      CANCEL
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* ---- VIEW CARD ---- */
                                <div
                                  className={`brutal-border bg-[color:var(--chipzo-paper)] p-4 cursor-pointer transition-all hover:-translate-y-[1px] ${
                                    isSelected
                                      ? 'border-[color:var(--chipzo-primary)] shadow-[4px_4px_0_var(--chipzo-primary)]'
                                      : ''
                                  }`}
                                  onClick={() => setSelectedAddressId(addr._id)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-black uppercase text-sm">{addr.fullName}</p>
                                        {addr.isDefault && (
                                          <span className="inline-flex items-center gap-0.5 text-[8px] font-black bg-[color:var(--chipzo-lime)] brutal-border px-1.5 py-0.5 leading-none">
                                            <Star size={8} fill="currentColor" /> DEFAULT
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)] mt-0.5">{addr.phone}</p>
                                    </div>
                                    {/* Radio indicator */}
                                    <div className={`shrink-0 w-5 h-5 rounded-full border-[3px] flex items-center justify-center mt-0.5 ${
                                      isSelected ? 'border-[color:var(--chipzo-primary)] bg-[color:var(--chipzo-primary)]' : 'border-[color:var(--chipzo-ink)]'
                                    }`}>
                                      {isSelected && <div className="w-2 h-2 rounded-full bg-[color:var(--chipzo-paper)]" />}
                                    </div>
                                  </div>
                                  <p className="text-xs font-bold mt-1.5">
                                    {addr.house ? `${addr.house}, ` : ''}{addr.street}
                                  </p>
                                  <p className="text-xs font-bold">{addr.city}, {addr.state} - {addr.pincode}</p>
                                  {addr.landmark && (
                                    <p className="text-[10px] text-[color:var(--chipzo-muted)] mt-0.5">Near: {addr.landmark}</p>
                                  )}
                                  <div className="flex gap-1.5 mt-3 flex-wrap">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); startEdit(addr); }}
                                      className="text-[9px] font-black uppercase brutal-border px-2.5 py-1 bg-[color:var(--chipzo-surface)] hover:bg-[color:var(--chipzo-primary)] cursor-pointer flex items-center gap-1 transition-colors">
                                      <Edit3 size={10} /> EDIT
                                    </button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr._id); }}
                                      className="text-[9px] font-black uppercase brutal-border px-2.5 py-1 bg-red-50 hover:bg-red-500 hover:text-white cursor-pointer flex items-center gap-1 transition-colors">
                                      <Trash2 size={10} /> DELETE
                                    </button>
                                    {!addr.isDefault && (
                                      <button type="button" onClick={(e) => { e.stopPropagation(); handleSetDefault(addr._id); }}
                                        className="text-[9px] font-black uppercase brutal-border px-2.5 py-1 bg-[color:var(--chipzo-surface)] hover:bg-[color:var(--chipzo-lime)] cursor-pointer flex items-center gap-1 transition-colors">
                                        <Star size={10} /> SET DEFAULT
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add New Address Button */}
                      {!showAddForm && !editingId && (
                        <button
                          type="button"
                        onClick={() => { setShowAddForm(true); setEditingId(null); setFormData(!isLoggedIn && user ? { ...EMPTY_FORM, fullName: user.name || '', phone: user.phone || '', city: user.city || '' } : EMPTY_FORM); setFormErrors({}); }}
                          className="w-full brutal-border border-dashed bg-[color:var(--chipzo-paper)] py-3 text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-2 hover:bg-[color:var(--chipzo-surface)] transition-colors"
                        >
                          <Plus size={16} /> ADD NEW ADDRESS
                        </button>
                      )}

                      {/* Add New Address Form */}
                      {showAddForm && (
                        <div className="brutal-border bg-[color:var(--chipzo-paper)] p-4 border-[color:var(--chipzo-primary)]">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[color:var(--chipzo-primary)] mb-3">NEW ADDRESS</p>
                              <AddressFormFields
                                formData={formData}
                                formErrors={formErrors}
                                onChange={handleInputChange}
                                inputCls={inputCls}
                              />
                          <div className="flex gap-2 mt-4">
                            <button type="button" onClick={handleSaveAddress} disabled={isSavingAddress}
                              className="flex-1 brutal-border bg-[color:var(--chipzo-primary)] py-2.5 text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-[1px] transition-all disabled:opacity-50">
                              {isSavingAddress ? <><Loader size={12} className="animate-spin" /> SAVING...</> : <><Check size={14} /> SAVE ADDRESS</>}
                            </button>
                            <button type="button" onClick={cancelEdit}
                              className="brutal-border bg-[color:var(--chipzo-paper)] py-2.5 px-4 text-xs font-black uppercase cursor-pointer hover:bg-[color:var(--chipzo-surface)]">
                              CANCEL
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            )}

            {/* ===== REVIEW STEP ===== */}
            {currentStep === 'review' && (
              <div className="flex flex-col gap-6">
                <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow overflow-hidden">
                  <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] flex justify-between items-center">
                    <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><MapPin size={16} strokeWidth={2.5} /> Delivery Address</h2>
                    <button type="button" onClick={() => setCurrentStep('address')}
                      className="text-[10px] font-black uppercase tracking-widest border-2 border-[color:var(--chipzo-ink)] px-4 py-1 bg-[color:var(--chipzo-surface)] hover:bg-[color:var(--chipzo-primary)] cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      CHANGE
                    </button>
                  </div>
                  <div className="p-6 space-y-1">
                    {selectedAddr ? (
                      <>
                        <p className="font-black text-lg uppercase">{selectedAddr.fullName}</p>
                        <p className="text-sm font-bold text-[color:var(--chipzo-muted)]">{selectedAddr.phone}</p>
                        {selectedAddr.house && <p className="text-sm font-bold">{selectedAddr.house}</p>}
                        <p className="text-sm font-bold">{selectedAddr.street}</p>
                        {selectedAddr.landmark && <p className="text-sm font-bold">Near: {selectedAddr.landmark}</p>}
                        <p className="text-sm font-bold">{selectedAddr.city}, {selectedAddr.state} - {selectedAddr.pincode}</p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-[color:var(--chipzo-muted)]">No address selected.</p>
                    )}
                  </div>
                </section>

                <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow overflow-hidden">
                  <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] flex justify-between items-center">
                    <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><CreditCard size={16} strokeWidth={2.5} /> Payment Method</h2>
                  </div>
                  <div className="p-6 space-y-3">
                    <label className={`flex items-center gap-4 p-4 brutal-border cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'bg-[color:var(--chipzo-primary)]' : 'bg-[color:var(--chipzo-paper)] hover:bg-[color:var(--chipzo-surface)]'}`}>
                      <input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="accent-black" />
                      <CreditCard size={20} strokeWidth={2} />
                      <div>
                        <p className="font-black uppercase text-sm">Razorpay (UPI / Cards / Net Banking)</p>
                        <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)]">Secure online payment</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-4 p-4 brutal-border cursor-pointer transition-all ${paymentMethod === 'cod' ? 'bg-[color:var(--chipzo-lime)]' : 'bg-[color:var(--chipzo-paper)] hover:bg-[color:var(--chipzo-surface)]'}`}>
                      <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-black" />
                      <Banknote size={20} strokeWidth={2} />
                      <div>
                        <p className="font-black uppercase text-sm">Cash on Delivery</p>
                        <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)]">Pay when you receive</p>
                      </div>
                    </label>
                  </div>
                </section>

                <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow overflow-hidden">
                  <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] flex justify-between items-center">
                    <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><span className="w-2 h-2 bg-[color:var(--chipzo-ink)]" /> Order Summary</h2>
                    <button type="button" onClick={() => onNavigate?.('cart')}
                      className="text-[10px] font-black uppercase tracking-widest border-2 border-[color:var(--chipzo-ink)] px-4 py-1 bg-[color:var(--chipzo-surface)] hover:bg-[color:var(--chipzo-primary)] cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      EDIT CART
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-[color:var(--chipzo-ink)] pb-4 last:border-0">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-16 h-16 brutal-border bg-[color:var(--chipzo-paper)] flex items-center justify-center overflow-hidden shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[8px] font-black text-[color:var(--chipzo-muted)]">NO IMG</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black uppercase text-sm leading-tight">{item.title}</p>
                              <p className="text-xs font-bold text-[color:var(--chipzo-muted)]">Qty: {item.quantity} × ₹{item.price?.toFixed(2)}</p>
                            </div>
                          </div>
                          <p className="font-black tabular-prices shrink-0">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t-2 border-[color:var(--chipzo-ink)] space-y-2">
                      <div className="flex justify-between text-sm"><span className="font-bold uppercase">Subtotal</span><span className="font-black tabular-prices">₹{subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm"><span className="font-bold uppercase">Delivery</span><span className="font-black tabular-prices">{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span></div>
                      <div className="flex justify-between pt-2 border-t border-[color:var(--chipzo-ink)]"><span className="font-black uppercase">Total</span><span className="font-black text-xl tabular-prices">₹{total.toFixed(2)}</span></div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Desktop Nav Buttons */}
            <div className="hidden lg:flex justify-between">
              {currentStep === 'review' && (
                <button type="button" onClick={() => setCurrentStep('address')}
                  className="bg-[color:var(--chipzo-surface)] font-black uppercase py-4 px-8 brutal-border brutal-shadow cursor-pointer flex items-center gap-3 hover:-translate-y-[1px] transition-all">
                  <ArrowLeft strokeWidth={3} /> BACK TO ADDRESS
                </button>
              )}
              {currentStep === 'address' && <div />}
              {currentStep === 'address' && (
                <button type="button" onClick={handleProceedToReview}
                  className="bg-[color:var(--chipzo-primary)] text-[color:var(--chipzo-ink)] font-black uppercase py-4 px-8 brutal-border brutal-shadow cursor-pointer flex items-center gap-3 text-lg hover:-translate-y-[1px] transition-all">
                  REVIEW ORDER <ArrowRight strokeWidth={3} />
                </button>
              )}
              {currentStep === 'review' && (
                <button type="button" onClick={() => {
                  if (runValidations(selectedAddr)) setCurrentStep('payment')
                }}
                  className="bg-[color:var(--chipzo-primary)] text-[color:var(--chipzo-ink)] font-black uppercase py-4 px-8 brutal-border brutal-shadow cursor-pointer flex items-center gap-3 text-lg hover:-translate-y-[1px] transition-all">
                  PROCEED TO PAYMENT <ArrowRight strokeWidth={3} />
                </button>
              )}
              {currentStep === 'payment' && (
                <button type="button" onClick={handlePlaceOrder} disabled={isProcessing}
                  className="bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] font-black uppercase py-4 px-8 brutal-border brutal-shadow cursor-pointer flex items-center gap-3 text-lg hover:-translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {isProcessing ? <><Loader size={20} className="animate-spin" /> PROCESSING...</> : <>{paymentMethod === 'cod' ? 'PLACE ORDER (COD)' : `PAY ₹${total.toFixed(2)}`} <Check strokeWidth={3} /></>}
                </button>
              )}
            </div>

            {/* Mobile Sticky Nav */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] px-4 py-3 shadow-[0_-4px_0_rgba(0,0,0,1)] lg:hidden">
              <div className="flex items-center justify-between gap-4">
                {currentStep !== 'address' && (
                  <button type="button" onClick={() => setCurrentStep(currentStep === 'payment' ? 'review' : 'address')}
                    className="flex items-center gap-1 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] py-3 px-3 text-xs font-black uppercase shadow-[3px_3px_0_rgba(0,0,0,1)] cursor-pointer shrink-0">
                    <ArrowLeft size={14} strokeWidth={3} /> BACK
                  </button>
                )}
                {currentStep === 'address' && (
                  <button type="button" onClick={handleProceedToReview}
                    className="flex flex-1 items-center justify-center gap-2 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] py-3 px-4 text-xs font-black uppercase shadow-[3px_3px_0_rgba(0,0,0,1)] cursor-pointer">
                    REVIEW ORDER <ArrowRight size={14} strokeWidth={3} />
                  </button>
                )}
                {currentStep === 'review' && (
                  <button type="button" onClick={() => {
                    if (runValidations(selectedAddr)) setCurrentStep('payment')
                  }}
                    className="flex flex-1 items-center justify-center gap-2 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] py-3 px-4 text-xs font-black uppercase shadow-[3px_3px_0_rgba(0,0,0,1)] cursor-pointer">
                    TO PAYMENT <ArrowRight size={14} strokeWidth={3} />
                  </button>
                )}
                {currentStep === 'payment' && (
                  <button type="button" onClick={handlePlaceOrder} disabled={isProcessing}
                    className="flex flex-1 items-center justify-center gap-2 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] py-3 px-4 text-xs font-black uppercase shadow-[3px_3px_0_rgba(0,0,0,1)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    {isProcessing ? <><Loader size={14} className="animate-spin" /> PROCESSING</> : <>{paymentMethod === 'cod' ? 'PLACE ORDER' : `PAY ₹${total.toFixed(2)}`}</>}
                  </button>
                )}
              </div>
            </div>
          </form>
        </main>

        <Footer />
      </div>

      <AlertModal
        isOpen={alertModal.open}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </SmoothScroll>
  );
}

/* ─── Address Form Sub-Component ─── */
function AddressFormFields({ formData, formErrors, onChange, inputCls }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">FULL NAME *</label>
        <input required name="fullName" value={formData.fullName} onChange={onChange} className={inputCls('fullName')} placeholder="Jane Doe" type="text" />
        {formErrors.fullName && <p className="text-[9px] font-bold text-red-500">{formErrors.fullName}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">MOBILE NUMBER *</label>
        <input required name="phone" value={formData.phone} onChange={onChange} className={inputCls('phone')} placeholder="9876543210" type="tel" maxLength={10} />
        {formErrors.phone && <p className="text-[9px] font-bold text-red-500">{formErrors.phone}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">PINCODE *</label>
        <input required name="pincode" value={formData.pincode} onChange={onChange} className={inputCls('pincode')} placeholder="560001" type="text" maxLength={6} />
        {formErrors.pincode && <p className="text-[9px] font-bold text-red-500">{formErrors.pincode}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">HOUSE / FLAT / UNIT NO.</label>
        <input name="house" value={formData.house} onChange={onChange} className={inputCls('house')} placeholder="42, Maker Space" type="text" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">STREET / AREA *</label>
        <input required name="street" value={formData.street} onChange={onChange} className={inputCls('street')} placeholder="Silicon Lane, Electronic City" type="text" />
        {formErrors.street && <p className="text-[9px] font-bold text-red-500">{formErrors.street}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">LANDMARK (OPTIONAL)</label>
        <input name="landmark" value={formData.landmark} onChange={onChange} className={inputCls('landmark')} placeholder="Opposite Tech Park" type="text" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">CITY *</label>
        <input required name="city" value={formData.city} onChange={onChange} className={inputCls('city')} placeholder="Bengaluru" type="text" />
        {formErrors.city && <p className="text-[9px] font-bold text-red-500">{formErrors.city}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)]">STATE</label>
        <div className="w-full border-[3px] border-[color:var(--chipzo-muted)] bg-[color:var(--chipzo-surface)] px-4 py-3 text-sm font-bold text-[color:var(--chipzo-muted)] opacity-70 cursor-not-allowed">
          Karnataka
        </div>
        <input type="hidden" name="state" value="Karnataka" />
      </div>
    </div>
  );
}
