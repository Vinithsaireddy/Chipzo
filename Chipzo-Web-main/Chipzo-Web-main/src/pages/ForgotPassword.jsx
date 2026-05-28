import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Cpu, ArrowLeft, Lock, Mail, KeyRound, AlertTriangle, CheckCircle } from 'lucide-react'
import { authAPI } from '../services/api.js'
import { LoadingButton } from '../components/LoadingButton.jsx'
import { useAsyncStatus } from '../hooks/useAsyncAction.js'

const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3, DONE: 4 }

export default function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState(STEPS.EMAIL)
  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const { status: sendStatus, execute: executeSend } = useAsyncStatus({ minDuration: 2000, successDuration: 800 })
  const { status: verifyStatus, execute: executeVerify } = useAsyncStatus({ minDuration: 2000, successDuration: 800 })
  const { status: resetStatus, execute: executeReset } = useAsyncStatus({ minDuration: 2000, successDuration: 800 })

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    executeSend(async () => {
      const res = await authAPI.forgotPassword(email)
      setSuccessMsg(res.message || 'OTP sent to your email.')
      setStep(STEPS.OTP)
    }).catch((err) => {
      setErrorMsg(err?.data?.message || err.message || 'Failed to send OTP.')
    })
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    executeVerify(async () => {
      const res = await authAPI.verifyForgotOTP(email, otp)
      setResetToken(res.data.resetToken)
      setSuccessMsg('OTP verified. Set your new password.')
      setStep(STEPS.PASSWORD)
    }).catch((err) => {
      setErrorMsg(err?.data?.message || err.message || 'Invalid or expired OTP.')
    })
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    executeReset(async () => {
      await authAPI.resetPassword(resetToken, password)
      setSuccessMsg('Password reset successful!')
      setStep(STEPS.DONE)
    }).catch((err) => {
      setErrorMsg(err?.data?.message || err.message || 'Failed to reset password.')
    })
  }

  const goBack = () => {
    if (step === STEPS.EMAIL) {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        navigate('/login')
      }
    } else {
      setStep(step - 1)
      setErrorMsg('')
      setSuccessMsg('')
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
              Password<br />Recovery<br />Protocol
            </h2>
            <div className="space-y-6">
              <div className="border-l-[4px] border-[color:var(--chipzo-primary)] pl-4">
                <p className="text-sm font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Step 1</p>
                <p className="text-lg font-black uppercase tracking-wider text-white">Verify Identity</p>
              </div>
              <div className="border-l-[4px] border-[color:var(--chipzo-primary)] pl-4">
                <p className="text-sm font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Step 2</p>
                <p className="text-lg font-black uppercase tracking-wider text-white">Authorization Code</p>
              </div>
              <div className="border-l-[4px] border-[color:var(--chipzo-primary)] pl-4">
                <p className="text-sm font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">Step 3</p>
                <p className="text-lg font-black uppercase tracking-wider text-[color:var(--chipzo-lime)]">New Credentials</p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t-[2px] border-dashed border-[color:var(--chipzo-muted)]">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">[■] SECURE CHANNEL ESTABLISHED</p>
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
            <h1 className="text-3xl font-black uppercase tracking-tight text-[color:var(--chipzo-ink)]">
              {step === STEPS.EMAIL && 'RECOVER ACCESS'}
              {step === STEPS.OTP && 'AUTHORIZE'}
              {step === STEPS.PASSWORD && 'NEW CREDENTIALS'}
              {step === STEPS.DONE && 'RECOVERY COMPLETE'}
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)] mt-2">
              {step === STEPS.EMAIL && 'Enter your registered email to receive a reset code.'}
              {step === STEPS.OTP && 'Enter the 6-digit code sent to your email.'}
              {step === STEPS.PASSWORD && 'Choose a new secure password for your account.'}
              {step === STEPS.DONE && 'Your password has been reset successfully.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 border-[3px] border-[color:var(--chipzo-ink)] bg-red-700 text-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">SIGNAL ERROR</p>
                <p className="text-[10px] font-bold mt-0.5 opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && step !== STEPS.DONE && (
            <div className="mb-6 border-[3px] border-[color:var(--chipzo-ink)] bg-green-800 text-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
              <CheckCircle className="shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">NODE STATUS</p>
                <p className="text-[10px] font-bold mt-0.5 opacity-90">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Step 1: Email */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] mb-1">
                  REGISTERED EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ENGINEER@SYS.COM"
                  className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-[color:var(--chipzo-muted)]"
                />
              </div>

              <LoadingButton
                type="submit"
                status={sendStatus}
                variant="lime"
                size="lg"
                icon={Mail}
                fullWidth
                className="mt-6"
              >
                SEND RESET CODE →
              </LoadingButton>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] mb-1">
                  AUTHORIZATION CODE
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] px-4 py-3 text-sm font-bold tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-[color:var(--chipzo-muted)] text-center text-2xl tracking-[0.3em]"
                />
                <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>

              <LoadingButton
                type="submit"
                status={verifyStatus}
                disabled={otp.length !== 6}
                variant="lime"
                size="lg"
                icon={KeyRound}
                fullWidth
                className="mt-6"
              >
                VERIFY CODE →
              </LoadingButton>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === STEPS.PASSWORD && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-ink)] mb-1">
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] px-4 py-3 text-sm font-bold tracking-wider text-[color:var(--chipzo-ink)] outline-none focus:border-[color:var(--chipzo-primary)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-[color:var(--chipzo-muted)]"
                />
                <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-[color:var(--chipzo-muted)]">
                  Minimum 8 characters required
                </p>
              </div>

              <LoadingButton
                type="submit"
                status={resetStatus}
                disabled={password.length < 8}
                variant="lime"
                size="lg"
                icon={Lock}
                fullWidth
                className="mt-6"
              >
                RESET PASSWORD →
              </LoadingButton>
            </form>
          )}

          {/* Step 4: Done */}
          {step === STEPS.DONE && (
            <div className="space-y-5">
              <div className="border-[3px] border-[color:var(--chipzo-ink)] bg-green-800 text-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
                <CheckCircle className="shrink-0 mt-0.5" size={24} />
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-[color:var(--chipzo-lime)]">PASSWORD RESET SUCCESSFUL</p>
                  <p className="text-xs font-bold mt-1 opacity-90">You can now log in with your new credentials.</p>
                </div>
              </div>

              <LoadingButton
                type="button"
                onClick={() => navigate('/login')}
                variant="lime"
                size="lg"
                icon={Lock}
                fullWidth
                className="mt-6"
              >
                PROCEED TO LOGIN →
              </LoadingButton>
            </div>
          )}

          <div className="mt-8 border-t-[2px] border-dashed border-[color:var(--chipzo-rule)] pt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-black uppercase tracking-widest text-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-ink)] transition-colors"
            >
              ← BACK TO LOGIN
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
