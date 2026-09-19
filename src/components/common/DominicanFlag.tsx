import React from 'react';

interface DominicanFlagProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'custom';
  title?: string;
}

export const DominicanFlag: React.FC<DominicanFlagProps> = ({ 
  className = '', 
  size = 'custom',
  title = 'Bandera de la República Dominicana' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-2.5',
    md: 'w-6 h-4',
    lg: 'w-8 h-5.5',
    custom: ''
  };

  const finalClass = `${sizeClasses[size]} ${className}`.trim();

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 600 400" 
      className={finalClass || 'w-5 h-3.5 inline-block'}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <clipPath id="shield-clip-inner">
          <path d="M 282 178 Q 282 205 300 216 Q 318 205 318 178 Z" />
        </clipPath>
      </defs>

      {/* Quarters */}
      {/* Top Left: Ultramarine Blue */}
      <rect x="0" y="0" width="260" height="160" fill="#002B7F" />
      {/* Top Right: Vermilion Red */}
      <rect x="340" y="0" width="260" height="160" fill="#CE1126" />
      {/* Bottom Left: Vermilion Red */}
      <rect x="0" y="240" width="260" height="160" fill="#CE1126" />
      {/* Bottom Right: Ultramarine Blue */}
      <rect x="340" y="240" width="260" height="160" fill="#002B7F" />

      {/* Central White Cross */}
      <rect x="0" y="160" width="600" height="80" fill="#FFFFFF" />
      <rect x="260" y="0" width="80" height="400" fill="#FFFFFF" />

      {/* Dominican Coat of Arms in center */}
      <g>
        {/* Upper Ribbon: DIOS PATRIA LIBERTAD (Blue) */}
        <path d="M 275 166 Q 300 160 325 166 Q 320 171 315 169 Q 300 166 285 169 Q 280 171 275 166 Z" fill="#002B7F" />

        {/* Laurel & Palm Branches */}
        <path d="M 275 180 C 270 190 273 205 285 218 C 282 212 278 198 279 185 Z" fill="#157347" />
        <ellipse cx="272" cy="186" rx="3.5" ry="5.5" transform="rotate(-30 272 186)" fill="#2e7d32" />
        <ellipse cx="271" cy="196" rx="3.5" ry="5.5" transform="rotate(-15 271 196)" fill="#388e3c" />
        <ellipse cx="276" cy="207" rx="3.5" ry="5.5" transform="rotate(15 276 207)" fill="#2e7d32" />

        <path d="M 325 180 C 330 190 327 205 315 218 C 318 212 322 198 321 185 Z" fill="#157347" />
        <ellipse cx="328" cy="186" rx="3.5" ry="5.5" transform="rotate(30 328 186)" fill="#2e7d32" />
        <ellipse cx="329" cy="196" rx="3.5" ry="5.5" transform="rotate(15 329 196)" fill="#388e3c" />
        <ellipse cx="324" cy="207" rx="3.5" ry="5.5" transform="rotate(-15 324 207)" fill="#2e7d32" />

        {/* Shield with flag motif */}
        <g clipPath="url(#shield-clip-inner)">
          <rect x="282" y="174" width="18" height="20" fill="#002B7F" />
          <rect x="300" y="174" width="18" height="20" fill="#CE1126" />
          <rect x="282" y="194" width="18" height="24" fill="#CE1126" />
          <rect x="300" y="194" width="18" height="24" fill="#002B7F" />
          {/* Miniature Cross */}
          <rect x="282" y="191" width="36" height="6" fill="#FFFFFF" />
          <rect x="297" y="174" width="6" height="44" fill="#FFFFFF" />
        </g>
        <path d="M 282 178 Q 282 205 300 216 Q 318 205 318 178 Z" fill="none" stroke="#FFD700" strokeWidth="1.8" />

        {/* Trophies behind Bible */}
        <line x1="288" y1="184" x2="312" y2="204" stroke="#FFD700" strokeWidth="1.2" />
        <line x1="312" y1="184" x2="288" y2="204" stroke="#FFD700" strokeWidth="1.2" />

        {/* Open Bible */}
        <path d="M 293 192 Q 297 190 300 192 Q 303 190 307 192 L 307 200 Q 303 198 300 200 Q 297 198 293 200 Z" fill="#FFFDF0" stroke="#333" strokeWidth="0.6" />
        <line x1="300" y1="192" x2="300" y2="200" stroke="#888" strokeWidth="0.5" />
        {/* Golden Cross */}
        <line x1="300" y1="185" x2="300" y2="191" stroke="#FFD700" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="297.5" y1="187.5" x2="302.5" y2="187.5" stroke="#FFD700" strokeWidth="1.4" strokeLinecap="round" />

        {/* Lower Ribbon: REPUBLICA DOMINICANA (Vermilion Red) */}
        <path d="M 274 220 Q 300 227 326 220 Q 321 216 317 218 Q 300 223 283 218 Q 279 216 274 220 Z" fill="#CE1126" />
      </g>
    </svg>
  );
};
