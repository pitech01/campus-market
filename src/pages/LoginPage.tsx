import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/authContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/profile')
  }

  const handleFillDemo = () => {
    setEmail('nusaiba@lincoln.edu.my')
    setPassword('password')
    setErrorMsg(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const res = await login(email, password)

    if (res.success) {
      navigate('/profile')
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
            <h1 className="login-inspo-title">Welcome back</h1>
            <p className="login-inspo-subtitle">Please enter your details</p>
          </div>

          {errorMsg && (
            <div className="inspo-alert inspo-alert-error" role="alert">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
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
                placeholder="e.g. nusaiba@lincoln.edu.my or student@gmail.com"
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

            <button
              type="button"
              className="inspo-btn-demo"
              onClick={handleFillDemo}
            >
              <Zap className="w-3.5 h-3.5 inline mr-1 text-red-600" />
              <span>Quick Fill PRD Demo Student (Nusaiba / ID: 010240376)</span>
            </button>
          </form>

          <p className="inspo-footer-prompt">
            Don't have an account?{' '}
            <Link to="/register" className="inspo-signup-link">
              Sign up
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
            <p>Buy, sell, and exchange verified student textbooks, tech, and hostel gear safely on campus.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
