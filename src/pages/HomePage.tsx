import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
import { mockListings } from '../data/mockListings'
import { getListings } from '../lib/api'
import type { CategoryId, ItemCondition, Listing } from '../types'

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize from URL params
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>(() => {
    const cat = searchParams.get('category')
    return (cat as CategoryId) || 'all'
  })
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const s = searchParams.get('sort')
    return (s as SortOption) || 'newest'
  })
  const [selectedCondition, setSelectedCondition] = useState<ItemCondition | 'all'>(() => {
    const c = searchParams.get('condition')
    return (c as ItemCondition) || 'all'
  })
  const [selectedLocation, setSelectedLocation] = useState<string>(
    () => searchParams.get('location') || 'all'
  )

  const [liveListings, setLiveListings] = useState<Listing[]>([])
  const [hasLiveBackend, setHasLiveBackend] = useState<boolean | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const isInitialMount = useRef(true)

  // Scroll smoothly to browse section
  const scrollToBrowse = useCallback(() => {
    const browseElement = document.getElementById('browse-section')
    if (browseElement) {
      browseElement.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  // Sync state if URL changes externally (e.g. Navbar search or back/forward navigation)
  useEffect(() => {
    const urlQ = searchParams.get('q') || ''
    const urlCat = (searchParams.get('category') as CategoryId) || 'all'
    const urlSort = (searchParams.get('sort') as SortOption) || 'newest'
    const urlCond = (searchParams.get('condition') as ItemCondition) || 'all'
    const urlLoc = searchParams.get('location') || 'all'

    if (urlQ !== query) setQuery(urlQ)
    if (urlCat !== activeCategory) setActiveCategory(urlCat)
    if (urlSort !== sortOption) setSortOption(urlSort)
    if (urlCond !== selectedCondition) setSelectedCondition(urlCond)
    if (urlLoc !== selectedLocation) setSelectedLocation(urlLoc)
  }, [searchParams])

  // Update URL search parameters when filters change
  const updateUrlParams = useCallback(
    (newParams: {
      q?: string
      category?: string
      sort?: string
      condition?: string
      location?: string
    }) => {
      const next = new URLSearchParams()
      const effectiveQ = newParams.q !== undefined ? newParams.q : query
      const effectiveCat = newParams.category !== undefined ? newParams.category : activeCategory
      const effectiveSort = newParams.sort !== undefined ? newParams.sort : sortOption
      const effectiveCond = newParams.condition !== undefined ? newParams.condition : selectedCondition
      const effectiveLoc = newParams.location !== undefined ? newParams.location : selectedLocation

      if (effectiveQ.trim()) next.set('q', effectiveQ.trim())
      if (effectiveCat && effectiveCat !== 'all') next.set('category', effectiveCat)
      if (effectiveSort && effectiveSort !== 'newest') next.set('sort', effectiveSort)
      if (effectiveCond && effectiveCond !== 'all') next.set('condition', effectiveCond)
      if (effectiveLoc && effectiveLoc !== 'all') next.set('location', effectiveLoc)

      setSearchParams(next, { replace: true })
    },
    [query, activeCategory, sortOption, selectedCondition, selectedLocation, setSearchParams]
  )

  // Handlers for user interactions
  const handleQueryChange = (val: string) => {
    setQuery(val)
    updateUrlParams({ q: val })
  }

  const handleCategoryChange = (cat: CategoryId | 'all') => {
    setActiveCategory(cat)
    updateUrlParams({ category: cat })
  }

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort)
    updateUrlParams({ sort })
  }

  const handleConditionChange = (cond: ItemCondition | 'all') => {
    setSelectedCondition(cond)
    updateUrlParams({ condition: cond })
  }

  const handleLocationChange = (loc: string) => {
    setSelectedLocation(loc)
    updateUrlParams({ location: loc })
  }

  // Fetch from API with debounced keyword search
  useEffect(() => {
    let isCancelled = false
    setIsSearching(true)

    const timer = setTimeout(
      () => {
        getListings({
          q: query.trim() || undefined,
          category: activeCategory !== 'all' ? activeCategory : undefined,
          condition: selectedCondition !== 'all' ? selectedCondition : undefined,
          location: selectedLocation !== 'all' ? selectedLocation : undefined,
          sort_by: sortOption,
          per_page: 50,
        })
          .then((res) => {
            if (!isCancelled) {
              setLiveListings(res.data || [])
              setHasLiveBackend(true)
            }
          })
          .catch(() => {
            if (!isCancelled) {
              // Mark backend unavailable so client-side fallback engages
              setHasLiveBackend(false)
            }
          })
          .finally(() => {
            if (!isCancelled) {
              setIsSearching(false)
            }
          })
      },
      isInitialMount.current ? 0 : 250
    )

    isInitialMount.current = false

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [query, activeCategory, selectedCondition, selectedLocation, sortOption])

  // Handle URL hash on initial load (e.g. #browse-section or #browse)
  useEffect(() => {
    if (window.location.hash === '#browse-section' || window.location.hash === '#browse') {
      setTimeout(scrollToBrowse, 150)
    }
  }, [scrollToBrowse])

  // Determine current active listings
  const filteredListings = useMemo(() => {
    // If backend is active, use the server-filtered results
    if (hasLiveBackend === true) {
      return liveListings
    }

    // Fallback: client-side filtering on mockListings (offline or mock mode)
    const normalizedQuery = query.trim().toLowerCase()

    let results = mockListings.filter((listing) => {
      // Category filter
      const catKey =
        typeof listing.category === 'object' && listing.category !== null
          ? (listing.category as any).slug || (listing.category as any).name || ''
          : listing.category || ''
      const matchesCategory =
        activeCategory === 'all' || catKey === activeCategory

      // Search query filter (title, description, tags, seller, location, exchange)
      const title = (listing.title || '').toLowerCase()
      const desc = (listing.description || '').toLowerCase()
      const exchange = (listing.exchange_wanted || '').toLowerCase()
      const seller = (listing.sellerName || (listing as any).seller?.name || '').toLowerCase()
      const locStr = (listing.meeting_location?.name || listing.location || '').toLowerCase()
      const tags = Array.isArray(listing.tags) ? listing.tags : []

      const matchesQuery =
        normalizedQuery.length === 0 ||
        title.includes(normalizedQuery) ||
        desc.includes(normalizedQuery) ||
        exchange.includes(normalizedQuery) ||
        seller.includes(normalizedQuery) ||
        locStr.includes(normalizedQuery) ||
        catKey.toLowerCase().includes(normalizedQuery) ||
        tags.some((t) => t.toLowerCase().includes(normalizedQuery))

      // Condition filter
      const matchesCondition =
        selectedCondition === 'all' || listing.condition === selectedCondition

      // Location filter
      const matchesLocation =
        selectedLocation === 'all' || locStr.includes(selectedLocation.toLowerCase())

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
      return 0
    })

    return results
  }, [hasLiveBackend, liveListings, query, activeCategory, selectedCondition, selectedLocation, sortOption])

  // Extract campus locations from current listings
  const locations = useMemo(() => {
    const locSet = new Set<string>()
    const source = liveListings.length > 0 ? liveListings : mockListings
    source.forEach((item) => {
      const locStr = item.meeting_location?.name || item.location || 'Lincoln Campus, Nasarawa'
      const primaryLoc = locStr.split('/')[0].trim()
      if (primaryLoc) locSet.add(primaryLoc)
    })
    return Array.from(locSet)
  }, [liveListings])

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: filteredListings.length }
    filteredListings.forEach((item) => {
      const catKey =
        typeof item.category === 'object' && item.category !== null
          ? (item.category as any).slug || (item.category as any).name || 'other'
          : item.category || 'other'
      counts[catKey] = (counts[catKey] || 0) + 1
    })
    return counts
  }, [filteredListings])

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
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const handleTrendingClick = (tag: string) => {
    setQuery(tag)
    updateUrlParams({ q: tag })
    scrollToBrowse()
  }

  const handleCategoryJump = (category: CategoryId) => {
    setActiveCategory(category)
    updateUrlParams({ category })
    scrollToBrowse()
  }

  return (
    <>
      <Hero
        query={query}
        onQueryChange={handleQueryChange}
        onTrendingClick={handleTrendingClick}
        onSearchSubmit={scrollToBrowse}
      />

      <CategoryShowcase onSelect={handleCategoryJump} />

      <ProductSpotlight
        listings={(liveListings.length > 0 ? liveListings : mockListings).slice(0, 8)}
      />

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
            onChange={handleCategoryChange}
            categoryCounts={categoryCounts}
          />

          <FilterBar
            query={query}
            onQueryChange={handleQueryChange}
            sortOption={sortOption}
            onSortChange={handleSortChange}
            selectedCondition={selectedCondition}
            onConditionChange={handleConditionChange}
            selectedLocation={selectedLocation}
            onLocationChange={handleLocationChange}
            locations={locations}
            totalResults={filteredListings.length}
            hasActiveFilters={hasActiveFilters}
            onReset={clearAllFilters}
          />

          <ListingGrid
            listings={filteredListings}
            onClearFilters={clearAllFilters}
            isLoading={isSearching}
            query={query}
          />
        </div>
      </div>

      <section className="cta-banner">
        <div className="cta-banner-inner">
          <div className="cta-content">
            <span className="cta-pill">Lincoln Student Exclusives</span>
            <h2>Got textbooks or dorm gear sitting idle?</h2>
            <p>List it on Nussy in under 60 seconds — earn 80% per sale directly into your seller wallet.</p>
          </div>
          <Link to="/listings/new" className="btn btn-cta">
            <Icon name="icon-plus" />
            <span>List an Item Free</span>
          </Link>
        </div>
      </section>

      <BestItemsTabs listings={liveListings.length > 0 ? liveListings : mockListings} />

      <VideoBanner />

      <TopRatedSplit listings={liveListings.length > 0 ? liveListings : mockListings} />

      <TrustSection />

      <CampusTips />

      <NewsletterBar />
    </>
  )
}
