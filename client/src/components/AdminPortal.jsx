import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  ListFilter, 
  FileText, 
  Trash2, 
  Edit3, 
  Eye, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Plus, 
  Calendar, 
  Building2, 
  Search, 
  Database, 
  LayoutTemplate,
  Check,
  Users,
  TrendingUp,
  RefreshCw,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { API } from '../utils/api';
import OpportunityFinder from './OpportunityFinder';

const DEFAULT_HERO_BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2400&q=85';
const DEFAULT_SCHOLARSHIP_BANNER_IMAGE = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1600&q=85';
const DEFAULT_INTERNSHIP_BANNER_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=85';

export const AdminPortal = ({ 
  opportunities = [], 
  onRefreshOpportunities, 
  onViewDetails,
  showToast,
  bannerData,
  onUpdateBanner,
  onAdminSessionExpired,
  onLogout,
  theme = 'light',
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = window.sessionStorage.getItem('scholara:admin-tab');
      return ['manage', 'post', 'banner', 'insights', 'finder'].includes(savedTab) ? savedTab : 'manage';
    } catch {
      return 'manage';
    }
  });
  const [editingOpp, setEditingOpp] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);
  const [stats, setStats] = useState(null);
  const [matcherContacts, setMatcherContacts] = useState([]);
  const [matcherContactCount, setMatcherContactCount] = useState(0);
  const [loadingMatcherContacts, setLoadingMatcherContacts] = useState(false);
  const [matcherContactsError, setMatcherContactsError] = useState('');
  const [lastActivity, setLastActivity] = useState(() => Date.now());

  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const updateActivity = () => setLastActivity(Date.now());
    activityEvents.forEach((eventName) => window.addEventListener(eventName, updateActivity));
    const inactivityTimer = window.setInterval(() => {
      if (Date.now() - lastActivity >= 10 * 60 * 1000) {
        onLogout?.();
      }
    }, 30 * 1000);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, updateActivity));
      window.clearInterval(inactivityTimer);
    };
  }, [lastActivity, onLogout]);

  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const photoPresets = [
    { label: 'Academic Quad / Oxford', url: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Modern Tech Office / Google', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Robotics & Hardware Lab', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80' },
    { label: 'European University / Berlin', url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Corporate Finance / Wall St', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Medicine & Research Hospital', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Cloud & AI Data Center', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Automotive & Clean Energy', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80' },
  ];

  const initialForm = {
    title: '',
    type: 'Scholarship',
    provider: '',
    coverPhoto: photoPresets[0].url,
    category: 'Computer Science & Tech',
    awardAmount: 'Fully Funded',
    location: 'Global',
    workMode: 'On-site',
    degreeLevel: 'Undergraduate',
    deadline: '',
    shortDescription: 'Comprehensive funding opportunity for qualifying scholars.',
    fullDescription: '',
    eligibilityText: '',
    benefitsText: '',
    requirementsText: '',
    applicationUrl: '',
    contactEmail: '',
    tagsText: '',
    status: 'Active',
    isFeatured: false
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    try {
      window.sessionStorage.setItem('scholara:admin-tab', activeTab);
    } catch {
      // The active tab remains available for the current session.
    }
  }, [activeTab]);

  const [bannerForm, setBannerForm] = useState({
    badgeText: 'Verified Opportunities • 2026/2027 Academic & Career Cycle',
    headline: 'Find Prestigious Scholarships & Top-Tier Internships',
    headlineHighlight: 'Top-Tier Internships',
    subtitle: 'Direct access to world-class academic fellowships, tuition grants, and paid industry internships with complete criteria, deadline alerts, and verified application guides.',
    bannerHeight: 'normal',
    backgroundImage: DEFAULT_HERO_BACKGROUND_IMAGE,
    backgroundImageFit: 'cover',
    scholarshipBannerImage: DEFAULT_SCHOLARSHIP_BANNER_IMAGE,
    internshipBannerImage: DEFAULT_INTERNSHIP_BANNER_IMAGE,
    typeBannerImageFit: 'cover',
    trendingTagsText: 'Fully Funded, Computer Science, Engineering, Remote, Business, Master, PhD',
    useAutoStats: true,
    customHighlights: [
      { label: 'Verified Awards', value: '100%' },
      { label: 'Average Funding', value: '$28,000+' },
      { label: 'Global Universities', value: '60+' },
      { label: 'Success Rate', value: '94%' }
    ]
  });

  useEffect(() => {
    if (bannerData) {
      setBannerForm({
        badgeText: bannerData.badgeText || '',
        headline: bannerData.headline || '',
        headlineHighlight: bannerData.headlineHighlight || '',
        subtitle: bannerData.subtitle || '',
        bannerHeight: bannerData.bannerHeight || 'normal',
        backgroundImage: bannerData.backgroundImage || DEFAULT_HERO_BACKGROUND_IMAGE,
        backgroundImageFit: bannerData.backgroundImageFit || 'cover',
        scholarshipBannerImage: bannerData.scholarshipBannerImage || DEFAULT_SCHOLARSHIP_BANNER_IMAGE,
        internshipBannerImage: bannerData.internshipBannerImage || DEFAULT_INTERNSHIP_BANNER_IMAGE,
        typeBannerImageFit: bannerData.typeBannerImageFit || 'cover',
        trendingTagsText: bannerData.trendingTags ? bannerData.trendingTags.join(', ') : '',
        useAutoStats: bannerData.useAutoStats !== false,
        customHighlights: bannerData.customHighlights || [
          { label: 'Verified Awards', value: '100%' },
          { label: 'Average Funding', value: '$28,000+' },
          { label: 'Global Universities', value: '60+' },
          { label: 'Success Rate', value: '94%' }
        ]
      });
    }
  }, [bannerData]);

  const loadData = async () => {
    try {
      const statsRes = await API.getStats();
      if (statsRes.success) setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadInsights = async () => {
    setActiveTab('insights');
    setLoadingMatcherContacts(true);
    setMatcherContactsError('');

    try {
      const [contactsRes] = await Promise.all([
        API.getMatcherContacts(),
        onRefreshOpportunities?.()
      ]);
      setMatcherContacts(contactsRes.data || []);
      setMatcherContactCount(contactsRes.count || 0);
    } catch (error) {
      setMatcherContactsError(error.message || 'Could not load insights.');
      if (error.message?.toLowerCase().includes('session')) onAdminSessionExpired?.();
    } finally {
      setLoadingMatcherContacts(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartEdit = (opp) => {
    setEditingOpp(opp);
    setTagInput('');
    setFormData({
      title: opp.title || '',
      type: opp.type || 'Scholarship',
      provider: opp.provider || '',
      coverPhoto: opp.coverPhoto || photoPresets[0].url,
      category: opp.category || 'Computer Science & Tech',
      awardAmount: opp.awardAmount || 'Fully Funded',
      location: opp.location || 'Global',
      workMode: opp.workMode || 'On-site',
      degreeLevel: opp.degreeLevel || 'Undergraduate',
      deadline: opp.deadline ? opp.deadline.split('T')[0] : '',
      shortDescription: opp.shortDescription || 'Verified opportunity.',
      fullDescription: opp.fullDescription || '',
      eligibilityText: Array.isArray(opp.eligibility) ? opp.eligibility.join('\n') : '',
      benefitsText: Array.isArray(opp.benefits) ? opp.benefits.join('\n') : '',
      requirementsText: Array.isArray(opp.requirements) ? opp.requirements.join('\n') : '',
      applicationUrl: opp.applicationUrl || '',
      contactEmail: opp.contactEmail || '',
      tagsText: Array.isArray(opp.tags) ? opp.tags.join(', ') : '',
      status: opp.status || 'Active',
      isFeatured: Boolean(opp.isFeatured)
    });
    setActiveTab('post');
  };

  const handleCancelEdit = () => {
    setEditingOpp(null);
    setTagInput('');
    setFormData(initialForm);
    setActiveTab('manage');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddTag = (event) => {
    event.preventDefault();
    const newTag = tagInput.trim().replace(/,+$/, '').trim();
    if (!newTag) return;

    setFormData((prev) => {
      const tags = prev.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean);
      if (tags.some((tag) => tag.toLowerCase() === newTag.toLowerCase())) return prev;
      return { ...prev, tagsText: [...tags, newTag].join(', ') };
    });
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tagsText: prev.tagsText.split(',').map((tag) => tag.trim()).filter((tag) => tag && tag.toLowerCase() !== tagToRemove.toLowerCase()).join(', ')
    }));
  };

  const handleBannerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBannerForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleHighlightChange = (index, field, value) => {
    setBannerForm(prev => {
      const updated = [...prev.customHighlights];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customHighlights: updated };
    });
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        badgeText: bannerForm.badgeText,
        headline: bannerForm.headline,
        headlineHighlight: bannerForm.headlineHighlight,
        subtitle: bannerForm.subtitle,
        bannerHeight: bannerForm.bannerHeight,
        backgroundImage: bannerForm.backgroundImage,
        backgroundImageFit: bannerForm.backgroundImageFit,
        scholarshipBannerImage: bannerForm.scholarshipBannerImage,
        internshipBannerImage: bannerForm.internshipBannerImage,
        typeBannerImageFit: bannerForm.typeBannerImageFit,
        trendingTags: bannerForm.trendingTagsText.split(',').map(s => s.trim()).filter(Boolean),
        useAutoStats: bannerForm.useAutoStats,
        customHighlights: bannerForm.customHighlights
      };

      const res = await API.updateBanner(payload);
      if (res.success) {
        showToast('Banner text, page images, height, and highlights saved successfully!', 'success');
        if (onUpdateBanner) onUpdateBanner(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update banner', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await API.uploadPhoto(file);
      if (res.success) {
        setFormData(prev => ({ ...prev, coverPhoto: res.url }));
        showToast('Photo uploaded successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error uploading file', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBannerImageUpload = async (e, field = 'backgroundImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBannerImage(true);
    try {
      const res = await API.uploadPhoto(file);
      if (res.success) {
        setBannerForm(prev => ({ ...prev, [field]: res.url }));
        showToast('Banner image uploaded. Save banner settings to publish it.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error uploading banner image', 'error');
    } finally {
      setUploadingBannerImage(false);
      e.target.value = '';
    }
  };

  const handleSubmitOpportunity = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.provider || !formData.coverPhoto || !formData.deadline) {
      showToast('Please fill in all required fields (Title, Provider, Photo, Deadline).', 'error');
      return;
    }

    const payload = {
      ...formData,
      shortDescription: formData.shortDescription || 'Verified opportunity with complete funding.',
      eligibility: formData.eligibilityText.split('\n').map(s => s.trim()).filter(Boolean),
      benefits: formData.benefitsText.split('\n').map(s => s.trim()).filter(Boolean),
      requirements: formData.requirementsText.split('\n').map(s => s.trim()).filter(Boolean),
      tags: formData.tagsText.split(/[\n,]/).map(s => s.trim()).filter(Boolean),
    };

    try {
      if (editingOpp) {
        const oppId = editingOpp._id || editingOpp.id;
        await API.updateOpportunity(oppId, payload);
        showToast(`Opportunity "${formData.title}" updated in MongoDB!`, 'success');
      } else {
        await API.createOpportunity(payload);
        showToast(`New ${formData.type} "${formData.title}" published!`, 'success');
      }

      setFormData(initialForm);
      setEditingOpp(null);
      setActiveTab('manage');
      onRefreshOpportunities();
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to save opportunity', 'error');
    }
  };

  const handleDeleteOpportunity = async (opp) => {
    const oppId = opp._id || opp.id;
    if (!window.confirm(`Are you sure you want to delete "${opp.title}"? This action removes it permanently from MongoDB.`)) {
      return;
    }

    try {
      await API.deleteOpportunity(oppId);
      showToast(`"${opp.title}" deleted from database`, 'success');
      onRefreshOpportunities();
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete opportunity', 'error');
    }
  };

  const filteredOpps = opportunities.filter(o => {
    const matchesType = typeFilter === 'All' || o.type === typeFilter;
    const matchesSearch = !searchFilter || 
      o.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.provider.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.category.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesType && matchesSearch;
  });

  const renderTopViewedTable = (type) => {
    const topViewed = opportunities
      .filter((opportunity) => opportunity.type === type)
      .slice()
      .sort((first, second) => (Number(second.views) || 0) - (Number(first.views) || 0))
      .slice(0, 5);

    return (
      <div className="admin-insights-table-wrap">
        <table className="admin-table admin-insights-table">
          <thead>
            <tr>
              <th className="admin-th">Opportunity</th>
              <th className="admin-th">Provider</th>
              <th className="admin-th">Opens</th>
            </tr>
          </thead>
          <tbody>
            {topViewed.length ? topViewed.map((opportunity) => (
              <tr key={opportunity._id || opportunity.id}>
                <td className="admin-td">{opportunity.title}</td>
                <td className="admin-td">{opportunity.provider}</td>
                <td className="admin-td admin-insights-count">{Number(opportunity.views) || 0}</td>
              </tr>
            )) : (
              <tr><td className="admin-td admin-insights-empty" colSpan={3}>No {type.toLowerCase()} listings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="admin-wrapper">
      
      {/* 1. Admin Header & Stats */}
      <div className="admin-header-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ 
                padding: '3px 10px', 
                borderRadius: 999, 
                background: '#16365D', 
                fontSize: 11, 
                fontWeight: 800, 
                color: '#DDD2BF', 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <ShieldCheck style={{ width: 14, height: 14, color: '#C26D38' }} />
                <span>Admin Command Center</span>
              </span>
              {stats?.database && (
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: 'rgba(5, 150, 105, 0.2)',
                  border: '1px solid rgba(5, 150, 105, 0.4)',
                  color: '#4ADE80',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <Database style={{ width: 12, height: 12 }} />
                  <span>{stats.database}</span>
                </span>
              )}
            </div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 24, fontWeight: 800, margin: 0 }}>
              Opportunity & Portal Administration
            </h2>
            <p style={{ fontSize: 13, color: '#DDD2BF', marginTop: 4, margin: 0 }}>
              Publish verified opportunities and edit the homepage banner.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                setEditingOpp(null);
                setFormData(initialForm);
                setActiveTab('post');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 12,
                background: '#C26D38',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(194, 109, 56, 0.3)'
              }}
            >
              <PlusCircle style={{ width: 16, height: 16 }} />
              <span>Post New Opportunity</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="admin-header-logout"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 12,
                background: '#0F2744',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer'
              }}
            >
              <LogOut style={{ width: 16, height: 16 }} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <div className="admin-kpi-val" style={{ color: '#FFFFFF' }}>
              {stats?.total ?? opportunities.length}
            </div>
            <div className="admin-kpi-lbl">Total Opportunities</div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-val" style={{ color: '#E6EFF9' }}>
              {stats?.scholarships ?? opportunities.filter(o => o.type === 'Scholarship').length}
            </div>
            <div className="admin-kpi-lbl">Scholarships</div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-val" style={{ color: '#C26D38' }}>
              {stats?.internships ?? opportunities.filter(o => o.type === 'Internship').length}
            </div>
            <div className="admin-kpi-lbl">Internships</div>
          </div>

        </div>
      </div>

      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo"><ShieldCheck size={18} /></div>
          <div>
            <strong>SCHOLARA</strong>
            <span>Scholarships & Internships Network</span>
          </div>
        </div>
        <div className="admin-sidebar-context">
          <strong>Admin panel</strong>
          <span>Portal controls</span>
        </div>
        <button type="button" className="admin-sidebar-post" onClick={() => { setEditingOpp(null); setFormData(initialForm); setActiveTab('post'); }}>
          <PlusCircle size={16} /><span>Post New Opportunity</span>
        </button>
        <div className="admin-sidebar-metrics">
          <div><strong>{stats?.total ?? opportunities.length}</strong><span>Total</span></div>
          <div><strong>{stats?.scholarships ?? opportunities.filter(o => o.type === 'Scholarship').length}</strong><span>Scholarships</span></div>
          <div><strong>{stats?.internships ?? opportunities.filter(o => o.type === 'Internship').length}</strong><span>Internships</span></div>
        </div>
        <div className="admin-sidebar-links">
          <button type="button" onClick={() => setActiveTab('manage')} className={activeTab === 'manage' ? 'active' : ''}><ListFilter size={17} /><span>Manage Listings</span><b>{opportunities.length}</b></button>
          <button type="button" onClick={() => { setEditingOpp(null); setFormData(initialForm); setActiveTab('post'); }} className={activeTab === 'post' ? 'active' : ''}><PlusCircle size={17} /><span>Post Opportunity</span></button>
          <button type="button" onClick={() => setActiveTab('banner')} className={activeTab === 'banner' ? 'active' : ''}><LayoutTemplate size={17} /><span>Edit Banner</span></button>
          <button type="button" onClick={loadInsights} className={activeTab === 'insights' ? 'active' : ''}><Users size={17} /><span>Insights</span></button>
          <button type="button" onClick={() => setActiveTab('finder')} className={activeTab === 'finder' ? 'active' : ''}><RefreshCw size={17} /><span>Opportunity Finder</span></button>
        </div>
        <div className="admin-sidebar-footer">
          <button type="button" onClick={onToggleTheme} className="admin-sidebar-action"><span className="admin-sidebar-action-icon">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</span><span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span></button>
          <button type="button" onClick={onLogout} className="admin-sidebar-action admin-sidebar-logout"><LogOut size={16} /><span>Logout</span></button>
        </div>
      </aside>

      {/* 2. Admin Tabs Bar */}
      <div className="admin-tabs-bar">
        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`admin-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
        >
          <ListFilter style={{ width: 15, height: 15 }} />
          <span>Manage Listings ({opportunities.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (activeTab !== 'post') {
              setEditingOpp(null);
              setFormData(initialForm);
            }
            setActiveTab('post');
          }}
          className={`admin-tab-btn ${activeTab === 'post' ? 'active' : ''}`}
        >
          <PlusCircle style={{ width: 15, height: 15, color: activeTab === 'post' ? '#FFFFFF' : '#C26D38' }} />
          <span>{editingOpp ? 'Edit Opportunity' : 'Post Opportunity'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banner')}
          className={`admin-tab-btn ${activeTab === 'banner' ? 'active' : ''}`}
        >
          <LayoutTemplate style={{ width: 15, height: 15, color: activeTab === 'banner' ? '#FFFFFF' : '#C26D38' }} />
          <span>Edit Banner & Heights</span>
        </button>

        <button
          type="button"
          onClick={loadInsights}
          className={`admin-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
        >
          <Users style={{ width: 15, height: 15, color: activeTab === 'insights' ? '#FFFFFF' : '#C26D38' }} />
          <span>Insights</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('finder')}
          className={`admin-tab-btn ${activeTab === 'finder' ? 'active' : ''}`}
        >
          <RefreshCw style={{ width: 15, height: 15, color: activeTab === 'finder' ? '#FFFFFF' : '#C26D38' }} />
          <span>Opportunity Finder</span>
        </button>

      </div>

      {/* ========================================================= */}
      {/* TAB 1: MANAGE LISTINGS TABLE */}
      {/* ========================================================= */}
      {activeTab === 'manage' && (
        <div className="admin-surface">
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #F4EFE6', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
              <Search style={{ width: 16, height: 16, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search by title, provider, category..."
                className="admin-input"
                style={{ paddingLeft: 36, height: 38 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#5A6B82' }}>Filter:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="admin-select"
                style={{ height: 38, padding: '0 10px', fontSize: 12, width: 140 }}
              >
                <option value="All">All Types</option>
                <option value="Scholarship">Scholarships</option>
                <option value="Internship">Internships</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: 14 }}>
            <table className="admin-table">
              <colgroup>
                <col style={{ width: '27%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '19%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="admin-th">Opportunity</th>
                  <th className="admin-th">Type</th>
                  <th className="admin-th">Category</th>
                  <th className="admin-th">Award Amount</th>
                  <th className="admin-th">Deadline</th>
                  <th className="admin-th" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpps.length > 0 ? (
                  filteredOpps.map((opp) => {
                    const oppId = opp._id || opp.id;
                    const formattedDate = opp.deadline 
                      ? new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Rolling';

                    return (
                      <tr key={oppId}>
                        <td className="admin-td">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img
                              src={opp.coverPhoto || photoPresets[0].url}
                              alt={opp.title}
                              style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid #DDD2BF', flexShrink: 0 }}
                            />
                            <div style={{ maxWidth: 250, minWidth: 0 }}>
                              <div style={{ fontWeight: 800, color: '#0F2744', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => onViewDetails(opp)}>
                                {opp.title}
                              </div>
                              <div style={{ fontSize: 11, color: '#5A6B82', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <Building2 style={{ width: 12, height: 12, color: '#C26D38' }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.provider}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="admin-td" style={{ whiteSpace: 'nowrap' }}>
                          <span className={`opp-type-badge ${opp.type === 'Scholarship' ? 'scholarship' : 'internship'}`} style={{ fontSize: 10 }}>
                            {opp.type}
                          </span>
                        </td>

                        <td className="admin-td" style={{ fontSize: 12, color: '#5A6B82' }}>
                          {opp.category}
                        </td>

                        <td className="admin-td" style={{ fontWeight: 700, color: '#0F2744' }}>
                          {opp.awardAmount}
                        </td>

                        <td className="admin-td" style={{ fontSize: 12, color: '#5A6B82' }}>
                          {formattedDate}
                        </td>

                        <td className="admin-td" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => onViewDetails(opp)}
                              className="admin-action-preview"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 9px', borderRadius: 8, background: '#FAF7F2', border: '1px solid #DDD2BF', cursor: 'pointer', color: '#5A6B82', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}
                              title="Preview full opportunity details"
                            >
                              <Eye style={{ width: 14, height: 14 }} />
                              <span>Preview</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(opp)}
                              className="admin-action-edit"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 9px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', cursor: 'pointer', color: '#1E40AF', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}
                              title="Edit this opportunity"
                            >
                              <Edit3 style={{ width: 14, height: 14 }} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOpportunity(opp)}
                              className="admin-action-delete"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 9px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', cursor: 'pointer', color: '#DC2626', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}
                              title="Delete this opportunity from MongoDB"
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: 36, textAlign: 'center', color: '#94A3B8' }}>
                      No opportunities match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {activeTab === 'insights' && (
        <div className="admin-surface admin-insights-surface">
          <div className="admin-insights-header">
            <div>
              <h3>Audience & Listing Insights</h3>
              <p>Google-verified matcher accounts and opportunity detail opens.</p>
            </div>
            <button type="button" className="admin-insights-refresh" onClick={loadInsights} disabled={loadingMatcherContacts}>
              <RefreshCw size={14} className={loadingMatcherContacts ? 'admin-refresh-spinning' : ''} />
              Refresh
            </button>
          </div>

          <div className="admin-insight-summary">
            <strong>{loadingMatcherContacts ? '…' : matcherContactCount}</strong>
            <span>Unique Google-verified matcher accounts</span>
          </div>

          {matcherContactsError && <p className="admin-insights-error" role="alert">{matcherContactsError}</p>}

          <section className="admin-insights-section">
            <div className="admin-insights-section-heading">
              <div>
                <h4><Users size={16} /> Matcher Users</h4>
                <p>Only the profile fields users agreed to save are shown.</p>
              </div>
            </div>
            <div className="admin-insights-table-wrap">
              <table className="admin-table admin-insights-table matcher-contacts-table">
                <thead>
                  <tr>
                    <th className="admin-th">Verified Gmail</th>
                    <th className="admin-th">Phone</th>
                    <th className="admin-th">Highest Degree</th>
                    <th className="admin-th">Preferred Country</th>
                    <th className="admin-th">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingMatcherContacts ? (
                    <tr><td className="admin-td admin-insights-empty" colSpan={5}>Loading matcher users…</td></tr>
                  ) : matcherContacts.length ? matcherContacts.map((contact) => (
                    <tr key={contact.email}>
                      <td className="admin-td">{contact.email}</td>
                      <td className="admin-td">{contact.phone}</td>
                      <td className="admin-td">{contact.highestDegree}</td>
                      <td className="admin-td">{contact.desiredCountry}</td>
                      <td className="admin-td">{contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  )) : (
                    <tr><td className="admin-td admin-insights-empty" colSpan={5}>No verified matcher accounts yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-insights-section">
            <div className="admin-insights-section-heading">
              <div>
                <h4><TrendingUp size={16} /> Most Viewed Opportunities</h4>
                <p>Ranked by times a visitor opened the full detail page.</p>
              </div>
            </div>
            <div className="admin-popular-grid">
              <div>
                <h5>Scholarships</h5>
                {renderTopViewedTable('Scholarship')}
              </div>
              <div>
                <h5>Internships</h5>
                {renderTopViewedTable('Internship')}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: POST / EDIT OPPORTUNITY FORM */}
      {/* ========================================================= */}
      {activeTab === 'post' && (
        <div className="admin-surface admin-editor-surface">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #F4EFE6', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 20, fontWeight: 800, color: '#0F2744', margin: 0 }}>
                {editingOpp ? `Edit Opportunity: ${editingOpp.title}` : 'Publish New Scholarship or Internship'}
              </h3>
              <p style={{ fontSize: 12, color: '#5A6B82', marginTop: 2, margin: 0 }}>
                Fill in the verified criteria, photo, benefits, and dates to publish live to MongoDB.
              </p>
            </div>
            {editingOpp && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{ fontSize: 12, fontWeight: 700, color: '#5A6B82', background: 'transparent', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 14 }}>
              <div>
                <label className="admin-label">Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="admin-select"
                  style={{ fontWeight: 700 }}
                >
                  <option value="Scholarship">Scholarship</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="admin-label">Opportunity Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Rhodes Scholarship at Oxford University"
                  required
                  className="admin-input"
                />
              </div>

              <div>
                <label className="admin-label">Provider / Organization *</label>
                <input
                  type="text"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  placeholder="e.g. University of Oxford / Google LLC"
                  required
                  className="admin-input"
                />
              </div>
            </div>

            {/* Photo Selector */}
            <div className="admin-photo-selector" style={{ padding: 16, borderRadius: 14, background: '#FAF7F2', border: '1px solid #DDD2BF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label className="admin-label" style={{ margin: 0 }}>
                  Cover Photo * (Select Preset, Upload, or Paste URL)
                </label>
                <label className="admin-upload-control" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: '#FFFFFF',
                  border: '1px solid #DDD2BF',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0F2744',
                  cursor: 'pointer'
                }}>
                  <Upload style={{ width: 14, height: 14, color: '#C26D38' }} />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload Device File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {/* Preset Gallery */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
                {photoPresets.map((preset, idx) => {
                  const isSelected = formData.coverPhoto === preset.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, coverPhoto: preset.url }))}
                      className="admin-photo-preset"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: 6,
                        borderRadius: 10,
                        border: isSelected ? '2px solid #0F2744' : '1px solid #DDD2BF',
                        background: isSelected ? '#FFFFFF' : '#FAF7F2',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.label} 
                        style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>

             <input
  type="text"
  name="coverPhoto"
  value={formData.coverPhoto}
  onChange={handleChange}
  placeholder="Or paste custom image URL (https://...)"
  className="admin-input"
  style={{ background: '#FFFFFF', height: 38, fontSize: 12 }}
/>
            </div>

            {/* Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <div>
                <label className="admin-label">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="admin-select"
                >
                  <option value="Computer Science & Tech">Computer Science & Tech</option>
                  <option value="Engineering & Robotics">Engineering & Robotics</option>
                  <option value="Business & Finance">Business & Finance</option>
                  <option value="Medicine & Healthcare">Medicine & Healthcare</option>
                  <option value="Sciences & Mathematics">Sciences & Mathematics</option>
                  <option value="Social Sciences & Law">Social Sciences & Law</option>
                  <option value="General & Interdisciplinary">General & Interdisciplinary</option>
                </select>
              </div>

              <div>
                <label className="admin-label">Award / Stipend Amount *</label>
                <input
                  type="text"
                  name="awardAmount"
                  value={formData.awardAmount}
                  onChange={handleChange}
                  placeholder="e.g. Fully Funded or $9,200 / Month"
                  required
                  className="admin-input"
                />
              </div>

              <div>
                <label className="admin-label">Application Deadline *</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                  className="admin-input"
                />
              </div>
            </div>

            {/* Row 4 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <div>
                <label className="admin-label">Location (City, Country) *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Oxford, UK or Mountain View, CA"
                  required
                  className="admin-input"
                />
              </div>

              <div>
                <label className="admin-label">Work Mode *</label>
                <select
                  name="workMode"
                  value={formData.workMode}
                  onChange={handleChange}
                  className="admin-select"
                >
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="admin-label">Degree Level *</label>
                <select
                  name="degreeLevel"
                  value={formData.degreeLevel}
                  onChange={handleChange}
                  className="admin-select"
                >
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate / Master">Postgraduate / Master</option>
                  <option value="PhD / Doctoral">PhD / Doctoral</option>
                  <option value="High School">High School</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>

            {/* Full Description */}
            <div>
              <label className="admin-label">Full Detailed Description *</label>
              <textarea
                name="fullDescription"
                rows={4}
                value={formData.fullDescription}
                onChange={handleChange}
                placeholder="Comprehensive description detailing curriculum, mentorship, host institution, duties..."
                required
                className="admin-textarea"
              />
            </div>

            {/* Multi-line Lists */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <div>
                <label className="admin-label">Eligibility Criteria (1 per line)</label>
                <textarea
                  name="eligibilityText"
                  rows={4}
                  value={formData.eligibilityText}
                  onChange={handleChange}
                  placeholder="First class undergraduate degree&#10;Proficiency in English&#10;Citizens of all countries"
                  className="admin-textarea"
                  style={{ fontSize: 12 }}
                />
              </div>

              <div>
                <label className="admin-label">Benefits & Coverage (1 per line)</label>
                <textarea
                  name="benefitsText"
                  rows={4}
                  value={formData.benefitsText}
                  onChange={handleChange}
                  placeholder="100% full tuition waiver&#10;$2,000 monthly living stipend&#10;Round-trip flight tickets"
                  className="admin-textarea"
                  style={{ fontSize: 12 }}
                />
              </div>

              <div>
                <label className="admin-label">Required Documents (1 per line)</label>
                <textarea
                  name="requirementsText"
                  rows={4}
                  value={formData.requirementsText}
                  onChange={handleChange}
                  placeholder="Academic transcripts&#10;Updated Curriculum Vitae&#10;Statement of Purpose"
                  className="admin-textarea"
                  style={{ fontSize: 12 }}
                />
              </div>
            </div>

            {/* Links & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px', gap: 14, alignItems: 'center' }}>
              <div>
                <label className="admin-label">Official Application URL</label>
                <input
                  type="url"
                  name="applicationUrl"
                  value={formData.applicationUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="admin-input"
                />
              </div>

              <div>
                <label className="admin-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="admin-select"
                >
                  <option value="Active">Active</option>
                  <option value="Closing Soon">Closing Soon</option>
                  <option value="Closed">Closed</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div style={{ paddingTop: 18 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#0F2744' }}>
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Mark Featured</span>
                </label>
              </div>
            </div>

            <div className="admin-tags-field">
              <label className="admin-label" htmlFor="opportunity-tags">Tags</label>
              <div className="admin-tags-entry">
                <input
                  id="opportunity-tags"
                  type="text"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ',') handleAddTag(event);
                  }}
                  placeholder="Type a tag and press Enter"
                  className="admin-input"
                />
                <button type="button" onClick={handleAddTag} className="admin-add-tag-btn">
                  <Plus size={14} /> Add tag
                </button>
              </div>
              <div className="admin-tag-chips">
                {formData.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                  <span key={tag.toLowerCase()} className="admin-tag-chip">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} aria-label={`Remove ${tag} tag`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: '1px solid #F4EFE6' }}>
              {editingOpp && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #DDD2BF', background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 24px',
                  borderRadius: 12,
                  background: '#0F2744',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <CheckCircle2 style={{ width: 16, height: 16, color: '#C26D38' }} />
                <span>{editingOpp ? 'Update in MongoDB' : 'Publish Opportunity to Portal'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {activeTab === 'finder' && (
        <OpportunityFinder showToast={showToast} />
      )}

      {/* ========================================================= */}
      {/* TAB 3: BANNER & HEIGHTS CUSTOMIZER */}
      {/* ========================================================= */}
      {activeTab === 'banner' && (
        <div className="admin-surface">
          <div style={{ paddingBottom: 16, borderBottom: '1px solid #F4EFE6', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 20, fontWeight: 800, color: '#0F2744', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LayoutTemplate style={{ width: 20, height: 20, color: '#C26D38' }} />
              <span>Hero Banner Text & Heights Customizer</span>
            </h3>
            <p style={{ fontSize: 12, color: '#5A6B82', marginTop: 2, margin: 0 }}>
              Customize the main homepage headline, amber highlights, announcement pill, banner vertical height, and metric stats.
            </p>
          </div>

          <form onSubmit={handleSaveBanner} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Banner Height Selection */}
            <div className="admin-banner-height-panel" style={{ padding: 16, borderRadius: 14, background: '#FAF7F2', border: '1px solid #DDD2BF' }}>
              <label className="admin-label" style={{ marginBottom: 8 }}>
                Banner Vertical Height / Spacing *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { id: 'compact', title: 'Compact Height', desc: 'Sleek & minimal (leaves maximum screen for cards)' },
                  { id: 'normal', title: 'Normal Height (Recommended)', desc: 'Balanced collegiate presentation' },
                  { id: 'spacious', title: 'Spacious Height', desc: 'Prominent grand hero with roomy padding' },
                ].map(opt => {
                  const isSelected = bannerForm.bannerHeight === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setBannerForm(prev => ({ ...prev, bannerHeight: opt.id }))}
                      className="admin-height-option"
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: isSelected ? '2px solid #0F2744' : '1px solid #DDD2BF',
                        background: isSelected ? '#0F2744' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#1E293B',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{opt.title}</div>
                      <div style={{ fontSize: 11, color: isSelected ? '#DDD2BF' : '#64748B' }}>{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="admin-banner-image-editor">
              <div>
                <label className="admin-label" htmlFor="banner-background-image">Homepage Background Image</label>
                <div className="admin-banner-image-controls">
                  <input
                    id="banner-background-image"
                    type="text"
                    name="backgroundImage"
                    value={bannerForm.backgroundImage}
                    onChange={handleBannerChange}
                    placeholder="https://example.com/campus.jpg"
                    className="admin-input"
                  />
                  <label className="admin-banner-upload-btn">
                    <Upload style={{ width: 14, height: 14 }} />
                    <span>{uploadingBannerImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleBannerImageUpload(event, 'backgroundImage')}
                      disabled={uploadingBannerImage}
                    />
                  </label>
                </div>
                <p className="admin-banner-image-help">Paste an image URL or upload a file. Save banner settings to publish the preview.</p>
                <div className="admin-banner-image-fit">
                  <label className="admin-label" htmlFor="banner-background-fit">Image Fit</label>
                  <select
                    id="banner-background-fit"
                    name="backgroundImageFit"
                    value={bannerForm.backgroundImageFit}
                    onChange={handleBannerChange}
                    className="admin-select"
                  >
                    <option value="cover">Cover (fill and crop)</option>
                    <option value="contain">Fit (show full image)</option>
                    <option value="fill">Fill (stretch)</option>
                  </select>
                </div>
              </div>
              <div className="admin-banner-image-preview">
                {bannerForm.backgroundImage && (
                  <img
                    src={bannerForm.backgroundImage}
                    alt="Homepage hero background preview"
                    style={{ objectFit: bannerForm.backgroundImageFit === 'fill' ? 'fill' : bannerForm.backgroundImageFit === 'contain' ? 'contain' : 'cover' }}
                  />
                )}
              </div>
            </div>

            <div className="admin-type-banner-images">
              {[
                { field: 'scholarshipBannerImage', label: 'Scholarships Page Banner Image' },
                { field: 'internshipBannerImage', label: 'Internships Page Banner Image' }
              ].map(({ field, label }) => (
                <div className="admin-banner-image-editor" key={field}>
                  <div>
                    <label className="admin-label" htmlFor={field}>{label}</label>
                    <div className="admin-banner-image-controls">
                      <input
                        id={field}
                        type="text"
                        name={field}
                        value={bannerForm[field]}
                        onChange={handleBannerChange}
                        placeholder="https://example.com/image.jpg"
                        className="admin-input"
                      />
                      <label className="admin-banner-upload-btn">
                        <Upload style={{ width: 14, height: 14 }} />
                        <span>{uploadingBannerImage ? 'Uploading...' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleBannerImageUpload(event, field)}
                          disabled={uploadingBannerImage}
                        />
                      </label>
                    </div>
                    <p className="admin-banner-image-help">Change the image shown on the {field === 'scholarshipBannerImage' ? 'Scholarships' : 'Internships'} page header.</p>
                  </div>
                  <div className="admin-banner-image-preview">
                    {bannerForm[field] && (
                      <img
                        src={bannerForm[field]}
                        alt={`${label} preview`}
                        style={{ objectFit: bannerForm.typeBannerImageFit === 'fill' ? 'fill' : bannerForm.typeBannerImageFit === 'contain' ? 'contain' : 'cover' }}
                      />
                    )}
                  </div>
                </div>
              ))}
              <div className="admin-banner-image-fit">
                <label className="admin-label" htmlFor="type-banner-image-fit">Scholarships & Internships Image Fit</label>
                <select
                  id="type-banner-image-fit"
                  name="typeBannerImageFit"
                  value={bannerForm.typeBannerImageFit}
                  onChange={handleBannerChange}
                  className="admin-select"
                >
                  <option value="cover">Cover (fill and crop)</option>
                  <option value="contain">Fit (show full image)</option>
                  <option value="fill">Fill (stretch)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="admin-label">Top Announcement Pill Badge Text</label>
              <input
                type="text"
                name="badgeText"
                value={bannerForm.badgeText}
                onChange={handleBannerChange}
                required
                className="admin-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
              <div>
                <label className="admin-label">Main Headline *</label>
                <input
                  type="text"
                  name="headline"
                  value={bannerForm.headline}
                  onChange={handleBannerChange}
                  required
                  className="admin-input"
                />
              </div>

              <div>
                <label className="admin-label">Highlighted Words in Sandalwood Gold</label>
                <input
                  type="text"
                  name="headlineHighlight"
                  value={bannerForm.headlineHighlight}
                  onChange={handleBannerChange}
                  className="admin-input"
                />
              </div>
            </div>

            <div>
              <label className="admin-label">Banner Subtitle / Description *</label>
              <textarea
                name="subtitle"
                rows={2}
                value={bannerForm.subtitle}
                onChange={handleBannerChange}
                required
                className="admin-textarea"
              />
            </div>

            <div>
              <label className="admin-label">Trending Filter Tags (Comma separated)</label>
              <input
                type="text"
                name="trendingTagsText"
                value={bannerForm.trendingTagsText}
                onChange={handleBannerChange}
                className="admin-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 24px',
                  borderRadius: 12,
                  background: '#0F2744',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <CheckCircle2 style={{ width: 16, height: 16, color: '#C26D38' }} />
                <span>Save Banner Settings</span>
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
