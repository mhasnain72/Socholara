import React, { useState } from 'react';
import { 
  GraduationCap, 
  Bookmark, 
  Menu, 
  X, 
  Compass, 
  Briefcase, 
  Award,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

export const Navbar = ({ 
  currentView, 
  setCurrentView, 
  typeFilter = 'All',
  savedOnly = false,
  onSelectOpportunityType,
  onOpenMatcher,
  savedCount = 0,
  theme = 'light',
  onToggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Explore All', icon: Compass },
    { id: 'scholarships', label: 'Scholarships', icon: Award },
    { id: 'internships', label: 'Internships', icon: Briefcase },
    { id: 'matcher', label: 'AI Eligibility Matcher', icon: Sparkles },
    { id: 'saved', label: 'Saved', icon: Bookmark, badge: savedCount },
  ];

  const opportunityTypeTabs = [
    { value: 'All', label: 'All Opportunities' },
    { value: 'Scholarship', label: 'Scholarships' },
    { value: 'Internship', label: 'Internships' },
    { value: 'Matcher', label: 'AI Eligibility Matcher' },
    { value: 'Saved', label: 'Saved' },
  ];

  const handleNav = (viewId) => {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className={`scholara-navbar ${currentView === 'home' ? 'home-navbar' : ''} ${currentView === 'scholarships' || currentView === 'internships' ? 'category-banner-navbar' : ''}`}>
      <div className="scholara-nav-container">
        
        {/* Logo & Brand */}
        <div 
          onClick={() => handleNav('home')} 
          className="scholara-brand"
        >
          <div className="scholara-brand-icon">
            <GraduationCap style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="scholara-brand-title">SCHOLARA</span>
              <span style={{ 
                background: '#16365D', 
                color: '#DDD2BF', 
                fontSize: 10, 
                fontWeight: 700, 
                padding: '2px 6px', 
                borderRadius: 4, 
                letterSpacing: '0.05em' 
              }}>
                PORTAL
              </span>
            </div>
            <div className="scholara-brand-sub">
              Scholarships & Internships Network
            </div>
          </div>
        </div>

        {/* Desktop Navigation Menu */}
        <nav className="scholara-filter-nav" aria-label="Opportunity filters">
          {opportunityTypeTabs.map((tab) => {
            const isActive = tab.value === 'Saved'
              ? savedOnly || currentView === 'saved'
              : tab.value === 'Matcher'
                ? currentView === 'matcher'
              : !savedOnly && typeFilter === tab.value && (
                  tab.value !== 'All' || ['home', 'scholarships', 'internships'].includes(currentView)
                );
            const tabButton = (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  if (tab.value === 'Matcher') {
                    onOpenMatcher?.();
                  } else {
                    onSelectOpportunityType?.(tab.value);
                  }
                  setMobileMenuOpen(false);
                }}
                className={`scholara-filter-nav-link ${isActive ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            );
            if (tab.value !== 'Saved') return tabButton;
            return (
              <React.Fragment key={tab.value}>
                {tabButton}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Mobile Menu Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="scholara-mobile-menu-trigger md:hidden"
            style={{
              padding: 8,
              borderRadius: 8,
              background: '#16365D',
              border: 'none',
              color: '#DDD2BF',
              cursor: 'pointer'
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#0A192F',
          borderTop: '1px solid #16365D',
          padding: '16px 20px 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: isActive ? '#16365D' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon style={{ width: 18, height: 18, color: isActive ? '#C26D38' : '#DDD2BF' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="scholara-nav-badge">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

        </div>
      )}
    </header>
  );
};

export default Navbar;
