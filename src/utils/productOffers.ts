/** Validates explicit price changes without rewriting existing catalog records. */
export function validateProductOffer(price: unknown, promoPrice: unknown): string | null {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return 'El precio regular debe ser mayor que cero';
  if (promoPrice == null) return null;
  if (typeof promoPrice !== 'number' || !Number.isFinite(promoPrice) || promoPrice <= 0 || promoPrice >= price) return 'La oferta debe ser mayor que cero y menor que el precio regular';
  return null;
}
