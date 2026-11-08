import React from 'react';
import { GraduationCap, Mail } from 'lucide-react';

export const Footer = ({ onSelectCategory }) => {
  const officialEmail = 'khhasnain303@gmail.com';

  return (
    <footer className="scholara-footer">
      <div className="footer-container">
        
        {/* 4-Column Aligned Grid */}
        <div className="footer-grid">
          
          {/* Column 1: Brand & Contact Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#C26D38',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <GraduationCap style={{ width: 22, height: 22 }} />
              </div>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 20, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                SCHOLARA
              </span>
            </div>

            <p style={{ fontSize: 13, color: 'rgba(221, 210, 191, 0.85)', lineHeight: 1.6, margin: 0 }}>
              A premier gateway connecting promising students, researchers, and early-career talent with prestigious global scholarships and high-impact internships.
            </p>

            {/* Prominent Official Email Box */}
            <div className="footer-email-box">
              <Mail style={{ width: 18, height: 18, color: '#C26D38', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#DDD2BF', display: 'block', letterSpacing: '0.04em' }}>
                  Official Contact & Inquiries:
                </span>
                <a 
                  href={`mailto:${officialEmail}`}
                  style={{
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none'
                  }}
                  title="Send email inquiry"
                >
                  {officialEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Popular Academic Fields */}
          <div>
            <h4 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Popular Disciplines
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
              {['Computer Science & Tech', 'Engineering & Robotics', 'Business & Finance', 'Medicine & Healthcare', 'Social Sciences & Law'].map(cat => (
                <li key={cat}>
                  <button 
                    type="button"
                    onClick={() => onSelectCategory(cat)}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(221, 210, 191, 0.8)', cursor: 'pointer', padding: 0, textAlign: 'left', transition: '0.15s' }}
                    onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(221, 210, 191, 0.8)'}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Opportunity Programs */}
          <div>
            <h4 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Programs & Funding
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13, color: 'rgba(221, 210, 191, 0.8)' }}>
              <li>Fully Funded Master's Degrees</li>
              <li>Doctoral & PhD Fellowships</li>
              <li>Software Engineering Summer Internships</li>
              <li>Global Remote Tech Internships</li>
              <li>Government & Exchange Scholarships</li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              Support
            </h4>
            <p style={{ fontSize: 12, color: 'rgba(221, 210, 191, 0.8)', lineHeight: 1.5, margin: 0 }}>
              Need help finding the right scholarship or internship? Contact the Scholara support team.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div>
            © {new Date().getFullYear()} Scholara Portal. Built with React.js & MongoDB. Coordinator: <strong style={{ color: '#FFFFFF' }}>{officialEmail}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>Verified Database</span>
            <span>•</span>
            <span>Academic Integrity</span>
            <span>•</span>
            <a href={`mailto:${officialEmail}`} style={{ color: '#DDD2BF', textDecoration: 'underline' }}>
              Support ({officialEmail})
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
