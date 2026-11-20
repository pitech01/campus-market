import { useMemo, useState, useEffect } from 'react'
import Hero from '../components/Hero'
import CategoryShowcase from '../components/CategoryShowcase'
import ProductSpotlight from '../components/ProductSpotlight'
import ServiceBadges from '../components/ServiceBadges'
import PromoBanners from '../components/PromoBanners'
import CategoryChips from '../components/CategoryChips'
import FilterBar, { type SortOption } from '../components/FilterBar'
import ListingGrid from '../components/ListingGrid'
import BestItemsTabs from '../components/BestItemsTabs'
import VideoBanner from '../components/VideoBanner'
import TopRatedSplit from '../components/TopRatedSplit'
import TrustSection from '../components/TrustSection'
import CampusTips from '../components/CampusTips'
import NewsletterBar from '../components/NewsletterBar'
import Icon from '../components/Icon'
import { Link } from 'react-router-dom'
import { mockListings } from '../data/mockListings'
import { getListings } from '../lib/api'
import type { CategoryId, ItemCondition, Listing } from '../types'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [selectedCondition, setSelectedCondition] = useState<ItemCondition | 'all'>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [liveListings, setLiveListings] = useState<Listing[]>([])

  useEffect(() => {
    getListings()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setLiveListings(res.data)
        }
      })
      .catch(() => {})
  }, [])

  // Combine live database items with fallback mock listings
  const allListings = useMemo(() => {
    if (liveListings.length === 0) return mockListings
    return [...liveListings, ...mockListings]
  }, [liveListings])

  // Extract unique campus locations
  const locations = useMemo(() => {
    const locSet = new Set<string>()
    allListings.forEach((item) => {
      const locStr = item.meeting_location?.name || item.location || 'Lincoln Campus'
      const primaryLoc = locStr.split('/')[0].trim()
      locSet.add(primaryLoc)
    })
    return Array.from(locSet)
  }, [allListings])

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allListings.length }
    allListings.forEach((item) => {
      const catKey = (typeof item.category === 'object' && item.category !== null) 
        ? (item.category as any).slug 
        : item.category
      counts[catKey] = (counts[catKey] || 0) + 1
    })
    return counts
  }, [allListings])

  // Filter & Sort logic
  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    let results = allListings.filter((listing) => {
      // Category filter
      const catKey = (typeof listing.category === 'object' && listing.category !== null) 
        ? (listing.category as any).slug 
        : listing.category
      const matchesCategory =
        activeCategory === 'all' || catKey === activeCategory

      // Search query filter (title, description, tags)
      const matchesQuery =
        normalizedQuery.length === 0 ||
        listing.title.toLowerCase().includes(normalizedQuery) ||
        listing.description.toLowerCase().includes(normalizedQuery) ||
        (listing.tags && listing.tags.some((t) => t.toLowerCase().includes(normalizedQuery)))

      // Condition filter
      const matchesCondition =
        selectedCondition === 'all' || listing.condition === selectedCondition

      // Location filter
      const locStr = listing.meeting_location?.name || listing.location || ''
      const matchesLocation =
        selectedLocation === 'all' ||
        locStr.toLowerCase().includes(selectedLocation.toLowerCase())

      return matchesCategory && matchesQuery && matchesCondition && matchesLocation
    })

    // Sorting
    results = [...results].sort((a, b) => {
      if (sortOption === 'price-asc') {
        return a.price - b.price
      }
      if (sortOption === 'price-desc') {
        return b.price - a.price
      }
      if (sortOption === 'popular') {
        return (b.likesCount || 0) - (a.likesCount || 0)
      }
      // default: newest
      return 0
    })

    return results
  }, [query, activeCategory, selectedCondition, selectedLocation, sortOption])

  const hasActiveFilters =
    query.trim().length > 0 ||
    activeCategory !== 'all' ||
    selectedCondition !== 'all' ||
    selectedLocation !== 'all'

  const clearAllFilters = () => {
    setQuery('')
    setActiveCategory('all')
    setSelectedCondition('all')
    setSelectedLocation('all')
    setSortOption('newest')
  }

  const handleTrendingClick = (tag: string) => {
    setQuery(tag)
    const browseElement = document.getElementById('browse-section')
    if (browseElement) {
      browseElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleCategoryJump = (category: CategoryId) => {
    setActiveCategory(category)
    const browseElement = document.getElementById('browse-section')
    if (browseElement) {
      browseElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <Hero
        query={query}
        onQueryChange={setQuery}
        onTrendingClick={handleTrendingClick}
      />

      <CategoryShowcase onSelect={handleCategoryJump} />

      <ProductSpotlight listings={mockListings.slice(0, 8)} />

      <ServiceBadges />

      <PromoBanners onSelect={handleCategoryJump} />

      <div className="main-browse-wrapper" id="browse-section">
        <div className="container">
          <div className="section-heading-center">
            <span className="section-eyebrow">Everything On Campus</span>
            <h2>
              Browse All <span className="text-primary">Listings</span>
            </h2>
          </div>

          <CategoryChips
            active={activeCategory}
            onChange={setActiveCategory}
            categoryCounts={categoryCounts}
          />

          <FilterBar
            sortOption={sortOption}
            onSortChange={setSortOption}
            selectedCondition={selectedCondition}
            onConditionChange={setSelectedCondition}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            locations={locations}
            totalResults={filteredListings.length}
            hasActiveFilters={hasActiveFilters}
            onReset={clearAllFilters}
          />

          <ListingGrid
            listings={filteredListings}
            onClearFilters={clearAllFilters}
          />
        </div>
      </div>

      <section className="cta-banner">
        <div className="cta-banner-inner">
          <div className="cta-content">
            <span className="cta-pill">LUC Student Exclusives</span>
            <h2>Got textbooks or dorm gear sitting idle?</h2>
            <p>List it on Nussy in under 60 seconds — keep 100% of your earnings with zero fees.</p>
          </div>
          <Link to="/listings/new" className="btn btn-cta">
            <Icon name="icon-plus" />
            <span>List an Item Free</span>
          </Link>
        </div>
      </section>

      <BestItemsTabs listings={mockListings} />

      <VideoBanner />

      <TopRatedSplit listings={mockListings} />

      <TrustSection />

      <CampusTips />

      <NewsletterBar />
    </>
  )
}
