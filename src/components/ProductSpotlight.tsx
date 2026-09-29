import { useRef } from 'react'
import type { Listing } from '../types'
import ListingCard from './ListingCard'
import Icon from './Icon'

interface ProductSpotlightProps {
  listings: Listing[]
}

export default function ProductSpotlight({ listings }: ProductSpotlightProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollByAmount = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  if (listings.length === 0) return null

  return (
    <section className="spotlight-section">
      <div className="container">
        <div className="section-heading-row">
          <div className="section-heading-block">
            <span className="section-eyebrow">Fresh On Campus</span>
            <h2>
              Discover Our <span className="text-primary">Products</span>
            </h2>
          </div>
          <div className="spotlight-arrows">
            <button type="button" className="icon-btn" onClick={() => scrollByAmount(-1)} aria-label="Scroll left">
              <Icon name="icon-arrow-left" />
            </button>
            <button type="button" className="icon-btn" onClick={() => scrollByAmount(1)} aria-label="Scroll right">
              <Icon name="icon-arrow-right" />
            </button>
          </div>
        </div>

        <div className="spotlight-track" ref={trackRef}>
          {listings.map((listing) => (
            <div className="spotlight-item" key={listing.id}>
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
