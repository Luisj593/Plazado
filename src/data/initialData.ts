import { PACKAGED_ANDROID_APP } from '../utils/androidApp';
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
  SystemSettings,
  PaymentGatewayConfig,
  AdPlacement,
  Advertisement,
  LegalDocument,
  AndroidAppConfig,
  CategorySpecification
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

import { OFFICIAL_CATEGORIES, OFFICIAL_SPECIFICATIONS } from './officialCategoriesCatalog.ts';

export const INITIAL_CATEGORIES: Category[] = OFFICIAL_CATEGORIES;
export const INITIAL_SPECIFICATIONS: CategorySpecification[] = OFFICIAL_SPECIFICATIONS;

// Production strict policy: Zero fake/seed stores or products. All records originate from Firestore or real user registration.
export const INITIAL_STORES: Store[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_USERS: User[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_STORE_BALANCES: Record<string, StoreBalance> = {};

export const INITIAL_SETTLEMENTS: Settlement[] = [];

export const INITIAL_BANNERS: Banner[] = [];
export const INITIAL_COUPONS: Coupon[] = [];

export const DEFAULT_LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'customer_terms',
    title: 'Términos y Condiciones para Clientes Compradores',
    category: 'customer_terms',
    categoryLabel: 'Términos Clientes',
    version: 'v2.1-2026-RD',
    lastUpdated: '2026-09-20',
    description: 'Marco legal que regula el uso de la plataforma por parte de los compradores, compra segura, pagos electrónicos y validación de entrega con código secreto conforme a la Ley 358-05.',
    summaryPoints: [
      'PlazaDO es un marketplace tecnológico intermediario entre compradores y comercios formales.',
      'Cada tienda responde directamente por la calidad, garantía y despacho de sus artículos.',
      'Protección al comprador mediante Código Secreto de Entrega de 6 dígitos.',
      'Garantía de reembolso en caso de producto dañado o no recibido.'
    ],
    isPublished: true,
    downloadCount: 142
  },
  {
    id: 'store_terms',
    title: 'Términos y Condiciones para Tiendas y Vendedores Asociados',
    category: 'store_terms',
    categoryLabel: 'Términos Vendedores',
    version: 'v2.1-2026-RD',
    lastUpdated: '2026-09-20',
    description: 'Reglamento para comercios, marcas y emprendedores que comercializan sus productos en PlazaDO.com. Aislamiento estricto de datos, comisiones y condiciones de liquidación bancaria.',
    summaryPoints: [
      'Aislamiento de información: cada tienda solo tiene acceso a sus propios pedidos y clientes.',
      'Comisión vigente del 30% (0.30) sobre el total del pedido, incluido el envío. RD$4,000 × 0.30 = RD$1,200; neto de la tienda: RD$2,800. Cada pedido conserva su tasa histórica.',
      'Disponibilidad de fondos y liquidaciones bancarias directas en Banco Popular, Banreservas, BHD u otros.',
      'Compromiso de entrega oportuna y despacho de órdenes.'
    ],
    isPublished: true,
    downloadCount: 98
  },
  {
    id: 'privacy',
    title: 'Política de Privacidad y Protección de Datos Personales',
    category: 'privacy',
    categoryLabel: 'Privacidad RD',
    version: 'v1.4-2026-RD',
    lastUpdated: '2026-09-20',
    description: 'Cumplimiento exhaustivo con la Ley No. 172-13 sobre Protección Integral de los Datos Personales en la República Dominicana.',
    summaryPoints: [
      'Cifrado de datos sensibles y protección en tránsito con TLS 1.3.',
      'No almacenamiento de tarjetas completas ni códigos CVV (canalizado por pasarela bancaria AZUL).',
      'No comercialización de bases de datos a terceros ajenos a la transacción.'
    ],
    isPublished: true,
    downloadCount: 76
  },
  {
    id: 'returns_refunds',
    title: 'Política y Procedimiento de Devoluciones y Reclamaciones',
    category: 'returns_refunds',
    categoryLabel: 'Devoluciones y Disputas',
    version: 'v1.2-2026-RD',
    lastUpdated: '2026-09-20',
    description: 'Procedimiento formal para resolver discrepancias, productos defectuosos, faltantes o garantías entre clientes y comercios asociados con intervención del Super Administrador.',
    summaryPoints: [
      'Plazo de 3 días hábiles para apertura de reclamos con evidencia fotográfica.',
      '48 horas otorgadas al comercio para reposición o solución consensuada.',
      'Custodia y mediación fiduciaria de PlazaDO para dictaminar reembolsos en caso de incumplimiento.'
    ],
    isPublished: true,
    downloadCount: 61
  },
  {
    id: 'shipping_procedures',
    title: 'Procedimiento de Despacho, Envíos y Validación con Código Secreto',
    category: 'shipping_procedures',
    categoryLabel: 'Procedimiento de Envíos',
    version: 'v1.1-2026-RD',
    lastUpdated: '2026-09-20',
    description: 'Manual operativo de envíos por mensajería propia, couriers o servicios locales, junto con la instrucción de entrega del Código Secreto de 6 dígitos.',
    summaryPoints: [
      'Registro del número de guía o chofer asignado para cada pedido.',
      'Obligación del repartidor de solicitar el Código Secreto al destinatario al momento de la entrega física.',
      'Liberación automática del pedido a estado COMPLETADO al validar el código.'
    ],
    isPublished: true,
    downloadCount: 88
  }
];

export const DEFAULT_ANDROID_APP_CONFIG: AndroidAppConfig = { ...PACKAGED_ANDROID_APP };

export const INITIAL_SETTINGS: SystemSettings = {
  platformName: 'PlazaDO.com',
  legalEntityRegistered: false,
  legalBusinessName: '',
  legalAddress: '',
  rnc: '',
  contactEmail: 'contacto@plazado.com',
  contactPhone: '',
  whatsappCommercial: '809-449-3325', // Solicitado en el prompt
  plazaCommissionRate: 0.30, // 30% por venta (Monto * 0.30)
  defaultCommissionRate: 0.30, // 30%
  itbisTaxRate: 0.18,
  currency: 'DOP',
  currencySymbol: 'RD$',
  logoType: 'default',
  logoUrl: '',
  logoDarkUrl: '',
  faviconType: 'default',
  faviconUrl: '/dominican-flag.svg',
  headerBannerType: 'default',
  headerBannerUrl: '',
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
  },
  legalDocuments: DEFAULT_LEGAL_DOCUMENTS,
  androidApp: DEFAULT_ANDROID_APP_CONFIG,
  mailConfig: {
    senderEmail: 'contacto@plazado.com',
    senderName: 'PlazaDO.com - Marketplace Dominicano',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUser: 'contacto@plazado.com',
    useSsl: true,
    isConfigured: true
  }
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_PAYMENT_GATEWAYS: PaymentGatewayConfig[] = [];

export const INITIAL_AD_PLACEMENTS: AdPlacement[] = [
  {
    code: 'HOME_TOP',
    name: 'Banner Principal Superior',
    description: 'Espacio de máximo impacto visual en la cabecera de la página principal (carrusel panorámico).',
    supportedFormats: ['IMAGE', 'VIDEO'],
    recommendedSize: '1200 x 400 px',
    isActive: true,
    maxSlots: 5
  },
  {
    code: 'HOME_MIDDLE',
    name: 'Banner Secundario Home',
    description: 'Banner horizontal ubicado entre las secciones de productos destacados y comercios.',
    supportedFormats: ['IMAGE'],
    recommendedSize: '1200 x 250 px',
    isActive: true,
    maxSlots: 3
  },
  {
    code: 'HOME_PRODUCTS',
    name: 'Publicidad Entre Productos',
    description: 'Tarjetas publicitarias patrocinadas insertadas orgánicamente en el catálogo de productos.',
    supportedFormats: ['IMAGE'],
    recommendedSize: '600 x 400 px',
    isActive: true,
    maxSlots: 4
  },
  {
    code: 'CATEGORY_TOP',
    name: 'Cabecera de Categorías',
    description: 'Banners segmentados por categoría específica en la parte superior del catálogo filtrado.',
    supportedFormats: ['IMAGE'],
    recommendedSize: '1200 x 250 px',
    isActive: true,
    maxSlots: 3
  },
  {
    code: 'CATEGORY_MIDDLE',
    name: 'Intermedio de Categorías',
    description: 'Espacio intermedio publicitario en el listado de navegación de categorías.',
    supportedFormats: ['IMAGE'],
    recommendedSize: '728 x 90 px',
    isActive: true,
    maxSlots: 2
  },
  {
    code: 'STORE_TOP',
    name: 'Cabecera en Tiendas',
    description: 'Banner patrocinado en la vitrina pública de tiendas autorizadas.',
    supportedFormats: ['IMAGE'],
    recommendedSize: '1200 x 200 px',
    isActive: true,
    maxSlots: 2
  },
  {
    code: 'PRODUCT_RELATED',
    name: 'Publicidad en Detalle de Producto',
    description: 'Espacio publicitario discreto en la ficha técnica del producto sin interferir con la compra.',
    supportedFormats: ['IMAGE'],
    recommendedSize: '400 x 300 px',
    isActive: true,
    maxSlots: 2
  }
];

export const INITIAL_ADVERTISEMENTS: Advertisement[] = [];
