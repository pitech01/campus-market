import type { Listing } from '../types'
import ListingCard from './ListingCard'
import Icon from './Icon'

interface ListingGridProps {
  listings: Listing[]
  onClearFilters: () => void
  isLoading?: boolean
  query?: string
}

export default function ListingGrid({
  listings,
  onClearFilters,
  isLoading = false,
  query,
}: ListingGridProps) {
  if (isLoading) {
    return (
      <div className="listing-empty-state" style={{ minHeight: '320px' }}>
        <div className="empty-icon-wrap" style={{ animation: 'spin 1s linear infinite' }}>
          <Icon name="icon-search" />
        </div>
        <h3>Searching campus marketplace...</h3>
        <p>Fetching matching textbooks, gadgets, and essentials.</p>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="listing-empty-state">
        <div className="empty-icon-wrap">
          <Icon name="icon-search" />
        </div>
        <h3>{query ? `No matching listings for "${query}"` : 'No matching listings found'}</h3>
        <p>Try searching for a different keyword, category, campus spot, or reset your filters.</p>
        <button type="button" className="btn btn-primary" onClick={onClearFilters}>
          Clear all filters
        </button>
      </div>
    )
  }

  return (
    <section className="listings" id="browse">
      <div className="listing-grid">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  )
}
