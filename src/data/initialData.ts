import { 
  User, 
  Store, 
  Category, 
  Product, 
  Order, 
  StoreBalance, 
  Settlement, 
  Dispute, 
  Coupon, 
  Banner, 
  SupportTicket, 
  AuditLog, 
  SystemSettings 
} from '../types';

export const DOMINICAN_PROVINCES = [
  'Distrito Nacional',
  'Santo Domingo',
  'Santiago',
  'La Vega',
  'Puerto Plata',
  'San Cristóbal',
  'La Altagracia (Punta Cana / Higüey)',
  'San Pedro de Macorís',
  'La Romana',
  'Duarte (San Francisco de Macorís)',
  'Espaillat (Moca)',
  'Peravia (Baní)',
  'Azua',
  'Barahona',
  'Samaná',
  'Monte Plata',
  'Monseñor Nouel (Bonao)',
  'María Trinidad Sánchez',
  'Sánchez Ramírez',
  'Valverde',
  'San Juan'
];

export const DOMINICAN_BANKS = [
  'Banco Popular Dominicano',
  'Banco de Reservas (Banreservas)',
  'Banco BHD',
  'Banco Santa Cruz',
  'Scotiabank República Dominicana',
  'Asociación Popular de Ahorros y Préstamos (APAP)',
  'Banco Promerica',
  'Banco Caribe',
  'Banco BACC',
  'Banco Vimenca'
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-tecnologia',
    name: 'Tecnología',
    slug: 'tecnologia',
    icon: 'Smartphone',
    description: 'Celulares, laptops, accesorios y electrónica en general',
    parentId: null,
    order: 1
  },
  {
    id: 'cat-moda',
    name: 'Moda y Calzado',
    slug: 'moda-y-calzado',
    icon: 'Shirt',
    description: 'Ropa, zapatos, carteras y accesorios para damas, caballeros y niños',
    parentId: null,
    order: 2
  },
  {
    id: 'cat-hogar',
    name: 'Hogar y Decoración',
    slug: 'hogar-y-decoracion',
    icon: 'Home',
    description: 'Muebles, cocina, organización y artículos para tu casa',
    parentId: null,
    order: 3
  },
  {
    id: 'cat-mascotas',
    name: 'Mascotas',
    slug: 'mascotas',
    icon: 'PawPrint',
    description: 'Alimentos, accesorios, higiene y juguetes para perros, gatos y otras mascotas',
    parentId: null,
    order: 4
  },
  {
    id: 'cat-belleza',
    name: 'Belleza y Cuidado',
    slug: 'belleza-y-cuidado',
    icon: 'Sparkles',
    description: 'Cosméticos, cuidado de la piel, perfumes y cuidado personal',
    parentId: null,
    order: 5
  },
  {
    id: 'cat-deportes',
    name: 'Deportes y Fitness',
    slug: 'deportes-y-fitness',
    icon: 'Dumbbell',
    description: 'Equipamiento deportivo, ropa fitness y suplementos',
    parentId: null,
    order: 6
  },
  {
    id: 'cat-alimentos',
    name: 'Alimentos y Bebidas',
    slug: 'alimentos-y-bebidas',
    icon: 'Utensils',
    description: 'Productos locales, café dominicano, snacks y delicatessen',
    parentId: null,
    order: 7
  },
  // Subcategorías de Mascotas (Cumplimiento estricto del punto #9: Unificado bajo Mascotas)
  {
    id: 'subcat-mascotas-perros',
    name: 'Perros',
    slug: 'perros',
    icon: 'Dog',
    description: 'Comida, snacks, correas y juguetes para caninos',
    parentId: 'cat-mascotas',
    order: 1
  },
  {
    id: 'subcat-mascotas-gatos',
    name: 'Gatos',
    slug: 'gatos',
    icon: 'Cat',
    description: 'Arenas, rascadores, comida y accesorios felinos',
    parentId: 'cat-mascotas',
    order: 2
  },
  {
    id: 'subcat-mascotas-accesorios',
    name: 'Accesorios e Higiene',
    slug: 'accesorios-e-higiene-mascotas',
    icon: 'Bath',
    description: 'Shampoos, cepillos, camitas y comederos',
    parentId: 'cat-mascotas',
    order: 3
  },
  // Subcategorías Tecnología
  {
    id: 'subcat-tec-audio',
    name: 'Audio y Auriculares',
    slug: 'audio-y-auriculares',
    icon: 'Headphones',
    parentId: 'cat-tecnologia',
    order: 1
  },
  {
    id: 'subcat-tec-cargadores',
    name: 'Cables y Cargadores',
    slug: 'cables-y-cargadores',
    icon: 'Zap',
    parentId: 'cat-tecnologia',
    order: 2
  }
];

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-techzone',
    name: 'TechZone RD',
    slug: 'techzone-rd',
    ownerName: 'Carlos Santana',
    email: 'contacto@techzonerd.com',
    phone: '809-555-8324',
    whatsapp: '809-555-8324',
    description: 'Comercio oficial de tecnología y electrónica en Santo Domingo. Especialistas en smartphones, laptops, audio y accesorios con garantía local.',
    categoryId: 'cat-tecnologia',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80',
    province: 'Distrito Nacional',
    municipality: 'Santo Domingo de Guzmán',
    address: 'Av. Winston Churchill #109, Piantini',
    status: 'APPROVED',
    isPublished: true,
    rating: 4.9,
    reviewCount: 84,
    salesCount: 312,
    shippingConfig: {
      type: 'fixed',
      fixedRate: 200,
      estimatedDays: '24 a 48 horas',
      coverageProvinces: ['Distrito Nacional', 'Santo Domingo', 'Santiago']
    },
    bankInfo: {
      bank: 'Banco Popular Dominicano',
      accountType: 'CORRIENTE',
      accountNumber: '792184902',
      accountHolder: 'TechZone Soluciones EIRL',
      rncOrCedula: '131-89214-5'
    },
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'store-modacriolla',
    name: 'Moda Criolla RD',
    slug: 'moda-criolla-rd',
    ownerName: 'Rosa Almonte',
    email: 'ventas@modacriollard.com',
    phone: '809-582-4110',
    whatsapp: '809-582-4110',
    description: 'Confecciones dominicanas de alta costura, chacabanas en lino 100% puro, calzado artesanal en cuero y moda caribeña para damas y caballeros.',
    categoryId: 'cat-moda',
    logo: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
    province: 'Santiago',
    municipality: 'Santiago de los Caballeros',
    address: 'Calle del Sol #45, Centro Histórico',
    status: 'APPROVED',
    isPublished: true,
    rating: 4.8,
    reviewCount: 52,
    salesCount: 194,
    shippingConfig: {
      type: 'fixed',
      fixedRate: 250,
      estimatedDays: '24 a 48 horas',
      coverageProvinces: ['Santiago', 'Distrito Nacional', 'La Vega', 'Puerto Plata']
    },
    bankInfo: {
      bank: 'Banco de Reservas (Banreservas)',
      accountType: 'CORRIENTE',
      accountNumber: '2401894101',
      accountHolder: 'Confecciones Rosa Almonte SRL',
      rncOrCedula: '130-94125-2'
    },
    createdAt: '2026-01-12T11:30:00Z'
  },
  {
    id: 'store-petlovers',
    name: 'PetLovers Dominicana',
    slug: 'petlovers-dominicana',
    ownerName: 'Dr. Manuel Peña',
    email: 'servicio@petloversrd.com',
    phone: '809-688-9900',
    whatsapp: '809-688-9900',
    description: 'Nutrición veterinaria premium, camas ortopédicas, higiene y accesorios interactivos para consentir a los peludos del hogar en toda República Dominicana.',
    categoryId: 'cat-mascotas',
    logo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1600&auto=format&fit=crop&q=80',
    province: 'Santo Domingo',
    municipality: 'Santo Domingo Este',
    address: 'Av. San Vicente de Paúl #88, Alma Rosa',
    status: 'APPROVED',
    isPublished: true,
    rating: 5.0,
    reviewCount: 96,
    salesCount: 410,
    shippingConfig: {
      type: 'fixed',
      fixedRate: 180,
      estimatedDays: 'Mismo día / 24 hrs',
      coverageProvinces: ['Distrito Nacional', 'Santo Domingo']
    },
    bankInfo: {
      bank: 'Banco BHD',
      accountType: 'AHORROS',
      accountNumber: '0812948123',
      accountHolder: 'Manuel Peña PetCare',
      rncOrCedula: '001-1928412-4'
    },
    createdAt: '2026-01-15T09:15:00Z'
  },
  {
    id: 'store-hogardeco',
    name: 'Hogar & Deco Bella Vista',
    slug: 'hogar-deco-bella-vista',
    ownerName: 'Elena Rosario',
    email: 'info@hogardecord.com',
    phone: '809-535-7766',
    whatsapp: '809-535-7766',
    description: 'Artículos de diseño de interiores, iluminación tejida a mano, vajillas cerámicas artesanales y detalles decorativos para transformar tu hogar.',
    categoryId: 'cat-hogar',
    logo: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=300&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80',
    province: 'Distrito Nacional',
    municipality: 'Santo Domingo de Guzmán',
    address: 'Av. Rómulo Betancourt #1420, Bella Vista',
    status: 'APPROVED',
    isPublished: true,
    rating: 4.7,
    reviewCount: 38,
    salesCount: 145,
    shippingConfig: {
      type: 'fixed',
      fixedRate: 220,
      estimatedDays: '24 a 48 horas',
      coverageProvinces: ['Distrito Nacional', 'Santo Domingo']
    },
    bankInfo: {
      bank: 'Banco Santa Cruz',
      accountType: 'CORRIENTE',
      accountNumber: '551928410',
      accountHolder: 'DecoHogar Dominicana SRL',
      rncOrCedula: '132-84192-1'
    },
    createdAt: '2026-01-18T14:20:00Z'
  },
  {
    id: 'store-saboresrd',
    name: 'Sabores & Café Quisqueya',
    slug: 'sabores-cafe-quisqueya',
    ownerName: 'Eduardo Henríquez',
    email: 'pedidos@saboresquisqueya.do',
    phone: '809-525-1122',
    whatsapp: '809-525-1122',
    description: 'Café de altura de Jarabacoa y Polo Barahona, cacao orgánico dominicano, dulces tradicionales y miel silvestre cosechada en la Cordillera Central.',
    categoryId: 'cat-alimentos',
    logo: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=300&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&auto=format&fit=crop&q=80',
    province: 'La Vega',
    municipality: 'Jarabacoa',
    address: 'Carretera Jarabacoa-Constanza Km 3',
    status: 'APPROVED',
    isPublished: true,
    rating: 4.9,
    reviewCount: 67,
    salesCount: 280,
    shippingConfig: {
      type: 'fixed',
      fixedRate: 200,
      estimatedDays: '24 a 48 horas',
      coverageProvinces: ['La Vega', 'Distrito Nacional', 'Santiago', 'Santo Domingo']
    },
    bankInfo: {
      bank: 'Banco Popular Dominicano',
      accountType: 'CORRIENTE',
      accountNumber: '819204128',
      accountHolder: 'Sabores Quisqueyanos SRL',
      rncOrCedula: '131-09412-8'
    },
    createdAt: '2026-01-20T08:45:00Z'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  // TechZone RD
  {
    id: 'prod-tech-1',
    storeId: 'store-techzone',
    name: 'Apple iPhone 15 Pro 256GB - Titanio Natural',
    slug: 'apple-iphone-15-pro-256gb-titanio-natural',
    description: 'Smartphone insignia Apple con acabado en titanio de grado aeroespacial, chip A17 Pro revolucionario, cámara principal de 48 MP y puerto USB-C con velocidades USB 3. Equipo nuevo sellado con garantía oficial local en Santo Domingo.',
    shortDescription: 'Chip A17 Pro, cámara 48MP, titanio de grado aeroespacial.',
    categoryId: 'cat-tecnologia',
    subcategoryId: 'subcat-tec-audio',
    price: 68900,
    promoPrice: 65900,
    sku: 'IPH15P-256-NAT',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 14,
    reservedStock: 0,
    soldCount: 42,
    minStockAlert: 3,
    status: 'published',
    rating: 4.9,
    reviewCount: 28,
    isFeatured: true,
    createdAt: '2026-01-10T12:00:00Z'
  },
  {
    id: 'prod-tech-2',
    storeId: 'store-techzone',
    name: 'Apple AirPods Pro 2da Generación con USB-C',
    slug: 'apple-airpods-pro-2da-generacion-usb-c',
    description: 'Auriculares inalámbricos con cancelación activa de ruido hasta 2x superior, audio espacial personalizado con seguimiento dinámico de la cabeza y estuche MagSafe USB-C resistente al agua y polvo IP54.',
    shortDescription: 'Cancelación activa de ruido y audio espacial inmersivo.',
    categoryId: 'cat-tecnologia',
    subcategoryId: 'subcat-tec-audio',
    price: 13900,
    promoPrice: 12490,
    sku: 'APP2-USBC-WHT',
    images: [
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 25,
    reservedStock: 0,
    soldCount: 88,
    minStockAlert: 5,
    status: 'published',
    rating: 4.8,
    reviewCount: 39,
    isFeatured: true,
    createdAt: '2026-01-11T14:30:00Z'
  },
  {
    id: 'prod-tech-3',
    storeId: 'store-techzone',
    name: 'MacBook Air 13.6" M3 - 8GB / 512GB SSD Medianoche',
    slug: 'macbook-air-13-m3-512gb-medianoche',
    description: 'Laptop ultradelgada y ligera con el chip Apple M3 de última generación. Pantalla Liquid Retina de 13.6 pulgadas, cámara FaceTime HD de 1080p y hasta 18 horas de batería ininterrumpida.',
    categoryId: 'cat-tecnologia',
    price: 74500,
    promoPrice: 71900,
    sku: 'MBA13-M3-512-MDN',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 8,
    reservedStock: 0,
    soldCount: 19,
    minStockAlert: 2,
    status: 'published',
    rating: 5.0,
    reviewCount: 15,
    isFeatured: true,
    createdAt: '2026-01-12T10:00:00Z'
  },

  // Moda Criolla RD
  {
    id: 'prod-moda-1',
    storeId: 'store-modacriolla',
    name: 'Chacabana Clásica Manga Larga Lino Puro Italiano - Blanco Nieve',
    slug: 'chacabana-clasica-manga-larga-lino-puro-blanco',
    description: 'Elegante chacabana tradicional dominicana confeccionada en 100% lino de primera calidad. Corte impecable, cuatro bolsillos frontales con alforzado fino hecho a mano por sastres en Santiago.',
    shortDescription: '100% lino puro, alforzado artesanal tradicional dominicano.',
    categoryId: 'cat-moda',
    price: 4800,
    promoPrice: 4250,
    sku: 'CHA-LIN-ML-WHT',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620012253295-c15c429fbb41?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 30,
    reservedStock: 0,
    soldCount: 64,
    minStockAlert: 5,
    status: 'published',
    rating: 4.9,
    reviewCount: 31,
    isFeatured: true,
    createdAt: '2026-01-12T16:00:00Z'
  },
  {
    id: 'prod-moda-2',
    storeId: 'store-modacriolla',
    name: 'Sandalias Artesanales en Cuero Genuino Dominicano',
    slug: 'sandalias-artesanales-cuero-genuino-dominicano',
    description: 'Calzado artesanal en cuero vacuno curtido al natural con suela antideslizante flexible. Ideal para el clima tropical con máxima comodidad para uso diario.',
    categoryId: 'cat-moda',
    price: 2400,
    sku: 'SAN-CUE-DOM-BRN',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 22,
    reservedStock: 0,
    soldCount: 35,
    minStockAlert: 4,
    status: 'published',
    rating: 4.7,
    reviewCount: 18,
    isFeatured: false,
    createdAt: '2026-01-13T11:00:00Z'
  },

  // PetLovers Dominicana
  {
    id: 'prod-pet-1',
    storeId: 'store-petlovers',
    name: 'Alimento Canino Super Premium Adulto Salmón & Arroz Integral 30 Lbs',
    slug: 'alimento-canino-super-premium-salmon-30lb',
    description: 'Fórmula nutricional completa elaborada con salmón fresco del Atlántico, ácidos grasos Omega 3 y 6 para un pelaje brillante y glucosamina para articulaciones saludables. Recomendado para razas medianas y grandes.',
    shortDescription: 'Salmón fresco, Omega 3 y 6, nutrición completa premium.',
    categoryId: 'cat-mascotas',
    subcategoryId: 'subcat-mascotas-perros',
    price: 4200,
    promoPrice: 3850,
    sku: 'DOG-SALM-30LB',
    images: [
      'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 18,
    reservedStock: 0,
    soldCount: 92,
    minStockAlert: 4,
    status: 'published',
    rating: 5.0,
    reviewCount: 45,
    isFeatured: true,
    createdAt: '2026-01-15T12:00:00Z'
  },
  {
    id: 'prod-pet-2',
    storeId: 'store-petlovers',
    name: 'Cama Ortopédica Antiestrés Acolchada para Mascotas - Tamaño L',
    slug: 'cama-ortopedica-antiestres-mascotas-l',
    description: 'Cama circular con borde acolchado envolvente de felpa ultra suave que alivia la ansiedad y brinda soporte ortopédico para articulaciones y cuello. Funda desmontable y lavable.',
    categoryId: 'cat-mascotas',
    subcategoryId: 'subcat-mascotas-perros',
    price: 2650,
    promoPrice: 2290,
    sku: 'PET-BED-ORT-L',
    images: [
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 16,
    reservedStock: 0,
    soldCount: 54,
    minStockAlert: 3,
    status: 'published',
    rating: 4.8,
    reviewCount: 22,
    isFeatured: true,
    createdAt: '2026-01-16T15:00:00Z'
  },

  // Hogar & Deco Bella Vista
  {
    id: 'prod-hogar-1',
    storeId: 'store-hogardeco',
    name: 'Lámpara de Mesa Rústica Caribeña Tejida en Fibra Natural',
    slug: 'lampara-mesa-rustica-caribena-fibra-natural',
    description: 'Lámpara de acento hecha a mano con fibras de ratán y base de madera sólida dominicana. Produce una luz cálida y acogedora ideal para salas y habitaciones.',
    categoryId: 'cat-hogar',
    price: 3200,
    sku: 'LAM-FIB-NAT-01',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 12,
    reservedStock: 0,
    soldCount: 26,
    minStockAlert: 2,
    status: 'published',
    rating: 4.9,
    reviewCount: 14,
    isFeatured: true,
    createdAt: '2026-01-18T16:00:00Z'
  },

  // Sabores & Café Quisqueya
  {
    id: 'prod-sabor-1',
    storeId: 'store-saboresrd',
    name: 'Café de Altura de Jarabacoa 100% Arábica Tostado en Grano 1 Lb',
    slug: 'cafe-altura-jarabacoa-arabica-grano-1lb',
    description: 'Café de especialidad cosechado a más de 1,200 metros sobre el nivel del mar en las montañas de Jarabacoa. Notas aromáticas de chocolate negro, nuez y caramelo con acidez cítrica balanceada.',
    shortDescription: 'Cosechado a 1,200m en Jarabacoa, notas de chocolate y caramelo.',
    categoryId: 'cat-alimentos',
    price: 580,
    sku: 'CAF-JAR-ARA-1LB',
    images: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 45,
    reservedStock: 0,
    soldCount: 120,
    minStockAlert: 8,
    status: 'published',
    rating: 5.0,
    reviewCount: 56,
    isFeatured: true,
    createdAt: '2026-01-20T10:00:00Z'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-super-admin',
    name: 'Luis Jiménez',
    email: 'Luis.jimenez@msn.com',
    role: 'SUPER_ADMIN',
    phone: '809-449-3325',
    avatar: '',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    addresses: [],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-super-admin-2',
    name: 'Luis Jiménez',
    email: 'luiss.jimeness@gmail.com',
    role: 'SUPER_ADMIN',
    phone: '809-449-3325',
    avatar: '',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    addresses: [],
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_STORE_BALANCES: Record<string, StoreBalance> = {};

export const INITIAL_SETTLEMENTS: Settlement[] = [];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'banner-1',
    title: 'Muchas tiendas. Un solo lugar.',
    subtitle: 'El marketplace oficial de República Dominicana. Compra tus marcas y emprendimientos locales favoritos.',
    badge: 'PlazaDO Exclusivo',
    imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&auto=format&fit=crop&q=80',
    targetType: 'CATEGORY',
    targetValue: 'cat-tecnologia',
    isActive: true,
    order: 1
  },
  {
    id: 'banner-2',
    title: 'Todo para tus Consentidos',
    subtitle: 'Alimentos premium, camas y juguetes en la categoría Mascotas con envío rápido a Santo Domingo y Santiago.',
    badge: 'Mascotas PlazaDO',
    imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1600&auto=format&fit=crop&q=80',
    targetType: 'CATEGORY',
    targetValue: 'cat-mascotas',
    isActive: true,
    order: 2
  },
  {
    id: 'banner-3',
    title: 'Moda y Artesanía Dominicana',
    subtitle: 'Chacabanas de lino, calzado artesanal y diseño criollo con entrega a las 32 provincias.',
    badge: 'Hecho en RD',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
    targetType: 'CATEGORY',
    targetValue: 'cat-moda-y-calzado',
    isActive: true,
    order: 3
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'PLAZA500',
    storeId: null, // Cupón general de PlazaDO
    discountType: 'FIXED',
    discountValue: 500,
    minSpend: 3000,
    usageLimit: 100,
    usageCount: 0,
    validUntil: '2026-12-31',
    isActive: true
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  platformName: 'PlazaDO.com',
  legalBusinessName: 'PlazaDO Soluciones Tecnológicas SRL',
  rnc: '132-94812-3',
  contactEmail: 'contacto@plazado.com',
  contactPhone: '809-555-7529',
  whatsappCommercial: '809-449-3325', // Solicitado en el prompt
  defaultCommissionRate: 0.05, // 5% solicitado en el prompt
  itbisTaxRate: 0.18,
  currency: 'DOP',
  currencySymbol: 'RD$',
  azulConfig: {
    merchantId: '3948102948',
    authKey: 'AZUL_AUTH_KEY_LIVE_PLAZADO_SECURE',
    isSandbox: true, // Modo seguro de pruebas inicialmente
    isEnabled: true,
    webhookUrl: 'https://plazado.com/api/webhooks/azul'
  },
  activePaymentMethods: {
    cardAzul: true,
    cashOnDelivery: true,
    bankTransfer: true
  },
  deliveryIntegration: {
    pedidosYaEnabled: false,
    uberDirectEnabled: false,
    localCouriersEnabled: true
  },
  policies: {
    customerTermsVersion: 'v2.1-2026-RD',
    storeTermsVersion: 'v2.1-2026-RD',
    privacyPolicyVersion: 'v1.4-2026-RD',
    refundPolicyVersion: 'v1.2-2026-RD'
  }
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-platform-init',
    userId: 'user-super-admin',
    userName: 'Luis Jiménez',
    userRole: 'SUPER_ADMIN',
    action: 'PLATFORM_PRODUCTION_READY',
    affectedRecord: 'Sistema Operativo PlazaDO.com',
    newValue: 'Entorno operativo iniciado para la República Dominicana',
    ipAddress: '190.166.44.12',
    timestamp: '2026-09-19T10:00:00Z'
  }
];
