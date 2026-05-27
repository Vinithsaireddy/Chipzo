import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VerifyOTP() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState('')

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        background: '#111',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
      }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Verify OTP</h2>
        <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Enter the OTP sent to your email
        </p>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid #333',
            background: '#1a1a1a',
            color: '#fff',
            fontSize: '1.1rem',
            textAlign: 'center',
            letterSpacing: '0.5em',
            marginBottom: '1.5rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: 'none',
            background: '#4f46e5',
            color: '#fff',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Verify
        </button>
      </div>
    </div>
  )
}
