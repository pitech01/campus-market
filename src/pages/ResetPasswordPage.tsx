import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import { resetPassword } from '../lib/api'

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Token may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-inspo-container">
      {/* Left Form Panel */}
      <div className="login-inspo-left">
        <div className="login-inspo-brand">
          <div className="flex items-center gap-3">
            <Link to="/" className="brand-logo-link">
              <svg className="brand-cube-icon" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
              </svg>
              <span className="brand-title">CampusMarket</span>
            </Link>
            <span className="brand-sub-badge">LUC Verified</span>
          </div>

          <Link to="/" className="brand-back-btn">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to website</span>
          </Link>
        </div>

        <div className="login-inspo-form-wrapper">
          <div className="login-inspo-header">
            <h1 className="login-inspo-title">Set new password</h1>
            <p className="login-inspo-subtitle">Create a new secure password for your campus account</p>
          </div>

          {error && (
            <div className="inspo-alert inspo-alert-error" role="alert">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Password Updated Successfully!</h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">Redirecting to login page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-inspo-form">
              <div className="inspo-field">
                <label htmlFor="reset-email-input" className="inspo-label">
                  Student Email
                </label>
                <input
                  id="reset-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. nusaiba@lincoln.edu.my or student@gmail.com"
                  className="inspo-input"
                />
              </div>

              <div className="inspo-field">
                <label htmlFor="reset-token-input" className="inspo-label">
                  Reset Token
                </label>
                <input
                  id="reset-token-input"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste the reset token here"
                  className="inspo-input font-mono text-xs"
                />
              </div>

              <div className="inspo-field">
                <label htmlFor="new-pass-input" className="inspo-label">
                  New Password
                </label>
                <input
                  id="new-pass-input"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="inspo-input"
                />
              </div>

              <div className="inspo-field">
                <label htmlFor="confirm-pass-input" className="inspo-label">
                  Confirm New Password
                </label>
                <input
                  id="confirm-pass-input"
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Repeat new password"
                  className="inspo-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inspo-btn-submit"
              >
                {loading ? 'Updating Password…' : 'Save New Password'}
              </button>
            </form>
          )}

          <p className="inspo-footer-prompt">
            Cancel and return to{' '}
            <Link to="/login" className="inspo-signup-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Illustration Panel */}
      <div className="login-inspo-right">
        <div className="inspo-illustration-wrapper">
          <div className="inspo-art-card">
            <img
              src="/images/auth-illustration.jpg"
              alt="Lincoln University College Student Marketplace Illustration"
              className="inspo-art-image"
            />
          </div>

          <div className="inspo-trust-caption">
            <div className="trust-badge-pill">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Lincoln University College Official Campus Marketplace</span>
            </div>
            <p>Your password is encrypted and stored safely with student privacy guarantees.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
