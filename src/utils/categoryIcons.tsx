import React from 'react';
import { 
  Shirt, 
  Smartphone, 
  Laptop, 
  Tv, 
  Bot, 
  Home,
  UtensilsCrossed, 
  Armchair, 
  Refrigerator, 
  Sparkles, 
  SprayCan, 
  Dumbbell, 
  Baby, 
  Gamepad2, 
  PawPrint, 
  Car, 
  Hammer, 
  BookOpen, 
  ShoppingBag, 
  Gift, 
  Trees, 
  Sparkle, 
  Palette, 
  HeartPulse, 
  Building2, 
  Grid, 
  Package, 
  Headphones, 
  Watch, 
  Tablet, 
  Camera, 
  Wrench, 
  Tag, 
  Coffee, 
  Flower2, 
  Stethoscope,
  Briefcase,
  Layers,
  KeyRound,
  CarFront,
  LucideIcon
} from 'lucide-react';

export interface CategoryIconMeta {
  icon: LucideIcon;
  emoji: string;
  label: string;
  bgLight: string;
  borderLight: string;
  textColor: string;
  badgeBg: string;
}

/**
 * Mapeo oficial y exhaustivo de categorías de PlazaDO
 * Asocia a cada categoría su icono Lucide y su emoji representativo
 */
export const CATEGORY_ICONS_MAP: Record<string, CategoryIconMeta> = {
  // 1. Moda y Accesorios
  'moda-y-accesorios': {
    icon: Shirt,
    emoji: '👗',
    label: 'Moda y Accesorios',
    bgLight: 'bg-pink-50',
    borderLight: 'border-pink-200',
    textColor: 'text-pink-700',
    badgeBg: 'bg-pink-600'
  },
  'moda': {
    icon: Shirt,
    emoji: '👗',
    label: 'Moda y Accesorios',
    bgLight: 'bg-pink-50',
    borderLight: 'border-pink-200',
    textColor: 'text-pink-700',
    badgeBg: 'bg-pink-600'
  },
  'cat-moda': {
    icon: Shirt,
    emoji: '👗',
    label: 'Moda y Accesorios',
    bgLight: 'bg-pink-50',
    borderLight: 'border-pink-200',
    textColor: 'text-pink-700',
    badgeBg: 'bg-pink-600'
  },
  'moda-y-calzado': {
    icon: Shirt,
    emoji: '👗',
    label: 'Moda y Calzado',
    bgLight: 'bg-pink-50',
    borderLight: 'border-pink-200',
    textColor: 'text-pink-700',
    badgeBg: 'bg-pink-600'
  },

  // 2. Celulares y Accesorios
  'celulares-y-accesorios': {
    icon: Smartphone,
    emoji: '📱',
    label: 'Celulares y Accesorios',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-600'
  },
  'cat-celulares': {
    icon: Smartphone,
    emoji: '📱',
    label: 'Celulares y Accesorios',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-600'
  },
  'celulares': {
    icon: Smartphone,
    emoji: '📱',
    label: 'Celulares y Accesorios',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-600'
  },
  'smartphones': {
    icon: Smartphone,
    emoji: '📱',
    label: 'Smartphones',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-600'
  },
  'tablets': {
    icon: Tablet,
    emoji: '📟',
    label: 'Tablets',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    textColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-600'
  },
  'smartwatches': {
    icon: Watch,
    emoji: '⌚',
    label: 'Smartwatches',
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200',
    textColor: 'text-sky-700',
    badgeBg: 'bg-sky-600'
  },
  'audifonos': {
    icon: Headphones,
    emoji: '🎧',
    label: 'Audífonos',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    textColor: 'text-purple-700',
    badgeBg: 'bg-purple-600'
  },

  // 3. Tecnología y Computación
  'tecnologia-y-computacion': {
    icon: Laptop,
    emoji: '💻',
    label: 'Tecnología y Computación',
    bgLight: 'bg-cyan-50',
    borderLight: 'border-cyan-200',
    textColor: 'text-cyan-700',
    badgeBg: 'bg-cyan-600'
  },
  'cat-tecnologia': {
    icon: Laptop,
    emoji: '💻',
    label: 'Tecnología y Computación',
    bgLight: 'bg-cyan-50',
    borderLight: 'border-cyan-200',
    textColor: 'text-cyan-700',
    badgeBg: 'bg-cyan-600'
  },
  'tecnologia': {
    icon: Laptop,
    emoji: '💻',
    label: 'Tecnología y Computación',
    bgLight: 'bg-cyan-50',
    borderLight: 'border-cyan-200',
    textColor: 'text-cyan-700',
    badgeBg: 'bg-cyan-600'
  },

  // 4. Electrónica
  'electronica': {
    icon: Tv,
    emoji: '📺',
    label: 'Electrónica',
    bgLight: 'bg-violet-50',
    borderLight: 'border-violet-200',
    textColor: 'text-violet-700',
    badgeBg: 'bg-violet-600'
  },
  'cat-electronica': {
    icon: Tv,
    emoji: '📺',
    label: 'Electrónica',
    bgLight: 'bg-violet-50',
    borderLight: 'border-violet-200',
    textColor: 'text-violet-700',
    badgeBg: 'bg-violet-600'
  },
  'televisores': {
    icon: Tv,
    emoji: '📺',
    label: 'Televisores',
    bgLight: 'bg-violet-50',
    borderLight: 'border-violet-200',
    textColor: 'text-violet-700',
    badgeBg: 'bg-violet-600'
  },
  'camaras': {
    icon: Camera,
    emoji: '📷',
    label: 'Cámaras',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-600'
  },

  // 5. Robótica
  'robotica': {
    icon: Bot,
    emoji: '🤖',
    label: 'Robótica',
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-200',
    textColor: 'text-teal-700',
    badgeBg: 'bg-teal-600'
  },
  'cat-robotica': {
    icon: Bot,
    emoji: '🤖',
    label: 'Robótica',
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-200',
    textColor: 'text-teal-700',
    badgeBg: 'bg-teal-600'
  },

  // 6. Hogar y Cocina
  'hogar-y-cocina': {
    icon: UtensilsCrossed,
    emoji: '🍳',
    label: 'Hogar y Cocina',
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-200',
    textColor: 'text-orange-700',
    badgeBg: 'bg-orange-600'
  },
  'cat-hogar': {
    icon: UtensilsCrossed,
    emoji: '🍳',
    label: 'Hogar y Cocina',
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-200',
    textColor: 'text-orange-700',
    badgeBg: 'bg-orange-600'
  },
  'hogar': {
    icon: UtensilsCrossed,
    emoji: '🏠',
    label: 'Hogar',
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-200',
    textColor: 'text-orange-700',
    badgeBg: 'bg-orange-600'
  },

  // 7. Muebles y Decoración
  'muebles-y-decoracion': {
    icon: Armchair,
    emoji: '🛋️',
    label: 'Muebles y Decoración',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-600'
  },
  'cat-muebles': {
    icon: Armchair,
    emoji: '🛋️',
    label: 'Muebles y Decoración',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-600'
  },
  'muebles': {
    icon: Armchair,
    emoji: '🛋️',
    label: 'Muebles',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-600'
  },

  // 8. Electrodomésticos
  'electrodomesticos': {
    icon: Refrigerator,
    emoji: '🧊',
    label: 'Electrodomésticos',
    bgLight: 'bg-slate-50',
    borderLight: 'border-slate-200',
    textColor: 'text-slate-700',
    badgeBg: 'bg-slate-600'
  },
  'cat-electrodomesticos': {
    icon: Refrigerator,
    emoji: '🧊',
    label: 'Electrodomésticos',
    bgLight: 'bg-slate-50',
    borderLight: 'border-slate-200',
    textColor: 'text-slate-700',
    badgeBg: 'bg-slate-600'
  },

  // 9. Belleza y Cuidado Personal
  'belleza-y-cuidado-personal': {
    icon: Sparkles,
    emoji: '✨',
    label: 'Belleza y Cuidado',
    bgLight: 'bg-fuchsia-50',
    borderLight: 'border-fuchsia-200',
    textColor: 'text-fuchsia-700',
    badgeBg: 'bg-fuchsia-600'
  },
  'cat-belleza': {
    icon: Sparkles,
    emoji: '✨',
    label: 'Belleza y Cuidado',
    bgLight: 'bg-fuchsia-50',
    borderLight: 'border-fuchsia-200',
    textColor: 'text-fuchsia-700',
    badgeBg: 'bg-fuchsia-600'
  },
  'belleza': {
    icon: Sparkles,
    emoji: '✨',
    label: 'Belleza',
    bgLight: 'bg-fuchsia-50',
    borderLight: 'border-fuchsia-200',
    textColor: 'text-fuchsia-700',
    badgeBg: 'bg-fuchsia-600'
  },
  'belleza-y-cuidado': {
    icon: Sparkles,
    emoji: '✨',
    label: 'Belleza y Cuidado',
    bgLight: 'bg-fuchsia-50',
    borderLight: 'border-fuchsia-200',
    textColor: 'text-fuchsia-700',
    badgeBg: 'bg-fuchsia-600'
  },

  // 10. Perfumes y Fragancias
  'perfumes-y-fragancias': {
    icon: SprayCan,
    emoji: '🌸',
    label: 'Perfumes y Fragancias',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textColor: 'text-rose-700',
    badgeBg: 'bg-rose-600'
  },
  'cat-perfumes': {
    icon: SprayCan,
    emoji: '🌸',
    label: 'Perfumes y Fragancias',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textColor: 'text-rose-700',
    badgeBg: 'bg-rose-600'
  },
  'perfumes': {
    icon: SprayCan,
    emoji: '🌸',
    label: 'Perfumes',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textColor: 'text-rose-700',
    badgeBg: 'bg-rose-600'
  },

  // 11. Deportes y Fitness
  'deportes-y-fitness': {
    icon: Dumbbell,
    emoji: '🏋️',
    label: 'Deportes y Fitness',
    bgLight: 'bg-lime-50',
    borderLight: 'border-lime-200',
    textColor: 'text-lime-800',
    badgeBg: 'bg-lime-600'
  },
  'cat-deportes': {
    icon: Dumbbell,
    emoji: '🏋️',
    label: 'Deportes y Fitness',
    bgLight: 'bg-lime-50',
    borderLight: 'border-lime-200',
    textColor: 'text-lime-800',
    badgeBg: 'bg-lime-600'
  },
  'deportes': {
    icon: Dumbbell,
    emoji: '⚡',
    label: 'Deportes',
    bgLight: 'bg-lime-50',
    borderLight: 'border-lime-200',
    textColor: 'text-lime-800',
    badgeBg: 'bg-lime-600'
  },

  // 12. Bebés y Niños
  'bebes-y-ninos': {
    icon: Baby,
    emoji: '👶',
    label: 'Bebés y Niños',
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200',
    textColor: 'text-sky-700',
    badgeBg: 'bg-sky-600'
  },
  'cat-bebes': {
    icon: Baby,
    emoji: '👶',
    label: 'Bebés y Niños',
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200',
    textColor: 'text-sky-700',
    badgeBg: 'bg-sky-600'
  },

  // 13. Videojuegos y Gaming
  'videojuegos-y-gaming': {
    icon: Gamepad2,
    emoji: '🎮',
    label: 'Videojuegos y Gaming',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    textColor: 'text-purple-700',
    badgeBg: 'bg-purple-600'
  },
  'cat-gaming': {
    icon: Gamepad2,
    emoji: '🎮',
    label: 'Videojuegos y Gaming',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    textColor: 'text-purple-700',
    badgeBg: 'bg-purple-600'
  },
  'gaming': {
    icon: Gamepad2,
    emoji: '🎮',
    label: 'Videojuegos y Gaming',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    textColor: 'text-purple-700',
    badgeBg: 'bg-purple-600'
  },

  // 14. Mascotas
  'mascotas': {
    icon: PawPrint,
    emoji: '🐾',
    label: 'Mascotas',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-800',
    badgeBg: 'bg-amber-600'
  },
  'cat-mascotas': {
    icon: PawPrint,
    emoji: '🐾',
    label: 'Mascotas',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-800',
    badgeBg: 'bg-amber-600'
  },

  // 15. Vehículos y Accesorios
  'vehiculos-y-accesorios': {
    icon: Car,
    emoji: '🚗',
    label: 'Vehículos y Accesorios',
    bgLight: 'bg-red-50',
    borderLight: 'border-red-200',
    textColor: 'text-red-700',
    badgeBg: 'bg-red-600'
  },
  'cat-vehiculos': {
    icon: Car,
    emoji: '🚗',
    label: 'Vehículos y Accesorios',
    bgLight: 'bg-red-50',
    borderLight: 'border-red-200',
    textColor: 'text-red-700',
    badgeBg: 'bg-red-600'
  },

  // 26. Rent Car
  'rent-car': {
    icon: KeyRound,
    emoji: '🔑',
    label: 'Rent Car',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-600'
  },
  'cat-rent-car': {
    icon: KeyRound,
    emoji: '🔑',
    label: 'Rent Car',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-600'
  },
  'alquiler-vehiculos': {
    icon: KeyRound,
    emoji: '🔑',
    label: 'Rent Car',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-600'
  },

  // 27. Dealer
  'dealer': {
    icon: CarFront,
    emoji: '🏎️',
    label: 'Dealer',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-600'
  },
  'cat-dealer': {
    icon: CarFront,
    emoji: '🏎️',
    label: 'Dealer',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-600'
  },
  'dealers': {
    icon: CarFront,
    emoji: '🏎️',
    label: 'Dealer',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-600'
  },

  // 16. Ferretería y Construcción
  'ferreteria-y-construccion': {
    icon: Hammer,
    emoji: '🔨',
    label: 'Ferretería y Construcción',
    bgLight: 'bg-yellow-50',
    borderLight: 'border-yellow-200',
    textColor: 'text-yellow-800',
    badgeBg: 'bg-yellow-600'
  },
  'cat-ferreteria': {
    icon: Hammer,
    emoji: '🔨',
    label: 'Ferretería y Construcción',
    bgLight: 'bg-yellow-50',
    borderLight: 'border-yellow-200',
    textColor: 'text-yellow-800',
    badgeBg: 'bg-yellow-600'
  },

  // 17. Librería y Oficina
  'libreria-y-oficina': {
    icon: BookOpen,
    emoji: '📚',
    label: 'Librería y Oficina',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    textColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-600'
  },
  'cat-libreria': {
    icon: BookOpen,
    emoji: '📚',
    label: 'Librería y Oficina',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    textColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-600'
  },

  // 18. Supermercado y Alimentos
  'supermercado-y-alimentos': {
    icon: ShoppingBag,
    emoji: '🛒',
    label: 'Supermercado y Alimentos',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-600'
  },
  'cat-alimentos': {
    icon: ShoppingBag,
    emoji: '🛒',
    label: 'Supermercado y Alimentos',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-600'
  },
  'alimentos-y-bebidas': {
    icon: ShoppingBag,
    emoji: '☕',
    label: 'Alimentos y Bebidas',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-600'
  },
  'alimentos': {
    icon: ShoppingBag,
    emoji: '☕',
    label: 'Alimentos',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-600'
  },

  // 19. Regalos y Detalles
  'regalos-y-detalles': {
    icon: Gift,
    emoji: '🎁',
    label: 'Regalos y Detalles',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textColor: 'text-rose-700',
    badgeBg: 'bg-rose-600'
  },
  'cat-regalos': {
    icon: Gift,
    emoji: '🎁',
    label: 'Regalos y Detalles',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textColor: 'text-rose-700',
    badgeBg: 'bg-rose-600'
  },

  // 20. Jardín y Exterior
  'jardin-y-exterior': {
    icon: Trees,
    emoji: '🌿',
    label: 'Jardín y Exterior',
    bgLight: 'bg-green-50',
    borderLight: 'border-green-200',
    textColor: 'text-green-700',
    badgeBg: 'bg-green-600'
  },
  'cat-jardin': {
    icon: Trees,
    emoji: '🌿',
    label: 'Jardín y Exterior',
    bgLight: 'bg-green-50',
    borderLight: 'border-green-200',
    textColor: 'text-green-700',
    badgeBg: 'bg-green-600'
  },

  // 21. Limpieza y Cuidado del Hogar
  'limpieza-y-cuidado-del-hogar': {
    icon: Sparkle,
    emoji: '🧼',
    label: 'Limpieza y Hogar',
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-200',
    textColor: 'text-teal-700',
    badgeBg: 'bg-teal-600'
  },
  'cat-limpieza': {
    icon: Sparkle,
    emoji: '🧼',
    label: 'Limpieza y Hogar',
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-200',
    textColor: 'text-teal-700',
    badgeBg: 'bg-teal-600'
  },

  // 22. Artesanía y Productos Personalizados
  'artesania-y-productos-personalizados': {
    icon: Palette,
    emoji: '🎨',
    label: 'Artesanía y Personalizados',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-800',
    badgeBg: 'bg-amber-600'
  },
  'cat-artesania': {
    icon: Palette,
    emoji: '🎨',
    label: 'Artesanía y Personalizados',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-800',
    badgeBg: 'bg-amber-600'
  },

  // 23. Salud y Bienestar
  'salud-y-bienestar': {
    icon: HeartPulse,
    emoji: '🩺',
    label: 'Salud y Bienestar',
    bgLight: 'bg-red-50',
    borderLight: 'border-red-200',
    textColor: 'text-red-700',
    badgeBg: 'bg-red-600'
  },
  'cat-salud': {
    icon: HeartPulse,
    emoji: '🩺',
    label: 'Salud y Bienestar',
    bgLight: 'bg-red-50',
    borderLight: 'border-red-200',
    textColor: 'text-red-700',
    badgeBg: 'bg-red-600'
  },

  // 24. Negocios e Industria
  'negocios-e-industria': {
    icon: Building2,
    emoji: '🏭',
    label: 'Negocios e Industria',
    bgLight: 'bg-stone-100',
    borderLight: 'border-stone-300',
    textColor: 'text-stone-800',
    badgeBg: 'bg-stone-700'
  },
  'cat-negocios': {
    icon: Building2,
    emoji: '🏭',
    label: 'Negocios e Industria',
    bgLight: 'bg-stone-100',
    borderLight: 'border-stone-300',
    textColor: 'text-stone-800',
    badgeBg: 'bg-stone-700'
  },

  // 25. Otros
  'otros': {
    icon: Grid,
    emoji: '📦',
    label: 'Otros',
    bgLight: 'bg-stone-50',
    borderLight: 'border-stone-200',
    textColor: 'text-stone-700',
    badgeBg: 'bg-stone-600'
  },
  'cat-otros': {
    icon: Grid,
    emoji: '📦',
    label: 'Otros',
    bgLight: 'bg-stone-50',
    borderLight: 'border-stone-200',
    textColor: 'text-stone-700',
    badgeBg: 'bg-stone-600'
  }
};

/**
 * Mapeo directo por nombre del icono Lucide (e.g. 'Shirt', 'PawPrint', 'Tv')
 */
export const LUCIDE_NAME_MAP: Record<string, { icon: LucideIcon; emoji: string }> = {
  Shirt: { icon: Shirt, emoji: '👗' },
  Smartphone: { icon: Smartphone, emoji: '📱' },
  Tablet: { icon: Tablet, emoji: '📟' },
  Watch: { icon: Watch, emoji: '⌚' },
  Laptop: { icon: Laptop, emoji: '💻' },
  Tv: { icon: Tv, emoji: '📺' },
  Bot: { icon: Bot, emoji: '🤖' },
  Home: { icon: Home, emoji: '🏠' },
  Utensils: { icon: UtensilsCrossed, emoji: '🍳' },
  UtensilsCrossed: { icon: UtensilsCrossed, emoji: '🍳' },
  Armchair: { icon: Armchair, emoji: '🛋️' },
  Refrigerator: { icon: Refrigerator, emoji: '🧊' },
  Sparkles: { icon: Sparkles, emoji: '✨' },
  SprayCan: { icon: SprayCan, emoji: '🌸' },
  Dumbbell: { icon: Dumbbell, emoji: '🏋️' },
  Baby: { icon: Baby, emoji: '👶' },
  Gamepad2: { icon: Gamepad2, emoji: '🎮' },
  PawPrint: { icon: PawPrint, emoji: '🐾' },
  Car: { icon: Car, emoji: '🚗' },
  Hammer: { icon: Hammer, emoji: '🔨' },
  Wrench: { icon: Wrench, emoji: '🔧' },
  BookOpen: { icon: BookOpen, emoji: '📚' },
  Book: { icon: BookOpen, emoji: '📚' },
  ShoppingBag: { icon: ShoppingBag, emoji: '🛒' },
  Coffee: { icon: Coffee, emoji: '☕' },
  Gift: { icon: Gift, emoji: '🎁' },
  Trees: { icon: Trees, emoji: '🌿' },
  Sparkle: { icon: Sparkle, emoji: '🧼' },
  Palette: { icon: Palette, emoji: '🎨' },
  HeartPulse: { icon: HeartPulse, emoji: '🩺' },
  Heart: { icon: HeartPulse, emoji: '🩺' },
  Building2: { icon: Building2, emoji: '🏭' },
  Grid: { icon: Grid, emoji: '📦' },
  Package: { icon: Package, emoji: '📦' },
  Headphones: { icon: Headphones, emoji: '🎧' },
  Camera: { icon: Camera, emoji: '📷' },
  Tag: { icon: Tag, emoji: '🏷️' },
  Layers: { icon: Layers, emoji: '🗂️' },
  Folder: { icon: Package, emoji: '📁' }
};

/**
 * Obtiene los metadatos completos y el icono acorde a la categoría indicada.
 * Busca por slug, id, icono lucide o palabras clave en el nombre.
 */
export function getCategoryMeta(categoryOrKey?: { slug?: string; id?: string; name?: string; icon?: string } | string | null): CategoryIconMeta {
  if (!categoryOrKey) {
    return {
      icon: Package,
      emoji: '📦',
      label: 'General',
      bgLight: 'bg-stone-50',
      borderLight: 'border-stone-200',
      textColor: 'text-stone-700',
      badgeBg: 'bg-stone-600'
    };
  }

  const slug = typeof categoryOrKey === 'string' ? categoryOrKey : (categoryOrKey.slug || categoryOrKey.id || '');
  const iconName = typeof categoryOrKey === 'object' && categoryOrKey ? categoryOrKey.icon : undefined;
  const name = typeof categoryOrKey === 'object' && categoryOrKey ? categoryOrKey.name : '';

  const cleanSlug = slug.toLowerCase().trim();

  // 1. Coincidencia directa por slug o ID
  if (CATEGORY_ICONS_MAP[cleanSlug]) {
    return CATEGORY_ICONS_MAP[cleanSlug];
  }

  // 2. Coincidencia por nombre de icono asignado a la categoría
  if (iconName && LUCIDE_NAME_MAP[iconName]) {
    const item = LUCIDE_NAME_MAP[iconName];
    return {
      icon: item.icon,
      emoji: item.emoji,
      label: name || cleanSlug,
      bgLight: 'bg-stone-50',
      borderLight: 'border-stone-200',
      textColor: 'text-stone-700',
      badgeBg: 'bg-stone-600'
    };
  }

  // 3. Coincidencia por palabras clave en slug o nombre
  const searchStr = `${cleanSlug} ${(name || '').toLowerCase()}`;

  if (searchStr.includes('celular') || searchStr.includes('smartphone') || searchStr.includes('telefono')) {
    return CATEGORY_ICONS_MAP['celulares-y-accesorios'];
  }
  if (searchStr.includes('tablet') || searchStr.includes('ipad')) {
    return CATEGORY_ICONS_MAP['tablets'];
  }
  if (searchStr.includes('reloj') || searchStr.includes('smartwatch')) {
    return CATEGORY_ICONS_MAP['smartwatches'];
  }
  if (searchStr.includes('audifono') || searchStr.includes('auricular') || searchStr.includes('sound')) {
    return CATEGORY_ICONS_MAP['audifonos'];
  }
  if (searchStr.includes('comput') || searchStr.includes('laptop') || searchStr.includes('pc')) {
    return CATEGORY_ICONS_MAP['tecnologia-y-computacion'];
  }
  if (searchStr.includes('robot') || searchStr.includes('automatiz')) {
    return CATEGORY_ICONS_MAP['robotica'];
  }
  if (searchStr.includes('electron') || searchStr.includes('tv') || searchStr.includes('tele')) {
    return CATEGORY_ICONS_MAP['electronica'];
  }
  if (searchStr.includes('camara') || searchStr.includes('foto')) {
    return CATEGORY_ICONS_MAP['camaras'];
  }
  if (searchStr.includes('ropa') || searchStr.includes('moda') || searchStr.includes('calzado') || searchStr.includes('chacabana')) {
    return CATEGORY_ICONS_MAP['moda-y-accesorios'];
  }
  if (searchStr.includes('hogar') || searchStr.includes('cocina') || searchStr.includes('olla')) {
    return CATEGORY_ICONS_MAP['hogar-y-cocina'];
  }
  if (searchStr.includes('mueble') || searchStr.includes('sofa') || searchStr.includes('sala') || searchStr.includes('decor')) {
    return CATEGORY_ICONS_MAP['muebles-y-decoracion'];
  }
  if (searchStr.includes('electro') || searchStr.includes('nevera') || searchStr.includes('lavadora')) {
    return CATEGORY_ICONS_MAP['electrodomesticos'];
  }
  if (searchStr.includes('belleza') || searchStr.includes('facial') || searchStr.includes('maquillaje')) {
    return CATEGORY_ICONS_MAP['belleza-y-cuidado-personal'];
  }
  if (searchStr.includes('perfume') || searchStr.includes('fragancia') || searchStr.includes('colonia')) {
    return CATEGORY_ICONS_MAP['perfumes-y-fragancias'];
  }
  if (searchStr.includes('deporte') || searchStr.includes('fitness') || searchStr.includes('gym') || searchStr.includes('pesas')) {
    return CATEGORY_ICONS_MAP['deportes-y-fitness'];
  }
  if (searchStr.includes('bebe') || searchStr.includes('niño') || searchStr.includes('cuna')) {
    return CATEGORY_ICONS_MAP['bebes-y-ninos'];
  }
  if (searchStr.includes('game') || searchStr.includes('juego') || searchStr.includes('playstation') || searchStr.includes('nintendo') || searchStr.includes('xbox')) {
    return CATEGORY_ICONS_MAP['videojuegos-y-gaming'];
  }
  if (searchStr.includes('mascota') || searchStr.includes('perro') || searchStr.includes('gato') || searchStr.includes('veterinar')) {
    return CATEGORY_ICONS_MAP['mascotas'];
  }
  if (searchStr.includes('vehiculo') || searchStr.includes('auto') || searchStr.includes('carro') || searchStr.includes('moto') || searchStr.includes('repuesto')) {
    return CATEGORY_ICONS_MAP['vehiculos-y-accesorios'];
  }
  if (searchStr.includes('ferret') || searchStr.includes('construc') || searchStr.includes('herramienta') || searchStr.includes('pintura')) {
    return CATEGORY_ICONS_MAP['ferreteria-y-construccion'];
  }
  if (searchStr.includes('libro') || searchStr.includes('oficina') || searchStr.includes('papel') || searchStr.includes('utiles')) {
    return CATEGORY_ICONS_MAP['libreria-y-oficina'];
  }
  if (searchStr.includes('supermercado') || searchStr.includes('alimento') || searchStr.includes('bebida') || searchStr.includes('cafe') || searchStr.includes('comida')) {
    return CATEGORY_ICONS_MAP['supermercado-y-alimentos'];
  }
  if (searchStr.includes('regalo') || searchStr.includes('detalle') || searchStr.includes('flor') || searchStr.includes('peluche')) {
    return CATEGORY_ICONS_MAP['regalos-y-detalles'];
  }
  if (searchStr.includes('jardin') || searchStr.includes('planta') || searchStr.includes('exterior') || searchStr.includes('terraza')) {
    return CATEGORY_ICONS_MAP['jardin-y-exterior'];
  }
  if (searchStr.includes('limpieza') || searchStr.includes('detergente') || searchStr.includes('desinfectante')) {
    return CATEGORY_ICONS_MAP['limpieza-y-cuidado-del-hogar'];
  }
  if (searchStr.includes('artesan') || searchStr.includes('personaliz') || searchStr.includes('cuadro')) {
    return CATEGORY_ICONS_MAP['artesania-y-productos-personalizados'];
  }
  if (searchStr.includes('salud') || searchStr.includes('medico') || searchStr.includes('farmacia') || searchStr.includes('bienestar')) {
    return CATEGORY_ICONS_MAP['salud-y-bienestar'];
  }
  if (searchStr.includes('negocio') || searchStr.includes('industr') || searchStr.includes('empresa') || searchStr.includes('maquinaria')) {
    return CATEGORY_ICONS_MAP['negocios-e-industria'];
  }

  // Fallback por defecto
  return {
    icon: Package,
    emoji: '📦',
    label: name || 'Categoría',
    bgLight: 'bg-stone-50',
    borderLight: 'border-stone-200',
    textColor: 'text-stone-700',
    badgeBg: 'bg-stone-600'
  };
}

/**
 * Retorna el componente de icono Lucide correspondiente a la categoría
 */
export function getCategoryLucideIcon(categoryOrKey?: { slug?: string; id?: string; name?: string; icon?: string } | string | null): LucideIcon {
  return getCategoryMeta(categoryOrKey).icon;
}

/**
 * Retorna el emoji correspondiente a la categoría
 */
export function getCategoryEmoji(categoryOrKey?: { slug?: string; id?: string; name?: string; icon?: string } | string | null): string {
  return getCategoryMeta(categoryOrKey).emoji;
}

/**
 * Componente React CategoryIcon: Renderiza el icono acorde a la categoría
 */
interface CategoryIconProps {
  category?: { slug?: string; id?: string; name?: string; icon?: string } | string | null;
  className?: string;
  size?: number;
  mode?: 'icon' | 'emoji' | 'badge';
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  category, 
  className = 'w-5 h-5', 
  size,
  mode = 'icon' 
}) => {
  const meta = getCategoryMeta(category);
  const IconComponent = meta.icon;

  if (mode === 'emoji') {
    return <span className={className} role="img" aria-label={meta.label}>{meta.emoji}</span>;
  }

  if (mode === 'badge') {
    return (
      <span className={`inline-flex items-center justify-center rounded-xl p-2 ${meta.bgLight} ${meta.borderLight} ${meta.textColor} border shadow-2xs`}>
        <IconComponent className={className} size={size} />
      </span>
    );
  }

  return <IconComponent className={className} size={size} />;
};
