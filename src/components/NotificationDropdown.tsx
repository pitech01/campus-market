import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  BellOff,
  Handshake,
  MessageSquare,
  Megaphone,
} from 'lucide-react'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/api'
import type { NotificationItem } from '../types'

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data.notifications.data || [])
      setUnreadCount(data.unread_count || 0)
    } catch {
      // User may not be logged in
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 20000) // Poll every 20s
    return () => clearInterval(interval)
  }, [])

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })))
    } catch (err) {
      console.error(err)
    }
  }

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.read_at) {
      try {
        await markNotificationRead(notif.id)
        setUnreadCount((prev) => Math.max(0, prev - 1))
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
        )
      } catch (err) {
        console.error(err)
      }
    }
    setIsOpen(false)
  }

  return (
    <div className="notif-wrapper" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
        }}
        className="notif-bell-btn flex items-center justify-center"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-slate-700 dark:text-slate-200" />
        {unreadCount > 0 && (
          <span className="notif-badge-bubble">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-panel">
          {/* Header */}
          <div className="notif-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-h)' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '2px 7px', borderRadius: 999, fontSize: 10, fontWeight: 800 }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-soft)', fontSize: 12 }}>
                <BellOff className="w-7 h-7 mx-auto mb-2 text-slate-400 opacity-60" />
                No new notifications. Alerts for exchange deals and chats will appear here.
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.read_at
                const targetUrl = n.data?.action_url || (n.data?.deal_id ? '/deals' : n.data?.listing_id ? `/listings/${n.data.listing_id}` : '/deals')

                return (
                  <Link
                    key={n.id}
                    to={targetUrl}
                    onClick={() => handleItemClick(n)}
                    className={`notif-item ${isUnread ? 'is-unread' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                      {n.type.includes('Deal') ? (
                        <Handshake className="w-4 h-4 text-emerald-600" />
                      ) : n.type.includes('Message') ? (
                        <MessageSquare className="w-4 h-4 text-red-600" />
                      ) : (
                        <Megaphone className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-h)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.data?.title || 'Marketplace Alert'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.data?.message || 'You have an update on your campus exchange.'}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-soft)', display: 'block', marginTop: 4 }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {isUnread && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </Link>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '8px 12px', background: 'var(--surface-subtle)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <Link
              to="/deals"
              onClick={() => setIsOpen(false)}
              style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary)' }}
            >
              View Active Deals & Exchanges →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown

