import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/authContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isAuthenticated } = useAuth()

  const redirectUrl = searchParams.get('redirect') || '/profile'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl, { replace: true })
    }
  }, [isAuthenticated, navigate, redirectUrl])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const res = await login(email, password)

    if (res.success) {
      navigate(redirectUrl, { replace: true })
    } else {
      setErrorMsg(res.message || 'The provided credentials are incorrect. Check your email or password.')
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
            <h1 className="login-inspo-title">Welcome back</h1>
            <p className="login-inspo-subtitle">Please enter your Lincoln NSUK student login details</p>
          </div>

          {errorMsg && (
            <div className="inspo-alert inspo-alert-error" role="alert">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-inspo-form">
            <div className="inspo-field">
              <label htmlFor="email" className="inspo-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="inspo-input"
                placeholder="e.g. student@lincoln.edu.ng or your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="inspo-field">
              <label htmlFor="password" className="inspo-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="inspo-input"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="inspo-options-row">
              <label className="inspo-checkbox-label">
                <input
                  type="checkbox"
                  className="inspo-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember for 30 days</span>
              </label>
              <Link to="/forgot-password" className="inspo-forgot-link">
                Forgot password
              </Link>
            </div>

            <button
              type="submit"
              className="inspo-btn-submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="inspo-footer-prompt">
            Don't have an account?{' '}
            <Link to={`/register${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`} className="inspo-signup-link">
              Sign up
            </Link>
          </p>

          {/* Mobile Campus Safety Note */}
          <div className="login-mobile-trust-note md:hidden">
            <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
            <span>Nasarawa State University Keffi Official Campus Marketplace</span>
          </div>
        </div>
      </div>

      {/* Right Illustration Panel (Desktop & Large Tablets) */}
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
            <p>Buy, sell, and exchange verified student textbooks, tech, and hostel gear safely on campus.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
