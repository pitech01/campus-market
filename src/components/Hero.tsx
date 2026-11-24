import { useState } from 'react'
import Icon from './Icon'

interface HeroProps {
  query: string
  onQueryChange: (value: string) => void
  onTrendingClick: (tag: string) => void
  onSearchSubmit?: () => void
}

const TRENDING_TAGS = [
  'Calculus 8th',
  'Mini Fridge',
  'TI-84 Plus',
  'Sony Headphones',
  'Study Desk',
  'iPad Air',
]

const HERO_SLIDES = [
  {
    eyebrow: 'NSUK Student Exclusives',
    title: 'Buy, Sell & Swap on Campus.',
    highlight: 'Zero Fees.',
    image: '/images/nsuk-gate-hd.jpg',
  },
  {
    eyebrow: 'NSUK Senate & Safe Meetups',
    title: 'Safe Handover Meetup Spots.',
    highlight: 'Across Keffi Campus.',
    image: '/images/nsuk-senate-building.jpg',
  },
  {
    eyebrow: 'NSUK Official Marketplace',
    title: 'Connect with Coursemates.',
    highlight: 'In Minutes.',
    image: '/images/nsuk-official-hero-1.jpg',
  },
]

export default function Hero({ query, onQueryChange, onTrendingClick, onSearchSubmit }: HeroProps) {
  const [slide, setSlide] = useState(0)
  const active = HERO_SLIDES[slide]

  const goPrev = () => setSlide((s) => (s === 0 ? HERO_SLIDES.length - 1 : s - 1))
  const goNext = () => setSlide((s) => (s === HERO_SLIDES.length - 1 ? 0 : s + 1))

  return (
    <section className="hero" id="top">
      <div className="hero-inner">
        <div className="hero-content">
          <div className="hero-eyebrow-pill">
            <span className="hero-pulse-dot" />
            <span>{active.eyebrow}</span>
          </div>

          <h1 className="hero-title">
            {active.title} <span className="hero-highlight">{active.highlight}</span>
          </h1>

          <p className="hero-sub">
            The verified marketplace for Nasarawa State University Keffi (NSUK) students. Grab textbooks, dorm gear, electronics
            and fashion from coursemates next door — meet up safely at Angwan Lambu, Central Library, or Main Gate in minutes.
          </p>

          <form
            className="search-bar"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              if (onSearchSubmit) {
                onSearchSubmit()
              }
            }}
          >
            <Icon name="icon-search" className="search-icon" />
            <input
              type="search"
              placeholder="Search by course code, item name, dorm gear…"
              aria-label="Search listings"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => onQueryChange('')}
                aria-label="Clear search"
              >
                <Icon name="icon-close" />
              </button>
            )}
            <button type="submit" className="btn btn-primary search-btn">
              Search
            </button>
          </form>

          <div className="hero-trending">
            <span className="trending-label">Trending on campus:</span>
            <div className="trending-chips">
              {TRENDING_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="trending-chip"
                  onClick={() => onTrendingClick(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-frame">
            <img src={active.image} alt="" className="hero-visual-img" />
            <button
              type="button"
              className="hero-nav-arrow hero-nav-prev"
              onClick={goPrev}
              aria-label="Previous slide"
            >
              <Icon name="icon-arrow-left" />
            </button>
            <button
              type="button"
              className="hero-nav-arrow hero-nav-next"
              onClick={goNext}
              aria-label="Next slide"
            >
              <Icon name="icon-arrow-right" />
            </button>

            <div className="hero-floating-card">
              <div className="hero-floating-icon">
                <Icon name="icon-map-pin" />
              </div>
              <div>
                <strong>5-min meetups</strong>
                <span>Right on campus</span>
              </div>
            </div>
          </div>

          <div className="hero-dots">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.title}
                type="button"
                className={`hero-dot ${i === slide ? 'is-active' : ''}`}
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="hero-stats-row">
        <div className="hero-stat-card">
          <Icon name="icon-shield" className="hero-stat-icon text-primary" />
          <div className="hero-stat-text">
            <strong>Verified Students</strong>
            <span>NSUK Student ID check</span>
          </div>
        </div>
        <div className="hero-stat-card">
          <Icon name="icon-tag" className="hero-stat-icon text-primary" />
          <div className="hero-stat-text">
            <strong>0% Platform Commission</strong>
            <span>Direct peer-to-peer deals</span>
          </div>
        </div>
        <div className="hero-stat-card">
          <Icon name="icon-map-pin" className="hero-stat-icon text-primary" />
          <div className="hero-stat-text">
            <strong>Hostel &amp; Library Meetups</strong>
            <span>Safe campus handovers</span>
          </div>
        </div>
      </div>
    </section>
  )
}
