import React, { useEffect, useState, useCallback } from 'react'
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
  Wallet,
  Menu,
  X,
  LogOut,
  Search,
  Edit2,
  RefreshCw,
  Building2,
  TrendingUp,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import {
  createAdminCategory,
  createAdminLocation,
  deleteAdminCategory,
  deleteAdminListing,
  deleteAdminLocation,
  downloadAdminExport,
  getAdminAuditLogs,
  getAdminDeals,
  getAdminFinance,
  getAdminListings,
  getAdminSettings,
  getAdminStats,
  getAdminUsers,
  getMeetingLocations,
  getModerationReports,
  processAdminWithdrawal,
  seedAdminDemoListings,
  updateAdminCategory,
  updateAdminListing,
  updateAdminLocation,
  updateAdminSettings,
  updateAdminUser,
  updateModerationReport,
  resolveImageUrl,
  DEFAULT_ITEM_PLACEHOLDER,
} from '../lib/api'
import { useAuth } from '../lib/authContext'
import type {
  AdminStats,
  AuditLogItem,
  AuthUser,
  Deal,
  Listing,
  MeetingLocation,
  Report,
  WalletTransaction,
  WithdrawalRequest,
} from '../types'

type AdminTab =
  | 'overview'
  | 'moderation'
  | 'listings'
  | 'deals'
  | 'finance'
  | 'users'
  | 'taxonomy'
  | 'audit'
  | 'settings'

function formatNaira(val: number | string | undefined | null): string {
  return `₦${Number(val || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const AdminDashboardPage: React.FC = () => {
  const { user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Gateway login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Moderation state
  const [reports, setReports] = useState<Report[]>([])
  const [reportFilter, setReportFilter] = useState('pending')
  const [reportTypeFilter, setReportTypeFilter] = useState('all')
  const [modNote, setModNote] = useState<Record<number, string>>({})

  // Users state
  const [users, setUsers] = useState<AuthUser[]>([])
  const [userQuery, setUserQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userStatusFilter, setUserStatusFilter] = useState('all')
  const [usersPage, setUsersPage] = useState(1)
  const [usersLastPage, setUsersLastPage] = useState(1)

  // Listings Manager state
  const [listings, setListings] = useState<Listing[]>([])
  const [listingQuery, setListingQuery] = useState('')
  const [listingStatusFilter, setListingStatusFilter] = useState('all')
  const [listingCatFilter, setListingCatFilter] = useState('all')
  const [listingsPage, setListingsPage] = useState(1)
  const [listingsLastPage, setListingsLastPage] = useState(1)

  // Deals & Escrow state
  const [deals, setDeals] = useState<Deal[]>([])
  const [dealQuery, setDealQuery] = useState('')
  const [dealStatusFilter, setDealStatusFilter] = useState('all')
  const [dealPaymentFilter, setDealPaymentFilter] = useState('all')
  const [dealsPage, setDealsPage] = useState(1)
  const [dealsLastPage, setDealsLastPage] = useState(1)

  // Finance & Withdrawals state
  const [financeSummary, setFinanceSummary] = useState<any>(null)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [withdrawalFilter, setWithdrawalFilter] = useState('all')
  const [sellerWallets, setSellerWallets] = useState<any[]>([])
  const [recentWalletTxs, setRecentWalletTxs] = useState<WalletTransaction[]>([])
  const [withdrawalNote, setWithdrawalNote] = useState<Record<number, string>>({})

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [auditQuery, setAuditQuery] = useState('')
  const [auditPage, setAuditPage] = useState(1)
  const [auditLastPage, setAuditLastPage] = useState(1)

  // Taxonomy state
  const [locations, setLocations] = useState<MeetingLocation[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [editingCatId, setEditingCatId] = useState<number | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatDesc, setEditCatDesc] = useState('')

  const [newLocName, setNewLocName] = useState('')
  const [newLocDesc, setNewLocDesc] = useState('')
  const [editingLocId, setEditingLocId] = useState<number | null>(null)
  const [editLocName, setEditLocName] = useState('')
  const [editLocDesc, setEditLocDesc] = useState('')

  // Settings state
  const [prohibitedWordsText, setProhibitedWordsText] = useState('')
  const [allowedDomainsText, setAllowedDomainsText] = useState('')
  const [commissionRateInput, setCommissionRateInput] = useState('20')
  const [exportingType, setExportingType] = useState<string | null>(null)
  const [syncingDemo, setSyncingDemo] = useState(false)

  const isModeratorOrAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const isAdmin = user?.role === 'admin'

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setFlash({ type, message })
    setTimeout(() => setFlash(null), 4000)
  }

  const fetchStats = useCallback(async () => {
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      const data = await getModerationReports({
        status: reportFilter,
        type: reportTypeFilter,
      })
      setReports(data.data || [])
    } catch (err) {
      console.error(err)
    }
  }, [reportFilter, reportTypeFilter])

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return
    try {
      const data = await getAdminUsers({
        q: userQuery,
        role: userRoleFilter,
        status: userStatusFilter,
        page: usersPage,
      })
      setUsers(data.data || [])
      setUsersLastPage(data.last_page || 1)
    } catch (err) {
      console.error(err)
    }
  }, [isAdmin, userQuery, userRoleFilter, userStatusFilter, usersPage])

  const fetchListings = useCallback(async () => {
    try {
      const data = await getAdminListings({
        q: listingQuery,
        status: listingStatusFilter,
        category_id: listingCatFilter,
        page: listingsPage,
      })
      setListings(data.data || [])
      setListingsLastPage(data.last_page || 1)
    } catch (err) {
      console.error(err)
    }
  }, [listingQuery, listingStatusFilter, listingCatFilter, listingsPage])

  const fetchDeals = useCallback(async () => {
    if (!isAdmin) return
    try {
      const data = await getAdminDeals({
        q: dealQuery,
        status: dealStatusFilter,
        payment_status: dealPaymentFilter,
        page: dealsPage,
      })
      setDeals(data.data || [])
      setDealsLastPage(data.last_page || 1)
    } catch (err) {
      console.error(err)
    }
  }, [isAdmin, dealQuery, dealStatusFilter, dealPaymentFilter, dealsPage])

  const fetchFinance = useCallback(async () => {
    if (!isAdmin) return
    try {
      const data = await getAdminFinance({ withdrawal_status: withdrawalFilter })
      setFinanceSummary(data.summary || null)
      setWithdrawals(data.withdrawals?.data || [])
      setSellerWallets(data.wallets || [])
      setRecentWalletTxs(data.recent_transactions || [])
    } catch (err) {
      console.error(err)
    }
  }, [isAdmin, withdrawalFilter])

  const fetchAuditLogs = useCallback(async () => {
    try {
      const data = await getAdminAuditLogs({ q: auditQuery, page: auditPage })
      setAuditLogs(data.data || [])
      setAuditLastPage(data.last_page || 1)
    } catch (err) {
      console.error(err)
    }
  }, [auditQuery, auditPage])

  const fetchLocations = useCallback(async () => {
    try {
      const locs = await getMeetingLocations()
      setLocations(locs)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    if (!isAdmin) return
    try {
      const data = await getAdminSettings()
      if (Array.isArray(data.prohibited_keywords)) {
        setProhibitedWordsText(data.prohibited_keywords.join(', '))
      }
      if (Array.isArray(data.allowed_email_domains)) {
        setAllowedDomainsText(data.allowed_email_domains.join(', '))
      }
      if (data.platform_commission_rate !== undefined && data.platform_commission_rate !== null) {
        setCommissionRateInput(String(data.platform_commission_rate))
      }
    } catch (err) {
      console.error(err)
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isModeratorOrAdmin) return
    fetchStats()
    fetchReports()
    fetchLocations()
    if (isAdmin) {
      fetchSettings()
      fetchFinance()
    }
  }, [isModeratorOrAdmin, isAdmin, fetchStats, fetchReports, fetchLocations, fetchSettings, fetchFinance])

  useEffect(() => {
    if (isModeratorOrAdmin && activeTab === 'moderation') fetchReports()
  }, [isModeratorOrAdmin, activeTab, fetchReports])

  useEffect(() => {
    if (isModeratorOrAdmin && activeTab === 'listings') fetchListings()
  }, [isModeratorOrAdmin, activeTab, fetchListings])

  useEffect(() => {
    if (isAdmin && activeTab === 'users') fetchUsers()
  }, [isAdmin, activeTab, fetchUsers])

  useEffect(() => {
    if (isAdmin && activeTab === 'deals') fetchDeals()
  }, [isAdmin, activeTab, fetchDeals])

  useEffect(() => {
    if (isAdmin && activeTab === 'finance') fetchFinance()
  }, [isAdmin, activeTab, fetchFinance])

  useEffect(() => {
    if (isModeratorOrAdmin && activeTab === 'audit') fetchAuditLogs()
  }, [isModeratorOrAdmin, activeTab, fetchAuditLogs])

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

  const handleExport = async (type: 'users' | 'listings' | 'deals') => {
    try {
      setExportingType(type)
      await downloadAdminExport(type)
      notify(`Exported ${type} CSV successfully.`)
    } catch (err: any) {
      notify(err?.message || `Failed to export ${type} CSV.`, 'error')
    } finally {
      setExportingType(null)
    }
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
      notify(`Report #${reportId} resolved (${resolution.replace('_', ' ')}).`)
      fetchReports()
      fetchStats()
    } catch (err: any) {
      notify(err.message || 'Action failed', 'error')
    }
  }

  const handleToggleUserStatus = async (targetUser: AuthUser) => {
    const newStatus = (targetUser as any).status === 'suspended' ? 'active' : 'suspended'
    try {
      await updateAdminUser(targetUser.id, { status: newStatus })
      notify(`User ${targetUser.name} is now ${newStatus}.`)
      fetchUsers()
      fetchStats()
    } catch (err: any) {
      notify(err.message || 'Failed to update user', 'error')
    }
  }

  const handleRoleChange = async (targetUser: AuthUser, newRole: string) => {
    try {
      await updateAdminUser(targetUser.id, { role: newRole })
      notify(`User ${targetUser.name} role changed to ${newRole}.`)
      fetchUsers()
    } catch (err: any) {
      notify(err.message || 'Failed to change role', 'error')
    }
  }

  const handleListingStatusChange = async (listingId: number | string, status: string) => {
    try {
      await updateAdminListing(listingId, status)
      notify(`Listing #${listingId} updated to ${status}.`)
      fetchListings()
      fetchStats()
    } catch (err: any) {
      notify(err.message || 'Failed to update listing', 'error')
    }
  }

  const handleDeleteListing = async (listing: Listing) => {
    if (!confirm(`Permanently delete listing "${listing.title}"? This cannot be undone.`)) return
    try {
      await deleteAdminListing(listing.id)
      notify(`Listing "${listing.title}" deleted permanently.`)
      fetchListings()
      fetchStats()
    } catch (err: any) {
      notify(err.message || 'Failed to delete listing', 'error')
    }
  }

  const handleSyncDemoProducts = async () => {
    try {
      setSyncingDemo(true)
      const res = await seedAdminDemoListings()
      notify(res.message)
      await Promise.all([fetchListings(), fetchStats()])
    } catch (err: any) {
      notify(err?.message || 'Failed to sync demo products', 'error')
    } finally {
      setSyncingDemo(false)
    }
  }

  const handleProcessWithdrawal = async (w: WithdrawalRequest, status: 'paid' | 'rejected') => {
    const label = status === 'paid' ? 'mark this payout as PAID' : 'REJECT and refund this payout to seller wallet'
    if (!confirm(`Confirm you want to ${label} (${formatNaira(w.amount)} to ${w.user?.name || 'Seller'})?`)) return
    try {
      const res = await processAdminWithdrawal(w.id, {
        status,
        admin_note: withdrawalNote[w.id]?.trim() || undefined,
      })
      notify(res.message || `Withdrawal ${status}.`)
      fetchFinance()
      fetchStats()
    } catch (err: any) {
      notify(err.message || 'Failed to process withdrawal', 'error')
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      await createAdminCategory({ name: newCatName.trim(), description: newCatDesc.trim() || undefined })
      notify(`Category "${newCatName}" added!`)
      setNewCatName('')
      setNewCatDesc('')
      fetchStats()
    } catch (err: any) {
      notify(err.message || 'Failed to add category', 'error')
    }
  }

  const handleSaveEditCategory = async (catId: number) => {
    if (!editCatName.trim()) return
    try {
      await updateAdminCategory(catId, { name: editCatName.trim(), description: editCatDesc.trim() })
      notify('Category updated.')
      setEditingCatId(null)
      fetchStats()
    } catch (err: any) {
      notify(err.message || 'Failed to update category', 'error')
    }
  }

  const handleDeleteCategory = async (catId: number, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return
    try {
      await deleteAdminCategory(catId)
      notify(`Category "${name}" deleted.`)
      fetchStats()
    } catch (err: any) {
      notify(err.message || 'Failed to delete category', 'error')
    }
  }

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocName.trim()) return
    try {
      await createAdminLocation({ name: newLocName.trim(), description: newLocDesc.trim() || undefined })
      notify(`Campus spot "${newLocName}" added!`)
      setNewLocName('')
      setNewLocDesc('')
      fetchLocations()
    } catch (err: any) {
      notify(err.message || 'Failed to add meeting spot', 'error')
    }
  }

  const handleSaveEditLocation = async (locId: number) => {
    if (!editLocName.trim()) return
    try {
      await updateAdminLocation(locId, { name: editLocName.trim(), description: editLocDesc.trim() })
      notify('Campus meeting spot updated.')
      setEditingLocId(null)
      fetchLocations()
    } catch (err: any) {
      notify(err.message || 'Failed to update meeting spot', 'error')
    }
  }

  const handleDeleteLocation = async (locId: number, name: string) => {
    if (!confirm(`Delete meeting spot "${name}"?`)) return
    try {
      await deleteAdminLocation(locId)
      notify(`Meeting spot "${name}" removed.`)
      fetchLocations()
    } catch (err: any) {
      notify(err.message || 'Failed to delete meeting spot', 'error')
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

      const parsedRate = Number(commissionRateInput)
      const platform_commission_rate = Number.isFinite(parsedRate)
        ? Math.max(0, Math.min(95, parsedRate))
        : 20

      await updateAdminSettings({
        prohibited_keywords,
        allowed_email_domains,
        platform_commission_rate,
      })
      notify('Campus parameters and commission settings updated!')
      fetchSettings()
      fetchStats()
      fetchFinance()
    } catch (err: any) {
      notify(err.message || 'Failed to update settings', 'error')
    }
  }

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  // Gateway if not logged in as Admin or Moderator
  if (!isModeratorOrAdmin) {
    return (
      <div className="login-inspo-container admin-inspo-theme">
        <div className="login-inspo-left">
          <div className="login-inspo-brand">
            <div className="flex items-center gap-3">
              <Link to="/" className="brand-logo-link flex items-center gap-2">
                <img src="/images/lincoln-nsuk-logo.png" alt="Lincoln Nasarawa Logo" className="w-7 h-7 object-contain inline-block" />
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
              <h1 className="login-inspo-title" style={{ fontSize: 30 }}>Staff &amp; Moderator Sign In</h1>
              <p className="login-inspo-subtitle">Enter staff credentials to manage campus trust, finance, listings, and moderation</p>
            </div>

            {loginError && (
              <div className="inspo-alert inspo-alert-error" role="alert">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleManualLogin} className="login-inspo-form">
              <div className="inspo-field">
                <label htmlFor="admin-email" className="inspo-label">Admin Email Address</label>
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
                <label htmlFor="admin-pass" className="inspo-label">Password</label>
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
              <span>Restricted to Lincoln University College, Nasarawa State staff and appointed moderators.</span>
            </p>
          </div>
        </div>

        <div className="login-inspo-right" style={{ background: 'linear-gradient(135deg, #b91c1c 0%, #881337 50%, #4c0519 100%)' }}>
          <div className="inspo-illustration-wrapper">
            <div className="inspo-art-card" style={{ borderColor: 'rgba(255, 255, 255, 0.22)' }}>
              <img
                src="/images/auth-illustration.jpg"
                alt="Lincoln University College, Nasarawa State Admin Operations Illustration"
                className="inspo-art-image"
              />
            </div>

            <div className="inspo-trust-caption">
              <div className="trust-badge-pill" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Lincoln University College, Nasarawa State · Trust &amp; Operations</span>
              </div>
              <p>Platform telemetry, escrow &amp; payouts, safety queues, user controls, and audit enforcement.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const SECTION_META: Record<AdminTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Analytics & Operations Overview',
      subtitle: 'Real-time marketplace telemetry, escrow volume, and campus activity.',
    },
    moderation: {
      title: 'Safety & Moderation Queue',
      subtitle: 'Review reported listings, student accounts, and chat messages.',
    },
    listings: {
      title: 'Marketplace Product List',
      subtitle: 'Browse, search, edit status, sync demo catalog, or remove products on the marketplace.',
    },
    deals: {
      title: 'Deals & Escrow Monitor',
      subtitle: 'Track negotiated student deals, cash meetups, and Paystack escrow.',
    },
    finance: {
      title: 'Finance, Seller Wallets & Payouts',
      subtitle: 'Inspect seller earnings, platform escrow holds, and approve withdrawal requests.',
    },
    users: {
      title: 'Student & Staff Directory',
      subtitle: 'Search accounts, assign moderator/admin roles, and manage suspensions.',
    },
    taxonomy: {
      title: 'Categories & Safe Meetup Spots',
      subtitle: 'Create, edit, and maintain marketplace categories and verified campus locations.',
    },
    audit: {
      title: 'Platform Audit Logs',
      subtitle: 'Immutable log of administrative, moderation, and financial actions.',
    },
    settings: {
      title: 'Campus Policies & Filter Settings',
      subtitle: 'Configure allowed Lincoln Nasarawa email domains and prohibited keywords.',
    },
  }

  return (
    <div className="admin-portal">
      <div className="admin-shell">
        {/* Mobile Backdrop */}
        <div
          className={`admin-sidebar-backdrop ${sidebarOpen ? 'is-open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Persistent Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Admin Navigation">
          <div className="admin-sidebar-brand">
            <Link to="/" className="flex items-center gap-2.5 text-white no-underline">
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
                <img src="/images/lincoln-nsuk-logo.png" alt="Lincoln Nasarawa" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-sm font-extrabold leading-tight">Lincoln Admin</div>
                <div className="text-[10px] text-rose-200/80 font-semibold">Nasarawa Campus</div>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="admin-sidebar-nav">
            <div>
              <div className="admin-nav-group-label">Operations</div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => selectTab('overview')}
                  className={`admin-sidebar-item ${activeTab === 'overview' ? 'is-active' : ''}`}
                >
                  <span className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>Overview &amp; KPIs</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectTab('moderation')}
                  className={`admin-sidebar-item ${activeTab === 'moderation' ? 'is-active' : ''}`}
                >
                  <span className="flex items-center gap-2.5">
                    <Flag className="w-4 h-4" />
                    <span>Safety Queue</span>
                  </span>
                  {stats?.metrics?.open_reports ? (
                    <span className="admin-sidebar-badge">{stats.metrics.open_reports}</span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => selectTab('listings')}
                  className={`admin-sidebar-item ${activeTab === 'listings' ? 'is-active' : ''}`}
                >
                  <span className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    <span>Product List</span>
                  </span>
                  {stats?.metrics?.total_listings !== undefined && (
                    <span className="admin-sidebar-badge">{stats.metrics.total_listings}</span>
                  )}
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => selectTab('deals')}
                    className={`admin-sidebar-item ${activeTab === 'deals' ? 'is-active' : ''}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Handshake className="w-4 h-4" />
                      <span>Deals &amp; Escrow</span>
                    </span>
                  </button>
                )}
              </div>
            </div>

            {isAdmin && (
              <div>
                <div className="admin-nav-group-label">Finance &amp; Users</div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => selectTab('finance')}
                    className={`admin-sidebar-item ${activeTab === 'finance' ? 'is-active' : ''}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Wallet className="w-4 h-4" />
                      <span>Finance &amp; Payouts</span>
                    </span>
                    {stats?.metrics?.pending_withdrawals_count ? (
                      <span className="admin-sidebar-badge">{stats.metrics.pending_withdrawals_count}</span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTab('users')}
                    className={`admin-sidebar-item ${activeTab === 'users' ? 'is-active' : ''}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Users className="w-4 h-4" />
                      <span>Student Users</span>
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="admin-nav-group-label">Configuration</div>
              <div className="flex flex-col gap-1">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => selectTab('taxonomy')}
                    className={`admin-sidebar-item ${activeTab === 'taxonomy' ? 'is-active' : ''}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Tag className="w-4 h-4" />
                      <span>Categories &amp; Spots</span>
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => selectTab('audit')}
                  className={`admin-sidebar-item ${activeTab === 'audit' ? 'is-active' : ''}`}
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4" />
                    <span>Audit Logs</span>
                  </span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => selectTab('settings')}
                    className={`admin-sidebar-item ${activeTab === 'settings' ? 'is-active' : ''}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4" />
                      <span>Campus Settings</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </nav>

          <div className="admin-sidebar-footer">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-rose-200/80 uppercase font-bold">{user?.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="flex-1 text-center py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11px] font-bold no-underline transition"
              >
                Storefront
              </Link>
              <button
                type="button"
                onClick={logout}
                className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-red-600/80 text-white text-[11px] font-bold transition inline-flex items-center gap-1"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="admin-content-area">
          {/* Sticky Operational Topbar */}
          <header className="admin-topbar">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="admin-mobile-toggle p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                aria-label="Open admin sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {SECTION_META[activeTab].title}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {SECTION_META[activeTab].subtitle}
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExport('users')}
                  disabled={exportingType === 'users'}
                  className="btn btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingType === 'users' ? 'Exporting...' : 'Students CSV'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('listings')}
                  disabled={exportingType === 'listings'}
                  className="btn btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingType === 'listings' ? 'Exporting...' : 'Listings CSV'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('deals')}
                  disabled={exportingType === 'deals'}
                  className="btn btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingType === 'deals' ? 'Exporting...' : 'Deals CSV'}</span>
                </button>
              </div>
            )}
          </header>

          {/* Main Content Body */}
          <div className="admin-body-wrap">
            {flash && (
              <div
                style={{
                  background: flash.type === 'success' ? '#059669' : '#dc2626',
                  color: '#ffffff',
                  padding: '12px 18px',
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span className="flex items-center gap-2">
                  {flash.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{flash.message}</span>
                </span>
                <button onClick={() => setFlash(null)} className="bg-transparent border-none text-white font-bold cursor-pointer">
                  ×
                </button>
              </div>
            )}

            {/* ================= 1. OVERVIEW & KPIs ================= */}
            {activeTab === 'overview' && stats && (
              <div className="flex flex-col gap-5">
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <span className="admin-stat-icon"><GraduationCap className="w-6 h-6 text-red-600" /></span>
                    <span className="admin-stat-label">Total Students</span>
                    <span className="admin-stat-val">{stats.metrics.total_users}</span>
                    <span className="admin-stat-sub positive">{stats.metrics.verified_students} campus verified</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectTab('listings')}
                    className="admin-stat-card text-left cursor-pointer hover:border-red-300 transition"
                  >
                    <span className="admin-stat-icon"><Package className="w-6 h-6 text-emerald-600" /></span>
                    <span className="admin-stat-label">Active Products</span>
                    <span className="admin-stat-val">{stats.metrics.active_listings}</span>
                    <span className="admin-stat-sub text-red-600 font-bold">
                      {stats.metrics.total_listings} total · View Product List →
                    </span>
                  </button>
                  <div className="admin-stat-card">
                    <span className="admin-stat-icon"><Handshake className="w-6 h-6 text-rose-600" /></span>
                    <span className="admin-stat-label">Deals &amp; Exchanges</span>
                    <span className="admin-stat-val">{stats.metrics.total_deals}</span>
                    <span className="admin-stat-sub positive">{stats.metrics.completed_deals} completed</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-icon"><ShieldCheck className="w-6 h-6 text-red-600" /></span>
                    <span className="admin-stat-label">Open Safety Reports</span>
                    <span className="admin-stat-val red">{stats.metrics.open_reports}</span>
                    <span className="admin-stat-sub">{stats.metrics.total_reports} total reports</span>
                  </div>
                </div>

                {/* Financial Overview Row */}
                {isAdmin && (
                  <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                      <span className="admin-stat-icon"><TrendingUp className="w-6 h-6 text-emerald-600" /></span>
                      <span className="admin-stat-label">Admin Commission ({stats.metrics.commission_rate ?? 20}%)</span>
                      <span className="admin-stat-val" style={{ fontSize: 22, color: '#059669' }}>{formatNaira(stats.metrics.admin_commission_total)}</span>
                      <span className="admin-stat-sub">
                        Escrow: {formatNaira(stats.metrics.escrow_commission_earned)} · Pending: {formatNaira(stats.metrics.pending_escrow_commission)}
                      </span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-icon"><Wallet className="w-6 h-6 text-slate-700" /></span>
                      <span className="admin-stat-label">Seller Earnings ({100 - (stats.metrics.commission_rate ?? 20)}%)</span>
                      <span className="admin-stat-val" style={{ fontSize: 22 }}>{formatNaira(stats.metrics.total_sales_volume)}</span>
                      <span className="admin-stat-sub">
                        Gross sales: {formatNaira(stats.metrics.gross_sales_volume)}
                      </span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-icon"><Lock className="w-6 h-6 text-amber-600" /></span>
                      <span className="admin-stat-label">Seller Escrow Held (80%)</span>
                      <span className="admin-stat-val" style={{ fontSize: 22 }}>{formatNaira(stats.metrics.escrow_held)}</span>
                      <span className="admin-stat-sub">Awaiting campus handover</span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-icon"><Building2 className="w-6 h-6 text-red-600" /></span>
                      <span className="admin-stat-label">Pending Payout Queue</span>
                      <span className="admin-stat-val red" style={{ fontSize: 22 }}>{formatNaira(stats.metrics.pending_withdrawals_amount)}</span>
                      <span className="admin-stat-sub">{stats.metrics.pending_withdrawals_count || 0} request(s) · {formatNaira(stats.metrics.total_withdrawn)} paid</span>
                    </div>
                  </div>
                )}

                {/* Categories */}
                <div className="admin-box">
                  <div className="admin-box-header">
                    <h3 className="admin-box-title"><Tag className="w-4 h-4 text-red-600" /><span>Marketplace Inventory by Category</span></h3>
                    <span className="admin-box-sub">Distribution of goods listed by Lincoln University College, Nasarawa State students</span>
                  </div>
                  <div className="admin-category-grid">
                    {stats.categories.map((c) => (
                      <div key={c.slug} className="admin-category-badge">
                        <span className="admin-category-name">{c.name}</span>
                        <span className="admin-category-count">{c.listings_count}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-soft)' }}>listings</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Marketplace Product List Preview */}
                <div className="admin-box">
                  <div className="admin-box-header">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="admin-box-title"><Package className="w-4 h-4 text-red-600" /><span>Products on Marketplace</span></h3>
                        <span className="admin-box-sub">Live products currently in the database ({stats.metrics.total_listings} total)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={handleSyncDemoProducts}
                            disabled={syncingDemo}
                            className="btn btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-red-600" />
                            <span>{syncingDemo ? 'Syncing...' : 'Sync Demo Products'}</span>
                          </button>
                        )}
                        <button type="button" onClick={() => selectTab('listings')} className="btn btn-primary btn-sm text-xs">
                          Open Full Product List →
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Seller</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!stats.recent_listings || stats.recent_listings.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-slate-500">
                              No products in the database yet. Click <strong>Sync Demo Products</strong> above to import all demo marketplace listings.
                            </td>
                          </tr>
                        ) : (
                          stats.recent_listings.map((item: any) => {
                            const rawImg = item.images?.[0]?.url || item.images?.[0]?.file_url
                            const thumb = resolveImageUrl(rawImg)
                            return (
                              <tr key={item.id}>
                                <td>
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={thumb}
                                      alt={item.title}
                                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_ITEM_PLACEHOLDER }}
                                    />
                                    <div className="min-w-0">
                                      <Link to={`/listings/${item.id}`} className="font-bold text-slate-900 dark:text-white hover:text-red-600 hover:underline block truncate max-w-xs">
                                        {item.title}
                                      </Link>
                                      <span className="text-[11px] text-slate-400">{item.condition}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="font-semibold">{item.seller?.name || 'Student'}</td>
                                <td>{item.category?.name || '—'}</td>
                                <td className="font-bold">{formatNaira(item.price)}</td>
                                <td>
                                  <span className={`pill ${item.status === 'active' ? 'pill-active' : item.status === 'removed' ? 'pill-red' : 'pill-student'}`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Audit Logs */}
                <div className="admin-box">
                  <div className="admin-box-header">
                    <div className="flex items-center justify-between">
                      <h3 className="admin-box-title"><FileText className="w-4 h-4 text-red-600" /><span>Recent Audit Activity</span></h3>
                      <button type="button" onClick={() => selectTab('audit')} className="text-xs font-bold text-red-600 hover:underline">
                        View Full Log →
                      </button>
                    </div>
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
                            <td style={{ color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</td>
                            <td style={{ fontWeight: 700 }}>{log.actor?.name || 'System'}</td>
                            <td><span className="pill pill-student">{log.action}</span></td>
                            <td style={{ color: 'var(--text-muted)' }}>{log.target_type ? `${log.target_type} #${log.target_id || ''}` : '—'}</td>
                            <td className="mono" style={{ color: 'var(--text-soft)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

            {/* ================= 2. MODERATION QUEUE ================= */}
            {activeTab === 'moderation' && (
              <div className="flex flex-col gap-4">
                <div className="admin-box" style={{ padding: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-h)' }}>Status:</span>
                    {['pending', 'action_taken', 'dismissed', 'all'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setReportFilter(st)}
                        className="btn btn-sm"
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          textTransform: 'capitalize',
                          background: reportFilter === st ? '#dc2626' : 'var(--surface-subtle)',
                          color: reportFilter === st ? '#fff' : 'var(--text)',
                          borderColor: reportFilter === st ? '#dc2626' : 'var(--border)',
                        }}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                    <select
                      value={reportTypeFilter}
                      onChange={(e) => setReportTypeFilter(e.target.value)}
                      className="admin-select"
                      style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
                    >
                      <option value="all">All Types</option>
                      <option value="listing">Listings</option>
                      <option value="user">Users</option>
                      <option value="message">Messages</option>
                      <option value="review">Reviews</option>
                    </select>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{reports.length} report(s)</span>
                </div>

                {reports.length === 0 ? (
                  <div className="admin-box text-center py-12">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h4 className="font-bold text-base">Safety Queue Clear</h4>
                    <p className="text-xs text-slate-500">No {reportFilter} reports match your filters.</p>
                  </div>
                ) : (
                  reports.map((r) => (
                    <div key={r.id} className="mod-item-card">
                      <div className="mod-header">
                        <div className="flex items-center gap-2">
                          <span className="pill pill-red">Report #{r.id} • {r.target_type_label}</span>
                          <span className="text-sm font-bold">{r.reason}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(r.created_at).toLocaleString()} by <strong>{r.reporter?.name || 'Student'}</strong>
                        </div>
                      </div>

                      <div className="mod-preview-box">
                        {r.target_preview ? (
                          <div className="space-y-1">
                            {r.target_preview.title && <div><strong>Listing:</strong> {r.target_preview.title} (₦{r.target_preview.price})</div>}
                            {r.target_preview.seller_name && <div><strong>Seller:</strong> {r.target_preview.seller_name} (#{r.target_preview.seller_id})</div>}
                            {r.target_preview.name && <div><strong>Student:</strong> {r.target_preview.name} ({r.target_preview.email}) - {r.target_preview.status}</div>}
                            {r.target_preview.body && <div><strong>Message:</strong> "{r.target_preview.body}"</div>}
                          </div>
                        ) : (
                          <span className="italic text-slate-500">Target content has been removed.</span>
                        )}
                        {r.note && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <strong>Reporter Note:</strong> {r.note}
                          </div>
                        )}
                      </div>

                      {r.status === 'pending' ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="Optional internal moderator note..."
                            value={modNote[r.id] || ''}
                            onChange={(e) => setModNote({ ...modNote, [r.id]: e.target.value })}
                            className="admin-input"
                          />
                          <div className="mod-actions-row">
                            <button onClick={() => handleResolveReport(r.id, 'content_removed')} className="btn btn-sm" style={{ background: '#e11d48', color: '#fff', border: 'none' }}>
                              <Trash2 className="w-3.5 h-3.5" /><span>Remove Content</span>
                            </button>
                            <button onClick={() => handleResolveReport(r.id, 'user_suspended')} className="btn btn-sm" style={{ background: '#0f172a', color: '#fff', border: 'none' }}>
                              <Ban className="w-3.5 h-3.5" /><span>Suspend Student</span>
                            </button>
                            <button onClick={() => handleResolveReport(r.id, 'user_warned')} className="btn btn-sm" style={{ background: '#f59e0b', color: '#fff', border: 'none' }}>
                              <AlertTriangle className="w-3.5 h-3.5" /><span>Issue Warning</span>
                            </button>
                            <button onClick={() => handleResolveReport(r.id, 'dismissed')} className="btn btn-outline btn-sm">Dismiss</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg flex justify-between">
                          <span>Status: <strong className="uppercase">{r.status}</strong> • Action: <strong>{r.resolution}</strong></span>
                          <span className="text-slate-500">By {r.handler?.name || 'Moderator'}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ================= 3. PRODUCT LIST ================= */}
            {activeTab === 'listings' && (
              <div className="flex flex-col gap-4">
                <div className="admin-box" style={{ padding: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search product title, description, or seller..."
                      value={listingQuery}
                      onChange={(e) => { setListingQuery(e.target.value); setListingsPage(1) }}
                      className="admin-input pl-9"
                    />
                  </div>
                  <select
                    value={listingStatusFilter}
                    onChange={(e) => { setListingStatusFilter(e.target.value); setListingsPage(1) }}
                    className="admin-select"
                    style={{ width: 'auto' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="removed">Removed</option>
                    <option value="draft">Draft</option>
                  </select>
                  <select
                    value={listingCatFilter}
                    onChange={(e) => { setListingCatFilter(e.target.value); setListingsPage(1) }}
                    className="admin-select"
                    style={{ width: 'auto' }}
                  >
                    <option value="all">All Categories</option>
                    {stats?.categories?.map((c) => (
                      <option key={c.slug} value={c.id || ''}>{c.name}</option>
                    ))}
                  </select>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleSyncDemoProducts}
                      disabled={syncingDemo}
                      className="btn btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
                      title="Import all demo products into the database"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-red-600" />
                      <span>{syncingDemo ? 'Syncing...' : 'Sync Demo Products'}</span>
                    </button>
                  )}
                </div>

                <div className="admin-box" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="admin-table-wrap" style={{ border: 'none' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Seller</th>
                          <th>Category &amp; Spot</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-slate-500">
                              <div className="flex flex-col items-center gap-3">
                                <span>No products found in the database for the current filter.</span>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={handleSyncDemoProducts}
                                    disabled={syncingDemo}
                                    className="btn btn-primary btn-sm text-xs inline-flex items-center gap-1.5"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>{syncingDemo ? 'Importing Demo Products...' : 'Import All Demo Marketplace Products'}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : listings.map((item: any) => {
                          const rawImg = item.images?.[0]?.url || item.images?.[0]?.file_url
                          const thumb = resolveImageUrl(rawImg)
                          return (
                            <tr key={item.id}>
                              <td>
                                <div className="flex items-center gap-3">
                                  <img
                                    src={thumb}
                                    alt={item.title}
                                    className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_ITEM_PLACEHOLDER }}
                                  />
                                  <div className="min-w-0">
                                    <Link to={`/listings/${item.id}`} className="font-bold text-slate-900 dark:text-white hover:text-red-600 hover:underline block">
                                      {item.title}
                                    </Link>
                                    <div className="text-[11px] text-slate-400">
                                      #{item.id} · {item.condition} · {item.listing_type || 'sell'} · {item.views_count || 0} views
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="font-semibold">{item.seller?.name || 'Unknown'}</div>
                                <div className="text-[11px] text-slate-400">{item.seller?.email || ''}</div>
                              </td>
                              <td>
                                <div className="font-semibold text-xs">{item.category?.name || '—'}</div>
                                <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{item.meeting_location?.name || 'On campus'}</div>
                              </td>
                              <td className="font-bold">{formatNaira(item.price)}</td>
                              <td>
                                <select
                                  value={item.status}
                                  onChange={(e) => handleListingStatusChange(item.id, e.target.value)}
                                  className="admin-select"
                                  style={{ padding: '4px 8px', fontSize: 11, width: 'auto', fontWeight: 700 }}
                                >
                                  <option value="active">Active</option>
                                  <option value="reserved">Reserved</option>
                                  <option value="sold">Sold</option>
                                  <option value="removed">Removed</option>
                                  <option value="draft">Draft</option>
                                </select>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div className="inline-flex items-center gap-1.5">
                                  <Link
                                    to={`/listings/${item.id}`}
                                    className="btn btn-outline btn-sm p-1.5"
                                    title="View product on marketplace"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                  <Link
                                    to={`/listings/${item.id}/edit`}
                                    className="btn btn-outline btn-sm p-1.5"
                                    title="Edit product"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Link>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteListing(item)}
                                      className="btn btn-sm p-1.5"
                                      style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}
                                      title="Delete product permanently"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {listingsLastPage > 1 && (
                    <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span>Page {listingsPage} of {listingsLastPage}</span>
                      <div className="flex gap-2">
                        <button disabled={listingsPage <= 1} onClick={() => setListingsPage((p) => p - 1)} className="btn btn-outline btn-sm">Prev</button>
                        <button disabled={listingsPage >= listingsLastPage} onClick={() => setListingsPage((p) => p + 1)} className="btn btn-outline btn-sm">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= 4. DEALS & ESCROW ================= */}
            {activeTab === 'deals' && isAdmin && (
              <div className="flex flex-col gap-4">
                <div className="admin-box" style={{ padding: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Search item, buyer, seller, or Paystack reference..."
                    value={dealQuery}
                    onChange={(e) => { setDealQuery(e.target.value); setDealsPage(1) }}
                    className="admin-input"
                    style={{ flex: 1, minWidth: 220 }}
                  />
                  <select
                    value={dealStatusFilter}
                    onChange={(e) => { setDealStatusFilter(e.target.value); setDealsPage(1) }}
                    className="admin-select"
                    style={{ width: 'auto' }}
                  >
                    <option value="all">All Deal Statuses</option>
                    <option value="proposed">Proposed</option>
                    <option value="accepted">Accepted</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="declined">Declined</option>
                  </select>
                  <select
                    value={dealPaymentFilter}
                    onChange={(e) => { setDealPaymentFilter(e.target.value); setDealsPage(1) }}
                    className="admin-select"
                    style={{ width: 'auto' }}
                  >
                    <option value="all">All Payment Statuses</option>
                    <option value="paid">Paid (Escrow)</option>
                    <option value="pending">Pending</option>
                    <option value="unpaid">Unpaid / Cash</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div className="admin-box" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="admin-table-wrap" style={{ border: 'none' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Deal &amp; Item</th>
                          <th>Buyer → Seller</th>
                          <th>Amount / Terms</th>
                          <th>Deal Status</th>
                          <th>Escrow Payment</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deals.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-8 text-slate-500">No deals found.</td></tr>
                        ) : deals.map((d: any) => (
                          <tr key={d.id}>
                            <td>
                              <div className="font-bold">#{d.id} · {d.listing?.title || 'Campus Item'}</div>
                              <div className="text-[11px] text-slate-400">{d.meeting_location?.name || 'On campus'}</div>
                            </td>
                            <td>
                              <div className="text-xs">
                                <strong>{d.conversation?.buyer?.name || 'Buyer'}</strong> → <strong>{d.conversation?.seller?.name || 'Seller'}</strong>
                              </div>
                            </td>
                            <td className="font-bold">
                              {d.deal_type === 'exchange' ? `Swap: ${d.exchange_item || 'Item'}` : formatNaira(d.agreed_price)}
                            </td>
                            <td><span className="pill pill-student">{d.status}</span></td>
                            <td>
                              <span className={`pill ${d.payment_status === 'paid' ? 'pill-active' : d.payment_status === 'refunded' ? 'pill-red' : 'pill-student'}`}>
                                {d.payment_status || 'unpaid'}
                              </span>
                              {d.payment_reference && (
                                <div className="mono text-[10px] text-slate-400 mt-0.5">{d.payment_reference}</div>
                              )}
                            </td>
                            <td className="text-slate-500">{new Date(d.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {dealsLastPage > 1 && (
                    <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span>Page {dealsPage} of {dealsLastPage}</span>
                      <div className="flex gap-2">
                        <button disabled={dealsPage <= 1} onClick={() => setDealsPage((p) => p - 1)} className="btn btn-outline btn-sm">Prev</button>
                        <button disabled={dealsPage >= dealsLastPage} onClick={() => setDealsPage((p) => p + 1)} className="btn btn-outline btn-sm">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= 5. FINANCE, WALLETS & PAYOUTS ================= */}
            {activeTab === 'finance' && isAdmin && (
              <div className="flex flex-col gap-5">
                {financeSummary && (
                  <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                      <span className="admin-stat-label">Admin Revenue ({financeSummary.commission_rate ?? 20}%)</span>
                      <span className="admin-stat-val" style={{ fontSize: 22, color: '#059669' }}>{formatNaira(financeSummary.admin_commission_total)}</span>
                      <span className="admin-stat-sub">
                        Escrow: {formatNaira(financeSummary.escrow_commission_earned)} · Pending: {formatNaira(financeSummary.pending_escrow_commission)}
                      </span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-label">Seller Share ({financeSummary.seller_share_rate ?? 80}%)</span>
                      <span className="admin-stat-val" style={{ fontSize: 22 }}>{formatNaira(Number(financeSummary.escrow_released_total || 0) + Number(financeSummary.cash_sales_total || 0))}</span>
                      <span className="admin-stat-sub">
                        From {formatNaira(financeSummary.gross_sales_volume)} gross sales
                      </span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-label">Seller Available + Escrow</span>
                      <span className="admin-stat-val" style={{ fontSize: 22 }}>{formatNaira(financeSummary.available_seller_balances)}</span>
                      <span className="admin-stat-sub">
                        {formatNaira(financeSummary.escrow_held)} held in pending escrow
                      </span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-label">Pending Payouts</span>
                      <span className="admin-stat-val red" style={{ fontSize: 22 }}>{formatNaira(financeSummary.pending_withdrawals_amount)}</span>
                      <span className="admin-stat-sub">{financeSummary.pending_withdrawals_count} request(s)</span>
                    </div>
                  </div>
                )}

                {/* Withdrawal Queue */}
                <div className="admin-box">
                  <div className="admin-box-header">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="admin-box-title"><Wallet className="w-4 h-4 text-red-600" /><span>Seller Withdrawal &amp; Payout Queue</span></h3>
                        <span className="admin-box-sub">Approve payouts after bank transfer or reject to return funds to seller wallet</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={withdrawalFilter}
                          onChange={(e) => setWithdrawalFilter(e.target.value)}
                          className="admin-select"
                          style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
                        >
                          <option value="all">All Requests</option>
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button type="button" onClick={fetchFinance} className="btn btn-outline btn-sm">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Seller</th>
                          <th>Bank Destination</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Admin Note / Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-8 text-slate-500">No withdrawal requests found.</td></tr>
                        ) : withdrawals.map((w) => (
                          <tr key={w.id}>
                            <td>
                              <div className="font-bold">{w.user?.name || 'Seller'}</div>
                              <div className="text-[11px] text-slate-400">{w.user?.email}</div>
                              <div className="mono text-[10px] text-slate-400">{w.reference}</div>
                            </td>
                            <td>
                              <div className="font-semibold">{w.bank_name}</div>
                              <div className="mono text-[11px] text-slate-500">{w.account_number} · {w.account_name}</div>
                            </td>
                            <td className="font-extrabold">{formatNaira(w.amount)}</td>
                            <td>
                              <span className={`pill ${w.status === 'paid' ? 'pill-active' : w.status === 'rejected' ? 'pill-red' : 'pill-moderator'}`}>
                                {w.status}
                              </span>
                            </td>
                            <td>
                              {w.status === 'pending' ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Transfer ref / note..."
                                    value={withdrawalNote[w.id] || ''}
                                    onChange={(e) => setWithdrawalNote({ ...withdrawalNote, [w.id]: e.target.value })}
                                    className="admin-input"
                                    style={{ width: 150, padding: '5px 8px', fontSize: 11 }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleProcessWithdrawal(w, 'paid')}
                                    className="btn btn-sm"
                                    style={{ background: '#059669', color: '#fff', border: 'none', padding: '5px 10px', fontSize: 11 }}
                                  >
                                    Mark Paid
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleProcessWithdrawal(w, 'rejected')}
                                    className="btn btn-sm"
                                    style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca', padding: '5px 10px', fontSize: 11 }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500">{w.admin_note || `Processed by ${w.processor?.name || 'Admin'}`}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Seller Wallets Directory */}
                <div className="admin-box">
                  <div className="admin-box-header">
                    <h3 className="admin-box-title"><TrendingUp className="w-4 h-4 text-emerald-600" /><span>Seller Wallet Balances &amp; Lifetime Revenue</span></h3>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Seller</th>
                          <th>Available</th>
                          <th>Pending Escrow</th>
                          <th>Escrow Earned</th>
                          <th>Cash Sales</th>
                          <th>Withdrawn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sellerWallets.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-6 text-slate-500">No active seller wallet balances yet.</td></tr>
                        ) : sellerWallets.map((w) => (
                          <tr key={w.id}>
                            <td>
                              <div className="font-bold">{w.user?.name || `User #${w.user_id}`}</div>
                              <div className="text-[11px] text-slate-400">{w.user?.email}</div>
                            </td>
                            <td className="font-bold text-emerald-600">{formatNaira(w.available_balance)}</td>
                            <td className="font-bold text-amber-600">{formatNaira(w.pending_balance)}</td>
                            <td>{formatNaira(w.total_earned)}</td>
                            <td>{formatNaira(w.cash_sales_total)}</td>
                            <td>{formatNaira(w.total_withdrawn)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Platform Ledger */}
                <div className="admin-box">
                  <div className="admin-box-header">
                    <h3 className="admin-box-title"><FileText className="w-4 h-4 text-red-600" /><span>Recent Financial Ledger Entries</span></h3>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Date &amp; Ref</th>
                          <th>Seller</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Gross</th>
                          <th>Admin (20%)</th>
                          <th>Seller (80%)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentWalletTxs.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-6 text-slate-500">No ledger entries yet.</td></tr>
                        ) : recentWalletTxs.map((tx) => (
                          <tr key={tx.id}>
                            <td>
                              <div>{new Date(tx.created_at).toLocaleDateString()}</div>
                              <div className="mono text-[10px] text-slate-400">{tx.reference}</div>
                            </td>
                            <td className="font-bold">{(tx as any).user?.name || `User #${tx.user_id}`}</td>
                            <td><span className="pill pill-student">{tx.type}</span></td>
                            <td>{tx.description}</td>
                            <td>{formatNaira(tx.gross_amount)}</td>
                            <td className="font-semibold text-emerald-700">{formatNaira(tx.fee_amount)}</td>
                            <td className="font-bold">{formatNaira(tx.net_amount)}</td>
                            <td><span className={`pill ${tx.status === 'completed' ? 'pill-active' : 'pill-student'}`}>{tx.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 6. USERS DIRECTORY ================= */}
            {activeTab === 'users' && isAdmin && (
              <div className="flex flex-col gap-4">
                <div className="admin-box" style={{ padding: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Search by student name, email, student ID, or faculty..."
                    value={userQuery}
                    onChange={(e) => { setUserQuery(e.target.value); setUsersPage(1) }}
                    className="admin-input"
                    style={{ flex: 1, minWidth: 240 }}
                  />
                  <select value={userRoleFilter} onChange={(e) => { setUserRoleFilter(e.target.value); setUsersPage(1) }} className="admin-select" style={{ width: 'auto' }}>
                    <option value="all">All Roles</option>
                    <option value="student">Student</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <select value={userStatusFilter} onChange={(e) => { setUserStatusFilter(e.target.value); setUsersPage(1) }} className="admin-select" style={{ width: 'auto' }}>
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>

                <div className="admin-box" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="admin-table-wrap" style={{ border: 'none' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Student ID &amp; Email</th>
                          <th>Listings / Wallet</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u: any) => {
                          const isSuspended = u.status === 'suspended'
                          return (
                            <tr key={u.id}>
                              <td>
                                <div className="font-bold">{u.name}</div>
                                <div className="text-[11px] text-slate-400">{u.faculty || 'Lincoln Nasarawa'}</div>
                              </td>
                              <td>
                                <span className="mono font-bold block">{u.student_id}</span>
                                <span className="text-[11px] text-slate-400">{u.email}</span>
                              </td>
                              <td>
                                <div className="text-xs font-semibold">{u.listings_count ?? 0} listing(s)</div>
                                {u.wallet && (
                                  <div className="text-[11px] text-emerald-600 font-bold">
                                    Avail: {formatNaira(u.wallet.available_balance)}
                                  </div>
                                )}
                              </td>
                              <td>
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
                              </td>
                              <td>
                                <span className={`pill ${isSuspended ? 'pill-suspended' : 'pill-active'}`}>
                                  {u.status || 'active'}
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
                  {usersLastPage > 1 && (
                    <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span>Page {usersPage} of {usersLastPage}</span>
                      <div className="flex gap-2">
                        <button disabled={usersPage <= 1} onClick={() => setUsersPage((p) => p - 1)} className="btn btn-outline btn-sm">Prev</button>
                        <button disabled={usersPage >= usersLastPage} onClick={() => setUsersPage((p) => p + 1)} className="btn btn-outline btn-sm">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= 7. CATEGORIES & SAFE SPOTS ================= */}
            {activeTab === 'taxonomy' && isAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Categories Card */}
                <div className="admin-box flex flex-col gap-5">
                  <div className="admin-box-header" style={{ marginBottom: 0 }}>
                    <h3 className="admin-box-title"><Tag className="w-4 h-4 text-red-600" /><span>Marketplace Categories</span></h3>
                    <span className="admin-box-sub">Add, edit, or remove student trading categories</span>
                  </div>

                  <form onSubmit={handleAddCategory} className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="New category name (e.g. Lab Kits & Uniforms)"
                      className="admin-input"
                    />
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="Short description (optional)"
                      className="admin-input"
                    />
                    <button type="submit" className="btn btn-primary btn-sm flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" /><span>Add Category</span>
                    </button>
                  </form>

                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {stats?.categories?.map((cat) => (
                      <div key={cat.slug} className="py-3 flex items-center justify-between gap-2">
                        {editingCatId === cat.id ? (
                          <div className="flex-1 flex flex-col gap-2">
                            <input type="text" value={editCatName} onChange={(e) => setEditCatName(e.target.value)} className="admin-input" />
                            <input type="text" value={editCatDesc} onChange={(e) => setEditCatDesc(e.target.value)} placeholder="Description" className="admin-input" />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => cat.id && handleSaveEditCategory(cat.id)} className="btn btn-primary btn-sm">Save</button>
                              <button type="button" onClick={() => setEditingCatId(null)} className="btn btn-outline btn-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="min-w-0">
                              <div className="font-bold text-sm">{cat.name} <span className="text-xs font-normal text-slate-400">({cat.listings_count} items)</span></div>
                              {cat.description && <div className="text-xs text-slate-500 truncate">{cat.description}</div>}
                            </div>
                            {cat.id && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCatId(cat.id!)
                                    setEditCatName(cat.name)
                                    setEditCatDesc(cat.description || '')
                                  }}
                                  className="btn btn-outline btn-sm p-1.5"
                                  title="Edit category"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.id!, cat.name)}
                                  className="btn btn-outline btn-sm p-1.5 text-red-600"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campus Meeting Locations Card */}
                <div className="admin-box flex flex-col gap-5">
                  <div className="admin-box-header" style={{ marginBottom: 0 }}>
                    <h3 className="admin-box-title"><MapPin className="w-4 h-4 text-red-600" /><span>Safe Campus Meeting Locations</span></h3>
                    <span className="admin-box-sub">Verified Lincoln Nasarawa pickup zones for deals &amp; escrow</span>
                  </div>

                  <form onSubmit={handleAddLocation} className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      required
                      value={newLocName}
                      onChange={(e) => setNewLocName(e.target.value)}
                      placeholder="Location name (e.g. Lincoln Central Library Foyer)"
                      className="admin-input"
                    />
                    <input
                      type="text"
                      value={newLocDesc}
                      onChange={(e) => setNewLocDesc(e.target.value)}
                      placeholder="Landmark / safety description"
                      className="admin-input"
                    />
                    <button type="submit" className="btn btn-primary btn-sm flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" /><span>Add Meeting Spot</span>
                    </button>
                  </form>

                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {locations.map((loc) => (
                      <div key={loc.id} className="py-3 flex items-center justify-between gap-2">
                        {editingLocId === loc.id ? (
                          <div className="flex-1 flex flex-col gap-2">
                            <input type="text" value={editLocName} onChange={(e) => setEditLocName(e.target.value)} className="admin-input" />
                            <input type="text" value={editLocDesc} onChange={(e) => setEditLocDesc(e.target.value)} placeholder="Description" className="admin-input" />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleSaveEditLocation(loc.id)} className="btn btn-primary btn-sm">Save</button>
                              <button type="button" onClick={() => setEditingLocId(null)} className="btn btn-outline btn-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="min-w-0">
                              <div className="font-bold text-sm">{loc.name}</div>
                              {loc.description && <div className="text-xs text-slate-500">{loc.description}</div>}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLocId(loc.id)
                                  setEditLocName(loc.name)
                                  setEditLocDesc(loc.description || '')
                                }}
                                className="btn btn-outline btn-sm p-1.5"
                                title="Edit spot"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLocation(loc.id, loc.name)}
                                className="btn btn-outline btn-sm p-1.5 text-red-600"
                                title="Delete spot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= 8. AUDIT LOGS EXPLORER ================= */}
            {activeTab === 'audit' && (
              <div className="flex flex-col gap-4">
                <div className="admin-box" style={{ padding: 14, display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Search audit logs by action, target type, or actor..."
                    value={auditQuery}
                    onChange={(e) => { setAuditQuery(e.target.value); setAuditPage(1) }}
                    className="admin-input"
                  />
                  <button type="button" onClick={fetchAuditLogs} className="btn btn-outline btn-sm">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="admin-box" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="admin-table-wrap" style={{ border: 'none' }}>
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
                        {auditLogs.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-8 text-slate-500">No audit entries found.</td></tr>
                        ) : auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="font-bold">{log.actor?.name || 'System'}</td>
                            <td><span className="pill pill-student">{log.action}</span></td>
                            <td className="text-slate-500">{log.target_type ? `${log.target_type} #${log.target_id || ''}` : '—'}</td>
                            <td className="mono text-slate-400" style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.meta ? JSON.stringify(log.meta) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {auditLastPage > 1 && (
                    <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span>Page {auditPage} of {auditLastPage}</span>
                      <div className="flex gap-2">
                        <button disabled={auditPage <= 1} onClick={() => setAuditPage((p) => p - 1)} className="btn btn-outline btn-sm">Prev</button>
                        <button disabled={auditPage >= auditLastPage} onClick={() => setAuditPage((p) => p + 1)} className="btn btn-outline btn-sm">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= 9. CAMPUS SETTINGS ================= */}
            {activeTab === 'settings' && isAdmin && (
              <div className="admin-box">
                <div className="admin-box-header">
                  <h3 className="admin-box-title"><Settings className="w-4 h-4 text-red-600" /><span>Campus Policies &amp; Prohibited Item Filter</span></h3>
                  <span className="admin-box-sub">Configure Lincoln University College, Nasarawa State email domains and automated prohibited item filters</span>
                </div>

                <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
                  <div className="admin-form-group">
                    <label className="admin-label">Platform / Admin Commission Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={95}
                      step="0.5"
                      value={commissionRateInput}
                      onChange={(e) => setCommissionRateInput(e.target.value)}
                      className="admin-input mono"
                      style={{ maxWidth: 220 }}
                    />
                    <span className="text-xs text-slate-400">
                      Default: 20% (Admin takes 20%, Seller wallet holds {Math.max(0, 100 - Number(commissionRateInput || 0))}%)
                    </span>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Allowed Student Email Domains (comma-separated)</label>
                    <input
                      type="text"
                      value={allowedDomainsText}
                      onChange={(e) => setAllowedDomainsText(e.target.value)}
                      className="admin-input mono"
                    />
                    <span className="text-xs text-slate-400">
                      Default: lincoln.edu.ng, student.lincoln.edu.ng
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
                    <span className="text-xs text-slate-400">
                      Any listing containing these keywords in title or description will be blocked automatically.
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
      </div>
    </div>
  )
}

export default AdminDashboardPage
