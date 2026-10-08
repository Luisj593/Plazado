import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Banner } from '../../types';

export const PromoBannerSlider: React.FC<{ banners: Banner[]; onSelect: (banner: Banner) => void }> = ({ banners, onSelect }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeIndex = Math.min(index, Math.max(0, banners.length - 1));

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (banners.length < 2 || paused || interacting || focused || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(previous => (Math.min(previous, banners.length - 1) + 1) % banners.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [banners.length, paused, interacting, focused, reducedMotion, activeIndex]);

  if (!banners.length) return null;
  const move = (direction: number) => setIndex((activeIndex + direction + banners.length) % banners.length);

  return (
    <section aria-label="Banners promocionales" aria-roledescription="carrusel"
      onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
      className="overflow-hidden rounded-2xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-900">
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-500 motion-reduce:transition-none" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {banners.map((banner, position) => (
            <button key={banner.id} type="button" onClick={() => onSelect(banner)}
              tabIndex={position === activeIndex ? 0 : -1} aria-hidden={position !== activeIndex}
              aria-label={`${banner.title}. Explorar promoción ${position + 1} de ${banners.length}`}
              className="relative w-full shrink-0 aspect-[16/9] sm:aspect-[16/5] min-h-[180px] text-left group">
              <img src={banner.imageUrl} alt={banner.title} loading={position === 0 ? 'eager' : 'lazy'}
                className="absolute inset-0 w-full h-full object-contain object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 z-10 p-5 sm:p-6 max-w-[85%] sm:max-w-[70%] text-white">
                {banner.badge && <span className="inline-block mb-2 px-2.5 py-1 rounded-full bg-[#f20544] text-[10px] font-black uppercase tracking-wide">{banner.badge}</span>}
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-[1.08] tracking-tight drop-shadow-sm">{banner.title}</h3>
                {banner.subtitle && <p className="text-sm sm:text-base lg:text-lg font-medium text-white/95 mt-2 leading-snug line-clamp-3">{banner.subtitle}</p>}
                <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold">Explorar <ArrowRight className="w-3.5 h-3.5" /></span>
              </div>
            </button>
          ))}
        </div>
      </div>
      {banners.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 p-2">
          <button type="button" aria-label="Banner anterior" onClick={() => move(-1)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-stone-800"><ChevronLeft className="w-5 h-5" /></button>
          {banners.map((banner, position) => <button key={banner.id} type="button" aria-label={`Mostrar banner ${position + 1}: ${banner.title}`}
            aria-current={position === activeIndex ? 'true' : undefined} onClick={() => setIndex(position)} className="p-3">
            <span className={`block h-2 rounded-full ${position === activeIndex ? 'w-6 bg-red-600' : 'w-2 bg-slate-400'}`} />
          </button>)}
          <button type="button" aria-label="Banner siguiente" onClick={() => move(1)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-stone-800"><ChevronRight className="w-5 h-5" /></button>
          {!reducedMotion && <button type="button" aria-label={paused ? 'Reanudar banners' : 'Pausar banners'} onClick={() => setPaused(value => !value)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-stone-800">
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>}
        </div>
      )}
    </section>
  );
};
