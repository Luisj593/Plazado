import React, { useEffect, useRef } from 'react';
import { ExternalLink, Megaphone } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { AdPlacementCode, Advertisement } from '../../types';

interface AdBannerProps {
  placement: AdPlacementCode;
  className?: string;
  limit?: number;
  layout?: 'banner' | 'card' | 'inline';
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  placement, 
  className = '', 
  limit = 1,
  layout = 'banner'
}) => {
  const { adCampaigns, trackAdImpression, trackAdClick, setCurrentView } = useAppContext();
  const trackedAdsRef = useRef<Set<string>>(new Set());

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter eligible ads
  const eligibleAds = adCampaigns.filter(ad => {
    if (ad.placement !== placement) return false;
    if (!ad.isActive) return false;
    if (ad.startDate && ad.startDate > todayStr) return false;
    if (ad.endDate && ad.endDate < todayStr) return false;

    // Check device target
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      if (ad.targetDevice === 'DESKTOP' && isMobile) return false;
      if (ad.targetDevice === 'MOBILE' && !isMobile) return false;
    }

    return true;
  }).sort((a, b) => b.priority - a.priority).slice(0, limit);

  // Track impressions
  useEffect(() => {
    eligibleAds.forEach(ad => {
      if (!trackedAdsRef.current.has(ad.id)) {
        trackedAdsRef.current.add(ad.id);
        trackAdImpression(ad.id);
      }
    });
  }, [eligibleAds, trackAdImpression]);

  if (eligibleAds.length === 0) {
    return null;
  }

  const handleClick = (ad: Advertisement, e: React.MouseEvent) => {
    trackAdClick(ad.id);
    
    // Internal view navigation if starts with special hashtag or root
    if (ad.targetUrl.startsWith('/') && !ad.targetUrl.startsWith('//')) {
      if (ad.targetUrl === '/' || ad.targetUrl === '/home') {
        e.preventDefault();
        setCurrentView('home');
      } else if (ad.targetUrl.includes('registro') || ad.targetUrl.includes('tienda')) {
        e.preventDefault();
        setCurrentView('sell_with_us');
      }
    }
  };

  return (
    <div className={`w-full space-y-4 ${className}`} id={`ad-slot-${placement.toLowerCase()}`}>
      {eligibleAds.map((ad) => {
        const isExternal = ad.targetUrl.startsWith('http://') || ad.targetUrl.startsWith('https://');

        if (layout === 'card') {
          return (
            <a
              key={ad.id}
              href={ad.targetUrl}
              target={ad.targetWindow || (isExternal ? '_blank' : '_self')}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              onClick={(e) => handleClick(ad, e)}
              className="group block bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all relative"
            >
              <div className="relative h-44 overflow-hidden bg-stone-100">
                <img 
                  src={ad.imageUrl} 
                  alt={ad.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute top-2.5 left-2.5 bg-stone-950/75 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Megaphone className="w-2.5 h-2.5" />
                  <span>Patrocinado</span>
                </div>
              </div>
              <div className="p-3.5 space-y-1.5">
                <span className="text-[10px] font-bold text-red-600 block uppercase tracking-wider">{ad.advertiserName || 'Plazado.com'}</span>
                <h4 className="font-extrabold text-stone-900 text-sm leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                  {ad.title}
                </h4>
                {ad.description && (
                  <p className="text-xs text-stone-500 line-clamp-2">{ad.description}</p>
                )}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 underline underline-offset-2 flex items-center gap-1">
                    {ad.ctaText || 'Ver Más'}
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </span>
                </div>
              </div>
            </a>
          );
        }

        // Default 'banner' layout
        return (
          <div 
            key={ad.id}
            className="relative overflow-hidden rounded-2xl border border-stone-200 shadow-xs bg-stone-900 text-white group"
          >
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
              <img 
                src={ad.imageUrl} 
                alt={ad.title} 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/80 to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-4xl">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Megaphone className="w-2.5 h-2.5" />
                    <span>Publicidad</span>
                  </span>
                  <span className="text-[11px] font-bold text-stone-300">
                    {ad.advertiserName || 'Plazado.com'}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white group-hover:text-red-200 transition-colors">
                  {ad.title}
                </h3>

                {ad.description && (
                  <p className="text-xs text-stone-200 line-clamp-2 max-w-xl leading-relaxed">
                    {ad.description}
                  </p>
                )}
              </div>

              <a
                href={ad.targetUrl}
                target={ad.targetWindow || (isExternal ? '_blank' : '_self')}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                onClick={(e) => handleClick(ad, e)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 shrink-0 group-hover:shadow-lg"
              >
                <span>{ad.ctaText || 'Conoce Más'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};
