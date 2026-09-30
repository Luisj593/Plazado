import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface PlazaDoLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'icon';
  inverted?: boolean;
  customLogoUrl?: string;
  customLogoDarkUrl?: string;
  forceDefault?: boolean;
}

export const PlazaDoLogo: React.FC<PlazaDoLogoProps> = ({
  className = '',
  variant = 'compact',
  inverted = false,
  customLogoUrl,
  customLogoDarkUrl,
  forceDefault = false
}) => {
  const { systemSettings } = useApp();
  const [imageError, setImageError] = useState(false);

  const redColor = '#E31B44';
  const greyColor = inverted ? '#E2E8F0' : '#64748B';
  const sloganColor = inverted ? '#CBD5E1' : '#64748B';

  // Custom Logo or Favicon rendering when configured
  if (!forceDefault && !imageError) {
    if (variant === 'icon') {
      const customFavicon = systemSettings?.faviconType === 'custom' ? systemSettings?.faviconUrl : null;
      if (customFavicon) {
        return (
          <img
            src={customFavicon}
            alt={systemSettings?.platformName || 'PlazaDO'}
            className={`object-contain rounded-md ${className || 'w-8 h-8'}`}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        );
      }
    } else {
      const shouldUseCustom = customLogoUrl || systemSettings?.logoType === 'custom';
      if (shouldUseCustom) {
        const logoDark = customLogoDarkUrl || systemSettings?.logoDarkUrl;
        const logoLight = customLogoUrl || systemSettings?.logoUrl;
        const effectiveLogo = inverted ? (logoDark || logoLight) : (logoLight || logoDark);

        if (effectiveLogo) {
          return (
            <img
              src={effectiveLogo}
              alt={systemSettings?.platformName || 'PlazaDO'}
              className={`object-contain ${className || (variant === 'full' ? 'max-h-12 w-auto max-w-[260px]' : 'max-h-9 sm:max-h-10 w-auto')}`}
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
            />
          );
        }
      }
    }
  }

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 85 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className || 'w-8 h-8'}
        role="img"
        aria-label="PlazaDO Icon"
      >
        <g transform="translate(4, 3)">
          {/* Handle */}
          <path
            d="M 28 20 C 28 8, 48 8, 48 20"
            fill="none"
            stroke={greyColor}
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Bag Body */}
          <path
            d="M 12 24 L 64 24 C 67 24, 69 26, 70 29 L 77 69 C 78 74, 74 78, 69 78 L 7 78 C 2 78, -2 74, -1 69 L 6 29 C 7 26, 9 24, 12 24 Z"
            fill="none"
            stroke={greyColor}
            strokeWidth="6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Smile */}
          <path
            d="M 24 50 Q 38 65, 52 50"
            fill="none"
            stroke={redColor}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
      </svg>
    );
  }

  if (variant === 'compact') {
    return (
      <svg
        viewBox="0 0 450 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className || 'h-9 w-auto'}
        role="img"
        aria-label="PlazaDO Logo"
      >
        {/* Plaza Text */}
        <text
          x="5"
          y="76"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="76"
          letterSpacing="-1.5"
          fill={redColor}
        >
          Plaza
        </text>

        {/* do outlined text */}
        <text
          x="235"
          y="76"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          fontSize="76"
          letterSpacing="-1"
          fill="none"
          stroke={greyColor}
          strokeWidth="4.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          do
        </text>

        {/* Shopping Bag with Smile */}
        <g transform="translate(340, 8)">
          {/* Handle */}
          <path
            d="M 30 20 C 30 7, 50 7, 50 20"
            fill="none"
            stroke={greyColor}
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          {/* Bag Body */}
          <path
            d="M 14 24 L 66 24 C 69 24, 71 26, 72 29 L 79 69 C 80 74, 76 78, 71 78 L 9 78 C 4 78, 0 74, 1 69 L 8 29 C 9 26, 11 24, 14 24 Z"
            fill="none"
            stroke={greyColor}
            strokeWidth="6.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Smile */}
          <path
            d="M 26 50 Q 40 65, 54 50"
            fill="none"
            stroke={redColor}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
      </svg>
    );
  }

  // Full Variant with "Todo en un solo lugar" and red bar
  return (
    <svg
      viewBox="0 0 520 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className || 'w-full max-w-[280px] h-auto'}
      role="img"
      aria-label="PlazaDO - Todo en un solo lugar"
    >
      <g transform="translate(10, 5)">
        {/* Plaza Text */}
        <text
          x="10"
          y="78"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="78"
          letterSpacing="-1.5"
          fill={redColor}
        >
          Plaza
        </text>

        {/* do outlined text */}
        <text
          x="245"
          y="78"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          fontSize="78"
          letterSpacing="-1"
          fill="none"
          stroke={greyColor}
          strokeWidth="4.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          do
        </text>

        {/* Shopping Bag with Smile */}
        <g transform="translate(352, 10)">
          {/* Handle */}
          <path
            d="M 30 20 C 30 7, 50 7, 50 20"
            fill="none"
            stroke={greyColor}
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          {/* Bag Body */}
          <path
            d="M 14 24 L 66 24 C 69 24, 71 26, 72 29 L 79 69 C 80 74, 76 78, 71 78 L 9 78 C 4 78, 0 74, 1 69 L 8 29 C 9 26, 11 24, 14 24 Z"
            fill="none"
            stroke={greyColor}
            strokeWidth="6.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Smile */}
          <path
            d="M 26 50 Q 40 65, 54 50"
            fill="none"
            stroke={redColor}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>

        {/* Slogan */}
        <text
          x="50"
          y="125"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="500"
          fontSize="20"
          letterSpacing="5"
          fill={sloganColor}
        >
          Todo en un solo lugar
        </text>

        {/* Red accent line */}
        <rect x="180" y="144" width="105" height="5.5" rx="2.75" fill={redColor} />
      </g>
    </svg>
  );
};
