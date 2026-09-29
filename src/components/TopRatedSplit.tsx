import { useMemo } from 'react'
import type { Listing } from '../types'
import ListingCard from './ListingCard'

interface TopRatedSplitProps {
  listings: Listing[]
}

export default function TopRatedSplit({ listings }: TopRatedSplitProps) {
  const topRated = useMemo(
    () => [...listings].sort((a, b) => (b.sellerRating || 5.0) - (a.sellerRating || 5.0)).slice(0, 4),
    [listings]
  )

  return (
    <section className="top-rated-section">
      <div className="container">
        <div className="section-heading-center">
          <span className="section-eyebrow">Trusted By Classmates</span>
          <h2>
            Top Rated <span className="text-primary">Sellers</span>
          </h2>
        </div>

        <div className="top-rated-layout">
          <div
            className="top-rated-portrait"
            style={{
              backgroundImage:
                "url('/images/students/top-seller-student.jpg')",
            }}
          />
          <div className="top-rated-grid">
            {topRated.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
