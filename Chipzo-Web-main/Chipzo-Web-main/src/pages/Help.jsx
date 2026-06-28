import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronDown, Phone, Mail, HelpCircle, FileText, MessageCircle } from 'lucide-react'
import SmoothScroll from '../components/SmoothScroll.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

const navItems = [
  { label: 'Terms & Conditions', icon: FileText, to: '/terms' },
  { label: 'Help', icon: HelpCircle, to: '/help' },
  { label: 'Support Chipzo', icon: MessageCircle, to: 'mailto:support@shopchipzo.com' },
]

export default function Help({ onNavigate, activeCategory, cartCount }) {
  const [showCancellation, setShowCancellation] = useState(false)

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)]">
        <Navbar onNavigate={onNavigate} currentPage="help" activeCategory={activeCategory} cartCount={cartCount} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 flex flex-col gap-8">
          <div className="border-b-[3px] border-[color:var(--chipzo-ink)] pb-4">
            <h1 className="text-4xl sm:text-5xl font-black uppercase leading-none tracking-tighter flex items-center gap-4">
              <HelpCircle size={32} strokeWidth={2.5} />
              Help Center
            </h1>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-muted)] mt-2">
              Find answers and support for your orders
            </p>
          </div>

          {/* Navigation Items */}
          <div className="grid gap-3 sm:grid-cols-3">
            {navItems.map((item) => (
              item.to.startsWith('mailto:') ? (
                <a
                  key={item.label}
                  href={item.to}
                  className="brutal-border brutal-shadow bg-[color:var(--chipzo-surface)] p-5 flex items-center gap-4 hover:-translate-y-[1px] transition-all"
                >
                  <div className="w-12 h-12 brutal-border bg-[color:var(--chipzo-primary)] flex items-center justify-center shrink-0">
                    <item.icon size={22} strokeWidth={2.5} />
                  </div>
                  <span className="font-black uppercase text-sm">{item.label}</span>
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  className="brutal-border brutal-shadow bg-[color:var(--chipzo-surface)] p-5 flex items-center gap-4 hover:-translate-y-[1px] transition-all"
                >
                  <div className="w-12 h-12 brutal-border bg-[color:var(--chipzo-primary)] flex items-center justify-center shrink-0">
                    <item.icon size={22} strokeWidth={2.5} />
                  </div>
                  <span className="font-black uppercase text-sm">{item.label}</span>
                </Link>
              )
            ))}
          </div>

          {/* Help Section */}
          <section className="brutal-border brutal-shadow bg-[color:var(--chipzo-surface)] overflow-hidden">
            <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] flex items-center gap-2">
              <HelpCircle size={18} strokeWidth={2.5} />
              <h2 className="text-lg font-black uppercase tracking-tight">Help</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Cancellation Request */}
              <div className="brutal-border bg-[color:var(--chipzo-paper)] overflow-hidden">
                <button
                  onClick={() => setShowCancellation(!showCancellation)}
                  className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-[color:var(--chipzo-surface)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 brutal-border bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle size={20} className="text-red-600" strokeWidth={2.5} />
                    </div>
                    <span className="font-black uppercase text-sm text-left">Need to Cancel an Order?</span>
                  </div>
                  <ChevronDown size={20} strokeWidth={3} className={`transition-transform ${showCancellation ? 'rotate-180' : ''}`} />
                </button>

                {showCancellation && (
                  <div className="border-t-[3px] border-[color:var(--chipzo-ink)] p-5 space-y-4">
                    <div className="flex items-start gap-3 p-4 border-2 border-red-300 bg-red-50">
                      <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <div>
                        <p className="font-black uppercase text-xs text-red-700">Cancellation Policy</p>
                        <p className="text-sm font-bold text-red-800 mt-1">
                          Orders cannot be canceled once they have been placed and payment has been processed. If you believe there is an exceptional circumstance, please contact us at:
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <a
                        href="tel:+1234567890"
                        className="brutal-border brutal-shadow bg-[color:var(--chipzo-surface)] p-4 flex items-center gap-3 hover:-translate-y-[1px] transition-all"
                      >
                        <div className="w-10 h-10 brutal-border bg-[color:var(--chipzo-primary)] flex items-center justify-center shrink-0">
                          <Phone size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)]">Phone</p>
                          <p className="font-black text-sm">+1 (234) 567-890</p>
                        </div>
                      </a>

                      <a
                        href="mailto:support@shopchipzo.com"
                        className="brutal-border brutal-shadow bg-[color:var(--chipzo-surface)] p-4 flex items-center gap-3 hover:-translate-y-[1px] transition-all"
                      >
                        <div className="w-10 h-10 brutal-border bg-[color:var(--chipzo-primary)] flex items-center justify-center shrink-0">
                          <Mail size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)]">Email</p>
                          <p className="font-black text-sm">support@shopchipzo.com</p>
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Support Email */}
          <section className="brutal-border brutal-shadow bg-[color:var(--chipzo-surface)] p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 brutal-border bg-[color:var(--chipzo-lime)] flex items-center justify-center shrink-0">
                <Mail size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-[color:var(--chipzo-muted)]">Contact & Queries</p>
                <a href="mailto:support@shopchipzo.com" className="font-black text-lg underline hover:text-[color:var(--chipzo-primary)] transition-colors">
                  support@shopchipzo.com
                </a>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </SmoothScroll>
  )
}
