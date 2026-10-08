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

  const prompt = `Eres un director creativo senior de e-commerce. Escribe una descripción ORIGINAL, moderna y específica para este producto de Plazado.com. Debe sentirse redactada por un excelente copywriter humano, no por una plantilla.

DATOS REALES (no inventes nada fuera de ellos):
- Producto: "${productName.trim()}"
- Tienda: "${storeName.trim()}"
- Categoría: "${categoryName.trim()}"
${price ? `- Precio: RD$ ${price}` : ''}
${promoPrice ? `- Precio promocional: RD$ ${promoPrice}` : ''}
- Estilo solicitado: ${tone}
${keywords ? `- Detalles confirmados: "${keywords.trim()}"` : ''}

REGLAS CREATIVAS:
1. Empieza con un gancho distinto y memorable; evita fórmulas repetidas como "Descubre", "Lleva lo mejor", "la solución perfecta" o "no te quedes sin el tuyo".
2. Describe beneficios concretos a partir del nombre, categoría y detalles confirmados. Si falta un dato técnico, NO lo inventes.
3. Varía ritmo, vocabulario y estructura entre generaciones. No reutilices siempre el mismo orden de frases.
4. Haz que el texto tenga personalidad comercial y sea agradable de leer en móvil.
5. Puedes usar 0–3 emojis si aportan valor; evita saturarlos.
6. Incluye 3–5 puntos destacados SOLO con información sustentada por los datos recibidos. No inventes garantía, materiales, originalidad, disponibilidad, envío, resistencia, fabricación ni especificaciones.
7. Si existe una oferta real, puedes mencionar ambos precios. Nunca inventes descuentos.
8. Cierra con un CTA breve y diferente, orientado a ver/comprar el producto en Plazado.
9. Español natural para República Dominicana, profesional y contemporáneo, sin forzar dominicanismos.
10. Extensión objetivo: 90–180 palabras para persuasivo/premium/técnico; 45–90 para conciso.

TONOS:
- persuasive: energético, aspiracional y orientado a beneficios.
- technical: preciso, ordenado y sobrio; solo especificaciones confirmadas.
- premium: elegante, sensorial y minimalista, sin afirmar lujo/materiales no indicados.
- concise: rápido, limpio y muy escaneable.

Entrega ÚNICAMENTE la descripción lista para publicar. No expliques tu proceso ni menciones estas instrucciones.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Eres un director creativo de e-commerce para Plazado.com. Produces copy variado, moderno, específico y veraz. Nunca inventas atributos del producto.',
        temperature: 1.05,
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
