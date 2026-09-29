import { useMemo, useState } from 'react'
import type { Listing } from '../types'
import ListingCard from './ListingCard'

interface BestItemsTabsProps {
  listings: Listing[]
}

type Range = 'week' | 'month' | 'year' | 'all'

const TABS: { id: Range; label: string }[] = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
]

export default function BestItemsTabs({ listings }: BestItemsTabsProps) {
  const [range, setRange] = useState<Range>('week')

  const items = useMemo(() => {
    const sorted = [...listings]
    if (range === 'week') sorted.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
    else if (range === 'month') sorted.sort((a, b) => (b.sellerRating || 5.0) - (a.sellerRating || 5.0))
    else if (range === 'year') sorted.sort((a, b) => b.price - a.price)
    else sorted.sort((a, b) => (b.sellerReviewsCount || 0) - (a.sellerReviewsCount || 0))
    return sorted.slice(0, 8)
  }, [listings, range])

  return (
    <section className="best-items-section">
      <div className="container">
        <div className="section-heading-row">
          <div className="section-heading-block">
            <span className="section-eyebrow">Handpicked For You</span>
            <h2>
              Shop By <span className="text-primary">Best Items</span>
            </h2>
          </div>
          <div className="best-items-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`range-tab ${range === tab.id ? 'is-active' : ''}`}
                onClick={() => setRange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="listing-grid">
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  )
}
