import React from 'react';
import { RotateCcw } from 'lucide-react';

export const FilterBar = ({
  typeFilter,
  savedOnly = false,
  categoryFilter,
  setCategoryFilter,
  workModeFilter,
  setWorkModeFilter,
  degreeFilter,
  setDegreeFilter,
  sortFilter,
  setSortFilter,
  onResetFilters,
  totalResults = 0
}) => {
  const categories = [
    'All',
    'Computer Science & Tech',
    'Engineering & Robotics',
    'Business & Finance',
    'Medicine & Healthcare',
    'Sciences & Mathematics',
    'Social Sciences & Law',
    'General & Interdisciplinary'
  ];

  const workModes = ['All', 'Remote', 'On-site', 'Hybrid'];
  const degreeLevels = ['All', 'Undergraduate', 'Postgraduate / Master', 'PhD / Doctoral'];
  const sortOptions = [
    { value: 'newest', label: 'Newest Added' },
    { value: 'deadline', label: 'Deadline: Closing Soon' },
    { value: 'popular', label: 'Most Viewed' },
    { value: 'title', label: 'Alphabetical (A-Z)' },
  ];

  const hasActiveFilters = 
    typeFilter !== 'All' ||
    savedOnly ||
    categoryFilter !== 'All' || 
    workModeFilter !== 'All' || 
    degreeFilter !== 'All' || 
    sortFilter !== 'newest';

  return (
    <div className="filter-card">
      
      <div className="filter-top-row">
        <div className="filter-count-badge">
          Showing <strong style={{ color: '#C26D38' }}>{totalResults}</strong> {totalResults === 1 ? 'opportunity' : 'opportunities'}
        </div>
        {hasActiveFilters && (
          <button type="button" onClick={onResetFilters} className="filter-reset-btn">
            <RotateCcw style={{ width: 14, height: 14 }} />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      <div className="filter-selects-grid">
        
        {/* 1. Category */}
        <div>
          <label className="filter-select-label">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Work Mode / Location */}
        <div>
          <label className="filter-select-label">
            Work Mode / Location
          </label>
          <select
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value)}
            className="filter-select"
          >
            {workModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode === 'All' ? 'All Locations & Modes' : mode}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Degree Level */}
        <div>
          <label className="filter-select-label">
            Degree Level
          </label>
          <select
            value={degreeFilter}
            onChange={(e) => setDegreeFilter(e.target.value)}
            className="filter-select"
          >
            {degreeLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === 'All' ? 'All Degree Levels' : lvl}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Sort By */}
        <div>
          <label className="filter-select-label">
            Sort By
          </label>
          <select
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value)}
            className="filter-select"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

      </div>

    </div>
  );
};

export default FilterBar;
