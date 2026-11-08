import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Bookmark, 
  ArrowRight, 
  Building2, 
  Clock, 
  Sparkles, 
  Share2
} from 'lucide-react';

export const OpportunityCard = ({ 
  opportunity, 
  onViewDetails, 
  isBookmarked = false, 
  onToggleBookmark,
  onShare
}) => {
  const [imageError, setImageError] = useState(false);

  const {
    _id,
    id,
    title,
    type,
    provider,
    coverPhoto,
    category,
    location,
    workMode,
    degreeLevel,
    deadline,
    isFeatured
  } = opportunity;

  const oppId = _id || id;

  // Calculate detailed deadline countdown
  const calculateDeadline = (deadlineDate) => {
    if (!deadlineDate) return { text: 'Rolling Basis', badge: 'Open', status: 'normal' };
    const dateObj = new Date(deadlineDate);
    const diffTime = dateObj - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formatted = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (diffDays < 0) return { text: `Closed on ${formatted}`, badge: 'Closed', status: 'closed' };
    if (diffDays === 0) return { text: `Closes Today! (${formatted})`, badge: 'Today', status: 'urgent' };
    if (diffDays === 1) return { text: `1 Day Left (${formatted})`, badge: '1 Day', status: 'urgent' };
    if (diffDays <= 15) return { text: `${diffDays} Days Left (${formatted})`, badge: `${diffDays}d left`, status: 'urgent' };
    
    return { text: formatted, badge: `${diffDays}d left`, status: 'normal' };
  };

  const deadlineInfo = calculateDeadline(deadline);

  // Fallback cover photos
  const fallbackImage = type === 'Scholarship'
    ? 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80'
    : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80';

  return (
    <div 
      className="opp-card-wrapper"
      onClick={() => onViewDetails(opportunity)}
    >
      {/* 1. Header Photo & Badges */}
      <div className="opp-card-image-box">
        <img
          src={imageError ? fallbackImage : (coverPhoto || fallbackImage)}
          alt={title}
          onError={() => setImageError(true)}
          className="opp-card-img"
        />
        <div className="opp-card-img-overlay" />

        {/* Top Badges */}
        <div className="opp-card-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className={`opp-type-badge ${type === 'Scholarship' ? 'scholarship' : 'internship'}`}>
              {type}
            </span>

            {isFeatured && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FDE68A',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <Sparkles style={{ width: 12, height: 12, color: '#D97706' }} />
                <span>Featured</span>
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(oppId);
            }}
            className={`opp-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark opportunity'}
            aria-label="Bookmark"
          >
            <Bookmark style={{ width: 16, height: 16 }} className={isBookmarked ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Bottom image overlay: Category only */}
        <div className="opp-card-bottom-bar">
          <span className="opp-cat-pill">
            {category}
          </span>
        </div>
      </div>

      {/* 2. Card Content Body (No Paragraph Clutter!) */}
      <div className="opp-card-body">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Provider / Institution */}
          <div className="opp-card-provider">
            <Building2 style={{ width: 15, height: 15, color: '#C26D38', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{provider}</span>
          </div>

          {/* Title */}
          <h3 className="opp-card-title">
            {title}
          </h3>

          {/* Key Details: Academic level and deadline only */}
          <div className="opp-details-box">
            <div className="opp-details-row">
              <span className="opp-details-lbl">Academic Level:</span>
              <span className="opp-details-val">{degreeLevel}</span>
            </div>

            <div className="opp-deadline-alert-row">
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar style={{ width: 13, height: 13, color: '#B45309' }} />
                <span>Deadline:</span>
              </span>
              <span style={{ fontWeight: 800 }}>
                {deadlineInfo.text}
              </span>
            </div>
          </div>

        </div>

        {/* 3. Card Footer Actions: Pinned Cleanly to Bottom */}
        <div className="opp-card-footer">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare(opportunity);
            }}
            className="opp-share-btn"
            title="Share opportunity"
          >
            <Share2 style={{ width: 16, height: 16 }} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(opportunity);
            }}
            className="opp-view-btn"
          >
            <span>View Full Details</span>
            <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default OpportunityCard;
