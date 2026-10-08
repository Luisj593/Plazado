import bundle from './documents.json';

export const LEGAL_VERSION = bundle.version;
export const LEGAL_PDF_URL = bundle.pdfUrl;
export function termsPdfUrl(audience: 'CUSTOMER' | 'STORE') {
  return bundle.termsPdfUrls[audience];
}
export function legalDocumentPdfUrl(category: string) {
  if (category === 'customer_terms') return termsPdfUrl('CUSTOMER');
  if (category === 'store_terms') return termsPdfUrl('STORE');
  return LEGAL_PDF_URL;
}
export const LEGAL_DOCUMENTS = bundle.documents;
export type LegalAudience = 'CUSTOMER' | 'STORE';

export function registrationDocuments(audience: LegalAudience) {
  const terms = audience === 'STORE' ? 'store_terms' : 'customer_terms';
  return LEGAL_DOCUMENTS.filter(doc => [terms, 'privacy', 'returns_refunds', 'shipping_procedures'].includes(doc.id));
}

// The server validates this before creating an account or dispatching an OTP.
// A scroll event is a UI prerequisite, not proof that a person understood the text.
export function hasCurrentLegalConsent(data: { acceptedTerms?: unknown; legalVersion?: unknown; legalReadToEnd?: unknown; legalAudience?: unknown }, audience: LegalAudience): boolean {
  return data.acceptedTerms === true && data.legalVersion === LEGAL_VERSION &&
    data.legalReadToEnd === true && data.legalAudience === audience;
}
