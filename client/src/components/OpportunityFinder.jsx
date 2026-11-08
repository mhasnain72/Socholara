import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, RefreshCw, XCircle } from 'lucide-react';

const AGENT_URL = '/api/opportunity-agent';

const request = async (path, options = {}) => {
  const response = await fetch(`${AGENT_URL}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || body.message || `Opportunity agent request failed (HTTP ${response.status})`);
  }
  return body;
};

const formatDeadline = (value) => value
  ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  : 'Not specified';

export default function OpportunityFinder({ showToast }) {
  const [type, setType] = useState('scholarship');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agentStatus, setAgentStatus] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [queue, status] = await Promise.all([
        request(`/opportunities?type=${type}&status=${statusFilter}`),
        request('/status')
      ]);
      setItems(queue);
      setAgentStatus(status);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, type]);

  useEffect(() => { load(); }, [load]);

  const review = async (id, status) => {
    setBusyId(id);
    try {
      await request(`/opportunities/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      setItems((current) => current.filter((item) => item.id !== id));
      showToast?.(status === 'approved' ? 'Opportunity approved and published.' : 'Opportunity rejected.', 'success');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-surface opportunity-finder-surface">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid #F4EFE6', paddingBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#0F2744' }}>AI Opportunity Finder</h3>
          <p style={{ margin: '4px 0 0', color: '#5A6B82', fontSize: 12 }}>Verified discoveries waiting for human approval.</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="admin-tab-btn" style={{ background: '#FAF7F2', color: '#44150f', border: '1px solid #DDD2BF' }}>
          <RefreshCw size={14} className={loading ? 'admin-refresh-spinning' : ''} /> Refresh
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        {['scholarship', 'internship'].map((option) => (
          <button type="button" key={option} onClick={() => setType(option)} className={`admin-tab-btn ${type === option ? 'active' : ''}`}>
            {option === 'scholarship' ? 'Scholarships' : 'Internships'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          ['pending_review', 'Needs review']
        ].map(([option, label]) => (
          <button type="button" key={option} onClick={() => setStatusFilter(option)} className={`admin-tab-btn ${statusFilter === option ? 'active' : ''}`}>
            {label}
          </button>
        ))}
      </div>
      {agentStatus && (
        <div className="opportunity-finder-status" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: 12, marginBottom: 16, borderRadius: 10, background: '#F0F6FC', color: '#0F2744', fontSize: 12 }}>
          <strong>Agent: {agentStatus.status}</strong>
          <span>Total: {agentStatus.counts.total}</span>
          <span>Pending: {agentStatus.counts.pending_review}</span>
          <span>Scholarships: {agentStatus.counts.scholarships ?? 0}</span>
          <span>Internships: {agentStatus.counts.internships ?? 0}</span>
          <span>Schedule: every {agentStatus.scheduler_interval_minutes} min</span>
        </div>
      )}
      {error && <p role="alert" style={{ color: '#B91C1C', fontSize: 13 }}>{error}</p>}
      {!loading && !error && items.length === 0 && <p style={{ color: '#5A6B82' }}>
        {statusFilter === 'pending_review'
          ? `No fully verified ${type} opportunities are currently awaiting review.`
          : `No fully verified ${type} opportunities found.`}
      </p>}
      <div style={{ display: 'grid', gap: 14 }}>
        {items.map((item) => (
          <article key={item.id} className="opportunity-finder-card" style={{ border: '1px solid #DDD2BF', borderRadius: 14, padding: 18, background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h4 style={{ margin: 0, color: '#0F2744' }}>{item.title}</h4>
                <p style={{ margin: '5px 0', color: '#5A6B82', fontSize: 12 }}>{item.source} · Deadline: {formatDeadline(item.deadline)}</p>
              </div>
              <span style={{ color: item.verification_status === 'verified' ? '#15803D' : '#B45309', fontSize: 11, fontWeight: 700 }}>
                {item.status.replace('_', ' ')} · AI {Math.round(item.ai_confidence * 100)}%
              </span>
            </div>
            <div className="opportunity-finder-verification" style={{ marginTop: 10, padding: 10, borderRadius: 8, background: item.verification_status === 'verified' ? '#F0FDF4' : '#FFF7ED', color: item.verification_status === 'verified' ? '#166534' : '#9A3412', fontSize: 12 }}>
              <strong>Original source check: {item.verification_status}</strong>
              {item.verification_note && <div style={{ marginTop: 3 }}>{item.verification_note}</div>}
              {item.verified_at && <div style={{ marginTop: 3 }}>Checked: {new Date(item.verified_at).toLocaleString()}</div>}
            </div>
            <div className="opportunity-finder-official" style={{ marginTop: 8, padding: 10, borderRadius: 8, background: item.official_verification_status === 'verified' ? '#F0FDF4' : '#F8FAFC', color: item.official_verification_status === 'verified' ? '#166534' : '#475569', fontSize: 12 }}>
              <strong>Official application site: {item.official_verification_status || 'not found'}</strong>
              {item.official_url && <div style={{ marginTop: 3, wordBreak: 'break-all' }}>{item.official_url}</div>}
            </div>
            <p style={{ color: '#334155', fontSize: 13, margin: '12px 0' }}>{item.summary}</p>
            {item.eligibility && <p style={{ color: '#5A6B82', fontSize: 12 }}><strong>Eligibility:</strong> {item.eligibility}</p>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <a href={item.verification_url || item.source_url} target="_blank" rel="noreferrer" className="admin-tab-btn" style={{ color: '#0F2744', border: '1px solid #DDD2BF' }}><ExternalLink size={14} /> Open original source</a>
              <button type="button" disabled={busyId === item.id} onClick={() => review(item.id, 'approved')} className="admin-tab-btn" style={{ background: '#166534', color: '#FFFFFF' }}><CheckCircle2 size={14} /> Approve & Publish</button>
              <button type="button" disabled={busyId === item.id} onClick={() => review(item.id, 'rejected')} className="admin-tab-btn" style={{ background: '#991B1B', color: '#FFFFFF' }}><XCircle size={14} /> Reject</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
