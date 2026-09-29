import { categories } from '../data/categories'
import type { CategoryId } from '../types'
import Icon from './Icon'

interface CategoryChipsProps {
  active: CategoryId | 'all'
  onChange: (category: CategoryId | 'all') => void
  categoryCounts?: Record<string, number>
}

export default function CategoryChips({
  active,
  onChange,
  categoryCounts = {},
}: CategoryChipsProps) {
  return (
    <div className="category-section" id="categories">
      <div className="category-scroll-container">
        <button
          type="button"
          className={`chip ${active === 'all' ? 'is-active' : ''}`}
          onClick={() => onChange('all')}
        >
          <Icon name="icon-grid" />
          <span>All Items</span>
          {categoryCounts['all'] !== undefined && (
            <span className="chip-count">{categoryCounts['all']}</span>
          )}
        </button>

        {categories.map((cat) => {
          const isActive = active === cat.id
          const count = categoryCounts[cat.id]
          return (
            <button
              key={cat.id}
              type="button"
              className={`chip ${isActive ? 'is-active' : ''}`}
              onClick={() => onChange(cat.id as CategoryId)}
            >
              <Icon name={cat.icon} />
              <span>{cat.label}</span>
              {count !== undefined && count > 0 && (
                <span className="chip-count">{count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
