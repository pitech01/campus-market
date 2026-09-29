import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Handshake, Heart, MessageSquare, ShieldCheck } from 'lucide-react'
import Icon from './Icon'
import { useFavorites } from '../lib/favoritesContext'
import { useAuth } from '../lib/authContext'
import ChatDrawer from './chat/ChatDrawer'
import NotificationDropdown from './NotificationDropdown'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const location = useLocation()
  const { favoriteCount } = useFavorites()
  const { user, isAuthenticated } = useAuth()

  const displayName = user?.name ? user.name.split(' ')[0] : 'You'

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <span className="topbar-msg">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
            Lincoln University College, Malaysia — Safe Peer-to-Peer Student Marketplace.
          </span>
          <div className="topbar-links">
            <Link to="/deals" className="inline-flex items-center gap-1.5">
              <Handshake className="w-3.5 h-3.5" />
              <span>My Deals</span>
            </Link>
            <Link to="/favorites" className="inline-flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              <span>Favourites</span>
            </Link>
            <Link to="/#trust" className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safety Tips</span>
            </Link>
          </div>
        </div>
      </div>

      <header className="navbar">
        <div className="navbar-inner">
          <Link className="brand" to="/">
            <div className="brand-badge">
              <span className="brand-logo-text">LUC</span>
            </div>
            <div className="brand-text-group">
              <span className="brand-name">Campus Market</span>
              <span className="brand-campus-pill">Lincoln Uni</span>
            </div>
          </Link>

          <nav className={`navbar-links ${menuOpen ? 'is-open' : ''}`}>
            <Link
              to="/"
              className={location.pathname === '/' && !location.hash ? 'is-active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              Explore
            </Link>
            <Link
              to="/deals"
              className={location.pathname === '/deals' ? 'is-active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              My Deals
            </Link>
            <Link
              to="/favorites"
              className={location.pathname === '/favorites' ? 'is-active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              Favourites
            </Link>
            <Link
              to="/profile"
              className={location.pathname === '/profile' ? 'is-active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              Profile Hub
            </Link>
            {(user?.role === 'admin' || user?.role === 'moderator') && (
              <Link
                to="/admin"
                className={`flex items-center gap-1 font-bold text-indigo-600 ${location.pathname === '/admin' ? 'is-active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>

          <div className="navbar-actions">
            {/* Live Notifications Bell (FR-NOT) */}
            {isAuthenticated && <NotificationDropdown />}

            {/* Live Chat Drawer Button */}
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

            {/* Saved Items */}
            <Link
              to="/favorites"
              className="icon-btn wishlist-nav-btn"
              aria-label={`Saved items (${favoriteCount})`}
              title="Saved Items"
            >
              <Icon name="icon-heart" />
              {favoriteCount > 0 && (
                <span className="nav-badge-count">{favoriteCount}</span>
              )}
            </Link>

            {isAuthenticated ? (
              <Link to="/profile" className="user-profile-pill" aria-label="Your Account">
                <span className="user-nav-initial">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
                <span className="user-nav-label">{displayName}</span>
              </Link>
            ) : (
              <Link to="/login" className="btn btn-outline btn-sm">
                <Icon name="icon-user" />
                <span>Log In</span>
              </Link>
            )}

            <Link to="/listings/new" className="btn btn-primary btn-sm list-btn">
              <Icon name="icon-plus" />
              <span>Post Item</span>
            </Link>

            <button
              type="button"
              className="icon-btn navbar-toggle"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon name={menuOpen ? 'icon-close' : 'icon-menu'} />
            </button>
          </div>
        </div>
      </header>

      {/* Global In-App Chat Drawer */}
      <ChatDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </>
  )
}
