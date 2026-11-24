import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Handshake,
  Settings,
  CheckCircle2,
  ShieldCheck,
  Download,
  Trash2,
  Tag,
  Heart,
  Camera,
  Plus,
  LogOut,
  MapPin,
  Edit,
  Check
} from 'lucide-react'
import { categories } from '../data/categories'
import { useAuth } from '../lib/authContext'
import {
  getMyListings,
  updateListingStatus,
  deleteListing,
  getFavorites,
  updateProfile,
  resolveImageUrl,
  DEFAULT_ITEM_PLACEHOLDER,
} from '../lib/api'
import type { Listing } from '../types'

const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'listings'
  const [activeTab, setActiveTab] = useState<'listings' | 'saved' | 'settings'>(
    currentTab === 'saved' ? 'saved' : currentTab === 'settings' ? 'settings' : 'listings'
  )

  const [listings, setListings] = useState<Listing[]>([])
  const [savedListings, setSavedListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Profile edit fields
  const [faculty, setFaculty] = useState(user?.faculty || 'Faculty of Computer Science')
  const [year, setYear] = useState(user?.year || 'Year 3')
  const [phone, setPhone] = useState(user?.phone || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('tab') === 'saved') {
      setActiveTab('saved')
    } else if (searchParams.get('tab') === 'settings') {
      setActiveTab('settings')
    }
  }, [searchParams])

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated, activeTab])

  const loadData = async () => {
    try {
      setIsLoading(true)
      if (activeTab === 'listings') {
        const data = await getMyListings()
        setListings(data)
      } else if (activeTab === 'saved') {
        const favs = await getFavorites()
        setSavedListings(favs)
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (tab: 'listings' | 'saved' | 'settings') => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleToggleStatus = async (listing: Listing) => {
    const nextStatus = listing.status === 'active' || listing.status === 'available' ? 'sold' : 'active'
    try {
      await updateListingStatus(listing.id, nextStatus)
      loadData()
    } catch {
      alert('Failed to update listing status.')
    }
  }

  const handleDeleteListing = async (id: string | number) => {
    if (!confirm('Are you sure you want to remove this listing?')) return
    try {
      await deleteListing(id)
      setListings((prev) => prev.filter((l) => String(l.id) !== String(id)))
    } catch {
      alert('Failed to delete listing.')
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSavingProfile(true)
      const formData = new FormData()
      formData.append('faculty', faculty)
      formData.append('year', year)
      if (phone) formData.append('phone', phone)
      if (bio) formData.append('bio', bio)

      await updateProfile(formData)
      setProfileSuccessMsg('Profile information updated successfully!')
      setTimeout(() => setProfileSuccessMsg(null), 3500)
    } catch (err: any) {
      alert(err?.message || 'Failed to update profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const activeCount = listings.filter((l) => l.status === 'active' || l.status === 'available').length
  const soldCount = listings.length - activeCount

  const studentName = user?.name || 'Nusaiba Nussy Abdullahi'
  const studentId = user?.student_id || 'NSUK/NAS/2023/1042'
  const studentEmail = user?.email || 'nusaiba@lincoln.edu.ng'

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-800 rounded-2xl border text-center">
        <h2 className="text-xl font-bold mb-2">Student Profile Hub</h2>
        <p className="text-xs text-slate-500 mb-6">
          Sign in to view your campus listings, deals, and trust ratings.
        </p>
        <Link
          to="/login"
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm inline-block"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="profile-page-container">
      {/* Student Profile Identity Card */}
      <div className="student-profile-hero">
        <div className="student-hero-content">
          <div className="student-avatar-large">
            {user?.avatar_url ? (
              <img
                src={resolveImageUrl(user.avatar_url)}
                alt={studentName}
                className="student-avatar-img w-full h-full rounded-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : null}
            {!user?.avatar_url && (
              <div className="avatar-big-initial">
                {studentName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="online-badge" />
          </div>

          <div className="student-meta-info">
            <div className="student-name-row">
              <h2>{studentName}</h2>
            </div>
            <p className="student-campus-id">
              Student ID: <strong>{studentId}</strong> · {studentEmail}
            </p>
            <div className="student-credibility-pills">
              <span className="cred-pill inline-flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" /> {listings.length} Items Listed
              </span>
              <span className="cred-pill inline-flex items-center gap-1.5">
                <Handshake className="w-3.5 h-3.5 text-emerald-600" /> {user?.completed_deals_count || 0} Completed Deals
              </span>
            </div>
          </div>

          <div className="student-hero-actions">
            <Link to="/listings/new" className="btn btn-primary inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>List New Item</span>
            </Link>

            <button
              type="button"
              className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
              onClick={handleLogout}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="profile-tabs-bar">
        <button
          type="button"
          className={`profile-tab-btn inline-flex items-center gap-2 ${activeTab === 'listings' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('listings')}
        >
          <Tag className="w-4 h-4" />
          <span>My Listings</span>
          <span className="tab-badge-pill">{listings.length}</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn inline-flex items-center gap-2 ${activeTab === 'saved' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('saved')}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Wishlist</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn inline-flex items-center gap-2 ${activeTab === 'settings' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('settings')}
        >
          <Settings className="w-4 h-4" />
          <span>Account Settings</span>
        </button>
      </div>

      {/* Tab Content: My Listings */}
      {activeTab === 'listings' && (
        <div className="profile-tab-content">
          <div className="tab-summary-row">
            <p className="tab-stats-text">
              Showing <strong>{activeCount} active</strong> and <strong>{soldCount} sold</strong> items on campus.
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">Loading listings...</div>
          ) : listings.length > 0 ? (
            <div className="profile-items-grid">
              {listings.map((listing) => {
                const category = categoryMap[listing.category as any] || (listing.category as any)
                const rawCover =
                  Array.isArray(listing.images) && listing.images.length > 0
                    ? typeof listing.images[0] === 'string'
                      ? listing.images[0]
                      : (listing.images[0] as any).url
                    : null
                const cover = resolveImageUrl(rawCover)

                const isAvailable = listing.status === 'active' || listing.status === 'available'

                return (
                  <div
                    className={`profile-item-card ${listing.status === 'sold' ? 'is-sold' : ''}`}
                    key={listing.id}
                  >
                    <div className="profile-item-thumb">
                      <img
                        src={cover}
                        alt={listing.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_ITEM_PLACEHOLDER
                        }}
                      />
                      <span className={`status-pill ${isAvailable ? 'status-available' : 'status-sold'}`}>
                        {isAvailable ? 'Available' : listing.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="profile-item-body">
                      <div className="profile-item-meta">
                        <span className="category-tag-mini">
                          {category?.name || category?.label || 'Campus Item'}
                        </span>
                        <span className="item-posted-time">{listing.condition}</span>
                      </div>

                      <h3 className="profile-item-title">
                        <Link to={`/listings/${listing.id}`}>{listing.title}</Link>
                      </h3>

                      <div className="profile-item-price">
                        <strong>₦ {Number(listing.price).toLocaleString()}</strong>
                      </div>

                      <div className="profile-item-location inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{listing.meeting_location?.name || listing.location || 'NSUK Campus, Keffi'}</span>
                      </div>

                      <div className="profile-item-actions">
                        <Link
                          to={`/listings/${listing.id}/edit`}
                          className="btn btn-outline btn-sm inline-flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm inline-flex items-center gap-1"
                          onClick={() => handleToggleStatus(listing)}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isAvailable ? 'Mark Sold' : 'Mark Available'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-danger inline-flex items-center gap-1"
                          onClick={() => handleDeleteListing(listing.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-icon-wrap">
                <Camera className="w-8 h-8 text-slate-400" />
              </div>
              <h3>You haven't posted any items yet</h3>
              <p>Turn unused textbooks, gadgets, or dorm items into cash.</p>
              <Link to="/listings/new" className="btn btn-primary inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>List an Item on Campus</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Saved Wishlist */}
      {activeTab === 'saved' && (
        <div className="profile-tab-content">
          <div className="tab-summary-row">
            <p className="tab-stats-text">
              You have <strong>{savedListings.length}</strong> items saved to your favourites.
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">Loading saved items...</div>
          ) : savedListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {savedListings.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl border p-4 shadow-xs">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    <Link to={`/listings/${item.id}`}>{item.title}</Link>
                  </h4>
                  <p className="text-xs font-bold text-emerald-600 mb-3">₦ {Number(item.price).toLocaleString()}</p>
                  <Link
                    to={`/listings/${item.id}`}
                    className="inline-block px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-xs font-bold rounded-lg"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-icon-wrap">
                <Heart className="w-8 h-8 text-slate-400" />
              </div>
              <h3>No saved items yet</h3>
              <p>Tap the heart icon on any listing while browsing to save it for later.</p>
              <Link to="/" className="btn btn-primary">
                Explore Marketplace
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Settings */}
      {activeTab === 'settings' && (
        <div className="profile-tab-content max-w-xl">
          {profileSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">Student Information</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Faculty / Department
              </label>
              <input
                type="text"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="e.g. Faculty of Computer Science & Multimedia"
                className="input-control"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Year of Study
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. Year 2, Semester 2"
                className="input-control"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone (WhatsApp for Meetup)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+60 11-XXXX XXXX"
                className="input-control"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Short Bio / Student Note
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell fellow students what you typically sell or buy on campus..."
                className="input-control"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
            >
              {isSavingProfile ? 'Saving...' : 'Update Student Profile'}
            </button>
          </form>

          {/* PDPA Privacy & Account Lifecycle (FR-PRO-05, NFR-05) */}
          <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border space-y-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Privacy & PDPA Rights (Malaysia PDPA 2010)
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                You have the full right to export a complete machine-readable copy of your personal data or request immediate account anonymization.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const blob = await (await import('../lib/api')).exportMyData()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `my_campus_marketplace_data_${Date.now()}.json`
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                  } catch (err: any) {
                    alert('Export failed: ' + (err.message || 'Unknown error'))
                  }
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-slate-600" /> Export My Data (JSON)
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete your account? Your personal data will be anonymized, active listings removed, and sessions revoked per university PDPA policies.')) {
                    try {
                      await (await import('../lib/api')).deleteMyAccount()
                      await logout()
                      navigate('/')
                    } catch (err: any) {
                      alert('Account deletion failed: ' + (err.message || 'Unknown error'))
                    }
                  }
                }}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-red-600" /> Delete & Anonymize Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

