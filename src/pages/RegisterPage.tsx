import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/authContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuth()

  const [form, setForm] = useState({
    name: '',
    student_id: '',
    email: '',
    password: '',
    password_confirmation: '',
  })

  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/profile')
  }

  const updateField =
    (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const next = { ...prev }
          delete next[field]
          return next
        })
      }
      setGeneralError(null)
    }

  const handleFillDemo = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    setForm({
      name: 'Nusaiba Nussy Abdullahi',
      student_id: `01024${randomSuffix}`,
      email: `nussy.${randomSuffix}@lincoln.edu.my`,
      password: 'password123',
      password_confirmation: 'password123',
    })
    setFieldErrors({})
    setGeneralError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setFieldErrors({})
    setGeneralError(null)

    if (form.password !== form.password_confirmation) {
      setFieldErrors({ password_confirmation: ['Passwords do not match.'] })
      setLoading(false)
      return
    }

    const res = await register(form)

    if (res.success) {
      navigate('/profile')
    } else {
      if (res.errors) {
        setFieldErrors(res.errors)
      }
      setGeneralError(res.message || 'Registration failed. Please check your details.')
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

        <div className="login-inspo-form-wrapper" style={{ maxWidth: 460 }}>
          <div className="login-inspo-header">
            <h1 className="login-inspo-title">Create account</h1>
            <p className="login-inspo-subtitle">Enter your Lincoln University student details to register</p>
          </div>

          {generalError && (
            <div className="inspo-alert inspo-alert-error" role="alert">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-inspo-form">
            <div className="inspo-field">
              <label htmlFor="reg-name" className="inspo-label">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                className="inspo-input"
                placeholder="e.g. Nusaiba Nussy Abdullahi"
                required
                value={form.name}
                onChange={updateField('name')}
                autoComplete="name"
              />
              {fieldErrors.name && (
                <span className="field-error-text">{fieldErrors.name[0]}</span>
              )}
            </div>

            <div className="inspo-field">
              <label htmlFor="reg-student-id" className="inspo-label">
                Student Matrix / ID Number
              </label>
              <input
                id="reg-student-id"
                type="text"
                className="inspo-input"
                placeholder="e.g. 010240376"
                required
                value={form.student_id}
                onChange={updateField('student_id')}
              />
              {fieldErrors.student_id && (
                <span className="field-error-text">{fieldErrors.student_id[0]}</span>
              )}
            </div>

            <div className="inspo-field">
              <label htmlFor="reg-email" className="inspo-label">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                className="inspo-input"
                placeholder="e.g. nusaiba@lincoln.edu.my or student@gmail.com"
                required
                value={form.email}
                onChange={updateField('email')}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <span className="field-error-text">{fieldErrors.email[0]}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="inspo-field">
                <label htmlFor="reg-pass" className="inspo-label">
                  Password
                </label>
                <input
                  id="reg-pass"
                  type="password"
                  className="inspo-input"
                  placeholder="Min 8 chars"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={updateField('password')}
                  autoComplete="new-password"
                />
                {fieldErrors.password && (
                  <span className="field-error-text">{fieldErrors.password[0]}</span>
                )}
              </div>

              <div className="inspo-field">
                <label htmlFor="reg-pass-confirm" className="inspo-label">
                  Confirm Password
                </label>
                <input
                  id="reg-pass-confirm"
                  type="password"
                  className="inspo-input"
                  placeholder="Repeat password"
                  required
                  minLength={8}
                  value={form.password_confirmation}
                  onChange={updateField('password_confirmation')}
                  autoComplete="new-password"
                />
                {fieldErrors.password_confirmation && (
                  <span className="field-error-text">
                    {fieldErrors.password_confirmation[0]}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="inspo-btn-submit"
              disabled={loading}
            >
              {loading ? 'Verifying & Registering…' : 'Register student account'}
            </button>

            <button
              type="button"
              className="inspo-btn-demo"
              onClick={handleFillDemo}
            >
              <Zap className="w-3.5 h-3.5 inline mr-1 text-purple-600" />
              <span>Auto-fill PRD Student Demo Details</span>
            </button>
          </form>

          <p className="inspo-footer-prompt">
            Already have a campus account?{' '}
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
            <p>Join thousands of verified Lincoln students buying, selling, and swapping securely.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
