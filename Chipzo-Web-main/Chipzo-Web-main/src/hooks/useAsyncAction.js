import { useState, useRef, useCallback, useEffect } from 'react'

export function useAsyncStatus(options = {}) {
  const { minDuration = 2000, successDuration = 800, onError } = options
  const [status, setStatus] = useState('idle')
  const mountedRef = useRef(true)
  const lockRef = useRef(false)
  const resetTimer = useRef(null)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  const execute = useCallback(async (fn) => {
    if (lockRef.current || status === 'loading') return
    lockRef.current = true
    setStatus('loading')

    const start = Date.now()

    try {
      const result = await fn()

      const elapsed = Date.now() - start
      const remaining = Math.max(0, minDuration - elapsed)
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))

      if (!mountedRef.current) { lockRef.current = false; return }

      setStatus('success')
      resetTimer.current = setTimeout(() => {
        if (mountedRef.current) setStatus('idle')
        lockRef.current = false
      }, successDuration)

      return result
    } catch (err) {
      if (onError) onError(err)

      const elapsed = Date.now() - start
      const remaining = Math.max(0, 2000 - elapsed)
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))

      if (mountedRef.current) setStatus('idle')
      lockRef.current = false
      throw err
    }
  }, [minDuration, successDuration, onError, status])

  const setStatusDirect = useCallback((s) => {
    if (mountedRef.current) setStatus(s)
  }, [])

  return { status, execute, setStatus: setStatusDirect, isIdle: status === 'idle' }
}
