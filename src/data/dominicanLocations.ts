import { DOMINICAN_PROVINCES } from './initialData';

export const DOMINICAN_MUNICIPALITIES_BY_PROVINCE: Record<string, string[]> = {
  'Distrito Nacional': [
    'Santo Domingo de Guzmán (Centro)',
    'Piantini / Naco / Bella Vista',
    'Gazcue / Ciudad Nueva / Zona Colonial',
    'Los Prados / San Gerónimo',
    'Mirador Norte / Mirador Sur',
    'Ensanche Quisqueya / Evaristo Morales',
    'Arroyo Hondo / Los Ríos / Los Jardines',
    'Cristo Rey / Ensanche La Fe'
  ],
  'Santo Domingo': [
    'Santo Domingo Este',
    'Santo Domingo Norte',
    'Santo Domingo Oeste',
    'Boca Chica',
    'Los Alcarrizos',
    'Pedro Brand',
    'San Antonio de Guerra'
  ],
  'Santiago': [
    'Santiago de los Caballeros',
    'Bisonó (Navarrete)',
    'Jánico',
    'Licey al Medio',
    'Puñal',
    'Sabana Iglesia',
    'San José de las Matas',
    'Tamboril',
    'Villa González'
  ],
  'La Vega': [
    'La Vega',
    'Constanza',
    'Jarabacoa',
    'Jima Abajo'
  ],
  'Puerto Plata': [
    'San Felipe de Puerto Plata',
    'Sosúa',
    'Cabarete',
    'Altamira',
    'Guananico',
    'Imbert',
    'Los Hidalgos',
    'Luperón',
    'Villa Isabela',
    'Villa Montellano'
  ],
  'San Cristóbal': [
    'San Cristóbal',
    'Bajos de Haina',
    'Cambita Garabitos',
    'Los Cacaos',
    'Sabana Grande de Palenque',
    'San Gregorio de Nigua',
    'Villa Altagracia',
    'Yaguate'
  ],
  'La Altagracia (Punta Cana / Higüey)': [
    'Higüey',
    'Punta Cana / Bávaro',
    'Cap Cana',
    'Bayahíbe',
    'San Rafael del Yuma'
  ],
  'San Pedro de Macorís': [
    'San Pedro de Macorís',
    'Consuelo',
    'Guayacanes',
    'Quisqueya',
    'Ramón Santana',
    'San José de los Llanos'
  ],
  'La Romana': [
    'La Romana',
    'Guaymate',
    'Villa Hermosa'
  ],
  'Duarte (San Francisco de Macorís)': [
    'San Francisco de Macorís',
    'Arenoso',
    'Castillo',
    'Eugenio María de Hostos',
    'Las Guáranas',
    'Pimentel',
    'Villa Riva'
  ],
  'Espaillat (Moca)': [
    'Moca',
    'Cayetano Germosén',
    'Gaspar Hernández',
    'Jamao al Norte'
  ],
  'Peravia (Baní)': [
    'Baní',
    'Matanzas',
    'Nizao'
  ],
  'Azua': [
    'Azua de Compostela',
    'Estebanía',
    'Guayabal',
    'Las Charcas',
    'Las Yayas de Viajama',
    'Padre Las Casas',
    'Peralta',
    'Pueblo Viejo',
    'Sabana Yegua',
    'Tábara Arriba'
  ],
  'Barahona': [
    'Barahona',
    'Cabral',
    'El Peñón',
    'Enriquillo',
    'Fundación',
    'Jaquimeyes',
    'La Ciénaga',
    'Las Salinas',
    'Paraíso',
    'Polo',
    'Vicente Noble'
  ],
  'Samaná': [
    'Santa Bárbara de Samaná',
    'Las Terrenas',
    'Sánchez'
  ],
  'Monte Plata': [
    'Monte Plata',
    'Bayaguana',
    'Peralvillo',
    'Sabana Grande de Boyá',
    'Yamasá'
  ],
  'Monseñor Nouel (Bonao)': [
    'Bonao',
    'Maimón',
    'Piedra Blanca'
  ],
  'María Trinidad Sánchez': [
    'Nagua',
    'Cabrera',
    'El Factor',
    'Río San Juan'
  ],
  'Sánchez Ramírez': [
    'Cotuí',
    'Cevicos',
    'Fantino',
    'La Mata'
  ],
  'Valverde': [
    'Mao',
    'Esperanza',
    'Laguna Salada'
  ],
  'San Juan': [
    'San Juan de la Maguana',
    'Bohechío',
    'El Cercado',
    'Juan de Herrera',
    'Las Matas de Farfán',
    'Vallejo'
  ]
};

export function getMunicipalitiesForProvince(province: string): string[] {
  return DOMINICAN_MUNICIPALITIES_BY_PROVINCE[province] || [
    'Cabecera Municipal',
    'Zona Urbana',
    'Zona Rural'
  ];
}
