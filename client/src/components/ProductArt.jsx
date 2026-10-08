import { useId } from 'react';

/**
 * Built-in product artwork.
 * Products render this SVG when no custom image is set, so the store always
 * looks complete without depending on any external image hosting.
 * Replacing it later is trivial: set the product's `image` field via the admin panel.
 */

function hashString(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) {
    h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
  }
  return h;
}

const VARIANTS = [
  { a: '#151032', b: '#070a14', glow: '#7c5cff' },
  { a: '#0a2233', b: '#070a14', glow: '#45d8ff' },
  { a: '#1c1030', b: '#080a12', glow: '#a855f7' },
  { a: '#07242b', b: '#070a14', glow: '#2dd4bf' },
  { a: '#251233', b: '#080a12', glow: '#e879f9' },
];

function glyph(category, accent) {
  const s = { fill: 'none', stroke: accent, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const w = { fill: 'none', stroke: '#eef0f6', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' };

  switch (category) {
    case 'Keyboards':
      return (
        <g>
          <rect x="95" y="105" width="210" height="86" rx="12" {...w} />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
              <rect key={`${r}-${c}`} x={110 + c * 24 + r * 5} y={120 + r * 20} width="18" height="12" rx="3" fill={accent} opacity={r === 0 ? 0.9 : 0.45} />
            ))
          )}
          <rect x="155" y="170" width="90" height="12" rx="3" fill={accent} opacity="0.9" />
          <ellipse cx="200" cy="212" rx="110" ry="10" fill={accent} opacity="0.25" />
        </g>
      );
    case 'Mice':
      return (
        <g>
          <path d="M200 82 c34 0 52 30 52 72 c0 46 -20 66 -52 66 c-32 0 -52 -20 -52 -66 c0 -42 18 -72 52 -72 Z" {...w} />
          <path d="M200 82 v52" {...s} />
          <rect x="193" y="96" width="14" height="24" rx="7" fill={accent} />
          <path d="M148 134 h104" {...s} opacity="0.5" />
          <ellipse cx="200" cy="238" rx="70" ry="9" fill={accent} opacity="0.25" />
        </g>
      );
    case 'Headsets':
      return (
        <g>
          <path d="M136 168 v-12 a64 64 0 0 1 128 0 v12" {...w} />
          <rect x="118" y="162" width="30" height="52" rx="12" fill={accent} opacity="0.35" stroke={accent} strokeWidth="3" />
          <rect x="252" y="162" width="30" height="52" rx="12" fill={accent} opacity="0.35" stroke={accent} strokeWidth="3" />
          <path d="M133 214 c0 22 18 32 38 32" {...s} />
          <circle cx="176" cy="246" r="5" fill={accent} />
        </g>
      );
    case 'Controllers':
      return (
        <g>
          <path
            d="M136 118 h128 c26 0 42 22 42 50 c0 30 -12 52 -30 52 c-16 0 -22 -16 -34 -16 h-84 c-12 0 -18 16 -34 16 c-18 0 -30 -22 -30 -52 c0 -28 16 -50 42 -50 Z"
            {...w}
          />
          <path d="M156 138 v28 M142 152 h28" {...s} />
          <circle cx="244" cy="142" r="6" fill={accent} />
          <circle cx="262" cy="156" r="6" fill={accent} opacity="0.7" />
          <circle cx="226" cy="156" r="6" fill={accent} opacity="0.7" />
          <circle cx="244" cy="170" r="6" fill={accent} opacity="0.4" />
        </g>
      );
    case 'Monitors':
      return (
        <g>
          <rect x="80" y="76" width="240" height="136" rx="10" {...w} />
          <rect x="94" y="90" width="212" height="108" rx="5" fill={accent} opacity="0.18" />
          <path d="M108 170 L156 122 L196 156 L232 110 L292 170" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          <path d="M186 212 v22" {...s} />
          <path d="M152 238 h96" {...s} strokeWidth="4" />
        </g>
      );
    case 'Microphones':
      return (
        <g>
          <rect x="168" y="82" width="64" height="112" rx="32" {...w} />
          {[100, 116, 132, 148, 164].map((y) => (
            <path key={y} d={`M176 ${y} h48`} {...s} opacity="0.55" />
          ))}
          <path d="M200 194 v26" {...s} />
          <path d="M226 146 c26 4 32 26 18 44" {...s} />
          <circle cx="241" cy="196" r="5" fill={accent} />
          <path d="M158 244 h84" {...s} strokeWidth="4" />
          <path d="M178 232 v12 M222 232 v12" {...s} opacity="0.6" />
        </g>
      );
    case 'Mousepads':
      return (
        <g>
          <rect x="62" y="128" width="276" height="72" rx="16" {...w} />
          <path d="M84 148 h232" stroke={accent} strokeWidth="2" opacity="0.6" fill="none" />
          <path d="M84 160 h180" stroke={accent} strokeWidth="2" opacity="0.35" fill="none" />
          <ellipse cx="262" cy="118" rx="34" ry="42" fill="none" stroke="#eef0f6" strokeWidth="3" opacity="0.85" />
          <path d="M262 86 v22" stroke={accent} strokeWidth="3" strokeLinecap="round" fill="none" />
          <ellipse cx="200" cy="216" rx="150" ry="12" fill={accent} opacity="0.22" />
        </g>
      );
    default: // Accessories — RGB kit / hex node
      return (
        <g>
          <path d="M200 78 L262 114 v72 L200 222 L138 186 v-72 Z" {...w} />
          <path d="M200 78 v-26 M262 114 l24 -14 M262 186 l24 14 M138 114 l-24 -14" {...s} opacity="0.7" />
          <circle cx="200" cy="150" r="22" fill={accent} opacity="0.3" stroke={accent} strokeWidth="3" />
          <circle cx="200" cy="150" r="7" fill={accent} />
          <path d="M200 128 v-18 M200 172 v18 M178 150 h-18 M222 150 h18" {...s} opacity="0.6" />
        </g>
      );
  }
}

export default function ProductArt({ product, className = '' }) {
  const uid = useId().replace(/[:]/g, '');
  const v = VARIANTS[hashString(product?.id || product?.name || 'nx') % VARIANTS.length];
  const accent = v.glow;

  return (
    <svg
      className={`product-art ${className}`}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${product?.name || 'Product'} illustration`}
    >
      <defs>
        <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={v.a} />
          <stop offset="100%" stopColor={v.b} />
        </linearGradient>
        <radialGradient id={`glow${uid}`} cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#bg${uid})`} />
      <rect width="400" height="300" fill={`url(#glow${uid})`} />
      <g opacity="0.25" stroke={accent} strokeWidth="1">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={`v${i}`} d={`M${i * 50 + 25} 0 V300`} opacity="0.08" />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={`h${i}`} d={`M0 ${i * 50 + 25} H400`} opacity="0.08" />
        ))}
      </g>
      {glyph(product?.category, accent)}
    </svg>
  );
}
