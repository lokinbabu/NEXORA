import { Link } from 'react-router-dom';

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="logo" aria-label="NEXORA home">
      <svg className="logo__mark" viewBox="0 0 32 32" aria-hidden>
        <path d="M16 2 29 9v14L16 30 3 23V9z" fill="rgba(124,92,255,0.12)" stroke="url(#lg)" strokeWidth="2" />
        <path d="M11 21V11l10 10V11" fill="none" stroke="#45d8ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#45d8ff" />
          </linearGradient>
        </defs>
      </svg>
      {!compact && <span className="logo__word">NEXORA</span>}
    </Link>
  );
}
