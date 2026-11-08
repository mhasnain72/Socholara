import React from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Calendar, 
  Coins, 
  Gift, 
  ExternalLink, 
  Bookmark, 
  Share2, 
  Clock, 
  Send, 
  GraduationCap, 
  Sparkles, 
  ArrowLeft, 
  Check 
} from 'lucide-react';

export const OpportunityDetailModal = ({ 
  opportunity, 
  onClose, 
  onApply, 
  isBookmarked, 
  onToggleBookmark, 
  onShare 
}) => {
  if (!opportunity) return null;

  const {
    _id,
    id,
    title,
    type,
    provider,
    coverPhoto,
    category,
    awardAmount,
    location,
    workMode,
    degreeLevel,
    deadline,
    shortDescription,
    fullDescription,
    eligibility = [],
    benefits = [],
    requirements = [],
    applicationUrl,
    contactEmail,
    tags = [],
    isFeatured
  } = opportunity;

  const oppId = _id || id;

  const deadlineDate = deadline ? new Date(deadline) : null;
  const formattedDeadline = deadlineDate ? deadlineDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : 'Rolling Basis';

  const calculateDaysLeft = () => {
    if (!deadlineDate) return { text: 'Rolling Basis', days: null };
    const diff = deadlineDate - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: 'Application Closed', days };
    if (days === 0) return { text: 'Closes Today!', days: 0 };
    if (days === 1) return { text: '1 day remaining', days: 1 };
    return { text: `${days} days remaining`, days };
  };

  const deadlineStatus = calculateDaysLeft();

  return (
    <div 
      className="detail-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="detail-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="detail-modal-topbar">
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              color: '#FFFFFF',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            <span>Back to All Opportunities</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => onShare(opportunity)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Share2 style={{ width: 14, height: 14 }} />
              <span>Share</span>
            </button>

            <button
              onClick={() => onToggleBookmark(oppId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                background: isBookmarked ? '#C26D38' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Bookmark style={{ width: 14, height: 14 }} className={isBookmarked ? 'fill-current' : ''} />
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: 8,
                padding: 6,
                color: '#FFFFFF',
                cursor: 'pointer',
                marginLeft: 4
              }}
              title="Close (Esc)"
              aria-label="Close"
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="detail-modal-body">
          
          {/* Hero Banner Header */}
          <div className="detail-hero-box">
            <img 
              src={coverPhoto || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80'} 
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className="detail-hero-overlay" />

            <div className="detail-hero-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span className={`opp-type-badge ${type === 'Scholarship' ? 'scholarship' : 'internship'}`}>
                  {type}
                </span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#FFFFFF'
                }}>
                  {category}
                </span>
                {isFeatured && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: '#FEF3C7',
                    color: '#92400E',
                    fontSize: 11,
                    fontWeight: 700
                  }}>
                    <Sparkles style={{ width: 12, height: 12, color: '#D97706' }} />
                    <span>Featured</span>
                  </span>
                )}
              </div>

              <h1 style={{
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 28,
                fontWeight: 800,
                color: '#FFFFFF',
                lineHeight: 1.25,
                marginBottom: 8
              }}>
                {title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: '#DDD2BF', fontWeight: 500, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 style={{ width: 16, height: 16, color: '#C26D38' }} />
                  <strong>{provider}</strong>
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin style={{ width: 16, height: 16, color: '#94A3B8' }} />
                  <span>{location} ({workMode})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Comfortable 2-Column Main Content Layout */}
          <div className="detail-content-layout">
            
            {/* LEFT COLUMN: Main Comfortable Information */}
            <div>
              
              {/* 1. Overview Section */}
              <div className="detail-section-card">
                <h3 className="detail-section-title">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C26D38', display: 'inline-block' }} />
                  <span>About this Opportunity</span>
                </h3>
                <div style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {fullDescription || shortDescription}
                </div>

                {tags && tags.length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F4EFE6', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                      Keywords:
                    </span>
                    {tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 8,
                          background: '#FAF7F2',
                          color: '#0F2744',
                          border: '1px solid #DDD2BF'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Eligibility Criteria */}
              <div className="detail-section-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 className="detail-section-title" style={{ margin: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                    <span>Eligibility Criteria & Requirements</span>
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: '#DCFCE7', color: '#166534' }}>
                    {eligibility.length} Criteria
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
                  Applicants must satisfy the following qualifications to be considered:
                </p>

                <div>
                  {eligibility.length > 0 ? (
                    eligibility.map((crit, idx) => (
                      <div key={idx} className="detail-check-item">
                        <div className="detail-check-icon">
                          <Check style={{ width: 14, height: 14 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#1E293B', lineHeight: 1.5 }}>
                          {crit}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 16, background: '#FAF7F2', borderRadius: 12, fontSize: 13, color: '#64748B' }}>
                      Open to all qualifying applicants meeting university and organization standards.
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Coverage, Benefits & Perks */}
              <div className="detail-section-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 className="detail-section-title" style={{ margin: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C26D38', display: 'inline-block' }} />
                    <span>Financial Coverage & Benefits</span>
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: '#FEF3C7', color: '#92400E' }}>
                    {benefits.length} Benefits
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  {benefits.length > 0 ? (
                    benefits.map((b, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '14px 16px',
                        background: '#FAF7F2',
                        border: '1px solid #DDD2BF',
                        borderRadius: 16
                      }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: '#FFFBEB',
                          color: '#C26D38',
                          border: '1px solid #FEF3C7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Gift style={{ width: 16, height: 16 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F2744', lineHeight: 1.4 }}>
                          {b}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 16, background: '#FAF7F2', borderRadius: 12, fontSize: 13, color: '#64748B' }}>
                      Detailed financial award and benefits package confirmed upon selection.
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Required Application Documents */}
              <div className="detail-section-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 className="detail-section-title" style={{ margin: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1E4B82', display: 'inline-block' }} />
                    <span>Required Application Documents Checklist</span>
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: '#E6EFF9', color: '#0F2744' }}>
                    {requirements.length} Documents
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {requirements.length > 0 ? (
                    requirements.map((req, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        background: '#FAF7F2',
                        border: '1px solid #DDD2BF',
                        borderRadius: 14
                      }}>
                        <div style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: '#0F2744',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                          {req}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 16, background: '#FAF7F2', borderRadius: 12, fontSize: 13, color: '#64748B' }}>
                      Standard academic transcripts, CV, and statement of purpose required.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Quick Facts & Sticky Action Card */}
            <div>
              <div className="detail-sidebar-card">
                
                {/* Award Banner */}
                <div style={{ paddingBottom: 16, borderBottom: '1px solid #F4EFE6', marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                    Award / Monthly Stipend
                  </span>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 22, fontWeight: 800, color: '#0F2744', lineHeight: 1.2 }}>
                    {awardAmount}
                  </div>
                </div>

                {/* Deadline Alert Box */}
                <div style={{
                  padding: 14,
                  borderRadius: 16,
                  background: '#FFFBEB',
                  border: '1px solid #FEF3C7',
                  marginBottom: 18
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock style={{ width: 14, height: 14, color: '#B45309' }} />
                      <span>Deadline Status</span>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#B45309', color: '#FFFFFF' }}>
                      {deadlineStatus.text}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>
                    {formattedDeadline}
                  </div>
                </div>

                {/* Meta Matrix */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#FAF7F2', borderRadius: 10, border: '1px solid rgba(221, 210, 191, 0.6)' }}>
                    <span style={{ color: '#64748B' }}>Institution:</span>
                    <strong style={{ color: '#0F2744', maxWidth: '60%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{provider}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#FAF7F2', borderRadius: 10, border: '1px solid rgba(221, 210, 191, 0.6)' }}>
                    <span style={{ color: '#64748B' }}>Location:</span>
                    <strong style={{ color: '#0F2744', maxWidth: '60%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{location}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#FAF7F2', borderRadius: 10, border: '1px solid rgba(221, 210, 191, 0.6)' }}>
                    <span style={{ color: '#64748B' }}>Work Mode:</span>
                    <strong style={{ color: '#0F2744' }}>{workMode}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#FAF7F2', borderRadius: 10, border: '1px solid rgba(221, 210, 191, 0.6)' }}>
                    <span style={{ color: '#64748B' }}>Degree Level:</span>
                    <strong style={{ color: '#0F2744' }}>{degreeLevel}</strong>
                  </div>

                  {contactEmail && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#FAF7F2', borderRadius: 10, border: '1px solid rgba(221, 210, 191, 0.6)' }}>
                      <span style={{ color: '#64748B' }}>Inquiries:</span>
                      <a href={`mailto:${contactEmail}`} style={{ color: '#1E4B82', fontWeight: 700, maxWidth: '60%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {contactEmail}
                      </a>
                    </div>
                  )}
                </div>

                {/* CTA Action Buttons */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onApply(opportunity);
                    }}
                    className="detail-apply-btn"
                  >
                    <Send style={{ width: 18, height: 18, color: '#C26D38' }} />
                    <span>Apply on Portal</span>
                  </button>

                  {applicationUrl && (
                    <a
                      href={applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-external-btn"
                    >
                      <span>Visit Official Website</span>
                      <ExternalLink style={{ width: 15, height: 15 }} />
                    </a>
                  )}
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailModal;
