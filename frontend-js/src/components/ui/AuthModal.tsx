import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'

type Step = 'email' | 'password' | 'register'

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, checkEmail, login, register } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAuthModalOpen) {
      setStep('email')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setError('')
    }
  }, [isAuthModalOpen])

  useEffect(() => {
    if (isAuthModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isAuthModalOpen, step])

  if (!isAuthModalOpen) return null

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Please enter your email address.')
    setIsLoading(true)
    try {
      const exists = await checkEmail(email)
      setStep(exists ? 'password' : 'register')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!password) return setError('Please enter your password.')
    setIsLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid password.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!password) return setError('Please enter a password.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    setIsLoading(true)
    try {
      await register(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    setStep('email')
    setPassword('')
    setConfirmPassword('')
    setError('')
  }

  return (
    <div className="auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAuthModal()}>
      <div className="auth-modal">
        {/* Close button */}
        <button className="auth-modal-close" onClick={closeAuthModal} aria-label="Close">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Back button for password/register steps */}
        {step !== 'email' && (
          <button className="auth-modal-back" onClick={goBack} aria-label="Go back">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Logo / Icon */}
        <div className="auth-modal-logo">
          <svg width="36" height="36" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.313-2.635 10.078 10.078 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.313 2.634 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813Z" fill="currentColor"/>
          </svg>
        </div>

        {/* Title */}
        <h2 className="auth-modal-title">
          {step === 'email' && 'Log in or sign up'}
          {step === 'password' && 'Enter your password'}
          {step === 'register' && 'Create your account'}
        </h2>

        {/* Subtitle */}
        <p className="auth-modal-subtitle">
          {step === 'email' && 'Access smarter AI responses and save your chat history.'}
          {step === 'password' && email}
          {step === 'register' && email}
        </p>

        {/* Error */}
        {error && (
          <div className="auth-modal-error">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Email Step */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="auth-modal-form">
            <input
              ref={inputRef}
              type="email"
              className="auth-modal-input"
              placeholder="Email address"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              autoComplete="email"
              required
            />
            <button type="submit" className="auth-modal-btn" disabled={isLoading}>
              {isLoading ? <span className="auth-spinner" /> : 'Continue'}
            </button>
          </form>
        )}

        {/* Password Step (Login) */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="auth-modal-form">
            <input
              ref={inputRef}
              type="password"
              className="auth-modal-input"
              placeholder="Password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              autoComplete="current-password"
              required
            />
            <button type="submit" className="auth-modal-btn" disabled={isLoading}>
              {isLoading ? <span className="auth-spinner" /> : 'Log in'}
            </button>
          </form>
        )}

        {/* Register Step */}
        {step === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="auth-modal-form">
            <input
              ref={inputRef}
              type="password"
              className="auth-modal-input"
              placeholder="Create a password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              autoComplete="new-password"
              required
            />
            <input
              type="password"
              className="auth-modal-input"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError('') }}
              autoComplete="new-password"
              required
            />
            <button type="submit" className="auth-modal-btn" disabled={isLoading}>
              {isLoading ? <span className="auth-spinner" /> : 'Create account'}
            </button>
          </form>
        )}

        <p className="auth-modal-footer">
          By continuing, you agree to our{' '}
          <a href="#" className="auth-link">Terms</a> and{' '}
          <a href="#" className="auth-link">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
