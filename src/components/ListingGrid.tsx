import type { Listing } from '../types'
import ListingCard from './ListingCard'
import Icon from './Icon'

interface ListingGridProps {
  listings: Listing[]
  onClearFilters: () => void
}

export default function ListingGrid({
  listings,
  onClearFilters,
}: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="listing-empty-state">
        <div className="empty-icon-wrap">
          <Icon name="icon-search" />
        </div>
        <h3>No matching listings found</h3>
        <p>Try searching for a different keyword, category, or reset your filters.</p>
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
