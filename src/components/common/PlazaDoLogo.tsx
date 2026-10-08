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

  const brandGreen = '#008f51';
  const greyColor = inverted ? '#E2E8F0' : '#64748B';

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
            stroke={brandGreen}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
      </svg>
    );
  }

  return (
    <img
      src="/plazado-logo-integrado.png"
      alt="Plazado.com — Todo en un solo lugar"
      className={`object-contain dark:brightness-150 ${className || (variant === 'full' ? 'w-full max-w-[280px] h-auto' : 'w-[180px] h-auto')}`}
    />
  );
};
