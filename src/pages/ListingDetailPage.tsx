import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  Eye,
  ArrowLeftRight,
  Zap,
  Flag,
  ArrowLeft,
  Search,
  CheckCircle2,
  Tag,
  Star,
  Shield,
  MessageSquare,
  Sparkles,
  Heart,
  Edit,
  Lock,
} from 'lucide-react'
import { getListing, toggleFavorite, resolveImageUrl, DEFAULT_ITEM_PLACEHOLDER } from '../lib/api'
import { getListingById } from '../lib/listings'
import { useAuth } from '../lib/authContext'
import ChatDrawer from '../components/chat/ChatDrawer'
import ReportModal from '../components/ReportModal'
import PaystackPaymentModal from '../components/PaystackPaymentModal'
import type { Listing } from '../types'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [paystackModalOpen, setPaystackModalOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    // If ID is a local mock ID (e.g. 'l1', 'l2', 'l3'), load directly from mock data to avoid unnecessary 404 network requests
    if (typeof id === 'string' && /^l\d+$/i.test(id)) {
      const mock = getListingById(id)
      if (mock) {
        setListing(mock)
        setIsFavorited(false)
        setIsLoading(false)
        return
      }
    }

    setIsLoading(true)
    getListing(id)
      .then((data) => {
        setListing(data)
        setIsFavorited(Boolean(data.is_favorited))
      })
      .catch(() => {
        // Fallback to local mock data
        const mock = getListingById(id)
        if (mock) {
          setListing(mock)
        }
      })
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3" />
        <p>Loading campus listing details...</p>
      </div>
    )
  }

  if (!listing) {
    return (
      <section className="state-page">
        <div className="state-icon-box">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <h1>Listing not found</h1>
        <p>This listing may have been removed, completed, or the link is invalid.</p>
        <Link to="/" className="btn btn-primary">
          Back to marketplace
        </Link>
      </section>
    )
  }

  const rawImages = listing.images && (listing.images as any).length > 0 ? listing.images : []
  const images: string[] = rawImages
    .map((img: any) => resolveImageUrl(typeof img === 'string' ? img : img.url || ''))
    .filter(Boolean)
  if (images.length === 0) {
    images.push(DEFAULT_ITEM_PLACEHOLDER)
  }

  const isMine =
    (user && (Number(listing.seller_id) === Number(user.id) || Number((listing as any).seller?.id) === Number(user.id))) ||
    listing.sellerName === 'You'

  const sellerName = (listing as any).seller?.name || listing.sellerName || 'NSUK Student'
  const sellerInitial = (listing as any).seller?.name?.charAt(0) || listing.sellerInitial || 'S'
  const rawSellerAvatar = (listing as any).seller?.avatar_url || listing.sellerAvatar
  const sellerAvatar = rawSellerAvatar ? resolveImageUrl(rawSellerAvatar, '') : null
  const sellerRating = (listing as any).seller?.average_rating || listing.sellerRating || 5.0
  const sellerReviews = (listing as any).seller?.reviews_count || listing.sellerReviewsCount || 0
  const meetingSpotName = listing.meeting_location?.name || listing.location || 'NSUK Central Library / Senate Building Foyer'

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    try {
      const res = await toggleFavorite(listing.id)
      setIsFavorited(res.is_favorited)
      showNotification(res.is_favorited ? 'Saved to your favourites!' : 'Removed from favourites')
    } catch {
      setIsFavorited(!isFavorited)
    }
  }

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  return (
    <div className="listing-detail-container">
      {notification && (
        <div className="detail-toast">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{notification}</span>
        </div>
      )}

      <div className="detail-breadcrumbs">
        <Link to="/" className="back-link">
          <ArrowLeft className="w-4 h-4 back-icon" />
          <span>Back to Marketplace</span>
        </Link>
        <span className="breadcrumb-divider">/</span>
        <span className="breadcrumb-category">{(listing.category as any)?.name || 'Campus Item'}</span>
        <span className="breadcrumb-divider">/</span>
        <span className="breadcrumb-current">{listing.title}</span>
      </div>

      <div className="listing-detail-layout">
        {/* Left Column: Multi-image Gallery */}
        <div className="listing-gallery-section">
          <div className="gallery-main-frame">
            <img
              src={images[activeImageIndex] || images[0]}
              alt={listing.title}
              className="gallery-main-image"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_ITEM_PLACEHOLDER
              }}
            />

            <div className="gallery-floating-badges">
              {listing.status === 'sold' ? (
                <span className="status-pill status-sold">SOLD</span>
              ) : listing.status === 'reserved' ? (
                <span className="status-pill bg-amber-500 text-white font-bold">RESERVED</span>
              ) : (
                <span className="condition-tag-pill">{listing.condition || 'Good Condition'}</span>
              )}
            </div>

            <button
              type="button"
              className={`gallery-favorite-btn ${isFavorited ? 'is-favorited' : ''}`}
              onClick={handleFavoriteToggle}
              aria-label={isFavorited ? 'Remove from saved' : 'Save to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
            </button>
          </div>

          {images.length > 1 && (
            <div className="gallery-thumbs-row">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`gallery-thumb-btn ${idx === activeImageIndex ? 'is-active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img
                    src={img}
                    alt={`View ${idx + 1}`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_ITEM_PLACEHOLDER
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Listing Details & Actions */}
        <div className="listing-info-section">
          <div className="detail-category-row">
            <span className="detail-category-badge inline-flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              {(listing.category as any)?.name || 'Campus Item'}
            </span>
            <span className="detail-posted-time inline-flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{listing.views_count ? `${listing.views_count} views` : 'Active on Campus'}</span>
            </span>
          </div>

          <h1 className="detail-title">{listing.title}</h1>

          {/* Pricing & Listing Type Card */}
          <div className="detail-price-card">
            <div className="price-main-display">
              <span className="price-curr">{listing.currency === 'RM' ? 'RM' : '₦'}</span>
              <span className="price-val">{Number(listing.price).toLocaleString()}</span>
            </div>
            {listing.listing_type && listing.listing_type !== 'sell' && (
              <div className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Exchange Available: {listing.exchange_wanted || 'Open to student swaps'}</span>
              </div>
            )}
          </div>

          {/* Key Item Specs Grid */}
          <div className="detail-specs-grid">
            <div className="spec-card">
              <span className="spec-label">Condition</span>
              <strong className="spec-value text-primary">{listing.condition || 'Good Condition'}</strong>
            </div>
            <div className="spec-card">
              <span className="spec-label">Campus Location</span>
              <strong className="spec-value">{meetingSpotName}</strong>
            </div>
            <div className="spec-card">
              <span className="spec-label">Availability</span>
              <strong
                className={`spec-value ${
                  listing.status === 'active' || listing.status === 'available'
                    ? 'text-green'
                    : listing.status === 'reserved'
                    ? 'text-amber-500'
                    : 'text-muted'
                }`}
              >
                {listing.status === 'active' || listing.status === 'available'
                  ? 'Available'
                  : listing.status === 'reserved'
                  ? 'Reserved (Deal in Progress)'
                  : 'Sold Out'}
              </strong>
            </div>
          </div>

          {/* Description */}
          <div className="detail-description-block">
            <h3>Description & Item Notes</h3>
            <p className="whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Action CTAs */}
          <div className="detail-action-buttons">
            {isMine ? (
              <Link to={`/listings/${listing.id}/edit`} className="btn btn-primary btn-lg inline-flex items-center gap-2">
                <Edit className="w-4 h-4" />
                <span>Edit Listing Details</span>
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-lg inline-flex items-center gap-2"
                  disabled={listing.status === 'sold'}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
                      return
                    }
                    setChatDrawerOpen(true)
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat & Make Offer</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-lg inline-flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  disabled={listing.status === 'sold'}
                  onClick={() => setPaystackModalOpen(true)}
                >
                  <Lock className="w-4 h-4 text-red-600" />
                  <span>Pay with Paystack (Escrow)</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-lg inline-flex items-center gap-2"
                  disabled={listing.status === 'sold'}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
                      return
                    }
                    setChatDrawerOpen(true)
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Propose Deal</span>
                </button>
              </>
            )}
          </div>

          {/* Seller Profile & Campus Trust Card */}
          <div className="detail-seller-card">
            <div className="seller-card-header">
              {sellerAvatar ? (
                <img
                  src={sellerAvatar}
                  alt={sellerName}
                  className="seller-big-avatar"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <span className="avatar-initial large">{sellerInitial}</span>
              )}
              <div className="seller-card-info">
                <div className="seller-name-row">
                  <h4>{sellerName}</h4>
                  <span className="verified-student-pill inline-flex items-center gap-1" title="Verified Nasarawa State University Keffi Student">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified NSUK Student
                  </span>
                </div>
                <div className="seller-stats-line">
                  <span className="seller-stars inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <strong>{Number(sellerRating).toFixed(1)}</strong>
                    <span className="seller-reviews">({sellerReviews} campus reviews)</span>
                  </span>
                  <span className="seller-dot">·</span>
                  <span className="seller-response-speed inline-flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" /> Active Trader
                  </span>
                </div>
              </div>
            </div>
            <div className="seller-guarantee-note inline-flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Safe campus handover agreed at {meetingSpotName}</span>
            </div>

            {/* Direct Vendor / Seller Chat Action */}
            {!isMine && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
                      return
                    }
                    setChatDrawerOpen(true)
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with Vendor ({sellerName})</span>
                </button>
              </div>
            )}

            {/* Safety & Reporting Link (FR-MOD-01) */}
            {!isMine && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                <span>See something suspicious or prohibited?</span>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(true)}
                  className="font-semibold text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Listing</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety & Reporting Modal (FR-MOD-01) */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportableType="listing"
        reportableId={listing.id}
        targetTitle={listing.title}
        onReportSubmitted={() => showNotification('Thank you for keeping our campus marketplace safe.')}
      />

      {/* Chat & Deals Drawer */}
      <ChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        initialListing={listing}
      />

      {/* Paystack Escrow Payment Modal */}
      {paystackModalOpen && (
        <PaystackPaymentModal
          listing={listing}
          onClose={() => setPaystackModalOpen(false)}
        />
      )}
    </div>
  )
}

