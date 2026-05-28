import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const variantStyles = {
  lime: `bg-[color:var(--chipzo-lime)] text-[color:var(--chipzo-ink)] border-[color:var(--chipzo-ink)] shadow-[3px_3px_0_var(--chipzo-ink)]`,
  primary: `bg-[color:var(--chipzo-primary)] text-[color:var(--chipzo-ink)] border-[color:var(--chipzo-ink)] shadow-[3px_3px_0_var(--chipzo-ink)]`,
  ink: `bg-[color:var(--chipzo-ink)] text-white border-[color:var(--chipzo-ink)] shadow-[3px_3px_0_var(--chipzo-ink)]`,
  danger: `bg-red-500 text-white border-[color:var(--chipzo-ink)] shadow-[3px_3px_0_var(--chipzo-ink)]`,
  paper: `bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)] border-[color:var(--chipzo-ink)] shadow-[3px_3px_0_var(--chipzo-ink)]`,
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-[9px] gap-1.5',
  md: 'px-5 py-2.5 text-[10px] gap-2',
  lg: 'px-7 py-3.5 text-[11px] gap-2.5',
}

const buttonTextMap = {
  'ADD TO CART': { loading: 'ADDING...', success: 'ADDED' },
  'ADD TO BUILD': { loading: 'ADDING...', success: 'ADDED' },
  'PROCEED': { loading: 'PROCESSING...', success: 'DONE' },
  'PLACE ORDER': { loading: 'PROCESSING...', success: 'CONFIRMED' },
  'PAY': { loading: 'PROCESSING...', success: 'PAID' },
  'CHECKOUT': { loading: 'PROCESSING...', success: 'DONE' },
  'CONFIRM': { loading: 'CONFIRMING...', success: 'CONFIRMED' },
  'SAVE': { loading: 'SAVING...', success: 'SAVED' },
  'UPLOAD': { loading: 'UPLOADING...', success: 'UPLOADED' },
  'LOGIN': { loading: 'AUTHENTICATING...', success: 'ACCESS GRANTED' },
  'SIGN IN': { loading: 'AUTHENTICATING...', success: 'ACCESS GRANTED' },
  'ACCESS': { loading: 'AUTHENTICATING...', success: 'ACCESS GRANTED' },
  'REGISTER': { loading: 'REGISTERING...', success: 'REGISTERED' },
  'SUBMIT': { loading: 'SUBMITTING...', success: 'SUBMITTED' },
  'INITIALIZE': { loading: 'INITIALIZING...', success: 'INITIALIZED' },
  'SEND': { loading: 'SENDING...', success: 'SENT' },
  'VERIFY': { loading: 'VERIFYING...', success: 'VERIFIED' },
  'RESET': { loading: 'RESETTING...', success: 'RESET' },
}

function deriveText(children, status, explicitText) {
  if (explicitText) return explicitText
  const str = typeof children === 'string' ? children.toUpperCase().trim() : ''
  for (const [key, texts] of Object.entries(buttonTextMap)) {
    if (str.includes(key)) return texts[status]
  }
  if (status === 'loading') return 'PROCESSING...'
  if (status === 'success') return 'DONE'
  return children
}

export function LoadingButton({
  children,
  onClick,
  status = 'idle',
  loadingText,
  successText,
  disabled = false,
  variant = 'lime',
  size = 'md',
  icon: Icon,
  fullWidth = false,
  className = '',
  type = 'button',
}) {
  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isDisabled = disabled || isLoading || isSuccess

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      onClick={isLoading ? undefined : onClick}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      className={[
        'relative inline-flex items-center justify-center font-black uppercase tracking-[0.12em]',
        'border-3 brutal-border select-none',
        'transition-all duration-150 ease-out',
        'active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
        fullWidth ? 'w-full' : '',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled ? 'opacity-40 cursor-not-allowed active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0_var(--chipzo-ink)]' : 'cursor-pointer hover:-translate-y-[1px] hover:-translate-x-[1px]',
        className,
      ].join(' ')}
    >
      {isLoading && <LoadingContent label={deriveText(children, 'loading', loadingText)} />}
      {isSuccess && <SuccessContent label={deriveText(children, 'success', successText)} size={size} />}
      {status === 'idle' && (
        <>
          {Icon && <Icon size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} strokeWidth={2.5} aria-hidden />}
          {children}
        </>
      )}
    </motion.button>
  )
}

function LoadingContent({ label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-[2px]">
        <motion.span
          className="w-[2px] h-[10px] bg-current block"
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.25, 0.75, 1], ease: 'linear' }}
        />
        <motion.span
          className="w-[2px] h-[10px] bg-current block"
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.15, 0.4, 0.85, 1], ease: 'linear' }}
        />
        <motion.span
          className="w-[2px] h-[10px] bg-current block"
          animate={{ opacity: [1, 0, 0, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.3, 0.7, 1], ease: 'linear' }}
        />
      </span>
      <motion.span
        key={label}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.span>
    </span>
  )
}

function SuccessContent({ label, size }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="inline-flex items-center gap-1.5"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <Check size={size === 'sm' ? 10 : 14} strokeWidth={3} />
      </motion.span>
      <motion.span
        key={label}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        {label}
      </motion.span>
    </motion.span>
  )
}
