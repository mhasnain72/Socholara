import React from 'react';
import { Search, Sparkles, X } from 'lucide-react';

export const HeroBanner = ({ 
  searchQuery, 
  setSearchQuery, 
  stats, 
  selectedTag, 
  setSelectedTag,
  bannerData,
  onOpenMatcher
}) => {
  const defaultTags = [
    'All',
    'Fully Funded',
    'Computer Science',
    'Engineering',
    'Remote',
    'Business',
    'Master',
    'PhD'
  ];

  const configuredTags = bannerData?.trendingTags?.length
    ? ['All', ...bannerData.trendingTags]
    : defaultTags;
  const tags = configuredTags.includes('AI Eligibility Matcher')
    ? configuredTags
    : [...configuredTags, 'AI Eligibility Matcher'];

  const badgeText = bannerData?.badgeText || 'Verified Opportunities • 2026/2027 Academic & Career Cycle';
  const headline = bannerData?.headline || 'Find Prestigious Scholarships & Top-Tier Internships';
  const headlineHighlight = bannerData?.headlineHighlight || 'Top-Tier Internships';
  const subtitle = bannerData?.subtitle || 'Direct access to world-class academic fellowships, tuition grants, and paid industry internships with complete criteria, deadline alerts, and verified application guides.';

  const heightClass = bannerData?.bannerHeight === 'compact' ? 'compact' : bannerData?.bannerHeight === 'spacious' ? 'spacious' : 'normal';

  // Render Headline with Highlighted Sandalwood Amber word
  const renderHeadline = () => {
    if (!headlineHighlight || !headline.includes(headlineHighlight)) {
      return headline;
    }
    const parts = headline.split(headlineHighlight);
    return (
      <>
        {parts[0]}
        <span className="hero-highlight-word">{headlineHighlight}</span>
        {parts.slice(1).join(headlineHighlight)}
      </>
    );
  };

  return (
    <section className={`hero-section ${heightClass}`}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 16px' }}>
        
        {/* 1. Announcement Pill */}
        <div>
          <div className="hero-pill-badge">
            <Sparkles style={{ width: 15, height: 15, color: '#C26D38' }} />
            <span>{badgeText}</span>
          </div>
        </div>

        {/* 2. Main Headline */}
        <h1 className="hero-title">
          {renderHeadline()}
        </h1>

        {/* 3. Subtitle */}
        <p className="hero-subtitle">
          {subtitle}
        </p>

        {/* 4. Beautifully Aligned Search Bar */}
        <div className="hero-search-wrapper">
          <div className="hero-search-container">
            <Search style={{ width: 20, height: 20, color: '#0F2744', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, university (Oxford, Harvard), company (Google, Tesla)..."
              className="hero-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#94A3B8'
                }}
                title="Clear"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            )}
            <button
              type="button"
              className="hero-search-btn"
            >
              Search
            </button>
          </div>
        </div>

        {/* 5. Trending Tags */}
        <div className="hero-tags-container">
          <span className="hero-tags-label">
            Trending:
          </span>
          {tags.map((tag) => {
            const isSelected = selectedTag === tag || (tag === 'All' && !selectedTag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  if (tag === 'AI Eligibility Matcher') {
                    onOpenMatcher?.();
                    return;
                  }
                  setSelectedTag(tag === 'All' ? '' : tag);
                }}
                className={`hero-tag-btn ${isSelected ? 'active' : ''}`}
              >
                {tag}
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default HeroBanner;
