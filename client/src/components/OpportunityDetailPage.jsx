import React from 'react';
import {
  ArrowLeft,
  Bookmark,
  Building2,
  Calendar,
  Check,
  Clock3,
  Coins,
  GraduationCap,
  MapPin,
  Share2,
  Sparkles,
  ExternalLink,
  Send,
  BriefcaseBusiness,
  Tag
} from 'lucide-react';

const OpportunityDetailPage = ({
  opportunity,
  onBack,
  isBookmarked,
  onToggleBookmark,
  onShare,
  opportunities = [],
  onBrowseType,
  onBrowseTag,
  onBrowseITScholarships,
  onOpenMatcher,
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeOpportunities = opportunities.filter((item) => {
    const status = item.status || 'Active';
    const deadline = item.deadline ? new Date(item.deadline) : null;
    return ['Active', 'Closing Soon'].includes(status) && (!deadline || deadline >= today);
  });
  const opportunitySearchText = (item) => [
    item.title,
    item.category,
    item.awardAmount,
    item.shortDescription,
    item.fullDescription,
    ...(Array.isArray(item.tags) ? item.tags : []),
    ...(Array.isArray(item.benefits) ? item.benefits : [])
  ].filter(Boolean).join(' ').toLowerCase();
  const isFullyFunded = (item) => /fully funded|full tuition|complete tuition/.test(opportunitySearchText(item));
  const isPartiallyFunded = (item) => /partial(?:ly)? funded|partial funding/.test(opportunitySearchText(item));
  const isITScholarship = (item) => item.type === 'Scholarship' && (
    item.category === 'Computer Science & Tech' ||
    /information technology|computer science|software|cyber|\bit\b/i.test(opportunitySearchText(item))
  );
  const directoryCategories = [
    { label: 'Scholarships', count: activeOpportunities.filter((item) => item.type === 'Scholarship').length, onClick: () => onBrowseType?.('Scholarship') },
    { label: 'Internships', count: activeOpportunities.filter((item) => item.type === 'Internship').length, onClick: () => onBrowseType?.('Internship') },
    { label: 'Fully Funded', count: activeOpportunities.filter(isFullyFunded).length, onClick: () => onBrowseTag?.('Fully Funded') },
    { label: 'Partial Funded', count: activeOpportunities.filter(isPartiallyFunded).length, onClick: () => onBrowseTag?.('Partial Funded') },
    { label: 'IT Scholarships', count: activeOpportunities.filter(isITScholarship).length, onClick: () => onBrowseITScholarships?.() },
    { label: 'AI Eligibility Matcher', count: null, onClick: () => onOpenMatcher?.() },
  ];
  const activeTags = [...new Map(
    activeOpportunities.flatMap((item) =>
      (Array.isArray(item.tags) ? item.tags : []).map((tag) => [tag.trim().toLowerCase(), tag.trim()])
    ).filter(([key, value]) => key && value)
  ).values()];

  const deadlineDate = deadline ? new Date(deadline) : null;
  const formattedDeadline = deadlineDate
    ? deadlineDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Rolling Basis';

  const daysLeft = (() => {
    if (!deadlineDate) return { text: 'Rolling Basis', tone: 'normal' };
    const diff = deadlineDate - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: 'Application Closed', tone: 'closed' };
    if (days === 0) return { text: 'Closes today', tone: 'urgent' };
    if (days === 1) return { text: '1 day left', tone: 'urgent' };
    return { text: `${days} days left`, tone: 'normal' };
  })();

  return (
    <div className="detail-page-shell">
      <div className="detail-page-inner">
        <button type="button" onClick={onBack} className="detail-page-back-btn">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="detail-page-hero">
          <img
            src={coverPhoto || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80'}
            alt={title}
          />
          <div className="detail-page-hero-overlay" />

          <div className="detail-page-hero-content">
            <div className="detail-page-top-pills">
              <span className={`opp-type-badge ${type === 'Scholarship' ? 'scholarship' : 'internship'}`}>
                {type}
              </span>
              <span className="detail-page-category-pill">{category}</span>
              {isFeatured && (
                <span className="detail-page-featured-pill">
                  <Sparkles size={12} />
                  Featured
                </span>
              )}
            </div>

            <h1>{title}</h1>

            <div className="detail-page-meta-row">
              <span>
                <Building2 size={16} />
                {provider}
              </span>
              <span>
                <MapPin size={16} />
                {location} • {workMode}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-page-summary-bar">
          <div className="detail-page-award-summary">
            <div className="detail-page-summary-icon">
              <Coins size={16} />
            </div>
            <div className="detail-page-summary-copy">
              <span className="detail-page-summary-label">Award</span>
              <strong>{awardAmount}</strong>
            </div>
          </div>

          <div className="detail-page-deadline-summary">
            <div className="detail-page-deadline-heading">
              <span className="detail-page-side-label">
                <Calendar size={14} />
                Deadline
              </span>
              <strong className={`detail-page-status ${daysLeft.tone}`}>{daysLeft.text}</strong>
            </div>
            <p className="detail-page-summary-date">{formattedDeadline}</p>
          </div>
        </div>

        <section className="detail-page-card detail-page-about">
          <h2>About this opportunity</h2>
          <p>{fullDescription || shortDescription}</p>
        </section>

        <div className="detail-page-body">
          <div className="detail-page-main">
            <section className="detail-page-card">
              <h2>Eligibility</h2>
              <ul>
                {eligibility.length > 0 ? (
                  eligibility.map((item, index) => (
                    <li key={`${item}-${index}`}>
                      <Check size={14} />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li>
                    <Check size={14} />
                    <span>Applicants should meet the stated academic, experience, and residency requirements for the listed program.</span>
                  </li>
                )}
              </ul>
            </section>

            <section className="detail-page-card">
              <h2>Benefits & support</h2>
              <ul>
                {benefits.length > 0 ? (
                  benefits.map((item, index) => (
                    <li key={`${item}-${index}`}>
                      <Check size={14} />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li>
                    <Check size={14} />
                    <span>Full benefits and support details are included in the official application instructions.</span>
                  </li>
                )}
              </ul>
            </section>

            <section className="detail-page-card">
              <h2>Requirements</h2>
              <ul>
                {requirements.length > 0 ? (
                  requirements.map((item, index) => (
                    <li key={`${item}-${index}`}>
                      <Check size={14} />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li>
                    <Check size={14} />
                    <span>Prepare the application packet, supporting documents, and required essays or recommendations.</span>
                  </li>
                )}
              </ul>
            </section>

            <div className="detail-page-lower-grid">
              <section className="detail-page-side-card detail-page-extra-details">
                <h2>Opportunity details</h2>
                <div className="detail-page-side-row">
                  <span className="detail-page-side-label">
                    <GraduationCap size={14} />
                    Level
                  </span>
                  <strong>{degreeLevel}</strong>
                </div>
                <div className="detail-page-side-row">
                  <span className="detail-page-side-label">
                    <MapPin size={14} />
                    Location
                  </span>
                  <strong>{location}</strong>
                </div>
                <div className="detail-page-side-row">
                  <span className="detail-page-side-label">
                    <BriefcaseBusiness size={14} />
                    Work mode
                  </span>
                  <strong>{workMode}</strong>
                </div>
              </section>

              <div className="detail-page-actions">
                {applicationUrl ? (
                  <a href={applicationUrl} target="_blank" rel="noreferrer" className="detail-page-primary-btn">
                    <Send size={16} />
                    Apply now
                  </a>
                ) : (
                  <button type="button" className="detail-page-primary-btn" disabled title="Add the official application URL in the admin form">
                    <Send size={16} />
                    Application link unavailable
                  </button>
                )}

                <button type="button" onClick={() => onToggleBookmark(oppId)} className="detail-page-secondary-btn">
                  <Bookmark size={16} className={isBookmarked ? 'fill-current' : ''} />
                  {isBookmarked ? 'Saved' : 'Save opportunity'}
                </button>

                <button type="button" onClick={() => onShare(opportunity)} className="detail-page-secondary-btn">
                  <Share2 size={16} />
                  Share
                </button>

                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="detail-page-link-btn subtle">
                    <Calendar size={16} />
                    Contact: {contactEmail}
                  </a>
                )}
              </div>
            </div>
          </div>

          <aside className="detail-page-directory">
            <section className="detail-page-side-card">
              <h2>Categories</h2>
              <div className="detail-page-directory-list">
                {directoryCategories.map((directoryCategory) => (
                  <button
                    type="button"
                    key={directoryCategory.label}
                    className="detail-page-category-link"
                    onClick={directoryCategory.onClick}
                  >
                    <span>{directoryCategory.label}</span>
                    <strong>{directoryCategory.count}</strong>
                  </button>
                ))}
              </div>
            </section>

            <section className="detail-page-side-card">
              <h2><Tag size={15} /> Tags</h2>
              <div className="detail-page-tag-list">
                {['AI Eligibility Matcher', ...activeTags.filter((tag) => tag.toLowerCase() !== 'ai eligibility matcher')].map((tag) => (
                    <button
                      type="button"
                      key={tag.toLowerCase()}
                      className="detail-page-tag-link"
                      onClick={() => tag === 'AI Eligibility Matcher' ? onOpenMatcher?.() : onBrowseTag?.(tag)}
                    >
                      {tag}
                    </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailPage;
