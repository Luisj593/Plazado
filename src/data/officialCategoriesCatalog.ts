import { Category, CategorySpecification } from '../types';

export const OFFICIAL_CATEGORIES: Category[] = [
  // 1. Moda y Accesorios
  {
    id: 'cat-moda',
    name: 'Moda y Accesorios',
    slug: 'moda-y-accesorios',
    icon: 'Shirt',
    description: 'Ropa, calzado, carteras, joyería y accesorios para damas, caballeros y niños',
    parentId: null,
    order: 1,
    isActive: true
  },
  // 2. Celulares y Accesorios
  {
    id: 'cat-celulares',
    name: 'Celulares y Accesorios',
    slug: 'celulares-y-accesorios',
    icon: 'Smartphone',
    description: 'Smartphones, tablets, smartwatches, cargadores y fundas protectoras',
    parentId: null,
    order: 2,
    isActive: true
  },
  // 3. Tecnología y Computación
  {
    id: 'cat-tecnologia',
    name: 'Tecnología y Computación',
    slug: 'tecnologia-y-computacion',
    icon: 'Laptop',
    description: 'Laptops, computadoras de escritorio, componentes, periféricos e impresoras',
    parentId: null,
    order: 3,
    isActive: true
  },
  // 4. Electrónica
  {
    id: 'cat-electronica',
    name: 'Electrónica',
    slug: 'electronica',
    icon: 'Tv',
    description: 'Televisores, audio de alta fidelidad, bocinas, proyectores, drones y cámaras',
    parentId: null,
    order: 4,
    isActive: true
  },
  // 5. Robótica
  {
    id: 'cat-robotica',
    name: 'Robótica',
    slug: 'robotica',
    icon: 'Bot',
    description: 'Robots educativos, kits programables, brazos robóticos, sensores y automatización',
    parentId: null,
    order: 5,
    isActive: true
  },
  // 6. Hogar y Cocina
  {
    id: 'cat-hogar',
    name: 'Hogar y Cocina',
    slug: 'hogar-y-cocina',
    icon: 'Home',
    description: 'Menaje, vajillas, utensilios, ollas, organización y textiles de hogar',
    parentId: null,
    order: 6,
    isActive: true
  },
  // 7. Muebles y Decoración
  {
    id: 'cat-muebles',
    name: 'Muebles y Decoración',
    slug: 'muebles-y-decoracion',
    icon: 'Armchair',
    description: 'Muebles de sala, comedor, dormitorio, lámparas, alfombras y cuadros',
    parentId: null,
    order: 7,
    isActive: true
  },
  // 8. Electrodomésticos
  {
    id: 'cat-electrodomesticos',
    name: 'Electrodomésticos',
    slug: 'electrodomesticos',
    icon: 'Refrigerator',
    description: 'Neveras, lavadoras, estufas, microondas, aires acondicionados y licuadoras',
    parentId: null,
    order: 8,
    isActive: true
  },
  // 9. Belleza y Cuidado Personal
  {
    id: 'cat-belleza',
    name: 'Belleza y Cuidado Personal',
    slug: 'belleza-y-cuidado-personal',
    icon: 'Sparkles',
    description: 'Cuidado facial, maquillaje, cuidado capilar y afeitado',
    parentId: null,
    order: 9,
    isActive: true
  },
  // 10. Perfumes y Fragancias
  {
    id: 'cat-perfumes',
    name: 'Perfumes y Fragancias',
    slug: 'perfumes-y-fragancias',
    icon: 'SprayCan',
    description: 'Perfumes originales de diseñador, colonias, mists y sets de fragancias',
    parentId: null,
    order: 10,
    isActive: true
  },
  // 11. Deportes y Fitness
  {
    id: 'cat-deportes',
    name: 'Deportes y Fitness',
    slug: 'deportes-y-fitness',
    icon: 'Dumbbell',
    description: 'Ropa deportiva, pesas, máquinas de ejercicio, ciclismo y suplementos',
    parentId: null,
    order: 11,
    isActive: true
  },
  // 12. Bebés y Niños
  {
    id: 'cat-bebes',
    name: 'Bebés y Niños',
    slug: 'bebes-y-ninos',
    icon: 'Baby',
    description: 'Coches, cunas, ropa infantil, juguetes de estimulación y pañales',
    parentId: null,
    order: 12,
    isActive: true
  },
  // 13. Videojuegos y Gaming
  {
    id: 'cat-gaming',
    name: 'Videojuegos y Gaming',
    slug: 'videojuegos-y-gaming',
    icon: 'Gamepad2',
    description: 'Consolas PlayStation, Xbox, Nintendo, PC Gamer, juegos y accesorios',
    parentId: null,
    order: 13,
    isActive: true
  },
  // 14. Mascotas
  {
    id: 'cat-mascotas',
    name: 'Mascotas',
    slug: 'mascotas',
    icon: 'PawPrint',
    description: 'Alimentos premium, snacks, juguetes, camas y medicamentos veterinarios',
    parentId: null,
    order: 14,
    isActive: true
  },
  // 15. Vehículos y Accesorios
  {
    id: 'cat-vehiculos',
    name: 'Vehículos y Accesorios',
    slug: 'vehiculos-y-accesorios',
    icon: 'Car',
    description: 'Repuestos para autos y motocicletas, aceites, llantas y accesorios',
    parentId: null,
    order: 15,
    isActive: true
  },
  // 16. Ferretería y Construcción
  {
    id: 'cat-ferreteria',
    name: 'Ferretería y Construcción',
    slug: 'ferreteria-y-construccion',
    icon: 'Hammer',
    description: 'Herramientas eléctricas y manuales, plomería, electricidad y pintura',
    parentId: null,
    order: 16,
    isActive: true
  },
  // 17. Librería y Oficina
  {
    id: 'cat-libreria',
    name: 'Librería y Oficina',
    slug: 'libreria-y-oficina',
    icon: 'BookOpen',
    description: 'Libros, papelería, útiles escolares, escritorios y suministros de oficina',
    parentId: null,
    order: 17,
    isActive: true
  },
  // 18. Supermercado y Alimentos
  {
    id: 'cat-alimentos',
    name: 'Supermercado y Alimentos',
    slug: 'supermercado-y-alimentos',
    icon: 'ShoppingBag',
    description: 'Víveres, café dominicano, bebidas, conservas y productos gourmet',
    parentId: null,
    order: 18,
    isActive: true
  },
  // 19. Regalos y Detalles
  {
    id: 'cat-regalos',
    name: 'Regalos y Detalles',
    slug: 'regalos-y-detalles',
    icon: 'Gift',
    description: 'Arreglos de flores, canastas navideñas, peluches y tarjetas de ocasión',
    parentId: null,
    order: 19,
    isActive: true
  },
  // 20. Jardín y Exterior
  {
    id: 'cat-jardin',
    name: 'Jardín y Exterior',
    slug: 'jardin-y-exterior',
    icon: 'Trees',
    description: 'Plantas, maceteros, herramientas de jardinería, asadores y terrazas',
    parentId: null,
    order: 20,
    isActive: true
  },
  // 21. Limpieza y Cuidado del Hogar
  {
    id: 'cat-limpieza',
    name: 'Limpieza y Cuidado del Hogar',
    slug: 'limpieza-y-cuidado-del-hogar',
    icon: 'Sparkle',
    description: 'Detergentes, desinfectantes, mopas, escobas y productos biodegradables',
    parentId: null,
    order: 21,
    isActive: true
  },
  // 22. Artesanía y Productos Personalizados
  {
    id: 'cat-artesania',
    name: 'Artesanía y Productos Personalizados',
    slug: 'artesania-y-productos-personalizados',
    icon: 'Palette',
    description: 'Artesanía dominicana, cuadros, camisetas sublimadas y recuerdos típicos',
    parentId: null,
    order: 22,
    isActive: true
  },
  // 23. Salud y Bienestar
  {
    id: 'cat-salud',
    name: 'Salud y Bienestar',
    slug: 'salud-y-bienestar',
    icon: 'HeartPulse',
    description: 'Equipos médicos caseros, ortopedia, vitaminas y cuidado de la salud',
    parentId: null,
    order: 23,
    isActive: true
  },
  // 24. Negocios e Industria
  {
    id: 'cat-negocios',
    name: 'Negocios e Industria',
    slug: 'negocios-e-industria',
    icon: 'Building2',
    description: 'Maquinaria pesada, empaques al por mayor, señalización y seguridad industrial',
    parentId: null,
    order: 24,
    isActive: true
  },
  // 25. Otros
  {
    id: 'cat-otros',
    name: 'Otros',
    slug: 'otros',
    icon: 'Grid',
    description: 'Artículos diversos y productos especiales',
    parentId: null,
    order: 25,
    isActive: true
  },
  // 26. Rent Car
  {
    id: 'cat-rent-car',
    name: 'Rent Car',
    slug: 'rent-car',
    icon: 'Car',
    description: 'Alquiler y renta de vehículos, autos compactos, SUVs, camionetas, vans turísticas y transporte privado',
    parentId: null,
    order: 26,
    isActive: true
  },
  // 27. Dealer
  {
    id: 'cat-dealer',
    name: 'Dealer',
    slug: 'dealer',
    icon: 'CarFront',
    description: 'Venta de vehículos nuevos y usados certificados, dealers autorizados, financiamiento y garantías',
    parentId: null,
    order: 27,
    isActive: true
  },

  // -------------------------------------------------------------
  // SUBCATEGORÍAS OFICIALES (parentId !== null)
  // -------------------------------------------------------------

  // Subcategorías: Celulares y Accesorios
  { id: 'subcat-cel-smartphones', name: 'Smartphones', slug: 'smartphones', icon: 'Smartphone', parentId: 'cat-celulares', order: 1, isActive: true },
  { id: 'subcat-cel-tablets', name: 'Tablets', slug: 'tablets', icon: 'Tablet', parentId: 'cat-celulares', order: 2, isActive: true },
  { id: 'subcat-cel-smartwatches', name: 'Smartwatches', slug: 'smartwatches', icon: 'Watch', parentId: 'cat-celulares', order: 3, isActive: true },
  { id: 'subcat-cel-audifonos', name: 'Audífonos', slug: 'audifonos-celulares', icon: 'Headphones', parentId: 'cat-celulares', order: 4, isActive: true },
  { id: 'subcat-cel-cargadores', name: 'Cargadores y Cables', slug: 'cargadores-y-cables', icon: 'Zap', parentId: 'cat-celulares', order: 5, isActive: true },
  { id: 'subcat-cel-covers', name: 'Covers y Fundas', slug: 'covers-y-fundas', icon: 'Shield', parentId: 'cat-celulares', order: 6, isActive: true },
  { id: 'subcat-cel-protectores', name: 'Protectores de Pantalla', slug: 'protectores-pantalla', icon: 'Sparkles', parentId: 'cat-celulares', order: 7, isActive: true },
  { id: 'subcat-cel-accesorios', name: 'Accesorios para Celulares', slug: 'accesorios-celulares', icon: 'Layers', parentId: 'cat-celulares', order: 8, isActive: true },

  // Subcategorías: Electrónica
  { id: 'subcat-elec-televisores', name: 'Televisores', slug: 'televisores', icon: 'Tv', parentId: 'cat-electronica', order: 1, isActive: true },
  { id: 'subcat-elec-audio', name: 'Audio y Sonido', slug: 'audio-y-sonido', icon: 'Speaker', parentId: 'cat-electronica', order: 2, isActive: true },
  { id: 'subcat-elec-bocinas', name: 'Bocinas Bluetooth & Portátiles', slug: 'bocinas', icon: 'Radio', parentId: 'cat-electronica', order: 3, isActive: true },
  { id: 'subcat-elec-home-theater', name: 'Home Theater & Barras de Sonido', slug: 'home-theater', icon: 'Volume2', parentId: 'cat-electronica', order: 4, isActive: true },
  { id: 'subcat-elec-camaras', name: 'Cámaras y Fotografía', slug: 'camaras-y-fotografia', icon: 'Camera', parentId: 'cat-electronica', order: 5, isActive: true },
  { id: 'subcat-elec-proyectores', name: 'Proyectores', slug: 'proyectores', icon: 'Cast', parentId: 'cat-electronica', order: 6, isActive: true },
  { id: 'subcat-elec-drones', name: 'Drones', slug: 'drones', icon: 'Compass', parentId: 'cat-electronica', order: 7, isActive: true },
  { id: 'subcat-elec-inteligentes', name: 'Equipos Inteligentes & Domótica', slug: 'equipos-inteligentes', icon: 'Cpu', parentId: 'cat-electronica', order: 8, isActive: true },
  { id: 'subcat-elec-accesorios', name: 'Accesorios Electrónicos', slug: 'accesorios-electronicos', icon: 'Cable', parentId: 'cat-electronica', order: 9, isActive: true },
  { id: 'subcat-elec-otros', name: 'Otros Electrónicos', slug: 'otros-electronicos', icon: 'Grid', parentId: 'cat-electronica', order: 10, isActive: true },

  // Subcategorías: Robótica
  { id: 'subcat-rob-educativos', name: 'Robots Educativos', slug: 'robots-educativos', icon: 'Bot', parentId: 'cat-robotica', order: 1, isActive: true },
  { id: 'subcat-rob-kits', name: 'Kits de Robótica', slug: 'kits-de-robotica', icon: 'Boxes', parentId: 'cat-robotica', order: 2, isActive: true },
  { id: 'subcat-rob-programables', name: 'Robots Programables', slug: 'robots-programables', icon: 'Binary', parentId: 'cat-robotica', order: 3, isActive: true },
  { id: 'subcat-rob-domesticos', name: 'Robots Domésticos', slug: 'robots-domesticos', icon: 'Home', parentId: 'cat-robotica', order: 4, isActive: true },
  { id: 'subcat-rob-limpieza', name: 'Robots de Limpieza (Aspiradoras / Mopas)', slug: 'robots-de-limpieza', icon: 'Sparkle', parentId: 'cat-robotica', order: 5, isActive: true },
  { id: 'subcat-rob-brazos', name: 'Brazos Robóticos', slug: 'brazos-roboticos', icon: 'Move', parentId: 'cat-robotica', order: 6, isActive: true },
  { id: 'subcat-rob-industriales', name: 'Robots Industriales', slug: 'robots-industriales', icon: 'Factory', parentId: 'cat-robotica', order: 7, isActive: true },
  { id: 'subcat-rob-componentes', name: 'Componentes de Robótica', slug: 'componentes-robotica', icon: 'Cpu', parentId: 'cat-robotica', order: 8, isActive: true },
  { id: 'subcat-rob-sensores', name: 'Sensores', slug: 'sensores-robotica', icon: 'Radar', parentId: 'cat-robotica', order: 9, isActive: true },
  { id: 'subcat-rob-motores', name: 'Motores y Servomotores', slug: 'motores-y-servomotores', icon: 'Cog', parentId: 'cat-robotica', order: 10, isActive: true },
  { id: 'subcat-rob-controladores', name: 'Controladores', slug: 'controladores', icon: 'Sliders', parentId: 'cat-robotica', order: 11, isActive: true },
  { id: 'subcat-rob-microcontroladores', name: 'Microcontroladores (Arduino, ESP32, Raspberry)', slug: 'microcontroladores', icon: 'Microchip', parentId: 'cat-robotica', order: 12, isActive: true },
  { id: 'subcat-rob-automatizacion', name: 'Automatización', slug: 'automatizacion', icon: 'Activity', parentId: 'cat-robotica', order: 13, isActive: true },
  { id: 'subcat-rob-accesorios', name: 'Accesorios para Robótica', slug: 'accesorios-robotica', icon: 'Wrench', parentId: 'cat-robotica', order: 14, isActive: true },

  // Subcategorías: Tecnología y Computación
  { id: 'subcat-tec-laptops', name: 'Laptops y Portátiles', slug: 'laptops', icon: 'Laptop', parentId: 'cat-tecnologia', order: 1, isActive: true },
  { id: 'subcat-tec-desktop', name: 'Computadoras de Escritorio & All-in-One', slug: 'desktop', icon: 'Monitor', parentId: 'cat-tecnologia', order: 2, isActive: true },
  { id: 'subcat-tec-componentes', name: 'Componentes (RAM, SSD, Tarjetas Gráficas)', slug: 'componentes-pc', icon: 'Cpu', parentId: 'cat-tecnologia', order: 3, isActive: true },
  { id: 'subcat-tec-perifericos', name: 'Monitores, Teclados y Ratones', slug: 'perifericos', icon: 'Mouse', parentId: 'cat-tecnologia', order: 4, isActive: true },
  { id: 'subcat-tec-redes', name: 'Routers, Switches & Redes', slug: 'redes-conectividad', icon: 'Wifi', parentId: 'cat-tecnologia', order: 5, isActive: true },
  { id: 'subcat-tec-impresoras', name: 'Impresoras y Escáneres', slug: 'impresoras-y-escaneres', icon: 'Printer', parentId: 'cat-tecnologia', order: 6, isActive: true },

  // Subcategorías: Moda y Accesorios
  { id: 'subcat-moda-mujer', name: 'Ropa para Dama', slug: 'ropa-dama', icon: 'Shirt', parentId: 'cat-moda', order: 1, isActive: true },
  { id: 'subcat-moda-hombre', name: 'Ropa para Caballero', slug: 'ropa-caballero', icon: 'Shirt', parentId: 'cat-moda', order: 2, isActive: true },
  { id: 'subcat-moda-calzado', name: 'Calzado y Zapatos', slug: 'calzado', icon: 'Footprints', parentId: 'cat-moda', order: 3, isActive: true },
  { id: 'subcat-moda-carteras', name: 'Bolsos y Carteras', slug: 'bolsos-carteras', icon: 'ShoppingBag', parentId: 'cat-moda', order: 4, isActive: true },
  { id: 'subcat-moda-joyeria', name: 'Joyería y Relojes', slug: 'joyeria-relojes', icon: 'Watch', parentId: 'cat-moda', order: 5, isActive: true },

  // Subcategorías: Mascotas
  { id: 'subcat-mascotas-perros', name: 'Perros', slug: 'perros', icon: 'Dog', parentId: 'cat-mascotas', order: 1, isActive: true },
  { id: 'subcat-mascotas-gatos', name: 'Gatos', slug: 'gatos', icon: 'Cat', parentId: 'cat-mascotas', order: 2, isActive: true },
  { id: 'subcat-mascotas-accesorios', name: 'Accesorios e Higiene Mascotas', slug: 'accesorios-mascotas', icon: 'Bath', parentId: 'cat-mascotas', order: 3, isActive: true },

  // Subcategorías: Hogar y Cocina
  { id: 'subcat-hogar-menaje', name: 'Menaje y Utensilios de Cocina', slug: 'menaje-cocina', icon: 'Utensils', parentId: 'cat-hogar', order: 1, isActive: true },
  { id: 'subcat-hogar-organizacion', name: 'Organización y Almacenamiento', slug: 'organizacion-hogar', icon: 'Boxes', parentId: 'cat-hogar', order: 2, isActive: true },
  { id: 'subcat-hogar-textiles', name: 'Textiles y Ropa de Cama', slug: 'textiles-cama', icon: 'Layers', parentId: 'cat-hogar', order: 3, isActive: true },

  // Subcategorías: Muebles y Decoración
  { id: 'subcat-muebles-sala', name: 'Muebles de Sala y Recibidor', slug: 'muebles-sala', icon: 'Armchair', parentId: 'cat-muebles', order: 1, isActive: true },
  { id: 'subcat-muebles-comedor', name: 'Comedores y Sillas', slug: 'comedores-sillas', icon: 'Table', parentId: 'cat-muebles', order: 2, isActive: true },
  { id: 'subcat-muebles-habitacion', name: 'Dormitorio y Camas', slug: 'dormitorio-camas', icon: 'Bed', parentId: 'cat-muebles', order: 3, isActive: true },
  { id: 'subcat-muebles-decoracion', name: 'Decoración, Cuadros y Lámparas', slug: 'decoracion-lamparas', icon: 'Lamp', parentId: 'cat-muebles', order: 4, isActive: true },

  // Subcategorías: Electrodomésticos
  { id: 'subcat-elec-refrigeracion', name: 'Refrigeración y Congeladores', slug: 'refrigeracion-neveras', icon: 'Refrigerator', parentId: 'cat-electrodomesticos', order: 1, isActive: true },
  { id: 'subcat-elec-lavado', name: 'Lavado y Secado', slug: 'lavadoras-secadoras', icon: 'Waves', parentId: 'cat-electrodomesticos', order: 2, isActive: true },
  { id: 'subcat-elec-coccion', name: 'Estufas, Hornos y Microondas', slug: 'estufas-hornos', icon: 'Flame', parentId: 'cat-electrodomesticos', order: 3, isActive: true },
  { id: 'subcat-elec-climatizacion', name: 'Aires Acondicionados y Ventiladores', slug: 'aires-ventiladores', icon: 'Wind', parentId: 'cat-electrodomesticos', order: 4, isActive: true },
  { id: 'subcat-elec-pequenos', name: 'Pequeños Electrodomésticos (Licuadoras, Freidoras, Cafeteras)', slug: 'pequenos-electrodomesticos', icon: 'Coffee', parentId: 'cat-electrodomesticos', order: 5, isActive: true },

  // Subcategorías: Perfumes y Fragancias
  { id: 'subcat-perf-hombre', name: 'Perfumes para Hombre', slug: 'perfumes-hombre', icon: 'SprayCan', parentId: 'cat-perfumes', order: 1, isActive: true },
  { id: 'subcat-perf-mujer', name: 'Perfumes para Mujer', slug: 'perfumes-mujer', icon: 'SprayCan', parentId: 'cat-perfumes', order: 2, isActive: true },
  { id: 'subcat-perf-unisex', name: 'Fragancias Unisex & Nicho', slug: 'perfumes-unisex', icon: 'Sparkles', parentId: 'cat-perfumes', order: 3, isActive: true },

  // Subcategorías: Videojuegos y Gaming
  { id: 'subcat-game-consolas', name: 'Consolas (PS5, Xbox, Nintendo Switch)', slug: 'consolas-gaming', icon: 'Gamepad2', parentId: 'cat-gaming', order: 1, isActive: true },
  { id: 'subcat-game-videojuegos', name: 'Juegos Físicos y Digitales', slug: 'juegos-consolas', icon: 'Disc', parentId: 'cat-gaming', order: 2, isActive: true },
  { id: 'subcat-game-accesorios', name: 'Controles, Headsets y Sillas Gaming', slug: 'accesorios-gaming', icon: 'Headphones', parentId: 'cat-gaming', order: 3, isActive: true },

  // Subcategorías: Ferretería y Construcción
  { id: 'subcat-ferr-herramientas', name: 'Herramientas Eléctricas y Manuales', slug: 'herramientas', icon: 'Hammer', parentId: 'cat-ferreteria', order: 1, isActive: true },
  { id: 'subcat-ferr-electricidad', name: 'Materiales Eléctricos e Iluminación', slug: 'electricidad', icon: 'Zap', parentId: 'cat-ferreteria', order: 2, isActive: true },
  { id: 'subcat-ferr-plomeria', name: 'Plomería y Grifería', slug: 'plomeria', icon: 'Wrench', parentId: 'cat-ferreteria', order: 3, isActive: true },
  { id: 'subcat-ferr-pintura', name: 'Pinturas y Acabados', slug: 'pinturas-acabados', icon: 'Paintbrush', parentId: 'cat-ferreteria', order: 4, isActive: true },

  // Subcategorías: Vehículos y Accesorios
  { id: 'subcat-veh-repuestos', name: 'Repuestos Automotrices', slug: 'repuestos-autos', icon: 'Wrench', parentId: 'cat-vehiculos', order: 1, isActive: true },
  { id: 'subcat-veh-neumaticos', name: 'Neumáticos y Aros', slug: 'neumaticos-aros', icon: 'Circle', parentId: 'cat-vehiculos', order: 2, isActive: true },
  { id: 'subcat-veh-motos', name: 'Accesorios y Cascos de Motocicleta', slug: 'accesorios-motos', icon: 'Shield', parentId: 'cat-vehiculos', order: 3, isActive: true },
  { id: 'subcat-veh-sonido', name: 'Audio y Alarmas para Vehículos', slug: 'audio-vehiculos', icon: 'Speaker', parentId: 'cat-vehiculos', order: 4, isActive: true },

  // Subcategorías: Rent Car
  { id: 'subcat-rent-sedanes', name: 'Autos y Sedanes', slug: 'autos-sedanes', icon: 'Car', parentId: 'cat-rent-car', order: 1, isActive: true },
  { id: 'subcat-rent-suvs', name: 'Jeepetas y SUVs', slug: 'jeepetas-suvs', icon: 'Car', parentId: 'cat-rent-car', order: 2, isActive: true },
  { id: 'subcat-rent-camionetas', name: 'Camionetas y Pick-ups', slug: 'camionetas-pickups', icon: 'Truck', parentId: 'cat-rent-car', order: 3, isActive: true },
  { id: 'subcat-rent-vans', name: 'Vans Turísticas y Minivans', slug: 'vans-minivans', icon: 'Bus', parentId: 'cat-rent-car', order: 4, isActive: true },
  { id: 'subcat-rent-lujo', name: 'Vehículos de Lujo y Deportivos', slug: 'vehiculos-lujo', icon: 'Sparkles', parentId: 'cat-rent-car', order: 5, isActive: true },

  // Subcategorías: Dealer
  { id: 'subcat-dealer-nuevos', name: 'Vehículos Nuevos (0 Km)', slug: 'vehiculos-nuevos', icon: 'Sparkles', parentId: 'cat-dealer', order: 1, isActive: true },
  { id: 'subcat-dealer-usados', name: 'Vehículos Usados Certificados', slug: 'vehiculos-usados', icon: 'ShieldCheck', parentId: 'cat-dealer', order: 2, isActive: true },
  { id: 'subcat-dealer-suvs', name: 'Jeepetas y SUVs en Venta', slug: 'suvs-venta', icon: 'Car', parentId: 'cat-dealer', order: 3, isActive: true },
  { id: 'subcat-dealer-camiones', name: 'Camiones y Comerciales', slug: 'camiones-comerciales', icon: 'Truck', parentId: 'cat-dealer', order: 4, isActive: true },
  { id: 'subcat-dealer-electricos', name: 'Híbridos y Eléctricos', slug: 'hibridos-electricos', icon: 'Zap', parentId: 'cat-dealer', order: 5, isActive: true }
];

// -------------------------------------------------------------
// ESPECIFICACIONES TÉCNICAS DINÁMICAS OFICIALES
// Categoría → Subcategoría → Especificaciones
// -------------------------------------------------------------

export const OFFICIAL_SPECIFICATIONS: CategorySpecification[] = [
  // ==========================================
  // CELULARES & ACCESORIOS → SMARTPHONES
  // ==========================================
  {
    id: 'spec-cel-brand',
    name: 'Marca',
    key: 'brand',
    type: 'select',
    required: true,
    options: ['Apple', 'Samsung', 'Xiaomi', 'Google Pixel', 'Motorola', 'Honor', 'OnePlus', 'Huawei', 'ZTE', 'Otras marcas'],
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 1,
    isFilterable: true
  },
  {
    id: 'spec-cel-model',
    name: 'Modelo Exacto',
    key: 'model',
    type: 'text',
    required: true,
    placeholder: 'Ej: iPhone 15 Pro Max, Galaxy S24 Ultra',
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 2,
    isFilterable: true
  },
  {
    id: 'spec-cel-condition',
    name: 'Condición del Equipo',
    key: 'condition',
    type: 'select',
    required: true,
    options: ['Nuevo en caja sellada', 'Open Box (Como nuevo)', 'Reacondicionado Grado A', 'Usado en excelente estado', 'Usado con detalles cosméticos'],
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 3,
    isFilterable: true
  },
  {
    id: 'spec-cel-color',
    name: 'Color',
    key: 'color',
    type: 'text',
    placeholder: 'Ej: Titanio Natural, Negro Medianoche, Azul Sierra',
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 4,
    isFilterable: true
  },
  {
    id: 'spec-cel-os',
    name: 'Sistema Operativo',
    key: 'os',
    type: 'select',
    required: true,
    options: ['iOS (Apple)', 'Android', 'HarmonyOS', 'Otro'],
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 5,
    isFilterable: true
  },
  {
    id: 'spec-cel-screen',
    name: 'Tamaño de Pantalla',
    key: 'screenSize',
    type: 'select',
    options: ['Menos de 6.0"', '6.1" - 6.4"', '6.5" - 6.7"', '6.8" o superior', 'Plegable / Dual Screen'],
    unit: 'pulgadas',
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 6,
    isFilterable: true
  },
  {
    id: 'spec-cel-ram',
    name: 'Memoria RAM',
    key: 'ram',
    type: 'select',
    required: true,
    options: ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB o más'],
    unit: 'GB',
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 7,
    isFilterable: true
  },
  {
    id: 'spec-cel-storage',
    name: 'Almacenamiento Interno',
    key: 'storage',
    type: 'select',
    required: true,
    options: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
    unit: 'GB',
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 8,
    isFilterable: true
  },
  {
    id: 'spec-cel-cpu',
    name: 'Procesador / Chipset',
    key: 'cpu',
    type: 'text',
    placeholder: 'Ej: Apple A17 Pro, Snapdragon 8 Gen 3, Tensor G3',
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 9
  },
  {
    id: 'spec-cel-camera',
    name: 'Cámara Principal',
    key: 'camera',
    type: 'text',
    placeholder: 'Ej: Triple 48MP + 12MP + 12MP / Grabación 4K HDR',
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 10
  },
  {
    id: 'spec-cel-battery',
    name: 'Capacidad de Batería',
    key: 'batteryCapacity',
    type: 'text',
    placeholder: 'Ej: 5000 mAh / Carga rápida 45W',
    unit: 'mAh',
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 11
  },
  {
    id: 'spec-cel-sim',
    name: 'Tipo de SIM',
    key: 'simType',
    type: 'select',
    options: ['eSIM exclusiva', 'Nano-SIM física', 'Dual SIM (Nano-SIM + eSIM)', 'Dual Nano-SIM física'],
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 12
  },
  {
    id: 'spec-cel-network',
    name: 'Red Móvil',
    key: 'network',
    type: 'select',
    options: ['5G / 4G LTE', '4G LTE', '3G'],
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 13,
    isFilterable: true
  },
  {
    id: 'spec-cel-connectivity',
    name: 'Conectividad',
    key: 'connectivity',
    type: 'multiselect',
    options: ['Wi-Fi 6 / 6E / 7', 'Bluetooth 5.3', 'NFC para Pagos', 'USB-C', 'GPS / Glonass', 'Carga Inalámbrica MagSafe/Qi'],
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 14
  },
  {
    id: 'spec-cel-warranty',
    name: 'Garantía en RD',
    key: 'warranty',
    type: 'select',
    options: ['1 Año de Garantía Oficial', '6 Meses de Garantía en Tienda', '3 Meses de Garantía en Tienda', '30 Días de Garantía'],
    categoryId: 'cat-celulares',
    subcategoryId: 'subcat-cel-smartphones',
    order: 15,
    isFilterable: true
  },

  // ==========================================
  // ELECTRÓNICA → TELEVISORES
  // ==========================================
  {
    id: 'spec-tv-brand',
    name: 'Marca',
    key: 'brand',
    type: 'select',
    required: true,
    options: ['Samsung', 'LG', 'Sony', 'TCL', 'Hisense', 'RCA', 'Vizio', 'Xiaomi', 'Otras marcas'],
    categoryId: 'cat-electronica',
    subcategoryId: 'subcat-elec-televisores',
    order: 1,
    isFilterable: true
  },
  {
    id: 'spec-tv-model',
    name: 'Modelo',
    key: 'model',
    type: 'text',
    placeholder: 'Ej: Neo QLED QN90C, OLED evo C3',
    categoryId: 'cat-electronica',
    subcategoryId: 'subcat-elec-televisores',
    order: 2
  },
  {
    id: 'spec-tv-condition',
    name: 'Condición',
    key: 'condition',
    type: 'select',
    required: true,
    options: ['Nuevo en caja original', 'Open Box', 'Reacondicionado', 'Usado en buen estado'],
    categoryId: 'cat-electronica',
    subcategoryId: 'subcat-elec-televisores',
    order: 3,
    isFilterable: true
  },
  {
    id: 'spec-tv-size',
    name: 'Tamaño de Pantalla',
    key: 'screenSize',
    type: 'select',
    required: true,
    options: ['32 pulgadas', '40 - 43 pulgadas', '50 pulgadas', '55 pulgadas', '65 pulgadas', '75 pulgadas', '85 pulgadas o más'],
    unit: 'pulgadas',
    categoryId: 'cat-electronica',
    subcategoryId: 'subcat-elec-televisores',
    order: 4,
    isFilterable: true
  },
  {
    id: 'spec-tv-resolution',
    name: 'Resolución de Pantalla',
    key: 'resolution',
    type: 'select',
    required: true,
    options: ['4K Ultra HD (3840 x 2160)', '8K Ultra HD', 'Full HD (1080p)', 'HD (720p)'],
    categoryId: 'cat-electronica',
    subcategoryId: 'subcat-elec-televisores',
    order: 5,
    isFilterable: true
  },
  {
    id: 'spec-tv-panel',
    name: 'Tecnología de Panel',
    key: 'panelType',
    type: 'select',
    options: ['OLED', 'QLED / Neo QLED', 'Mini-LED', 'LED / DLED', 'NanoCell'],
    categoryId: 'cat-electronica',
    subcategoryId: 'subcat-elec-televisores',
    order: 6,
    isFilterable: true
  },
  {
    id: 'spec-tv-smart',
    name: 'Smart TV / Sistema',
    key: 'smartTv',
    type: 'select',
    required: true,
    options: ['Sí - Google TV / Android TV', 'Sí - Tizen (Samsung)', 'Sí - webOS (LG)', 'Sí - Roku TV', 'Sí - Fire TV', 'No es Smart TV'],
    categoryId: 'cat-electronica',
    subcategoryId: 'subcat-elec-televisores',
    order: 7,
    isFilterable: true
  },
  {
    id: 'spec-tv-connectivity',
    name: 'Conectividad y Puertos',
    key: 'connectivity',
    type: 'multiselect',
    options: ['Wi-Fi Integrado', 'Bluetooth', 'HDMI 2.1 (Gaming 120Hz)', 'HDMI eARC', 'Puertos USB', 'Salida Óptica Digital', 'Ethernet LAN'],
    categoryId: 'cat-electronica',
    subcategoryId: 'subcat-elec-televisores',
    order: 8,
    isFilterable: true
  },
  {
    id: 'spec-tv-voltage',
    name: 'Voltaje de Operación',
    key: 'voltage',
    type: 'select',
    options: ['110V - 120V (Estándar RD)', '110V - 240V (Auto-voltaje universal)'],
    categoryId: 'cat-electronica',
    subcategoryId: 'subcat-elec-televisores',
    order: 9
  },
  {
    id: 'spec-tv-warranty',
    name: 'Garantía',
    key: 'warranty',
    type: 'select',
    options: ['1 Año de Garantía Oficial', '2 Años de Garantía', '6 Meses de Garantía', '3 Meses de Garantía'],
    categoryId: 'cat-electronica',
    subcategoryId: 'subcat-elec-televisores',
    order: 10
  },

  // ==========================================
  // ELECTRÓNICA → BOCINAS / AUDIO
  // ==========================================
  {
    id: 'spec-audio-brand',
    name: 'Marca',
    key: 'brand',
    type: 'select',
    required: true,
    options: ['JBL', 'Bose', 'Sony', 'Harman Kardon', 'Marshall', 'Sonos', 'Anker Soundcore', 'Otras marcas'],
    categoryId: 'cat-electronica',
    applicableSubcategoryIds: ['subcat-elec-audio', 'subcat-elec-bocinas', 'subcat-elec-home-theater'],
    order: 1,
    isFilterable: true
  },
  {
    id: 'spec-audio-power',
    name: 'Potencia RMS',
    key: 'power',
    type: 'text',
    placeholder: 'Ej: 40W RMS, 100W, 800W PartyBox',
    unit: 'Watts',
    categoryId: 'cat-electronica',
    applicableSubcategoryIds: ['subcat-elec-audio', 'subcat-elec-bocinas', 'subcat-elec-home-theater'],
    order: 2,
    isFilterable: true
  },
  {
    id: 'spec-audio-battery',
    name: 'Autonomía de Batería',
    key: 'batteryLife',
    type: 'text',
    placeholder: 'Ej: Hasta 12 Horas de reproducción continua',
    categoryId: 'cat-electronica',
    applicableSubcategoryIds: ['subcat-elec-bocinas'],
    order: 3
  },
  {
    id: 'spec-audio-waterproof',
    name: 'Resistencia al Agua',
    key: 'waterproof',
    type: 'select',
    options: ['IPX7 (Sumergible hasta 1m)', 'IP67 (Agua y Polvo)', 'IPX4 (Salpicaduras)', 'No resistente al agua'],
    categoryId: 'cat-electronica',
    applicableSubcategoryIds: ['subcat-elec-bocinas'],
    order: 4,
    isFilterable: true
  },

  // ==========================================
  // ROBÓTICA → ROBOTS EDUCATIVOS / PROGRAMABLES / KITS
  // ==========================================
  {
    id: 'spec-rob-brand',
    name: 'Marca / Fabricante',
    key: 'brand',
    type: 'select',
    required: true,
    options: ['LEGO Education / Mindstorms', 'Makeblock', 'DJI Robomaster', 'Arduino', 'Raspberry Pi', 'Sphero', 'Elegoo', 'VEX Robotics', 'Pololu', 'SunFounder', 'Otras marcas'],
    categoryId: 'cat-robotica',
    applicableSubcategoryIds: ['subcat-rob-educativos', 'subcat-rob-kits', 'subcat-rob-programables', 'subcat-rob-brazos'],
    order: 1,
    isFilterable: true
  },
  {
    id: 'spec-rob-model',
    name: 'Modelo',
    key: 'model',
    type: 'text',
    required: true,
    placeholder: 'Ej: mBot2, Robomaster S1, SPIKE Prime',
    categoryId: 'cat-robotica',
    order: 2
  },
  {
    id: 'spec-rob-type',
    name: 'Tipo de Robot / Dispositivo',
    key: 'robotType',
    type: 'select',
    required: true,
    options: ['Robot Educativo para STEM', 'Kit de Robótica para Armar', 'Robot Programable Móvil', 'Brazo Robótico Articulado', 'Kit de Sensores y Actuadores', 'Plataforma con Orugas / Ruedas Mecanum'],
    categoryId: 'cat-robotica',
    applicableSubcategoryIds: ['subcat-rob-educativos', 'subcat-rob-kits', 'subcat-rob-programables', 'subcat-rob-brazos'],
    order: 3,
    isFilterable: true
  },
  {
    id: 'spec-rob-age',
    name: 'Edad Recomendada',
    key: 'recommendedAge',
    type: 'select',
    options: ['Niños 6 - 9 años', 'Niños 10 - 13 años', 'Jóvenes 14+ años', 'Estudiantes Universitarios & Makers', 'Profesional / Industrial'],
    categoryId: 'cat-robotica',
    applicableSubcategoryIds: ['subcat-rob-educativos', 'subcat-rob-kits', 'subcat-rob-programables'],
    order: 4,
    isFilterable: true
  },
  {
    id: 'spec-rob-programming',
    name: 'Lenguaje de Programación',
    key: 'programmingLanguage',
    type: 'multiselect',
    options: ['Programación por Bloques (Scratch/Blockly)', 'Python', 'C / C++ (Arduino IDE)', 'MicroPython', 'JavaScript', 'ROS (Robot Operating System)'],
    categoryId: 'cat-robotica',
    applicableSubcategoryIds: ['subcat-rob-educativos', 'subcat-rob-kits', 'subcat-rob-programables', 'subcat-rob-brazos'],
    order: 5,
    isFilterable: true
  },
  {
    id: 'spec-rob-connectivity',
    name: 'Conectividad',
    key: 'connectivity',
    type: 'multiselect',
    options: ['Wi-Fi', 'Bluetooth 5.0', 'USB / Type-C', 'Control Remoto 2.4GHz', 'RF Wireless', 'Ethernet'],
    categoryId: 'cat-robotica',
    order: 6,
    isFilterable: true
  },
  {
    id: 'spec-rob-sensors',
    name: 'Sensores Incluidos',
    key: 'sensors',
    type: 'multiselect',
    options: ['Sensor Ultrasónico (Distancia)', 'Sensor Seguidor de Línea', 'Giroscopio & Acelerómetro', 'Sensor de Luz y Color', 'Sensor de Sonido / Micrófono', 'Cámara con Reconocimiento Visual AI', 'Sensor de Obstáculos Infrarrojo'],
    categoryId: 'cat-robotica',
    applicableSubcategoryIds: ['subcat-rob-educativos', 'subcat-rob-kits', 'subcat-rob-programables', 'subcat-rob-brazos'],
    order: 7
  },
  {
    id: 'spec-rob-power',
    name: 'Alimentación / Batería',
    key: 'powerSource',
    type: 'select',
    options: ['Batería de Litio Recargable con USB', 'Pilas AA / AAA', 'Adaptador de Corriente DC Directo', 'Batería LiPo 7.4V / 11.1V'],
    categoryId: 'cat-robotica',
    order: 8
  },
  {
    id: 'spec-rob-compatibility',
    name: 'Compatibilidad de Plataforma',
    key: 'compatibility',
    type: 'multiselect',
    options: ['Windows PC', 'macOS (Apple)', 'iOS (iPhone / iPad)', 'Android', 'Linux / Raspberry Pi OS', 'Chromebook'],
    categoryId: 'cat-robotica',
    order: 9
  },
  {
    id: 'spec-rob-axes',
    name: 'Número de Ejes / Grados de Libertad',
    key: 'degreesOfFreedom',
    type: 'text',
    placeholder: 'Ej: 4 Ejes (4-DOF), 6 Ejes (6-DOF)',
    categoryId: 'cat-robotica',
    applicableSubcategoryIds: ['subcat-rob-brazos', 'subcat-rob-industriales'],
    order: 10
  },
  {
    id: 'spec-rob-warranty',
    name: 'Garantía',
    key: 'warranty',
    type: 'select',
    options: ['1 Año de Garantía Oficial', '6 Meses de Garantía', '3 Meses de Garantía', '30 Días'],
    categoryId: 'cat-robotica',
    order: 11
  },

  // ==========================================
  // ROBÓTICA → ROBOTS DE LIMPIEZA
  // ==========================================
  {
    id: 'spec-roblim-brand',
    name: 'Marca',
    key: 'brand',
    type: 'select',
    required: true,
    options: ['iRobot Roomba', 'Xiaomi / Roborock', 'Ecovacs Deebot', 'Shark', 'Eufy', 'Dreame', 'Otras marcas'],
    categoryId: 'cat-robotica',
    subcategoryId: 'subcat-rob-limpieza',
    order: 1,
    isFilterable: true
  },
  {
    id: 'spec-roblim-mode',
    name: 'Funciones de Limpieza',
    key: 'cleaningMode',
    type: 'select',
    required: true,
    options: ['Aspirado + Mopa Fregadora 2 en 1', 'Solo Aspirado de Alta Potencia', 'Aspirado + Mopa con Autovaciado en Base'],
    categoryId: 'cat-robotica',
    subcategoryId: 'subcat-rob-limpieza',
    order: 2,
    isFilterable: true
  },
  {
    id: 'spec-roblim-navigation',
    name: 'Sistema de Mapeo y Navegación',
    key: 'navigationSystem',
    type: 'select',
    options: ['Láser LiDAR 360° (Mapeo Inteligente de Habitaciones)', 'Cámara Visual vSLAM', 'Sensores Girosópicoc y Anticaída'],
    categoryId: 'cat-robotica',
    subcategoryId: 'subcat-rob-limpieza',
    order: 3,
    isFilterable: true
  },
  {
    id: 'spec-roblim-battery',
    name: 'Autonomía de Batería',
    key: 'batteryLife',
    type: 'text',
    placeholder: 'Ej: Hasta 180 Minutos con Recarga Automática',
    categoryId: 'cat-robotica',
    subcategoryId: 'subcat-rob-limpieza',
    order: 4
  },

  // ==========================================
  // MODA Y ACCESORIOS
  // ==========================================
  {
    id: 'spec-moda-brand',
    name: 'Marca / Diseñador',
    key: 'brand',
    type: 'text',
    placeholder: 'Ej: Zara, Mango, Nike, Artesanal Dominicano',
    categoryId: 'cat-moda',
    order: 1,
    isFilterable: true
  },
  {
    id: 'spec-moda-size',
    name: 'Talla',
    key: 'size',
    type: 'select',
    options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Única', 'Calzado 36 - 45'],
    categoryId: 'cat-moda',
    order: 2,
    isFilterable: true
  },
  {
    id: 'spec-moda-color',
    name: 'Color Primario',
    key: 'color',
    type: 'text',
    placeholder: 'Ej: Blanco Nieve, Azul Marino, Negro, Terracota',
    categoryId: 'cat-moda',
    order: 3,
    isFilterable: true
  },
  {
    id: 'spec-moda-material',
    name: 'Material / Composición',
    key: 'material',
    type: 'text',
    placeholder: 'Ej: 100% Lino Italiano, Cuero Genuino, Algodón Orgánico',
    categoryId: 'cat-moda',
    order: 4
  },
  {
    id: 'spec-moda-gender',
    name: 'Género',
    key: 'gender',
    type: 'select',
    options: ['Damas / Mujer', 'Caballeros / Hombre', 'Unisex', 'Niños / Niñas'],
    categoryId: 'cat-moda',
    order: 5,
    isFilterable: true
  },
  {
    id: 'spec-moda-condition',
    name: 'Condición',
    key: 'condition',
    type: 'select',
    options: ['Nuevo con etiqueta', 'Nuevo sin etiqueta', 'Excelente estado'],
    categoryId: 'cat-moda',
    order: 6,
    isFilterable: true
  },

  // ==========================================
  // PERFUMES Y FRAGANCIAS
  // ==========================================
  {
    id: 'spec-perf-brand',
    name: 'Casa Perfumista / Marca',
    key: 'brand',
    type: 'select',
    required: true,
    options: ['Chanel', 'Dior', 'Creed', 'Tom Ford', 'Yves Saint Laurent', 'Versace', 'Paco Rabanne', 'Armani', 'Carolina Herrera', 'Jean Paul Gaultier', 'Lattafa / Árabes', 'Otras casas'],
    categoryId: 'cat-perfumes',
    order: 1,
    isFilterable: true
  },
  {
    id: 'spec-perf-concentration',
    name: 'Concentración',
    key: 'concentration',
    type: 'select',
    required: true,
    options: ['Parfum / Extrait de Parfum', 'Eau de Parfum (EDP)', 'Eau de Toilette (EDT)', 'Eau de Cologne (EDC)', 'Body Mist / Bruma'],
    categoryId: 'cat-perfumes',
    order: 2,
    isFilterable: true
  },
  {
    id: 'spec-perf-size',
    name: 'Tamaño / Contenido en ml',
    key: 'bottleSize',
    type: 'select',
    required: true,
    options: ['30 ml (1.0 oz)', '50 ml (1.7 oz)', '100 ml (3.4 oz)', '125 ml (4.2 oz)', '150 ml', '200 ml (6.7 oz)'],
    unit: 'ml',
    categoryId: 'cat-perfumes',
    order: 3,
    isFilterable: true
  },
  {
    id: 'spec-perf-olfactory',
    name: 'Familia Olfativa',
    key: 'olfactoryFamily',
    type: 'select',
    options: ['Amaderada / Woody', 'Cítrica / Fresca', 'Oriental / Especiada', 'Floral', 'Gourmand / Dulce', 'Acuática / Marina', 'Aromática Fougère'],
    categoryId: 'cat-perfumes',
    order: 4,
    isFilterable: true
  },

  // ==========================================
  // ELECTRODOMÉSTICOS
  // ==========================================
  {
    id: 'spec-appl-brand',
    name: 'Marca',
    key: 'brand',
    type: 'select',
    required: true,
    options: ['Whirlpool', 'Samsung', 'LG', 'Frigidaire', 'GE Appliances', 'Mabe', 'Nedoca', 'Black+Decker', 'Oster', 'Ninja', 'Otras marcas'],
    categoryId: 'cat-electrodomesticos',
    order: 1,
    isFilterable: true
  },
  {
    id: 'spec-appl-capacity',
    name: 'Capacidad',
    key: 'capacity',
    type: 'text',
    placeholder: 'Ej: 18 Pies Cúbicos, 20 Kg, 4.5 Litros',
    categoryId: 'cat-electrodomesticos',
    order: 2
  },
  {
    id: 'spec-appl-voltage',
    name: 'Voltaje',
    key: 'voltage',
    type: 'select',
    required: true,
    options: ['110V - 120V (Estándar residencial)', '220V (Para estufas/secadoras eléctricas)', 'Dual 110V/220V'],
    categoryId: 'cat-electrodomesticos',
    order: 3,
    isFilterable: true
  },
  {
    id: 'spec-appl-efficiency',
    name: 'Eficiencia Energética',
    key: 'energyEfficiency',
    type: 'select',
    options: ['Inverter (Ahorro hasta 60% energía)', 'Energy Star Certificado', 'Convencional'],
    categoryId: 'cat-electrodomesticos',
    order: 4,
    isFilterable: true
  },
  {
    id: 'spec-appl-warranty',
    name: 'Garantía en República Dominicana',
    key: 'warranty',
    type: 'select',
    options: ['1 Año de Garantía Completa', '2 Años de Garantía', '10 Años en el Compresor / Motor Inverter', '6 Meses'],
    categoryId: 'cat-electrodomesticos',
    order: 5
  },

  // ==========================================
  // MUEBLES Y DECORACIÓN
  // ==========================================
  {
    id: 'spec-furn-material',
    name: 'Material Principal',
    key: 'material',
    type: 'select',
    options: ['Madera Preciosa (Caoba, Roble, Cedro)', 'Madera Procesada / MDF', 'Metal / Acero Inoxidable', 'Tapizado en Tela Lino/Bouclé', 'Cuero / Eco-Cuero', 'Vidrio Templado'],
    categoryId: 'cat-muebles',
    order: 1,
    isFilterable: true
  },
  {
    id: 'spec-furn-assembly',
    name: 'Requiere Ensamblaje',
    key: 'requiresAssembly',
    type: 'select',
    options: ['No requiere (Viene armado listo)', 'Sí requiere armado fácil', 'Servicio de armado incluido en Santo Domingo/Santiago'],
    categoryId: 'cat-muebles',
    order: 2
  },
  {
    id: 'spec-furn-dimensions',
    name: 'Dimensiones (Ancho x Alto x Profundidad)',
    key: 'dimensions',
    type: 'text',
    placeholder: 'Ej: 180cm x 85cm x 90cm',
    categoryId: 'cat-muebles',
    order: 3
  },

  // ==========================================
  // MASCOTAS
  // ==========================================
  {
    id: 'spec-pet-type',
    name: 'Tipo de Mascota',
    key: 'petType',
    type: 'select',
    required: true,
    options: ['Perros', 'Gatos', 'Aves', 'Peces / Acuario', 'Conejos / Roedores'],
    categoryId: 'cat-mascotas',
    order: 1,
    isFilterable: true
  },
  {
    id: 'spec-pet-size',
    name: 'Tamaño o Raza de Mascota',
    key: 'petSize',
    type: 'select',
    options: ['Todas las razas', 'Raza Pequeña (Toy / Mini)', 'Raza Mediana', 'Raza Grande / Gigante'],
    categoryId: 'cat-mascotas',
    order: 2,
    isFilterable: true
  },
  {
    id: 'spec-pet-weight',
    name: 'Peso / Presentación',
    key: 'weightPresentation',
    type: 'text',
    placeholder: 'Ej: Bolsa de 30 Lbs, 4 Kg, Frasco de 250ml',
    categoryId: 'cat-mascotas',
    order: 3
  },

  // ==========================================
  // VIDEOJUEGOS Y GAMING
  // ==========================================
  {
    id: 'spec-game-platform',
    name: 'Plataforma',
    key: 'platform',
    type: 'select',
    required: true,
    options: ['PlayStation 5', 'PlayStation 4', 'Xbox Series X / S', 'Nintendo Switch', 'PC Gaming', 'Multiplataforma'],
    categoryId: 'cat-gaming',
    order: 1,
    isFilterable: true
  },
  {
    id: 'spec-game-condition',
    name: 'Condición',
    key: 'condition',
    type: 'select',
    options: ['Nuevo Sellado de Fábrica', 'Reacondicionado Certificado', 'Usado en Perfecto Estado'],
    categoryId: 'cat-gaming',
    order: 2,
    isFilterable: true
  }
];
