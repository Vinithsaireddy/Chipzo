import { FileText, AlertTriangle, Ban, XCircle, Truck, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import SmoothScroll from '../components/SmoothScroll.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function Terms({ onNavigate, activeCategory, cartCount }) {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)]">
        <Navbar onNavigate={onNavigate} currentPage="terms" activeCategory={activeCategory} cartCount={cartCount} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 flex flex-col gap-8">
          <div className="border-b-[3px] border-[color:var(--chipzo-ink)] pb-4">
            <h1 className="text-4xl sm:text-5xl font-black uppercase leading-none tracking-tighter flex items-center gap-4">
              <FileText size={32} strokeWidth={2.5} />
              Terms & Conditions
            </h1>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-muted)] mt-2">
              Please read these terms carefully before placing an order
            </p>
          </div>

          {/* Cancellation Policy */}
          <section className="brutal-border brutal-shadow bg-[color:var(--chipzo-surface)] overflow-hidden">
            <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-red-50 flex items-center gap-2">
              <AlertTriangle size={18} strokeWidth={2.5} className="text-red-600" />
              <h2 className="text-lg font-black uppercase tracking-tight text-red-700">Cancellation Policy</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 border-2 border-red-200 bg-red-50">
                <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-sm font-bold text-red-800">
                  Chipzo maintains a strict no-cancellation policy. All orders are final once payment is confirmed.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: Ban, text: 'All sales are final.' },
                  { icon: XCircle, text: 'Orders cannot be canceled after successful payment.' },
                  { icon: XCircle, text: 'Orders cannot be modified after placement.' },
                  { icon: Truck, text: 'The dispatch process begins immediately after payment confirmation.' },
                  { icon: AlertTriangle, text: 'Cancellation requests are generally not entertained.' },
                ].map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 brutal-border bg-[color:var(--chipzo-paper)]">
                      <div className="w-8 h-8 brutal-border bg-red-100 flex items-center justify-center shrink-0">
                        <Icon size={16} className="text-red-600" strokeWidth={2.5} />
                      </div>
                      <p className="font-bold text-sm pt-1">{item.text}</p>
                    </div>
                  )
                })}
              </div>

              <div className="p-4 bg-amber-50 border-2 border-amber-300">
                <p className="text-xs font-black uppercase text-amber-700">Need Assistance?</p>
                <p className="text-sm font-bold text-amber-800 mt-1">
                  If you have any concerns or require assistance, please contact our support team at{' '}
                  <a href="mailto:support@shopchipzo.com" className="underline hover:text-[color:var(--chipzo-primary)]">
                    support@shopchipzo.com
                  </a>
                  {' '}or visit our{' '}
                  <Link to="/help" className="underline hover:text-[color:var(--chipzo-primary)]">
                    Help Center
                  </Link>.
                </p>
              </div>
            </div>
          </section>

          {/* General Terms */}
          <section className="brutal-border brutal-shadow bg-[color:var(--chipzo-surface)]">
            <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] flex items-center gap-2">
              <FileText size={18} strokeWidth={2.5} />
              <h2 className="text-lg font-black uppercase tracking-tight">General Terms</h2>
            </div>
            <div className="p-6 space-y-4 text-sm font-bold leading-relaxed text-[color:var(--chipzo-ink)]">
              <p>
                By placing an order on Chipzo, you agree to these terms and conditions. All prices are listed in INR and are
                subject to change without prior notice. Product availability is subject to stock levels.
              </p>
              <p>
                Chipzo reserves the right to refuse or cancel any order for any reason, including but not limited to
                product unavailability, pricing errors, or suspected fraudulent activity.
              </p>
              <p>
                In the unlikely event that an issue arises with your order, please contact our support team immediately.
                While we do not accept cancellations, we are committed to resolving any legitimate concerns.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </SmoothScroll>
  )
}
