import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Lock,
  Download,
  Package,
  Handshake,
  Check,
  BarChart3,
  Flag,
  Users,
  Tag,
  Settings,
  GraduationCap,
  FileText,
  Trash2,
  Ban,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Plus,
} from 'lucide-react'
import {
  createAdminCategory,
  createAdminLocation,
  getAdminSettings,
  getAdminStats,
  getAdminUsers,
  getExportUrl,
  getModerationReports,
  updateAdminSettings,
  updateAdminUser,
  updateModerationReport,
} from '../lib/api'
import { useAuth } from '../lib/authContext'
import type { AdminStats, AuthUser, Report } from '../types'

export const AdminDashboardPage: React.FC = () => {
  const { user, login } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'users' | 'taxonomy' | 'settings'>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Moderation state
  const [reports, setReports] = useState<Report[]>([])
  const [reportFilter, setReportFilter] = useState('pending')
  const [modNote, setModNote] = useState<Record<number, string>>({})

  // User management state
  const [users, setUsers] = useState<AuthUser[]>([])
  const [userQuery, setUserQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userStatusFilter, setUserStatusFilter] = useState('all')

  // Taxonomy & settings state
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [newLocName, setNewLocName] = useState('')
  const [newLocDesc, setNewLocDesc] = useState('')
  const [prohibitedWordsText, setProhibitedWordsText] = useState('')
  const [allowedDomainsText, setAllowedDomainsText] = useState('')

  const isModeratorOrAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const isAdmin = user?.role === 'admin'

  const fetchStats = async () => {
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (err: any) {
      console.error(err)
    }
  }

  const fetchReports = async () => {
    try {
      const data = await getModerationReports({ status: reportFilter })
      setReports(data.data || [])
    } catch (err: any) {
      console.error(err)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers({
        q: userQuery,
        role: userRoleFilter,
        status: userStatusFilter,
      })
      setUsers(data.data || [])
    } catch (err: any) {
      console.error(err)
    }
  }

  const fetchSettings = async () => {
    try {
      const data = await getAdminSettings()
      if (Array.isArray(data.prohibited_keywords)) {
        setProhibitedWordsText(data.prohibited_keywords.join(', '))
      }
      if (Array.isArray(data.allowed_email_domains)) {
        setAllowedDomainsText(data.allowed_email_domains.join(', '))
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (isModeratorOrAdmin) {
      Promise.all([fetchStats(), fetchReports(), fetchUsers(), fetchSettings()])
    }
  }, [isModeratorOrAdmin])

  useEffect(() => {
    if (isModeratorOrAdmin) {
      fetchReports()
    }
  }, [reportFilter, isModeratorOrAdmin])

  useEffect(() => {
    if (isModeratorOrAdmin) {
      fetchUsers()
    }
  }, [userQuery, userRoleFilter, userStatusFilter, isModeratorOrAdmin])

  const notifySuccess = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3500)
  }

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError(null)
    const res = await login(loginEmail, loginPassword)
    if (!res.success) {
      setLoginError(res.message || 'Login failed.')
    }
    setIsLoggingIn(false)
  }

  const handleResolveReport = async (
    reportId: number,
    resolution: 'dismissed' | 'content_removed' | 'user_warned' | 'user_suspended'
  ) => {
    try {
      await updateModerationReport(reportId, {
        resolution,
        action_note: modNote[reportId] || undefined,
      })
      notifySuccess(`Report #${reportId} updated with resolution: ${resolution.replace('_', ' ')}`)
      fetchReports()
      fetchStats()
    } catch (err: any) {
      alert(err.message || 'Action failed')
    }
  }

  const handleToggleUserStatus = async (targetUser: AuthUser) => {
    const newStatus = targetUser.role === 'admin' ? 'active' : (targetUser as any).status === 'suspended' ? 'active' : 'suspended'
    try {
      await updateAdminUser(targetUser.id, { status: newStatus })
      notifySuccess(`User ${targetUser.name} is now ${newStatus}.`)
      fetchUsers()
      fetchStats()
    } catch (err: any) {
      alert(err.message || 'Failed to update user')
    }
  }

  const handleRoleChange = async (targetUser: AuthUser, newRole: string) => {
    try {
      await updateAdminUser(targetUser.id, { role: newRole })
      notifySuccess(`User ${targetUser.name} role changed to ${newRole}.`)
      fetchUsers()
    } catch (err: any) {
      alert(err.message || 'Failed to change role')
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      await createAdminCategory({ name: newCatName, description: newCatDesc })
      notifySuccess(`Category "${newCatName}" added!`)
      setNewCatName('')
      setNewCatDesc('')
      fetchStats()
    } catch (err: any) {
      alert(err.message || 'Failed to add category')
    }
  }

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocName.trim()) return
    try {
      await createAdminLocation({ name: newLocName, description: newLocDesc })
      notifySuccess(`Campus spot "${newLocName}" added!`)
      setNewLocName('')
      setNewLocDesc('')
    } catch (err: any) {
      alert(err.message || 'Failed to add meeting spot')
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const prohibited_keywords = prohibitedWordsText
        .split(',')
        .map((w) => w.trim().toLowerCase())
        .filter(Boolean)
      const allowed_email_domains = allowedDomainsText
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean)

      await updateAdminSettings({
        prohibited_keywords,
        allowed_email_domains,
      })
      notifySuccess('Campus parameters and filter settings updated!')
      fetchSettings()
    } catch (err: any) {
      alert(err.message || 'Failed to update settings')
    }
  }

  // Gateway if not logged in as Admin or Moderator
  if (!isModeratorOrAdmin) {
    return (
      <div className="login-inspo-container admin-inspo-theme">
        {/* Left Form Panel */}
        <div className="login-inspo-left">
          <div className="login-inspo-brand">
            <div className="flex items-center gap-3">
              <Link to="/" className="brand-logo-link flex items-center gap-2">
                <img src="/images/lincoln-nsuk-logo.png" alt="Lincoln NSUK Logo" className="w-7 h-7 object-contain inline-block" />
                <span className="brand-title">
                  CampusMarket <span style={{ color: '#dc2626', fontWeight: 600, fontSize: 14 }}>Admin</span>
                </span>
              </Link>
              <span className="brand-sub-badge" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                Staff Gateway
              </span>
            </div>

            <Link to="/" className="brand-back-btn">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to website</span>
            </Link>
          </div>

          <div className="login-inspo-form-wrapper" style={{ maxWidth: 440 }}>
            <div className="login-inspo-header">
              <h1 className="login-inspo-title" style={{ fontSize: 30 }}>Staff & Moderator Sign In</h1>
              <p className="login-inspo-subtitle">Enter staff credentials to manage campus trust, moderation, and taxonomy</p>
            </div>

            {loginError && (
              <div className="inspo-alert inspo-alert-error" role="alert">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleManualLogin} className="login-inspo-form">
              <div className="inspo-field">
                <label htmlFor="admin-email" className="inspo-label">
                  Admin Email Address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. staff@lincoln.edu.ng or nusaiba@lincoln.edu.ng"
                  className="inspo-input"
                />
              </div>

              <div className="inspo-field">
                <label htmlFor="admin-pass" className="inspo-label">
                  Password
                </label>
                <input
                  id="admin-pass"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="inspo-input"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="inspo-btn-submit"
                style={{ background: '#1e293b', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)' }}
              >
                {isLoggingIn ? 'Verifying Credentials…' : 'Sign in to Admin Console'}
              </button>
            </form>

            <p className="inspo-footer-prompt flex items-center justify-center gap-1.5" style={{ fontSize: 12.5 }}>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Restricted to Nasarawa State University Keffi (NSUK) staff and appointed student moderators.</span>
            </p>
          </div>
        </div>

        {/* Right Illustration Panel */}
        <div className="login-inspo-right" style={{ background: 'linear-gradient(135deg, #b91c1c 0%, #881337 50%, #4c0519 100%)' }}>
          <div className="inspo-illustration-wrapper">
            <div className="inspo-art-card" style={{ borderColor: 'rgba(255, 255, 255, 0.22)' }}>
              <img
                src="/images/auth-illustration.jpg"
                alt="Nasarawa State University Keffi Admin Operations Illustration"
                className="inspo-art-image"
              />
            </div>

            <div className="inspo-trust-caption">
              <div className="trust-badge-pill" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Nasarawa State University Keffi · Trust & Operations Console</span>
              </div>
              <p>Platform telemetry, safety queues, user privilege controls, and audit enforcement.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-portal">
      {/* Top Banner */}
      <div className="admin-hero">
        <div className="admin-hero-inner">
          <div>
            <div className="admin-badge-pill">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>{user?.role === 'admin' ? 'System Administrator' : 'Campus Moderator'} Portal</span>
            </div>
            <h1 className="admin-hero-title">Trust & Operations Control</h1>
            <p className="admin-hero-sub">
              Monitor active student trading, review open safety reports, manage campus spots, and enforce Nasarawa State University Keffi (NSUK) guidelines.
            </p>
          </div>

          {/* Action Group */}
          <div className="admin-export-group">
            <Link to="/" className="admin-export-btn" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff' }}>
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Marketplace</span>
            </Link>
            {isAdmin && (
              <>
                <a href={getExportUrl('users')} download className="admin-export-btn">
                  <Download className="w-3.5 h-3.5" />
                  <span>Students CSV</span>
                </a>
                <a href={getExportUrl('listings')} download className="admin-export-btn">
                  <Package className="w-3.5 h-3.5" />
                  <span>Listings CSV</span>
                </a>
                <a href={getExportUrl('deals')} download className="admin-export-btn">
                  <Handshake className="w-3.5 h-3.5" />
                  <span>Deals CSV</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="admin-main-wrap">
        {/* Flash message */}
        {actionSuccess && (
          <div style={{ background: '#059669', color: '#ffffff', padding: '12px 18px', borderRadius: 14, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)' }}>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>{actionSuccess}</span>
            </span>
            <button onClick={() => setActionSuccess(null)} style={{ background: 'transparent', border: 'none', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}>
              ×
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="admin-tab-bar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`admin-tab-btn ${activeTab === 'overview' ? 'is-active is-red' : ''}`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & KPI</span>
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`admin-tab-btn ${activeTab === 'moderation' ? 'is-active is-red' : ''}`}
          >
            <Flag className="w-4 h-4" />
            <span>Safety Queue</span>
            {stats?.metrics?.open_reports ? (
              <span className="admin-badge-count">{stats.metrics.open_reports}</span>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`admin-tab-btn ${activeTab === 'users' ? 'is-active' : ''}`}
          >
            <Users className="w-4 h-4" />
            <span>Student Users</span>
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('taxonomy')}
                className={`admin-tab-btn ${activeTab === 'taxonomy' ? 'is-active' : ''}`}
              >
                <Tag className="w-4 h-4" />
                <span>Categories & Spots</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`admin-tab-btn ${activeTab === 'settings' ? 'is-active' : ''}`}
              >
                <Settings className="w-4 h-4" />
                <span>Campus Settings</span>
              </button>
            </>
          )}
        </div>

        {/* ================= Tab 1: Overview & KPI (FR-ADM-01) ================= */}
        {activeTab === 'overview' && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* KPI Metric Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <span className="admin-stat-icon">
                  <GraduationCap className="w-6 h-6 text-red-600 dark:text-red-400" />
                </span>
                <span className="admin-stat-label">Total Students</span>
                <span className="admin-stat-val">{stats.metrics.total_users}</span>
                <span className="admin-stat-sub positive">{stats.metrics.verified_students} campus verified</span>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-icon">
                  <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </span>
                <span className="admin-stat-label">Active Listings</span>
                <span className="admin-stat-val">{stats.metrics.active_listings}</span>
                <span className="admin-stat-sub">{stats.metrics.total_listings} lifetime posted</span>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-icon">
                  <Handshake className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </span>
                <span className="admin-stat-label">Exchanges & Deals</span>
                <span className="admin-stat-val">{stats.metrics.total_deals}</span>
                <span className="admin-stat-sub positive">{stats.metrics.completed_deals} completed</span>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-icon">
                  <ShieldCheck className="w-6 h-6 text-red-600 dark:text-red-400" />
                </span>
                <span className="admin-stat-label">Open Reports</span>
                <span className="admin-stat-val red">{stats.metrics.open_reports}</span>
                <span className="admin-stat-sub">{stats.metrics.total_reports} total investigated</span>
              </div>
            </div>

            {/* Category distribution */}
            <div className="admin-box">
              <div className="admin-box-header">
                <h3 className="admin-box-title flex items-center gap-2">
                  <Tag className="w-4 h-4 text-red-600" />
                  <span>Active Marketplace Inventory by Category</span>
                </h3>
                <span className="admin-box-sub">Current distribution of goods and services listed by NSUK students</span>
              </div>
              <div className="admin-category-grid">
                {stats.categories.map((c) => (
                  <div key={c.slug} className="admin-category-badge">
                    <span className="admin-category-name">{c.name}</span>
                    <span className="admin-category-count">{c.listings_count}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-soft)' }}>items active</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Logs Table (FR-MOD-05) */}
            <div className="admin-box">
              <div className="admin-box-header">
                <h3 className="admin-box-title flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Recent Platform Audit Trail (FR-MOD-05)</span>
                </h3>
                <span className="admin-box-sub">Real-time audit log of moderator actions, administrative changes, and policy events</span>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_audit_logs?.map((log) => (
                      <tr key={log.id}>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {log.actor?.name || 'System Scheduler'}
                        </td>
                        <td>
                          <span className="pill pill-student">{log.action}</span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {log.target_type ? `${log.target_type} #${log.target_id || ''}` : '—'}
                        </td>
                        <td className="mono" style={{ color: 'var(--text-soft)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.meta ? JSON.stringify(log.meta) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= Tab 2: Safety & Moderation Queue (FR-MOD-02) ================= */}
        {activeTab === 'moderation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter bar */}
            <div className="admin-box" style={{ padding: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-h)' }}>Filter Queue:</span>
                {['pending', 'action_taken', 'dismissed', 'all'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setReportFilter(st)}
                    className="btn btn-sm"
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      textTransform: 'capitalize',
                      background: reportFilter === st ? '#e11d48' : 'var(--surface-subtle)',
                      color: reportFilter === st ? '#fff' : 'var(--text)',
                      borderColor: reportFilter === st ? '#e11d48' : 'var(--border)',
                    }}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{reports.length} report(s) found</span>
            </div>

            {/* Reports List */}
            {reports.length === 0 ? (
              <div className="admin-box" style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-h)', marginBottom: 4 }}>Safety Queue Clear</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  No {reportFilter} reports in the queue.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reports.map((r) => (
                  <div key={r.id} className="mod-item-card">
                    {/* Header */}
                    <div className="mod-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="pill pill-red">
                          Report #{r.id} • {r.target_type_label}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-h)' }}>{r.reason}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Submitted {new Date(r.created_at).toLocaleString()} by{' '}
                        <strong>{r.reporter?.name || 'Student'}</strong>
                      </div>
                    </div>

                    {/* Reported Target Preview */}
                    <div className="mod-preview-box">
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-soft)', display: 'block', marginBottom: 4 }}>
                        Target Content Summary:
                      </span>
                      {r.target_preview ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {r.target_preview.title && (
                            <div><strong>Listing:</strong> {r.target_preview.title} (₦ {r.target_preview.price})</div>
                          )}
                          {r.target_preview.seller_name && (
                            <div><strong>Seller:</strong> {r.target_preview.seller_name} (ID: #{r.target_preview.seller_id})</div>
                          )}
                          {r.target_preview.name && (
                            <div><strong>Student:</strong> {r.target_preview.name} ({r.target_preview.email}) - Status: {r.target_preview.status}</div>
                          )}
                          {r.target_preview.body && (
                            <div><strong>Chat Message:</strong> "{r.target_preview.body}" (From: {r.target_preview.sender_name})</div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Target item has already been deleted or removed.</div>
                      )}

                      {r.note && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
                          <strong>Reporter Note:</strong> {r.note}
                        </div>
                      )}
                    </div>

                    {/* Moderation Actions (FR-MOD-02, FR-MOD-04) */}
                    {r.status === 'pending' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input
                          type="text"
                          placeholder="Optional internal moderator note..."
                          value={modNote[r.id] || ''}
                          onChange={(e) => setModNote({ ...modNote, [r.id]: e.target.value })}
                          className="admin-input"
                          style={{ fontSize: 12 }}
                        />
                        <div className="mod-actions-row">
                          <button
                            onClick={() => handleResolveReport(r.id, 'content_removed')}
                            className="btn btn-sm flex items-center gap-1"
                            style={{ background: '#e11d48', color: '#fff', border: 'none' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Content</span>
                          </button>
                          <button
                            onClick={() => handleResolveReport(r.id, 'user_suspended')}
                            className="btn btn-sm flex items-center gap-1"
                            style={{ background: '#0f172a', color: '#fff', border: 'none' }}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Suspend Student</span>
                          </button>
                          <button
                            onClick={() => handleResolveReport(r.id, 'user_warned')}
                            className="btn btn-sm flex items-center gap-1"
                            style={{ background: '#f59e0b', color: '#fff', border: 'none' }}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Issue Warning</span>
                          </button>
                          <button
                            onClick={() => handleResolveReport(r.id, 'dismissed')}
                            className="btn btn-outline btn-sm"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: 'var(--surface-subtle)', padding: 10, borderRadius: 10, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          Status: <strong style={{ textTransform: 'uppercase' }}>{r.status}</strong> • Action: <strong>{r.resolution}</strong>
                          {r.action_note ? ` ("${r.action_note}")` : ''}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>Handled by {r.handler?.name || 'Moderator'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= Tab 3: User Management (FR-ADM-02) ================= */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Search & Filter */}
            <div className="admin-box" style={{ padding: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <input
                type="text"
                placeholder="Search by student name, email, student ID, or faculty..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="admin-input"
                style={{ flex: 1, minWidth: 240 }}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="admin-select"
                style={{ width: 'auto' }}
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Administrator</option>
              </select>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="admin-select"
                style={{ width: 'auto' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="admin-box" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="admin-table-wrap" style={{ border: 'none' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Student ID & Email</th>
                      <th>Faculty / Year</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSuspended = (u as any).status === 'suspended'

                      return (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 700 }}>{u.name}</td>
                          <td>
                            <span className="mono" style={{ display: 'block', fontWeight: 700 }}>{u.student_id}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-soft)' }}>{u.email}</span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {u.faculty || 'Unspecified'} {u.year ? `(${u.year})` : ''}
                          </td>
                          <td>
                            {isAdmin ? (
                              <select
                                value={u.role || 'student'}
                                onChange={(e) => handleRoleChange(u, e.target.value)}
                                className="admin-select"
                                style={{ padding: '4px 8px', fontSize: 11, width: 'auto', fontWeight: 700 }}
                              >
                                <option value="student">Student</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Administrator</option>
                              </select>
                            ) : (
                              <span className="pill pill-student">{u.role}</span>
                            )}
                          </td>
                          <td>
                            <span className={`pill ${isSuspended ? 'pill-suspended' : 'pill-active'}`}>
                              {(u as any).status || 'active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className="btn btn-sm"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: 11,
                                  background: isSuspended ? '#059669' : '#fef2f2',
                                  color: isSuspended ? '#fff' : '#b91c1c',
                                  borderColor: isSuspended ? '#059669' : '#fecaca',
                                }}
                              >
                                {isSuspended ? 'Reinstate' : 'Suspend'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= Tab 4: Categories & Spots (FR-ADM-03) ================= */}
        {activeTab === 'taxonomy' && isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <div className="admin-box">
              <div className="admin-box-header">
                <h3 className="admin-box-title flex items-center gap-2">
                  <Tag className="w-4 h-4 text-red-600" />
                  <span>Add Marketplace Category</span>
                </h3>
                <span className="admin-box-sub">Expand campus trade offerings</span>
              </div>
              <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="admin-form-group">
                  <label className="admin-label">Category Title</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Lab Kits & Uniforms"
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Short Description</label>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="e.g. Medical scrubs, lab coats, and safety goggles"
                    className="admin-input"
                  />
                </div>
                <button type="submit" className="btn btn-primary flex items-center justify-center gap-1.5" style={{ marginTop: 4 }}>
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </form>
            </div>

            <div className="admin-box">
              <div className="admin-box-header">
                <h3 className="admin-box-title flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>Add Official Meeting Location</span>
                </h3>
                <span className="admin-box-sub">Safe monitored campus pickup spots</span>
              </div>
              <form onSubmit={handleAddLocation} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="admin-form-group">
                  <label className="admin-label">Campus Location Name</label>
                  <input
                    type="text"
                    required
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    placeholder="e.g. Block C Student Lounge"
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Landmark / Description</label>
                  <input
                    type="text"
                    value={newLocDesc}
                    onChange={(e) => setNewLocDesc(e.target.value)}
                    placeholder="e.g. Ground floor seating area near Security Post"
                    className="admin-input"
                  />
                </div>
                <button type="submit" className="btn btn-primary flex items-center justify-center gap-1.5" style={{ marginTop: 4 }}>
                  <Plus className="w-4 h-4" />
                  <span>Add Meeting Spot</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= Tab 5: Campus Settings & Filter (FR-ADM-04) ================= */}
        {activeTab === 'settings' && isAdmin && (
          <div className="admin-box">
            <div className="admin-box-header">
              <h3 className="admin-box-title flex items-center gap-2">
                <Settings className="w-4 h-4 text-red-600" />
                <span>Campus Policies & Prohibited Item Filter (FR-ADM-04)</span>
              </h3>
              <span className="admin-box-sub">Configure student email verification domains and automated prohibited goods filters</span>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-form-group">
                <label className="admin-label">Allowed Student Email Domains (comma-separated)</label>
                <input
                  type="text"
                  value={allowedDomainsText}
                  onChange={(e) => setAllowedDomainsText(e.target.value)}
                  className="admin-input mono"
                />
                <span style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                  Default: lincoln.edu.ng, nsuk.edu.ng, student.lincoln.edu.ng
                </span>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Prohibited Keywords Filter (comma-separated)</label>
                <textarea
                  rows={4}
                  value={prohibitedWordsText}
                  onChange={(e) => setProhibitedWordsText(e.target.value)}
                  className="admin-textarea mono"
                />
                <span style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                  Any listing containing these keywords in title or description will be blocked in real-time.
                </span>
              </div>

              <div>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                  Save Platform Configuration
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage
