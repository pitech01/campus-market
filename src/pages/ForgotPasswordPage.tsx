import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, AlertCircle, KeyRound, ArrowRight } from 'lucide-react'
import { forgotPassword } from '../lib/api'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await forgotPassword(email)
      setMessage(res.message)
      if (res.reset_token) {
        setResetToken(res.reset_token)
      }
    } catch (err: any) {
      setError(err.message || 'Unable to request password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-inspo-container">
      {/* Left Form Panel */}
      <div className="login-inspo-left">
        <div className="login-inspo-brand">
          <div className="flex items-center gap-2.5">
            <Link to="/" className="brand-logo-link flex items-center gap-2">
              <img src="/images/lincoln-nsuk-logo.png" alt="Lincoln NSUK Logo" className="w-7 h-7 object-contain inline-block" />
              <span className="brand-title">CampusMarket</span>
            </Link>
            <span className="brand-sub-badge hidden sm:inline-flex">Lincoln NSUK Verified</span>
          </div>

          <Link to="/" className="brand-back-btn" aria-label="Back to website">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to website</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>

        <div className="login-inspo-form-wrapper">
          <div className="login-inspo-header">
            <h1 className="login-inspo-title">Reset password</h1>
            <p className="login-inspo-subtitle">Enter your registered student email to receive recovery instructions</p>
          </div>

          {error && (
            <div className="inspo-alert inspo-alert-error" role="alert">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
                <p className="font-bold text-sm flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Reset Request Received!</span>
                </p>
                <p>{message}</p>
                {resetToken && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 text-left font-mono text-[11px] break-all text-emerald-900 dark:text-emerald-200">
                    <span className="font-bold block text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-sans mb-1">
                      Your Reset Token (Pilot Environment):
                    </span>
                    {resetToken}
                  </div>
                )}
              </div>

              {resetToken && (
                <button
                  onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(resetToken)}`)}
                  className="inspo-btn-submit flex items-center justify-center gap-2"
                >
                  <span>Proceed to Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inspo-signup-link text-xs inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-inspo-form">
              <div className="inspo-field">
                <label htmlFor="reset-email" className="inspo-label">
                  Student Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. nusaiba@lincoln.edu.ng or student@lincoln.edu.ng"
                  className="inspo-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inspo-btn-submit"
              >
                {loading ? 'Sending Instructions…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="inspo-footer-prompt">
            Remembered your credentials?{' '}
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
              alt="Nasarawa State University Keffi Student Marketplace Illustration"
              className="inspo-art-image"
            />
          </div>

          <div className="inspo-trust-caption">
            <div className="trust-badge-pill">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Nasarawa State University Keffi Official Campus Marketplace</span>
            </div>
            <p>Institutional student identity security & encrypted campus account authentication.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
