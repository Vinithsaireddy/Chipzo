import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Cpu, ArrowLeft, Lock, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { LoadingButton } from '../components/LoadingButton.jsx'
import { useAsyncStatus } from '../hooks/useAsyncAction.js'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const from = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const { status, execute } = useAsyncStatus({ minDuration: 2000, successDuration: 800 })

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    execute(async () => {
      const res = await login(email, password);
      if (res && res.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }).catch((err) => {
      const msg = err?.data?.message || err.message || 'SECURE_CORE_ERROR: Authentication failed.'
      setErrorMsg(msg)
    })
  }

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--chipzo-surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row border-[3px] border-[color:var(--chipzo-ink)] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[color:var(--chipzo-paper)] overflow-hidden">
        {/* Left Informational Panel */}
        <div className="hidden md:flex flex-col justify-between w-1/2 border-r-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] p-8 text-[color:var(--chipzo-paper)]">
          <div>
            <div className="flex h-12 w-12 items-center justify-center border-[2px] border-[color:var(--chipzo-lime)] bg-[color:var(--chipzo-ink)] shadow-[4px_4px_0px_0px_var(--chipzo-lime)] mb-8">
              <Cpu size={32} className="text-[color:var(--chipzo-lime)]" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-[color:var(--chipzo-lime)] mb-6">
              Chipzo<br />System<br />Access
            </h2>
            <div className="space-y-6">
              <div className="border-l-[4px] border-[color:var(--chipzo-primary)] pl-4">
                <p className="text-sm font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Response Time</p>
                <p className="text-lg font-black uppercase tracking-wider text-white">90-120 MIN DELIVERY</p>
              </div>
              <div className="border-l-[4px] border-[color:var(--chipzo-primary)] pl-4">
                <p className="text-sm font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Live Status</p>
                <p className="text-lg font-black uppercase tracking-wider text-white">INVENTORY TRACKING</p>
              </div>
              <div className="border-l-[4px] border-[color:var(--chipzo-primary)] pl-4">
                <p className="text-sm font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Core Loadout</p>
                <p className="text-lg font-black uppercase tracking-wider text-[color:var(--chipzo-lime)]">Microcontrollers<br />Sensors<br />Power Modules</p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t-[2px] border-dashed border-[color:var(--chipzo-muted)]">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">[■] FOR MAKERS &amp; ENGINEERS</p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center bg-[color:var(--chipzo-paper)]">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                type="button"
                onClick={goBack}
                className="flex h-10 w-10 items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                aria-label="Go back"
              >
                <ArrowLeft size={20} strokeWidth={3} />
              </button>
              <div className="md:hidden flex h-10 w-10 items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Cpu size={24} className="text-[color:var(--chipzo-paper)]" />
              </div>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-[color:var(--chipzo-ink)]">LOGIN</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mt-2">Access your hardware delivery dashboard.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 border-[3px] border-[color:var(--chipzo-ink)] bg-red-700 text-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">AUTH SIGNAL REJECTED</p>
                <p className="text-[10px] font-bold mt-0.5 opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] mb-1">
                EMAIL OR USERNAME
              </label>
              <input 
                type="text" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ENGINEER@SYS.COM OR admin" 
                className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-[color:var(--chipzo-muted)]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] mb-1">
                PASSWORD
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] px-4 py-3 text-sm font-bold tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-[color:var(--chipzo-muted)]"
              />
            </div>

            <LoadingButton
              type="submit"
              status={status}
              variant="lime"
              size="lg"
              icon={Lock}
              fullWidth
              className="mt-6"
            >
              ACCESS SYSTEM →
            </LoadingButton>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/forgot-password', { state: { email } })}
              className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)] hover:text-[color:var(--chipzo-primary)] transition-colors"
            >
              FORGOT PASSWORD? RECOVER ACCESS
            </button>
          </div>

          <div className="mt-4 border-t-[2px] border-dashed border-[color:var(--chipzo-rule)] pt-6 text-center">
            <button
              onClick={() => navigate('/signup')}
              className="text-xs font-black uppercase tracking-widest text-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-ink)] transition-colors"
            >
              NEW USER? INITIALIZE ACCOUNT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
