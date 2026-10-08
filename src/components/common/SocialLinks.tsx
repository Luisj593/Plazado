import React from 'react';
import type { SocialLinks as Links } from '../../types';

export const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'Instagram', domain: 'instagram.com', image: '/social/instagram.jpg' },
  { key: 'tiktok', label: 'TikTok', domain: 'tiktok.com', image: '/social/tiktok.png' },
  { key: 'facebook', label: 'Facebook', domain: 'facebook.com', image: '/social/facebook.jpg' },
] as const;

export function validSocialUrl(value: string | undefined, domain: string): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol === 'https:' && !url.username && !url.password && !url.port && (url.hostname === domain || url.hostname.endsWith('.' + domain))) return url.href;
  } catch { /* An unconfigured link is not navigable. */ }
  return undefined;
}

export const SocialLinks: React.FC<{ links?: Links }> = ({ links }) => (
  <div className="mt-3" aria-label="Redes sociales de Plazado">
    <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">Síguenos en redes sociales</p>
    <div className="flex items-center gap-3">
      {SOCIAL_NETWORKS.map(({ key, label, domain, image }) => {
        const href = validSocialUrl(links?.[key], domain);
        const icon = <img src={image} alt="" aria-hidden="true" width={40} height={40} className="w-10 h-10 object-contain rounded-lg" />;
        const style = 'w-11 h-11 flex items-center justify-center rounded-lg overflow-hidden transition-transform hover:scale-105';
        return href ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} de Plazado`} title={label} className={`${style} text-stone-700 dark:text-stone-200 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-2 focus-visible:outline-red-500`}>{icon}</a>
        ) : (
          <span key={key} aria-label={`${label}: enlace pendiente`} title={`${label}: enlace pendiente`} className={`${style} text-stone-400 opacity-50`}>{icon}</span>
        );
      })}
    </div>
  </div>
);