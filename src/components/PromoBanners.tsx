import type { CategoryId } from '../types'

interface PromoBannersProps {
  onSelect: (category: CategoryId) => void
}

const PROMOS = [
  {
    tag: 'Hurry, Semester Ending',
    title: 'Textbook Rush',
    sub: 'Save up to 70% off retail',
    category: 'textbooks' as CategoryId,
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=700&auto=format&fit=crop&q=80',
  },
  {
    tag: 'Trending This Week',
    title: 'Tech & Gadget Deals',
    sub: 'Laptops, calculators, chargers',
    category: 'electronics' as CategoryId,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700&auto=format&fit=crop&q=80',
  },
  {
    tag: 'Move-In Ready',
    title: 'Dorm Essentials',
    sub: 'Furniture, fridges & more',
    category: 'furniture' as CategoryId,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&auto=format&fit=crop&q=80',
  },
]

export default function PromoBanners({ onSelect }: PromoBannersProps) {
  return (
    <section className="promo-banners">
      <div className="container">
        <div className="promo-grid">
          {PROMOS.map((p) => (
            <button
              key={p.title}
              type="button"
              className="promo-card"
              onClick={() => onSelect(p.category)}
              style={{ backgroundImage: `url(${p.image})` }}
            >
              <span className="promo-card-overlay" />
              <span className="promo-card-body">
                <span className="promo-tag">{p.tag}</span>
                <strong>{p.title}</strong>
                <span className="promo-sub">{p.sub}</span>
                <span className="btn btn-primary btn-sm promo-cta">Shop Now</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
