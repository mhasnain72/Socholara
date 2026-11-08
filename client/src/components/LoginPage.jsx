import React, { useState } from 'react';
import { ArrowLeft, KeyRound, Lock, ShieldCheck, CheckCircle2, MailCheck } from 'lucide-react';
import { API } from '../utils/api';

export const LoginPage = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('credentials');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.requestAdminCode(email, password);
      setStep('code');
    } catch (loginError) {
      setError(loginError.message || 'Admin sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.verifyAdminCode(code);
      onLoginSuccess();
    } catch (loginError) {
      setError(loginError.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-shell">
      <div className="login-page-backdrop" />

      <div className="login-page-container">
        <button type="button" onClick={onBack} className="login-page-back-btn">
          <ArrowLeft size={16} />
          <span>Back to website</span>
        </button>

        <div className="login-page-card">
          <div className="login-page-visual">
            <div className="login-page-brand-mark">
              <ShieldCheck size={18} />
              <span>SCHOLARA <b>ADMIN</b></span>
            </div>
            <div className="login-page-badge">
              <ShieldCheck size={15} />
              <span>Protected Admin Access</span>
            </div>

            <h1>Portal control center</h1>
            <p>
              Manage verified listings, update the homepage banner, and review applications from a single dashboard.
            </p>

            <div className="login-page-benefits">
              <div>
                <CheckCircle2 size={16} />
                <span>Publish & edit listings</span>
              </div>
              <div>
                <CheckCircle2 size={16} />
                <span>Monitor scholarship applications</span>
              </div>
              <div>
                <CheckCircle2 size={16} />
                <span>Update homepage branding</span>
              </div>
            </div>
          </div>

          <div className="login-page-form-wrap">
            <div className="login-page-header">
              <div className="login-page-icon">
                <Lock size={22} />
              </div>
              <div>
                <p className="login-page-kicker">Secure admin login</p>
                <h2>Unlock dashboard</h2>
              </div>
            </div>
            <div className="login-page-stepper" aria-label="Login progress">
              <span className={step === 'credentials' ? 'active' : 'complete'}>1. Credentials</span>
              <i />
              <span className={step === 'code' ? 'active' : ''}>2. Verification</span>
            </div>

            {step === 'credentials' ? <form onSubmit={handleLogin} className="login-page-form">
              {error && <div className="login-page-error">{error}</div>}

              <label className="login-page-label">Admin email</label>
              <div className="login-page-input-wrap">
                <MailCheck className="login-page-input-icon" size={16} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" autoFocus required autoComplete="email" />
              </div>

              <label className="login-page-label">Admin password</label>
              <div className="login-page-input-wrap">
                <KeyRound className="login-page-input-icon" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter admin password"
                  required
                  autoComplete="current-password"
                />
              </div>

                  <button type="submit" className="login-page-submit-btn" disabled={loading}>
                    <Lock size={16} />
                    <span>{loading ? 'Sending code…' : 'Send verification code'}</span>
              </button>
              <p className="login-page-security-note"><ShieldCheck size={14} /> Two-step verification keeps your portal protected.</p>
            </form> : <form onSubmit={handleVerifyCode} className="login-page-form">
              {error && <div className="login-page-error">{error}</div>}
              <p className="text-sm text-slate-600">A 6-digit verification code was sent to your admin email.</p>
              <label className="login-page-label">Verification code</label>
              <div className="login-page-input-wrap">
                <MailCheck className="login-page-input-icon" size={16} />
                <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="Enter 6-digit code" autoFocus required />
              </div>
              <button type="submit" className="login-page-submit-btn" disabled={loading}>
                <ShieldCheck size={16} />
                <span>{loading ? 'Checking code…' : 'Verify & open admin portal'}</span>
              </button>
              <button type="button" className="text-xs text-[#0F2744] underline" onClick={() => { setStep('credentials'); setCode(''); setError(''); }}>
                Use different credentials
              </button>
            </form>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
