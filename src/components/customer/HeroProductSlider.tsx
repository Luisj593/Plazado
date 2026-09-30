import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  Store as StoreIcon,
  Tag,
  ArrowRight
} from 'lucide-react';
import { Product, Store, Banner, Category } from '../../types';
import { getCategoryEmoji } from '../../utils/categoryIcons';

interface HeroProductSliderProps {
  products: Product[];
  stores: Store[];
  banners?: Banner[];
  categories?: Category[];
  onSelectProduct: (productId: string) => void;
  onAddToCart?: (productId: string, storeId: string, quantity: number) => void;
  onSelectStore?: (storeSlug: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
  onRegisterStore?: () => void;
  onExploreCatalog?: () => void;
}

interface SlideItem {
  id: string;
  image: string;
  alt: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  subcategoryName?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  price?: number;
  storeName?: string;
  isProduct?: boolean;
  onClick: () => void;
}

export const HeroProductSlider: React.FC<HeroProductSliderProps> = ({
  products,
  stores,
  banners = [],
  categories = [],
  onSelectProduct,
  onSelectStore,
  onSelectCategory
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Present a RANDOM image from EACH CATEGORY or SUBCATEGORY that has registered products
  // Automatically updates as new products are registered across categories
  const slides: SlideItem[] = useMemo(() => {
    const items: SlideItem[] = [];

    // Filter valid published products that have at least 1 valid image
    const validProducts = (products || []).filter(
      p => (p.status === 'published' || p.status === 'active') && 
           !p.deleted && 
           Array.isArray(p.images) && 
           p.images.some(img => typeof img === 'string' && img.trim().length > 0)
    );

    // Build category lookup map for fast resolution
    const catMap = new Map<string, Category>();
    (categories || []).forEach(c => {
      catMap.set(c.id, c);
      if (c.slug) catMap.set(c.slug, c);
    });

    const resolveCategoryDetails = (catId?: string, subcatId?: string) => {
      let mainCat = catId ? catMap.get(catId) : undefined;
      let subcat = subcatId ? catMap.get(subcatId) : undefined;

      // If category passed is actually a subcategory (has parentId), resolve its parent
      if (mainCat && mainCat.parentId) {
        const parent = catMap.get(mainCat.parentId);
        if (parent) {
          if (!subcat) subcat = mainCat;
          mainCat = parent;
        }
      }

      return {
        mainCat,
        subcat,
        categoryName: mainCat?.name || 'Categoría',
        categorySlug: mainCat?.slug || '',
        categoryId: mainCat?.id || catId || '',
        categoryOrder: mainCat?.order ?? 999,
        subcategoryName: subcat?.name || '',
        subcategorySlug: subcat?.slug || '',
        subcategoryId: subcat?.id || ''
      };
    };

    // Group ONLY categories and subcategories that actually contain registered products
    interface GroupData {
      mainCatId: string;
      subcatId?: string;
      categoryName: string;
      categorySlug: string;
      categoryOrder: number;
      subcategoryName?: string;
      products: Product[];
    }

    const groups = new Map<string, GroupData>();

    for (const prod of validProducts) {
      const details = resolveCategoryDetails(prod.categoryId, prod.subcategoryId);
      // Group key based on category (and subcategory if present)
      const groupKey = details.subcat 
        ? `${details.categoryId}::${details.subcat.id}`
        : `${details.categoryId}::main`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          mainCatId: details.categoryId,
          subcatId: details.subcat?.id,
          categoryName: details.categoryName,
          categorySlug: details.categorySlug,
          categoryOrder: details.categoryOrder,
          subcategoryName: details.subcategoryName,
          products: []
        });
      }
      groups.get(groupKey)!.products.push(prod);
    }

    // Sort groups by category order for consistent, elegant carousel flow
    const sortedGroups = Array.from(groups.values()).sort((a, b) => a.categoryOrder - b.categoryOrder);

    // Build one slide per category/subcategory group with a RANDOM product and RANDOM image
    for (const group of sortedGroups) {
      if (group.products.length === 0) continue;

      // Pick a random product from this category/subcategory
      const randomProd = group.products[Math.floor(Math.random() * group.products.length)];
      
      // Pick a random image from the product's valid images
      const validImages = (randomProd.images || []).filter(img => typeof img === 'string' && img.trim().length > 0);
      if (validImages.length === 0) continue;

      const randomImage = validImages[Math.floor(Math.random() * validImages.length)];
      const storeObj = stores.find(s => s.id === randomProd.storeId);

      const badgeText = group.subcategoryName 
        ? `${group.categoryName} • ${group.subcategoryName}`
        : group.categoryName;

      items.push({
        id: `slide-cat-${group.mainCatId}-${randomProd.id}`,
        image: randomImage,
        alt: randomProd.name,
        categoryId: group.mainCatId,
        categoryName: group.categoryName,
        categorySlug: group.categorySlug,
        subcategoryName: group.subcategoryName,
        title: randomProd.name,
        subtitle: randomProd.shortDescription || randomProd.description || `Disponible en ${group.categoryName}`,
        price: randomProd.price,
        storeName: storeObj?.name || 'Comercio Asociado',
        badge: badgeText,
        isProduct: true,
        onClick: () => onSelectProduct(randomProd.id)
      });
    }

    // Include custom active banners (if any are configured by Admin)
    const activeBanners = (banners || [])
      .filter(b => b.isActive && b.imageUrl)
      .sort((a, b) => a.order - b.order);

    for (const b of activeBanners) {
      items.unshift({
        id: `banner-${b.id}`,
        image: b.imageUrl,
        alt: b.title || 'Plazado.com Banner',
        title: b.title || 'Promoción Especial',
        subtitle: b.subtitle,
        badge: b.badge || 'Promoción Especial',
        isProduct: false,
        onClick: () => {
          if (b.targetType === 'PRODUCT' && b.targetValue) {
            onSelectProduct(b.targetValue);
          } else if (b.targetType === 'STORE' && b.targetValue && onSelectStore) {
            onSelectStore(b.targetValue);
          } else if (b.targetType === 'CATEGORY' && b.targetValue && onSelectCategory) {
            onSelectCategory(b.targetValue);
          } else if (b.targetType === 'URL' && b.targetValue) {
            const url = b.targetValue.startsWith('http') ? b.targetValue : `https://${b.targetValue}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }
      });
    }

    // Fallback only if there are NO products in the entire marketplace
    if (items.length === 0) {
      items.push({
        id: 'empty-hero',
        image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&auto=format&fit=crop&q=80',
        alt: 'PlazaDO.com Marketplace',
        title: 'Explora publicaciones de tiendas locales',
        subtitle: 'El marketplace oficial multi-tienda de República Dominicana',
        badge: 'PlazaDO',
        isProduct: false,
        onClick: () => {}
      });
    }

    return items;
  }, [banners, categories, products, stores, onSelectProduct, onSelectStore, onSelectCategory]);

  const total = slides.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex(prev => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex(prev => (prev - 1 + total) % total);
  }, [total]);

  // Auto-play interval: rotates smoothly every 5 seconds when not hovered
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [total, isPaused, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  if (slides.length === 0) {
    return null;
  }

  const currentSlide = slides[currentIndex] || slides[0];
  const catEmoji = currentSlide.categorySlug 
    ? getCategoryEmoji(currentSlide.categorySlug)
    : (currentSlide.categoryId ? getCategoryEmoji(currentSlide.categoryId) : '✨');

  return (
    <div 
      className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-stone-950 border border-stone-800/80 group select-none min-h-[380px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[520px] flex items-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      id="hero-full-slider-container"
    >
      {/* Background ambient glow matching current slide image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-125 opacity-25 dark:opacity-30 blur-3xl pointer-events-none"
        style={{ backgroundImage: `url(${currentSlide.image})` }}
      />
      
      {/* Deep contrast gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-stone-950/40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/50 to-transparent pointer-events-none hidden md:block" />

      {/* Main Interactive Stage with Fitted Image & Content */}
      <div 
        onClick={currentSlide.onClick}
        className="relative z-10 w-full h-full cursor-pointer p-4 sm:p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10"
      >
        {/* Left Column: Publication / Category Info */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-3 sm:space-y-4 text-left order-2 md:order-1">
          {/* Badge & Category Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1.5">
              <span>{catEmoji}</span>
              <span>{currentSlide.badge || currentSlide.categoryName || 'Categoría'}</span>
            </span>

            {currentSlide.storeName && (
              <span className="px-2.5 py-1 rounded-full bg-stone-900/80 text-stone-200 text-xs font-bold border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                <StoreIcon className="w-3.5 h-3.5 text-red-400" />
                <span>{currentSlide.storeName}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-md line-clamp-2">
            {currentSlide.title}
          </h2>

          {/* Subtitle / Description */}
          {currentSlide.subtitle && (
            <p className="text-xs sm:text-sm text-stone-300 drop-shadow line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {currentSlide.subtitle}
            </p>
          )}

          {/* Price & Action Button */}
          <div className="flex items-center gap-3 pt-2">
            {typeof currentSlide.price === 'number' && (
              <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-sm sm:text-base flex items-center gap-1.5 shadow-lg">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>RD$ {currentSlide.price.toLocaleString('es-DO')}</span>
              </div>
            )}

            <span className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-red-600/40 hover:scale-105 transition-all">
              <span>{currentSlide.isProduct ? 'Ver Publicación' : 'Explorar'}</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Right Column: Perfectly Fitted Image Stage (object-contain with showcase frame) */}
        <div className="w-full md:w-1/2 h-[220px] sm:h-[280px] md:h-[380px] lg:h-[420px] flex items-center justify-center order-1 md:order-2">
          <div className="relative w-full h-full flex items-center justify-center p-3 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.04] border border-white/10 shadow-2xl backdrop-blur-xs overflow-hidden group/img transition-all hover:border-white/20">
            <img 
              key={currentSlide.id}
              src={currentSlide.image} 
              alt={currentSlide.alt}
              className="max-h-full max-w-full w-auto h-auto object-contain drop-shadow-2xl transition-transform duration-700 ease-out group-hover/img:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&auto=format&fit=crop&q=80';
              }}
            />
          </div>
        </div>
      </div>

      {/* Floating Left & Right Navigation Arrows */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-stone-950/80 hover:bg-stone-900 text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 opacity-80 group-hover:opacity-100"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-stone-950/80 hover:bg-stone-900 text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 opacity-80 group-hover:opacity-100"
            aria-label="Siguiente slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Bottom Indicators & Thumbnails Bar */}
          <div className="absolute bottom-2.5 sm:bottom-4 inset-x-0 z-30 flex items-center justify-center gap-2 pointer-events-none">
            <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-950/85 backdrop-blur-md border border-white/15 pointer-events-auto shadow-xl max-w-[92vw] overflow-x-auto">
              <span className="text-[11px] font-bold text-stone-300 flex items-center gap-1 shrink-0">
                <span className="text-amber-400">{catEmoji}</span>
                <span className="text-white max-w-[150px] sm:max-w-[220px] truncate">{currentSlide.badge || currentSlide.categoryName || 'Categoría'}</span>
              </span>

              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-white/20 shrink-0">
                {slides.slice(0, Math.min(total, 12)).map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    title={s.badge || s.categoryName || s.title}
                    className={`transition-all duration-300 rounded-full ${
                      idx === currentIndex 
                        ? 'w-6 h-1.5 bg-red-500 shadow-sm' 
                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                    }`}
                    aria-label={`Ir a ${s.badge || s.categoryName || `slide ${idx + 1}`}`}
                  />
                ))}
              </div>

              <span className="text-[10px] font-bold text-stone-400 ml-1 shrink-0">
                <span className="text-white">{currentIndex + 1}</span>/{total}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
