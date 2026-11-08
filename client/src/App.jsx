import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import FilterBar from './components/FilterBar';
import OpportunityCard from './components/OpportunityCard';
import OpportunityDetailPage from './components/OpportunityDetailPage';
import EligibilityMatcher from './components/EligibilityMatcher';
import AdminPortal from './components/AdminPortal';
import LoginPage from './components/LoginPage';
import SavedPage from './components/SavedPage';
import Footer from './components/Footer';
import Toast from './components/Toast';
import { API } from './utils/api';
import { Storage } from './utils/storage';
import { Award, Briefcase, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

const DEFAULT_SCHOLARSHIP_BANNER_IMAGE = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1600&q=85';
const DEFAULT_INTERNSHIP_BANNER_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=85';
const PERSISTED_PUBLIC_VIEWS = ['scholarships', 'internships', 'matcher'];
const PERSISTED_VIEW_KEY = 'scholara:last-public-view';
const IS_ADMIN_ROUTE = window.location.pathname === '/admin';

const getInitialView = () => {
  try {
    const savedView = window.sessionStorage.getItem(PERSISTED_VIEW_KEY);
    return PERSISTED_PUBLIC_VIEWS.includes(savedView) ? savedView : 'home';
  } catch {
    return 'home';
  }
};

export function App() {
  // Navigation View: 'home' | 'scholarships' | 'internships' | 'saved' | 'admin' | 'login' | 'detail'
  const [currentView, setCurrentView] = useState(IS_ADMIN_ROUTE ? 'login' : getInitialView);
  const [lastNonDetailView, setLastNonDetailView] = useState('home');

  // Opportunities & Data State
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [bannerData, setBannerData] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [savedOnly, setSavedOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [degreeFilter, setDegreeFilter] = useState('All');
  const [sortFilter, setSortFilter] = useState('newest');

  // User Local Data
  const [savedIds, setSavedIds] = useState([]);
  const [matcherVerifiedUser, setMatcherVerifiedUser] = useState(null);

  // Modals & Overlays
  const [detailOpportunity, setDetailOpportunity] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Floating Toast
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem('scholara:theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem('scholara:theme', theme);
    } catch {
      // Theme still applies when browser storage is unavailable.
    }
  }, [theme]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    try {
      if (PERSISTED_PUBLIC_VIEWS.includes(currentView)) {
        window.sessionStorage.setItem(PERSISTED_VIEW_KEY, currentView);
      } else {
        window.sessionStorage.removeItem(PERSISTED_VIEW_KEY);
      }
    } catch {
      // Navigation still works when browser storage is unavailable.
    }
  }, [currentView]);

  // Sync view with type filter
  useEffect(() => {
    if (currentView === 'scholarships') {
      setTypeFilter('Scholarship');
    } else if (currentView === 'internships') {
      setTypeFilter('Internship');
    } else if (currentView === 'home') {
      setTypeFilter('All');
    }
  }, [currentView]);

  // Initial Load
  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [oppsRes, statsRes, bannerRes] = await Promise.all([
        API.getOpportunities(),
        API.getStats(),
        API.getBanner().catch(() => ({ success: false }))
      ]);

      if (oppsRes.success) {
        setOpportunities(oppsRes.data);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (bannerRes.success) {
        setBannerData(bannerRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to backend server. Make sure server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    setSavedIds(Storage.getBookmarks());
    if (IS_ADMIN_ROUTE) {
      API.checkAdminSession().then((active) => {
        if (active) {
          setIsAdmin(true);
          setCurrentView('admin');
        }
      });
    }
  }, []);

  // Filter & Search Logic
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(item => {
      // Type filter
      if (typeFilter !== 'All' && item.type !== typeFilter) {
        return false;
      }
      // Saved-only filter
      if (savedOnly && !savedIds.includes(item._id || item.id)) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }
      // Work mode filter
      if (workModeFilter !== 'All' && item.workMode !== workModeFilter) {
        return false;
      }
      // Degree level filter
      if (degreeFilter !== 'All' && item.degreeLevel !== degreeFilter) {
        return false;
      }
      // Selected Quick Tag from Hero
      if (selectedTag) {
        const searchableText = [
          item.category,
          item.title,
          item.awardAmount,
          item.shortDescription,
          item.fullDescription,
          ...(Array.isArray(item.tags) ? item.tags : []),
          ...(Array.isArray(item.benefits) ? item.benefits : [])
        ].filter(Boolean).join(' ').toLowerCase();
        const matchesTag = searchableText.includes(selectedTag.toLowerCase());
        if (!matchesTag) return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.provider && item.provider.toLowerCase().includes(q)) ||
          (item.shortDescription && item.shortDescription.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.tags && item.tags.some(t => t.toLowerCase().includes(q)));
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortFilter === 'deadline') {
        return new Date(a.deadline) - new Date(b.deadline);
      } else if (sortFilter === 'popular') {
        return (b.views || 0) - (a.views || 0);
      } else if (sortFilter === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });
  }, [
    opportunities, 
    typeFilter, 
    categoryFilter, 
    workModeFilter, 
    degreeFilter, 
    selectedTag, 
    searchQuery, 
    sortFilter,
    savedOnly,
    savedIds
  ]);

  // Handlers
  const handleToggleBookmark = (id) => {
    const { bookmarked, list } = Storage.toggleBookmark(id);
    setSavedIds(list);
    showToast(
      bookmarked ? 'Opportunity saved to your bookmarks!' : 'Opportunity removed from bookmarks.',
      bookmarked ? 'success' : 'info'
    );
  };

  const handleShare = (opp) => {
    const text = `${opp.title} (${opp.provider}) - ${opp.awardAmount}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Opportunity information copied to clipboard!', 'success');
    } else {
      showToast('Sharing: ' + opp.title, 'info');
    }
  };

  const handleResetFilters = () => {
    setTypeFilter('All');
    setSavedOnly(false);
    setCategoryFilter('All');
    setWorkModeFilter('All');
    setDegreeFilter('All');
    setSortFilter('newest');
    setSearchQuery('');
    setSelectedTag('');
  };

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setCurrentView('admin');
    showToast('Welcome to Admin Portal. Full permissions enabled.', 'success');
  };

  const handleAdminSessionExpired = () => {
    setIsAdmin(false);
    setCurrentView('login');
  };

  const handleAdminLogout = async () => {
    try {
      await API.endAdminSession();
    } catch (error) {
      console.error('Could not end admin session:', error);
    } finally {
      setIsAdmin(false);
      setCurrentView('login');
    }
  };

  const handleOpenOpportunityDetails = (opp) => {
    if (!opp) return;
    setDetailOpportunity(opp);
    if (!isAdmin) {
      const oppId = opp._id || opp.id;
      API.getOpportunityById(oppId)
        .then((response) => {
          if (response.success) {
            setDetailOpportunity((current) => {
              const currentId = current?._id || current?.id;
              return currentId === oppId ? response.data : current;
            });
          }
        })
        .catch((error) => console.error('Could not record opportunity view:', error));
    }
    setLastNonDetailView(currentView === 'detail' || currentView === 'login' ? lastNonDetailView : currentView);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBrowseType = (type) => {
    setTypeFilter(type);
    setSavedOnly(false);
    setCategoryFilter('All');
    setWorkModeFilter('All');
    setDegreeFilter('All');
    setSearchQuery('');
    setSelectedTag('');
    setCurrentView(type === 'Scholarship' ? 'scholarships' : 'internships');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOpportunityType = (type) => {
    if (type === 'Saved') {
      setSavedOnly((current) => !current);
      setCurrentView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (type === 'All') {
      handleResetFilters();
      setCurrentView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    handleBrowseType(type);
  };

  const handleBrowseTag = (tag) => {
    setTypeFilter('All');
    setSavedOnly(false);
    setCategoryFilter('All');
    setWorkModeFilter('All');
    setDegreeFilter('All');
    setSearchQuery('');
    setSelectedTag(tag);
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBrowseITScholarships = () => {
    setTypeFilter('Scholarship');
    setSavedOnly(false);
    setCategoryFilter('Computer Science & Tech');
    setWorkModeFilter('All');
    setDegreeFilter('All');
    setSearchQuery('');
    setSelectedTag('');
    setCurrentView('scholarships');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMatcher = () => {
    setCurrentView('matcher');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isTypeBannerView = currentView === 'scholarships' || currentView === 'internships';
  const typeBannerImage = currentView === 'scholarships'
    ? bannerData?.scholarshipBannerImage || DEFAULT_SCHOLARSHIP_BANNER_IMAGE
    : bannerData?.internshipBannerImage || DEFAULT_INTERNSHIP_BANNER_IMAGE;
  const typeBannerImageFit = bannerData?.typeBannerImageFit === 'fill'
    ? '100% 100%'
    : bannerData?.typeBannerImageFit === 'contain'
      ? 'contain'
      : 'cover';

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E293B] ${currentView === 'home' ? 'home-hero-shell' : ''} ${isTypeBannerView ? 'type-banner-shell' : ''}`}
      style={currentView === 'home' && bannerData?.backgroundImage
        ? {
            '--home-hero-image': `url("${bannerData.backgroundImage}")`,
            '--home-hero-size': bannerData.backgroundImageFit === 'fill'
              ? '100% 100%'
              : bannerData.backgroundImageFit === 'contain'
                ? 'contain'
                : 'cover'
          }
        : isTypeBannerView
          ? {
              '--type-banner-image': `url("${typeBannerImage}")`,
              '--type-banner-size': typeBannerImageFit
            }
          : undefined}
    >
      
      {/* Toast Alerts */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Navigation Bar */}
      {!IS_ADMIN_ROUTE && <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        typeFilter={typeFilter}
        savedOnly={savedOnly}
        onSelectOpportunityType={handleSelectOpportunityType}
        onOpenMatcher={handleOpenMatcher}
        savedCount={savedIds.length}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
      />}

      {/* Main Content Areas */}
      <main className="flex-1">

        {currentView === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onBack={() => {
              if (IS_ADMIN_ROUTE) {
                window.location.assign('/');
                return;
              }
              setCurrentView(lastNonDetailView || 'home');
            }}
          />
        )}

        {currentView === 'detail' && detailOpportunity && (
          <OpportunityDetailPage
            opportunity={detailOpportunity}
            onBack={() => setCurrentView(lastNonDetailView || 'home')}
            isBookmarked={savedIds.includes(detailOpportunity._id || detailOpportunity.id)}
            onToggleBookmark={handleToggleBookmark}
            onShare={handleShare}
            opportunities={opportunities}
            onBrowseType={handleBrowseType}
            onBrowseTag={handleBrowseTag}
            onBrowseITScholarships={handleBrowseITScholarships}
            onOpenMatcher={handleOpenMatcher}
          />
        )}

        {(currentView === 'matcher' || (currentView === 'detail' && lastNonDetailView === 'matcher')) && (
          <div hidden={currentView !== 'matcher'}>
            <EligibilityMatcher
              opportunities={opportunities}
              savedIds={savedIds}
              verifiedUser={matcherVerifiedUser}
              onVerified={setMatcherVerifiedUser}
              onToggleBookmark={handleToggleBookmark}
              onViewDetails={handleOpenOpportunityDetails}
              onShare={handleShare}
              onBack={() => setCurrentView('home')}
            />
          </div>
        )}
        
        {/* VIEW 1: ADMIN PORTAL */}
        {currentView === 'admin' && (
          <div className="site-container pt-8">
            <AdminPortal
              opportunities={opportunities}
              onRefreshOpportunities={fetchAllData}
              onViewDetails={handleOpenOpportunityDetails}
              showToast={showToast}
              bannerData={bannerData}
              onUpdateBanner={(updated) => setBannerData(updated)}
              onAdminSessionExpired={handleAdminSessionExpired}
              onLogout={handleAdminLogout}
              theme={theme}
              onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            />
          </div>
        )}

        {/* VIEW 2: SAVED OPPORTUNITIES */}
        {currentView === 'saved' && (
          <div className="site-container pt-8">
            <SavedPage
              opportunities={opportunities}
              savedIds={savedIds}
              onViewDetails={handleOpenOpportunityDetails}
              onToggleBookmark={handleToggleBookmark}
              onShare={handleShare}
              onExploreAll={() => setCurrentView('home')}
            />
          </div>
        )}

        {/* VIEW 3: EXPLORE / SCHOLARSHIPS / INTERNSHIPS (Cards Grid) */}
        {(currentView === 'home' || currentView === 'scholarships' || currentView === 'internships') && (
          <div>
            
            {/* Hero Section */}
            {currentView === 'home' && (
              <HeroBanner
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                stats={stats}
                selectedTag={selectedTag}
                setSelectedTag={setSelectedTag}
                bannerData={bannerData}
                onOpenMatcher={handleOpenMatcher}
              />
            )}

            {/* Scholarships Specific Header */}
            {currentView === 'scholarships' && (
              <div className="opportunity-type-banner">
                <div className="opportunity-type-banner-content">
                  <div className="opportunity-type-banner-badge">
                    <Award className="w-4 h-4 text-[#C26D38]" />
                    <span>Global Academic Grants & Fellowships</span>
                  </div>
                  <h1>
                    International & Domestic Scholarships
                  </h1>
                  <p>
                    Browse fully funded master’s, undergraduate tuition waivers, doctoral fellowships, and national research grants.
                  </p>
                </div>
              </div>
            )}

            {/* Internships Specific Header */}
            {currentView === 'internships' && (
              <div className="opportunity-type-banner">
                <div className="opportunity-type-banner-content">
                  <div className="opportunity-type-banner-badge">
                    <Briefcase className="w-4 h-4 text-[#C26D38]" />
                    <span>Industry Programs & Technical Roles</span>
                  </div>
                  <h1>
                    High-Impact & Paid Internships
                  </h1>
                  <p>
                    Connect directly with software engineering, consulting, robotics, finance, and healthcare internships across top global firms.
                  </p>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="site-container py-8 space-y-6">
              
              {/* Filter Controls Bar */}
              <FilterBar
                typeFilter={typeFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                workModeFilter={workModeFilter}
                setWorkModeFilter={setWorkModeFilter}
                degreeFilter={degreeFilter}
                setDegreeFilter={setDegreeFilter}
                sortFilter={sortFilter}
                setSortFilter={setSortFilter}
                onResetFilters={handleResetFilters}
                totalResults={filteredOpportunities.length}
              />

              {/* Error Alert */}
              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={fetchAllData}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-[#0F2744] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-[#0F2744]">
                    Loading verified scholarships & internships from MongoDB...
                  </p>
                </div>
              ) : filteredOpportunities.length > 0 ? (
                /* Cards Grid */
                <div className="opps-cards-grid">
                  {filteredOpportunities.map((opp) => {
                    const oppId = opp._id || opp.id;
                    return (
                      <OpportunityCard
                        key={oppId}
                        opportunity={opp}
                        isBookmarked={savedIds.includes(oppId)}
                        onToggleBookmark={handleToggleBookmark}
                        onViewDetails={handleOpenOpportunityDetails}
                        onShare={handleShare}
                      />
                    );
                  })}
                </div>
              ) : (
                /* No Results Found */
                <div className="empty-results-state bg-white border border-[#DDD2BF] space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#DDD2BF] text-slate-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-7 h-7 text-[#C26D38]" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F2744] font-['Plus_Jakarta_Sans']">
                    {savedOnly ? 'No Saved Opportunities Yet' : 'No Matching Opportunities Found'}
                  </h3>
                  <p className="text-xs text-[#5A6B82] leading-relaxed">
                    {savedOnly
                      ? 'Bookmark an opportunity and it will appear here for you.'
                      : 'Try adjusting your search terms or clearing some filters to view all available listings.'}
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl bg-[#0F2744] text-white text-xs font-bold transition shadow"
                  >
                    {savedOnly ? 'Explore Opportunities' : 'Reset All Filters'}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      {!IS_ADMIN_ROUTE && <Footer
        onSelectCategory={(cat) => {
          setCategoryFilter(cat);
          setCurrentView('home');
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
      />
      }

    </div>
  );
}

export default App;
