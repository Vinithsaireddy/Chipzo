import { useState, useEffect, useRef } from 'react';
import SmoothScroll from '../components/SmoothScroll.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { 
  ArrowLeft, 
  ExternalLink, 
  Compass, 
  Cpu, 
  Clock, 
  Truck, 
  MapPin, 
  Activity, 
  Terminal, 
  Grid, 
  FileText,
  ShieldAlert,
  Signal,
  CheckCircle2
} from 'lucide-react';

const mockOrder = {
  orderId: 'CPZ-ORD-884920',
  date: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }),
  items: [
    {
      id: 'neuralx',
      code: 'CPZ-NLX',
      title: 'NeuralX AI Accelerator',
      specs: ['ARCH: RISC-V 64-BIT', 'TPU: 4.2 TOPS', 'PWR: 3.3V/500mA'],
      price: 129.99,
      quantity: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZx7Q0VAolyfpIeVRHF_YPQtNM0fXFCmo3-AlKrSWw4eoGJf5GiT6zCiRO4_WY8_8nhAxB-X_VxVHKkIjJ6Ek6bVM0Y-21GxBd4jnuB8KaBh4DavFX2xUXWR6UkJEH2D6sUCDj3mG8QRMN-_p1tEKycw26b0kYPNXFJ1o00xFC-TWloY2UZF0oNy2VR5hT5jVRWdIOaaBVwNbabV9Ch1e3G1IMPM-ZdesYSTBVTl20oOgR5cmxFuwf9xEqh6_-36lyXiMNBJ-XvzY'
    },
    {
      id: 'esp32',
      code: 'CPZ-ESP32',
      title: 'ESP32-WROOM-32D',
      specs: ['MCU: LX6 DUAL-CORE', 'FREQ: 240MHZ', 'FLASH: 4MB'],
      price: 8.99,
      quantity: 2,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCETFwmUzj3YEI7g1b26_A4Q8ntbvHOyL7LS08SPS0ptZIR3471iY19Pkn2Qbek6TqDgo6J2I5WEVSoXj_WWdnyNRjZPrapTk1oTWPXUUWZJRQJG99k9Ae3IjwU_uaptd6_xBoy6-Ss8_RWJKHAjr2xwQF60VmdsKPb11-HsU6znw3_TF3HZpPl77wcWKhdnTF0-6bWs30I8dv0VLR24lfCHA54QWxbCz5r2molimfqRuaSiU-IGFGijfFMqtUSLEAYcLdjsBUDGrY'
    }
  ],
  address: {
    fullName: 'Ada Lovelace',
    phone: '+91 98888 77777',
    address: 'Penthouse A, Babbage Tower, 102 Binary Lane, Indiranagar',
    city: 'Bengaluru',
    pincode: '560008',
    landmark: 'Near Silicon Gate'
  },
  subtotal: 147.97,
  shipping: 0,
};

export default function Tracking({ onNavigate, activeCategory, completedOrder, onResetOrder }) {
  const order = completedOrder || mockOrder;
  const cartCount = 0; // cart is cleared on success, showing 0 in navbar for context

  const [eta, setEta] = useState(84);
  const [speed, setSpeed] = useState(42);
  const [coords, setCoords] = useState([12.9716, 77.5946]); // Bangalore Central
  const [signal, setSignal] = useState(98);
  const [podTemp, setPodTemp] = useState(26.4);
  const [logs, setLogs] = useState([
    'SYSTEM: ACTIVE // DISPATCH CHANNEL STABLE',
    'Ingesting order CPZ-ORD payload successfully...',
    'Assembly Vault B-04 unlocked by drone keyframe...',
    'ESD-safe shielding active. Thermal pod sealed.'
  ]);
  const [radarOpen, setRadarOpen] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const logFeedRef = useRef(null);

  // SHIPROCKET QUICK INTEGRATION GATEWAY
  // Customize this base URL as needed. This endpoint uses "quick by shiprocket".
  const SHIPROCKET_QUICK_BASE_URL = 'https://quick.shiprocket.co/tracking';
  const shiprocketUrl = `${SHIPROCKET_QUICK_BASE_URL}/${order.orderId}`;

  // Log feed simulation
  useEffect(() => {
    const events = [
      'Dispatched Dhanush K. (COURIER-73) with electro-scooter.',
      'Rider reached outer ring road routing checkpoint.',
      'Mesh signal active. Signal locking: 98% 5G mesh link.',
      'Telemetry synchronized: LAT: 12.9723 N, LON: 77.6012 E.',
      'Speed fluctuation corrected to 45 KM/H.',
      'Thermal status check: 25.8°C (ESD status: SECURE).',
      'Approaching Indiranagar double-lane junction bypass.',
      'Rider entering Binary Lane routing buffer zone.'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < events.length) {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${events[index]}`]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 4500 / multiplier);

    return () => clearInterval(interval);
  }, [multiplier]);

  // Telemetry fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      // Small randomized fluctuations
      setSpeed(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return next > 55 ? 55 : next < 25 ? 25 : next;
      });
      setSignal(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const next = prev + delta;
        return next > 100 ? 100 : next < 90 ? 90 : next;
      });
      setPodTemp(prev => {
        const delta = (Math.random() * 0.4) - 0.2;
        return parseFloat((prev + delta).toFixed(1));
      });
      setEta(prev => {
        if (prev > 1) {
          return prev - 1;
        }
        return prev;
      });
      setCoords(prev => {
        // Linear move towards Lovelace Pin (Indiranagar ~ 12.9783, 77.6408)
        const latTarget = 12.9783;
        const lonTarget = 77.6408;
        const latStep = (latTarget - prev[0]) * 0.05 * multiplier;
        const lonStep = (lonTarget - prev[1]) * 0.05 * multiplier;
        return [
          parseFloat((prev[0] + latStep).toFixed(4)),
          parseFloat((prev[1] + lonStep).toFixed(4))
        ];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [multiplier]);

  // Scroll down console logs
  useEffect(() => {
    if (logFeedRef.current) {
      logFeedRef.current.scrollTop = logFeedRef.current.scrollHeight;
    }
  }, [logs]);

  const totalPayable = order.subtotal + order.shipping;

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)] relative selection:bg-[color:var(--chipzo-primary)] selection:text-white noise-bg">
        <Navbar onNavigate={onNavigate} currentPage="tracking" activeCategory={activeCategory} cartCount={cartCount} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 flex flex-col gap-10">
          
          {/* Hero Alert Control Panel */}
          <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow relative overflow-hidden p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 bg-[color:var(--chipzo-primary)] text-[color:var(--chipzo-ink)] text-[10px] font-black uppercase px-3 py-1 border-l-3 border-b-3 border-[color:var(--chipzo-ink)]">
              SYS_CONFIRMED // OPERATIONAL
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 shrink-0 bg-[color:var(--chipzo-primary)] brutal-border brutal-shadow-sm flex items-center justify-center text-[color:var(--chipzo-paper)] animate-levitate">
                <CheckCircle2 size={36} strokeWidth={3} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 brutal-border"></span>
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
                    ORDER DISPATCH COMPLETED
                  </h1>
                </div>
                <p className="text-xs sm:text-sm font-bold text-[color:var(--chipzo-muted)] uppercase tracking-wider flex items-center gap-2">
                  <span>[■] DELIVERY PROTOCOL ACTIVE</span>
                  <span className="hidden sm:inline">//</span>
                  <span>SYS ID: {order.orderId}</span>
                </p>
              </div>
            </div>

            {/* Hardware-Terminal Clock Panel */}
            <div className="flex gap-4 self-stretch md:self-auto border-t-3 md:border-t-0 md:border-l-3 border-[color:var(--chipzo-ink)] pt-6 md:pt-0 md:pl-8">
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)] flex items-center gap-1.5">
                  <Clock size={10} strokeWidth={3} /> SECURED_ETA_CLOCK
                </span>
                <span className="text-3xl sm:text-4xl font-black tracking-tight tabular-prices uppercase flex items-baseline gap-1">
                  {eta} <span className="text-sm font-bold text-[color:var(--chipzo-muted)] uppercase">MINS</span>
                </span>
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest animate-pulse">
                  ⚡ 90-MIN DISPATCH ASSURANCE LOCK
                </span>
              </div>
            </div>
          </section>

          {/* Payload Manifest — Full Width below hero */}
          <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow">
            <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} strokeWidth={3} aria-hidden="true" /> PAYLOAD_MANIFEST
              </h2>
              <span className="text-[9px] font-black uppercase font-mono text-[color:var(--chipzo-muted)]">
                {order.items.length} UNIT{order.items.length !== 1 ? 'S' : ''} // ORDER: {order.orderId}
              </span>
            </div>

            <div className="p-6 flex flex-col gap-0">
              {/* Item rows */}
              <div className="space-y-0">
                {order.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 py-4 ${
                      index < order.items.length - 1
                        ? 'border-b-2 border-[color:var(--chipzo-ink)]/10'
                        : ''
                    }`}
                  >
                    {/* Thumbnail — explicit pixel lock */}
                    <div
                      className="bg-[color:var(--chipzo-paper)] brutal-border shrink-0 flex items-center justify-center p-1.5 overflow-hidden"
                      style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}
                    >
                      <img
                        src={item.image}
                        alt={item.title || item.name || 'Component'}
                        style={{ width: '44px', height: '44px', objectFit: 'contain', display: 'block' }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black uppercase leading-tight truncate">
                        {item.title || item.name}
                      </h4>
                    </div>

                    {/* Qty badge */}
                    <div className="shrink-0 flex flex-col items-center gap-0.5">
                      <span className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)] tracking-wider">QTY</span>
                      <span className="text-sm font-black font-mono brutal-border px-2 py-0.5 bg-[color:var(--chipzo-paper)] shadow-[1px_1px_0px_var(--chipzo-ink)]">
                        ×{item.quantity}
                      </span>
                    </div>

                    {/* Unit price */}
                    <div className="shrink-0 flex flex-col items-end gap-0.5 min-w-[4.5rem]">
                      <span className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)] tracking-wider">UNIT</span>
                      <span className="text-xs font-black font-mono tabular-prices">
                        ₹{item.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Line total */}
                    <div className="shrink-0 flex flex-col items-end gap-0.5 min-w-[5rem] border-l-2 border-[color:var(--chipzo-ink)]/10 pl-4">
                      <span className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)] tracking-wider">TOTAL</span>
                      <span className="text-sm font-black font-mono tabular-prices text-[color:var(--chipzo-primary)]">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order totals */}
              <div className="mt-4 pt-4 border-t-[3px] border-[color:var(--chipzo-ink)] flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 text-xs font-bold font-mono">
                <div className="flex items-center gap-6 sm:gap-8">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase text-[color:var(--chipzo-muted)] tracking-wider">SUBTOTAL</span>
                    <span className="tabular-prices">₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase text-[color:var(--chipzo-muted)] tracking-wider">SHIPPING</span>
                    <span className="tabular-prices uppercase text-emerald-600">
                      {order.shipping === 0 ? 'FREE' : `₹${order.shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex flex-col items-end border-l-2 border-[color:var(--chipzo-ink)] pl-6">
                    <span className="text-[9px] uppercase text-[color:var(--chipzo-muted)] tracking-wider">GRAND_TOTAL</span>
                    <span className="text-lg font-black tabular-prices text-[color:var(--chipzo-primary)]">
                      ₹{totalPayable.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Telemetry & Dispatch Tracker */}
            <div className="lg:col-span-12 flex flex-col gap-8">
              
              {/* Circuit timeline & live tracker */}
              <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow">
                <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] flex justify-between items-center bg-[color:var(--chipzo-surface)]">
                  <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Compass size={16} strokeWidth={3} /> PCB_DISPATCH_TIMELINE
                  </h2>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-[color:var(--chipzo-lime)] brutal-border px-2 py-0.5 shadow-[1px_1px_0px_var(--chipzo-ink)]">
                    COURIER: ACTIVE
                  </span>
                </div>
                
                <div className="p-6 sm:p-8 bg-[color:var(--chipzo-paper)] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] circuit-bg pointer-events-none"></div>
                  
                  {/* Neobrutalist Stepper circuit traces */}
                  <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 z-10">
                    
                    {/* Horizontal Connector Line (Only for desktop) */}
                    <div className="absolute top-8 left-8 right-8 h-1 bg-[color:var(--chipzo-ink)]/15 hidden sm:block pointer-events-none">
                      <div className="h-full bg-[color:var(--chipzo-primary)] transition-all duration-500" style={{ width: '66%' }}></div>
                    </div>

                    {/* Step 1 */}
                    <div className="flex-1 flex sm:flex-col items-center gap-4 relative">
                      <div className="w-16 h-16 shrink-0 brutal-border bg-[color:var(--chipzo-lime)] brutal-shadow-sm flex items-center justify-center font-black text-lg z-10">
                        01
                      </div>
                      <div className="sm:text-center">
                        <p className="font-black text-xs uppercase tracking-tight">ASSEMBLY</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">DEPARTED 17:35</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex-1 flex sm:flex-col items-center gap-4 relative">
                      <div className="w-16 h-16 shrink-0 brutal-border bg-[color:var(--chipzo-lime)] brutal-shadow-sm flex items-center justify-center font-black text-lg z-10">
                        02
                      </div>
                      <div className="sm:text-center">
                        <p className="font-black text-xs uppercase tracking-tight">DISPATCHED</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">HANDED OVER 17:36</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex-1 flex sm:flex-col items-center gap-4 relative">
                      <div className="w-16 h-16 shrink-0 brutal-border bg-[color:var(--chipzo-primary)] brutal-shadow-sm flex items-center justify-center font-black text-lg z-10 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-[color:var(--chipzo-primary)] opacity-40"></span>
                        03
                      </div>
                      <div className="sm:text-center">
                        <p className="font-black text-xs uppercase tracking-tight text-[color:var(--chipzo-primary)]">IN TRANSIT</p>
                        <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)] uppercase animate-pulse">DHANUSH ON ROUTE</p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex-1 flex sm:flex-col items-center gap-4 relative opacity-40">
                      <div className="w-16 h-16 shrink-0 brutal-border bg-[color:var(--chipzo-surface)] brutal-shadow-sm flex items-center justify-center font-black text-lg z-10">
                        04
                      </div>
                      <div className="sm:text-center">
                        <p className="font-black text-xs uppercase tracking-tight">ARRIVED</p>
                        <p className="text-[10px] font-bold uppercase">BENCH DELIVERY</p>
                      </div>
                    </div>

                  </div>
                </div>
              </section>

              {/* Destination & Shiprocket Bridge Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Destination bench details */}
                <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow">
                  <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)]">
                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={16} strokeWidth={3} /> BENCH_DESTINATION
                    </h2>
                  </div>
                  
                  <div className="p-6 space-y-4 text-xs font-bold">
                    <div>
                      <span className="text-[9px] font-black text-[color:var(--chipzo-muted)] uppercase tracking-wider block">RECIPIENT_OPERATOR</span>
                      <span className="text-sm font-black uppercase">{order.address.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-[color:var(--chipzo-muted)] uppercase tracking-wider block">SIGNAL_CONTACT</span>
                      <span className="font-mono">{order.address.phone}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-[color:var(--chipzo-muted)] uppercase tracking-wider block">STATION_COORDINATES</span>
                      <span className="uppercase text-[11px] leading-relaxed block">{order.address.address}</span>
                      <span className="uppercase text-[11px] leading-relaxed block text-[color:var(--chipzo-muted)]">
                        {order.address.city} - {order.address.pincode}
                      </span>
                    </div>
                    {order.address.landmark && (
                      <div>
                        <span className="text-[9px] font-black text-[color:var(--chipzo-muted)] uppercase tracking-wider block">LANDMARK_INDICATOR</span>
                        <span className="uppercase text-[11px] block">{order.address.landmark}</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Shiprocket Quick API Bridge */}
                <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow">
                  <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] flex justify-between items-center">
                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Compass size={16} strokeWidth={3} className="text-[color:var(--chipzo-primary)]" /> SHIPROCKET_BRIDGE
                    </h2>
                    <span className="text-[9px] font-black uppercase bg-[color:var(--chipzo-lime)] brutal-border px-2 py-0.5 shadow-[1px_1px_0px_var(--chipzo-ink)]">
                      ONLINE
                    </span>
                  </div>
                  
                  <div className="p-6 space-y-4 text-xs font-bold">
                    <p className="text-[11px] leading-relaxed text-[color:var(--chipzo-muted)] uppercase">
                      This order is routed via **Quick by Shiprocket**. Use the direct bridge link below to bypass regional console telemetry.
                    </p>
                    
                    <div className="bg-[color:var(--chipzo-ink)] text-emerald-400 p-4 font-mono text-[10px] space-y-1 brutal-border border-[color:var(--chipzo-ink)]">
                      <div className="flex justify-between">
                        <span className="opacity-60">GATEWAY_HOST:</span>
                        <span>quick.shiprocket.co</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-60">ACTIVE_ROUTE:</span>
                        <span>/tracking/{order.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-60">API_PROTOCOL:</span>
                        <span>HTTPS // JSON_PAYLOAD</span>
                      </div>
                    </div>

                    <a 
                      href={shiprocketUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-[color:var(--chipzo-primary)] text-white hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer font-black uppercase py-2.5 px-4 brutal-border brutal-shadow transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      DIRECT SHIPROCKET LINK <ExternalLink size={14} strokeWidth={3} />
                    </a>
                  </div>
                </section>
              </div>

              {/* RIDER TELEMETRY DEPLOYMENT BLOCK */}
              <section className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[color:var(--chipzo-paper)] brutal-border brutal-shadow-sm flex items-center justify-center text-[color:var(--chipzo-ink)] shrink-0">
                    <Truck size={28} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)] tracking-wider">COMMERCE DISPATCH AGENT</span>
                    <h3 className="font-black uppercase text-sm">DHANUSH K. [ID: COURIER-73]</h3>
                    <p className="text-[10px] font-bold uppercase text-emerald-600">RATING: 4.95 // 2,420 DELIVERIES</p>
                  </div>
                </div>
                
                <div className="w-full sm:w-auto flex flex-col gap-1 border-t-2 sm:border-t-0 sm:border-l-2 border-[color:var(--chipzo-ink)]/15 pt-4 sm:pt-0 sm:pl-6">
                  <div className="flex justify-between sm:justify-start gap-4">
                    <span className="text-[10px] font-black uppercase text-[color:var(--chipzo-muted)]">POD UNIT:</span>
                    <span className="text-xs font-black uppercase font-mono">ELECTRIC HYPER-POD</span>
                  </div>
                  <div className="flex justify-between sm:justify-start gap-4">
                    <span className="text-[10px] font-black uppercase text-[color:var(--chipzo-muted)]">MESH:</span>
                    <span className="text-xs font-black uppercase font-mono text-emerald-600 flex items-center gap-1">
                      <Signal size={10} /> {signal}% 5G_STABLE
                    </span>
                  </div>
                </div>
              </section>

            </div>
          </div>

          {/* Action Panels */}
          <section className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 brutal-border bg-[color:var(--chipzo-surface)] p-6 brutal-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 brutal-border bg-[color:var(--chipzo-primary)]/20 flex items-center justify-center text-[color:var(--chipzo-primary)]">
                <ShieldAlert size={20} strokeWidth={3} />
              </div>
              <div>
                <p className="text-xs font-black uppercase">NEED LIVE DISPATCH ASSISTANCE?</p>
                <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)] uppercase">DISPATCH TELEMETRY CAN BE ACCESSED VIA LOCAL RADIO PORTAL</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onNavigate('shop')}
                className="bg-[color:var(--chipzo-surface)] text-[color:var(--chipzo-ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer font-black uppercase py-3 px-6 brutal-border brutal-shadow transition-all flex items-center justify-center gap-3 text-xs"
              >
                <ArrowLeft size={16} strokeWidth={3} /> CONTINUE BUILDING
              </button>
              
              <button
                onClick={() => {
                  setRadarOpen(true);
                  // Open actual Shiprocket direct link in a new tab
                  window.open(shiprocketUrl, '_blank');
                }}
                className="bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer font-black uppercase py-3 px-6 brutal-border brutal-shadow transition-all flex items-center justify-center gap-3 text-xs"
              >
                TRACK REAL-TIME <ExternalLink size={16} strokeWidth={3} />
              </button>
            </div>
          </section>

        </main>
        
        {/* Interactive Tactical Radar Overlay Modal */}
        {radarOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
            <div className="w-full max-w-2xl bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow-lg overflow-hidden flex flex-col animate-[scaleIn_0.2s_ease-out]">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Grid size={18} strokeWidth={3} className="text-[color:var(--chipzo-primary)] animate-spin-slow" />
                  REAL_TIME_DISPATCH_RADAR
                </h3>
                <button
                  onClick={() => setRadarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center brutal-border brutal-shadow-sm bg-[color:var(--chipzo-paper)] hover:bg-[color:var(--chipzo-primary)] transition-all duration-150 text-xs font-black hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_var(--chipzo-ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--chipzo-ink)] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 bg-[color:var(--chipzo-paper)] flex flex-col gap-6 relative">
                
                {/* Visual Shiprocket Bridge */}
                <div className="p-4 brutal-border bg-emerald-50 text-emerald-900 border-emerald-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-black uppercase text-xs">SHIPROCKET EXPRESS LINK ACTIVE</h4>
                    <p className="text-[10px] font-bold opacity-85">ORDER ROUTED TO DIRECT tracking URL BRIDGE SUCCESSFULLY.</p>
                  </div>
                  <a 
                    href={shiprocketUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="shrink-0 text-[10px] font-black uppercase tracking-widest border border-emerald-700 bg-white hover:bg-emerald-100 px-3 py-1.5 transition-all flex items-center gap-1.5"
                  >
                    REFRESH SHIPROCKET <ExternalLink size={10} strokeWidth={2.5} />
                  </a>
                </div>

                {/* Radar Grid Graphic Panel */}
                <div className="h-64 sm:h-80 brutal-border bg-[color:var(--chipzo-ink)] text-emerald-400 relative overflow-hidden flex items-center justify-center">
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>
                  
                  {/* Circular Radar Sweep Rings */}
                  <div className="absolute w-48 h-48 border border-emerald-500/20 rounded-full animate-[pulse_3s_infinite]"></div>
                  <div className="absolute w-72 h-72 border border-emerald-500/10 rounded-full"></div>
                  
                  {/* Crosshairs */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-emerald-500/15"></div>
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-emerald-500/15"></div>

                  {/* Station Marker */}
                  <div className="absolute top-1/4 right-1/4 flex flex-col items-center">
                    <div className="w-3 h-3 bg-emerald-400 border border-black rounded-none shadow-[0_0_8px_var(--chipzo-primary)]"></div>
                    <span className="font-mono text-[9px] font-black bg-black px-1 mt-1 text-white border border-emerald-500/30">
                      BENCH_DEST
                    </span>
                  </div>

                  {/* Hub Marker */}
                  <div className="absolute bottom-1/4 left-1/4 flex flex-col items-center">
                    <div className="w-3 h-3 bg-amber-400 border border-black rounded-none"></div>
                    <span className="font-mono text-[9px] font-black bg-black px-1 mt-1 text-white border border-amber-500/30">
                      BAL_HUB_08
                    </span>
                  </div>

                  {/* Rider Pulse Node (Animating along coordinates) */}
                  <div className="absolute flex flex-col items-center animate-bounce z-10" style={{
                    top: '42%',
                    left: '48%'
                  }}>
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[color:var(--chipzo-lime)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-[color:var(--chipzo-lime)] brutal-border"></span>
                    </span>
                    <span className="font-mono text-[9px] font-black bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] border border-[color:var(--chipzo-ink)] px-1 mt-1">
                      DHANUSH // {speed} KM/H
                    </span>
                  </div>

                  {/* Grid Labels */}
                  <div className="absolute bottom-2 left-2 text-[8px] font-mono text-emerald-500/60 uppercase">
                    SYS_RADAR_SECURED // Bangalore MESH V3.0
                  </div>

                </div>

                {/* Simulated Telemetry Stats inside modal */}
                <div className="grid grid-cols-3 border-3 border-[color:var(--chipzo-ink)] text-center text-xs font-mono font-bold bg-[color:var(--chipzo-surface)]">
                  <div className="p-3 border-r-3 border-[color:var(--chipzo-ink)]">
                    <span className="text-[9px] font-black text-[color:var(--chipzo-muted)] block uppercase">DISTANCE</span>
                    <span>3.8 KM REMAINING</span>
                  </div>
                  <div className="p-3 border-r-3 border-[color:var(--chipzo-ink)]">
                    <span className="text-[9px] font-black text-[color:var(--chipzo-muted)] block uppercase">ROUTE_ACCURACY</span>
                    <span>99.82% OPTIMAL</span>
                  </div>
                  <div className="p-3">
                    <span className="text-[9px] font-black text-[color:var(--chipzo-muted)] block uppercase">ESD_LOCK_STATE</span>
                    <span className="text-emerald-600">SECURED (100%)</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </SmoothScroll>
  );
}
