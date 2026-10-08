import React from 'react';
import { Instagram, Facebook } from 'lucide-react';
import type { SocialLinks as Links } from '../../types';

export const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'Instagram', domain: 'instagram.com' },
  { key: 'tiktok', label: 'TikTok', domain: 'tiktok.com' },
  { key: 'facebook', label: 'Facebook', domain: 'facebook.com' },
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
      {SOCIAL_NETWORKS.map(({ key, label, domain }) => {
        const href = validSocialUrl(links?.[key], domain);
        const icon = key === 'instagram' ? <Instagram className="w-5 h-5" /> : key === 'facebook' ? <Facebook className="w-5 h-5" /> : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.3 2.1 1.5 3.4 3.4 3.6v3.3a8 8 0 0 1-3.4-1v6.8a6.2 6.2 0 1 1-5.4-6.2v3.4a2.9 2.9 0 1 0 2.1 2.8V3h3.3Z" /></svg>
        );
        const style = 'w-10 h-10 flex items-center justify-center rounded-full border border-stone-300 dark:border-stone-700';
        return href ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} de Plazado`} title={label} className={`${style} text-stone-700 dark:text-stone-200 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-2 focus-visible:outline-red-500`}>{icon}</a>
        ) : (
          <span key={key} aria-label={`${label}: enlace pendiente`} title={`${label}: enlace pendiente`} className={`${style} text-stone-400 opacity-50`}>{icon}</span>
        );
      })}
    </div>
  </div>
);
