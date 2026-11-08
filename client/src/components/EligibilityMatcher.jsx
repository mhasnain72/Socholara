import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronLeft,
  Download,
  Info,
  Plus,
  Sparkles,
  Target,
  X
} from 'lucide-react';
import OpportunityCard from './OpportunityCard';
import { API } from '../utils/api';

const FIELD_OPTIONS = [
  'Any field',
  'Computer Science & Tech',
  'Engineering & Robotics',
  'Business & Finance',
  'Medicine & Healthcare',
  'Arts & Humanities',
  'Sciences & Mathematics',
  'Social Sciences & Law',
  'General & Interdisciplinary'
];

const PROGRAM_OPTIONS = [
  { value: 'Bachelor\'s', label: "Bachelor's" },
  { value: 'Master\'s', label: "Master's" },
  { value: 'PhD', label: 'PhD / Doctorate' }
];

const createEducation = () => ({
  id: `${Date.now()}-${Math.random()}`,
  degree: '',
  major: '',
  institution: '',
  location: '',
  obtainedMarks: '',
  totalMarks: '',
  passingDate: ''
});

const createExperience = () => ({
  id: `${Date.now()}-${Math.random()}`,
  role: '',
  organization: '',
  duration: '',
  description: ''
});

const createInitialProfile = () => ({
  name: '',
  email: '',
  confirmEmail: '',
  phone: '',
  nationality: '',
  education: [createEducation()],
  experience: [],
  englishTest: '',
  englishScore: '',
  englishTestScores: { reading: '', listening: '', writing: '', speaking: '' },
  desiredProgram: '',
  studyField: '',
  preferredCountry: '',
  fundingPreference: '',
  additionalInfo: ''
});

const getOpportunityText = (opportunity) => [
  opportunity.title,
  opportunity.shortDescription,
  opportunity.fullDescription,
  opportunity.category,
  opportunity.degreeLevel,
  opportunity.location,
  opportunity.awardAmount,
  ...(Array.isArray(opportunity.tags) ? opportunity.tags : []),
  ...(Array.isArray(opportunity.eligibility) ? opportunity.eligibility : []),
  ...(Array.isArray(opportunity.requirements) ? opportunity.requirements : []),
  ...(Array.isArray(opportunity.benefits) ? opportunity.benefits : [])
].filter(Boolean).join(' ').toLowerCase();

const scoreOpportunity = (opportunity, profile) => {
  const text = getOpportunityText(opportunity);
  let score = 42;
  const reasons = [];
  const gaps = [];
  const degree = (opportunity.degreeLevel || 'All Levels').toLowerCase();
  const isAllLevels = degree.includes('all level');
  const degreeMatches = profile.desiredProgram === 'Bachelor\'s'
    ? degree.includes('undergraduate') || degree.includes('bachelor')
    : profile.desiredProgram === 'Master\'s'
      ? degree.includes('postgraduate') || degree.includes('master')
      : degree.includes('phd') || degree.includes('doctoral') || degree.includes('doctorate');

  if (degreeMatches || isAllLevels) {
    score += degreeMatches ? 25 : 18;
    reasons.push(`The listed study level supports ${profile.desiredProgram}.`);
  } else {
    score -= 15;
    gaps.push(`Check whether the provider accepts ${profile.desiredProgram} applicants.`);
  }

  const latestDegree = (profile.education.at(-1)?.degree || '').toLowerCase();
  const priorStudyMatches = profile.desiredProgram === 'Bachelor\'s'
    ? /high school|secondary|associate/.test(latestDegree)
    : profile.desiredProgram === 'Master\'s'
      ? /bachelor|undergraduate/.test(latestDegree)
      : /master|postgraduate/.test(latestDegree);
  if (priorStudyMatches) {
    score += 5;
    reasons.push(`Your latest education is a common pathway into ${profile.desiredProgram} study.`);
  }

  if (profile.education.some((entry) => entry.obtainedMarks.trim())) {
    score += 3;
    reasons.push('Academic marks are included in your profile for provider-specific review.');
  }

  if (profile.studyField === 'Any field') {
    score += 12;
    reasons.push('The matcher considered scholarships across all study fields.');
  } else if (opportunity.category === profile.studyField) {
    score += 25;
    reasons.push(`The scholarship category matches ${profile.studyField}.`);
  } else if (text.includes(profile.studyField.toLowerCase())) {
    score += 17;
    reasons.push(`The listing mentions your field, ${profile.studyField}.`);
  } else {
    score -= 5;
    gaps.push(`The listed field may differ from ${profile.studyField}; review the provider's subject rules.`);
  }

  const majorTerms = profile.education
    .flatMap((entry) => entry.major.toLowerCase().split(/[^a-z0-9]+/))
    .filter((term) => term.length > 3);
  const matchingMajorTerms = [...new Set(majorTerms)].filter((term) => text.includes(term));
  if (matchingMajorTerms.length) {
    score += Math.min(8, matchingMajorTerms.length * 3);
    reasons.push(`Your education field overlaps with listing details: ${matchingMajorTerms.slice(0, 3).join(', ')}.`);
  }

  const experienceTerms = profile.experience
    .flatMap((entry) => [entry.role, entry.organization, entry.description].join(' ').toLowerCase().split(/[^a-z0-9]+/))
    .filter((term) => term.length > 3);
  const matchingExperienceTerms = [...new Set(experienceTerms)].filter((term) => text.includes(term));
  if (matchingExperienceTerms.length) {
    score += Math.min(8, matchingExperienceTerms.length * 2);
    reasons.push(`Your experience overlaps with listing details: ${matchingExperienceTerms.slice(0, 3).join(', ')}.`);
  }

  const location = (opportunity.location || '').toLowerCase();
  const preferredCountry = profile.preferredCountry.trim().toLowerCase();
  const broadLocation = /global|worldwide|international|multiple countr|remote/i.test(location);
  if (preferredCountry) {
    if (location.includes(preferredCountry) || text.includes(preferredCountry)) {
      score += 15;
      reasons.push(`The listing mentions ${profile.preferredCountry}.`);
    } else if (broadLocation) {
      score += 10;
      reasons.push('The opportunity has a broad or international location.');
    } else {
      score -= 8;
      gaps.push(`Confirm that applicants can study in ${profile.preferredCountry}.`);
    }
  } else if (broadLocation) {
    score += 8;
    reasons.push('The opportunity is listed as international or broad in location.');
  }

  const nationality = profile.nationality.trim().toLowerCase();
  if (nationality && text.includes(nationality)) {
    score += 8;
    reasons.push(`The listing mentions applicants from ${profile.nationality}.`);
  } else if (nationality && /international student|all nationalit|open worldwide/i.test(text)) {
    score += 5;
    reasons.push('The listing appears to consider international applicants.');
  }

  const requiresEnglishTest = /ielts|toefl|pte academic|duolingo english|english proficiency|english language test/i.test(text);
  if (requiresEnglishTest && profile.englishTest === 'Not taken') {
    score -= 10;
    gaps.push('The listing mentions English-language testing; verify whether a test is required for you.');
  } else if (requiresEnglishTest && profile.englishTest !== 'Not taken') {
    const testKey = profile.englishTest.toLowerCase().split(' ')[0];
    const scoreRequirement = text.match(new RegExp(`${testKey}[^\\d]{0,30}(\\d+(?:\\.\\d+)?)`, 'i'));
    const requiredScore = scoreRequirement ? Number(scoreRequirement[1]) : null;
    const userScore = Number.parseFloat(profile.englishScore);

    if (Number.isFinite(requiredScore) && Number.isFinite(userScore)) {
      if (userScore >= requiredScore) {
        score += 10;
        reasons.push(`Your ${profile.englishTest} score meets the listed minimum of ${requiredScore}.`);
      } else {
        score -= 8;
        gaps.push(`The listing mentions a ${profile.englishTest} minimum of ${requiredScore}; your score is ${profile.englishScore}.`);
      }
    } else {
      score += 3;
      gaps.push(`The listing mentions English testing but does not state a clear ${profile.englishTest} minimum. Confirm the requirement with the provider.`);
    }
  } else if (profile.englishTest !== 'Not taken') {
    score += 1;
  }

  const awardText = [opportunity.awardAmount, ...(Array.isArray(opportunity.benefits) ? opportunity.benefits : [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const isFullyFunded = /fully funded|full funding|full tuition|tuition waiver|100% tuition/i.test(awardText);
  const isPartiallyFunded = /partial|partially funded|tuition reduction|percentage of tuition/i.test(awardText);
  if (profile.fundingPreference === 'Fully funded' && isFullyFunded) {
    score += 8;
    reasons.push('The funding details appear to fit your full-funding preference.');
  } else if (profile.fundingPreference === 'Fully funded' && !isFullyFunded) {
    score -= 4;
    gaps.push('The listing may not provide full funding; review its award details.');
  } else if (profile.fundingPreference === 'Partial funding' && isPartiallyFunded) {
    score += 8;
    reasons.push('The funding details appear to fit your partial-funding preference.');
  } else if (profile.fundingPreference === 'Partial funding' && isFullyFunded) {
    score += 4;
  }

  const extraTerms = profile.additionalInfo.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 3);
  const extraMatches = [...new Set(extraTerms)].filter((term) => text.includes(term));
  if (extraMatches.length) {
    score += Math.min(5, extraMatches.length * 2);
    reasons.push(`Your additional preferences match listing details: ${extraMatches.slice(0, 3).join(', ')}.`);
  }

  return {
    opportunity,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
    gaps
  };
};

const steps = ['Personal details', 'Education', 'English test', 'Study goals'];

export const EligibilityMatcher = ({
  opportunities = [],
  savedIds = [],
  onToggleBookmark,
  onViewDetails,
  onShare,
  verifiedUser,
  onVerified,
  onBack
}) => {
  const [profile, setProfile] = useState(createInitialProfile);
  const [activeStep, setActiveStep] = useState(0);
  const [validationMessage, setValidationMessage] = useState('');
  const [matches, setMatches] = useState(null);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [cvError, setCvError] = useState('');
  const [downloadingCv, setDownloadingCv] = useState(false);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

  const updateProfile = (name, value) => {
    setProfile((current) => ({ ...current, [name]: value }));
    setValidationMessage('');
  };

  const updateEducation = (id, name, value) => {
    setProfile((current) => ({
      ...current,
      education: current.education.map((entry) => entry.id === id ? { ...entry, [name]: value } : entry)
    }));
    setValidationMessage('');
  };

  const updateEnglishTestScore = (name, value) => {
    setProfile((current) => ({
      ...current,
      englishTestScores: { ...current.englishTestScores, [name]: value }
    }));
    setValidationMessage('');
  };

  const updateExperience = (id, name, value) => {
    setProfile((current) => ({
      ...current,
      experience: current.experience.map((entry) => entry.id === id ? { ...entry, [name]: value } : entry)
    }));
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!profile.name.trim() || !profile.email.trim() || !profile.confirmEmail.trim() || !profile.phone.trim() || !profile.nationality.trim()) {
        return 'Please complete your name, email, email confirmation, phone, and nationality.';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
        return 'Enter a valid email address.';
      }
      if (profile.email.trim().toLowerCase() !== profile.confirmEmail.trim().toLowerCase()) {
        return 'Email addresses do not match.';
      }
      if (profile.phone.replace(/\D/g, '').length < 7) {
        return 'Enter a valid phone number.';
      }
    }

    if (activeStep === 1 && profile.education.some((entry) =>
      [entry.degree, entry.major, entry.institution, entry.location, entry.obtainedMarks, entry.totalMarks, entry.passingDate]
        .some((value) => !value.trim())
    )) {
      return 'Complete every required field in each education record.';
    }

    if (activeStep === 2) {
      if (!profile.englishTest) return 'Select whether you have taken an English test.';
      if (profile.englishTest !== 'Not taken') {
        const missingModuleScore = ['IELTS', 'TOEFL'].includes(profile.englishTest)
          && Object.values(profile.englishTestScores).some((score) => !score.trim());
        if (!profile.englishScore.trim() || missingModuleScore) {
          return 'Enter your overall score and every required module score.';
        }
      }
    }

    if (activeStep === 3 && (!profile.desiredProgram || !profile.studyField || !profile.preferredCountry.trim() || !profile.fundingPreference)) {
      return 'Select your program, study field, preferred country, and funding preference.';
    }

    return '';
  };

  const getActiveScholarships = () => opportunities.filter((opportunity) => {
    if (opportunity.type !== 'Scholarship') return false;
    if (!['Active', 'Closing Soon'].includes(opportunity.status || 'Active')) return false;
    if (!opportunity.deadline) return true;
    const deadline = new Date(opportunity.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Number.isNaN(deadline.getTime()) || deadline >= today;
  });

  const findMatches = () => {
    const activeScholarships = getActiveScholarships();
    const rankedMatches = activeScholarships
      .map((opportunity) => scoreOpportunity(opportunity, profile))
      .sort((first, second) => second.score - first.score);
    setMatches(rankedMatches);
    setVerificationError('');
  };

  const verifyGoogleAccount = useCallback(async (credential) => {
    if (!credential || !matches) return;
    setVerifyingAccount(true);
    setVerificationError('');

    try {
      const result = await API.verifyMatcherAccount({
        idToken: credential,
        email: profile.email,
        phone: profile.phone,
        highestDegree: profile.education[0]?.degree || '',
        desiredCountry: profile.preferredCountry
      });
      onVerified?.(result.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setVerificationError(error.message || 'Google verification failed. Please try again.');
    } finally {
      setVerifyingAccount(false);
    }
  }, [matches, profile.email, onVerified]);

  useEffect(() => {
    if (!matches || !googleClientId || !googleButtonRef.current) return undefined;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => verifyGoogleAccount(response.credential),
        error_callback: () => setVerificationError('Google sign-in could not start. Please try again.')
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        width: 280
      });
    };

    const script = document.getElementById('google-identity-services');
    renderGoogleButton();
    script?.addEventListener('load', renderGoogleButton);

    return () => script?.removeEventListener('load', renderGoogleButton);
  }, [matches, googleClientId, verifyGoogleAccount]);

  const continueStep = () => {
    const error = validateStep();
    if (error) {
      setValidationMessage(error);
      return;
    }
    setValidationMessage('');
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const startOver = () => {
    setProfile(createInitialProfile());
    setActiveStep(0);
    setMatches(null);
    setVerificationError('');
    setValidationMessage('');
  };

  const getOverallScore = () => {
    if (!matches?.length) return 0;
    const topScores = matches.slice(0, 3).map((match) => match.score);
    return Math.round(topScores.reduce((total, score) => total + score, 0) / topScores.length);
  };

  const downloadCv = async () => {
    setDownloadingCv(true);
    setCvError('');

    try {
      const { jsPDF } = await import('jspdf');
      const document = new jsPDF();
      const pageWidth = document.internal.pageSize.getWidth();
      const pageHeight = document.internal.pageSize.getHeight();
      const left = 18;
      const textWidth = pageWidth - left * 2;
      const cursor = { y: 18 };

      document.setFillColor(15, 39, 68);
      document.rect(0, 0, pageWidth, 32, 'F');
      document.setTextColor(255, 255, 255);
      document.setFont('helvetica', 'bold');
      document.setFontSize(18);
      document.text(profile.name, left, 15);
      document.setFont('helvetica', 'normal');
      document.setFontSize(9);
      document.text('Scholarship Eligibility Profile', left, 24);
      document.setTextColor(30, 41, 59);
      cursor.y = 42;

      const ensureSpace = (height) => {
        if (cursor.y + height > pageHeight - 16) {
          document.addPage();
          cursor.y = 18;
        }
      };

      const addSection = (title) => {
        ensureSpace(14);
        document.setFont('helvetica', 'bold');
        document.setFontSize(12);
        document.setTextColor(64, 93, 107);
        document.text(title, left, cursor.y);
        cursor.y += 7;
        document.setDrawColor(231, 224, 214);
        document.line(left, cursor.y - 3, pageWidth - left, cursor.y - 3);
      };

      const addField = (label, value) => {
        if (!value) return;
        const lines = document.splitTextToSize(`${label}: ${value}`, textWidth);
        ensureSpace(lines.length * 5 + 3);
        document.setFont('helvetica', 'normal');
        document.setFontSize(9);
        document.setTextColor(51, 65, 85);
        document.text(lines, left, cursor.y);
        cursor.y += lines.length * 5 + 2;
      };

      addSection('PERSONAL DETAILS');
      addField('Email', profile.email);
      addField('Phone', profile.phone);
      addField('Nationality', profile.nationality);

      addSection('EDUCATION');
      profile.education.forEach((entry, index) => {
        addField(`Education ${index + 1}`, `${entry.degree} in ${entry.major}`);
        addField('Institution', `${entry.institution}, ${entry.location}`);
        addField('Marks / GPA', `${entry.obtainedMarks} / ${entry.totalMarks}`);
        addField('Passing / expected date', entry.passingDate);
      });

      if (profile.experience.length) {
        addSection('WORK EXPERIENCE');
        profile.experience.filter((entry) => [entry.role, entry.organization, entry.duration, entry.description].some((value) => value.trim())).forEach((entry, index) => {
          addField(`Experience ${index + 1}`, `${entry.role || 'Role'}${entry.organization ? ` at ${entry.organization}` : ''}${entry.duration ? ` (${entry.duration})` : ''}`);
          addField('Responsibilities', entry.description);
        });
      }

      addSection('ENGLISH TEST');
      addField('Test', profile.englishTest);
      if (profile.englishTest !== 'Not taken') {
        addField('Overall score', profile.englishScore);
        if (['IELTS', 'TOEFL'].includes(profile.englishTest)) {
          addField('Reading', profile.englishTestScores.reading);
          addField('Listening', profile.englishTestScores.listening);
          addField('Writing', profile.englishTestScores.writing);
          addField('Speaking', profile.englishTestScores.speaking);
        }
      }

      addSection('STUDY GOALS');
      addField('Program', profile.desiredProgram);
      addField('Study field', profile.studyField);
      addField('Preferred country', profile.preferredCountry);
      addField('Funding preference', profile.fundingPreference);
      addField('Additional information', profile.additionalInfo);

      const fileName = profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'scholarship-profile';
      document.save(`${fileName}-matcher-cv.pdf`);
    } catch {
      setCvError('Could not create the PDF. Please try again.');
    } finally {
      setDownloadingCv(false);
    }
  };

  const getProfileSuggestions = () => {
    const suggestions = [];
    if (profile.englishTest === 'Not taken' && matches?.some((match) => match.gaps.some((gap) => gap.includes('English-language')))) {
      suggestions.push('Some listings mention English tests. Check whether IELTS, TOEFL, or an equivalent test is required.');
    }
    if (!suggestions.length) {
      suggestions.push('Compare each listing’s official eligibility requirements before applying.');
    }
    return suggestions;
  };

  const renderPersonalStep = () => (
    <div className="matcher-fields-grid">
      <label className="matcher-field">
        <span>Full name <b>*</b></span>
        <input autoComplete="name" value={profile.name} onChange={(event) => updateProfile('name', event.target.value)} placeholder="Your full name" />
      </label>
      <label className="matcher-field">
        <span>Email address <b>*</b></span>
        <input type="email" autoComplete="email" value={profile.email} onChange={(event) => updateProfile('email', event.target.value)} placeholder="name@example.com" />
      </label>
      <label className="matcher-field">
        <span>Confirm email <b>*</b></span>
        <input type="email" autoComplete="off" value={profile.confirmEmail} onChange={(event) => updateProfile('confirmEmail', event.target.value)} placeholder="Enter your email again" />
      </label>
      <label className="matcher-field">
        <span>Phone number <b>*</b></span>
        <input type="tel" autoComplete="tel" value={profile.phone} onChange={(event) => updateProfile('phone', event.target.value)} placeholder="Include country code" />
      </label>
      <label className="matcher-field">
        <span>Nationality <b>*</b></span>
        <input autoComplete="country-name" value={profile.nationality} onChange={(event) => updateProfile('nationality', event.target.value)} placeholder="Country of citizenship" />
      </label>
    </div>
  );

  const renderEducationStep = () => (
    <div className="matcher-education-list">
      <p className="matcher-step-note">Add your highest degree first. You can include more than one education record.</p>
      {profile.education.map((entry, index) => (
        <fieldset className="matcher-education-entry" key={entry.id}>
          <legend>Education {index + 1}</legend>
          {profile.education.length > 1 && (
            <button
              type="button"
              className="matcher-remove-entry"
              onClick={() => setProfile((current) => ({ ...current, education: current.education.filter((item) => item.id !== entry.id) }))}
              aria-label={`Remove education ${index + 1}`}
            >
              <X size={15} />
            </button>
          )}
          <div className="matcher-fields-grid">
            <label className="matcher-field">
              <span>Degree <b>*</b></span>
              <select required value={entry.degree} onChange={(event) => updateEducation(entry.id, 'degree', event.target.value)}>
                <option value="">Select degree</option>
                <option>High School</option>
                <option>Associate</option>
                <option>Bachelor's</option>
                <option>Master's</option>
                <option>PhD / Doctorate</option>
                <option>Other</option>
              </select>
            </label>
            <label className="matcher-field">
              <span>Major / subject <b>*</b></span>
              <input required value={entry.major} onChange={(event) => updateEducation(entry.id, 'major', event.target.value)} placeholder="e.g. Computer Science" />
            </label>
            <label className="matcher-field">
              <span>Institution <b>*</b></span>
              <input required value={entry.institution} onChange={(event) => updateEducation(entry.id, 'institution', event.target.value)} placeholder="School or university" />
            </label>
            <label className="matcher-field">
              <span>Institution country <b>*</b></span>
              <input required value={entry.location} onChange={(event) => updateEducation(entry.id, 'location', event.target.value)} placeholder="Country" />
            </label>
            <label className="matcher-field">
              <span>Obtained marks / GPA <b>*</b></span>
              <input required inputMode="decimal" value={entry.obtainedMarks} onChange={(event) => updateEducation(entry.id, 'obtainedMarks', event.target.value)} placeholder="e.g. 3.7 or 850" />
            </label>
            <label className="matcher-field">
              <span>Total marks / GPA <b>*</b></span>
              <input required inputMode="decimal" value={entry.totalMarks} onChange={(event) => updateEducation(entry.id, 'totalMarks', event.target.value)} placeholder="e.g. 4.0 or 1000" />
            </label>
            <label className="matcher-field">
              <span>Passing / expected date <b>*</b></span>
              <input required type="date" value={entry.passingDate} onChange={(event) => updateEducation(entry.id, 'passingDate', event.target.value)} />
            </label>
          </div>
        </fieldset>
      ))}
      <button type="button" className="matcher-add-entry" onClick={() => setProfile((current) => ({ ...current, education: [...current.education, createEducation()] }))}>
        <Plus size={15} /> Add education
      </button>
    </div>
  );

  const renderEnglishStep = () => (
    <div className="matcher-step-narrow">
      <p className="matcher-step-note">If you have not taken a test, choose “Not taken” and continue.</p>
      <label className="matcher-field">
        <span>English test <b>*</b></span>
        <select value={profile.englishTest} onChange={(event) => {
          setProfile((current) => ({
            ...current,
            englishTest: event.target.value,
            englishScore: '',
            englishTestScores: { reading: '', listening: '', writing: '', speaking: '' }
          }));
          setValidationMessage('');
        }}>
          <option value="">Select test status</option>
          <option>Not taken</option>
          <option>IELTS</option>
          <option>TOEFL</option>
          <option>PTE Academic</option>
          <option>Duolingo English Test</option>
          <option>Cambridge English</option>
          <option>Other</option>
        </select>
      </label>
      {profile.englishTest !== 'Not taken' && (
        <>
          <label className="matcher-field">
            <span>Overall score <b>*</b></span>
            <input required inputMode="decimal" value={profile.englishScore} onChange={(event) => updateProfile('englishScore', event.target.value)} placeholder="Enter overall score" />
          </label>
          {['IELTS', 'TOEFL'].includes(profile.englishTest) && (
            <div className="matcher-fields-grid">
              {[
                ['reading', 'Reading'],
                ['listening', 'Listening'],
                ['writing', 'Writing'],
                ['speaking', 'Speaking']
              ].map(([field, label]) => (
                <label className="matcher-field" key={field}>
                  <span>{label} score <b>*</b></span>
                  <input required inputMode="decimal" value={profile.englishTestScores[field]} onChange={(event) => updateEnglishTestScore(field, event.target.value)} placeholder={`${label} module score`} />
                </label>
              ))}
            </div>
          )}
        </>
      )}
      <div className="matcher-info-line">
        <BookOpenCheck size={17} />
        <span>Test scores are compared only when an opportunity mentions language testing. Always check the provider’s required minimum.</span>
      </div>
    </div>
  );

  const renderGoalsStep = () => (
    <div className="matcher-goals-layout">
      <div className="matcher-fields-grid">
        <label className="matcher-field">
          <span>Program you want to study <b>*</b></span>
          <select required value={profile.desiredProgram} onChange={(event) => updateProfile('desiredProgram', event.target.value)}>
            <option value="">Select program</option>
            {PROGRAM_OPTIONS.map((program) => <option key={program.value} value={program.value}>{program.label}</option>)}
          </select>
        </label>
        <label className="matcher-field">
          <span>Study field <b>*</b></span>
          <select required value={profile.studyField} onChange={(event) => updateProfile('studyField', event.target.value)}>
            <option value="">Select study field</option>
            {FIELD_OPTIONS.map((field) => <option key={field}>{field}</option>)}
          </select>
        </label>
        <label className="matcher-field">
          <span>Preferred study country <b>*</b></span>
          <input required value={profile.preferredCountry} onChange={(event) => updateProfile('preferredCountry', event.target.value)} placeholder="Enter a country, or Any country" />
        </label>
        <label className="matcher-field">
          <span>Funding preference <b>*</b></span>
          <select required value={profile.fundingPreference} onChange={(event) => updateProfile('fundingPreference', event.target.value)}>
            <option value="">Select funding preference</option>
            <option>Any funding</option>
            <option>Fully funded</option>
            <option>Partial funding</option>
          </select>
        </label>
        <label className="matcher-field matcher-field-wide">
          <span>Additional information <small>Optional</small></span>
          <textarea maxLength={500} rows={4} value={profile.additionalInfo} onChange={(event) => updateProfile('additionalInfo', event.target.value)} placeholder="Share any other study goals or preferences (up to 500 characters)." />
        </label>
      </div>

      <section className="matcher-experience-section">
        <div className="matcher-experience-heading">
          <div>
            <h3>Work experience <small>Optional</small></h3>
            <p>Add relevant roles, volunteering, or internships.</p>
          </div>
          <button type="button" className="matcher-add-entry" onClick={() => setProfile((current) => ({ ...current, experience: [...current.experience, createExperience()] }))}>
            <Plus size={15} /> Add experience
          </button>
        </div>
        {profile.experience.map((entry, index) => (
          <fieldset className="matcher-education-entry matcher-experience-entry" key={entry.id}>
            <legend>Experience {index + 1}</legend>
            <button
              type="button"
              className="matcher-remove-entry"
              onClick={() => setProfile((current) => ({ ...current, experience: current.experience.filter((item) => item.id !== entry.id) }))}
              aria-label={`Remove experience ${index + 1}`}
            >
              <X size={15} />
            </button>
            <div className="matcher-fields-grid">
              <label className="matcher-field">
                <span>Role / position</span>
                <input value={entry.role} onChange={(event) => updateExperience(entry.id, 'role', event.target.value)} placeholder="e.g. Research assistant" />
              </label>
              <label className="matcher-field">
                <span>Organization</span>
                <input value={entry.organization} onChange={(event) => updateExperience(entry.id, 'organization', event.target.value)} placeholder="Organization or employer" />
              </label>
              <label className="matcher-field">
                <span>Duration</span>
                <input value={entry.duration} onChange={(event) => updateExperience(entry.id, 'duration', event.target.value)} placeholder="e.g. 6 months" />
              </label>
              <label className="matcher-field">
                <span>Responsibilities / achievements</span>
                <textarea rows={2} maxLength={300} value={entry.description} onChange={(event) => updateExperience(entry.id, 'description', event.target.value)} placeholder="A few relevant details" />
              </label>
            </div>
          </fieldset>
        ))}
      </section>
    </div>
  );

  const renderStep = () => {
    if (activeStep === 0) return renderPersonalStep();
    if (activeStep === 1) return renderEducationStep();
    if (activeStep === 2) return renderEnglishStep();
    return renderGoalsStep();
  };

  const renderResults = () => {
    const score = getOverallScore();
    const profileSuggestions = getProfileSuggestions();
    const topMatches = matches.slice(0, 6);

    return (
      <div className="matcher-results">
        <div className="matcher-results-heading">
          <div>
            <span className="matcher-eyebrow"><Sparkles size={14} /> Your profile results</span>
            <h1>Scholarship matches for {(verifiedUser?.name || profile.name).split(' ')[0]}</h1>
            <p>Ranked from active scholarships using the study goals and details you provided.</p>
          </div>
          <button type="button" className="matcher-text-button" onClick={startOver}>Start over</button>
        </div>

        <section className="matcher-score-section" aria-label="Profile match score">
          <div className="matcher-score-summary">
            <div className="matcher-score-meter" style={{ '--matcher-score': `${score}%` }}>
              <div className="matcher-score-meter-inner">
                <strong>{score}</strong>
                <span>out of 100</span>
              </div>
            </div>
            <div className="matcher-score-copy">
              <span className="matcher-score-label">Profile match strength</span>
              <h2>{score >= 75 ? 'Strong profile alignment' : score >= 55 ? 'Good profile alignment' : score > 0 ? 'Some potential matches' : 'No active scholarships yet'}</h2>
              <p>{matches.length
                ? `Score reflects the average fit of your top ${Math.min(matches.length, 3)} scholarship matches.`
                : 'No active scholarships are currently listed. Try again when more opportunities are published.'}</p>
            </div>
          </div>
          <div className="matcher-score-export">
            <button type="button" className="matcher-download-button" onClick={downloadCv} disabled={downloadingCv}>
              <Download size={16} /> {downloadingCv ? 'Preparing CV…' : 'Download CV'}
            </button>
            <span>Generated privately in your browser</span>
            {cvError && <p className="matcher-validation" role="alert">{cvError}</p>}
          </div>
        </section>

        <details className="matcher-score-method">
          <summary>How is this score calculated?</summary>
          <p>Each scholarship starts at 42 points. The matcher adds or subtracts points by comparing your profile with the listing, then caps that scholarship’s score between 0 and 100. Your overall score is the average of your top three matches (or all matches if fewer than three).</p>
          <ul>
            <li><strong>Study level:</strong> +25 when matched, +18 for all-level listings, or -15 for a mismatch.</li>
            <li><strong>Subject:</strong> up to +25 for a category match, +17 for a subject mention, or -5 for a mismatch.</li>
            <li><strong>Location and nationality:</strong> up to +15 for a country match; broad international listings, nationality mentions, and mismatches adjust the score.</li>
            <li><strong>Academic and work background:</strong> prior-degree pathway +5, marks provided +3, and related major or experience keywords up to +8 each.</li>
            <li><strong>English test:</strong> a stated matching-test minimum can add +10 or subtract -8; missing/unclear test requirements can reduce or limit the match.</li>
            <li><strong>Funding and extra preferences:</strong> funding fit adjusts up to 8 points; matching additional keywords add up to 5.</li>
          </ul>
          <p>This is a comparison estimate, not an admission or eligibility decision. Always verify requirements with the scholarship provider.</p>
        </details>

        <section className="matcher-guidance">
          <h2><Target size={17} /> Profile notes</h2>
          <ul>
            {profileSuggestions.map((suggestion) => <li key={suggestion}><Check size={14} />{suggestion}</li>)}
          </ul>
        </section>

        {topMatches.length > 0 && (
          <section className="matcher-match-results">
            <div className="matcher-section-heading">
              <div>
                <h2>Top scholarship matches</h2>
                <p>{matches.length} active {matches.length === 1 ? 'scholarship' : 'scholarships'} ranked by profile fit</p>
              </div>
              <span className="matcher-estimate-note">Estimate only. Confirm all requirements with the provider.</span>
            </div>
            <div className="matcher-cards-grid">
              {topMatches.map((match) => {
                const opportunityId = match.opportunity._id || match.opportunity.id;
                return (
                  <article className="matcher-match-card" key={opportunityId}>
                    <div className="matcher-match-score"><Sparkles size={13} /> {match.score}% match</div>
                    <OpportunityCard
                      opportunity={match.opportunity}
                      isBookmarked={savedIds.includes(opportunityId)}
                      onToggleBookmark={onToggleBookmark}
                      onViewDetails={onViewDetails}
                      onShare={onShare}
                    />
                    {(match.reasons.length > 0 || match.gaps.length > 0) && (
                      <div className="matcher-match-explanation">
                        {match.reasons.slice(0, 2).map((reason) => <p key={reason}><Check size={12} />{reason}</p>)}
                        {match.gaps.slice(0, 1).map((gap) => <p key={gap} className="gap"><Info size={12} />{gap}</p>)}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  };

  const renderGoogleVerification = () => (
    <div className="matcher-verification">
      <button type="button" className="matcher-back-link" onClick={() => {
        setMatches(null);
        setActiveStep(steps.length - 1);
        setVerificationError('');
      }}>
        <ArrowLeft size={15} /> Back to your profile
      </button>

      <div className="matcher-verification-content">
        <span className="matcher-verification-icon"><Check size={22} /></span>
        <span className="matcher-eyebrow"><Sparkles size={14} /> Profile complete</span>
        <h1>Verify your email to see matches</h1>
        <p className="matcher-verification-copy">
          Continue with the Google account that uses <strong>{profile.email}</strong> to verify your account and unlock your scholarship matches.
        </p>

        <div className="matcher-match-preview-line">
          <Target size={17} />
          <span>{matches.length} active scholarship {matches.length === 1 ? 'match' : 'matches'} are ready to review.</span>
        </div>

        {!googleClientId ? (
          <div className="matcher-setup-message" role="status">
            Google sign-in needs a configured OAuth client ID. Add <code>VITE_GOOGLE_CLIENT_ID</code> to the client environment and <code>GOOGLE_CLIENT_ID</code> to the server environment.
          </div>
        ) : (
          <div className="matcher-google-action">
            <div ref={googleButtonRef} className="matcher-google-button" />
            {verifyingAccount && <p className="matcher-saving-state">Verifying your Google account…</p>}
          </div>
        )}

        {verificationError && <p className="matcher-validation" role="alert">{verificationError}</p>}
        <p className="matcher-data-note">Only your verified email, phone, highest degree, and preferred country are saved for future use. Marks, test scores, experience, extra details, and scholarship matches are not saved. Google never shares your password with us.</p>
      </div>
    </div>
  );

  return (
    <div className="matcher-page">
      <div className="matcher-page-inner">
        {matches && verifiedUser?.email?.toLowerCase() === profile.email.trim().toLowerCase()
          ? renderResults()
          : matches ? renderGoogleVerification() : (
          <>
            <div className="matcher-heading">
              <button type="button" className="matcher-back-link" onClick={onBack}>
                <ArrowLeft size={15} /> Back to opportunities
              </button>
              <span className="matcher-eyebrow"><Sparkles size={14} /> Scholarship guidance</span>
              <h1>AI Eligibility Matcher</h1>
              <p>Build a study profile to discover scholarships that may fit your goals and qualifications.</p>
            </div>

            <ol className="matcher-progress" aria-label="Matcher steps">
              {steps.map((step, index) => (
                <li className={index === activeStep ? 'active' : index < activeStep ? 'complete' : ''} key={step}>
                  <span>{index < activeStep ? <Check size={14} /> : index + 1}</span>
                  <strong>{step}</strong>
                </li>
              ))}
            </ol>

            <section className="matcher-form-section">
              <header className="matcher-form-heading">
                <div>
                  <span>STEP {activeStep + 1} OF {steps.length}</span>
                  <h2>{steps[activeStep]}</h2>
                </div>
              </header>

              {renderStep()}
              {validationMessage && <p className="matcher-validation" role="alert">{validationMessage}</p>}

              <footer className="matcher-form-actions">
                <button type="button" className="matcher-secondary-button" onClick={() => {
                  setValidationMessage('');
                  setActiveStep((current) => Math.max(0, current - 1));
                }} disabled={activeStep === 0}>
                  <ChevronLeft size={16} /> Previous
                </button>
                {activeStep < steps.length - 1 ? (
                  <button type="button" className="matcher-primary-button" onClick={continueStep}>
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button type="button" className="matcher-primary-button" onClick={() => {
                    const error = validateStep();
                    if (error) {
                      setValidationMessage(error);
                      return;
                    }
                    findMatches();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}>
                    Find matches <Sparkles size={16} />
                  </button>
                )}
              </footer>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default EligibilityMatcher;