import { GoogleGenAI } from '@google/genai';

export interface GenerateDescriptionParams {
  productName: string;
  categoryName?: string;
  storeName?: string;
  price?: number;
  promoPrice?: number;
  tone?: 'persuasive' | 'technical' | 'premium' | 'concise';
  keywords?: string;
}

export interface GeneratedDescriptionResult {
  description: string;
  shortDescription?: string;
  highlights?: string[];
  tags?: string[];
  source: 'gemini' | 'smart_template';
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

/**
 * Advanced fallback generator tailored for Dominican Republic marketplace (PlazaDO.com)
 * Used if Gemini API returns project access limitations (403), quota limits, or offline states.
 */
function generateDomainDescription(params: GenerateDescriptionParams): GeneratedDescriptionResult {
  const { productName, categoryName = 'General', storeName = 'Nuestra Tienda', price, promoPrice, tone = 'persuasive', keywords = '' } = params;
  
  const cleanName = productName.trim();
  const kwList = keywords ? keywords.split(/[,;\n]+/).map(k => k.trim()).filter(Boolean) : [];
  
  let hook = '';
  let body = '';
  let cta = '';
  let bulletPoints: string[] = [];

  switch (tone) {
    case 'technical':
      hook = `Especificaciones y características principales de ${cleanName}:`;
      body = `Diseñado para ofrecer el más alto estándar de durabilidad y rendimiento en la categoría de ${categoryName}. ` +
        `Este artículo cuenta con acabados de primera calidad, garantizando compatibilidad, confiabilidad y satisfacción inmediata. ` +
        (kwList.length > 0 ? `Aspectos destacados: ${kwList.join(', ')}. ` : '') +
        `Ideal para uso continuo y exigente en República Dominicana con soporte directo de ${storeName}.`;
      bulletPoints = [
        `Garantía de calidad oficial respaldada por ${storeName}`,
        `Materiales y componentes testeados para máxima vida útil`,
        kwList[0] ? `Característica clave: ${kwList[0]}` : `Diseño optimizado para alto rendimiento`,
        `Disponibilidad inmediata con despacho garantizado en todo el país`
      ];
      cta = `Adquiérelo ahora con compra protegida y código secreto de entrega en PlazaDO.`;
      break;

    case 'premium':
      hook = `Descubre la elegancia y distinción de ${cleanName}.`;
      body = `Una pieza excepcional seleccionada especialmente por ${storeName} para quienes buscan exclusividad, estilo y confort superior. ` +
        `Cada detalle ha sido confeccionado con estándares exigentes para superar tus expectativas en ${categoryName}. ` +
        (kwList.length > 0 ? `Detalles exclusivos: ${kwList.join(', ')}. ` : '') +
        `Eleva tu experiencia diaria con un producto premium concebido para destacar.`;
      bulletPoints = [
        `Edición selecta disponible a través de ${storeName}`,
        `Acabados refinados y presentación impecable`,
        kwList[0] ? `Detalle exclusivo: ${kwList[0]}` : `Estilo atemporal y confort garantizado`,
        `Compra segura con entrega confiable a domicilio en RD`
      ];
      cta = `Haz tu pedido hoy y disfruta de una experiencia de compra exclusiva en PlazaDO.com.`;
      break;

    case 'concise':
      hook = `${cleanName} — Calidad garantizada.`;
      body = `${cleanName} disponible en ${storeName}. Excelente opción en ${categoryName} con insuperable relación calidad-precio. ` +
        (kwList.length > 0 ? `Incluye: ${kwList.join(', ')}. ` : '') +
        `Listo para entrega rápida a nivel nacional.`;
      bulletPoints = [
        `Excelente relación calidad-precio`,
        `Producto 100% original verificado por ${storeName}`,
        `Despacho ágil en República Dominicana`
      ];
      cta = `Compra de forma rápida y segura en PlazaDO.`;
      break;

    case 'persuasive':
    default:
      hook = `¡Lleva lo mejor con ${cleanName}!`;
      body = `En ${storeName} te presentamos ${cleanName}, la solución perfecta para quienes buscan calidad, practicidad y estilo en ${categoryName}. ` +
        `Diseñado pensando en tus necesidades, este producto destaca por su versatilidad, durabilidad y excelente desempeño. ` +
        (kwList.length > 0 ? `Cuenta con: ${kwList.join(', ')}. ` : '') +
        `Ya sea para ti o para regalar, es la elección ideal que garantiza satisfacción total desde el primer día.`;
      bulletPoints = [
        `Garantía y respaldo directo de ${storeName}`,
        `Calidad comprobada y excelentes acabados`,
        kwList[0] ? `Beneficio destacado: ${kwList[0]}` : `Fácil de usar y altamente resistente`,
        `Entrega rápida y protegida con código de seguridad en PlazaDO`
      ];
      cta = `¡No te quedes sin el tuyo! Añádelo a tu carrito y recíbelo cómodamente en tu puerta.`;
      break;
  }

  const priceNote = (promoPrice && price && promoPrice < price) 
    ? `\n\n🔥 ¡OFERTA ESPECIAL!: Llévatelo por solo RD$ ${promoPrice.toLocaleString()} (Precio regular: RD$ ${price.toLocaleString()}).`
    : '';

  const fullDescription = `${hook}\n\n${body}\n\nCaracterísticas principales:\n${bulletPoints.map(b => `• ${b}`).join('\n')}${priceNote}\n\n${cta}`;

  const tags = [
    cleanName.toLowerCase(),
    categoryName.toLowerCase(),
    storeName.toLowerCase(),
    'republica dominicana',
    'plazado',
    ...kwList.map(k => k.toLowerCase())
  ].slice(0, 6);

  return {
    description: fullDescription,
    shortDescription: `${hook} ${body.substring(0, 140)}...`,
    highlights: bulletPoints,
    tags,
    source: 'smart_template'
  };
}

/**
 * Generates an automated, compelling, professional product description using Gemini AI.
 * Falls back gracefully to intelligent template engine if external API encounters permissions/quota errors.
 */
export async function generateProductDescription(params: GenerateDescriptionParams): Promise<GeneratedDescriptionResult> {
  const { productName, categoryName = 'General', storeName = 'Comercio Asociado', price, promoPrice, tone = 'persuasive', keywords = '' } = params;

  if (!productName || !productName.trim()) {
    throw new Error('El nombre del producto es obligatorio para generar la descripción.');
  }

  const prompt = `Actúa como un experto en redacción de e-commerce y marketing digital para PlazaDO.com, el marketplace multi-vendedor líder de la República Dominicana.
Tu misión es redactar una descripción de producto atractiva, comercial, profesional y convincente en español.

Datos del producto a publicar:
- Nombre: "${productName.trim()}"
- Tienda vendedora: "${storeName.trim()}"
- Categoría: "${categoryName.trim()}"
${price ? `- Precio regular: RD$ ${price}` : ''}
${promoPrice ? `- Precio de oferta: RD$ ${promoPrice}` : ''}
- Tono solicitado: ${tone} (persuasivo para vender, técnico para specs, premium para lujo, conciso para brevedad)
${keywords ? `- Detalles o palabras clave a incluir: "${keywords.trim()}"` : ''}

Requisitos de la descripción:
1. Párrafo inicial con gancho comercial atractivo enfocado en beneficios.
2. Párrafo de desarrollo explicando qué hace especial al producto y por qué comprarlo en esta tienda.
3. Sección de "Características principales" con 3 a 5 viñetas claras (con emojis o viñetas •).
4. Llamado a la acción (Call to Action) invitando a comprar con seguridad en PlazaDO.
5. Lenguaje natural, profesional y adaptado al mercado dominicano sin exceso de modismos.

Devuelve directamente el texto formateado listo para publicar. No agregues saludos ni notas meta.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Eres un redactor profesional de fichas de producto de comercio electrónico para PlazaDO.com en República Dominicana.',
        temperature: 0.7,
      }
    });

    const text = response.text?.trim();
    if (text && text.length > 30) {
      // Extract bullet points if any
      const bulletLines = text.split('\n').filter(l => l.trim().startsWith('•') || l.trim().startsWith('-') || l.trim().startsWith('*')).map(l => l.replace(/^[\s•\-\*]+/, '').trim());
      
      const tags = [
        productName.trim().toLowerCase(),
        categoryName.toLowerCase(),
        storeName.toLowerCase(),
        'plazado'
      ];

      return {
        description: text,
        highlights: bulletLines.length > 0 ? bulletLines.slice(0, 5) : undefined,
        tags,
        source: 'gemini'
      };
    }
  } catch (err: any) {
    console.warn('[Gemini AI] External generateContent not available or denied (' + (err?.message || err) + '). Using intelligent domain generator fallback.');
  }

  // Graceful domain fallback ensures 100% reliability for the store merchant
  return generateDomainDescription(params);
}
