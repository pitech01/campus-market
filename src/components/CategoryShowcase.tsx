import { categories } from '../data/categories'
import type { CategoryId } from '../types'
import Icon from './Icon'

interface CategoryShowcaseProps {
  onSelect: (category: CategoryId) => void
}

export default function CategoryShowcase({ onSelect }: CategoryShowcaseProps) {
  return (
    <section className="category-showcase">
      <div className="container">
        <div className="section-heading-center">
          <span className="section-eyebrow">Browse The Campus</span>
          <h2>
            Popular By <span className="text-primary">Categories</span>
          </h2>
        </div>

        <div className="showcase-grid">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="showcase-card"
              onClick={() => onSelect(cat.id as CategoryId)}
              style={{ backgroundImage: `url(${cat.image})` }}
            >
              <span className="showcase-card-overlay" />
              <span className="showcase-badge">New Drops</span>
              <span className="showcase-card-body">
                <strong>{cat.label}</strong>
                <span>{cat.tagline}</span>
                <span className="showcase-shop-now">
                  Browse Now
                  <Icon name="icon-arrow-right" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
