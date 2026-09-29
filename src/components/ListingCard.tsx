import { Link } from 'react-router-dom'
import { categories } from '../data/categories'
import type { Listing } from '../types'
import Icon from './Icon'
import { useFavorites } from '../lib/favoritesContext'

const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

export default function ListingCard({ listing }: { listing: Listing }) {
  const category = categoryMap[listing.category as any] || (listing.category as any)
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorited = isFavorite(String(listing.id))

  const discountPercent =
    listing.originalPrice && listing.originalPrice > listing.price
      ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
      : null

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(String(listing.id))
  }

  const rawImages = listing.images && listing.images.length > 0 ? listing.images : []
  const firstImage = rawImages[0]
  const coverImage =
    typeof firstImage === 'string'
      ? firstImage
      : (firstImage as any)?.url ||
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'

  const sellerName = (listing as any).seller?.name || listing.sellerName || 'Student'
  const sellerInitial = (listing as any).seller?.name?.charAt(0) || listing.sellerInitial || 'S'
  const sellerAvatar = (listing as any).seller?.avatar_url || listing.sellerAvatar
  const sellerRating = (listing as any).seller?.average_rating || listing.sellerRating || 5.0
  const sellerReviews = (listing as any).seller?.reviews_count || listing.sellerReviewsCount || 0
  const locationText = listing.meeting_location?.name || listing.location || 'Lincoln Campus'

  return (
    <article className={`listing-card ${listing.status === 'sold' ? 'is-sold' : ''}`}>
      <div className="listing-card-media">
        <Link to={`/listings/${listing.id}`} className="listing-media-link" tabIndex={-1}>
          <img
            src={coverImage}
            alt={listing.title}
            loading="lazy"
            className="listing-card-img"
          />
        </Link>

        {/* Badges on image */}
        <div className="listing-media-badges">
          {listing.status === 'sold' ? (
            <span className="status-pill status-sold">SOLD</span>
          ) : listing.status === 'reserved' ? (
            <span className="status-pill bg-amber-500 text-white font-bold">RESERVED</span>
          ) : (
            <span className="condition-tag-pill">{listing.condition || 'Good Condition'}</span>
          )}

          {discountPercent && listing.status !== 'sold' && (
            <span className="discount-pill">-{discountPercent}%</span>
          )}
        </div>

        {/* Heart Wishlist Action */}
        <button
          type="button"
          className={`card-heart-btn ${favorited ? 'is-favorited' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favorited ? 'Remove from saved' : 'Save to favorites'}
        >
          <Icon name={favorited ? 'icon-heart-fill' : 'icon-heart'} />
        </button>

        {rawImages.length > 1 && (
          <span className="gallery-count-badge">
            <Icon name="icon-camera" />
            {rawImages.length}
          </span>
        )}
      </div>

      <div className="listing-card-body">
        <div className="listing-card-header">
          <span className="listing-category-label">
            <Icon name={category?.icon || 'icon-tag'} />
            {category?.name || category?.label || 'General'}
          </span>
          <span className="listing-posted-time">{listing.postedAt || 'Active'}</span>
        </div>

        <h3 className="listing-title">
          <Link to={`/listings/${listing.id}`}>{listing.title}</Link>
        </h3>

        <div className="listing-pricing-row">
          <div className="price-group">
            <span className="currency">{listing.currency === 'RM' ? 'RM' : '₦'}</span>
            <span className="price-amount">{Number(listing.price).toLocaleString()}</span>
          </div>
          {listing.originalPrice && listing.originalPrice > listing.price && (
            <span className="original-price">{listing.currency === 'RM' ? 'RM' : '₦'} {Number(listing.originalPrice).toLocaleString()}</span>
          )}
        </div>

        {/* Seller credibility row */}
        <div className="listing-seller-row">
          <div className="seller-profile">
            {sellerAvatar ? (
              <img
                src={sellerAvatar}
                alt={sellerName}
                className="seller-avatar-img"
              />
            ) : (
              <span className="avatar-initial">{sellerInitial}</span>
            )}
            <div className="seller-details">
              <span className="seller-name-text">
                {sellerName}
                <span className="verified-badge-inline" title="LUC Verified Student">
                  <Icon name="icon-check-circle" />
                </span>
              </span>
              <span className="seller-rating-line">
                <Icon name="icon-star" className="star-icon" />
                <span>{Number(sellerRating).toFixed(1)}</span>
                <span className="review-count">({sellerReviews})</span>
              </span>
            </div>
          </div>

          <div className="location-tag" title={locationText}>
            <Icon name="icon-map-pin" />
            <span>{locationText.split('/')[0].trim()}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
