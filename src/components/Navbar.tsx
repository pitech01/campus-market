import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Handshake,
  Heart,
  MessageSquare,
  ShieldCheck,
  Plus,
  Compass,
  User,
  LogIn,
  LogOut,
  Menu,
  X,
  Sparkles,
  Shield,
  ChevronRight,
  Search,
} from 'lucide-react'
import Icon from './Icon'
import { useFavorites } from '../lib/favoritesContext'
import { useAuth } from '../lib/authContext'
import { resolveImageUrl } from '../lib/api'
import ChatDrawer from './chat/ChatDrawer'
import NotificationDropdown from './NotificationDropdown'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [navSearch, setNavSearch] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { favoriteCount } = useFavorites()
  const { user, isAuthenticated, logout } = useAuth()

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = navSearch.trim()
    if (!trimmed) return
    navigate(`/?q=${encodeURIComponent(trimmed)}#browse-section`)
    setNavSearch('')
    setMenuOpen(false)
    setTimeout(() => {
      const el = document.getElementById('browse-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }, 120)
  }

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const displayName = user?.name ? user.name.split(' ')[0] : 'You'
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <>
      {/* Top Utility Bar */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-msg">
            <ShieldCheck className="w-3.5 h-3.5 inline text-emerald-400 flex-shrink-0" />
            <span className="topbar-text-desktop">
              Nasarawa State University, Keffi — Safe Peer-to-Peer Student Marketplace.
            </span>
            <span className="topbar-text-mobile">
              NSUK Keffi · Safe Student Marketplace
            </span>
          </div>
          <div className="topbar-links">
            <Link to="/deals" className="topbar-link">
              <Handshake className="w-3.5 h-3.5" />
              <span>My Deals</span>
            </Link>
            <Link to="/favorites" className="topbar-link">
              <Heart className="w-3.5 h-3.5" />
              <span>Favourites ({favoriteCount})</span>
            </Link>
            <Link to="/#trust" className="topbar-link">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safety Tips</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="navbar">
        <div className="navbar-inner">
          {/* Brand Logo */}
          <Link className="brand" to="/" aria-label="NSUK Campus Market Home">
            <div className="brand-badge" style={{ background: '#ffffff', padding: 2, border: '1.5px solid rgba(220, 38, 38, 0.4)' }}>
              <img src="/images/nsuk-logo.png" alt="NSUK Crest" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            </div>
            <div className="brand-text-group">
              <span className="brand-name">Campus Market</span>
              <span className="brand-campus-pill">Keffi</span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form className="navbar-search-bar desktop-only-btn" onSubmit={handleNavSearch} role="search">
            <Search className="navbar-search-icon" />
            <input
              type="search"
              placeholder="Search marketplace..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="navbar-search-input"
              aria-label="Search marketplace"
            />
            {navSearch && (
              <button
                type="button"
                className="navbar-search-clear"
                onClick={() => setNavSearch('')}
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Desktop Navigation Links */}
          <nav className="navbar-links" aria-label="Main Navigation">
            <Link
              to="/"
              className={location.pathname === '/' && !location.hash ? 'is-active' : ''}
            >
              Explore
            </Link>
            <Link
              to="/deals"
              className={location.pathname === '/deals' ? 'is-active' : ''}
            >
              My Deals
            </Link>
            <Link
              to="/favorites"
              className={location.pathname === '/favorites' ? 'is-active' : ''}
            >
              Favourites
            </Link>
            <Link
              to="/profile"
              className={location.pathname === '/profile' ? 'is-active' : ''}
            >
              Profile Hub
            </Link>
            {(user?.role === 'admin' || user?.role === 'moderator') && (
              <Link
                to="/admin"
                className={`admin-nav-link ${location.pathname === '/admin' ? 'is-active' : ''}`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Action Elements */}
          <div className="navbar-actions">
            {/* Live Notifications Bell */}
            {isAuthenticated && <NotificationDropdown />}

            {/* Live Chat Drawer Trigger Button */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="icon-btn"
                title="Campus Messenger & Deals"
                aria-label="Messages"
              >
                <MessageSquare className="w-4 h-4 text-slate-700 dark:text-slate-200" />
              </button>
            )}

            {/* Saved Items (Desktop & Tablet) */}
            <Link
              to="/favorites"
              className="icon-btn wishlist-nav-btn desktop-only-btn"
              aria-label={`Saved items (${favoriteCount})`}
              title="Saved Items"
            >
              <Icon name="icon-heart" />
              {favoriteCount > 0 && (
                <span className="nav-badge-count">{favoriteCount}</span>
              )}
            </Link>

            {/* User Profile Pill (Desktop / Tablet) */}
            {isAuthenticated ? (
              <Link to="/profile" className="user-profile-pill desktop-only-btn" aria-label="Your Account">
                {user?.avatar_url ? (
                  <img
                    src={resolveImageUrl(user.avatar_url)}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <span className="user-nav-initial">{userInitial}</span>
                )}
                <span className="user-nav-label">{displayName}</span>
              </Link>
            ) : (
              <Link to="/login" className="btn btn-outline btn-sm desktop-only-btn">
                <Icon name="icon-user" />
                <span>Log In</span>
              </Link>
            )}

            {/* Post Item CTA Button */}
            <Link to="/listings/new" className="btn btn-primary btn-sm list-btn" aria-label="Post Item">
              <Plus className="w-4 h-4 list-btn-icon" />
              <span className="list-btn-text">Post Item</span>
            </Link>

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              type="button"
              className="icon-btn navbar-toggle"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Modern Slide-over Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="mobile-menu-overlay" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
          <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)} />
          <aside className="mobile-menu-drawer">
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
                <div className="brand-badge">
                  <span className="brand-logo-text">NSUK</span>
                </div>
                <div className="brand-text-group">
                  <span className="brand-name">Campus Market</span>
                  <span className="brand-campus-pill">Keffi</span>
                </div>
              </Link>
              <button
                type="button"
                className="icon-btn mobile-drawer-close-btn"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile or Guest Hub */}
            <div className="mobile-drawer-user-card">
              {isAuthenticated ? (
                <div className="mobile-user-profile">
                  <div className="mobile-user-avatar overflow-hidden">
                    {user?.avatar_url ? (
                      <img
                        src={resolveImageUrl(user.avatar_url)}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  <div className="mobile-user-details">
                    <div className="mobile-user-name">{user?.name}</div>
                    <div className="mobile-user-sub">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline mr-1 flex-shrink-0" />
                      <span>{user?.student_id ? `NSUK ID: ${user.student_id}` : 'Verified Student'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mobile-guest-card">
                  <div className="mobile-guest-title">Join NSUK Campus Market</div>
                  <p className="mobile-guest-desc">Buy, sell & trade safely with verified NSUK students.</p>
                  <div className="mobile-guest-actions">
                    <Link
                      to="/login"
                      className="btn btn-outline btn-sm w-full"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LogIn className="w-3.5 h-3.5 mr-1" />
                      <span>Log In</span>
                    </Link>
                    <Link
                      to="/register"
                      className="btn btn-primary btn-sm w-full"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      <span>Register</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Search in Mobile Drawer */}
            <form className="mobile-drawer-search" onSubmit={handleNavSearch} role="search">
              <Search className="mobile-search-icon" />
              <input
                type="search"
                placeholder="Search campus marketplace..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="mobile-search-input"
                aria-label="Search campus marketplace"
              />
              {navSearch && (
                <button
                  type="button"
                  className="mobile-search-clear"
                  onClick={() => setNavSearch('')}
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Primary Action Button */}
            <div className="mobile-drawer-cta">
              <Link
                to="/listings/new"
                className="btn btn-primary mobile-drawer-post-btn"
                onClick={() => setMenuOpen(false)}
              >
                <Plus className="w-5 h-5" />
                <span>Post an Item for Sale</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="mobile-drawer-nav">
              <div className="mobile-nav-group-title">Marketplace Menu</div>
              <nav className="mobile-nav-list">
                <Link
                  to="/"
                  className={`mobile-nav-item ${location.pathname === '/' && !location.hash ? 'is-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="mobile-nav-icon">
                    <Compass className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="mobile-nav-text">Explore Marketplace</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </Link>

                <Link
                  to="/deals"
                  className={`mobile-nav-item ${location.pathname === '/deals' ? 'is-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="mobile-nav-icon">
                    <Handshake className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="mobile-nav-text">My Deals & Escrow</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </Link>

                <Link
                  to="/favorites"
                  className={`mobile-nav-item ${location.pathname === '/favorites' ? 'is-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="mobile-nav-icon">
                    <Heart className="w-5 h-5 text-rose-500" />
                  </div>
                  <span className="mobile-nav-text">Favourites & Wishlist</span>
                  {favoriteCount > 0 && (
                    <span className="mobile-badge-pill">{favoriteCount}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </Link>

                {isAuthenticated && (
                  <button
                    type="button"
                    className="mobile-nav-item w-full text-left"
                    onClick={() => {
                      setMenuOpen(false)
                      setChatOpen(true)
                    }}
                  >
                    <div className="mobile-nav-icon">
                      <MessageSquare className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="mobile-nav-text">Campus Messenger</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                  </button>
                )}

                <Link
                  to="/profile"
                  className={`mobile-nav-item ${location.pathname === '/profile' ? 'is-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="mobile-nav-icon">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                  <span className="mobile-nav-text">Student Hub & Profile</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </Link>

                <Link
                  to="/#trust"
                  className="mobile-nav-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="mobile-nav-icon">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="mobile-nav-text">Safety & Campus Meetups</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </Link>

                {(user?.role === 'admin' || user?.role === 'moderator') && (
                  <Link
                    to="/admin"
                    className={`mobile-nav-item admin-item ${location.pathname === '/admin' ? 'is-active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="mobile-nav-icon">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="mobile-nav-text font-bold text-red-600">Admin Dashboard</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                  </Link>
                )}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="mobile-drawer-footer">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false)
                    await logout()
                  }}
                  className="mobile-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Account</span>
                </button>
              )}
              <div className="mobile-drawer-campus-tag">
                Nasarawa State University Keffi · Safe Campus P2P
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Global In-App Chat Drawer */}
      <ChatDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </>
  )
}

