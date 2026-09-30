import { AppView } from '../types';

export interface RouteState {
  view: AppView;
  storeSlug: string | null;
  categorySlug: string | null;
  productId: string | null;
}

/**
 * Parsea la URL del navegador y extrae la vista y parámetros dinámicos
 */
export function parseRouteFromLocation(): RouteState {
  if (typeof window === 'undefined') {
    return { view: 'home', storeSlug: null, categorySlug: null, productId: null };
  }

  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();

  // 1. Extraer identificadores desde query params si existen
  const qStore = searchParams.get('store') || searchParams.get('tienda') || searchParams.get('store_id');
  const qCat = searchParams.get('categoria') || searchParams.get('category') || searchParams.get('cat');
  const qProd = searchParams.get('producto') || searchParams.get('product') || searchParams.get('item') || searchParams.get('p');
  const qView = searchParams.get('view') || searchParams.get('vista');

  // 2. Extraer desde pathname dinámico
  // Rutas de tienda: /tienda/:slug o /store/:slug
  const storeMatch = pathname.match(/^\/(?:tienda|store)\/([^\/?#]+)/i);
  if (storeMatch && storeMatch[1]) {
    return {
      view: 'store_public',
      storeSlug: decodeURIComponent(storeMatch[1].trim()),
      categorySlug: null,
      productId: qProd ? decodeURIComponent(qProd.trim()) : null
    };
  }

  // Rutas de producto: /producto/:id o /item/:id
  const prodMatch = pathname.match(/^\/(?:producto|item)\/([^\/?#]+)/i);
  if (prodMatch && prodMatch[1]) {
    return {
      view: 'home',
      storeSlug: null,
      categorySlug: null,
      productId: decodeURIComponent(prodMatch[1].trim())
    };
  }

  // Rutas de catálogo: /catalogo o /catalogo/:categorySlug
  const catMatch = pathname.match(/^\/catalogo(?:\/([^\/?#]+))?/i);
  if (catMatch) {
    return {
      view: 'catalog',
      storeSlug: null,
      categorySlug: catMatch[1] ? decodeURIComponent(catMatch[1].trim()) : (qCat ? decodeURIComponent(qCat.trim()) : null),
      productId: qProd ? decodeURIComponent(qProd.trim()) : null
    };
  }

  // Rutas de tiendas: /tiendas o /stores
  if (pathname.startsWith('/tiendas') || pathname.startsWith('/stores')) {
    return { view: 'stores', storeSlug: null, categorySlug: null, productId: null };
  }

  // Vender con nosotros: /vender o /comercio o /sell
  if (pathname.startsWith('/vender') || pathname.startsWith('/comercio') || pathname.startsWith('/sell')) {
    return { view: 'sell_with_us', storeSlug: null, categorySlug: null, productId: null };
  }

  // Portal de cliente: /cuenta o /portal o /pedidos o /perfil
  if (pathname.startsWith('/cuenta') || pathname.startsWith('/portal') || pathname.startsWith('/pedidos') || pathname.startsWith('/perfil')) {
    return { view: 'customer_portal', storeSlug: null, categorySlug: null, productId: null };
  }

  // Dashboard de comercio: /dashboard o /mi-tienda o /merchant
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/mi-tienda') || pathname.startsWith('/merchant')) {
    return { view: 'store_dashboard', storeSlug: null, categorySlug: null, productId: null };
  }

  // Panel Super Admin: /admin o /super-admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) {
    return { view: 'admin_dashboard', storeSlug: null, categorySlug: null, productId: null };
  }

  // Políticas: /politicas o /terminos o /privacidad
  if (pathname.startsWith('/politicas') || pathname.startsWith('/terminos') || pathname.startsWith('/privacidad')) {
    return { view: 'policies', storeSlug: null, categorySlug: null, productId: null };
  }

  // Descarga App: /descargar-app o /app o /apk o /android
  if (pathname.startsWith('/descargar-app') || pathname === '/app' || pathname.startsWith('/apk') || pathname.startsWith('/android')) {
    return { view: 'download_app', storeSlug: null, categorySlug: null, productId: null };
  }

  // 3. Fallback de hash routing si la URL usa hash
  if (hash.includes('tienda/') || hash.includes('store/')) {
    const hMatch = hash.match(/#(?:tienda|store)\/([^\/?#]+)/i);
    if (hMatch && hMatch[1]) {
      return { view: 'store_public', storeSlug: decodeURIComponent(hMatch[1].trim()), categorySlug: null, productId: null };
    }
  }

  // 4. Verificación de query params
  if (qStore) {
    return { view: 'store_public', storeSlug: decodeURIComponent(qStore.trim()), categorySlug: null, productId: qProd || null };
  }
  if (qCat) {
    return { view: 'catalog', storeSlug: null, categorySlug: decodeURIComponent(qCat.trim()), productId: qProd || null };
  }
  if (qProd) {
    return { view: 'home', storeSlug: null, categorySlug: null, productId: decodeURIComponent(qProd.trim()) };
  }

  if (qView) {
    const v = qView.trim().toLowerCase();
    if (v === 'catalog' || v === 'catalogo') return { view: 'catalog', storeSlug: null, categorySlug: null, productId: null };
    if (v === 'stores' || v === 'tiendas') return { view: 'stores', storeSlug: null, categorySlug: null, productId: null };
    if (v === 'sell_with_us' || v === 'vender') return { view: 'sell_with_us', storeSlug: null, categorySlug: null, productId: null };
    if (v === 'customer_portal' || v === 'cuenta') return { view: 'customer_portal', storeSlug: null, categorySlug: null, productId: null };
    if (v === 'store_dashboard' || v === 'dashboard') return { view: 'store_dashboard', storeSlug: null, categorySlug: null, productId: null };
    if (v === 'admin_dashboard' || v === 'admin') return { view: 'admin_dashboard', storeSlug: null, categorySlug: null, productId: null };
    if (v === 'policies' || v === 'politicas') return { view: 'policies', storeSlug: null, categorySlug: null, productId: null };
    if (v === 'download_app' || v === 'app') return { view: 'download_app', storeSlug: null, categorySlug: null, productId: null };
  }

  return { view: 'home', storeSlug: null, categorySlug: null, productId: null };
}

/**
 * Convierte un estado de navegación a una URL canónica limpia
 */
export function buildUrlForRoute(
  view: AppView,
  storeSlug?: string | null,
  categorySlug?: string | null,
  productId?: string | null
): string {
  if (productId) {
    return `/producto/${encodeURIComponent(productId)}`;
  }

  switch (view) {
    case 'store_public':
      return storeSlug ? `/tienda/${encodeURIComponent(storeSlug)}` : '/tiendas';
    case 'catalog':
      return categorySlug ? `/catalogo/${encodeURIComponent(categorySlug)}` : '/catalogo';
    case 'stores':
      return '/tiendas';
    case 'sell_with_us':
      return '/vender';
    case 'customer_portal':
      return '/cuenta';
    case 'store_dashboard':
      return '/dashboard';
    case 'admin_dashboard':
      return '/admin';
    case 'policies':
      return '/politicas';
    case 'download_app':
      return '/descargar-app';
    case 'home':
    default:
      return '/';
  }
}

/**
 * Actualiza la URL del navegador mediante HTML5 pushState sin recargar la página
 */
export function syncBrowserUrl(
  view: AppView,
  storeSlug?: string | null,
  categorySlug?: string | null,
  productId?: string | null,
  replace: boolean = false
): void {
  if (typeof window === 'undefined') return;

  const targetUrl = buildUrlForRoute(view, storeSlug, categorySlug, productId);
  const currentPath = window.location.pathname;

  if (currentPath !== targetUrl) {
    try {
      if (replace) {
        window.history.replaceState({ view, storeSlug, categorySlug, productId }, '', targetUrl);
      } else {
        window.history.pushState({ view, storeSlug, categorySlug, productId }, '', targetUrl);
      }
    } catch (e) {
      // Ignorar restricciones en entornos sandbox
    }
  }
}
