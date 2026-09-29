import type { ItemCondition } from '../types'
import Icon from './Icon'

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular'

interface FilterBarProps {
  sortOption: SortOption
  onSortChange: (sort: SortOption) => void
  selectedCondition: ItemCondition | 'all'
  onConditionChange: (condition: ItemCondition | 'all') => void
  selectedLocation: string
  onLocationChange: (loc: string) => void
  locations: string[]
  totalResults: number
  hasActiveFilters: boolean
  onReset: () => void
}

const CONDITIONS: (ItemCondition | 'all')[] = [
  'all',
  'Brand New',
  'Like New',
  'Good Condition',
]

export default function FilterBar({
  sortOption,
  onSortChange,
  selectedCondition,
  onConditionChange,
  selectedLocation,
  onLocationChange,
  locations,
  totalResults,
  hasActiveFilters,
  onReset,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-bar-header">
        <div className="filter-results-info">
          <span className="results-count-bold">{totalResults}</span>
          <span className="results-count-label">
            {totalResults === 1 ? 'item found' : 'items found'}
          </span>
          {hasActiveFilters && (
            <button type="button" className="btn-filter-reset" onClick={onReset}>
              <Icon name="icon-close" />
              <span>Reset filters</span>
            </button>
          )}
        </div>

        <div className="filter-controls-group">
          {/* Location selector */}
          <div className="filter-select-wrapper">
            <Icon name="icon-map-pin" className="select-icon" />
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              aria-label="Filter by Campus Spot"
              className="filter-select"
            >
              <option value="all">All Campus Spots</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="filter-select-wrapper">
            <Icon name="icon-sliders" className="select-icon" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sort listings"
              className="filter-select"
            >
              <option value="newest">Latest Drops</option>
              <option value="popular">Most Liked</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Condition Pills */}
      <div className="condition-pills-row">
        <span className="condition-label">Condition:</span>
        <div className="condition-pills">
          {CONDITIONS.map((cond) => (
            <button
              key={cond}
              type="button"
              className={`condition-pill ${selectedCondition === cond ? 'is-active' : ''}`}
              onClick={() => onConditionChange(cond)}
            >
              {cond === 'all' ? 'Any Condition' : cond}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
